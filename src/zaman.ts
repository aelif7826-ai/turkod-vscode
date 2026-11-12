/**
 * Zaman — tarih ve saat modülü (`içe_aktar Zaman`).
 *
 * Yorumlayıcının içinde oluşturulur; `vscode` veya pencere köprüsü kullanmaz.
 * Böylece uzantı, terminal, `türküi` komut satırı ve paketlenen `.exe` aynı
 * modülü aynı davranışla çalıştırır.
 *
 * Tarihler Türkçe alanlardan oluşan sade nesnelerdir:
 *
 *   { yıl, ay, gün, saat, dakika, saniye, salise, ms, saatDilimi }
 *
 * Tüm işlevler tarih yerine metin (`"17.10.2026"`, ISO), sayı (epoch ms) veya
 * `Boş` da kabul eder; `Boş` şu anki zamanı belirtir.
 */

export interface Tarih {
  yıl: number;
  ay: number;
  gün: number;
  saat: number;
  dakika: number;
  saniye: number;
  salise: number;
  /** Epoch zaman damgası (ms). */
  ms: number;
  saatDilimi: string;
  toString(): string;
}

export interface ZamanModulu {
  uyeler: Record<string, any>;
}

/** Türkçe ay adları (1 → Ocak). */
export const AYLAR = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
] as const;

/** Gün adları; dizin `Date.getDay()` ile aynıdır (0 → Pazar). */
export const GUNLER = [
  'Pazar',
  'Pazartesi',
  'Salı',
  'Çarşamba',
  'Perşembe',
  'Cuma',
  'Cumartesi',
] as const;

/** Türkçe/İngilizce birim yazımlarını tek biçime indirger. */
function sadeles(metin: string): string {
  return metin
    .trim()
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .replace(/ü/g, 'u')
    .replace(/ğ/g, 'g')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

/** Birim başına milisaniye. */
const BIRIM_MS: Record<string, number> = {
  ms: 1,
  milisaniye: 1,
  saniye: 1_000,
  dakika: 60_000,
  saat: 3_600_000,
  gun: 86_400_000,
  gün: 86_400_000,
  hafta: 604_800_000,
};

export type Birim =
  | 'ms'
  | 'saniye'
  | 'dakika'
  | 'saat'
  | 'gün'
  | 'hafta'
  | 'ay'
  | 'yıl';

/** `"gün"`, `"gun"`, `"günler"` gibi yazımları çözer. */
function birimCoz(birim: unknown): Birim {
  const s = sadeles(String(birim ?? 'gün'));
  if (s === 'yil' || s === 'sene' || s === 'yillar') return 'yıl';
  if (s === 'ay' || s === 'aylar') return 'ay';
  if (s === 'hafta' || s === 'haftalar') return 'hafta';
  if (s === 'gun' || s === 'gunler' || s === 'günler') return 'gün';
  if (s === 'saat' || s === 'saatler') return 'saat';
  if (s === 'dakika' || s === 'dakikalar') return 'dakika';
  if (s === 'saniye' || s === 'saniyeler') return 'saniye';
  if (s === 'ms' || s === 'milisaniye') return 'ms';
  throw new Error(
    `Geçersiz zaman birimi: "${String(birim)}". Kullanılabilir: ms, saniye, dakika, saat, gün, hafta, ay, yıl.`
  );
}

function saatDilimiMetni(d: Date): string {
  const dakika = -d.getTimezoneOffset();
  const isaret = dakika < 0 ? '-' : '+';
  const mutlak = Math.abs(dakika);
  const ss = Math.floor(mutlak / 60);
  const dd = mutlak % 60;
  return `${isaret}${String(ss).padStart(2, '0')}:${String(dd).padStart(2, '0')}`;
}

/** `Tarih` nesnesindeki alanları doldurur. */
function tarihNesnesi(d: Date): Tarih {
  const iki = (n: number): string => String(n).padStart(2, '0');
  const nesne: Tarih = {
    yıl: d.getFullYear(),
    ay: d.getMonth() + 1,
    gün: d.getDate(),
    saat: d.getHours(),
    dakika: d.getMinutes(),
    saniye: d.getSeconds(),
    salise: d.getMilliseconds(),
    ms: d.getTime(),
    saatDilimi: saatDilimiMetni(d),
    toString() {
      return `${iki(d.getDate())}.${iki(d.getMonth() + 1)}.${d.getFullYear()} ` +
        `${iki(d.getHours())}:${iki(d.getMinutes())}:${iki(d.getSeconds())}`;
    },
  };
  return nesne;
}

/** Tarih benzeri değeri `Date`'e çevirir. */
export function tariheCevir(deger: unknown, alan = 'Zaman'): Date {
  if (deger === undefined || deger === null || deger === '') return new Date();
  if (deger instanceof Date) {
    if (Number.isNaN(deger.getTime())) throw new Error(`${alan}: geçersiz tarih.`);
    return new Date(deger.getTime());
  }
  if (typeof deger === 'number') {
    if (!Number.isFinite(deger)) throw new Error(`${alan}: geçersiz tarih: ${deger}`);
    return new Date(deger);
  }
  if (typeof deger === 'object') {
    const o = deger as Record<string, unknown>;
    if (typeof o.ms === 'number' && Number.isFinite(o.ms)) return new Date(o.ms);
    if (typeof o.yıl === 'number' && typeof o.ay === 'number' && typeof o.gün === 'number') {
      return new Date(
        o.yıl,
        o.ay - 1,
        o.gün,
        typeof o.saat === 'number' ? o.saat : 0,
        typeof o.dakika === 'number' ? o.dakika : 0,
        typeof o.saniye === 'number' ? o.saniye : 0,
        typeof o.salise === 'number' ? o.salise : 0
      );
    }
  }

  const metin = String(deger).trim();
  if (metin === '') return new Date();
  if (/^\d{10,}$/.test(metin)) return new Date(Number(metin));

  const saatParcasi = '([ T](\\d{1,2}):(\\d{1,2})(?::(\\d{1,2}))?(?:[.,](\\d{1,3}))?)?';
  const iso = new RegExp(`^(\\d{4})[-./](\\d{1,2})[-./](\\d{1,2})${saatParcasi}$`).exec(metin);
  if (iso) {
    return new Date(
      Number(iso[1]),
      Number(iso[2]) - 1,
      Number(iso[3]),
      Number(iso[5] ?? 0),
      Number(iso[6] ?? 0),
      Number(iso[7] ?? 0),
      Number((iso[8] ?? '0').padEnd(3, '0'))
    );
  }

  const turkce = new RegExp(`^(\\d{1,2})[-./](\\d{1,2})[-./](\\d{4})${saatParcasi}$`).exec(metin);
  if (turkce) {
    return new Date(
      Number(turkce[3]),
      Number(turkce[2]) - 1,
      Number(turkce[1]),
      Number(turkce[5] ?? 0),
      Number(turkce[6] ?? 0),
      Number(turkce[7] ?? 0),
      Number((turkce[8] ?? '0').padEnd(3, '0'))
    );
  }

  const serbest = new Date(metin);
  if (!Number.isNaN(serbest.getTime())) return serbest;
  throw new Error(`${alan}: tarih çözümlenemedi: "${metin}"`);
}

function sayiAl(deger: unknown, alan: string): number {
  const n = typeof deger === 'number' ? deger : Number(String(deger ?? '').replace(',', '.'));
  if (!Number.isFinite(n)) throw new Error(`${alan}: sayı bekleniyordu, "${String(deger)}" alındı.`);
  return n;
}

/** Yılın artık yıl olup olmadığı. */
export function artıkYılMı(yıl: number): boolean {
  return (yıl % 4 === 0 && yıl % 100 !== 0) || yıl % 400 === 0;
}

/** Bir ayın gün sayısı (1-12). */
export function ayGunSayisi(yıl: number, ay: number): number {
  return new Date(yıl, ay, 0).getDate();
}

/** Tarihi desene göre biçimlendirir. */
export function bicimle(tarih: unknown, desen: unknown): string {
  const d = tariheCevir(tarih, 'Zaman.biçimle');
  const kalip = String(desen ?? 'gg.AA.yyyy HH:mm');
  const iki = (n: number): string => String(n).padStart(2, '0');
  const uc = (n: number): string => String(n).padStart(3, '0');
  return kalip.replace(
    /GünAdı|AyAdı|yyyy|YYYY|SSS|yy|YY|gg|dd|GG|DD|AA|MM|HH|mm|ss/g,
    (simge) => {
      switch (simge) {
        case 'yyyy':
        case 'YYYY':
          return String(d.getFullYear());
        case 'yy':
        case 'YY':
          return iki(d.getFullYear() % 100);
        case 'gg':
        case 'dd':
        case 'GG':
        case 'DD':
          return iki(d.getDate());
        case 'AA':
        case 'MM':
          return iki(d.getMonth() + 1);
        case 'HH':
          return iki(d.getHours());
        case 'mm':
          return iki(d.getMinutes());
        case 'ss':
          return iki(d.getSeconds());
        case 'SSS':
          return uc(d.getMilliseconds());
        case 'AyAdı':
          return AYLAR[d.getMonth()];
        default:
          return GUNLER[d.getDay()];
      }
    }
  );
}

/** Ay adı (1 → Ocak); tarih de verilebilir. */
function ayAdi(deger: unknown): string {
  if (typeof deger === 'number' || (typeof deger === 'string' && /^\d{1,2}$/.test(deger.trim()))) {
    const ay = sayiAl(deger, 'Zaman.ayAdı');
    if (!Number.isInteger(ay) || ay < 1 || ay > 12) {
      throw new Error(`Zaman.ayAdı: ay 1-12 arasında olmalı, "${ay}" alındı.`);
    }
    return AYLAR[ay - 1];
  }
  return AYLAR[tariheCevir(deger, 'Zaman.ayAdı').getMonth()];
}

/** Gün adı; 0-6 (0 → Pazar) ya da tarih verilebilir. */
function gunAdi(deger: unknown): string {
  if (typeof deger === 'number') {
    if (!Number.isInteger(deger) || deger < 0 || deger > 6) {
      throw new Error(`Zaman.günAdı: gün 0-6 arasında olmalı, "${deger}" alındı.`);
    }
    return GUNLER[deger];
  }
  return GUNLER[tariheCevir(deger, 'Zaman.günAdı').getDay()];
}

function ayEkle(d: Date, aySayisi: number): Date {
  const hedefAy = d.getMonth() + aySayisi;
  const yil = d.getFullYear() + Math.floor(hedefAy / 12);
  const ayIndex = ((hedefAy % 12) + 12) % 12;
  const gun = Math.min(d.getDate(), ayGunSayisi(yil, ayIndex + 1));
  return new Date(
    yil,
    ayIndex,
    gun,
    d.getHours(),
    d.getMinutes(),
    d.getSeconds(),
    d.getMilliseconds()
  );
}

function ekle(tarih: unknown, miktar: unknown, birim: unknown): Tarih {
  const d = tariheCevir(tarih, 'Zaman.ekle');
  const n = sayiAl(miktar, 'Zaman.ekle');
  const b = birimCoz(birim);
  if (b === 'ay') return tarihNesnesi(ayEkle(d, n));
  if (b === 'yıl') return tarihNesnesi(ayEkle(d, n * 12));
  return tarihNesnesi(new Date(d.getTime() + n * BIRIM_MS[b]));
}

function fark(tarih1: unknown, tarih2: unknown, birim: unknown): number {
  const a = tariheCevir(tarih1, 'Zaman.fark');
  const b = tariheCevir(tarih2, 'Zaman.fark');
  const birimAdi = birimCoz(birim ?? 'ms');
  const ms = b.getTime() - a.getTime();
  if (birimAdi === 'ay') return ms / (30.436_875 * BIRIM_MS.gun);
  if (birimAdi === 'yıl') return ms / (365.2425 * BIRIM_MS.gun);
  return ms / BIRIM_MS[birimAdi];
}

function haftaNumarasi(d: Date): number {
  const hedef = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const gun = hedef.getUTCDay() || 7;
  hedef.setUTCDate(hedef.getUTCDate() + 4 - gun);
  const yilBasi = new Date(Date.UTC(hedef.getUTCFullYear(), 0, 1));
  return Math.ceil(((hedef.getTime() - yilBasi.getTime()) / BIRIM_MS.gun + 1) / 7);
}

function yilinGunu(d: Date): number {
  const hedef = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const yilBasi = Date.UTC(d.getFullYear(), 0, 1);
  return Math.floor((hedef - yilBasi) / BIRIM_MS.gun) + 1;
}

/** Milisaniyeyi okunabilir süreye çevirir: `"1 saat 2 dakika 5 saniye"`. */
export function sureMetni(msDegeri: unknown): string {
  const ms = sayiAl(msDegeri, 'Zaman.süreMetni');
  const isaret = ms < 0 ? '-' : '';
  let kalan = Math.abs(Math.round(ms));
  if (kalan < 1_000) return `${isaret}${kalan} ms`;

  const gun = Math.floor(kalan / BIRIM_MS.gun);
  kalan -= gun * BIRIM_MS.gun;
  const saat = Math.floor(kalan / BIRIM_MS.saat);
  kalan -= saat * BIRIM_MS.saat;
  const dakika = Math.floor(kalan / BIRIM_MS.dakika);
  kalan -= dakika * BIRIM_MS.dakika;
  const saniye = Math.floor(kalan / BIRIM_MS.saniye);

  const parcalar: string[] = [];
  if (gun > 0) parcalar.push(`${gun} gün`);
  if (saat > 0) parcalar.push(`${saat} saat`);
  if (dakika > 0) parcalar.push(`${dakika} dakika`);
  if (saniye > 0) parcalar.push(`${saniye} saniye`);
  return isaret + (parcalar.length > 0 ? parcalar.join(' ') : '0 saniye');
}

function kronometre(): Record<string, any> {
  let baslangic: number | null = null;
  let birikmis = 0;
  const k: Record<string, any> = {
    başlat() {
      if (baslangic === null) baslangic = Date.now();
      return k;
    },
    durdur() {
      if (baslangic !== null) {
        birikmis += Date.now() - baslangic;
        baslangic = null;
      }
      return k;
    },
    sıfırla() {
      baslangic = null;
      birikmis = 0;
      return k;
    },
    get geçen() {
      return birikmis + (baslangic === null ? 0 : Date.now() - baslangic);
    },
    get çalışıyor() {
      return baslangic !== null;
    },
  };
  return k;
}

function geriSayim(tarih: unknown): Record<string, number | boolean> {
  const hedef = tariheCevir(tarih, 'Zaman.geriSayım').getTime();
  const farkMs = hedef - Date.now();
  let kalan = Math.max(0, farkMs);
  const gün = Math.floor(kalan / BIRIM_MS.gun);
  kalan -= gün * BIRIM_MS.gun;
  const saat = Math.floor(kalan / BIRIM_MS.saat);
  kalan -= saat * BIRIM_MS.saat;
  const dakika = Math.floor(kalan / BIRIM_MS.dakika);
  kalan -= dakika * BIRIM_MS.dakika;
  const saniye = Math.floor(kalan / BIRIM_MS.saniye);
  return { gün, saat, dakika, saniye, bitti: farkMs <= 0 };
}

/** Zaman modülünü oluşturur (`içe_aktar Zaman`). */
export function zamanModuluOlustur(): ZamanModulu {
  const uyeler: Record<string, any> = {
    /** Belirtilen saniye kadar eşzamansız bekler (en fazla 60 saniye). */
    bekle: (saniye: unknown): Promise<void> => {
      const ms = Math.min(Math.max(0, sayiAl(saniye, 'Zaman.bekle')) * 1_000, 60_000);
      return new Promise((resolve) => setTimeout(resolve, ms));
    },
    /** Şu anki zamanı tarih nesnesi olarak döndürür. */
    şimdi: (): Tarih => tarihNesnesi(new Date()),
    /** Şu anki zamanı desene göre biçimlendirir. */
    şimdiMetni: (desen?: unknown): string => bicimle(new Date(), desen),
    /** Bugünün tarihi: `07.11.2026`. */
    bugünMetni: (): string => bicimle(new Date(), 'gg.AA.yyyy'),
    biçimle: bicimle,
    ayAdı: ayAdi,
    günAdı: gunAdi,
    ekle,
    çıkar: (tarih: unknown, miktar: unknown, birim?: unknown): Tarih =>
      ekle(tarih, -sayiAl(miktar, 'Zaman.çıkar'), birim),
    fark,
    önceMi: (tarih1: unknown, tarih2: unknown): boolean =>
      tariheCevir(tarih1, 'Zaman.önceMi').getTime() < tariheCevir(tarih2, 'Zaman.önceMi').getTime(),
    sonraMi: (tarih1: unknown, tarih2: unknown): boolean =>
      tariheCevir(tarih1, 'Zaman.sonraMi').getTime() > tariheCevir(tarih2, 'Zaman.sonraMi').getTime(),
    eşitMi: (tarih1: unknown, tarih2: unknown): boolean =>
      tariheCevir(tarih1, 'Zaman.eşitMi').getTime() === tariheCevir(tarih2, 'Zaman.eşitMi').getTime(),
    haftaSonuMu: (tarih: unknown): boolean => {
      const gun = tariheCevir(tarih, 'Zaman.haftaSonuMu').getDay();
      return gun === 0 || gun === 6;
    },
    artıkYılMı: (yıl: unknown): boolean => artıkYılMı(sayiAl(yıl, 'Zaman.artıkYılMı')),
    ayGünSayısı: (yıl: unknown, ay: unknown): number => {
      const y = sayiAl(yıl, 'Zaman.ayGünSayısı');
      const a = sayiAl(ay, 'Zaman.ayGünSayısı');
      if (a < 1 || a > 12) throw new Error(`Zaman.ayGünSayısı: ay 1-12 arasında olmalı.`);
      return ayGunSayisi(y, a);
    },
    haftaNumarası: (tarih: unknown): number =>
      haftaNumarasi(tariheCevir(tarih, 'Zaman.haftaNumarası')),
    yılınGünü: (tarih: unknown): number => yilinGunu(tariheCevir(tarih, 'Zaman.yılınGünü')),
    ayAralığı: (tarih: unknown): Record<string, Tarih> => {
      const d = tariheCevir(tarih, 'Zaman.ayAralığı');
      return {
        ilk: tarihNesnesi(new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)),
        son: tarihNesnesi(new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)),
      };
    },
    kronometre,
    geriSayım: geriSayim,
    süreMetni: sureMetni,
    aylar: [...AYLAR],
    günler: [...GUNLER],
  };
  return { uyeler };
}
