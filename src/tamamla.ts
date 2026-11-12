import * as vscode from 'vscode';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { yerlesikKomutlar, YerlesikKomutVerisi } from './veri/yerlesikKomutlar';
import { anahtarKelimeler, mantiksalOperatorler, sabitler } from './veri/anahtarKelimeler';
import {
  metinMetotlari,
  listeMetotlari,
  sozlukMetotlari,
  kumeMetotlari,
  MetotVerisi,
} from './veri/metotlar';
import {
  TURKUI_BILESEN_ADLARI,
  turkuiBilesenUyeleri,
  turkuiPencereUyeleri,
  turkuiRenkUyeleri,
  turkuiUyeleri,
  TurkuiUyeVerisi,
} from './veri/turkui';
import { stilOzellikleri } from './veri/stilOzellikleri';
import { zamanUyeleri } from './veri/zaman';
import { stilDurumlari } from './veri/stilDurumlari';
import {
  BetikSozcugu,
  betikAnahtarKelimeleri,
  betikGenelAdlari,
  betikOlayAdlari,
  betikUyeAdlari,
  mesajKutusuUyeAdlari,
} from './veri/betikSozcukleri';
import {
  StilDegeri,
  ortakDegerler,
  ozellikDegerleri,
  renkDegerleri,
  renkOzellikleri,
} from './veri/stilDegerleri';
import { FormulVerisi, formuller } from './veri/formuller';
import { modulDosyasiBul, projeKokuBul } from './calistir';
import { oyunModuluEtkinMi } from './oyunDurumu';

const KELIME = 'A-Za-z0-9_ğüşıöçĞÜŞİÖÇ';
const KELIME_BASI = '[A-Za-z_ğüşıöçĞÜŞİÖÇ]';
const TANIMLAYICI = `${KELIME_BASI}[${KELIME}]*`;

type CozumTipi =
  | 'metin'
  | 'liste'
  | 'sozluk'
  | 'kume'
  | 'sayi'
  | 'bilinmiyor'
  | `nesne:${string}`
  | `turkui:${string}`;

/** TürkUI penceresinin ürettiği bileşen metotları. */
const TURKUI_BILESENLERI = TURKUI_BILESEN_ADLARI;

interface ModulVerisi {
  ad: string;
  aciklama: string;
  ornek?: string;
}

/** `içe_aktar` sonrasında önerilen yerleşik modüller. */
const YERLESIK_MODULLER: ModulVerisi[] = [
  {
    ad: 'Oyun',
    aciklama: 'Ursina ile oyuncu kontrollü 3D sahneler oluşturur.',
    ornek: 'içe_aktar Oyun\n\nOyun.sahne {\n\tzemin()\n\toyuncu()\n\tküp(\n\t\trenk: turuncu\n\t\tkonum: (0, 0, 4)\n\t\tboyut: (1, 1, 1)\n\t)\n}',
  },
  {
    ad: 'Zaman',
    aciklama:
      'Tarih ve saat modülü: biçimlendirme, tarih aritmetiği, karşılaştırma, hafta/ay bilgileri, ' +
      'kronometre, geri sayım ve okunabilir süre metni. `Zaman.` yazınca üyeler listelenir.',
    ornek:
      'içe_aktar Zaman\n\n' +
      'yazdır(Zaman.biçimle(\"17.10.2026\", \"gg AA yyyy\"))\n' +
      'değişken k := Zaman.kronometre()\n' +
      'k.başlat()',
  },
  {
    ad: 'TürkUI',
    aciklama:
      'Pencere, buton, giriş, liste ve diğer arayüz bileşenlerini oluşturan grafik arayüz modülü. ' +
      'Tüm bileşenler bu tek modül üzerinden kullanılır.',
    ornek:
      'içe_aktar TürkUI\n\n' +
      'değişken uygulama := TürkUI.pencere("Başlık")\n' +
      'değişken düğme := uygulama.buton("Tamam")\n\n' +
      'düğme.tıklandığında\n' +
      '    yazdır("Merhaba")\n' +
      'son\n\n' +
      'uygulama.göster()',
  },
];

const MODUL_ADI = new RegExp(`^${TANIMLAYICI}$`);

function turkuiAdiMi(ad: string): boolean {
  return ad.replace(/İ/g, 'i').toLowerCase().replace(/ü/g, 'u') === 'turkui';
}

function turkuiIceAktarildiMi(metin: string): boolean {
  for (const satir of metin.split(/\r?\n/)) {
    const m = /^\s*içe[_ ]aktar\s+([A-Za-z_ğüşıöçĞÜŞİÖÇ][\wğüşıöçĞÜŞİÖÇ]*)\s*$/.exec(satir);
    if (m && turkuiAdiMi(m[1])) return true;
  }
  return false;
}

function zamanAdiMi(ad: string): boolean {
  return ad.replace(/İ/g, 'i').toLowerCase().replace(/ü/g, 'u') === 'zaman';
}

function zamanIceAktarildiMi(metin: string): boolean {
  for (const satir of metin.split(/\r?\n/)) {
    const m = /^\s*içe[_ ]aktar\s+([A-Za-z_ğüşıöçĞÜŞİÖÇ][\wğüşıöçĞÜŞİÖÇ]*)\s*$/.exec(satir);
    if (m && zamanAdiMi(m[1])) return true;
  }
  return false;
}

interface NesneUyesi {
  ad: string;
  tur: 'değişken' | 'fonksiyon';
  parametreler: string[];
}

interface BelgeCozumu {
  tipler: Map<string, CozumTipi>;
  nesneler: Map<string, NesneUyesi[]>;
}

interface KullaniciSembolleri {
  adlar: Set<string>;
  fonksiyonlar: Set<string>;
}

/** `ad--kategori` yazımının imleçteki çözümü. */
interface FormulBaglami {
  /** Formülün uygulanacağı ad (`asd`). */
  ad: string;
  /** Yazılmış kategori parçası; henüz tamamlanmamış olabilir (boş olabilir). */
  kategori: string;
  /** `ad` metninin başladığı sütun; öneri bu aralığı değiştirir. */
  baslangic: number;
  /** İmleçten önce yazılmış `ad--kategori` metni (filtre için). */
  yazilan: string;
}

export class TurkodTamamlamaSaglayici implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): vscode.CompletionItem[] {
    // `asd--fonksiyon` yazımı: yalnızca formüller önerilir.
    const formul = this.formulBaglami(document, position);
    if (formul) return this.formulOnerileri(formul, position);
    // `-` tuşu yalnızca formül bağlamında öneri açar.
    if (context.triggerCharacter === '-') return [];

    if (context.triggerCharacter === '.') {
      if (this.stilBaglami(document, position, 'betik').grupIcinde) {
        const once = document.lineAt(position.line).text.slice(0, position.character);
        if (/mesajKutusu\s*\.\s*[A-Za-z0-9_ğüşıöçĞÜŞİÖÇ]*$/.test(once)) {
          return this.uyeOnerileri(document, position, this.belgeleriCoz(document));
        }
        return this.betikUyeOnerileri();
      }
      return this.uyeOnerileri(document, position, this.belgeleriCoz(document));
    }

    // `içe_aktar ` sonrasında yalnızca modül adları önerilir.
    if (this.iceAktarBaglamindaMi(document, position)) {
      return this.modulOnerileri(document, position);
    }

    const oyunBaglami = oyunModuluEtkinMi() ? this.oyunSahneBaglami(document, position) : undefined;
    if (oyunBaglami) return this.oyunSahneIcerikOnerileri(oyunBaglami);

    // Boşluk tuşu yalnızca modül bağlamında öneri açar.
    if (context.triggerCharacter === ' ') {
      return [];
    }

    const cozum = this.belgeleriCoz(document);

    // `TürkUI.betik { pencere( ... ) }` içinde Türkçe JavaScript önerilir.
    const betik = this.stilBaglami(document, position, 'betik');
    if (betik.blokta && betik.grupIcinde) {
      // `olayDinle("` konumunda Türkçe olay adları listelenir.
      if (this.betikOlayBaglamindaMi(document, position)) {
        return this.betikOlayOnerileri();
      }
      return this.betikOnerileri(cozum);
    }

    // `TürkUI.stil { hedef( ... ) }` içinde yalnızca stil özellikleri önerilir.
    const stil = this.stilBaglami(document, position);
    if (stil.blokta) {
      if (stil.grupIcinde) {
        // Değer konumunda (`arkaPlanRengi: m`) hazır değerler önerilir.
        if (stil.ozellik) return this.stilDegerOnerileri(stil.ozellik);
        const oneriler = this.stilOnerileri(stil.kullanilan);
        // Hedef grubunda durum grupları da önerilir; iç içe durum yazılamaz.
        if (!stil.durumIcinde) oneriler.push(...this.stilDurumOnerileri());
        return oneriler;
      } else {
        const hedefler = this.stilHedefOnerileri(cozum);
        if (hedefler.length > 0) return hedefler;
      }
    }

    const items: vscode.CompletionItem[] = [];
    const kullanici = this.kullaniciSembolleri(document, cozum, items);
    // sayısal yerleşik nesne
    if (!kullanici.adlar.has('sayısal')) {
      const sayisalItem = new vscode.CompletionItem('sayısal', vscode.CompletionItemKind.Module);
      sayisalItem.detail = 'Sayısal girdi için yerleşik nesne';
      sayisalItem.documentation = this.dokumantasyon(
        'Sayısal girdi almak için kullanılan yerleşik nesne.',
        'değişken yaş := sayısal.iste("Yaşınız?")'
      );
      sayisalItem.sortText = `0_sayısal`;
      items.push(sayisalItem);
    }

    // Zaman modülü de tek öğe olarak önerilir; üyeler `Zaman.` ile gelir.
    const zamanIceAktarildi = zamanIceAktarildiMi(document.getText());
    if (!kullanici.adlar.has('Zaman')) {
      const zamanItem = new vscode.CompletionItem('Zaman', vscode.CompletionItemKind.Module);
      zamanItem.detail = 'Yerleşik modül';
      zamanItem.documentation = this.zamanModulBelgesi();
      zamanItem.insertText = zamanIceAktarildi ? 'Zaman' : 'içe_aktar Zaman';
      zamanItem.sortText = `0_Zaman`;
      items.push(zamanItem);
    }

    const oyunIceAktarildi = /^\s*içe[_ ]aktar\s+Oyun\s*$/im.test(document.getText());
    if (oyunModuluEtkinMi() && !kullanici.adlar.has('oyun')) {
      const oyunItem = new vscode.CompletionItem('Oyun', vscode.CompletionItemKind.Module);
      oyunItem.detail = 'Ursina 3D oyun modülü';
      oyunItem.documentation = this.dokumantasyon(
        'Ursina ile oyuncu kontrollü 3D sahne oluşturur; oyuncu WASD ile yürür ve fareyle bakar.',
        'içe_aktar Oyun\n\nOyun.sahne {\n\tzemin()\n\toyuncu()\n\tküp(\n\t\t renk: turuncu\n\t\tkonum: (0, 0, 4)\n\t\tboyut: (1, 1, 1)\n\t)\n}'
      );
      oyunItem.insertText = oyunIceAktarildi ? 'Oyun' : 'içe_aktar Oyun';
      oyunItem.sortText = '0_Oyun';
      items.push(oyunItem);
    }

    // TürkUI tek bir modül olarak önerilir: bileşenler `TürkUI.` ve
    // `pencere.` yazıldığında gelir, ayrı parçacık listesi gösterilmez.
    const turkuiIceAktarildi = turkuiIceAktarildiMi(document.getText());
    if (turkuiIceAktarildi && !kullanici.adlar.has('TürkUI')) {
      const turkuiItem = new vscode.CompletionItem('TürkUI', vscode.CompletionItemKind.Module);
      turkuiItem.detail = 'Yerleşik modül';
      turkuiItem.documentation = this.turkuiModulBelgesi();
      turkuiItem.insertText = turkuiIceAktarildi ? 'TürkUI' : 'içe_aktar TürkUI';
      turkuiItem.sortText = `0_TürkUI`;
      items.push(turkuiItem);
    }

    if (turkuiIceAktarildi) {
      for (const ad of ['renk', 'gizle']) {
        if (kullanici.adlar.has(ad)) continue;
        const item = new vscode.CompletionItem(ad, vscode.CompletionItemKind.Constant);
        item.detail = ad === 'renk' ? 'TürkUI renk paleti' : 'Bileşeni gizleme değeri';
        item.sortText = `0_${ad}`;
        items.push(item);
      }
    }
    this.anahtarKelimeOnerileri(items);
    this.sabitOnerileri(items, kullanici.adlar);
    this.yerlesikKomutOnerileri(items, kullanici.fonksiyonlar);

    // `TürkUI.stil { ... }` gövdesinde değişken tanımı geçerli değildir.
    if (!stil.blokta) this.yeniDegiskenOnerisi(document, position, items);

    return items;
  }

  /**
   * Satır başında henüz tanımlanmamış bir ad yazıldığında (`asd` gibi) hazır
   * değişken tanımı önerir: `değişken asd := `.
   *
   * Öneri; ad dosyada tanımlıysa, bir anahtar kelime/sabit/yerleşik komutla
   * eşleşiyorsa ya da yazılan harflerle başlayan başka bir öneri varsa
   * gösterilmez. Böylece `değişke` yazarken `değişken` tamamlaması bozulmaz.
   */
  private yeniDegiskenOnerisi(
    document: vscode.TextDocument,
    position: vscode.Position,
    items: vscode.CompletionItem[]
  ): void {
    const once = document.lineAt(position.line).text.slice(0, position.character);
    const m = new RegExp(`^\\s*(${TANIMLAYICI})$`).exec(once);
    if (!m) return;

    const ad = m[1];
    const aranan = this.kucult(ad);
    const cakisma = items.some((item) => {
      const etiket = typeof item.label === 'string' ? item.label : item.label.label;
      return this.kucult(etiket).startsWith(aranan);
    });
    if (cakisma) return;

    const item = new vscode.CompletionItem(
      `değişken ${ad} := `,
      vscode.CompletionItemKind.Snippet
    );
    item.detail = 'Yeni değişken tanımı';
    item.documentation = this.dokumantasyon(
      `"${ad}" adı bu dosyada tanımlı değil. Tab'a basınca hazır değişken tanımı yazılır.`,
      `değişken ${ad} := "değer"`
    );
    item.insertText = new vscode.SnippetString(`değişken ${ad} := \${1}`);
    item.filterText = ad;
    item.sortText = `0_${ad}`;
    items.push(item);
  }

  /**
   * İmleç `ad--kategori` yazımının içinde mi?
   *
   * Yalnızca satır başında (girintiden sonra) çalışır; böylece metin ve yorum
   * içindeki `--` formül sayılmaz.
   */
  private formulBaglami(
    document: vscode.TextDocument,
    position: vscode.Position
  ): FormulBaglami | undefined {
    const once = document.lineAt(position.line).text.slice(0, position.character);
    const m = new RegExp(`^(\\s*)(${TANIMLAYICI})\\s*--\\s*([${KELIME}-]*)$`).exec(once);
    if (!m) return undefined;

    return {
      ad: m[2],
      kategori: m[3],
      baslangic: m[1].length,
      yazilan: once.slice(m[1].length),
    };
  }

  /** `ad--kategori` yazımında önerilen formüller. */
  private formulOnerileri(
    baglam: FormulBaglami,
    position: vscode.Position
  ): vscode.CompletionItem[] {
    const aranan = this.kucult(baglam.kategori);
    const aralik = new vscode.Range(
      position.line,
      baglam.baslangic,
      position.line,
      position.character
    );

    const items: vscode.CompletionItem[] = [];
    for (let i = 0; i < formuller.length; i++) {
      const formul = formuller[i];
      if (!this.formulEslesiyorMu(formul, aranan)) continue;

      const snippet = this.formulSnippet(formul, baglam.ad);
      const onizleme = this.snippetMetni(snippet).split('\n')[0].trimEnd();
      const item = new vscode.CompletionItem(onizleme, vscode.CompletionItemKind.Snippet);
      item.detail = `Formül · ${baglam.ad}--${formul.kategori}`;
      item.documentation = this.dokumantasyon(
        formul.aciklama,
        this.snippetMetni(snippet),
        { kategori: 'Formül' }
      );
      item.insertText = new vscode.SnippetString(snippet);
      item.range = aralik;
      // Yazılan metin birebir eşleşsin; takma adlar da (`sozluk`) bulunsun.
      item.filterText = [baglam.yazilan, formul.kategori, ...(formul.takmaAdlar ?? [])].join(
        ' '
      );
      item.sortText = `0_${String(i).padStart(2, '0')}_${formul.kategori}`;
      items.push(item);
    }
    return items;
  }

  /** Kategori ya da takma adlardan biri yazılan parçayla başlıyor mu? */
  private formulEslesiyorMu(formul: FormulVerisi, aranan: string): boolean {
    if (!aranan) return true;
    const adlar = [formul.kategori, ...(formul.takmaAdlar ?? [])];
    return adlar.some((ad) => this.kucult(ad).startsWith(aranan));
  }

  /** Formül şablonundaki `{ad}` yerine yazılan adı koyar. */
  private formulSnippet(formul: FormulVerisi, ad: string): string {
    const bicimli =
      formul.adBicimi === 'buyukHarf'
        ? ad.charAt(0).toLocaleUpperCase('tr-TR') + ad.slice(1)
        : ad;
    return formul.sablon.split('{ad}').join(bicimli);
  }

  /** Snippet'i okunabilir koda çevirir (`${1:değer}` → `değer`, `$0` → boş). */
  private snippetMetni(snippet: string): string {
    return snippet
      .replace(/\$\{\d+:([^}]*)\}/g, '$1')
      .replace(/\$\{\d+\}/g, '')
      .replace(/\$\d+/g, '');
  }

  /**
   * İmlecin `TürkUI.stil { ... }` ya da `TürkUI.betik { ... }` bloğunda olup
   * olmadığını bulur.
   *
   * `grupIcinde` ise imleç bir `hedef( ... )` gövdesindedir; `stil` bloğunda
   * orada yalnızca stil özellikleri (`arkaPlanRengi`, `yazıBoyutu`, ...),
   * `betik` bloğunda Türkçe JavaScript sözcükleri önerilir.
   */
  private stilBaglami(
    document: vscode.TextDocument,
    position: vscode.Position,
    blokAdi: 'stil' | 'betik' = 'stil'
  ): {
    blokta: boolean;
    grupIcinde: boolean;
    durumIcinde: boolean;
    kullanilan: Set<string>;
    ozellik?: string;
  } {
    const satirlar = document.getText().split(/\r?\n/);
    const parcalar = satirlar.slice(0, position.line);
    parcalar.push((satirlar[position.line] ?? '').slice(0, position.character));
    const metin = parcalar.join('\n');

    const blok = new RegExp(`(${TANIMLAYICI})\\s*\\.\\s*${blokAdi}\\s*\\{`, 'g');
    let son: RegExpExecArray | undefined;
    let m: RegExpExecArray | null;
    while ((m = blok.exec(metin)) !== null) son = m;
    if (!son || !turkuiAdiMi(son[1])) {
      return { blokta: false, grupIcinde: false, durumIcinde: false, kullanilan: new Set() };
    }

    const govde = metin.slice(son.index + son[0].length);
    let suslu = 0;
    let tirnak = false;
    // Açık parantezlerin konumları: sonuncusu imlecin bulunduğu grubun başıdır.
    const parantezler: number[] = [];
    for (let i = 0; i < govde.length; i++) {
      const c = govde[i];
      if (c === '\\' && tirnak) {
        i++;
        continue;
      }
      if (c === '"') {
        tirnak = !tirnak;
        continue;
      }
      if (tirnak) continue;
      if (c === '{') suslu++;
      else if (c === '}') {
        suslu--;
        if (suslu < 0) {
          return { blokta: false, grupIcinde: false, durumIcinde: false, kullanilan: new Set() };
        }
      } else if (c === '(') parantezler.push(i);
      else if (c === ')') parantezler.pop();
    }

    const parantez = parantezler.length;
    // Hedef grubu ilk açık parantez, durum grubu ise onun içindeki parantezdir.
    const grupBaslangic = parantez > 0 ? parantezler[0] : -1;
    // İmlecin bulunduğu (en içteki) grupta zaten yazılmış özellikler önerilmez.
    const kullanilan = new Set<string>();
    let ozellik: string | undefined;
    if (parantez > 0 && grupBaslangic >= 0) {
      const gecerli = new Set(stilOzellikleri.map((ozellikAdi) => ozellikAdi.ad));
      const grupGovdesi = govde.slice(parantezler[parantez - 1] + 1);
      const ozellikRe = /([A-Za-z_ğüşıöçĞÜŞİÖÇ][\wğüşıöçĞÜŞİÖÇ]*)\s*:/g;
      let eslesme: RegExpExecArray | null;
      while ((eslesme = ozellikRe.exec(grupGovdesi)) !== null) {
        if (gecerli.has(eslesme[1])) kullanilan.add(eslesme[1]);
      }

      // Aktif satırda `özellik: kısmiDeğer` varsa imleç değer konumundadır.
      const aktifSatir = satirlar[position.line] ?? '';
      const onceSatir = aktifSatir.slice(0, position.character);
      const degerEslesmesi = /([A-Za-z_ğüşıöçĞÜŞİÖÇ][\wğüşıöçĞÜŞİÖÇ]*)\s*:\s*[^,()]*$/.exec(
        onceSatir
      );
      if (degerEslesmesi && gecerli.has(degerEslesmesi[1])) ozellik = degerEslesmesi[1];
    }

    return {
      blokta: true,
      grupIcinde: parantez > 0,
      durumIcinde: parantez > 1,
      kullanilan,
      ozellik,
    };
  }

  /** `TürkUI.stil` gövdesinde önerilen stil özellikleri. */
  private stilOnerileri(kullanilan: Set<string> = new Set()): vscode.CompletionItem[] {
    return stilOzellikleri
      .filter((ozellik) => !kullanilan.has(ozellik.ad))
      .map((ozellik) => {
        const item = new vscode.CompletionItem(ozellik.ad, vscode.CompletionItemKind.Property);
        item.detail = `${ozellik.ad}: ${ozellik.ornek}   →   ${ozellik.css}`;
        item.documentation = this.dokumantasyon(ozellik.aciklama, `${ozellik.ad}: ${ozellik.ornek}`, {
          kategori: `CSS: ${ozellik.css}`,
        });
        item.insertText = new vscode.SnippetString(`${ozellik.ad}: \${1:${ozellik.ornek}}`);
        // Listenin en üstünde görünsün.
        item.sortText = `0_0_${ozellik.ad}`;
        return item;
      });
  }

  /**
   * `TürkUI.stil` hedef grubunda önerilen Türkçe durum grupları.
   *
   * Her durum bir şablon olarak eklenir:
   * `üzerineGelince(` + örnek özellik/değer + `)`.
   */
  private stilDurumOnerileri(): vscode.CompletionItem[] {
    return stilDurumlari.map((durum) => {
      const ikiNokta = durum.ornek.indexOf(':');
      const ozellik = ikiNokta >= 0 ? durum.ornek.slice(0, ikiNokta).trim() : durum.ornek;
      const deger = ikiNokta >= 0 ? durum.ornek.slice(ikiNokta + 1).trim() : '';
      const item = new vscode.CompletionItem(durum.ad, vscode.CompletionItemKind.Event);
      item.detail = `${durum.ad}( ... )   →   ${durum.css}`;
      item.documentation = this.dokumantasyon(
        durum.aciklama,
        `TürkUI.stil {\n\tbileşen(\n\t\t${durum.ad}(\n\t\t\t${durum.ornek}\n\t\t)\n\t)\n}`
      );
      item.insertText = new vscode.SnippetString(
        `${durum.ad}(\n\t\${1:${ozellik}}: \${2:${deger}}\n)`
      );
      // Özelliklerden sonra, ama listenin üst grubunda görünsün.
      item.sortText = `0_1_${durum.ad}`;
      return item;
    });
  }

  /**
   * `TürkUI.stil` bloğunda değer konumunda önerilen hazır değerler.
   *
   * Renk özelliklerinde palet en üstte, sonra özelliğe özel yaygın değerler,
   * en sonda tüm özelliklerde geçerli ortak değerler gelir.
   */
  private stilDegerOnerileri(ozellik: string): vscode.CompletionItem[] {
    const items: vscode.CompletionItem[] = [];
    const eklenen = new Set<string>();
    const ekle = (deger: StilDegeri, oncelik: string): void => {
      if (eklenen.has(deger.deger)) return;
      eklenen.add(deger.deger);
      const item = new vscode.CompletionItem(deger.deger, vscode.CompletionItemKind.Value);
      item.detail = deger.css ? `${deger.deger} → ${deger.css}` : deger.aciklama;
      item.documentation = this.dokumantasyon(
        deger.aciklama,
        `${ozellik}: ${deger.deger}`,
        deger.css ? { kategori: `CSS: ${deger.css}` } : undefined
      );
      item.sortText = `${oncelik}_${deger.deger}`;
      items.push(item);
    };
    const ekleSnippet = (etiket: string, govde: string, aciklama: string, oncelik: string): void => {
      if (eklenen.has(etiket)) return;
      eklenen.add(etiket);
      const item = new vscode.CompletionItem(etiket, vscode.CompletionItemKind.Snippet);
      item.detail = aciklama;
      item.documentation = this.dokumantasyon(aciklama, `${ozellik}: ${govde}`, {
        kategori: 'Şablon',
      });
      item.insertText = new vscode.SnippetString(govde);
      item.sortText = `${oncelik}_${etiket}`;
      items.push(item);
    };

    if (renkOzellikleri.includes(ozellik)) {
      for (const deger of renkDegerleri) ekle(deger, '0_0');
      // CSS'teki gibi doğrudan renk kodu yazma şablonları.
      ekleSnippet(
        'rgb()',
        'rgb(${1:255}, ${2:0}, ${3:0})',
        'RGB renk kodu. Kırmızı, yeşil ve mavi değerleri 0-255 arasındadır.',
        '0_1'
      );
      ekleSnippet(
        'rgba()',
        'rgba(${1:255}, ${2:0}, ${3:0}, ${4:0.5})',
        'Saydamlı RGB renk kodu. Son değer 0-1 arası saydamlıktır.',
        '0_1'
      );
      ekleSnippet('#rrggbb', '#${1:89b4fa}', 'Onaltılık (hex) renk kodu.', '0_1');
    }
    for (const deger of ozellikDegerleri[ozellik] ?? []) ekle(deger, '0_1');
    for (const deger of ortakDegerler) ekle(deger, '0_2');
    return items;
  }

  /**
   * `TürkUI.stil` bloğunda hedef olarak yazılabilecek bileşenler ve pencereler.
   *
   * Pencere hedefi, `pencere.stil(css)` ile aynı etkiyi yapar: pencerenin
   * tamamına pencere düzeyi CSS uygular.
   */
  private stilHedefOnerileri(cozum: BelgeCozumu): vscode.CompletionItem[] {
    const items: vscode.CompletionItem[] = [];
    for (const [ad, tur] of cozum.tipler) {
      if (!tur.startsWith('turkui:')) continue;
      const pencereMi = tur === 'turkui:pencere';
      const item = new vscode.CompletionItem(ad, vscode.CompletionItemKind.Variable);
      item.detail = pencereMi
        ? `${ad}( özellik: değer )   →   pencere düzeyi stil`
        : `${ad}( özellik: değer )`;
      item.documentation = this.dokumantasyon(
        pencereMi
          ? `"${ad}" penceresinin tamamına stil uygular (pencere düzeyi CSS).`
          : `"${ad}" bileşenine stil uygular.`,
        `TürkUI.stil {\n\t${ad}(\n\t\tarkaPlanRengi: mavi\n\t)\n}`
      );
      // Hedefi seçmek yalnızca adını tamamlasın; Tab ile otomatik özellik
      // şablonu açılması kullanıcının stil gövdesini yazmasını engelliyor.
      item.insertText = ad;
      // Bileşenler listede pencerelerden önce gelsin.
      item.sortText = `${pencereMi ? '0_1' : '0_0'}_${ad}`;
      items.push(item);
    }
    return items;
  }

  /** `TürkUI.betik` gövdesinde önerilen Türkçe JavaScript sözcükleri. */
  private betikOnerileri(cozum: BelgeCozumu): vscode.CompletionItem[] {
    const items: vscode.CompletionItem[] = [];
    const ekle = (
      sozcuk: BetikSozcugu,
      tur: vscode.CompletionItemKind,
      oncelik: string
    ): void => {
      const item = new vscode.CompletionItem(sozcuk.ad, tur);
      item.detail = `${sozcuk.ad} → ${sozcuk.karsilik}`;
      item.documentation = this.dokumantasyon(sozcuk.aciklama, sozcuk.ornek, {
        kategori: `JavaScript: ${sozcuk.karsilik}`,
      });
      item.sortText = `${oncelik}_${sozcuk.ad}`;
      items.push(item);
    };
    for (const sozcuk of betikAnahtarKelimeleri) {
      ekle(sozcuk, vscode.CompletionItemKind.Keyword, '0_0');
    }
    for (const sozcuk of betikGenelAdlari) {
      ekle(sozcuk, vscode.CompletionItemKind.Module, '0_1');
    }

    // Dosyadaki bileşenler ve pencereler betikte doğrudan kullanılabilir.
    for (const [ad, tur] of cozum.tipler) {
      if (!tur.startsWith('turkui:')) continue;
      const item = new vscode.CompletionItem(ad, vscode.CompletionItemKind.Variable);
      item.detail = tur === 'turkui:pencere' ? `${ad} → pencere` : `${ad} → bileşen öğesi`;
      item.sortText = `0_2_${ad}`;
      items.push(item);
    }
    return items;
  }

  /**
   * İmleç `olayDinle(` / `olayKaldır(` çağrısının olay adı metninde mi?
   *
   * Olay adları metin olarak yazıldığı için ayrı bir bağlam olarak ele alınır;
   * tamamlanan çağrılarda (`"tıklandığında", işlev)`) öneri gösterilmez.
   */
  private betikOlayBaglamindaMi(
    document: vscode.TextDocument,
    position: vscode.Position
  ): boolean {
    let metin = document.lineAt(position.line).text.slice(0, position.character);
    // Kapanmış tırnağın hemen solundaysak tırnağı at.
    if (/["']$/.test(metin)) metin = metin.slice(0, -1);
    const oncekiSatir = position.line > 0 ? document.lineAt(position.line - 1).text : '';
    const birlesik = oncekiSatir + '\n' + metin;
    return /\.\s*(?:olayDinle|olayKaldır)\s*\(\s*["']?[^"'()\n,]*$/.test(birlesik);
  }

  /** `olayDinle("` içinde önerilen Türkçe olay adları. */
  private betikOlayOnerileri(): vscode.CompletionItem[] {
    return betikOlayAdlari.map((olay) => {
      const item = new vscode.CompletionItem(olay.ad, vscode.CompletionItemKind.Event);
      item.detail = `${olay.ad} → ${olay.karsilik}`;
      item.documentation = this.dokumantasyon(olay.aciklama, olay.ornek, {
        kategori: `Olay: ${olay.karsilik}`,
      });
      item.sortText = `0_${olay.ad}`;
      return item;
    });
  }

  /** `TürkUI.betik` içinde nokta sonrası önerilen Türkçe üyeler. */
  private betikUyeOnerileri(): vscode.CompletionItem[] {
    return betikUyeAdlari.map((uye) => {
      const item = new vscode.CompletionItem(uye.ad, vscode.CompletionItemKind.Method);
      item.detail = `${uye.ad} → ${uye.karsilik}`;
      item.documentation = this.dokumantasyon(uye.aciklama, uye.ornek, {
        kategori: `JavaScript: ${uye.karsilik}`,
      });
      item.sortText = `0_${uye.ad}`;
      return item;
    });
  }

  /** Mesaj kutusu nesnesinin Türkçe üyelerini ve açıklamalarını önerir. */
  private betikOzelUyeOnerileri(uyeler: BetikSozcugu[]): vscode.CompletionItem[] {
    return uyeler.map((uye) => {
      const item = new vscode.CompletionItem(uye.ad, vscode.CompletionItemKind.Method);
      item.detail = `${uye.ad} → ${uye.karsilik}`;
      item.documentation = this.dokumantasyon(uye.aciklama, uye.ornek, {
        kategori: `TürkUI mesaj kutusu: ${uye.karsilik}`,
      });
      item.sortText = `0_${uye.ad}`;
      return item;
    });
  }

  /** İmleç `içe_aktar ` sonrasındaki modül adı konumunda mı? */
  private iceAktarBaglamindaMi(
    document: vscode.TextDocument,
    position: vscode.Position
  ): boolean {
    const once = document.lineAt(position.line).text.slice(0, position.character);
    return /^\s*içe[_ ]aktar(?:\s+["']?[A-Za-z0-9_ğüşıöçĞÜŞİÖÇ./\\-]*)?$/.test(once);
  }

  /** Yalnızca yerleşik ve yerel modülleri içeren öneri listesi. */
  private modulOnerileri(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.CompletionItem[] {
    const items: vscode.CompletionItem[] = [];
    const eklenen = new Set<string>();

    // Yazılmış yolun tamamı değiştirilsin: `araclar/ya` → `araclar/yardimci`.
    const once = document.lineAt(position.line).text.slice(0, position.character);
    const yazilan = /^\s*içe[_ ]aktar\s+([^\s]*)$/.exec(once);
    const aralik = yazilan
      ? new vscode.Range(
          position.line,
          position.character - yazilan[1].length,
          position.line,
          position.character
        )
      : undefined;

    const ekle = (
      ad: string,
      aciklama: string,
      ornek: string | undefined,
      yerel: boolean
    ): void => {
      if (eklenen.has(ad)) return;
      eklenen.add(ad);
      const item = new vscode.CompletionItem(ad, vscode.CompletionItemKind.Module);
      item.detail = yerel ? 'Yerel modül' : 'Yerleşik modül';
      item.documentation = this.dokumantasyon(aciklama, ornek);
      item.insertText = ad;
      item.sortText = `${yerel ? 1 : 0}_${ad}`;
      if (aralik) item.range = aralik;
      items.push(item);
    };

    for (const modul of YERLESIK_MODULLER) {
      if (modul.ad === 'Oyun' && !oyunModuluEtkinMi()) continue;
      ekle(modul.ad, modul.aciklama, modul.ornek, false);
    }
    for (const { ad, dosya } of this.yerelModulAdlari(document)) {
      ekle(ad, `Yerel modül. Dosya: ${dosya}`, `içe_aktar ${ad}`, true);
    }

    return items;
  }

  /**
   * Belgeyle aynı klasördeki ve proje içindeki `.tr` / `.turkod` dosyalarının
   * `içe_aktar` yolları. Alt klasörlerdeki modüller `araclar/yardimci` biçiminde
   * önerilir; böylece iki dosya alt klasörlerde olsa da bağlanabilir.
   */
  private yerelModulAdlari(
    document: vscode.TextDocument
  ): { ad: string; dosya: string }[] {
    if (document.uri.scheme !== 'file') return [];
    const klasor = path.dirname(document.uri.fsPath);
    const kendi = path.basename(document.uri.fsPath).toLocaleLowerCase('tr');
    const kok = projeKokuBul(klasor);
    const kokler = kok ? [klasor, path.join(kok, 'src'), kok] : [klasor];

    const bulunan = new Map<string, { ad: string; dosya: string }>();
    const gez = (dizin: string, derinlik: number): void => {
      if (derinlik > 3) return;
      let girdiler: fs.Dirent[];
      try {
        girdiler = fs.readdirSync(dizin, { withFileTypes: true });
      } catch {
        return;
      }
      for (const girdi of girdiler) {
        const tam = path.join(dizin, girdi.name);
        if (girdi.isDirectory()) {
          if (girdi.name.startsWith('.') || girdi.name === 'node_modules') continue;
          gez(tam, derinlik + 1);
          continue;
        }
        const uzanti = path.extname(girdi.name).toLocaleLowerCase('tr');
        if (uzanti !== '.tr' && uzanti !== '.turkod') continue;
        if (girdi.name.toLocaleLowerCase('tr') === kendi) continue;
        const ad = path.basename(girdi.name, path.extname(girdi.name));
        if (!MODUL_ADI.test(ad)) continue;

        const yaz = (yol: string): string =>
          path.relative(klasor, yol).replace(/\\/g, '/').replace(/\.(?:tr|turkod)$/i, '');
        let goreli = yaz(tam);
        // Proje kökü varsa ve dosya kaynak klasörünün dışındaysa kökten yazılır.
        if (goreli.startsWith('../') && kok) {
          goreli = path
            .relative(kok, tam)
            .replace(/\\/g, '/')
            .replace(/\.(?:tr|turkod)$/i, '');
        }
        const anahtar = goreli.toLocaleLowerCase('tr');
        if (!bulunan.has(anahtar)) bulunan.set(anahtar, { ad: goreli, dosya: tam });
      }
    };
    for (const dizin of kokler) gez(dizin, 0);

    return [...bulunan.values()].sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));
  }

  private kullaniciSembolleri(
    document: vscode.TextDocument,
    cozum: BelgeCozumu,
    items: vscode.CompletionItem[]
  ): KullaniciSembolleri {
    const metin = document.getText();
    const adlar = new Set<string>();
    const fonksiyonlar = new Set<string>();

    const ekle = (
      ad: string,
      item: vscode.CompletionItem,
      fonksiyon = false
    ): void => {
      if (adlar.has(ad)) return;
      adlar.add(ad);
      if (fonksiyon) fonksiyonlar.add(ad);
      items.push(item);
    };

    const fonksiyonRe = new RegExp(
      `^\\s*(?:dışa_aktar\\s+)?fonksiyon\\s+(${TANIMLAYICI})\\s*\\(([^)]*)\\)`,
      'gm'
    );
    for (const m of metin.matchAll(fonksiyonRe)) {
      const ad = m[1];
      const parametreler = this.parametreler(m[2]);
      const item = new vscode.CompletionItem(ad, vscode.CompletionItemKind.Function);
      item.detail = `Fonksiyon(${parametreler.join(', ')})`;
      item.documentation = new vscode.MarkdownString('Bu dosyada tanımlı fonksiyon.');
      item.insertText = new vscode.SnippetString(this.parametreSnippet(ad, parametreler));
      item.sortText = `0_${ad}`;
      ekle(ad, item, true);

      for (const parametre of parametreler) {
        const pItem = new vscode.CompletionItem(parametre, vscode.CompletionItemKind.Variable);
        pItem.detail = 'Fonksiyon parametresi';
        pItem.sortText = `0_${parametre}`;
        ekle(parametre, pItem);
      }
    }

    const nesneRe = new RegExp(
      `^\\s*(?:dışa_aktar\\s+)?nesne\\s+(${TANIMLAYICI})`,
      'gm'
    );
    for (const m of metin.matchAll(nesneRe)) {
      const ad = m[1];
      const item = new vscode.CompletionItem(ad, vscode.CompletionItemKind.Class);
      item.detail = 'Nesne';
      item.documentation = new vscode.MarkdownString('Bu dosyada tanımlı nesne türü.');
      item.sortText = `0_${ad}`;
      ekle(ad, item);
    }

    const degiskenRe = new RegExp(
      `^\\s*(?:dışa_aktar\\s+)?(değişken|OndalıklıDeğişken)\\s+(${TANIMLAYICI})`,
      'gm'
    );
    for (const m of metin.matchAll(degiskenRe)) {
      const ad = m[2];
      const tur = cozum.tipler.get(ad) ?? (m[1] === 'OndalıklıDeğişken' ? 'sayi' : 'bilinmiyor');
      const item = new vscode.CompletionItem(ad, vscode.CompletionItemKind.Variable);
      item.detail = `Değişken: ${this.turEtiketi(tur)}`;
      item.sortText = `0_${ad}`;
      ekle(ad, item);
    }

    const donguRe = new RegExp(
      `^\\s*için\\s+(${TANIMLAYICI})(?:\\s*,\\s*(${TANIMLAYICI}))?\\s+içinde`,
      'gm'
    );
    for (const m of metin.matchAll(donguRe)) {
      for (const ad of [m[1], m[2]]) {
        if (!ad) continue;
        const item = new vscode.CompletionItem(ad, vscode.CompletionItemKind.Variable);
        item.detail = 'Döngü değişkeni';
        item.sortText = `0_${ad}`;
        ekle(ad, item);
      }
    }

    const yakalaRe = new RegExp(`^\\s*yakala\\s+(${TANIMLAYICI})`, 'gm');
    for (const m of metin.matchAll(yakalaRe)) {
      const ad = m[1];
      const item = new vscode.CompletionItem(ad, vscode.CompletionItemKind.Variable);
      item.detail = 'Hata değişkeni';
      item.sortText = `0_${ad}`;
      ekle(ad, item);
    }

    for (const modul of this.iceAktarilanModuller(document)) {
      if (adlar.has(modul.ad)) continue;
      const item = new vscode.CompletionItem(modul.ad, vscode.CompletionItemKind.Module);
      item.detail = 'İçe aktarılmış yerel modül';
      item.documentation = this.dokumantasyon(
        `\`${path.basename(modul.dosya)}\` dosyasındaki fonksiyonlara erişir.`,
        `${modul.ad}.fonksiyonAdi()`
      );
      item.sortText = `0_${modul.ad}`;
      ekle(modul.ad, item);
    }

    return { adlar, fonksiyonlar };
  }

  private anahtarKelimeOnerileri(
    items: vscode.CompletionItem[]
  ): void {
    for (const k of anahtarKelimeler) {
      // Bu iki blok `snippets/turkod.json` içindeki Tab şablonlarıyla açılır.
      // Completion da aynı anda şablon eklerse `TürkUI.stil`/`betik` iki kez
      // yazılabiliyor; bunları normal anahtar kelime önerisi olarak sunma.
      if (k.ad === 'stil' || k.ad === 'betik') continue;
      const item = new vscode.CompletionItem(k.ad, vscode.CompletionItemKind.Keyword);
      item.detail = 'Anahtar kelime';
      item.documentation = this.dokumantasyon(k.aciklama, k.ornek);
      if (k.snippet) item.insertText = new vscode.SnippetString(k.snippet);
      item.sortText = `1_${k.ad}`;
      items.push(item);
    }

    for (const k of mantiksalOperatorler) {
      const item = new vscode.CompletionItem(k.ad, vscode.CompletionItemKind.Operator);
      item.detail = 'Mantıksal operatör';
      item.documentation = this.dokumantasyon(k.aciklama, k.ornek);
      item.sortText = `1_${k.ad}`;
      items.push(item);
    }
  }

  private sabitOnerileri(
    items: vscode.CompletionItem[],
    kullaniciAdlari: Set<string>
  ): void {
    for (const s of sabitler) {
      if (kullaniciAdlari.has(s.ad)) continue;
      const item = new vscode.CompletionItem(s.ad, vscode.CompletionItemKind.Constant);
      item.detail = 'Sabit';
      item.documentation = this.dokumantasyon(s.aciklama, s.ornek);
      item.sortText = `2_${s.ad}`;
      items.push(item);
    }
  }

  private yerlesikKomutOnerileri(
    items: vscode.CompletionItem[],
    kullaniciAdlari: Set<string>
  ): void {
    for (const k of yerlesikKomutlar) {
      if (kullaniciAdlari.has(k.ad)) continue;
      const item = new vscode.CompletionItem(k.ad, vscode.CompletionItemKind.Function);
      item.detail = k.imza;
      item.documentation = this.dokumantasyon(k.aciklama, k.ornek, {
        imza: k.imza,
        kategori: k.kategori,
      });
      item.insertText = new vscode.SnippetString(this.komutSnippet(k));
      item.sortText = `3_${k.ad}`;
      if (k.takmaAdlar && k.takmaAdlar.length > 0) {
        item.filterText = `${k.ad} ${k.takmaAdlar.join(' ')}`;
      }
      items.push(item);
    }
  }

  private uyeOnerileri(
    document: vscode.TextDocument,
    position: vscode.Position,
    cozum: BelgeCozumu
  ): vscode.CompletionItem[] {
    const once = document.lineAt(position.line).text.slice(0, position.character);
    const m = new RegExp(`(${TANIMLAYICI})\\s*\\.\\s*[${KELIME}]*$`).exec(once);
    if (!m) return [];

    const ad = m[1];
    if (oyunModuluEtkinMi() && this.kucult(ad) === 'oyun') return this.oyunModulUyeOnerileri();
    if (ad === 'mesajKutusu') return this.betikOzelUyeOnerileri(mesajKutusuUyeAdlari);
    if (turkuiAdiMi(ad)) {
      return turkuiIceAktarildiMi(document.getText()) ? this.turkuiOnerileri(turkuiUyeleri) : [];
    }
    if (zamanAdiMi(ad)) return this.turkuiOnerileri(zamanUyeleri);
    if (ad === 'renk') return this.turkuiOnerileri(turkuiRenkUyeleri);
    const modulDosyasi = this.iceAktarilanModulDosyasi(document, ad);
    if (modulDosyasi) return this.modulUyeOnerileri(modulDosyasi, document);
    if (ad === 'sayısal' || ad === 'sayisal') {
      const items: vscode.CompletionItem[] = [];
      const ekle = (isim: string, aciklama: string, imza: string) => {
        const item = new vscode.CompletionItem(isim, vscode.CompletionItemKind.Method);
        item.detail = imza;
        item.documentation = new vscode.MarkdownString(aciklama);
        item.insertText = new vscode.SnippetString(`${isim}(\${1:soru})`);
        item.sortText = `0_${isim}`;
        items.push(item);
      };
      ekle('iste', 'Sayısal girdi alır (soru string, dönüş sayı).', 'iste(soru: metin)');
      ekle('oku', 'Sayısal girdi alır (soru string, dönüş sayı).', 'oku(soru: metin)');
      return items;
    }

    const tur = cozum.tipler.get(m[1]);
    if (!tur) return [];

    if (tur === 'turkui:pencere') return this.turkuiOnerileri(turkuiPencereUyeleri);
    if (tur.startsWith('turkui:')) {
      return this.turkuiOnerileri(turkuiBilesenUyeleri(tur.slice('turkui:'.length)));
    }

    const items: vscode.CompletionItem[] = [];

    if (tur.startsWith('nesne:')) {
      const nesneAdi = tur.slice('nesne:'.length);
      for (const uye of cozum.nesneler.get(nesneAdi) ?? []) {
        const item = new vscode.CompletionItem(
          uye.ad,
          uye.tur === 'fonksiyon'
            ? vscode.CompletionItemKind.Method
            : vscode.CompletionItemKind.Field
        );
        item.detail =
          uye.tur === 'fonksiyon'
            ? `${uye.ad}(${uye.parametreler.join(', ')})`
            : 'Özellik';
        item.documentation = this.dokumantasyon(
          `${nesneAdi} nesnesinin ${uye.tur === 'fonksiyon' ? 'metodu' : 'özelliği'}.`,
          undefined,
          uye.tur === 'fonksiyon' ? { imza: `${uye.ad}(${uye.parametreler.join(', ')})` } : undefined
        );
        if (uye.tur === 'fonksiyon') {
          item.insertText = new vscode.SnippetString(
            this.parametreSnippet(uye.ad, uye.parametreler)
          );
        }
        item.sortText = `0_${uye.ad}`;
        items.push(item);
      }
      return items;
    }

    let metotlar: MetotVerisi[] = [];
    if (tur === 'metin') metotlar = metinMetotlari;
    else if (tur === 'liste') metotlar = listeMetotlari;
    else if (tur === 'sozluk') metotlar = sozlukMetotlari;
    else if (tur === 'kume') metotlar = kumeMetotlari;

    for (const metot of metotlar) {
      const item = new vscode.CompletionItem(metot.ad, vscode.CompletionItemKind.Method);
      item.detail = `${metot.ad}(${metot.parametreler.join(', ')})`;
      item.documentation = this.dokumantasyon(metot.aciklama, undefined, {
        imza: `${metot.ad}(${metot.parametreler.join(', ')})`,
      });
      item.insertText = new vscode.SnippetString(
        this.parametreSnippet(metot.ad, metot.parametreler)
      );
      item.sortText = `0_${metot.ad}`;
      items.push(item);
    }

    return items;
  }

  private oyunModulUyeOnerileri(): vscode.CompletionItem[] {
    const item = new vscode.CompletionItem('sahne', vscode.CompletionItemKind.Snippet);
    item.detail = 'sahne { zemin(); oyuncu(); küp( ... ) }';
    item.documentation = this.dokumantasyon(
      'WASD ve fareyle kontrol edilen oyunculu 3D sahne oluşturur.',
      'Oyun.sahne {\n\tzemin()\n\toyuncu()\n\tküp(\n\t\trenk: turuncu\n\t\tkonum: (0, 0, 4)\n\t\tboyut: (1, 1, 1)\n\t)\n}'
    );
    item.insertText = new vscode.SnippetString(
      'sahne {\n\tzemin()\n\toyuncu()\n\tküp(\n\t\trenk: ${1:turuncu}\n\t\tkonum: ${2:(0, 0, 4)}\n\t\tboyut: ${3:(1, 1, 1)}\n\t)\n}'
    );
    item.sortText = '0_sahne';
    return [item];
  }

  private oyunSahneBaglami(
    document: vscode.TextDocument,
    position: vscode.Position
  ): { nesneTuru?: 'küp' | 'küre' | 'duvar' | 'zemin' | 'oyuncu' | 'ışık' | 'gökyüzü'; renkDegeri: boolean } | undefined {
    const satirlar = document.getText().split(/\r?\n/).slice(0, position.line);
    satirlar.push((document.lineAt(position.line).text ?? '').slice(0, position.character));
    const metin = satirlar.join('\n');
    const blokRe = /Oyun\s*\.\s*sahne\s*\{/gi;
    let blok: RegExpExecArray | null;
    let sonBlok: RegExpExecArray | null = null;
    while ((blok = blokRe.exec(metin)) !== null) sonBlok = blok;
    if (!sonBlok) return undefined;
    const govde = metin.slice(sonBlok.index + sonBlok[0].length);
    let suslu = 1;
    for (const karakter of govde) {
      if (karakter === '{') suslu++;
      else if (karakter === '}') suslu--;
    }
    if (suslu <= 0) return undefined;
    const nesneRe = /(küp|küre|duvar|zemin|oyuncu|ışık|gökyüzü)\s*\(/gi;
    let nesne: RegExpExecArray | null;
    let sonNesne: RegExpExecArray | null = null;
    while ((nesne = nesneRe.exec(govde)) !== null) sonNesne = nesne;
    let nesneTuru: 'küp' | 'küre' | 'duvar' | 'zemin' | 'oyuncu' | 'ışık' | 'gökyüzü' | undefined;
    if (sonNesne) {
      let derinlik = 1;
      for (const karakter of govde.slice(sonNesne.index + sonNesne[0].length)) {
      if (karakter === '(') derinlik++;
        else if (karakter === ')') derinlik--;
      }
      if (derinlik > 0) nesneTuru = sonNesne[1] as 'küp' | 'zemin' | 'oyuncu';
    }
    const aktif = metin.slice(metin.lastIndexOf('\n') + 1);
    return {
      nesneTuru,
      renkDegeri: nesneTuru !== 'oyuncu' && !!nesneTuru && /^\s*renk\s*:\s*[^\s]*$/i.test(aktif),
    };
  }

  private oyunSahneIcerikOnerileri(
    baglam: { nesneTuru?: 'küp' | 'küre' | 'duvar' | 'zemin' | 'oyuncu' | 'ışık' | 'gökyüzü'; renkDegeri: boolean }
  ): vscode.CompletionItem[] {
    const secenek = (ad: string, tur: vscode.CompletionItemKind, aciklama: string): vscode.CompletionItem => {
      const item = new vscode.CompletionItem(ad, tur);
      item.detail = aciklama;
      item.sortText = `0_${ad}`;
      return item;
    };
    if (baglam.renkDegeri) {
      return ['turuncu', 'kırmızı', 'yeşil', 'mavi', 'sarı', 'mor', 'beyaz', 'siyah', 'turkuaz', 'pembe', 'kahverengi', 'gri', 'lacivert', 'lime']
        .map((renk) => secenek(renk, vscode.CompletionItemKind.Color, 'Ursina sahne rengi'));
    }
    if (baglam.nesneTuru) {
      if (baglam.nesneTuru === 'oyuncu') {
        return [
          secenek('konum', vscode.CompletionItemKind.Property, 'Başlangıç konumu: (x, y, z)'),
          secenek('hız', vscode.CompletionItemKind.Property, 'Yürüme hızı: varsayılan 6'),
          secenek('sıçrama', vscode.CompletionItemKind.Property, 'Zıplama gücü: varsayılan 7'),
        ];
      }
      if (baglam.nesneTuru === 'ışık' || baglam.nesneTuru === 'gökyüzü') return [
        secenek('renk', vscode.CompletionItemKind.Property, 'Ortam rengi'),
        secenek('konum', vscode.CompletionItemKind.Property, 'Konum: (x, y, z)'),
      ];
      return [
        secenek('renk', vscode.CompletionItemKind.Property, 'Nesne rengi'),
        secenek('konum', vscode.CompletionItemKind.Property, 'Konum: (x, y, z)'),
        secenek('boyut', vscode.CompletionItemKind.Property, 'Boyut: (x, y, z)'),
        secenek('dönüş', vscode.CompletionItemKind.Property, 'Dönüş açıları: (x, y, z)'),
        secenek('doku', vscode.CompletionItemKind.Property, 'Ursina doku/asset adı: "brick" gibi'),
        secenek('çarpışma', vscode.CompletionItemKind.Property, 'Çarpışma biçimi: kutu, küre veya yok'),
        secenek('model', vscode.CompletionItemKind.Property, 'Model: küp, küre, silindir, kapsül, düzlem'),
      ];
    }
    const zemin = secenek('zemin', vscode.CompletionItemKind.Snippet, 'Yürünebilir zemin oluşturur');
    zemin.insertText = new vscode.SnippetString('zemin(\n\trenk: ${1:yeşil}\n\tkonum: ${2:(0, -0.5, 0)}\n\tboyut: ${3:(30, 1, 30)}\n)');
    const oyuncu = secenek('oyuncu', vscode.CompletionItemKind.Snippet, 'WASD ve fareyle kontrol edilen oyuncu ekler');
    oyuncu.insertText = new vscode.SnippetString('oyuncu(\n\tkonum: ${1:(0, 1, 0)}\n)');
    const kup = secenek('küp', vscode.CompletionItemKind.Snippet, '3D küp ekler');
    kup.insertText = new vscode.SnippetString('küp(\n\trenk: ${1:turuncu}\n\tkonum: ${2:(0, 0, 4)}\n\tboyut: ${3:(1, 1, 1)}\n)');
    const secenekler: vscode.CompletionItem[] = [oyuncu, zemin, kup];
    const tanimla = (ad: string, varsayilanRenk: string, aciklama: string) => {
      const oge = secenek(ad, vscode.CompletionItemKind.Snippet, aciklama);
      oge.insertText = new vscode.SnippetString(`${ad}(\n\trenk: \${1:${varsayilanRenk}}\n\tkonum: \${2:(0, 0, 4)}\n\tboyut: \${3:(1, 1, 1)}\n)`);
      secenekler.push(oge);
    };
    tanimla('küre', 'mavi', 'Çarpışma algılayan 3D küre ekler');
    tanimla('duvar', 'gri', 'Yürüyüş yolunda çarpışma algılayan duvar ekler');
    tanimla('ışık', 'beyaz', 'Yönlü sahne ışığı ekler');
    tanimla('gökyüzü', 'mavi', 'Sahne gökyüzü rengini ayarlar');
    return secenekler;
  }

  /** İçe aktarılan yerel modülün nokta sonrası adını çözer. */
  private iceAktarilanModulDosyasi(
    document: vscode.TextDocument,
    uyeNesnesi: string
  ): string | undefined {
    return this.iceAktarilanModuller(document).find(
      (aday) => this.kucult(aday.ad) === this.kucult(uyeNesnesi)
    )?.dosya;
  }

  private iceAktarilanModuller(document: vscode.TextDocument): { ad: string; dosya: string }[] {
    if (document.uri.scheme !== 'file') return [];
    const moduller: { ad: string; dosya: string }[] = [];
    const importRe = /^\s*içe[_ ]aktar\s+(?:"([^"]+)"|'([^']+)'|([^\s#]+))/gm;
    let m: RegExpExecArray | null;
    while ((m = importRe.exec(document.getText())) !== null) {
      const yol = m[1] ?? m[2] ?? m[3];
      if (!yol || turkuiAdiMi(yol)) continue;
      const parca = path.basename(yol.replace(/\.(?:tr|turkod)$/i, '').replace(/\\/g, '/'));
      const takmaAd = parca ? parca.charAt(0).toLocaleLowerCase('tr-TR') + parca.slice(1) : '';
      if (!takmaAd) continue;
      const dosya =
        modulDosyasiBul(yol, path.dirname(document.uri.fsPath)) ?? this.acikModulDosyasiBul(parca);
      if (dosya && !moduller.some((aday) => this.kucult(aday.ad) === this.kucult(takmaAd))) {
        moduller.push({ ad: takmaAd, dosya });
      }
    }
    return moduller;
  }

  /** Yerel modülün dışa açık fonksiyonlarını tamamlama öğelerine dönüştürür. */
  private modulUyeOnerileri(dosya: string, etkinBelge?: vscode.TextDocument): vscode.CompletionItem[] {
    let kaynak: string;
    try {
      const acikBelge = [etkinBelge, ...(vscode.workspace.textDocuments ?? [])].find(
        (belge) =>
          belge?.uri.scheme === 'file' &&
          path.resolve(belge.uri.fsPath).toLocaleLowerCase('tr') ===
            path.resolve(dosya).toLocaleLowerCase('tr')
      );
      kaynak = (acikBelge ? acikBelge.getText() : fs.readFileSync(dosya, 'utf8')).replace(/^\uFEFF/, '');
    } catch {
      return [];
    }
    const items: vscode.CompletionItem[] = [];
    const fonksiyonRe = /^\s*(?:dışa_aktar\s+)?fonksiyon\s+([A-Za-z_ğüşıöçĞÜŞİÖÇ][\wğüşıöçĞÜŞİÖÇ]*)\s*\(([^)]*)\)/gm;
    for (const m of kaynak.matchAll(fonksiyonRe)) {
      const ad = m[1];
      const parametreler = this.parametreler(m[2]);
      const item = new vscode.CompletionItem(ad, vscode.CompletionItemKind.Method);
      item.detail = `${ad}(${parametreler.join(', ')}) · ${path.basename(dosya)}`;
      item.documentation = this.dokumantasyon(
        `\`${path.basename(dosya)}\` dosyasından içe aktarılan fonksiyon.`,
        undefined,
        { imza: `${ad}(${parametreler.join(', ')})` }
      );
      item.insertText = new vscode.SnippetString(this.parametreSnippet(ad, parametreler));
      item.sortText = `0_${ad}`;
      items.push(item);
    }
    return items;
  }

  /** Dosya diske kaydedilmemiş olsa da açık modül sekmesini bulur. */
  private acikModulDosyasiBul(modulAdi: string): string | undefined {
    const uzantisiz = this.kucult(path.basename(modulAdi).replace(/\.(?:tr|turkod)$/i, ''));
    return (vscode.workspace.textDocuments ?? []).find((belge) => {
      if (belge.uri.scheme !== 'file') return false;
      const dosyaAdi = this.kucult(path.basename(belge.uri.fsPath).replace(/\.(?:tr|turkod)$/i, ''));
      return dosyaAdi === uzantisiz;
    })?.uri.fsPath;
  }

  /**
   * TürkUI üyelerini tamamlama öğelerine çevirir.
   *
   * Liste görsel bileşen (nesne) içeriyorsa sıralama şöyledir: nesneler en
   * üstte, kendi aralarında Türkçe alfabetik; kalan üyeler (pencere komutları
   * ve özellikleri) arkalarında yine alfabetik. Nesneler farklı bir simgeyle
   * (`Class`) gösterilir; diğerleri `Method`/`Property`/`Snippet` simgesini korur.
   *
   * Bileşen içermeyen listelerde (`TürkUI.`, `renk.`, bileşen üyeleri) eski
   * davranış korunur: öğeler ada göre sıralanır.
   */
  private turkuiOnerileri(uyeler: TurkuiUyeVerisi[]): vscode.CompletionItem[] {
    const bilesenVar = uyeler.some((uye) => uye.bilesen === true);
    const sirali = bilesenVar
      ? [...uyeler].sort((a, b) => {
          const aBilesen = a.bilesen === true ? 0 : 1;
          const bBilesen = b.bilesen === true ? 0 : 1;
          if (aBilesen !== bBilesen) return aBilesen - bBilesen;
          return a.ad.localeCompare(b.ad, 'tr');
        })
      : uyeler;

    return sirali.map((uye, sira) => {
      const blokMu = uye.tur === 'blok';
      const ozellikMi = uye.tur === 'özellik';
      const item = new vscode.CompletionItem(
        uye.ad,
        uye.bilesen === true
          ? vscode.CompletionItemKind.Class
          : blokMu
            ? vscode.CompletionItemKind.Snippet
            : ozellikMi
              ? vscode.CompletionItemKind.Property
              : vscode.CompletionItemKind.Method
      );
      item.detail = uye.imza;
      item.documentation = new vscode.MarkdownString(uye.aciklama);
      if (blokMu) {
        item.insertText = new vscode.SnippetString(uye.snippet ?? uye.ad);
      } else if (!ozellikMi) {
        item.insertText = new vscode.SnippetString(
          this.parametreSnippet(uye.ad, uye.parametreler ?? [])
        );
      }
      // Sıra numarası doğrudan `sortText`e yazılır: VS Code listeyi yeniden
      // sıralamaz, bileşenler üstte ve alfabetik düzen korunur.
      item.sortText = bilesenVar ? `0_${String(sira).padStart(3, '0')}` : `0_${uye.ad}`;
      return item;
    });
  }

  /** `Zaman` modülünün tek öneri öğesinde gösterilen toplu belge. */
  private zamanModulBelgesi(): vscode.MarkdownString {
    const md = new vscode.MarkdownString(undefined, true);
    md.appendMarkdown('**Zaman · yerleşik tarih ve saat modülü**\n\n');
    md.appendMarkdown(
      'Tarihleri biçimlendirir, aritmetik yapar, karşılaştırır ve ölçer. ' +
        '`Zaman.` yazınca modül üyeleri listelenir.\n\n'
    );
    md.appendMarkdown('**Modül üyeleri**\n\n');
    md.appendMarkdown(zamanUyeleri.map((uye) => `- \`${uye.imza}\``).join('\n'));
    md.appendMarkdown('\n\n**Örnek**\n');
    md.appendCodeblock(
      [
        'içe_aktar Zaman',
        '',
        'yazdır(Zaman.biçimle("17.10.2026", "gg AA yyyy, GünAdı"))',
        'yazdır(Zaman.ekle("17.10.2026", 1, "ay"))',
        'yazdır(Zaman.süreMetni(3725000))',
      ].join('\n'),
      'turkod'
    );
    return md;
  }

  /** `TürkUI` modülünün tek öneri öğesinde gösterilen toplu belge. */
  private turkuiModulBelgesi(): vscode.MarkdownString {
    const md = new vscode.MarkdownString(undefined, true);
    md.appendMarkdown('**TürkUI · yerleşik arayüz modülü**\n\n');
    md.appendMarkdown(
      'Pencere açar, bileşen üretir ve olayları yönetir. `TürkUI.` yazınca modül üyeleri, ' +
        '`pencere.` yazınca bileşenler listelenir.\n\n'
    );
    md.appendMarkdown('**Modül üyeleri**\n\n');
    md.appendMarkdown(turkuiUyeleri.map((uye) => `- \`${uye.imza}\``).join('\n'));
    md.appendMarkdown('\n\n**Pencere bileşenleri**\n');
    md.appendMarkdown(TURKUI_BILESENLERI.map((ad) => `\`${ad}\``).join(' · '));
    md.appendMarkdown('\n\n**Örnek**\n');
    md.appendCodeblock(
      [
        'içe_aktar TürkUI',
        '',
        'değişken uygulama := TürkUI.pencere("Başlık")',
        'değişken düğme := uygulama.buton("Tamam")',
        '',
        'düğme.tıklandığında',
        '    yazdır("Merhaba")',
        'son',
        '',
        'uygulama.göster()',
      ].join('\n'),
      'turkod'
    );
    return md;
  }

  private belgeleriCoz(document: vscode.TextDocument): BelgeCozumu {
    const satirlar = document.getText().split(/\r?\n/);
    const tipler = new Map<string, CozumTipi>();
    const ham = new Map<string, string>();
    const nesneAdlari = new Set<string>();
    const nesneler = new Map<string, NesneUyesi[]>();

    const nesneSatiri = new RegExp(`^\\s*nesne\\s+(${TANIMLAYICI})\\s*$`);
    for (let i = 0; i < satirlar.length; i++) {
      const m = nesneSatiri.exec(satirlar[i]);
      if (!m) continue;
      nesneAdlari.add(m[1]);
      nesneler.set(m[1], this.nesneUyeleri(satirlar, i));
    }

    const degiskenSatiri = new RegExp(
      `^\\s*(?:dışa_aktar\\s+)?(değişken|OndalıklıDeğişken)\\s+(${TANIMLAYICI})\\s*(?::=|=(?!=|>))\\s*(.*)$`
    );
    for (const satir of satirlar) {
      const m = degiskenSatiri.exec(satir);
      if (!m) continue;
      if (m[1] === 'OndalıklıDeğişken') {
        tipler.set(m[2], 'sayi');
      } else {
        ham.set(m[2], m[3].trim());
      }
    }

    const tanimlayiciTeki = new RegExp(`^(${TANIMLAYICI})$`);
    for (let tur = 0; tur < 4; tur++) {
      for (const [ad, deger] of ham) {
        if (tipler.has(ad)) continue;
        const tek = tanimlayiciTeki.exec(deger);
        if (tek && ham.has(tek[1]) && !tipler.has(tek[1])) continue;
        tipler.set(ad, this.degerTipi(deger, tipler, nesneAdlari));
      }
    }
    for (const ad of ham.keys()) {
      if (!tipler.has(ad)) tipler.set(ad, 'bilinmiyor');
    }

    return { tipler, nesneler };
  }

  private degerTipi(
    deger: string,
    tipler: Map<string, CozumTipi>,
    nesneAdlari: Set<string>
  ): CozumTipi {
    const d = deger.trim();
    if (d.startsWith('"')) return 'metin';
    if (d.startsWith('[')) return 'liste';
    if (d.startsWith('{')) {
      const ic = d.slice(1).trimStart();
      if (!ic) return 'kume';
      if (ic.startsWith('"')) {
        const kapanis = ic.indexOf('"', 1);
        const sonra = kapanis >= 0 ? ic.slice(kapanis + 1).trimStart() : '';
        return sonra.startsWith(':') ? 'sozluk' : 'kume';
      }
      if (new RegExp(`^${TANIMLAYICI}\\s*:`).test(ic)) return 'sozluk';
      return 'kume';
    }

    const cagri = new RegExp(`^(${TANIMLAYICI})\\s*\\(`).exec(d);
    if (cagri && nesneAdlari.has(cagri[1])) return `nesne:${cagri[1]}`;

    const turkuiPencere = new RegExp(`^(${TANIMLAYICI})\\s*\\.\\s*pencere\\s*\\(`).exec(d);
    if (turkuiPencere && turkuiAdiMi(turkuiPencere[1])) return 'turkui:pencere';
    const bilesen = new RegExp(
      `^(${TANIMLAYICI})\\s*\\.\\s*(${TURKUI_BILESENLERI.join('|')})\\s*\\(`
    ).exec(d);
    if (bilesen && tipler.get(bilesen[1]) === 'turkui:pencere') return `turkui:${bilesen[2]}`;

    const tek = new RegExp(`^(${TANIMLAYICI})$`).exec(d);
    if (tek && tipler.has(tek[1])) return tipler.get(tek[1])!;

    if (/^-?\d/.test(d)) return 'sayi';
    return 'bilinmiyor';
  }

  private nesneUyeleri(satirlar: string[], baslangic: number): NesneUyesi[] {
    const uyeler: NesneUyesi[] = [];
    const temelGirinti = (satirlar[baslangic].match(/^\s*/) ?? [''])[0].length;
    let uyeGirinti: number | null = null;

    for (let i = baslangic + 1; i < satirlar.length; i++) {
      const satir = satirlar[i];
      const kirp = satir.trim();
      if (!kirp || kirp.startsWith('#')) continue;

      const girinti = (satir.match(/^\s*/) ?? [''])[0].length;
      if (kirp === 'son' && girinti <= temelGirinti) break;
      if (girinti <= temelGirinti) continue;

      if (uyeGirinti === null) uyeGirinti = girinti;
      if (girinti !== uyeGirinti) continue;

      const fonksiyon = new RegExp(
        `^fonksiyon\\s+(${TANIMLAYICI})\\s*\\(([^)]*)\\)`
      ).exec(kirp);
      if (fonksiyon) {
        uyeler.push({
          ad: fonksiyon[1],
          tur: 'fonksiyon',
          parametreler: this.parametreler(fonksiyon[2]),
        });
        continue;
      }

      const degisken = new RegExp(`^değişken\\s+(${TANIMLAYICI})`).exec(kirp);
      if (degisken) {
        uyeler.push({ ad: degisken[1], tur: 'değişken', parametreler: [] });
      }
    }

    return uyeler;
  }

  private parametreler(metin: string): string[] {
    if (!metin.trim()) return [];
    return metin
      .split(',')
      .map((p) => {
        const temiz = p.split(':=')[0].trim();
        const m = new RegExp(`^(${TANIMLAYICI})$`).exec(temiz);
        return m ? m[1] : temiz;
      })
      .filter(Boolean);
  }

  private parametreSnippet(ad: string, parametreler: string[]): string {
    if (parametreler.length === 0) return `${ad}()`;
    return `${ad}(${parametreler
      .map((p, i) => `\${${i + 1}:${p}}`)
      .join(', ')})`;
  }

  private komutSnippet(k: YerlesikKomutVerisi): string {
    const ilk = k.imza.split('·')[0].trim();
    const ac = ilk.indexOf('(');
    if (ac === -1) return k.ad;

    const kapat = ilk.lastIndexOf(')');
    const ic = kapat > ac ? ilk.slice(ac + 1, kapat) : '';
    const parametreler = ic
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    const adet = Math.min(Math.max(k.minArg, 0), parametreler.length);
    if (adet === 0) return `${k.ad}()`;

    const yerler = parametreler.slice(0, adet).map((p, i) => {
      let ad = p.split(':=')[0].trim();
      ad = ad
        .replace(/^\.\.\./, '')
        .replace(/^["']/, '')
        .replace(/["']$/, '')
        .replace(/[.${}\\]/g, '')
        .trim();
      if (!ad) ad = `arg${i + 1}`;
      return `\${${i + 1}:${ad}}`;
    });

    return `${k.ad}(${yerler.join(', ')})`;
  }

  /**
   * Öneri listesinin yanındaki ayrıntı bölmesinde görünen belge.
   * İmza, açıklama, kategori ve örnek burada birlikte gösterilir.
   */
  private dokumantasyon(
    aciklama: string,
    ornek?: string,
    ek?: { imza?: string; kategori?: string }
  ): vscode.MarkdownString {
    const md = new vscode.MarkdownString(undefined, true);
    if (ek?.imza) md.appendCodeblock(ek.imza, 'turkod');
    md.appendText(aciklama);
    if (ek?.kategori) md.appendMarkdown(`\n\n*${ek.kategori}*`);
    if (ornek) {
      md.appendMarkdown('\n\n**Örnek**\n');
      md.appendCodeblock(ornek, 'turkod');
    }
    return md;
  }

  /** Türkçe küçük harfe çevirir (`İ` → `i`); ad karşılaştırmalarında kullanılır. */
  private kucult(metin: string): string {
    return metin.replace(/İ/g, 'i').toLowerCase();
  }

  private turEtiketi(tur: CozumTipi): string {
    switch (tur) {
      case 'metin':
        return 'Metin';
      case 'liste':
        return 'Liste';
      case 'sozluk':
        return 'Sözlük';
      case 'kume':
        return 'Küme';
      case 'sayi':
        return 'Sayı';
      case 'bilinmiyor':
        return 'Bilinmiyor';
      default:
        if (tur === 'turkui:pencere') return 'TürkUI penceresi';
        if (tur.startsWith('turkui:')) return `TürkUI ${tur.slice('turkui:'.length)} bileşeni`;
        return tur.slice('nesne:'.length);
    }
  }
}
