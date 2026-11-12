import { yerlesikKomutlar } from './veri/yerlesikKomutlar';
import { anahtarKelimeler, mantiksalOperatorler, sabitler } from './veri/anahtarKelimeler';
import {
  metinMetotlari,
  listeMetotlari,
  sozlukMetotlari,
  kumeMetotlari,
} from './veri/metotlar';
import { betikSozdizimiHatasi } from './veri/betikCeviri';
import { MODUL_IFADESI, modulYoluTemizle } from './calistir';

/** VS Code'dan bağımsız tanı türü; `extension.ts` bunu `vscode.Diagnostic`e çevirir. */
export type SorunOnemi = 'hata' | 'uyari';

export interface TurkodSorun {
  /** 0 tabanlı satır numarası. */
  satir: number;
  /** 0 tabanlı başlangıç sütunu. */
  baslangic: number;
  /** 0 tabanlı bitiş sütunu (hariç). */
  bitis: number;
  mesaj: string;
  onem: SorunOnemi;
}

const KELIME = 'A-Za-z0-9_ğüşıöçĞÜŞİÖÇ';
const BAS = '[A-Za-z_ğüşıöçĞÜŞİÖÇ]';
const TANIMLAYICI = `${BAS}[${KELIME}]*`;
const TANIMLAYICI_RE = new RegExp(`^${TANIMLAYICI}$`);
const KARAKTER_RE = new RegExp(`[${KELIME}]`);
const BASLANGIC_RE = new RegExp(BAS);
const OLAY_RE = new RegExp(
  `^${TANIMLAYICI}(?:\\.${TANIMLAYICI})*\\.(?:tıklandığında|basıldığında|bırakıldığında|üzerineGelindiğinde|üzerindenÇıkıldığında|değiştiğinde|odaklandığında|odağıKaybettiğinde|tuşBasılınca|tuşBırakılınca|fareHareketinde|seçildiğinde|enterBasılınca|çiftTıklandığında|sağTıklandığında|fareTekerleği|pencereKapatılırken|pencereAçıldığında|yüklendiğinde|yüklenmeyeBaşladığında|adresDeğiştiğinde|başlıkDeğiştiğinde|hataOluştuğunda)\\s*$`
);

const BILINEN_ADLAR = new Set<string>();
for (const k of anahtarKelimeler) BILINEN_ADLAR.add(k.ad);
for (const k of mantiksalOperatorler) BILINEN_ADLAR.add(k.ad);
for (const k of sabitler) BILINEN_ADLAR.add(k.ad);
for (const k of yerlesikKomutlar) {
  BILINEN_ADLAR.add(k.ad);
  for (const a of k.takmaAdlar ?? []) BILINEN_ADLAR.add(a);
}
for (const m of [...metinMetotlari, ...listeMetotlari, ...sozlukMetotlari, ...kumeMetotlari]) {
  BILINEN_ADLAR.add(m.ad);
}
// Yerleşik nesneler ve arayüz (TürkUI) adları.
for (const ad of [
  'sayısal', 'bu', 'hata', 'son', 'ise', 'kez', 'içinde',
  'TürkUI', 'Zaman', 'Dosya', 'Dosyaİşlemleri', 'Web', 'Sistem', 'Oyun2D', 'renk', 'gizle',
  'pencere', 'metin', 'buton', 'giriş', 'göster', 'liste', 'görsel', 'ilerleme',
  'onayKutusu', 'seçimKutusu', 'sekme', 'metinAlanı', 'kaydırıcı', 'anahtar',
  'radyo', 'dikeyDüzen', 'yatayDüzen', 'gridDüzen', 'merkezle',
  'özel', 'canvas', 'stil', 'css', 'çizgi', 'dikdörtgen', 'daire', 'yay', 'yazı',
  'arkaPlanDoldur', 'htmlEkle', 'stilEkle', 'sınıf',
  'tarayıcı', 'webTarayıcı', 'webBrowser', 'adres', 'url', 'anaSayfa',
  'başlık', 'yükleniyor', 'geriGidebilir', 'ileriGidebilir', 'yakınlaştırma',
  'git', 'aç', 'geri', 'ileri', 'yenile', 'durdur', 'anaSayfayaGit',
  'htmlYükle', 'belgeYaz', 'yakınlaştır', 'yakınlaştırmaSıfırla',
  'yüklendiğinde', 'yüklenmeyeBaşladığında', 'adresDeğiştiğinde',
  'başlıkDeğiştiğinde', 'hataOluştuğunda',
]) {
  BILINEN_ADLAR.add(ad);
}

interface Blok {
  tip: 'eğer' | 'döngü' | 'SonsuzDöngü' | 'için' | 'fonksiyon' | 'nesne' | 'dene' | 'olay';
  satir: number;
  sutun: number;
  yakala?: boolean;
}

interface Kimlik {
  ad: string;
  bas: number;
  son: number;
  onceki: string;
  sonraki: string;
}

/** Satırdaki `#` yorumunu, metin içindeki `#` karakterlerine dokunmadan temizler. */
function yorumsuz(satir: string): string {
  let metinde = false;
  for (let i = 0; i < satir.length; i++) {
    const c = satir[i];
    if (c === '\\' && metinde) {
      i++;
      continue;
    }
    if (c === '"') {
      metinde = !metinde;
      continue;
    }
    if (c === '#' && !metinde) return satir.slice(0, i);
  }
  return satir;
}

/** `stil` bloğunda `#313244` gibi renk kodları yorum sayılmaz. */
function yorumsuzStil(satir: string): string {
  let metinde = false;
  for (let i = 0; i < satir.length; i++) {
    const c = satir[i];
    if (c === '\\' && metinde) {
      i++;
      continue;
    }
    if (c === '"') {
      metinde = !metinde;
      continue;
    }
    if (c === '#' && !metinde) {
      const kalan = satir.slice(i);
      if (/^#[0-9a-fA-F]{3,8}(?![0-9a-zA-Z])/.test(kalan)) continue;
      if (/^#[0-9a-fA-F]{3,8}$/.test(kalan.trim())) continue;
      return satir.slice(0, i);
    }
  }
  return satir;
}

/**
 * `TürkUI.stil`, `TürkUI.betik` ve `Oyun.sahne` bloklarının satır aralıklarını
 * bulur. Bu satırlarda normal kod denetimi yapılmaz; süslü parantezler blok
 * sınırını belirler.
 *
 * `betik` bloklarında JavaScript vardır: `//`, `/* *\/`, `"`, `'` ve `` ` ``
 * farkındalıklı sayım yapılır.
 */
function turkuiBloklari(
  satirlar: string[]
): {
  icinde: boolean[];
  kapanmamis: Array<{ satir: number; ad: string }>;
  /** Kapanmış `TürkUI.betik` bloklarının satır aralıkları. */
  betikler: Array<{ basSatir: number; sonSatir: number }>;
} {
  const icinde = new Array<boolean>(satirlar.length).fill(false);
  const kapanmamis: Array<{ satir: number; ad: string }> = [];
  const betikler: Array<{ basSatir: number; sonSatir: number }> = [];
  const baslik = /^\s*[A-Za-z_ğüşıöçĞÜŞİÖÇ][\wğüşıöçĞÜŞİÖÇ]*\s*\.\s*(stil|betik|sahne)\s*\{/;
  let i = 0;
  while (i < satirlar.length) {
    const eslesme = baslik.exec(yorumsuzStil(satirlar[i]));
    if (!eslesme) {
      i++;
      continue;
    }
    const ad = eslesme[1];
    let derinlik = 0;
    let acildi = false;
    let tirnak = '';
    let blokYorum = false;
    let j = i;
    for (; j < satirlar.length; j++) {
      const satir = yorumsuzStil(satirlar[j]);
      for (let k = 0; k < satir.length; k++) {
        const c = satir[k];
        if (blokYorum) {
          if (c === '*' && satir[k + 1] === '/') {
            blokYorum = false;
            k++;
          }
          continue;
        }
        if (tirnak) {
          if (c === '\\') {
            k++;
            continue;
          }
          if (c === tirnak) tirnak = '';
          continue;
        }
        if (c === '/' && satir[k + 1] === '/') break;
        if (c === '/' && satir[k + 1] === '*') {
          blokYorum = true;
          k++;
          continue;
        }
        if (c === '"' || c === "'" || c === '`') {
          tirnak = c;
          continue;
        }
        if (c === '{') {
          derinlik++;
          acildi = true;
        } else if (c === '}') {
          derinlik--;
        }
      }
      icinde[j] = true;
      if (acildi && derinlik <= 0) break;
    }
    if (derinlik > 0) kapanmamis.push({ satir: i, ad });
    else if (ad === 'betik' && j > i) betikler.push({ basSatir: i, sonSatir: j });
    i = j + 1;
  }
  return { icinde, kapanmamis, betikler };
}

/** Metin ve yorumları atlayarak satırdaki tanımlayıcıları üretir. */
function* kimlikler(satir: string): Generator<Kimlik> {
  let i = 0;
  while (i < satir.length) {
    const c = satir[i];
    if (c === '"') {
      i++;
      while (i < satir.length) {
        if (satir[i] === '\\') {
          i += 2;
          continue;
        }
        if (satir[i] === '"') {
          i++;
          break;
        }
        i++;
      }
      continue;
    }
    if (c === '#') break;
    if (BASLANGIC_RE.test(c)) {
      const bas = i;
      i++;
      while (i < satir.length && KARAKTER_RE.test(satir[i])) i++;
      const ad = satir.slice(bas, i);
      let p = bas - 1;
      while (p >= 0 && /\s/.test(satir[p])) p--;
      let s = i;
      while (s < satir.length && /\s/.test(satir[s])) s++;
      yield {
        ad,
        bas,
        son: i,
        onceki: p >= 0 ? satir[p] : '',
        sonraki: s < satir.length ? satir[s] : '',
      };
      continue;
    }
    i++;
  }
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  let onceki = new Array<number>(n + 1);
  let simdiki = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) onceki[j] = j;
  for (let i = 1; i <= m; i++) {
    simdiki[0] = i;
    for (let j = 1; j <= n; j++) {
      const maliyet = a[i - 1] === b[j - 1] ? 0 : 1;
      simdiki[j] = Math.min(simdiki[j - 1] + 1, onceki[j] + 1, onceki[j - 1] + maliyet);
    }
    [onceki, simdiki] = [simdiki, onceki];
  }
  return onceki[n];
}

function oneriBul(ad: string, onbellek: Map<string, string | undefined>): string | undefined {
  if (onbellek.has(ad)) return onbellek.get(ad);
  let sonuc: string | undefined;
  if (ad.length >= 3) {
    const esik = ad.length <= 5 ? 1 : 2;
    let enIyi = esik + 1;
    for (const aday of BILINEN_ADLAR) {
      if (aday === ad) {
        enIyi = 0;
        break;
      }
      if (Math.abs(aday.length - ad.length) >= enIyi) continue;
      const d = levenshtein(ad, aday);
      if (d > 0 && d < enIyi) {
        enIyi = d;
        sonuc = aday;
      }
    }
  }
  onbellek.set(ad, sonuc);
  return sonuc;
}

/** Dosyada tanımlanan değişken, fonksiyon, parametre ve nesne adlarını toplar. */
function tanimlariTopla(satirlar: string[]): Set<string> {
  const adlar = new Set<string>(BILINEN_ADLAR);

  const degiskenRe = new RegExp(`^(?:değişken|OndalıklıDeğişken)\\s+(${TANIMLAYICI})`);
  const fonksiyonRe = new RegExp(`^fonksiyon\\s+(${TANIMLAYICI})\\s*\\(([^)]*)\\)`);
  const nesneRe = new RegExp(`^nesne\\s+(${TANIMLAYICI})`);
  const icinRe = new RegExp(`^için\\s+(${TANIMLAYICI})(?:\\s*,\\s*(${TANIMLAYICI}))?\\s+içinde`);
  const yakalaRe = new RegExp(`^yakala\\s+(${TANIMLAYICI})`);
  const iceAktarRe = new RegExp(`^içe_aktar\\s+(${MODUL_IFADESI})`);
  const atamaRe = new RegExp(`^(${TANIMLAYICI})\\s*(?::=|=(?!=|>)|\\+=|-=|\\*=|/=|%=)`);
  const lambdaRe = /\(([^()]*)\)\s*=>/g;
  const stil = turkuiBloklari(satirlar);

  for (let satirNo = 0; satirNo < satirlar.length; satirNo++) {
    const ham = satirlar[satirNo];
    if (stil.icinde[satirNo]) continue;
    const kirp = yorumsuz(ham);
    const metin = kirp.trim();
    if (!metin) continue;

    let m = degiskenRe.exec(metin);
    if (m) adlar.add(m[1]);

    m = fonksiyonRe.exec(metin);
    if (m) {
      adlar.add(m[1]);
      for (const parametre of m[2].split(',')) {
        const ad = parametre.split(':=')[0].trim();
        if (TANIMLAYICI_RE.test(ad)) adlar.add(ad);
      }
    }

    m = nesneRe.exec(metin);
    if (m) adlar.add(m[1]);

    m = icinRe.exec(metin);
    if (m) {
      adlar.add(m[1]);
      if (m[2]) adlar.add(m[2]);
    }

    m = yakalaRe.exec(metin);
    if (m) adlar.add(m[1]);

    m = iceAktarRe.exec(metin);
    if (m) {
      // Yol yazılmışsa modül adı olarak dosya adı kullanılır: `araclar/yardimci` → `yardimci`.
      const modul = modulYoluTemizle(m[1]);
      const ad = modul.split(/[\\/]/).pop() ?? modul;
      adlar.add(ad.replace(/\.(?:tr|turkod)$/i, ''));
      adlar.add(modul);
    }

    m = atamaRe.exec(metin);
    if (m) adlar.add(m[1]);

    for (const lambda of kirp.matchAll(lambdaRe)) {
      for (const parametre of lambda[1].split(',')) {
        const ad = parametre.split(':=')[0].trim();
        if (TANIMLAYICI_RE.test(ad)) adlar.add(ad);
      }
    }
  }

  return adlar;
}

interface MetinDurumu {
  metinde: boolean;
  metinBasSatir: number;
  metinBasSutun: number;
}

function satirKontrol(
  ham: string,
  satirNo: number,
  durum: MetinDurumu,
  ekle: (satir: number, bas: number, bitis: number, mesaj: string, onem?: SorunOnemi) => void
): void {
  const acik: { c: string; i: number }[] = [];
  let metinde = durum.metinde;
  let metinBasSatir = durum.metinBasSatir;
  let metinBasSutun = durum.metinBasSutun;

  for (let i = 0; i < ham.length; i++) {
    const c = ham[i];
    if (metinde) {
      if (c === '\\') {
        i++;
        continue;
      }
      if (c === '"') {
        metinde = false;
        metinBasSatir = -1;
        metinBasSutun = -1;
      }
      continue;
    }
    if (c === '"') {
      metinde = true;
      metinBasSatir = satirNo;
      metinBasSutun = i;
      continue;
    }
    if (c === '#') break;
    if (c === '(' || c === '[' || c === '{') {
      acik.push({ c, i });
    } else if (c === ')' || c === ']' || c === '}') {
      const beklenen = c === ')' ? '(' : c === ']' ? '[' : '{';
      const son = acik.pop();
      if (!son) {
        ekle(satirNo, i, i + 1, `Beklenmeyen \`${c}\`: eşleşen \`${beklenen}\` yok.`);
      } else if (son.c !== beklenen) {
        ekle(satirNo, i, i + 1, `Kapatma \`${c}\` ile açma \`${son.c}\` eşleşmiyor.`);
      }
    }
  }

  durum.metinde = metinde;
  durum.metinBasSatir = metinBasSatir;
  durum.metinBasSutun = metinBasSutun;

  for (const acikParantez of acik) {
    const kapanis = acikParantez.c === '(' ? ')' : acikParantez.c === '[' ? ']' : '}';
    ekle(satirNo, acikParantez.i, acikParantez.i + 1, `\`${acikParantez.c}\` kapatılmamış: \`${kapanis}\` eksik.`);
  }
}

/** Kaynak metni denetler ve satır/sütun bilgili sorun listesi döndürür. */
export function denetle(metin: string): TurkodSorun[] {
  const satirlar = metin.split(/\r?\n/);
  const sorunlar: TurkodSorun[] = [];
  const tanimli = tanimlariTopla(satirlar);
  const onbellek = new Map<string, string | undefined>();
  const yigin: Blok[] = [];

  const ekle = (
    satir: number,
    bas: number,
    bitis: number,
    mesaj: string,
    onem: SorunOnemi = 'hata'
  ): void => {
    const satirUzunluk = satirlar[satir]?.length ?? 0;
    const baslangic = Math.max(0, Math.min(bas, satirUzunluk));
    sorunlar.push({
      satir,
      baslangic,
      bitis: Math.max(baslangic + 1, Math.min(bitis, satirUzunluk)),
      mesaj,
      onem,
    });
  };

  const blokAdi = (tip: Blok['tip']): string => {
    switch (tip) {
      case 'eğer':
        return 'eğer';
      case 'döngü':
        return 'döngü';
      case 'SonsuzDöngü':
        return 'SonsuzDöngü';
      case 'için':
        return 'için';
      case 'fonksiyon':
        return 'fonksiyon';
      case 'nesne':
        return 'nesne';
      case 'dene':
        return 'dene';
      case 'olay':
        return 'olay';
    }
  };

  const metinDurumu: MetinDurumu = { metinde: false, metinBasSatir: -1, metinBasSutun: -1 };
  const stil = turkuiBloklari(satirlar);

  for (let satirNo = 0; satirNo < satirlar.length; satirNo++) {
    // `stil { ... }` bloğu kendi sözdizimini kullanır; satır satır kod denetimi yapılmaz.
    if (stil.icinde[satirNo]) continue;
    const ham = satirlar[satirNo];
    const metinIcindeBasladi = metinDurumu.metinde;
    satirKontrol(ham, satirNo, metinDurumu, ekle);
    // Çok satırlı metnin devam satırlarında kod denetimi yapılmaz.
    if (metinIcindeBasladi) continue;

    const kirp = yorumsuz(ham);
    const dolu = kirp.trim();
    if (!dolu) continue;
    const sutun = kirp.length - kirp.trimStart().length;
    const ilkKelime = dolu.split(/\s/, 1)[0];
    const ilkBas = sutun;
    const ilkBitis = sutun + ilkKelime.length;
    let tanimsizlariAtla = false;

    // ---- `son` ----
    if (/^son\b/.test(dolu)) {
      if (!/^son\s*$/.test(dolu)) {
        ekle(satirNo, ilkBas, ilkBitis, '`son` satırında başka ifade olmamalı.');
      }
      const kapanan = yigin.pop();
      if (!kapanan) {
        ekle(satirNo, ilkBas, ilkBitis, 'Fazladan `son`: kapatılacak bir blok yok.');
      } else if (kapanan.tip === 'dene' && !kapanan.yakala) {
        ekle(
          kapanan.satir,
          kapanan.sutun,
          kapanan.sutun + 4,
          '`dene` bloğunda `yakala` yok; oluşan hatalar yakalanmayacak.',
          'uyari'
        );
      }
      continue;
    }

    // ---- `değilse-eğer` / `değilse eğer` ----
    if (/^(?:değilse-eğer|değilse\s+eğer)\b/.test(dolu)) {
      const anahtar = /^(değilse-eğer|değilse\s+eğer)/.exec(dolu)?.[1] ?? 'değilse-eğer';
      const anahtarBitis = sutun + anahtar.length;
      if (!/\bise\s*$/.test(dolu)) {
        ekle(satirNo, ilkBas, anahtarBitis, '`değilse-eğer` ifadesi `ise` ile bitmelidir.');
      } else {
        const kosul = dolu
          .slice(anahtar.length)
          .replace(/\bise\s*$/, '')
          .trim();
        if (!kosul) {
          ekle(satirNo, ilkBas, anahtarBitis, 'Koşul eksik: `değilse-eğer <koşul> ise` biçiminde yazın.');
        }
      }
      const ust = yigin[yigin.length - 1];
      if (!ust || ust.tip !== 'eğer') {
        ekle(satirNo, ilkBas, anahtarBitis, '`değilse-eğer` yalnızca bir `eğer` bloğu içinde kullanılabilir.');
      }
      continue;
    }

    // ---- `değilse` ----
    if (/^değilse\b/.test(dolu)) {
      if (!/^değilse\s*$/.test(dolu)) {
        ekle(satirNo, ilkBas, ilkBitis, '`değilse` satırı yalnızca `değilse` olmalı.');
      }
      const ust = yigin[yigin.length - 1];
      if (!ust || ust.tip !== 'eğer') {
        ekle(satirNo, ilkBas, ilkBitis, '`değilse` yalnızca bir `eğer` bloğu içinde kullanılabilir.');
      }
      continue;
    }

    // ---- `yakala` ----
    if (/^yakala\b/.test(dolu)) {
      const ust = yigin[yigin.length - 1];
      if (!ust || ust.tip !== 'dene') {
        ekle(satirNo, ilkBas, ilkBitis, '`yakala` yalnızca bir `dene` bloğu içinde kullanılabilir.');
      } else {
        ust.yakala = true;
      }
      const ad = dolu.replace(/^yakala\b/, '').trim();
      if (ad && !TANIMLAYICI_RE.test(ad)) {
        ekle(satirNo, ilkBas, sutun + dolu.length, '`yakala` yalnızca bir değişken adı alabilir.');
      }
      continue;
    }

    // ---- `eğer` ----
    if (/^eğer\b/.test(dolu)) {
      if (!/\bise\s*$/.test(dolu)) {
        ekle(satirNo, ilkBas, ilkBitis, '`eğer` ifadesi `ise` ile bitmelidir.');
      } else if (!dolu.replace(/^eğer\b/, '').replace(/\bise\s*$/, '').trim()) {
        ekle(satirNo, ilkBas, ilkBitis, 'Koşul eksik: `eğer <koşul> ise` biçiminde yazın.');
      }
      yigin.push({ tip: 'eğer', satir: satirNo, sutun: ilkBas });
      continue;
    }

    // ---- `döngü N kez` ----
    if (/^döngü(?=\s|$)/.test(dolu)) {
      if (!/^döngü\s+.+?\s+kez\s*$/.test(dolu)) {
        ekle(satirNo, ilkBas, sutun + dolu.length, '`döngü` ifadesi `döngü <sayı> kez` biçiminde olmalı.');
      }
      yigin.push({ tip: 'döngü', satir: satirNo, sutun: ilkBas });
      continue;
    }

    // ---- `SonsuzDöngü ...` ----
    if (/^SonsuzDöngü(?=\s|$)/.test(dolu)) {
      if (!/^SonsuzDöngü(?:\s+.+?)?(?:\s+ise)?\s*$/.test(dolu)) {
        ekle(satirNo, ilkBas, sutun + dolu.length, '`SonsuzDöngü` kullanımı geçersiz.');
      }
      yigin.push({ tip: 'SonsuzDöngü', satir: satirNo, sutun: ilkBas });
      continue;
    }

    // ---- `için x içinde liste` ----
    if (/^için\b/.test(dolu)) {
      if (!new RegExp(`^için\\s+${TANIMLAYICI}\\s+içinde\\s+.+$`).test(dolu)) {
        ekle(
          satirNo,
          ilkBas,
          sutun + dolu.length,
          '`için` ifadesi `için <değişken> içinde <liste>` biçiminde olmalı.'
        );
      }
      yigin.push({ tip: 'için', satir: satirNo, sutun: ilkBas });
      continue;
    }

    // ---- `fonksiyon ad(...)` ----
    if (/^fonksiyon\b/.test(dolu)) {
      if (!new RegExp(`^fonksiyon\\s+${TANIMLAYICI}\\s*\\([^)]*\\)\\s*$`).test(dolu)) {
        ekle(
          satirNo,
          ilkBas,
          sutun + dolu.length,
          '`fonksiyon` tanımı `fonksiyon ad( parametreler )` biçiminde olmalı.'
        );
      }
      yigin.push({ tip: 'fonksiyon', satir: satirNo, sutun: ilkBas });
      continue;
    }

    // ---- `nesne Ad` ----
    if (/^nesne\b/.test(dolu)) {
      if (!new RegExp(`^nesne\\s+${TANIMLAYICI}\\s*$`).test(dolu)) {
        ekle(satirNo, ilkBas, sutun + dolu.length, '`nesne` tanımı `nesne Ad` biçiminde olmalı.');
      }
      yigin.push({ tip: 'nesne', satir: satirNo, sutun: ilkBas });
      continue;
    }

    // ---- `dene` ----
    if (/^dene\b/.test(dolu)) {
      if (!/^dene\s*$/.test(dolu)) {
        ekle(satirNo, ilkBas, ilkBitis, '`dene` satırı yalnızca `dene` olmalı.');
      }
      yigin.push({ tip: 'dene', satir: satirNo, sutun: ilkBas });
      continue;
    }

    // ---- arayüz olay blokları: `buton.tıklandığında ... son` ----
    if (OLAY_RE.test(dolu)) {
      yigin.push({ tip: 'olay', satir: satirNo, sutun: ilkBas });
      continue;
    }

    // ---- `değişken` / `OndalıklıDeğişken` ----
    if (/^(?:değişken|OndalıklıDeğişken)\b/.test(dolu)) {
      const m = new RegExp(`^(?:değişken|OndalıklıDeğişken)\\s+(${TANIMLAYICI})\\s*(?:(?::=|=(?!=|>))\\s*(.*))?$`).exec(dolu);
      if (!m) {
        ekle(
          satirNo,
          ilkBas,
          sutun + dolu.length,
          '`değişken` tanımı `değişken ad := değer` veya `değişken ad = değer` biçiminde olmalı.'
        );
      } else if (m[2] === undefined || !m[2].trim()) {
        ekle(
          satirNo,
          ilkBas,
          sutun + dolu.length,
          '`değişken` tanımında başlangıç değeri yok; değişken `Boş` olarak tanımlanacak.',
          'uyari'
        );
      }
      continue;
    }

    // ---- `içe_aktar Modül` / `içe_aktar araclar/yardimci` ----
    if (/^içe_aktar\b/.test(dolu)) {
      if (!new RegExp(`^içe_aktar\\s+${MODUL_IFADESI}\\s*$`).test(dolu)) {
        ekle(
          satirNo,
          ilkBas,
          sutun + dolu.length,
          '`içe_aktar` tek bir modül alabilir: `Yardimci`, `araclar/yardimci`, `../ortak` veya `"yol/dosya.tr"`.'
        );
      }
      continue;
    }

    // ---- `dışa_aktar ...` ----
    if (/^dışa_aktar\b/.test(dolu)) {
      tanimsizlariAtla = true;
    }

    // ---- tek başına kullanılamayan anahtar kelimeler ----
    if (/^(ise|kez|içinde)\s*$/.test(dolu)) {
      ekle(
        satirNo,
        ilkBas,
        ilkBitis,
        `\`${dolu}\` tek başına kullanılamaz; ait olduğu ifadenin sonuna yazılmalıdır.`
      );
      continue;
    }

    // ---- `kır` / `dur` / `devam_et` yalnızca döngü içinde ----
    if (/^(?:kır|dur|devam_et)(?=\s|$)/.test(dolu)) {
      const ad = /^(?:kır|dur|devam_et)/.exec(dolu)![0];
      if (dolu !== ad) {
        ekle(satirNo, ilkBas, sutun + dolu.length, `\`${ad}\` satırında başka ifade olmamalı.`);
      }
      const dongude = yigin.some(
        (blok) => blok.tip === 'döngü' || blok.tip === 'SonsuzDöngü' || blok.tip === 'için'
      );
      if (!dongude) {
        ekle(
          satirNo,
          ilkBas,
          ilkBitis,
          `\`${ad}\` yalnızca bir döngü içinde (\`döngü\`, \`SonsuzDöngü\`, \`için\`) kullanılabilir.`
        );
      }
      continue;
    }

    // ---- `de` / `da` bağlaç hatası ----
    if (/^(de|da)(?:\s|$)/.test(dolu)) {
      ekle(
        satirNo,
        ilkBas,
        ilkBitis,
        '`de/da` tek başına kullanılamaz. `ve`, `veya` gibi bağlaçlar kullanın.'
      );
      continue;
    }

    // ---- bilinmeyen / yazımı yakın komutlar ----
    if (!tanimsizlariAtla) {
      for (const kimlik of kimlikler(kirp)) {
        if (tanimli.has(kimlik.ad)) continue;
        if (kimlik.onceki === '.') continue;
        if (kimlik.sonraki === ':') continue;
        const oneri = oneriBul(kimlik.ad, onbellek);
        if (!oneri) continue;
        ekle(
          satirNo,
          kimlik.bas,
          kimlik.son,
          `Bilinmeyen Türkod komutu: \`${kimlik.ad}\`. Bunu mu demek istediniz: \`${oneri}\`?`
        );
      }
    }
  }

  // ---- Kapatılmamış metin ----
  if (metinDurumu.metinde && metinDurumu.metinBasSatir >= 0) {
    ekle(
      metinDurumu.metinBasSatir,
      metinDurumu.metinBasSutun,
      metinDurumu.metinBasSutun + 1,
      'Metin ifadesi kapatılmamış: `"` eksik.'
    );
  }

  // ---- Kapatılmamış `TürkUI.stil` / `TürkUI.betik` blokları ----
  for (const kapanan of stil.kapanmamis) {
    const ham = yorumsuzStil(satirlar[kapanan.satir]);
    const sutun = ham.length - ham.trimStart().length;
    ekle(
      kapanan.satir,
      sutun,
      sutun + 4,
      `\`${kapanan.ad === 'sahne' ? 'Oyun' : 'TürkUI'}.${kapanan.ad}\` bloğu kapatılmamış: \`}\` eksik.`
    );
  }

  // ---- `TürkUI.betik` gövdesinde söz dizimi hataları ----
  // Betik içindeki kod JavaScript'tir; Türkçe kaynak çevrilip derlenir ve
  // hata dosyadaki gerçek satıra eşlenir (ör. eksik virgül: "..." fonksiyon()).
  for (const blok of stil.betikler) {
    const govde = satirlar.slice(blok.basSatir + 1, blok.sonSatir).join('\n');
    const hata = betikSozdizimiHatasi(govde);
    if (!hata) continue;
    const satirNo = Math.max(0, Math.min(blok.basSatir + hata.satir, satirlar.length - 1));
    const ham = satirlar[satirNo] ?? '';
    const sutun = ham.length - ham.trimStart().length;
    ekle(
      satirNo,
      sutun,
      ham.length,
      `Betik söz dizimi hatası: ${hata.mesaj}. Virgül ve parantezleri kontrol edin.`
    );
  }

  // ---- Kapatılmamış bloklar ----
  for (const acikBlok of yigin) {
    ekle(
      acikBlok.satir,
      acikBlok.sutun,
      acikBlok.sutun + blokAdi(acikBlok.tip).length,
      `\`${blokAdi(acikBlok.tip)}\` bloğu kapatılmamış: \`son\` eksik.`
    );
  }

  return sorunlar;
}
