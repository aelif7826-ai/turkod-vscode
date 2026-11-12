/**
 * TürkUI pencerelerini yönetir.
 *
 * Varsayılan kip, Studio'daki davranışa en yakın olanıdır: her `TürkUI.pencere`
 * çağrısı, VS Code'dan bağımsız gerçek bir masaüstü penceresinde açılır
 * (`turkuiPenceresi.ts`). `turkod.turkuiPencereModu` ayarı `editor` yapılırsa
 * aynı `turkui-window.html` arayüzü webview panelinde çalıştırılır.
 *
 * Yerel görsel yolları tarayıcıdan okunamadığı için data URI'ye çevrilir.
 */

import * as vscode from 'vscode';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { createTurkuiModulu, TurkuiKopru, TurkuiModulu } from './turkui';
import {
  MasaustuPencereSunucusu,
  TurkuiPencereHedefi,
  tarayiciBul,
} from './turkuiPenceresi';

interface PencereDurumu {
  /** Pencereyi temsil eden taşıyıcı (masaüstü penceresi veya webview). */
  hedef: TurkuiPencereHedefi;
  hazir: boolean;
  /** Sayfanın son yükleme oturumu; yeniden yüklemede durumu ayırt eder. */
  oturum?: string;
  /** Pencereye gönderilen tüm mesajlar; yeniden yüklemede durumu geri kurar. */
  gecmis: Array<{ channel: string; data: unknown }>;
  props: Record<string, unknown>;
  title: string;
  propsGonderildi: boolean;
  bilesenler: Set<string>;
  acildiBildirildi: boolean;
}

/**
 * Tekilleştirilmemesi gereken sıralı bileşen komutları.
 *
 * `_addTab` / `_addItem` / `_setCell` gibi komutlar aynı özellik adını
 * kullansa da her çağrı ayrı bir işlemdir (liste öğesi ekle, hücre yaz...).
 * Bunlar "son değer kazanır" kuralıyla birleştirilirse önceki öğeler kaybolur.
 */
function siraliKomutMu(prop: string): boolean {
  return (
    prop.startsWith('_add') ||
    prop.startsWith('_remove') ||
    prop.startsWith('_clear') ||
    prop.startsWith('_canvas') ||
    prop.startsWith('_web') ||
    prop.startsWith('_audio') ||
    prop.startsWith('_select') ||
    prop === '_setCell' ||
    prop === '_setHeaders'
  );
}

export interface TurkuiPanelSecenekleri {
  extensionUri: vscode.Uri;
  baseDir: string;
  /** Webview'den gelen bileşen olayı. */
  olay: (bilesenId: string, olay: string, ozellikler?: Record<string, unknown>) => void | Promise<void>;
  /** Pencere düzeyi olaylar (`pencereAçıldığında`, `pencereKapatılırken`). */
  pencereOlayi?: (pencereId: string, olay: string) => void | Promise<void>;
  /** `TürkUI.betik` içinden gelen pencere komutu (`göster`, `gizle`, ...). */
  pencereKomutu?: (pencereId: string, komut: string) => void | Promise<void>;
  /** Olay işleyicisinde oluşan hataları bildirir. */
  hata?: (mesaj: string) => void;
  /** Açık pencere sayısı değiştiğinde çağrılır. */
  degisti?: () => void;
}

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.flac': 'audio/flac',
  '.opus': 'audio/opus',
};

/**
 * Göreli varlık dosyasını arar.
 *
 * Giriş dosyası `src/` altında olabilir, varlıklar (logo, ses) ise proje
 * kökünde (`uygulama.json` yanında) durabilir. Sırasıyla temel klasör ve üst
 * klasörler denenir; böylece `src` klasöründen çalıştırılsa da dosya bulunur.
 */
export function varlikDosyasiBul(yol: string, temelKlasor: string): string | undefined {
  const ham = String(yol || '').trim();
  if (!ham) return undefined;
  const adaylar: string[] = [];
  const ekle = (y: string): void => {
    const tam = path.resolve(y);
    if (!adaylar.includes(tam)) adaylar.push(tam);
  };
  if (path.isAbsolute(ham)) {
    ekle(ham);
  } else {
    let d = path.resolve(temelKlasor || '.');
    for (let i = 0; i < 8; i += 1) {
      ekle(path.join(d, ham));
      const ust = path.dirname(d);
      if (ust === d) break;
      d = ust;
    }
  }
  for (const aday of adaylar) {
    try {
      if (fs.existsSync(aday) && fs.statSync(aday).isFile()) return aday;
    } catch {
      /* yol okunamadı */
    }
  }
  return undefined;
}

/** Webview'de gösterilebilmesi için yerel dosyayı data URI'ye çevirir. */
export function resimVeriUri(yol: string, temelKlasor: string): string {
  const ham = String(yol || '').trim();
  if (!ham) return '';
  if (/^(data:|https?:|blob:)/i.test(ham)) return ham;
  const tam = varlikDosyasiBul(ham, temelKlasor);
  if (!tam) return ham;
  try {
    const veri = fs.readFileSync(tam);
    const mime = MIME[path.extname(tam).toLowerCase()] ?? 'application/octet-stream';
    return `data:${mime};base64,${veri.toString('base64')}`;
  } catch {
    return ham;
  }
}

export class TurkuiPanelYoneticisi implements vscode.Disposable {
  private pencereler = new Map<string, PencereDurumu>();
  private htmlMetni?: string;
  private fare?: Record<string, any>;
  private klavye?: Record<string, any>;
  private kapandi = false;
  /** Masaüstü penceresi kullanılabilir mi? (Edge/Chrome bulunduysa) */
  private readonly tarayici = tarayiciBul();
  /** Masaüstü pencerelerini sunan yerel HTTP sunucusu; ilk pencerede kurulur. */
  private masaustu?: MasaustuPencereSunucusu;

  readonly kopru: TurkuiKopru;

  constructor(private readonly secenekler: TurkuiPanelSecenekleri) {
    this.kopru = {
      baseDir: secenekler.baseDir,
      onTurkuiCreateWindow: (baslik, pencereId, props) => this.pencereOlustur(baslik, pencereId, props),
      onTurkuiAddComponent: (pencereId, tur, id, props) => this.bilesenEkle(pencereId, tur, id, props),
      onTurkuiUpdateComponent: (pencereId, id, ozellik, deger) =>
        this.bilesenGuncelle(pencereId, id, ozellik, deger),
      onTurkuiShowWindow: (pencereId) => this.pencereGoster(pencereId),
      onTurkuiCloseWindow: (pencereId) => this.pencereKapat(pencereId),
      onTurkuiIleti: (tur, mesaj) => this.ileti(tur, mesaj),
      onTurkuiSor: (soru, varsayilan) => this.sor(soru, varsayilan),
      onTurkuiDosya: (tur, baslik, varsayilan, uzantilar) =>
        this.dosyaDiyalogu(tur, baslik, varsayilan, uzantilar),
      onTurkuiBildirim: (baslik, icerik) => this.bildirim(baslik, icerik),
      onTurkuiEkran: () => this.ekranBilgisi(),
      onTurkuiPencereSayisi: () => this.pencereler.size,
      onTurkuiHepsiKapat: () => this.hepsiniKapat(),
      onTurkuiDurum: (fare, klavye) => {
        this.fare = fare;
        this.klavye = klavye;
      },
    };
  }

  /** TürkUI modülünü bu yöneticiye bağlı olarak oluşturur. */
  modulOlustur(): TurkuiModulu {
    return createTurkuiModulu(this.kopru);
  }

  get acikPencereSayisi(): number {
    return this.pencereler.size;
  }

  dispose(): void {
    this.kapandi = true;
    this.hepsiniKapat();
    this.masaustu?.dispose();
    this.masaustu = undefined;
  }

  /* ---------------- pencere yönetimi ---------------- */

  private pencereOlustur(baslik: string, pencereId: string, props: Record<string, unknown>): void {
    const mevcut = this.pencereler.get(pencereId);
    if (mevcut) {
      mevcut.title = String(props['başlık'] ?? baslik ?? mevcut.title);
      mevcut.hedef.baslikAyarla(mevcut.title);
      mevcut.hedef.goster();
      return;
    }

    const durum: PencereDurumu = {
      hedef: this.hedefOlustur(baslik, pencereId, props),
      hazir: false,
      gecmis: [],
      props: { ...props },
      title: String(props['başlık'] ?? baslik ?? 'TürkUI'),
      propsGonderildi: false,
      bilesenler: new Set<string>(),
      acildiBildirildi: false,
    };
    this.pencereler.set(pencereId, durum);
    durum.hedef.baslikAyarla(durum.title);
    this.secenekler.degisti?.();
  }

  /**
   * Pencereyi masaüstünde mi yoksa editör sekmesinde mi açacağına karar verir.
   * Masaüstü kipi varsayılandır; tarayıcı bulunamazsa veya ayar `editor`
   * ise webview kullanılır.
   */
  private hedefOlustur(
    baslik: string,
    pencereId: string,
    props: Record<string, unknown>
  ): TurkuiPencereHedefi {
    const mod = vscode.workspace
      .getConfiguration('turkod')
      .get<string>('turkuiPencereModu', 'masaustu');
    if (mod !== 'editor' && this.tarayici) {
      const sunucu = this.masaustuSunucusu();
      return sunucu.pencereOlustur(pencereId, baslik, props);
    }
    if (mod !== 'editor' && !this.tarayici) {
      this.secenekler.hata?.(
        'Masaüstü pencere için Edge/Chrome bulunamadı; TürkUI editör sekmesinde açılıyor.'
      );
    }
    return this.webviewHedefi(baslik, pencereId);
  }

  private masaustuSunucusu(): MasaustuPencereSunucusu {
    if (!this.masaustu) {
      this.masaustu = new MasaustuPencereSunucusu(
        {
          html: () => this.html(),
          mesaj: (pencereId, mesaj) => this.mesajGeldi(pencereId, mesaj),
          kapandi: (pencereId) => this.pencereKapandi(pencereId),
          hata: (mesaj) => this.secenekler.hata?.(mesaj),
        },
        this.tarayici as string
      );
    }
    return this.masaustu;
  }

  private webviewHedefi(baslik: string, pencereId: string): TurkuiPencereHedefi {
    const panel = vscode.window.createWebviewPanel(
      'turkui',
      baslik,
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(this.secenekler.extensionUri, 'media')],
      }
    );
    panel.webview.onDidReceiveMessage(
      (mesaj: unknown) => this.mesajGeldi(pencereId, mesaj),
      undefined
    );
    panel.onDidDispose(() => this.pencereKapandi(pencereId));
    panel.webview.html = this.html();
    return new WebviewHedefi(panel);
  }

  /** Pencere kapandığında (kullanıcı veya program) durumu temizler. */
  private pencereKapandi(pencereId: string): void {
    const durum = this.pencereler.get(pencereId);
    if (!durum) return;
    this.pencereler.delete(pencereId);
    if (!this.kapandi && durum.acildiBildirildi) {
      this.pencereOlayi(pencereId, 'pencereKapatılırken');
    }
    this.secenekler.degisti?.();
  }

  private pencereGoster(pencereId: string): void {
    const durum = this.pencereler.get(pencereId);
    if (!durum) return;
    if (!durum.propsGonderildi) {
      durum.propsGonderildi = true;
      this.pencerePropsGonder(pencereId, durum.props);
    }
    this.gonder(pencereId, 'turkui:updateComponent', { id: '', prop: '_show', value: true });
    durum.hedef.goster();
    if (!durum.acildiBildirildi) {
      durum.acildiBildirildi = true;
      this.pencereOlayi(pencereId, 'pencereAçıldığında');
    }
  }

  /** Pencere düzeyi olayı hata yakalayarak çalıştırır. */
  private pencereOlayi(pencereId: string, olay: string): void {
    Promise.resolve(this.secenekler.pencereOlayi?.(pencereId, olay)).catch((e) => {
      const mesaj = e instanceof Error ? e.message : String(e);
      this.secenekler.hata?.(`TürkUI pencere olayı hatası (${olay}): ${mesaj}`);
    });
  }

  private pencereKapat(pencereId: string): void {
    const durum = this.pencereler.get(pencereId);
    if (durum) durum.hedef.kapat();
  }

  private hepsiniKapat(): void {
    const hedefler = [...this.pencereler.values()].map((p) => p.hedef);
    this.pencereler.clear();
    for (const hedef of hedefler) {
      try {
        hedef.kapat();
      } catch {
        /* zaten kapalı */
      }
    }
    this.secenekler.degisti?.();
  }

  private pencerePropsGonder(pencereId: string, props: Record<string, unknown>): void {
    const gonder = (prop: string, value: unknown): void => {
      this.gonder(pencereId, 'turkui:updateComponent', { id: '', prop, value });
    };
    gonder('_title', String(props['başlık'] ?? this.pencereler.get(pencereId)?.title ?? 'TürkUI'));
    const resim = String(props['arkaPlanResmi'] ?? '').trim();
    if (resim) gonder('_arkaPlanResmi', resimVeriUri(resim, this.secenekler.baseDir));
    const logo = String(props['logo'] ?? '').trim();
    if (logo) gonder('_logo', resimVeriUri(logo, this.secenekler.baseDir));
    if (props['açılışAnimasyonu'] !== undefined) {
      gonder('_açılışAnimasyon', String(props['açılışAnimasyonu'] ?? ''));
    }
    if (props['başlıkÇubuğu'] !== undefined) {
      gonder('_başlıkÇubuğu', props['başlıkÇubuğu'] === true);
    }
  }

  /* ---------------- bileşenler ---------------- */

  private bilesenEkle(pencereId: string, tur: string, id: string, props: Record<string, unknown>): void {
    const durum = this.pencereler.get(pencereId);
    if (!durum || durum.bilesenler.has(id)) return;
    durum.bilesenler.add(id);
    const kopya: Record<string, unknown> = { ...props };
    if ((tur === 'image' || tur === 'audio') && typeof kopya['kaynak'] === 'string') {
      kopya['kaynak'] = resimVeriUri(String(kopya['kaynak']), this.secenekler.baseDir);
    }
    this.gonder(pencereId, 'turkui:addComponent', { type: tur, id, props: kopya });
  }

  private bilesenGuncelle(pencereId: string, id: string, ozellik: string, deger: unknown): void {
    if (id === '') {
      switch (ozellik) {
        case '_title':
        case 'başlık': {
          const durum = this.pencereler.get(pencereId);
          if (durum) {
            durum.title = String(deger ?? '');
            durum.hedef.baslikAyarla(durum.title);
          }
          this.gonder(pencereId, 'turkui:updateComponent', { id: '', prop: '_title', value: String(deger ?? '') });
          return;
        }
        case 'arkaPlanResmi':
          this.gonder(pencereId, 'turkui:updateComponent', {
            id: '',
            prop: '_arkaPlanResmi',
            value: resimVeriUri(String(deger ?? ''), this.secenekler.baseDir),
          });
          return;
        case 'logo':
          this.gonder(pencereId, 'turkui:updateComponent', {
            id: '',
            prop: '_logo',
            value: resimVeriUri(String(deger ?? ''), this.secenekler.baseDir),
          });
          return;
        case 'açılışAnimasyonu':
          this.gonder(pencereId, 'turkui:updateComponent', {
            id: '',
            prop: '_açılışAnimasyon',
            value: String(deger ?? ''),
          });
          return;
        case 'başlıkÇubuğu':
          this.gonder(pencereId, 'turkui:updateComponent', {
            id: '',
            prop: '_başlıkÇubuğu',
            value: deger === true,
          });
          return;
        case '_odaklan':
        case '_center':
        case '_minimize':
        case '_maximize':
        case '_restore':
          this.pencereler.get(pencereId)?.hedef.goster();
          return;
        case '_close':
          this.pencereKapat(pencereId);
          return;
        case 'genişlik':
        case 'yükseklik':
        case 'x':
        case 'y':
        case 'minGenişlik':
        case 'minYükseklik':
        case 'maksGenişlik':
        case 'maksYükseklik':
        case 'şeffaflık':
        case 'herZamanÜstte':
        case 'üstte':
        case 'boyutlandırılabilir':
        case 'tamEkran':
        case 'ikon':
        case 'çerçevesiz':
        case 'küçültülebilir':
        case 'büyütülebilir':
        case 'kapatılabilir': {
          // Tarayıcı tabanlı masaüstü penceresinde bu özelliklerin bir kısmı
          // çalışma anında değiştirilemez; yine de saklanır ve pencere
          // yeniden açıldığında kullanılır.
          const durum = this.pencereler.get(pencereId);
          if (durum) durum.props[ozellik] = deger;
          return;
        }
        default:
          break;
      }
      this.gonder(pencereId, 'turkui:updateComponent', { id: '', prop: ozellik, value: deger });
      return;
    }

    let yeniDeger = deger;
    if (ozellik === 'kaynak') {
      yeniDeger = resimVeriUri(String(deger ?? ''), this.secenekler.baseDir);
    } else if (
      ozellik === '_canvasKomut' &&
      deger &&
      typeof deger === 'object' &&
      (deger as Record<string, unknown>).komut === 'görsel' &&
      typeof (deger as Record<string, unknown>).kaynak === 'string'
    ) {
      yeniDeger = {
        ...(deger as Record<string, unknown>),
        kaynak: resimVeriUri(String((deger as Record<string, unknown>).kaynak), this.secenekler.baseDir),
      };
    }
    this.gonder(pencereId, 'turkui:updateComponent', { id, prop: ozellik, value: yeniDeger });
  }

  /* ---------------- webview mesajları ---------------- */

  private gonder(pencereId: string, channel: string, data: unknown): void {
    const durum = this.pencereler.get(pencereId);
    if (!durum) return;
    // Aynı bileşen özelliğinin eski güncellemesini tutmak yerine son değeri sakla.
    // Sıralı komutlar (`_addTab`, `_addItem`, `_setCell` ...) ise tekilleştirilmez:
    // her çağrı ayrı bir işlemdir, öncekini silmemelidir.
    if (channel === 'turkui:updateComponent') {
      const d = data as { id?: unknown; prop?: unknown };
      if (
        d &&
        typeof d.id === 'string' &&
        typeof d.prop === 'string' &&
        !siraliKomutMu(d.prop)
      ) {
        const eski = durum.gecmis.findIndex((m) => {
          if (m.channel !== channel) return false;
          const md = m.data as { id?: unknown; prop?: unknown };
          return md && md.id === d.id && md.prop === d.prop;
        });
        if (eski >= 0) durum.gecmis.splice(eski, 1);
      }
    }
    durum.gecmis.push({ channel, data });
    // Aşırı büyümeyi engelle; normal arayüzler bu sınıra ulaşmaz.
    if (durum.gecmis.length > 5000) durum.gecmis.splice(0, durum.gecmis.length - 5000);
    if (!durum.hazir) return;
    durum.hedef.gonder({ channel, data });
  }

  private mesajGeldi(pencereId: string, ham: unknown): void {
    if (!ham || typeof ham !== 'object') return;
    const mesaj = ham as { channel?: string; data?: any };
    const kanal = mesaj.channel;
    const veri = mesaj.data ?? {};

    if (kanal === 'turkui:hazir') {
      const durum = this.pencereler.get(pencereId);
      if (!durum) return;
      const oturum = typeof veri.oturum === 'string' ? veri.oturum : '';
      // Aynı sayfadan gelen tekrarlı hazır mesajını yok say; yeni yüklemede durumu geri kur.
      if (durum.hazir && oturum && durum.oturum === oturum) return;
      durum.oturum = oturum || undefined;
      durum.hazir = true;
      for (const mesaj2 of durum.gecmis) {
        durum.hedef.gonder(mesaj2);
      }
      return;
    }

    if (kanal === 'turkui:event') {
      const id = String(veri.componentId ?? '');
      const olay = String(veri.eventName ?? '');
      if (!id || !olay) return;
      const props = veri.props && typeof veri.props === 'object' ? veri.props : undefined;
      Promise.resolve(this.secenekler.olay(id, olay, props)).catch((e) => {
        const mesaj2 = e instanceof Error ? e.message : String(e);
        this.secenekler.hata?.(`TürkUI olay hatası (${olay}): ${mesaj2}`);
      });
      return;
    }

    if (kanal === 'turkui:mouseState') {
      const fare = this.fare;
      if (!fare) return;
      if (veri.x !== undefined) fare.x = veri.x;
      if (veri.y !== undefined) fare.y = veri.y;
      if (veri.solTık !== undefined) fare.solTık = veri.solTık;
      if (veri.sağTık !== undefined) fare.sağTık = veri.sağTık;
      if (veri.ortaTık !== undefined) fare.ortaTık = veri.ortaTık;
      if (veri.tekerlek !== undefined) fare.tekerlek = (Number(fare.tekerlek) || 0) + Number(veri.tekerlek);
      return;
    }

    if (kanal === 'turkui:keyState') {
      const klavye = this.klavye;
      if (klavye && veri.tuş !== undefined) klavye.tuş = veri.tuş;
      return;
    }

    if (kanal === 'turkui:pencereKomutu') {
      const hedefId = String(veri.pencereId ?? '');
      const komut = String(veri.komut ?? '');
      if (!hedefId || !komut) return;
      Promise.resolve(this.secenekler.pencereKomutu?.(hedefId, komut)).catch((e) => {
        const mesaj2 = e instanceof Error ? e.message : String(e);
        this.secenekler.hata?.(`TürkUI pencere komutu hatası (${komut}): ${mesaj2}`);
      });
      return;
    }

    if (kanal === 'turkui:windowClose') {
      this.pencereKapat(pencereId);
      return;
    }

    if (
      kanal === 'turkui:windowMinimize' ||
      kanal === 'turkui:windowMaximize' ||
      kanal === 'turkui:windowUnmaximize' ||
      kanal === 'turkui:windowCenter'
    ) {
      this.pencereler.get(pencereId)?.hedef.goster();
    }
  }

  /* ---------------- diyaloglar ---------------- */

  private async ileti(tur: 'uyarı' | 'bilgi' | 'onay', mesaj: string): Promise<boolean | null> {
    if (tur === 'onay') {
      const secim = await vscode.window.showWarningMessage(
        mesaj || 'Onaylıyor musunuz?',
        { modal: true },
        'Evet',
        'Hayır'
      );
      return secim === 'Evet';
    }
    if (tur === 'uyarı') {
      await vscode.window.showWarningMessage(mesaj, { modal: true });
      return null;
    }
    await vscode.window.showInformationMessage(mesaj);
    return null;
  }

  private async sor(soru: string, varsayilan: string): Promise<string> {
    const cevap = await vscode.window.showInputBox({
      prompt: soru || undefined,
      value: varsayilan,
      ignoreFocusOut: true,
    });
    return cevap ?? '';
  }

  private async dosyaDiyalogu(
    tur: 'ac' | 'kaydet' | 'klasor',
    baslik: string,
    varsayilan: string,
    uzantilar: string[]
  ): Promise<string> {
    const filtreler =
      uzantilar.length > 0
        ? { 'Desteklenen dosyalar': uzantilar }
        : undefined;
    const temel = this.secenekler.baseDir;
    const varsayilanUri = varsayilan
      ? vscode.Uri.file(path.isAbsolute(varsayilan) ? varsayilan : path.join(temel, varsayilan))
      : vscode.Uri.file(temel);

    if (tur === 'klasor') {
      const secim = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: baslik || 'Klasör Seç',
        defaultUri: varsayilanUri,
      });
      return secim?.[0]?.fsPath ?? '';
    }
    if (tur === 'kaydet') {
      const secim = await vscode.window.showSaveDialog({
        saveLabel: baslik || 'Kaydet',
        defaultUri: varsayilanUri,
        filters: filtreler,
      });
      return secim?.fsPath ?? '';
    }
    const secim = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      openLabel: baslik || 'Aç',
      defaultUri: varsayilanUri,
      filters: filtreler,
    });
    return secim?.[0]?.fsPath ?? '';
  }

  private async bildirim(baslik: string, icerik: string): Promise<void> {
    await vscode.window.showInformationMessage(icerik ? `${baslik}: ${icerik}` : baslik);
  }

  private ekranBilgisi(): Record<string, unknown> {
    // VS Code ekran boyutu API'si sunmaz; makul bir masaüstü varsayımı kullanılır.
    const genislik = 1920;
    const yukseklik = 1080;
    return {
      genişlik: genislik,
      yükseklik: yukseklik,
      ölçek: 1,
      çalışmaAlanı: { x: 0, y: 0, genişlik: genislik, yükseklik: yukseklik - 40 },
    };
  }

  /* ---------------- HTML ---------------- */

  private html(): string {
    if (this.htmlMetni === undefined) {
      const dosya = path.join(this.secenekler.extensionUri.fsPath, 'media', 'turkui-window.html');
      try {
        this.htmlMetni = fs.readFileSync(dosya, 'utf8');
      } catch {
        this.htmlMetni =
          '<!DOCTYPE html><html lang="tr"><body><p>TürkUI arayüzü bulunamadı: media/turkui-window.html</p></body></html>';
      }
    }
    // Her panel için taze nonce üretilir; dosyadaki yer tutucu değiştirilir.
    const nonce = crypto.randomBytes(16).toString('base64');
    return this.htmlMetni.replace(/__TURKUI_NONCE__/g, nonce);
  }
}

/** Webview panelini `TurkuiPencereHedefi` arayüzüne uyarlar. */
class WebviewHedefi implements TurkuiPencereHedefi {
  constructor(private readonly panel: vscode.WebviewPanel) {}

  gonder(mesaj: { channel: string; data: unknown }): void {
    void this.panel.webview.postMessage(mesaj);
  }

  baslikAyarla(baslik: string): void {
    try {
      this.panel.title = baslik;
    } catch {
      /* panel kapanmış olabilir */
    }
  }

  goster(): void {
    try {
      this.panel.reveal();
    } catch {
      /* panel kapanmış olabilir */
    }
  }

  kapat(): void {
    try {
      this.panel.dispose();
    } catch {
      /* zaten kapalı */
    }
  }
}
