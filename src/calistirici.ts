import * as vscode from 'vscode';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { ChildProcess, spawn } from 'node:child_process';
import { TurkodHatasi, TurkodYorumlayici, CalistirmaSecenekleri, yazdirilabilirMi, turkuiModulAdiMi, modulDosyasiBul } from './calistir';
import { TurkuiPanelYoneticisi } from './turkuiPaneli';
import { PaketSonucu, calismaZamaniOnbellegi, electronKlasoruBul, electronOrtami, guvenliAd, kaynakYedekle, paketle } from './uygulamaPaketleyici';
import { SfxSonucu, tekDosyaOlustur } from './uygulamaSfx';

/**
 * Türkod programlarını VS Code terminalinde çalıştırır ve satır satır hata ayıklamayı yönetir.
 *
 * - Normal çalıştırma gerçek bir terminalde yapılır: program yardımcı bir Node sürecinde çalışır,
 *   çıktı doğrudan terminale yazılır ve program bitince kabuk istemine (ör. `PS D:\proje>`)
 *   dönülür.
 * - Hata ayıklama (satır satır) yorumlayıcıyı uzantı sürecinde çalıştırır; her satırda durur ve
 *   çıktı sahte terminale (pseudoterminal) basılır.
 */
export class TurkodCalistirici implements vscode.Disposable {
  private kanal: vscode.OutputChannel;
  private durum: vscode.StatusBarItem;
  private dugme: vscode.StatusBarItem;
  private abonelikler: vscode.Disposable[] = [];
  private yorumlayici?: TurkodYorumlayici;
  private kanca?: KancaDurumu;
  private turkuiPaneli?: TurkuiPanelYoneticisi;
  private turkuiBitir?: () => void;
  /** Paketlenmiş uygulama (gerçek `.exe`) süreci. */
  private uygulamaSureci?: ChildProcess;
  private terminal?: vscode.Terminal;
  private kabuk?: TurkodTerminali;
  private calisiyor = false;
  private hataGosterildi = false;
  private geciciKlasor = '';
  private izlenenDosyalar: string[] = [];

  constructor(private readonly baglam: vscode.ExtensionContext) {
    this.kanal = vscode.window.createOutputChannel('Türkod');
    this.durum = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.durum.command = 'turkod.durdur';
    // Köşedeki play düğmesi: etkin dosya Türkod olduğunda görünür.
    this.dugme = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.dugme.text = '$(play) Çalıştır';
    this.dugme.tooltip = 'Türkod: Çalıştır (F5)';
    this.dugme.command = 'turkod.calistir';
    this.abonelikler.push(
      this.dugme,
      vscode.window.onDidChangeActiveTextEditor(() => this.dugmeyiGuncelle()),
      vscode.window.onDidChangeVisibleTextEditors(() => this.dugmeyiGuncelle())
    );
    this.dugmeyiGuncelle();
  }

  dispose(): void {
    this.durdur();
    this.izlemeyiBirak();
    this.geciciTemizle();
    this.kabuk?.dispose();
    this.terminal?.dispose();
    this.kanal.dispose();
    this.durum.dispose();
    for (const abonelik of this.abonelikler) abonelik.dispose();
    this.abonelikler = [];
  }

  /** Etkin dosya Türkod ise köşedeki play düğmesini gösterir. */
  private dugmeyiGuncelle(): void {
    if (this.kanca || this.calisiyor) {
      this.dugme.hide();
      return;
    }
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.languageId === 'turkod') this.dugme.show();
    else this.dugme.hide();
  }

  /* ---------------- dışa açık komutlar ---------------- */

  async calistir(): Promise<void> {
    const dosya = await this.aktifDosya();
    if (!dosya) return;
    const belge = await vscode.workspace.openTextDocument(dosya);
    await this.kabuktaCalistir(belge.getText(), dosya);
  }

  async hataAyikla(): Promise<void> {
    const dosya = await this.aktifDosya();
    if (!dosya) return;
    const belge = await vscode.workspace.openTextDocument(dosya);
    await this.calistirMetin(belge.getText(), dosya, 1);
  }

  async imleceKadarCalistir(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'turkod') {
      void vscode.window.showInformationMessage('Önce bir Türkod (.tr) dosyası açın.');
      return;
    }
    const satir = editor.selection.active.line + 1;
    await this.calistirMetin(editor.document.getText(), editor.document.uri, satir);
  }

  async secimiCalistir(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'turkod') return;
    const secim = editor.selection;
    if (secim.isEmpty) {
      void vscode.window.showInformationMessage('Önce çalıştırmak istediğiniz satırları seçin.');
      return;
    }
    // Satır numaraları dosyadakiyle aynı kalsın diye seçimden önceki satırlar boş bırakılır.
    const kaynak = [
      ...new Array<string>(secim.start.line).fill(''),
      editor.document.getText(secim),
    ].join('\n');
    await this.kabuktaCalistir(kaynak, editor.document.uri);
  }

  durdur(): void {
    if (this.uygulamaSureci) {
      const surec = this.uygulamaSureci;
      this.uygulamaSureci = undefined;
      if (surec.pid !== undefined) surecAgaciniOldur(surec.pid);
      try {
        surec.kill();
      } catch {
        /* süreç zaten kapanmış olabilir */
      }
    }
    if (this.kanca) {
      this.kanca.iptal = true;
      this.kanca.bekleyen = undefined;
      this.yorumlayici?.durdur();
      this.kabuk?.durdur();
    }
    if (this.turkuiPaneli) {
      this.turkuiPaneli.dispose();
      this.turkuiPaneli = undefined;
    }
    this.turkuiBitir?.();
    if (this.calisiyor) {
      this.calisiyor = false;
      this.terminal?.dispose();
      this.terminal = undefined;
      this.izlemeyiBirak();
      this.geciciTemizle();
    }
    this.durum.hide();
    this.dugmeyiGuncelle();
    this.kanal.appendLine('Çalıştırma durduruldu.');
  }

  /* ---------------- çalıştırma ---------------- */

  private async calistirMetin(kaynak: string, dosya: vscode.Uri, durmaSatiri?: number): Promise<void> {
    if (this.turkuiIceAktarildiMi(kaynak, dosya)) {
      await this.turkuiCalistir(kaynak, dosya, durmaSatiri);
      return;
    }
    if (!(await this.calismayaHazirMi())) return;
    this.terminaliSifirla();

    const terminal = await this.terminalAc();
    terminal.temizle();
    const hataAyikla = typeof durmaSatiri === 'number';

    const kanca: KancaDurumu = { adimAdimi: false, durmaSatiri, iptal: false };
    this.kanca = kanca;

    const secenekler: CalistirmaSecenekleri = {
      yaz: (metin) => this.yaz(terminal, metin),
      oku: (soru) => terminal.satirOku(soru),
      klasor: path.dirname(dosya.fsPath),
      dosya: dosya.fsPath,
      gercekGecikme: true,
      modulCoz: (ad, kaynakKlasoru) => this.modulCoz(dosya, ad, kaynakKlasoru),
      kanca: {
        satir: async (satirNo) => {
          if (kanca.iptal) throw new TurkodHatasi('Çalıştırma durduruldu.', satirNo);
          const durmali = kanca.durmaSatiri === satirNo || (kanca.adimAdimi && kanca.durmaSatiri === undefined);
          if (!durmali) return;
          kanca.durmaSatiri = undefined;
          const karar = await this.duraklat(dosya, satirNo);
          if (karar === 'durdur') {
            kanca.iptal = true;
            throw new TurkodHatasi('Çalıştırma durduruldu.', satirNo);
          }
          if (karar === 'adim') kanca.adimAdimi = true;
          else kanca.adimAdimi = false;
        },
      },
    };

    this.yorumlayici = new TurkodYorumlayici(kaynak, secenekler);
    this.dugme.hide();
    this.durumGoster(hataAyikla ? '$(debug-continue) Türkod hata ayıklıyor' : '$(sync~spin) Türkod çalışıyor');

    try {
      await this.yorumlayici.calistir();
      this.durum.hide();
    } catch (e) {
      const hata = e instanceof TurkodHatasi ? e : new TurkodHatasi(e instanceof Error ? e.message : String(e));
      const yer = hata.satir ? ` (satır ${hata.satir})` : '';
      terminal.yazSatir(`Hata${yer}: ${hata.message}`, 'kirmizi');
      this.kanal.appendLine(`Hata${yer}: ${hata.message}`);
      this.durum.hide();
      void this.hatayiGoster(dosya, hata);
    } finally {
      this.kanca = undefined;
      this.yorumlayici = undefined;
      this.dugmeyiGuncelle();
    }
  }

  /**
   * TürkUI kullanan programı çalıştırır.
   *
   * Normal çalıştırmada program, VS Code'dan tamamen bağımsız gerçek bir
   * masaüstü uygulamasına (`.exe`) paketlenip başlatılır. Satır satır hata
   * ayıklama uzantı sürecinde yapılır; bu durumda pencereler webview olarak
   * açılır. Electron bulunamazsa eski (uzantı içi) yola dönülür.
   */
  private async turkuiCalistir(kaynak: string, dosya: vscode.Uri, durmaSatiri?: number): Promise<void> {
    if (typeof durmaSatiri !== 'number') {
      const sonuc = await this.uygulamaCalistir(kaynak, dosya);
      if (sonuc !== 'uygulama-yok') return;
      this.kanal.appendLine(
        'Electron çalışma zamanı bulunamadı; program VS Code içinde çalıştırılıyor. ' +
          'Gerçek bir pencere için `türkod yeni modül indir türküi` yazın ' +
          '(veya TürkUI ayarlarından Electron klasörünü seçin).'
      );
    }
    await this.turkuiIcindeCalistir(kaynak, dosya, durmaSatiri);
  }

  /**
   * Programı geçici bir klasöre paketler ve `<Ad>.exe` olarak başlatır.
   * Dönüş değeri `uygulama-yok` ise Electron bulunamamıştır.
   */
  private async uygulamaCalistir(
    kaynak: string,
    dosya: vscode.Uri
  ): Promise<'calisti' | 'vazgec' | 'uygulama-yok'> {
    const electron = electronKlasoruBul(
      vscode.workspace.getConfiguration('turkod').get<string>('electronKlasoru')
    );
    if (!electron) return 'uygulama-yok';
    if (!(await this.calismayaHazirMi())) return 'vazgec';
    this.terminaliSifirla();

    const terminal = await this.terminalAc();
    terminal.temizle();

    const uzanti = this.baglam.extensionUri.fsPath;
    const ad = guvenliAd(path.basename(dosya.fsPath, path.extname(dosya.fsPath)));

    // Yanlışlıkla bozulan bir dosya kaybolmasın: her çalıştırmadan önce kaynak yedeklenir.
    const yedek = kaynakYedekle(path.join(this.baglam.globalStorageUri.fsPath, 'yedek'), ad, kaynak);
    if (yedek) this.kanal.appendLine(`Kaynak yedeklendi: ${yedek}`);

    const onbellek = path.join(this.baglam.globalStorageUri.fsPath, 'calisma-zamani');
    let kaynakKlasoru = electron;
    try {
      kaynakKlasoru = calismaZamaniOnbellegi(electron, onbellek);
    } catch {
      /* önbellek oluşturulamazsa doğrudan dağıtımdan kopyalanır */
    }
    const hedef = path.join(this.uygulamaKlasoru(), `${ad}-${kisaKimlik(dosya.fsPath)}`);

    this.yaz(terminal, 'Uygulama hazırlanıyor...\n');
    let sonuc: PaketSonucu;
    try {
      fs.mkdirSync(hedef, { recursive: true });
      sonuc = paketle({
        kaynakYolu: dosya.fsPath,
        kaynakMetni: kaynak,
        ciktiKlasoru: hedef,
        uygulamaAdi: ad,
        electronKlasoru: kaynakKlasoru,
        calistirmaKlasoru: path.join(uzanti, 'runtime', 'uygulama'),
        medyaDosyasi: path.join(uzanti, 'media', 'turkui-window.html'),
        calistirJs: path.join(uzanti, 'out', 'calistir.js'),
        turkuiJs: path.join(uzanti, 'out', 'turkui.js'),
        kaynakKopyala: false,
      });
    } catch (e) {
      const mesaj = e instanceof Error ? e.message : String(e);
      terminal.yazSatir(`Uygulama paketlenemedi: ${mesaj}`, 'kirmizi');
      this.kanal.appendLine(`Uygulama paketlenemedi: ${mesaj}`);
      void vscode.window.showErrorMessage(`Türkod: uygulama paketlenemedi — ${mesaj}`);
      return 'calisti';
    }

    terminal.yaz(`\u001b[2m${sonuc.exeYolu}\u001b[0m\r\n`);

    let surec: ChildProcess;
    const gunluk = this.uygulamaGunlugu();
    try {
      surec = spawn(sonuc.exeYolu, ['--no-sandbox'], {
        cwd: path.dirname(dosya.fsPath),
        env: {
          ...electronOrtami(),
          TURKOD_KAYNAK: sonuc.kaynakYolu,
          TURKOD_GIRIS: dosya.fsPath,
          TURKOD_KLASOR: path.dirname(dosya.fsPath),
          ...(gunluk ? { TURKOD_DEBUG: gunluk } : {}),
        },
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: false,
      });
    } catch (e) {
      const mesaj = e instanceof Error ? e.message : String(e);
      terminal.yazSatir(`Uygulama başlatılamadı: ${mesaj}`, 'kirmizi');
      this.kanal.appendLine(`Uygulama başlatılamadı: ${mesaj}`);
      return 'calisti';
    }

    this.uygulamaSureci = surec;
    this.calisiyor = true;
    this.dugme.hide();
    this.durumGoster('$(window) Türkod uygulaması çalışıyor');

    surec.stdout?.setEncoding('utf8');
    surec.stdout?.on('data', (parca: string) => this.yaz(terminal, parca));
    surec.stderr?.setEncoding('utf8');
    // Electron/Chromium günlükleri terminali kirletmesin; yalnızca çıktı kanalına yazılır.
    surec.stderr?.on('data', (parca: string) => this.kanal.append(parca));

    surec.on('error', (e) => {
      terminal.yazSatir(`Uygulama hatası: ${e.message}`, 'kirmizi');
      this.kanal.appendLine(`Uygulama hatası: ${e.message}`);
    });

    surec.on('exit', (kod, sinyal) => {
      if (this.uygulamaSureci === surec) this.uygulamaSureci = undefined;
      this.calisiyor = false;
      this.durum.hide();
      this.dugmeyiGuncelle();
      if (kod !== 0 && kod !== null) {
        terminal.yazSatir(`Uygulama kapandı (çıkış kodu ${kod}).`, 'kirmizi');
        this.kanal.appendLine(`Uygulama kapandı: kod=${kod} sinyal=${sinyal ?? '-'}`);
      } else {
        this.kanal.appendLine('Uygulama kapandı.');
      }
    });

    return 'calisti';
  }

  /**
   * Paketlenmiş uygulamanın hata ayıklama günlüğü.
   *
   * Uygulama beklenmedik şekilde kapanırsa sebebi bu dosyada görülür.
   * Günlük 512 KB'ı aşarsa sıfırlanır ki son çalıştırma okunabilsin.
   */
  private uygulamaGunlugu(): string | undefined {
    try {
      const klasor = path.join(this.baglam.globalStorageUri.fsPath, 'loglar');
      fs.mkdirSync(klasor, { recursive: true });
      const dosya = path.join(klasor, 'uygulama.log');
      try {
        if (fs.statSync(dosya).size > 512 * 1024) fs.rmSync(dosya, { force: true });
      } catch {
        /* dosya yoksa sorun değil */
      }
      return dosya;
    } catch {
      return undefined;
    }
  }

  /** Paketlenmiş uygulamaların tutulduğu klasör (ilk kullanımda oluşturulur). */
  private uygulamaKlasoru(): string {
    const kok = path.join(this.baglam.globalStorageUri.fsPath, 'uygulamalar');
    try {
      fs.mkdirSync(kok, { recursive: true });
    } catch {
      /* izin yoksa paketleme kendi hatasını verir */
    }
    return kok;
  }

  /**
   * TürkUI kullanan programı uzantı sürecinde çalıştırır (hata ayıklama / yedek yol).
   *
   * Pencereler VS Code webview panelleri olarak açılır. Ana program bitse bile
   * açık pencere kaldığı sürece yorumlayıcı yaşamaya devam eder; böylece düğme
   * tıklamaları gibi olaylar çalışır. Son pencere kapanınca (veya `durdur`
   * çağrılınca) temizlik yapılır.
   */
  private async turkuiIcindeCalistir(kaynak: string, dosya: vscode.Uri, durmaSatiri?: number): Promise<void> {
    if (!(await this.calismayaHazirMi())) return;
    this.terminaliSifirla();

    const terminal = await this.terminalAc();
    terminal.temizle();
    const hataAyikla = typeof durmaSatiri === 'number';
    const kanca: KancaDurumu = { adimAdimi: false, durmaSatiri, iptal: false };
    this.kanca = kanca;

    let programBitti = false;
    let bitisVerildi = false;
    let bitir!: () => void;
    const bekleme = new Promise<void>((coz) => {
      bitir = () => {
        if (bitisVerildi) return;
        bitisVerildi = true;
        coz();
      };
    });

    const olayCalistir = async (
      kimlik: string,
      olay: string,
      ozellikler?: Record<string, unknown>
    ): Promise<void> => {
      const calisan = this.yorumlayici;
      if (!calisan) return;
      try {
        await calisan.turkuiOlayTetikle(kimlik, olay, ozellikler);
      } catch (e) {
        if (kanca.iptal) return;
        const hata = e instanceof TurkodHatasi ? e : new TurkodHatasi(e instanceof Error ? e.message : String(e));
        const yer = hata.satir ? ` (satır ${hata.satir})` : '';
        terminal.yazSatir(`Hata${yer}: ${hata.message}`, 'kirmizi');
        this.kanal.appendLine(`TürkUI olay hatası${yer}: ${hata.message}`);
      }
    };

    const panel = new TurkuiPanelYoneticisi({
      extensionUri: this.baglam.extensionUri,
      baseDir: path.dirname(dosya.fsPath),
      olay: (bilesenId, olay, ozellikler) => olayCalistir(bilesenId, olay, ozellikler),
      pencereOlayi: (pencereId, olay) => olayCalistir(pencereId, olay),
      pencereKomutu: (pencereId, komut) => this.yorumlayici?.pencereKomutu(pencereId, komut),
      hata: (mesaj) => {
        terminal.yazSatir(mesaj, 'kirmizi');
        this.kanal.appendLine(mesaj);
      },
      degisti: () => {
        if (programBitti && (this.turkuiPaneli?.acikPencereSayisi ?? 0) === 0) bitir();
      },
    });
    this.turkuiPaneli = panel;
    this.turkuiBitir = bitir;

    const secenekler: CalistirmaSecenekleri = {
      yaz: (metin) => this.yaz(terminal, metin),
      oku: (soru) => terminal.satirOku(soru),
      klasor: path.dirname(dosya.fsPath),
      dosya: dosya.fsPath,
      gercekGecikme: true,
      modulCoz: (ad, kaynakKlasoru) => this.modulCoz(dosya, ad, kaynakKlasoru),
      turkui: panel.modulOlustur(),
      kanca: {
        satir: async (satirNo) => {
          if (kanca.iptal) throw new TurkodHatasi('Çalıştırma durduruldu.', satirNo);
          const durmali = kanca.durmaSatiri === satirNo || (kanca.adimAdimi && kanca.durmaSatiri === undefined);
          if (!durmali) return;
          kanca.durmaSatiri = undefined;
          const karar = await this.duraklat(dosya, satirNo);
          if (karar === 'durdur') {
            kanca.iptal = true;
            throw new TurkodHatasi('Çalıştırma durduruldu.', satirNo);
          }
          if (karar === 'adim') kanca.adimAdimi = true;
          else kanca.adimAdimi = false;
        },
      },
    };

    const yorumlayici = new TurkodYorumlayici(kaynak, secenekler);
    this.yorumlayici = yorumlayici;
    this.dugme.hide();
    this.durumGoster(hataAyikla ? '$(debug-continue) Türkod hata ayıklıyor' : '$(sync~spin) Türkod çalışıyor');

    try {
      await yorumlayici.calistir();
      programBitti = true;
      if (panel.acikPencereSayisi === 0) {
        bitir();
      } else {
        this.durumGoster('$(window) TürkUI açık');
      }
      await bekleme;
    } catch (e) {
      programBitti = true;
      bitir();
      if (!kanca.iptal) {
        const hata = e instanceof TurkodHatasi ? e : new TurkodHatasi(e instanceof Error ? e.message : String(e));
        const yer = hata.satir ? ` (satır ${hata.satir})` : '';
        terminal.yazSatir(`Hata${yer}: ${hata.message}`, 'kirmizi');
        this.kanal.appendLine(`Hata${yer}: ${hata.message}`);
        void this.hatayiGoster(dosya, hata);
      }
    } finally {
      if (this.turkuiPaneli === panel) this.turkuiPaneli = undefined;
      if (this.turkuiBitir === bitir) this.turkuiBitir = undefined;
      panel.dispose();
      if (this.kanca === kanca) this.kanca = undefined;
      if (this.yorumlayici === yorumlayici) {
        this.yorumlayici = undefined;
        this.durum.hide();
        this.dugmeyiGuncelle();
      }
    }
  }

  /**
   * Kaynakta doğrudan veya içe aktarılan bir modülde `içe_aktar TürkUI` var mı?
   * Yorumlar yok sayılır; döngüsel importlar için dosyalar bir kez taranır.
   */
  private turkuiIceAktarildiMi(kaynak: string, dosya?: vscode.Uri, gorulen = new Set<string>()): boolean {
    const iceAktarilanlar: string[] = [];
    for (const ham of kaynak.split(/\r?\n/)) {
      let satir = ham;
      let metinde = false;
      for (let i = 0; i < satir.length; i++) {
        const c = satir[i];
        if (c === '"') metinde = !metinde;
        else if (c === '#' && !metinde) {
          satir = satir.slice(0, i);
          break;
        }
      }
      const ice = /^\s*içe_aktar\s+([A-Za-z_ğüşıöçĞÜŞİÖÇ][\wğüşıöçĞÜŞİÖÇ]*)\s*$/.exec(satir);
      if (!ice) continue;
      if (turkuiModulAdiMi(ice[1])) return true;
      iceAktarilanlar.push(ice[1]);
    }

    if (!dosya || iceAktarilanlar.length === 0) return false;
    const anahtar = dosya.fsPath.toLowerCase();
    if (gorulen.has(anahtar)) return false;
    gorulen.add(anahtar);

    for (const ad of iceAktarilanlar) {
      const yol = this.modulCoz(dosya, ad);
      if (!yol) continue;
      try {
        const alt = fs.readFileSync(yol, 'utf8');
        if (this.turkuiIceAktarildiMi(alt, vscode.Uri.file(yol), gorulen)) return true;
      } catch {
        /* okunamayan modül yok sayılır */
      }
    }
    return false;
  }

  /* ---------------- paketleme ---------------- */

  /**
   * Etkin TürkUI programını paylaşılabilir bir uygulamaya paketler.
   *
   * İki biçim sunulur:
   * - **Tek dosya:** her şey tek bir `.exe` içine gömülür (dağıtım için önerilir).
   * - **Klasör:** `<Ad>.exe` + Electron çalışma zamanı + `resources/app`.
   */
  async uygulamaPaketle(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'turkod') {
      void vscode.window.showInformationMessage('Önce bir Türkod dosyası açın.');
      return;
    }
    const dosya = editor.document.uri;
    if (dosya.scheme !== 'file') {
      void vscode.window.showInformationMessage('Uygulama paketlemek için dosyayı diskte kaydedin.');
      return;
    }

    const electron = electronKlasoruBul(
      vscode.workspace.getConfiguration('turkod').get<string>('electronKlasoru')
    );
    if (!electron) {
      void vscode.window.showErrorMessage(
        'Electron çalışma zamanı bulunamadı. ' +
          'Terminalde `türkod yeni modül indir türküi` yazarak indirebilir veya ' +
          '"turkod.electronKlasoru" ayarını TURKOD Studio içindeki node_modules/electron/dist klasörüne ayarlayabilirsiniz.'
      );
      return;
    }

    const varsayilanAd = guvenliAd(path.basename(dosya.fsPath, path.extname(dosya.fsPath)));
    const ad = await vscode.window.showInputBox({
      title: 'Türkod: Uygulama Olarak Paketle',
      prompt: 'Uygulamanın adı (`.exe` dosyasının adı olur)',
      value: varsayilanAd,
      validateInput: (deger) => {
        const temiz = guvenliAd(deger);
        if (temiz !== deger.trim()) return 'Dosya adında kullanılamayan karakter var.';
        return undefined;
      },
    });
    if (!ad) return;

    const bicim = await vscode.window.showQuickPick<
      vscode.QuickPickItem & { bicim: 'tek' | 'klasor' }
    >(
      [
        {
          label: '$(file-zip) Tek dosya (.exe)',
          description: 'Tüm çalışma zamanı tek .exe içine gömülür — dağıtım için önerilir',
          bicim: 'tek',
        },
        {
          label: '$(folder) Klasör',
          description: 'Electron çalışma zamanı ayrı dosyalar hâlinde kalır',
          bicim: 'klasor',
        },
      ],
      { title: 'Türkod: Paketleme Biçimi', placeHolder: 'Uygulama nasıl dağıtılsın?' }
    );
    if (!bicim) return;
    const tekDosya = bicim.bicim === 'tek';

    const hedefKlasor = await vscode.window.showOpenDialog({
      title: tekDosya
        ? 'Tek .exe dosyasının kaydedileceği klasörü seçin'
        : 'Uygulamanın oluşturulacağı klasörü seçin',
      openLabel: 'Bu klasöre paketle',
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      defaultUri: vscode.Uri.file(path.dirname(dosya.fsPath)),
    });
    if (!hedefKlasor || hedefKlasor.length === 0) return;

    const uygulamaAdi = guvenliAd(ad);
    const hedef = hedefKlasor[0].fsPath;
    const exeYolu = path.join(hedef, `${uygulamaAdi}.exe`);
    // Tek dosyada asıl çıktı .exe'dir; çalışma zamanı geçici bir derleme klasöründe hazırlanır.
    const cikti = tekDosya ? path.join(derlemeKlasoru(), uygulamaAdi) : path.join(hedef, uygulamaAdi);
    const uzanti = this.baglam.extensionUri.fsPath;

    if (tekDosya && fs.existsSync(exeYolu)) {
      const uzerine = await vscode.window.showWarningMessage(
        `${path.basename(exeYolu)} zaten var. Üzerine yazılsın mı?`,
        { modal: true },
        'Üzerine yaz'
      );
      if (uzerine !== 'Üzerine yaz') return;
    }

    let sonuc: PaketSonucu;
    let tekDosyaSonucu: SfxSonucu | undefined;
    try {
      sonuc = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Türkod: ${ad} paketleniyor`,
          cancellable: false,
        },
        async (ilerleme) => {
          ilerleme.report({ message: 'Çalışma zamanı hazırlanıyor (ilk paketlemede birkaç saniye sürer)...' });
          const paket = paketle({
            kaynakYolu: dosya.fsPath,
            kaynakMetni: editor.document.getText(),
            ciktiKlasoru: cikti,
            uygulamaAdi,
            electronKlasoru: electron,
            calistirmaKlasoru: path.join(uzanti, 'runtime', 'uygulama'),
            medyaDosyasi: path.join(uzanti, 'media', 'turkui-window.html'),
            calistirJs: path.join(uzanti, 'out', 'calistir.js'),
            turkuiJs: path.join(uzanti, 'out', 'turkui.js'),
            kaynakKopyala: true,
            // Tek dosyada derleme klasörü yeniden kullanılır; çalışma zamanı her seferinde kopyalanmaz.
            tamKopyala: !tekDosya,
          });
          if (!tekDosya) {
            ilerleme.report({ message: 'Tamamlandı.' });
            return paket;
          }

          ilerleme.report({ message: 'Tek dosya oluşturuluyor (uygulama sıkıştırılıyor)...' });
          tekDosyaSonucu = await tekDosyaOlustur({
            klasor: paket.klasor,
            exeYolu,
            baslaticiYolu: path.join(uzanti, 'runtime', 'baslatici', 'baslatici.exe'),
            ilerleme: (mesaj, oran) =>
              ilerleme.report({
                message: oran === undefined ? mesaj : `${mesaj} (%${Math.round(oran * 100)})`,
              }),
          });
          ilerleme.report({ message: 'Tamamlandı.' });
          return paket;
        }
      );
    } catch (e) {
      const mesaj = e instanceof Error ? e.message : String(e);
      this.kanal.appendLine(`Paketleme hatası: ${mesaj}`);
      void vscode.window.showErrorMessage(`Türkod: paketleme başarısız — ${mesaj}`);
      return;
    }

    const calistirilacak = tekDosyaSonucu?.exeYolu ?? sonuc.exeYolu;
    const megabayt = tekDosyaSonucu ? tekDosyaSonucu.boyut / (1024 * 1024) : 0;
    this.kanal.appendLine(`Uygulama paketlendi: ${calistirilacak}`);
    if (tekDosyaSonucu) {
      this.kanal.appendLine(
        `Tek dosya: ${megabayt.toFixed(1)} MB, ${tekDosyaSonucu.dosyaSayisi} dosya`
      );
    }

    const secim = await vscode.window.showInformationMessage(
      tekDosyaSonucu
        ? `${path.basename(calistirilacak)} hazır (${megabayt.toFixed(1)} MB).`
        : `${path.basename(calistirilacak)} hazır: ${sonuc.klasor}`,
      'Çalıştır',
      'Klasörü Aç'
    );
    if (secim === 'Çalıştır') {
      try {
        spawn(calistirilacak, [], {
          cwd: path.dirname(calistirilacak),
          detached: true,
          stdio: 'ignore',
          env: electronOrtami(),
        }).unref();
      } catch (e) {
        void vscode.window.showErrorMessage(
          `Uygulama başlatılamadı: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    } else if (secim === 'Klasörü Aç') {
      void vscode.env.openExternal(vscode.Uri.file(path.dirname(calistirilacak)));
    }
  }

  /* ---------------- terminalde çalıştırma ---------------- */

  /** Çalışan bir program varsa kullanıcıya sorar; devam edilecekse `true` döner. */
  private async calismayaHazirMi(): Promise<boolean> {
    if (!this.kanca && !this.calisiyor) return true;
    const secim = await vscode.window.showWarningMessage(
      'Bir Türkod programı hâlâ çalışıyor. Durdurup yeniden başlatayım mı?',
      'Durdur ve çalıştır',
      'Vazgeç'
    );
    if (secim !== 'Durdur ve çalıştır') return false;
    this.durdur();
    return true;
  }

  /** Önceki çalıştırmadan kalan terminali, izleyicileri ve geçici dosyaları kapatır. */
  private terminaliSifirla(): void {
    this.izlemeyiBirak();
    this.geciciTemizle();
    if (this.kabuk) {
      this.kabuk.dispose();
      this.kabuk = undefined;
    }
    if (this.terminal) {
      this.terminal.dispose();
      this.terminal = undefined;
    }
    this.calisiyor = false;
    this.hataGosterildi = false;
  }

  /**
   * Programı gerçek bir terminalde çalıştırır: yardımcı Node süreci çıktıyı doğrudan terminale
   * yazar, program bitince terminalde kabuk istemi görünür ve terminal kullanılabilir kalır.
   */
  private async kabuktaCalistir(kaynak: string, dosya: vscode.Uri): Promise<void> {
    if (this.turkuiIceAktarildiMi(kaynak, dosya)) {
      await this.turkuiCalistir(kaynak, dosya);
      return;
    }
    if (!(await this.calismayaHazirMi())) return;

    const node = this.nodeYolu();
    if (!node) {
      // Node yoksa eski (uzantı içi) çalıştırma yoluna dön.
      await this.calistirMetin(kaynak, dosya);
      return;
    }

    const klasor = path.dirname(dosya.fsPath);
    const betik = path.join(__dirname, 'terminalCalistirici.js');
    const gecici = fs.mkdtempSync(path.join(os.tmpdir(), 'turkod-'));
    const kaynakDosyasi = path.join(gecici, 'program.tr');
    const hataDosyasi = path.join(gecici, 'hata.json');
    const bittiDosyasi = path.join(gecici, 'bitti');

    this.terminaliSifirla();
    fs.writeFileSync(kaynakDosyasi, kaynak, 'utf8');
    this.geciciKlasor = gecici;
    this.baslaticiBetigiYaz(gecici);

    const terminal = vscode.window.createTerminal({
      name: 'Türkod',
      shellPath: vscode.env.shell,
      shellArgs: this.kabukArgumanlari(),
      cwd: klasor,
      env: {
        PATH: `${gecici}${path.delimiter}${process.env.PATH ?? ''}`,
        TURKOD_NODE: node,
        TURKOD_BETIK: betik,
        TURKOD_KAYNAK: kaynakDosyasi,
        TURKOD_KLASOR: klasor,
        TURKOD_HATA: hataDosyasi,
        TURKOD_BITTI: bittiDosyasi,
      },
      iconPath: new vscode.ThemeIcon('play'),
    });
    this.terminal = terminal;
    this.calisiyor = true;
    this.dugme.hide();
    terminal.show(false);
    this.durumGoster('$(sync~spin) Türkod çalışıyor');
    // Kabuk istemine `turkod` yazılır; böylece program bitince terminalde yeni istem görünür.
    setTimeout(() => {
      if (this.terminal !== terminal) return;
      terminal.sendText('turkod', true);
    }, 500);

    this.izle(hataDosyasi, () => {
      if (this.hataGosterildi) return;
      this.hataGosterildi = true;
      try {
        const veri = JSON.parse(fs.readFileSync(hataDosyasi, 'utf8')) as { mesaj: string; satir: number | null };
        void this.hatayiGoster(dosya, new TurkodHatasi(veri.mesaj, veri.satir ?? undefined));
      } catch {
        /* dosya henüz yazılmadıysa yok say */
      }
    });
    this.izle(bittiDosyasi, () => {
      this.calisiyor = false;
      this.durum.hide();
      this.dugmeyiGuncelle();
      const kapatilacak = this.geciciKlasor;
      setTimeout(() => {
        if (this.geciciKlasor !== kapatilacak) return;
        this.izlemeyiBirak();
        this.geciciTemizle();
      }, 1500);
    });
  }

  /** Node çalıştırıcısını arar; bulunamazsa VS Code'un Node modu kullanılır. */
  private nodeYolu(): string | undefined {
    const ad = process.platform === 'win32' ? 'node.exe' : 'node';
    for (const klasor of (process.env.PATH ?? '').split(path.delimiter)) {
      if (!klasor) continue;
      const aday = path.join(klasor, ad);
      try {
        if (fs.statSync(aday).isFile()) return aday;
      } catch {
        /* yok say */
      }
    }
    return undefined;
  }

  /** Kabuğun başlangıç argümanları. */
  private kabukArgumanlari(): string[] {
    const kabuk = vscode.env.shell;
    if (/(^|[\\/])(pwsh|powershell)(\.exe)?$/i.test(kabuk)) return ['-NoLogo', '-NoProfile'];
    if (/(^|[\\/])cmd\.exe$/i.test(kabuk)) return ['/Q'];
    if (/(^|[\\/])(bash|zsh|sh|fish)$/i.test(kabuk)) return ['--norc', '--noprofile'];
    return [];
  }

  /**
   * Geçici klasöre, programı başlatan `turkod` betiğini yazar.
   *
   * Betik yalnızca ASCII karakter içerir; Türkçe karakterli yollar ortam değişkenleriyle geçilir,
   * böylece cmd.exe'nin kod sayfası sorun çıkarmaz.
   */
  private baslaticiBetigiYaz(klasor: string): void {
    if (process.platform === 'win32') {
      const cmd = [
        '@echo off',
        'chcp 65001 >nul',
        'set "ELECTRON_RUN_AS_NODE=1"',
        '"%TURKOD_NODE%" "%TURKOD_BETIK%" "%TURKOD_KAYNAK%" "%TURKOD_KLASOR%" "%TURKOD_HATA%" "%TURKOD_BITTI%"',
        'set "ELECTRON_RUN_AS_NODE="',
      ].join('\r\n');
      fs.writeFileSync(path.join(klasor, 'turkod.cmd'), `${cmd}\r\n`, 'ascii');
      return;
    }
    const sh = [
      '#!/bin/sh',
      'export ELECTRON_RUN_AS_NODE=1',
      '"$TURKOD_NODE" "$TURKOD_BETIK" "$TURKOD_KAYNAK" "$TURKOD_KLASOR" "$TURKOD_HATA" "$TURKOD_BITTI"',
      'exit $?',
    ].join('\n');
    fs.writeFileSync(path.join(klasor, 'turkod'), `${sh}\n`, { encoding: 'ascii', mode: 0o755 });
  }

  private izle(dosya: string, geriCagri: () => void): void {
    this.izlenenDosyalar.push(dosya);
    fs.watchFile(dosya, { interval: 150 }, (simdiki) => {
      if (simdiki.mtimeMs !== 0) geriCagri();
    });
  }

  private izlemeyiBirak(): void {
    for (const dosya of this.izlenenDosyalar) fs.unwatchFile(dosya);
    this.izlenenDosyalar = [];
  }

  private geciciTemizle(): void {
    if (!this.geciciKlasor) return;
    try {
      fs.rmSync(this.geciciKlasor, { recursive: true, force: true });
    } catch {
      /* yok say */
    }
    this.geciciKlasor = '';
  }

  /* ---------------- sahte terminal (hata ayıklama) ---------------- */

  /** Türkod terminalini açar; varsa yeniden kullanır ve terminal hazır olana kadar bekler. */
  private async terminalAc(): Promise<TurkodTerminali> {
    if (!this.terminal || !this.kabuk || this.kabuk.kapanmis) {
      const kabuk = new TurkodTerminali();
      this.terminal = vscode.window.createTerminal({
        name: 'Türkod',
        pty: kabuk,
        iconPath: new vscode.ThemeIcon('play'),
      });
      this.kabuk = kabuk;
    }
    this.terminal.show(false);
    await this.kabuk.hazir();
    return this.kabuk;
  }

  private yaz(terminal: TurkodTerminali, metin: string): void {
    this.kanal.append(metin);
    terminal.yaz(metin);
  }

  private async hatayiGoster(dosya: vscode.Uri, hata: TurkodHatasi): Promise<void> {
    const secim = await vscode.window.showErrorMessage(
      `Türkod: ${hata.message}${hata.satir ? ` (satır ${hata.satir})` : ''}`,
      'Satıra git',
      'Terminali göster'
    );
    if (secim === 'Satıra git' && hata.satir) await this.satiraGit(dosya, hata.satir);
    else if (secim === 'Terminali göster') {
      if (this.terminal) this.terminal.show(true);
      else this.kanal.show(true);
    }
  }

  private async satiraGit(dosya: vscode.Uri, satir: number): Promise<void> {
    const belge = await vscode.workspace.openTextDocument(dosya);
    const editor = await vscode.window.showTextDocument(belge);
    const konum = new vscode.Position(Math.max(0, satir - 1), 0);
    editor.selection = new vscode.Selection(konum, konum);
    editor.revealRange(new vscode.Range(konum, konum), vscode.TextEditorRevealType.InCenter);
  }

  /* ---------------- hata ayıklama ---------------- */

  private async duraklat(dosya: vscode.Uri, satir: number): Promise<'devam' | 'adim' | 'durdur'> {
    await this.satiraGit(dosya, satir);
    this.durumGoster(`$(debug-pause) Türkod: satır ${satir}`);
    this.kanal.appendLine(`Duraklatıldı: satır ${satir}`);
    const degiskenler = this.yorumlayici?.kureselDegiskenler();
    if (degiskenler && degiskenler.size > 0) {
      this.kanal.appendLine('Değişkenler:');
      for (const [ad, deger] of degiskenler) this.kanal.appendLine(`  ${ad} = ${yazdirilabilirMi(deger)}`);
    }

    const secim = await vscode.window.showInformationMessage(
      `Türkod hata ayıklama · satır ${satir}`,
      'Devam',
      'Sonraki satır',
      'Durdur'
    );
    if (secim === 'Devam') return 'devam';
    if (secim === 'Sonraki satır') return 'adim';
    return 'durdur';
  }

  private durumGoster(metin: string): void {
    this.durum.text = metin;
    this.durum.tooltip = 'Durdurmak için tıklayın';
    this.durum.show();
  }

  /* ---------------- yardımcılar ---------------- */

  private async aktifDosya(): Promise<vscode.Uri | undefined> {
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.languageId === 'turkod') {
      if (editor.document.isDirty && !editor.document.isUntitled) await editor.document.save();
      return editor.document.uri;
    }
    const dosyalar = await vscode.workspace.findFiles('**/*.tr', '**/node_modules/**', 1);
    if (dosyalar.length > 0) return dosyalar[0];
    void vscode.window.showInformationMessage('Çalıştırmak için bir Türkod (.tr) dosyası açın.');
    return undefined;
  }

  private modulCoz(dosya: vscode.Uri, ad: string, klasor?: string): string | undefined {
    return modulDosyasiBul(ad, klasor || path.dirname(dosya.fsPath));
  }
}

interface KancaDurumu {
  adimAdimi: boolean;
  durmaSatiri?: number;
  iptal: boolean;
  bekleyen?: () => void;
}

/** Windows'ta bir süreci alt süreçleriyle birlikte sonlandırır. */
function surecAgaciniOldur(pid: number): void {
  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      }).on('error', () => undefined);
    } else {
      process.kill(-pid, 'SIGKILL');
    }
  } catch {
    /* süreç zaten kapanmış olabilir */
  }
}

/** Dosya yolundan kısa, kararlı bir kimlik üretir (uygulama klasörü adı için). */
function kisaKimlik(deger: string): string {
  return crypto.createHash('sha1').update(deger.toLowerCase()).digest('hex').slice(0, 8);
}

/**
 * Tek dosya paketlenirken kullanılan geçici derleme klasörü.
 *
 * Uygulama klasörü her paketlemede yeniden oluşturulmaz; çalışma zamanı
 * (yüzlerce MB) burada bir kez hazırlanır ve tekrar kullanılır.
 */
function derlemeKlasoru(): string {
  const taban = process.env.LOCALAPPDATA || process.env.XDG_CACHE_HOME || os.tmpdir();
  return path.join(taban, 'turkod', 'derleme');
}

/**
 * Terminalde kabuk çalıştırmayan sahte terminal.
 *
 * Programın çıktısı doğrudan buraya yazılır; böylece terminalde `Write-Host ...` gibi komutlar
 * görünmez, yalnızca programın ürettiği metin görünür. Klavyeden yazılanlar satır sonunda
 * `oku` / `iste` çağrısına iletilir.
 */
class TurkodTerminali implements vscode.Pseudoterminal, vscode.Disposable {
  private yazici = new vscode.EventEmitter<string>();
  private kapanis = new vscode.EventEmitter<void>();
  private tampon = '';
  private hazirSatirlar: string[] = [];
  private bekleyen?: (satir: string) => void;
  private sonKarakter = '';
  private kapandi = false;
  private acildi = false;
  private birikenCikti = '';
  private acilisBekleyenler: Array<() => void> = [];
  iptal = false;

  readonly onDidWrite = this.yazici.event;
  readonly onDidClose = this.kapanis.event;

  /**
   * VS Code terminali hazır olduğunda çağırır. Bu ana kadar yazılan çıktı biriktirilir;
   * aksi halde terminal oluşturulur oluşturulmaz yazılanlar kaybolur.
   */
  open(): void {
    this.acildi = true;
    const biriken = this.birikenCikti;
    this.birikenCikti = '';
    if (biriken) this.yazici.fire(biriken);
    const bekleyenler = this.acilisBekleyenler;
    this.acilisBekleyenler = [];
    for (const coz of bekleyenler) coz();
  }

  /** Çalışmayı durdurur; girdi bekleyen `satirOku` çağrısını da sonlandırır. */
  durdur(): void {
    this.iptal = true;
    const coz = this.bekleyen;
    this.bekleyen = undefined;
    coz?.('');
  }

  /** Terminal yazmaya hazır olana kadar (en fazla `zamanAsimiMs`) bekler. */
  async hazir(zamanAsimiMs = 2000): Promise<void> {
    if (this.acildi) return;
    await new Promise<void>((coz) => {
      const zamanlayici = setTimeout(() => coz(), zamanAsimiMs);
      this.acilisBekleyenler.push(() => {
        clearTimeout(zamanlayici);
        coz();
      });
    });
  }

  close(): void {
    this.kapandi = true;
    this.iptal = true;
    const bekleyen = this.bekleyen;
    this.bekleyen = undefined;
    bekleyen?.('');
    const acilisBekleyenler = this.acilisBekleyenler;
    this.acilisBekleyenler = [];
    for (const coz of acilisBekleyenler) coz();
    this.yazici.dispose();
    this.kapanis.fire();
    this.kapanis.dispose();
  }

  dispose(): void {
    if (!this.kapandi) this.close();
  }

  get kapanmis(): boolean {
    return this.kapandi;
  }

  /** Terminal içeriğini temizler. */
  temizle(): void {
    this.yaz('\u001b[2J\u001b[3J\u001b[H');
  }

  /** Program çıktısını terminale basar; satır sonları terminale uygun hale getirilir. */
  yaz(metin: string): void {
    if (this.kapandi) return;
    const donusturulmus = metin.replace(/\r?\n/g, '\r\n');
    if (!this.acildi) {
      this.birikenCikti += donusturulmus;
      return;
    }
    this.yazici.fire(donusturulmus);
  }

  yazSatir(metin: string, renk?: 'kirmizi' | 'yesil' | 'mavi'): void {
    const kod = renk === 'kirmizi' ? '\u001b[31m' : renk === 'yesil' ? '\u001b[32m' : renk === 'mavi' ? '\u001b[36m' : '';
    const sifirla = kod ? '\u001b[0m' : '';
    this.yaz(`${kod}${metin}${sifirla}\r\n`);
  }

  /** Bir satır girdi bekler; kullanıcı Enter'a basınca satır döner. */
  satirOku(soru: string): Promise<string> {
    if (this.iptal) return Promise.reject(new TurkodHatasi('Çalıştırma durduruldu.'));
    if (soru) this.yaz(soru.replace(/\r?\n$/, ''));
    const hazir = this.hazirSatirlar.shift();
    if (hazir !== undefined) return Promise.resolve(hazir);
    return new Promise<string>((coz) => {
      this.bekleyen = coz;
    });
  }

  handleInput(veri: string): void {
    if (this.kapandi) return;
    // Ok tuşları gibi kaçış dizileri yok sayılır.
    const temiz = veri.replace(/\u001b\[[0-9;?]*[A-Za-z~]/g, '');
    for (const karakter of temiz) {
      if (karakter === '\r' || karakter === '\n') {
        const cifti = karakter === '\n' && this.sonKarakter === '\r';
        this.sonKarakter = karakter;
        if (cifti) continue;
        this.yaz('\r\n');
        this.hazirSatirlar.push(this.tampon);
        this.tampon = '';
        this.bekleyeniCoz();
        continue;
      }
      this.sonKarakter = karakter;
      if (karakter === '\u007f' || karakter === '\b') {
        if (this.tampon.length > 0) {
          this.tampon = this.tampon.slice(0, -1);
          this.yaz('\b \b');
        }
        continue;
      }
      if (karakter === '\u0003') {
        this.iptal = true;
        this.yaz('^C\r\n');
        this.bekleyeniCoz();
        continue;
      }
      if (karakter < ' ') continue;
      this.tampon += karakter;
      this.yaz(karakter);
    }
  }

  private bekleyeniCoz(): void {
    const coz = this.bekleyen;
    if (!coz) return;
    if (this.hazirSatirlar.length > 0) {
      this.bekleyen = undefined;
      coz(this.hazirSatirlar.shift() as string);
    } else if (this.iptal) {
      this.bekleyen = undefined;
      coz('');
    }
  }
}
