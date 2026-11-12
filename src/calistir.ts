/**
 * Türkod yorumlayıcısı.
 *
 * Kaynak kodu satır satır çalıştırır. Satır satır çalıştırma, hata ayıklayıcı için
 * gereklidir: her satırın başında durup kullanıcıya kontrol verilebilir.
 *
 * Sözdizimi (README ve söz dizimi dosyasındaki anahtar kelimelere göre):
 *   değişken ad := değer            OndalıklıDeğişken pi := 3,14
 *   eğer koşul ise / değilse / son  döngü 3 kez / son
 *   SonsuzDöngü koşul / son         için x içinde liste / son
 *   fonksiyon ad(a, b) / son        nesne Ad / son
 *   dene / yakala h / son           içe_aktar Modül / dışa_aktar ad
 *   kır / dur   devam_et   geri_döndür değer   hataFırlat("...")
 * Yorum: #
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { TurkuiModulu } from './turkui';
import { oyunSahnesiniPythonaCevir, ursinaSahnesiniBaslat } from './oyun';
import { zamanModuluOlustur } from './zaman';
import { stilDurumlari } from './veri/stilDurumlari';
import { oyunModuluEtkinMi } from './oyunDurumu';

export type DegerTuru = 'metin' | 'sayi' | 'mantiksal' | 'liste' | 'sozluk' | 'kume' | 'nesne' | 'fonksiyon' | 'yerli' | 'boş';

/** TürkUI gibi yerleşik modüllerden gelen JS fonksiyonlarının sarmalayıcısı. */
export interface YerliFonksiyon {
  _yerliFonksiyon: true;
  ad: string;
  kaynak: (...argumanlar: any[]) => any;
  alici?: unknown;
  cagir: (argumanlar: unknown[]) => unknown;
}

export class TurkodDeger {
  constructor(
    public readonly tur: DegerTuru,
    public readonly deger: unknown,
    public readonly turAdi?: string
  ) {}

  static metin(v: string) {
    return new TurkodDeger('metin', v);
  }
  static sayi(v: number) {
    return new TurkodDeger('sayi', v);
  }
  static mantiksal(v: boolean) {
    return new TurkodDeger('mantiksal', v);
  }
  static liste(v: TurkodDeger[]) {
    return new TurkodDeger('liste', v);
  }
  static sozluk(v: Map<string, TurkodDeger>) {
    return new TurkodDeger('sozluk', v);
  }
  static kume(v: TurkodDeger[]) {
    return new TurkodDeger('kume', v);
  }
  static nesne(v: Record<string, TurkodDeger>, turAdi: string) {
    return new TurkodDeger('nesne', v, turAdi);
  }
  static yerli(v: unknown, turAdi?: string) {
    return new TurkodDeger('yerli', v, turAdi);
  }
  static bos() {
    return new TurkodDeger('boş', null);
  }

  get dizi(): TurkodDeger[] {
    return this.deger as TurkodDeger[];
  }
  get tablo(): Map<string, TurkodDeger> {
    return this.deger as Map<string, TurkodDeger>;
  }
  get alanlar(): Record<string, TurkodDeger> {
    return this.deger as Record<string, TurkodDeger>;
  }
  get sayisal(): number {
    return this.deger as number;
  }
  get mantiksalDeger(): boolean {
    return this.deger as boolean;
  }
  get metinDeger(): string {
    return this.deger as string;
  }
  get yerliDeger(): unknown {
    return this.deger;
  }
}

/** Kullanıcı kodundan gelen çalışma zamanı hatası. */
export class TurkodHatasi extends Error {
  constructor(mesaj: string, public satir?: number) {
    super(mesaj);
    this.name = 'TurkodHatası';
  }
}

/** `dur`, `devam_et` ve `geri_döndür` için kontrol akışı sinyalleri. */
export class Sinyal {
  constructor(public tip: 'dur' | 'devam' | 'don' | 'cikis', public deger?: TurkodDeger) {}
}

/** Hata ayıklayıcının her satırda kullandığı kanca. */
export interface CalistirmaKancasi {
  /** Bir sonraki satıra geçmeden önce çağrılır. */
  satir(satirNo: number): Promise<void>;
}

export interface CalistirmaSecenekleri {
  /** Yazdırma çıktısı (terminal veya test yakalayıcısı). */
  yaz: (metin: string) => void;
  /** Kullanıcıdan girdi okur (`oku`, `iste`). */
  oku: (soru: string) => Promise<string>;
  /** Çalışma klasörü; dosya komutları buradan çözümlenir. */
  klasor: string;
  /** İçe aktarma yollarının başlangıç klasörü; geçici çalıştırma kopyalarında kaynak klasörünü belirtir. */
  modulKlasoru?: string;
  /**
   * Çalıştırılan kaynak dosya. Verilirse `içe_aktar` yolları bu dosyanın
   * klasörüne göre çözülür; `klasor` yalnızca dosya komutlarını etkiler.
   */
  dosya?: string;
  kanca?: CalistirmaKancasi;
  /** `bekle` için gerçek gecikme uygulanmalı mı? */
  gercekGecikme?: boolean;
  /**
   * `içe_aktar` ile bağlanan dosyayı çözer. `klasor` verilmezse çağıran
   * yorumlayıcının çalışma klasörü kullanılır.
   */
  modulCoz?: (ad: string, klasor?: string) => string | undefined;
  /** Yerleşik TürkUI modülü (uzantıda webview köprüsüyle oluşturulur). */
  turkui?: TurkuiModulu;
}

interface Baglam {
  degiskenler: Map<string, TurkodDeger>;
  sabitler: Set<string>;
  ust?: Baglam;
}

/** `TürkUI.stil { hedef(özellik: değer) }` bloğundaki tek bir bildirim. */
export interface StilBildirimi {
  ad: string;
  deger: string;
  satir: number;
}

/** `TürkUI.stil { hedef( durum( ... ) ) }` bloğundaki tek bir durum grubu. */
export interface StilDurumuGrubu {
  /** Türkçe durum adı (`üzerineGelince`, `odaklıyken`, ...). */
  ad: string;
  satir: number;
  bildirimler: StilBildirimi[];
}

/** `TürkUI.stil { ... }` bloğundaki tek bir hedef (bileşen) grubu. */
export interface StilGrubu {
  hedef: string;
  satir: number;
  bildirimler: StilBildirimi[];
  /** `üzerineGelince( ... )` gibi durum grupları. */
  durumlar: StilDurumuGrubu[];
}

/** `TürkUI.betik { pencere( ... ) }` bloğundaki tek bir hedef (pencere) grubu. */
export interface BetikGrubu {
  hedef: string;
  /** Grubun açıldığı satır. */
  satir: number;
  /** Türkçe JavaScript kaynağı. */
  kod: string;
}

type Adim =
  | { tip: 'satir'; satir: number; metin: string }
  | { tip: 'eğer'; satir: number; kosul: string; govde: Adim[]; degilse: Adim[]; zincir?: Adim[] }
  | { tip: 'döngü'; satir: number; sayi: string; govde: Adim[]; donguDegiskeni?: string }
  | { tip: 'kosulluDöngü'; satir: number; kosul: string; govde: Adim[] }
  | { tip: 'için'; satir: number; degisken: string; ifade: string; govde: Adim[] }
  | { tip: 'fonksiyon'; satir: number; ad: string; parametreler: { ad: string; varsayilan?: string }[]; govde: Adim[] }
  | { tip: 'nesne'; satir: number; ad: string; govde: Adim[] }
  | { tip: 'olay'; satir: number; nesne: string; olay: string; govde: Adim[] }
  | { tip: 'stil'; satir: number; gruplar: StilGrubu[] }
  | { tip: 'betik'; satir: number; gruplar: BetikGrubu[] }
  | { tip: 'oyunSahne'; satir: number; kaynak: string }
  | { tip: 'dene'; satir: number; govde: Adim[]; hataAdi: string; yakala: Adim[] };

interface FonksiyonDegeri {
  ad: string;
  parametreler: { ad: string; varsayilan?: string }[];
  govde: Adim[];
  kapali: Baglam;
  /** Metot çağrısında alıcı (metin, liste, sözlük, küme). */
  alici?: TurkodDeger;
}

interface NesneTuru {
  ad: string;
  govde: Adim[];
}

/** `TürkUI.betik` içinden çağrılabilen pencere komutları. */
const PENCERE_KOMUTLARI = new Set(['göster', 'gizle', 'kapat', 'küçült', 'büyüt', 'normal']);

/** TürkUI bileşenlerine bağlanabilen olay adları. */
export const TURKUI_OLAYLARI = new Set<string>([
  'tıklandığında', 'basıldığında', 'bırakıldığında',
  'üzerineGelindiğinde', 'üzerindenÇıkıldığında',
  'değiştiğinde', 'odaklandığında', 'odağıKaybettiğinde',
  'tuşBasılınca', 'tuşBırakılınca', 'fareHareketinde',
  'pencereKapatılırken', 'pencereAçıldığında',
  'seçildiğinde', 'enterBasılınca',
  'çiftTıklandığında', 'sağTıklandığında', 'fareTekerleği',
  'yüklendiğinde', 'yüklenmeyeBaşladığında', 'adresDeğiştiğinde',
  'başlıkDeğiştiğinde', 'hataOluştuğunda',
]);

const MODUL_NORMAL = (ad: string): string =>
  ad
    .replace(/İ/g, 'i')
    .toLowerCase()
    .replace(/ü/g, 'u')
    .replace(/ğ/g, 'g')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');

/** `TürkUI`, `turkui`, `TÜRKUI` gibi yazımları tanır. */
export function turkuiModulAdiMi(ad: string): boolean {
  return MODUL_NORMAL(ad.trim()) === 'turkui';
}

/** `Zaman`, `zaman`, `ZAMAN` gibi yazımları tanır. */
export function zamanModulAdiMi(ad: string): boolean {
  return MODUL_NORMAL(ad.trim()) === 'zaman';
}

/* ---------------- dosya bağlama (`içe_aktar`) ---------------- */

/** Bağlanabilen dosya uzantıları. */
const MODUL_UZANTILARI = ['.tr', '.turkod'];
/** Ad verilip yol verilmediğinde alt klasörlerde kaç kat derine inilir. */
const MODUL_ARAMA_DERINLIGI = 4;
/** Modül aranırken taranmayan klasörler. */
const MODUL_ATLANAN_KLASORLER = new Set([
  'node_modules',
  '.git',
  '.vscode',
  '.turkui',
  'out',
  'dist',
  'build',
]);

/**
 * `içe_aktar` satırındaki modül ifadesi.
 *
 * Kabul edilen yazımlar: `Yardimci`, `araclar/yardimci`, `../ortak/araclar`,
 * `yardimci.tr` ve boşluk içerebilen tırnaklı yollar (`"araclar/yeni dosya"`).
 */
export const MODUL_IFADESI = String.raw`(?:"[^"\r\n]+"|'[^'\r\n]+'|[A-Za-z_ğüşıöçĞÜŞİÖÇ.][\wğüşıöçĞÜŞİÖÇ./\\.-]*)`;

/** `içe_aktar` yazımındaki tırnakları ve baştaki/sondaki boşlukları temizler. */
export function modulYoluTemizle(ad: string): string {
  let ham = String(ad ?? '').trim();
  const tirnakli =
    ham.length >= 2 &&
    ((ham.startsWith('"') && ham.endsWith('"')) || (ham.startsWith("'") && ham.endsWith("'")));
  if (tirnakli) ham = ham.slice(1, -1).trim();
  return ham;
}

/** `içe_aktar <modül>` satırını çözer. */
const ICE_AKTAR_RE = new RegExp(`^içe_aktar\\s+(${MODUL_IFADESI})$`);

/** Dosya mı? (klasör veya erişilemeyen yol için `false`) */
function modulDosyasiMi(yol: string): boolean {
  try {
    return fs.statSync(yol).isFile();
  } catch {
    return false;
  }
}

/** Bir klasörden yukarı yürüyerek `uygulama.json` bulunan proje kökünü arar. */
export function projeKokuBul(klasor: string): string | undefined {
  let simdiki: string;
  try {
    simdiki = path.resolve(klasor);
  } catch {
    return undefined;
  }
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(simdiki, 'uygulama.json'))) return simdiki;
    const ust = path.dirname(simdiki);
    if (ust === simdiki) break;
    simdiki = ust;
  }
  return undefined;
}

/** Alt klasörlerde adı verilen modül dosyasını arar. */
function altKlasordeModulAra(klasor: string, ad: string, derinlik: number): string | undefined {
  if (derinlik > MODUL_ARAMA_DERINLIGI) return undefined;
  let girdiler: fs.Dirent[];
  try {
    girdiler = fs.readdirSync(klasor, { withFileTypes: true });
  } catch {
    return undefined;
  }

  const hedefler = MODUL_UZANTILARI.map((uzanti) => `${ad}${uzanti}`.toLocaleLowerCase('tr'));
  for (const girdi of girdiler) {
    if (!girdi.isFile()) continue;
    if (hedefler.includes(girdi.name.toLocaleLowerCase('tr'))) {
      return path.join(klasor, girdi.name);
    }
  }
  for (const girdi of girdiler) {
    if (!girdi.isDirectory()) continue;
    if (MODUL_ATLANAN_KLASORLER.has(girdi.name.toLocaleLowerCase('tr'))) continue;
    const bulunan = altKlasordeModulAra(path.join(klasor, girdi.name), ad, derinlik + 1);
    if (bulunan) return bulunan;
  }
  return undefined;
}

/**
 * `içe_aktar` ile verilen modülü dosya sisteminde bulur.
 *
 * Arama sırası: verilen yol (mutlaksa) veya kaynak klasörüne göre göreli yol,
 * ardından proje kökünün `src/` klasörü ve proje kökü. Yalnızca bir ad
 * yazıldıysa (`içe_aktar Yardimci`) bu klasörlerin alt klasörleri de taranır.
 * Böylece `src/ana.tr`, `içe_aktar araclar/yardimci` ile
 * `src/araclar/yardimci.tr` dosyasını bağlayabilir.
 */
export function modulDosyasiBul(ad: string, klasor: string): string | undefined {
  const istenen = modulYoluTemizle(ad);
  if (!istenen) return undefined;
  const normal = istenen.replace(/\\/g, '/');

  const kokler: string[] = [];
  const kokEkle = (yol: string | undefined): void => {
    if (yol && !kokler.includes(yol)) kokler.push(yol);
  };
  kokEkle(path.resolve(klasor));
  const projeKoku = projeKokuBul(klasor);
  if (projeKoku) kokEkle(path.join(projeKoku, 'src'));
  kokEkle(projeKoku);

  const araYollar: string[] = [];
  if (path.isAbsolute(istenen)) {
    araYollar.push(istenen);
  } else {
    for (const kok of kokler) araYollar.push(path.resolve(kok, normal));
  }

  const adaylar: string[] = [];
  for (const yol of araYollar) {
    adaylar.push(yol);
    const kucuk = yol.toLocaleLowerCase('tr');
    if (!MODUL_UZANTILARI.some((uzanti) => kucuk.endsWith(uzanti))) {
      for (const uzanti of MODUL_UZANTILARI) adaylar.push(`${yol}${uzanti}`);
    }
  }
  for (const aday of adaylar) {
    if (modulDosyasiMi(aday)) return aday;
  }

  // Yol içermeyen adlar için alt klasör taraması.
  if (!normal.includes('/')) {
    for (const kok of kokler) {
      const bulunan = altKlasordeModulAra(kok, normal, 0);
      if (bulunan) return bulunan;
    }
  }

  return undefined;
}

function yerliFonksiyonMu(deger: unknown): deger is YerliFonksiyon {
  return (
    !!deger &&
    typeof deger === 'object' &&
    (deger as YerliFonksiyon)._yerliFonksiyon === true
  );
}

function yerliFonksiyon(fn: (...argumanlar: any[]) => any, ad: string, alici?: unknown): YerliFonksiyon {
  return {
    _yerliFonksiyon: true,
    ad,
    kaynak: fn,
    alici,
    cagir: (argumanlar: unknown[]) => fn.apply(alici, argumanlar),
  };
}

/** Türkod değerini yerli JS değerine çevirir. */
export function jsDegeri(deger: TurkodDeger): unknown {
  switch (deger.tur) {
    case 'metin':
      return deger.metinDeger;
    case 'sayi':
      return deger.sayisal;
    case 'mantiksal':
      return deger.mantiksalDeger;
    case 'boş':
      return null;
    case 'liste':
    case 'kume':
      return deger.dizi.map(jsDegeri);
    case 'sozluk':
      return Object.fromEntries([...deger.tablo].map(([k, v]) => [k, jsDegeri(v)]));
    case 'nesne':
      return Object.fromEntries(Object.entries(deger.alanlar).map(([k, v]) => [k, jsDegeri(v)]));
    case 'yerli':
      return deger.yerliDeger;
    default:
      return null;
  }
}

/** Yerli JS değerini Türkod değerine çevirir. */
export function turkodDegeri(deger: unknown): TurkodDeger {
  if (deger instanceof TurkodDeger) return deger;
  if (deger === null || deger === undefined) return TurkodDeger.bos();
  if (typeof deger === 'string') return TurkodDeger.metin(deger);
  if (typeof deger === 'number') return TurkodDeger.sayi(deger);
  if (typeof deger === 'boolean') return TurkodDeger.mantiksal(deger);
  if (typeof deger === 'bigint') return TurkodDeger.sayi(Number(deger));
  if (Array.isArray(deger)) return TurkodDeger.liste(deger.map(turkodDegeri));
  if (typeof deger === 'function') {
    return TurkodDeger.yerli(yerliFonksiyon(deger as (...argumanlar: any[]) => any, deger.name || '<fonksiyon>'));
  }
  return TurkodDeger.yerli(deger);
}

/** Yerli bir değerin üyesini okur. */
export function yerliUyeOku(yerli: unknown, ad: string): TurkodDeger {
  const hedef = yerliFonksiyonMu(yerli) ? yerli.kaynak : yerli;
  if (hedef === null || hedef === undefined) return TurkodDeger.bos();
  if (typeof hedef !== 'object' && typeof hedef !== 'function') {
    throw new Error(`"${String(hedef)}" üzerinde "${ad}" üyesi yok.`);
  }
  const deger = Reflect.get(hedef as object, ad, hedef as object);
  if (typeof deger === 'function') {
    return TurkodDeger.yerli(yerliFonksiyon(deger as (...a: any[]) => any, ad, hedef));
  }
  return turkodDegeri(deger);
}

/** Yerli bir değerin üyesini yazar. */
export function yerliUyeYaz(yerli: unknown, ad: string, deger: TurkodDeger): void {
  const hedef = yerliFonksiyonMu(yerli) ? yerli.kaynak : yerli;
  if (hedef === null || hedef === undefined || (typeof hedef !== 'object' && typeof hedef !== 'function')) {
    throw new Error(`"${String(hedef)}" üzerine "${ad}" yazılamaz.`);
  }
  Reflect.set(hedef as object, ad, jsDegeri(deger), hedef as object);
}

/** `stil` değerlerinde ham bırakılan Türkçe CSS işlevleri. */
const CSS_ISLEVLERI = new Set(['ölçek', 'kaydır', 'döndür', 'eğiklik', 'tekrar', 'matris']);

const BOS_KUME = new Set(['', ' ', '\t', '\r']);
const METOT_TURLERI = new Set<DegerTuru>(['metin', 'liste', 'sozluk', 'kume']);

const DUR = new Sinyal('dur');
const DEVAM = new Sinyal('devam');

const KELIME = 'A-Za-z0-9_ğüşıöçĞÜŞİÖÇ';
const TANIMLAYICI = `[A-Za-z_ğüşıöçĞÜŞİÖÇ][${KELIME}]*`;
const TANIMLAYICI_RE = new RegExp(`^${TANIMLAYICI}$`);
const RE_TANIMLAYICI = new RegExp(TANIMLAYICI, 'y');

const YERLESIK_ADLAR = new Set<string>([
  'anahtarlaraGöreSırala', 'rastgeleElemanlar', 'değereGöreSırala', 'desenEşleşiyorMu', 'aralık_to_liste',
  'aralik_to_liste', 'basamaklarıAyır', 'birleştirSözlük', 'güvenliRastgele', 'rastgeleOndalık',
  'çalışmaKlasörü', 'çarpanlaraAyır', 'filtreleSözlük', 'karaktereÇevir', 'kontrolToplamı', 'kullanıcıAdıMı',
  'ortamDeğişkeni', 'rastgeleNormal', 'satırlaraSonek', 'yazdırılabilir', 'basamakSayısı', 'desenDeğiştir',
  'kelimelereBöl', 'klasörOluştur', 'kume_birlesim', 'küme_birleşim', 'metinTekrarla', 'panoyaKopyala',
  'rastgeleMetin', 'satırlaraÖnek', 'yukarıYuvarla', 'aşağıYuvarla', 'başlıkAyarla', 'başlıkBiçimi',
  'dosyaListesi', 'haftanınGünü', 'karakterKodu', 'kelimeSayısı', 'kullanıcıAdı', 'kume_kesisim',
  'küme_kesişim', 'rastgeleSayı', 'satırlaraBöl', 'sessizSayısı', 'tarihBiçimle', 'temizleEkran',
  'varsayılanAl', 'yolBirleştir', 'yüzdeDeğişim', 'base64Kodla', 'bilgiYazdır', 'boşSözlükMü',
  'csvAyrıştır', 'cümleBiçimi', 'cümleSayısı', 'diziOluştur', 'dosyaBoyutu', 'htmlKaçışla', 'ilkDeğiştir',
  'ilkKarakter', 'klasörVarMı', 'kume_alt_mi', 'küme_alt_mı', 'onaltılıdan', 'ondalıklıya', 'ondalikliya',
  'postaKoduMı', 'RastgeleSeç', 'sayıBiçimle', 'sesliSayısı', 'sonKarakter', 'sonKonumBul', 'uyarıYazdır',
  'yerDeğiştir', 'anahtarlar', 'aralıktaMı', 'başlıyorMu', 'csvOluştur', 'derinKopya', 'dosyaVarMı',
  'faktöriyel', 'harfSayısı', 'hataFırlat', 'hataYazdır', 'karakterAt', 'kısaKimlik', 'klasörYolu',
  'mantıksala', 'onaltılıya', 'panodanOku', 'seçenekSor', 'sekizliden', 'tanımsızMı', 'tarihFarkı',
  'tarihSaati', 'varsayılan', 'yaşHesapla', 'base64Çöz', 'benzerlik', 'benzersiz', 'birlestir', 'birleştir',
  'bitiyorMu', 'bölVeKırp', 'bulİndeks', 'buyukHarf', 'büyükHarf', 'BÜYÜKHARF', 'doldurSağ', 'doldurSol',
  'dosyaEkle', 'düzleştir', 'evKlasörü', 'ilkEleman', 'indeksBul', 'jsonKodla', 'kucukHarf', 'kume_fark',
  'küçükHarf', 'KÜÇÜKHARF', 'küme_fark', 'mutlakYol', 'negatifMi', 'pozitifMi', 'sekizliye', 'sonEleman',
  'şifreGücü', 'şifreÜret', 'tamSayıMı', 'tarihEkle', 'telefonMı', 'tersÇevir', 'yılınGünü', 'altMetin',
  'boşListe', 'değerler', 'değiştir', 'desenBöl', 'desenBul', 'dosyaAdı', 'dosyaOku', 'dosyaSil',
  'dosyaYaz', 'dönüştür', 'ekleBaşa', 'epostaMı', 'filtrele', 'girdiler', 'hexKodla', 'içeriyor',
  'ikiliden', 'ilerleme', 'karıştır', 'karmaKod', 'komutlar', 'konumBul', 'ortalama', 'platform',
  'sıkıştır', 'sözlükMü', 'tarihÇöz', 'tekrarEt', 'urlKodla', 'yazıTura', 'doğrula', 'enBüyük', 'enKüçük',
  'ExeIcon', 'hiçbiri', 'htmlÇöz', 'ikiliye', 'indirge', 'jsonÇöz', 'karekök', 'kesişim', 'kopyala',
  'listeye', 'parçala', 'sağKırp', 'sıfırMı', 'sınırla', 'solKırp', 'sözlüğe', 'süreÖlç', 'şimdiMs',
  'tarihMı', 'uzunluk', 'yakınMı', 'yuvarla', 'aralık', 'aralik', 'asalMı', 'ayıkla', 'çiftMi', 'dakika',
  'döndür', 'eşitMi', 'grupla', 'harfMi', 'hexÇöz', 'ibanMı', 'işaret', 'jsonMı', 'küpKök', 'mesafe',
  'mutlak', 'onayla', 'saniye', 'sayıMı', 'sayıya', 'sayiya', 'sırala', 'sözlük', 'şablon', 'tcknMı',
  'tur_mu', 'tür_mü', 'urlÇöz', 'uygula', 'uzantı', 'yardım', 'yardim', 'bekle', 'biçim', 'boşMu',
  'webİste', 'httpİste',
  'bugün', 'çağır', 'dilim', 'kalan', 'liste', 'metne', 'silAt', 'sürüm', 'şimdi', 'tekMi', 'topla',
  'urlMi', 'yüzde', 'zarAt', 'bazı', 'çarp', 'ebob', 'ekle', 'ekok', 'eşle', 'fark', 'ilkN', 'kırp',
  'kirp', 'kume', 'küme', 'oran', 'özet', 'saat', 'sonN', 'uuid', 'bol', 'böl', 'bul', 'çık', 'gün',
  'her', 'ilk', 'oku', 'say', 'seç', 'sil', 'tur', 'tür', 'yıl', 'aç', 'at', 'ay', 'üs', 'tersMetin',
  // Girdi/çıktı ve sistem komutları
  'yazdır', 'iste', 'oku', 'girdiler',
]);

/** Çıktı üretmeyen ama akışı etkileyen komutlar. */
const AKIS_KOMUTLARI = new Set(['kır', 'dur', 'devam_et', 'geri_döndür', 'dön', 'don']);

/* ------------------------------------------------------------------ */
/* Değer yardımcıları                                                  */
/* ------------------------------------------------------------------ */

/** Bir Türkod değerini metne çevirir (hata ayıklayıcı ve araçlar için). */
export function yazdirilabilirMi(deger: TurkodDeger): string {
  return yazdirilabilir(deger);
}

function yazdirilabilir(deger: TurkodDeger, ic = false): string {
  switch (deger.tur) {
    case 'metin':
      return ic ? `"${deger.metinDeger}"` : deger.metinDeger;
    case 'sayi': {
      const s = deger.sayisal;
      if (Number.isNaN(s)) return 'NaN';
      if (!Number.isFinite(s)) return s > 0 ? 'SONSUZ' : '-SONSUZ';
      if (Number.isInteger(s)) return String(s);
      return String(s).replace('.', ',');
    }
    case 'mantiksal':
      return deger.mantiksalDeger ? 'Doğru' : 'Yanlış';
    case 'boş':
      return 'Boş';
    case 'liste':
      return `[${deger.dizi.map((d) => yazdirilabilir(d, true)).join(', ')}]`;
    case 'kume':
      return `{${deger.dizi.map((d) => yazdirilabilir(d, true)).join(', ')}}`;
    case 'sozluk': {
      const parcalar: string[] = [];
      for (const [k, v] of deger.tablo) {
        const anahtar = TANIMLAYICI_RE.test(k) ? k : `"${k}"`;
        parcalar.push(`${anahtar}: ${yazdirilabilir(v, true)}`);
      }
      return `{${parcalar.join(', ')}}`;
    }
    case 'nesne': {
      const parcalar: string[] = [];
      for (const [k, v] of Object.entries(deger.alanlar)) {
        parcalar.push(`${k}: ${yazdirilabilir(v, true)}`);
      }
      return `${deger.turAdi}{${parcalar.join(', ')}}`;
    }
    case 'fonksiyon':
      return `<fonksiyon ${(deger.deger as FonksiyonDegeri).ad}>`;
    case 'yerli': {
      const y = deger.yerliDeger;
      if (yerliFonksiyonMu(y)) return `<fonksiyon ${y.ad}>`;
      if (y && typeof y === 'object') {
        const o = y as Record<string, any>;
        if (o._turkuiType === 'window') return `<Pencere: ${String(o._title ?? '')}>`;
        if (o._turkuiType === 'component') return `<${String(o._type ?? 'bileşen')}: ${String(o._componentId ?? '')}>`;
        if (o._turkolRenk) return String(o.renk ?? '');
      }
      return String(y);
    }
    default:
      return '';
  }
}

function dogruluk(deger: TurkodDeger): boolean {
  switch (deger.tur) {
    case 'mantiksal':
      return deger.mantiksalDeger;
    case 'sayi':
      return deger.sayisal !== 0 && !Number.isNaN(deger.sayisal);
    case 'metin':
      return deger.metinDeger.length > 0;
    case 'boş':
      return false;
    case 'liste':
    case 'kume':
      return deger.dizi.length > 0;
    case 'sozluk':
      return deger.tablo.size > 0;
    default:
      return true;
  }
}

function ayniMi(a: TurkodDeger, b: TurkodDeger): boolean {
  if (a.tur === 'sayi' && b.tur === 'sayi') return a.sayisal === b.sayisal;
  if (a.tur !== b.tur) {
    if ((a.tur === 'boş' && b.tur === 'boş') || (a.tur === 'boş' && b.tur === 'boş')) return true;
    return false;
  }
  if (a.tur === 'metin') return a.metinDeger === b.metinDeger;
  if (a.tur === 'mantiksal') return a.mantiksalDeger === b.mantiksalDeger;
  if (a.tur === 'boş') return true;
  if (a.tur === 'liste' || a.tur === 'kume') {
    if (a.dizi.length !== b.dizi.length) return false;
    return a.dizi.every((d, i) => ayniMi(d, b.dizi[i]));
  }
  return a.deger === b.deger;
}

function sayiyaCevir(deger: TurkodDeger, satir: number): number {
  if (deger.tur === 'sayi') return deger.sayisal;
  if (deger.tur === 'mantiksal') return deger.mantiksalDeger ? 1 : 0;
  if (deger.tur === 'metin') {
    const s = deger.metinDeger.trim().replace(',', '.');
    const n = Number(s);
    if (s !== '' && !Number.isNaN(n)) return n;
  }
  throw new TurkodHatasi(`Sayı bekleniyordu, "${yazdirilabilir(deger)}" alındı.`, satir);
}

function sayisal(deger: TurkodDeger): boolean {
  return deger.tur === 'sayi' || deger.tur === 'mantiksal';
}

/* ------------------------------------------------------------------ */
/* Sözdizimi yardımcıları                                              */
/* ------------------------------------------------------------------ */

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

/** `stil` bloğu için yorum ayıklama: `#313244` gibi renkler yorum sayılmaz. */
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
      // Renk kodu mu, yorum mu?
      const kalan = satir.slice(i);
      if (/^#[0-9a-fA-F]{3,8}(?![0-9a-zA-Z])/.test(kalan)) continue;
      if (/^#[0-9a-fA-F]{3,8}$/.test(kalan.trim())) continue;
      return satir.slice(0, i);
    }
  }
  return satir;
}

/** `betik` bloğu taramasının satırlar arası durumu. */
interface BetikTarama {
  derinlik: number;
  tirnak: string;
  blokYorum: boolean;
  acildi: boolean;
}

/**
 * `betik` bloğunda parantez sayımı.
 *
 * `stil` bloğundan farkı: gövdede JavaScript olduğu için `//`, `/* *\/`, `"`,
 * `'` ve `` ` `` farkındalıklı çalışır. Aksi hâlde `"("` gibi bir metin
 * parantez sayımını bozardı.
 */
function betikTara(satir: string, durum: BetikTarama, acilis: string, kapanis: string): void {
  for (let k = 0; k < satir.length; k++) {
    const c = satir[k];
    if (durum.blokYorum) {
      if (c === '*' && satir[k + 1] === '/') {
        durum.blokYorum = false;
        k++;
      }
      continue;
    }
    if (durum.tirnak) {
      if (c === '\\') {
        k++;
        continue;
      }
      if (c === durum.tirnak) durum.tirnak = '';
      continue;
    }
    if (c === '/' && satir[k + 1] === '/') return;
    if (c === '/' && satir[k + 1] === '*') {
      durum.blokYorum = true;
      k++;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      durum.tirnak = c;
      continue;
    }
    if (c === acilis) {
      durum.derinlik++;
      durum.acildi = true;
    } else if (c === kapanis) {
      durum.derinlik--;
    }
  }
}

/** `ayraç` karakterini parantez/metin derinliği 0 iken arar; bulunan indeksleri döndürür. */
function ayracBul(metin: string, ayrac: string): number[] {
  const sonuc: number[] = [];
  let derinlik = 0;
  let metinde = false;
  for (let i = 0; i < metin.length; i++) {
    const c = metin[i];
    if (metinde) {
      if (c === '\\') i++;
      else if (c === '"') metinde = false;
      continue;
    }
    if (c === '"') metinde = true;
    else if ('([{'.includes(c)) derinlik++;
    else if (')]}'.includes(c)) derinlik--;
    else if (derinlik === 0 && metin.startsWith(ayrac, i)) {
      sonuc.push(i);
      i += ayrac.length - 1;
    }
  }
  return sonuc;
}

/** Virgülleri üst düzeyde böler. */
function virgulleBol(metin: string): string[] {
  const parcalar: string[] = [];
  let baslangic = 0;
  const indeksler = ayracBul(metin, ',');
  for (const i of indeksler) {
    parcalar.push(metin.slice(baslangic, i));
    baslangic = i + 1;
  }
  parcalar.push(metin.slice(baslangic));
  return parcalar;
}

function girinti(satir: string): number {
  let n = 0;
  for (const c of satir) {
    if (c === ' ') n++;
    else if (c === '\t') n += 4;
    else break;
  }
  return n;
}

/* ------------------------------------------------------------------ */
/* Yorumlayıcı                                                         */
/* ------------------------------------------------------------------ */

export class TurkodYorumlayici {
  private satirlar: string[] = [];
  private adimlar: Adim[] = [];
  private fonksiyonlar = new Map<string, FonksiyonDegeri>();
  private nesneTurleri = new Map<string, NesneTuru>();
  private kuresel: Baglam = { degiskenler: new Map(), sabitler: new Set() };
  private cikisIstedi = false;
  /** `dur` komutuyla döngüden çıkılması istendi mi? */
  private durmaIstendi = false;
  private calismaKlasoru: string;
  private modulOnbellek = new Map<string, { kuresel: Baglam; fonksiyonlar: Map<string, FonksiyonDegeri> }>();
  private kanca?: CalistirmaKancasi;
  /** TürkUI bileşen kimliği → olay adı → işleyici. */
  private turkuiOlaylari = new Map<string, Map<string, { govde: Adim[]; baglam: Baglam; satir: number }>>();
  /** TürkUI bileşen kimliği → yerli bileşen nesnesi (olay özelliklerini uygulamak için). */
  private turkuiBilesenleri = new Map<string, Record<string, any>>();
  /** TürkUI pencere kimliği → yerli pencere nesnesi (betikten gelen komutlar için). */
  private turkuiPencereleri = new Map<string, Record<string, any>>();
  /** `pencereAçıldığında` olayı bir kez çalıştırılan pencereler. */
  private turkuiAcilisTetiklenen = new Set<string>();

  constructor(private kaynak: string, private secenekler: CalistirmaSecenekleri) {
    this.calismaKlasoru = secenekler.klasor;
    this.kanca = secenekler.kanca;
    this.sayisalEkle();
  }

  private sayisalEkle(): void {
    const alanlar: Record<string, TurkodDeger> = {};
    // sayısal.iste ve sayısal.oku
    alanlar['iste'] = new TurkodDeger('fonksiyon', { ad: 'sayisal_iste', parametreler: [], govde: [], kapali: this.kuresel } as any);
    alanlar['oku'] = new TurkodDeger('fonksiyon', { ad: 'sayisal_oku', parametreler: [], govde: [], kapali: this.kuresel } as any);
    this.kuresel.degiskenler.set('sayısal', TurkodDeger.nesne(alanlar, 'sayısal'));
  }

  /** Programı çalıştırır; çalışma zamanı hatalarında `TurkodHatasi` fırlatır. */
  async calistir(): Promise<void> {
    this.satirlar = this.kaynak.split(/\r?\n/);
    this.adimlar = this.blokCoz(0, this.satirlar.length, -1).adimlar;
    try {
      await this.adimlariCalistir(this.adimlar, this.kuresel);
    } catch (e) {
      if (e instanceof Sinyal) {
        if (e.tip === 'don') return;
        if (e.tip === 'cikis') return;
        throw new TurkodHatasi('`kır` (veya `dur`) yalnızca döngü içinde kullanılabilir.', undefined);
      }
      throw e;
    }
  }

  /* ---------------- Ayrıştırma ---------------- */

  private blokCoz(baslangic: number, bitis: number, ebeveynGirinti: number): { adimlar: Adim[]; sonraki: number } {
    const adimlar: Adim[] = [];
    let i = baslangic;
    while (i < bitis) {
      const ham = this.satirlar[i];
      const kirp = yorumsuz(ham).trim();
      if (BOS_KUME.has(kirp)) {
        i++;
        continue;
      }
      const g = girinti(ham);
      if (ebeveynGirinti >= 0 && g <= ebeveynGirinti && /^son$/.test(kirp)) break;

      const sonuc = this.adimCoz(i, bitis, g, adimlar);
      i = sonuc;
    }
    return { adimlar, sonraki: i };
  }

  /** Bir satırı (ve gerekiyorsa gövdesini) çözer, sonraki satır indeksini döndürür. */
  private adimCoz(i: number, bitis: number, g: number, adimlar: Adim[], sonTuket = true): number {
    const ham = this.satirlar[i];
    const kirp = yorumsuz(ham).trim();
    const satir = i + 1;

    // eğer ... ise veya değilse-eğer ... ise
    let egKirp = kirp;
    let eg = /^eğer\s+(.+?)\s+ise\s*$/.exec(egKirp);
    if (!eg) {
      const de = /^değilse-eğer\s+(.+?)\s+ise\s*$/.exec(egKirp) || /^değilse\s*eğer\s+(.+?)\s+ise\s*$/.exec(egKirp);
      if (de) {
        egKirp = `eğer ${de[1]} ise`;
        eg = /^eğer\s+(.+?)\s+ise\s*$/.exec(egKirp);
      }
    }
    if (eg) {
      const govde = this.egGovdesiniBul(i, bitis, g);
      let sonraki = govde.sonraki;
      let degilse: Adim[] = [];
      let zincir: Adim[] | undefined;

      // `değilse` / `değilse-eğer` bir sonraki anlamlı satırda ve aynı girinti
      // düzeyinde (ya da en fazla bir blok içeride) olabilir.
      let altG = -1;
      let altKirp = '';
      if (sonraki < bitis) {
        altKirp = yorumsuz(this.satirlar[sonraki]).trim();
        altG = girinti(this.satirlar[sonraki]);
      }
      const altKabul = sonraki < bitis && altG >= g && altG <= g + 8 && !BOS_KUME.has(altKirp);
      const degilseEgerMi = altKabul && (/^değilse-eğer\b/.test(altKirp) || /^değilse\s+eğer\b/.test(altKirp));
      const sadeceDegilseMi = altKabul && !degilseEgerMi && /^değilse\b/.test(altKirp);

      if (degilseEgerMi) {
        // "değilse-eğer ... ise" zincirin bir sonraki halkasıdır. Kapanış `son`
        // yalnızca zincirin tamamı çözüldükten sonra bir kez tüketilir; aksi
        // hâlde bir dıştaki bloğun `son` satırı da yanlışlıkla yutulur.
        const altAdimlar: Adim[] = [];
        sonraki = this.adimCoz(sonraki, bitis, altG, altAdimlar, false);
        zincir = altAdimlar;
      } else if (sadeceDegilseMi) {
        const d = this.blokCoz(sonraki + 1, bitis, altG);
        degilse = d.adimlar;
        sonraki = d.sonraki;
      }

      // kapanış `son`: zincirin kendi girinti düzeyinde olmalı; böylece
      // bir dıştaki bloğun `son` satırı yanlışlıkla tüketilmez.
      if (sonTuket && sonraki < bitis) {
        const kapanis = yorumsuz(this.satirlar[sonraki]).trim();
        const kapanisG = girinti(this.satirlar[sonraki]);
        if (/^son$/.test(kapanis) && kapanisG >= g && kapanisG <= g + 8) sonraki++;
      }
      adimlar.push({ tip: 'eğer', satir, kosul: eg[1], govde: govde.adimlar, degilse, zincir });
      return sonraki;
    }

    // döngü N kez / döngü x içinde liste kez
    const dongu = /^döngü\s+(.+?)\s+kez\s*$/.exec(kirp);
    if (dongu) {
      const govde = this.blokCoz(i + 1, bitis, g);
      const sonraki = this.sonTuket(govde.sonraki, bitis, g);
      adimlar.push({ tip: 'döngü', satir, sayi: dongu[1], govde: govde.adimlar });
      return sonraki;
    }

    // SonsuzDöngü koşul
    const sonsuz = /^SonsuzDöngü(?:\s+(.+?))?(?:\s+ise)?\s*$/.exec(kirp);
    if (sonsuz) {
      const govde = this.blokCoz(i + 1, bitis, g);
      const sonraki = this.sonTuket(govde.sonraki, bitis, g);
      adimlar.push({ tip: 'kosulluDöngü', satir, kosul: sonsuz[1] ?? 'Doğru', govde: govde.adimlar });
      return sonraki;
    }

    // için x içinde liste
    const icin = /^için\s+([A-Za-z_ğüşıöçĞÜŞİÖÇ][\wğüşıöçĞÜŞİÖÇ]*)\s+içinde\s+(.+?)\s*$/.exec(kirp);
    if (icin) {
      const govde = this.blokCoz(i + 1, bitis, g);
      const sonraki = this.sonTuket(govde.sonraki, bitis, g);
      adimlar.push({ tip: 'için', satir, degisken: icin[1], ifade: icin[2], govde: govde.adimlar });
      return sonraki;
    }

    // fonksiyon ad(a, b)
    const fonk = /^fonksiyon\s+([A-Za-z_ğüşıöçĞÜŞİÖÇ][\wğüşıöçĞÜŞİÖÇ]*)\s*\(([^)]*)\)\s*$/.exec(kirp);
    if (fonk) {
      const govde = this.blokCoz(i + 1, bitis, g);
      const sonraki = this.sonTuket(govde.sonraki, bitis, g);
      const parametreler = virgulleBol(fonk[2])
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => {
          const parcalar = p.split(':=');
          return { ad: parcalar[0].trim(), varsayilan: parcalar.length > 1 ? parcalar[1].trim() : undefined };
        });
      adimlar.push({ tip: 'fonksiyon', satir, ad: fonk[1], parametreler, govde: govde.adimlar });
      return sonraki;
    }

    // nesne Ad
    const nesne = /^nesne\s+([A-Za-z_ğüşıöçĞÜŞİÖÇ][\wğüşıöçĞÜŞİÖÇ]*)\s*$/.exec(kirp);
    if (nesne) {
      const govde = this.blokCoz(i + 1, bitis, g);
      const sonraki = this.sonTuket(govde.sonraki, bitis, g);
      adimlar.push({ tip: 'nesne', satir, ad: nesne[1], govde: govde.adimlar });
      return sonraki;
    }

    // dene ... yakala h ... son
    if (/^dene\s*$/.test(kirp)) {
      const govde = this.blokCoz(i + 1, bitis, g);
      let sonraki = govde.sonraki;
      let hataAdi = 'hata';
      let yakala: Adim[] = [];
      const yakalaBaslangic = this.yakalaSatiri(sonraki, bitis, g);
      if (yakalaBaslangic >= 0) {
        const yakalaKirp = yorumsuz(this.satirlar[yakalaBaslangic]).trim();
        const m = /^yakala\s+([A-Za-z_ğüşıöçĞÜŞİÖÇ][\wğüşıöçĞÜŞİÖÇ]*)/.exec(yakalaKirp);
        if (m) hataAdi = m[1];
        const y = this.blokCoz(yakalaBaslangic + 1, bitis, girinti(this.satirlar[yakalaBaslangic]));
        yakala = y.adimlar;
        sonraki = y.sonraki;
      }
      sonraki = this.sonTuket(sonraki, bitis, g);
      adimlar.push({ tip: 'dene', satir, govde: govde.adimlar, hataAdi, yakala });
      return sonraki;
    }

    // TürkUI.stil { hedef( özellik: değer ... ) ... } bloğu
    const stilBasligi = /^([A-Za-z_ğüşıöçĞÜŞİÖÇ][\wğüşıöçĞÜŞİÖÇ]*)\s*\.\s*stil\s*\{/.exec(kirp);
    if (stilBasligi) {
      if (!turkuiModulAdiMi(stilBasligi[1])) {
        throw new TurkodHatasi(
          `\`stil\` bloğu TürkUI modülüne aittir: \`TürkUI.stil { ... }\` yazın (yazılan: "${stilBasligi[1]}.stil").`,
          satir
        );
      }
      const blok = this.stilBloguCoz(i, bitis);
      adimlar.push({ tip: 'stil', satir, gruplar: blok.gruplar });
      return blok.sonraki;
    }

    // Eski/kısa kullanım: `stil { ... }` artık modüle bağlı, anlaşılır hata verilir.
    if (/^stil\s*\{/.test(kirp)) {
      throw new TurkodHatasi(
        '`stil` bloğu TürkUI modülüne aittir: `TürkUI.stil { hedef( özellik: değer ) }` biçiminde yazın.',
        satir
      );
    }

    // TürkUI.betik { pencere( ... Türkçe JavaScript ... ) } bloğu
    const betikBasligi = /^([A-Za-z_ğüşıöçĞÜŞİÖÇ][\wğüşıöçĞÜŞİÖÇ]*)\s*\.\s*betik\s*\{/.exec(kirp);
    if (betikBasligi) {
      if (!turkuiModulAdiMi(betikBasligi[1])) {
        throw new TurkodHatasi(
          `\`betik\` bloğu TürkUI modülüne aittir: \`TürkUI.betik { ... }\` yazın (yazılan: "${betikBasligi[1]}.betik").`,
          satir
        );
      }
      const blok = this.betikBloguCoz(i, bitis);
      adimlar.push({ tip: 'betik', satir, gruplar: blok.gruplar });
      return blok.sonraki;
    }

    // Oyun.sahne { küp( renk: turuncu ... ) }
    const oyunBasligi = /^([A-Za-z_ğüşıöçĞÜŞİÖÇ][\wğüşıöçĞÜŞİÖÇ]*)\s*\.\s*sahne\s*\{/i.exec(kirp);
    if (oyunBasligi) {
      if (MODUL_NORMAL(oyunBasligi[1]) !== 'oyun') {
        throw new TurkodHatasi(`\`sahne\` bloğu Oyun modülüne aittir: \`Oyun.sahne { ... }\` yazın.`, satir);
      }
      const blok = this.oyunSahneBloguCoz(i, bitis);
      adimlar.push({ tip: 'oyunSahne', satir, kaynak: blok.kaynak });
      return blok.sonraki;
    }

    // Eski/kısa kullanım: `betik { ... }` artık modüle bağlı.
    if (/^betik\s*\{/.test(kirp)) {
      throw new TurkodHatasi(
        '`betik` bloğu TürkUI modülüne aittir: `TürkUI.betik { pencere( ... ) }` biçiminde yazın.',
        satir
      );
    }

    // TürkUI olay bloğu: buton.tıklandığında ... son
    const olay = new RegExp(`^(${TANIMLAYICI}(?:\\s*\\.\\s*${TANIMLAYICI})*)\\s*\\.\\s*(${TANIMLAYICI})\\s*$`).exec(kirp);
    if (olay && TURKUI_OLAYLARI.has(olay[2])) {
      const govde = this.blokCoz(i + 1, bitis, g);
      const sonraki = this.sonTuket(govde.sonraki, bitis, g);
      adimlar.push({
        tip: 'olay',
        satir,
        nesne: olay[1].replace(/\s+/g, ''),
        olay: olay[2],
        govde: govde.adimlar,
      });
      return sonraki;
    }

    // dışa_aktar ve diğer bildirimler: normal satır
    adimlar.push({ tip: 'satir', satir, metin: kirp });
    return i + 1;
  }

  /** `dene` bloğundan sonra gelen `yakala` satırını bulur (aynı ya da bir düzey içeride). */
  private yakalaSatiri(baslangic: number, bitis: number, g: number): number {
    for (let i = baslangic; i < bitis; i++) {
      const kirp = yorumsuz(this.satirlar[i]).trim();
      if (BOS_KUME.has(kirp)) continue;
      const gi = girinti(this.satirlar[i]);
      if (gi < g || gi > g + 8) return -1;
      return /^yakala(\s|$)/.test(kirp) ? i : -1;
    }
    return -1;
  }

  /**
   * `TürkUI.stil { hedef( özellik: değer ) ... }` bloğunu çözer.
   * Blok, süslü parantezler eşleşene kadar (tırnak farkındalıklı) toplanır.
   */
  private stilBloguCoz(i: number, bitis: number): { gruplar: StilGrubu[]; sonraki: number } {
    const parcalar: string[] = [];
    let derinlik = 0;
    let acildi = false;
    let j = i;
    for (; j < bitis; j++) {
      const temiz = yorumsuzStil(this.satirlar[j]);
      parcalar.push(temiz);
      let metinde = false;
      for (let k = 0; k < temiz.length; k++) {
        const c = temiz[k];
        if (c === '\\' && metinde) {
          k++;
          continue;
        }
        if (c === '"') {
          metinde = !metinde;
          continue;
        }
        if (metinde) continue;
        if (c === '{') {
          derinlik++;
          acildi = true;
        } else if (c === '}') {
          derinlik--;
        }
      }
      if (acildi && derinlik <= 0) {
        j++;
        break;
      }
    }

    const metin = parcalar.join('\n');
    const acilis = metin.indexOf('{');
    const kapanis = metin.lastIndexOf('}');
    if (acilis < 0 || kapanis < acilis) {
      throw new TurkodHatasi('`TürkUI.stil` bloğu kapatılmamış: `}` bekleniyor.', i + 1);
    }
    const govde = metin.slice(acilis + 1, kapanis);

    return { gruplar: this.stilGruplariniCoz(govde, i + 1), sonraki: j };
  }

  /** `Oyun.sahne { ... }` bloğunu tırnak farkındalıklı şekilde toplar. */
  private oyunSahneBloguCoz(i: number, bitis: number): { kaynak: string; sonraki: number } {
    const parcalar: string[] = [];
    let derinlik = 0;
    let acildi = false;
    let j = i;
    for (; j < bitis; j++) {
      const satir = yorumsuz(this.satirlar[j]);
      parcalar.push(satir);
      let tirnak = '';
      for (let k = 0; k < satir.length; k++) {
        const c = satir[k];
        if (tirnak) {
          if (c === '\\') k++;
          else if (c === tirnak) tirnak = '';
          continue;
        }
        if (c === '"' || c === "'") tirnak = c;
        else if (c === '{') {
          derinlik++;
          acildi = true;
        } else if (c === '}') derinlik--;
      }
      if (acildi && derinlik <= 0) {
        j++;
        break;
      }
    }
    const metin = parcalar.join('\n');
    const acilis = metin.indexOf('{');
    const kapanis = metin.lastIndexOf('}');
    if (acilis < 0 || kapanis < acilis) {
      throw new TurkodHatasi('`Oyun.sahne` bloğu kapatılmamış: `}` bekleniyor.', i + 1);
    }
    return { kaynak: metin.slice(acilis + 1, kapanis), sonraki: j };
  }

  /** `stil` bloğunun gövdesini `hedef( ... )` gruplarına ayırır. */
  private stilGruplariniCoz(govde: string, temelSatir: number): StilGrubu[] {
    const gruplar: StilGrubu[] = [];
    const satirBul = (konum: number): number => {
      let n = 0;
      for (let k = 0; k < konum && k < govde.length; k++) if (govde[k] === '\n') n++;
      return temelSatir + n;
    };

    let p = 0;
    while (p < govde.length) {
      // Boşluk ve ayraçları atla.
      while (p < govde.length && /[\s;,]/.test(govde[p])) p++;
      if (p >= govde.length) break;

      const hedefBas = p;
      while (p < govde.length && /[\wğüşıöçĞÜŞİÖÇ.]/.test(govde[p])) p++;
      const hedef = govde.slice(hedefBas, p).trim();
      if (!hedef) {
        throw new TurkodHatasi('`stil` bloğunda hedef adı bekleniyordu. Örnek: `buton1( ... )`.', satirBul(p));
      }

      while (p < govde.length && /\s/.test(govde[p])) p++;
      if (govde[p] !== '(') {
        throw new TurkodHatasi(
          `\`stil\` bloğunda "${hedef}" için "(" bekleniyordu. Örnek: \`${hedef}( arkaPlan: #181825 )\`.`,
          satirBul(p)
        );
      }

      const grupSatir = satirBul(hedefBas);
      p++; // "("
      const icBas = p;
      let icDerinlik = 1;
      let metinde = false;
      while (p < govde.length) {
        const c = govde[p];
        if (c === '\\' && metinde) {
          p += 2;
          continue;
        }
        if (c === '"') {
          metinde = !metinde;
        } else if (!metinde) {
          if (c === '(') icDerinlik++;
          else if (c === ')') {
            icDerinlik--;
            if (icDerinlik === 0) break;
          }
        }
        p++;
      }
      if (icDerinlik !== 0) {
        throw new TurkodHatasi(`\`stil\` bloğunda "${hedef}(" grubu kapatılmamış; ")" bekleniyordu.`, grupSatir);
      }
      const icerik = govde.slice(icBas, p);
      p++; // ")"

      const cozum = this.stilGovdesiniCoz(icerik, satirBul(icBas));
      gruplar.push({
        hedef,
        satir: grupSatir,
        bildirimler: cozum.bildirimler,
        durumlar: cozum.durumlar,
      });
    }

    if (gruplar.length === 0) {
      throw new TurkodHatasi('`stil` bloğu boş: en az bir `hedef( özellik: değer )` grubu gerekli.', temelSatir);
    }
    return gruplar;
  }

  /**
   * Hedef grubunun gövdesini düz bildirimlere ve durum (`üzerineGelince( ... )`)
   * gruplarına ayırır.
   *
   * Durum grubu, satır başında ya da ayraçtan sonra yazılan `ad(` biçimidir.
   * Değer içindeki `rgb(...)` gibi parantezler durum sanılmaz.
   */
  private stilGovdesiniCoz(
    icerik: string,
    temelSatir: number
  ): { bildirimler: StilBildirimi[]; durumlar: StilDurumuGrubu[] } {
    const bildirimler: StilBildirimi[] = [];
    const durumlar: StilDurumuGrubu[] = [];
    const durumAdlari = new Set(stilDurumlari.map((durum) => durum.ad));

    const satirBul = (konum: number): number => {
      let n = 0;
      for (let k = 0; k < konum && k < icerik.length; k++) if (icerik[k] === '\n') n++;
      return temelSatir + n;
    };

    /** `bas`-`son` arasındaki parçayı bildirim olarak çözer. */
    const bildirimEkle = (bas: number, son: number): void => {
      let b = bas;
      while (b < son && /\s/.test(icerik[b])) b++;
      if (b >= son) return;
      for (const bildirim of this.stilBildirimleriniCoz(icerik.slice(b, son), satirBul(b))) {
        bildirimler.push(bildirim);
      }
    };

    /** `(` konumundan itibaren eşleşen `)` konumunu bulur (tırnak farkındalıklı). */
    const kapanisBul = (acilis: number): number => {
      let derinlik = 0;
      let metinde = false;
      for (let k = acilis; k < icerik.length; k++) {
        const c = icerik[k];
        if (c === '\\' && metinde) {
          k++;
          continue;
        }
        if (c === '"') {
          metinde = !metinde;
          continue;
        }
        if (metinde) continue;
        if (c === '(') derinlik++;
        else if (c === ')') {
          derinlik--;
          if (derinlik === 0) return k;
        }
      }
      return -1;
    };

    let i = 0;
    let parcaBas = 0;
    while (i < icerik.length) {
      const c = icerik[i];
      if (c === '"') {
        i++;
        while (i < icerik.length) {
          if (icerik[i] === '\\') {
            i += 2;
            continue;
          }
          if (icerik[i] === '"') {
            i++;
            break;
          }
          i++;
        }
        continue;
      }
      if (c === '\n' || c === ';' || c === ',') {
        bildirimEkle(parcaBas, i);
        i++;
        parcaBas = i;
        continue;
      }
      if (c !== '(') {
        i++;
        continue;
      }

      // `(` öncesindeki tanımlayıcıyı oku.
      let q = i - 1;
      while (q >= parcaBas && /\s/.test(icerik[q])) q--;
      const adSon = q + 1;
      while (q >= parcaBas && /[\wğüşıöçĞÜŞİÖÇ]/.test(icerik[q])) q--;
      const ad = icerik.slice(q + 1, adSon);
      const onek = icerik.slice(parcaBas, q + 1);
      const durumBaslangici = ad !== '' && /^\s*$/.test(onek);

      const kapanis = kapanisBul(i);
      if (durumBaslangici && !durumAdlari.has(ad)) {
        throw new TurkodHatasi(
          `\`stil\` bloğunda "${ad}(" durumu bilinmiyor. Geçerli durumlar: ${[...durumAdlari].join(', ')}.`,
          satirBul(q + 1)
        );
      }
      if (durumBaslangici && kapanis < 0) {
        throw new TurkodHatasi(
          `\`stil\` bloğunda "${ad}(" durumu kapatılmamış; ")" bekleniyordu.`,
          satirBul(q + 1)
        );
      }
      if (!durumBaslangici) {
        // Önceki değerin ardına bitişik yazılan durum grubu: açıklayıcı hata.
        if (durumAdlari.has(ad)) {
          throw new TurkodHatasi(
            `\`stil\` bloğunda "${ad}(" durum grubu yeni satırda ya da ";" sonrasında başlamalı.`,
            satirBul(q + 1)
          );
        }
        // Değer içindeki `rgb(...)`, `ölçek(...)` gibi parantezler: atla.
        if (kapanis < 0) {
          throw new TurkodHatasi('`stil` bloğunda parantez kapatılmamış; ")" bekleniyordu.', satirBul(i));
        }
        i = kapanis + 1;
        continue;
      }

      const grupSatir = satirBul(q + 1);
      const ic = icerik.slice(i + 1, kapanis);
      const icCozum = this.stilGovdesiniCoz(ic, grupSatir);
      if (icCozum.durumlar.length > 0) {
        const icDurum = icCozum.durumlar[0];
        throw new TurkodHatasi(
          `\`stil\` bloğunda durum grupları iç içe yazılamaz: "${icDurum.ad}(" ` +
            `zaten "${ad}(" durumunun içinde.`,
          icDurum.satir
        );
      }
      durumlar.push({ ad, satir: grupSatir, bildirimler: icCozum.bildirimler });
      i = kapanis + 1;
      parcaBas = i;
    }
    bildirimEkle(parcaBas, icerik.length);

    return { bildirimler, durumlar };
  }

  /** Grup içindeki `özellik: değer` satırlarını çözer. */
  private stilBildirimleriniCoz(icerik: string, temelSatir: number): StilBildirimi[] {
    const bildirimler: StilBildirimi[] = [];
    const satirlar = icerik.split('\n');
    for (let n = 0; n < satirlar.length; n++) {
      const ham = satirlar[n].trim();
      if (!ham || ham === ';' || ham === ',') continue;
      for (const parca of ham.split(';')) {
        const metin = parca.trim();
        if (!metin) continue;
        const ikiNokta = metin.indexOf(':');
        if (ikiNokta < 0) {
          throw new TurkodHatasi(
            `\`stil\` bloğunda "${metin}" anlaşılmadı; "özellik: değer" biçiminde yazılmalı.`,
            temelSatir + n
          );
        }
        const ad = metin.slice(0, ikiNokta).trim();
        const deger = metin.slice(ikiNokta + 1).trim();
        if (!ad) throw new TurkodHatasi('`stil` bloğunda özellik adı boş olamaz.', temelSatir + n);
        if (!deger) {
          throw new TurkodHatasi(`\`stil\` bloğunda "${ad}" özelliğinin değeri boş.`, temelSatir + n);
        }
        bildirimler.push({ ad, deger, satir: temelSatir + n });
      }
    }
    return bildirimler;
  }

  /**
   * `TürkUI.betik { pencere( ... ) }` bloğunu çözer.
   *
   * `stil` bloğundan farkı: gövdede JavaScript vardır; bu yüzden süslü parantez
   * sayımı `//`, `/* *\/`, `"`, `'` ve `` ` `` farkındalıklı yapılır.
   */
  private betikBloguCoz(i: number, bitis: number): { gruplar: BetikGrubu[]; sonraki: number } {
    const parcalar: string[] = [];
    const durum: BetikTarama = { derinlik: 0, tirnak: '', blokYorum: false, acildi: false };
    let j = i;
    for (; j < bitis; j++) {
      const ham = this.satirlar[j];
      parcalar.push(ham);
      betikTara(ham, durum, '{', '}');
      if (durum.acildi && durum.derinlik <= 0) {
        j++;
        break;
      }
    }

    const metin = parcalar.join('\n');
    const acilis = metin.indexOf('{');
    const kapanis = metin.lastIndexOf('}');
    if (acilis < 0 || kapanis < acilis) {
      throw new TurkodHatasi('`TürkUI.betik` bloğu kapatılmamış: `}` bekleniyor.', i + 1);
    }
    const govde = metin.slice(acilis + 1, kapanis);

    return { gruplar: this.betikGruplariniCoz(govde, i + 1), sonraki: j };
  }

  /** `betik` bloğunun gövdesini `pencere( ... )` gruplarına ayırır. */
  private betikGruplariniCoz(govde: string, temelSatir: number): BetikGrubu[] {
    const gruplar: BetikGrubu[] = [];
    const satirBul = (konum: number): number => {
      let n = 0;
      for (let k = 0; k < konum && k < govde.length; k++) if (govde[k] === '\n') n++;
      return temelSatir + n;
    };

    let p = 0;
    while (p < govde.length) {
      while (p < govde.length && /[\s;,]/.test(govde[p])) p++;
      if (p >= govde.length) break;

      const hedefBas = p;
      while (p < govde.length && /[\wğüşıöçĞÜŞİÖÇ.]/.test(govde[p])) p++;
      const hedef = govde.slice(hedefBas, p).trim();
      if (!hedef) {
        throw new TurkodHatasi(
          '`betik` bloğunda hedef adı bekleniyordu. Örnek: `uygulama( ... )`.',
          satirBul(p)
        );
      }

      while (p < govde.length && /\s/.test(govde[p])) p++;
      if (govde[p] !== '(') {
        throw new TurkodHatasi(
          `\`betik\` bloğunda "${hedef}" için "(" bekleniyordu. Örnek: \`${hedef}( ... )\`.`,
          satirBul(p)
        );
      }

      const grupSatir = satirBul(hedefBas);
      p++; // "("
      const icBas = p;
      const durum: BetikTarama = { derinlik: 1, tirnak: '', blokYorum: false, acildi: true };
      while (p < govde.length) {
        const c = govde[p];
        if (durum.tirnak === '`' && c === '$' && govde[p + 1] === '{') {
          // Şablon içindeki `${ ... }` ifadesi: parantez sayımı sürer.
          durum.derinlik++;
          p += 2;
          continue;
        }
        if (durum.blokYorum) {
          if (c === '*' && govde[p + 1] === '/') {
            durum.blokYorum = false;
            p += 2;
            continue;
          }
          p++;
          continue;
        }
        if (durum.tirnak) {
          if (c === '\\') {
            p += 2;
            continue;
          }
          if (c === durum.tirnak) durum.tirnak = '';
          p++;
          continue;
        }
        if (c === '/' && govde[p + 1] === '/') {
          const son = govde.indexOf('\n', p);
          p = son < 0 ? govde.length : son;
          continue;
        }
        if (c === '/' && govde[p + 1] === '*') {
          durum.blokYorum = true;
          p += 2;
          continue;
        }
        if (c === '"' || c === "'" || c === '`') {
          durum.tirnak = c;
          p++;
          continue;
        }
        if (c === '(') durum.derinlik++;
        else if (c === ')') {
          durum.derinlik--;
          if (durum.derinlik === 0) break;
        }
        p++;
      }
      if (durum.derinlik !== 0) {
        throw new TurkodHatasi(
          `\`betik\` bloğunda "${hedef}(" grubu kapatılmamış; ")" bekleniyordu.`,
          grupSatir
        );
      }
      const kod = govde.slice(icBas, p);
      p++; // ")"

      gruplar.push({ hedef, satir: satirBul(icBas), kod });
    }

    if (gruplar.length === 0) {
      throw new TurkodHatasi(
        '`betik` bloğu boş: en az bir `pencere( ... )` grubu gerekli.',
        temelSatir
      );
    }
    return gruplar;
  }

  /** `betik` bloğu için pencere içindeki bileşenlerin ad → kimlik eşlemesi. */
  private betikBilesenHaritasi(wId: string, baglam: Baglam): Record<string, string> {
    const harita: Record<string, string> = {};
    for (let b: Baglam | undefined = baglam; b; b = b.ust) {
      for (const [ad, deger] of b.degiskenler) {
        if (harita[ad]) continue;
        if (deger.tur !== 'yerli') continue;
        const nesne = deger.deger;
        if (!nesne || typeof nesne !== 'object') continue;
        const kayit = nesne as Record<string, any>;
        if (kayit._turkuiType !== 'component') continue;
        if (String(kayit._windowId || '') !== wId) continue;
        if (typeof kayit._componentId === 'string' && kayit._componentId) {
          harita[ad] = kayit._componentId;
        }
      }
    }
    return harita;
  }

  /**
   * `betik` bloğunda kullanılabilecek pencere adları → pencere kimlikleri.
   *
   * Betik, pencerenin içinde (tarayıcı tarafında) çalıştığı için başka
   * pencerelere doğrudan erişemez; bu harita ile `uygulama2.göster()` gibi
   * çağrılar uzantıya iletilir.
   */
  private betikPencereHaritasi(baglam: Baglam): Record<string, string> {
    const harita: Record<string, string> = {};
    for (let b: Baglam | undefined = baglam; b; b = b.ust) {
      for (const [ad, deger] of b.degiskenler) {
        if (harita[ad]) continue;
        if (deger.tur !== 'yerli') continue;
        const nesne = deger.deger;
        if (!nesne || typeof nesne !== 'object') continue;
        const kayit = nesne as Record<string, any>;
        if (kayit._turkuiType !== 'window') continue;
        if (typeof kayit._windowId === 'string' && kayit._windowId) {
          harita[ad] = kayit._windowId;
          this.turkuiPencereleri.set(kayit._windowId, kayit);
        }
      }
    }
    return harita;
  }

  /**
   * `TürkUI.betik` içinden gelen pencere komutunu (`göster`, `gizle`,
   * `kapat`, `küçült`, `büyüt`, `normal`) uygular.
   */
  pencereKomutu(pencereId: string, komut: string): void {
    if (!PENCERE_KOMUTLARI.has(komut)) return;
    const kayitli = this.betikPencereNesnesi(pencereId);
    if (kayitli) {
      const islev = kayitli[komut];
      if (typeof islev === 'function') islev.call(kayitli);
      return;
    }
  }

  /** Pencere kimliğine karşılık gelen yerli pencere nesnesini bulur. */
  private betikPencereNesnesi(pencereId: string): Record<string, any> | undefined {
    const dogrudan = this.turkuiPencereleri.get(pencereId);
    if (dogrudan) return dogrudan;
    return Array.from(this.kuresel.degiskenler.values())
      .filter((deger) => deger.tur === 'yerli')
      .map((deger) => deger.deger as Record<string, any> | undefined)
      .find(
        (nesne) =>
          !!nesne &&
          typeof nesne === 'object' &&
          nesne._turkuiType === 'window' &&
          String(nesne._windowId || '') === pencereId
      );
  }

  private sonTuket(sonraki: number, bitis: number, g: number): number {
    if (sonraki < bitis) {
      const kirp = yorumsuz(this.satirlar[sonraki]).trim();
      if (/^son$/.test(kirp) && girinti(this.satirlar[sonraki]) <= g) return sonraki + 1;
    }
    return sonraki;
  }

  /**
   * `eğer` gövdesi bloğun sonuna kadar sürebilir; bu yüzden gövde çözümünden sonra
   * `değilse` / `yakala` satırları yeniden aranır.
   */
  private egGovdesiniBul(i: number, bitis: number, g: number): { adimlar: Adim[]; sonraki: number } {
    const govde: Adim[] = [];
    let j = i + 1;
    while (j < bitis) {
      const ham = this.satirlar[j];
      const kirp = yorumsuz(ham).trim();
      if (BOS_KUME.has(kirp)) {
        j++;
        continue;
      }
      const gi = girinti(ham);
      if (gi <= g) break;
      j = this.adimCoz(j, bitis, gi, govde);
    }
    return { adimlar: govde, sonraki: j };
  }

  /* ---------------- Yürütme ---------------- */

  private async adimlariCalistir(adimlar: Adim[], baglam: Baglam): Promise<void> {
    for (const adim of adimlar) {
      if (this.cikisIstedi) throw new Sinyal('cikis');
      if (this.durmaIstendi) throw DUR;
      await this.adimCalistir(adim, baglam);
    }
  }

  private async adimCalistir(adim: Adim, baglam: Baglam): Promise<void> {
    if (this.kanca && 'satir' in adim) {
      await this.kanca.satir(adim.satir);
      if (this.cikisIstedi) throw new Sinyal('cikis');
    }
    if (adim.tip !== 'satir') {
      // blok adımları için de satır bildirimi (hata ayıklamada satır satır ilerleme)
      await this.blokCalistir(adim, baglam);
      return;
    }
    await this.satirCalistir(adim.metin, adim.satir, baglam);
  }

  private async blokCalistir(adim: Exclude<Adim, { tip: 'satir' }>, baglam: Baglam): Promise<void> {
    switch (adim.tip) {
      case 'eğer': {
        if (dogruluk(await this.degerlendir(adim.kosul, baglam, adim.satir))) {
          await this.adimlariCalistir(adim.govde, { degiskenler: new Map(), sabitler: new Set(), ust: baglam });
          return;
        }
        if (adim.zincir && adim.zincir.length > 0) {
          const alt = adim.zincir[0];
          if (alt.tip === 'eğer') {
            await this.blokCalistir(alt, baglam);
            return;
          }
        }
        await this.adimlariCalistir(adim.degilse, { degiskenler: new Map(), sabitler: new Set(), ust: baglam });
        return;
      }
      case 'döngü': {
        const sayiDegeri = await this.degerlendir(adim.sayi, baglam, adim.satir);
        const adet = Math.floor(sayiyaCevir(sayiDegeri, adim.satir));
        for (let k = 0; k < adet; k++) {
          try {
            await this.adimlariCalistir(adim.govde, { degiskenler: new Map(), sabitler: new Set(), ust: baglam });
          } catch (e) {
            if (e === DUR) {
              this.durmaIstendi = false;
              break;
            }
            if (e === DEVAM) {
              this.durmaIstendi = false;
              continue;
            }
            throw e;
          }
        }
        return;
      }
      case 'kosulluDöngü': {
        let guvenlik = 0;
        while (dogruluk(await this.degerlendir(adim.kosul, baglam, adim.satir))) {
          if (++guvenlik > 5_000_000) {
            throw new TurkodHatasi('Döngü çok uzun sürdü (5.000.000 adım); sonsuz döngü olabilir.', adim.satir);
          }
          try {
            await this.adimlariCalistir(adim.govde, { degiskenler: new Map(), sabitler: new Set(), ust: baglam });
          } catch (e) {
            if (e === DUR) {
              this.durmaIstendi = false;
              break;
            }
            if (e === DEVAM) {
              this.durmaIstendi = false;
              continue;
            }
            throw e;
          }
        }
        return;
      }
      case 'için': {
        const kaynak = await this.degerlendir(adim.ifade, baglam, adim.satir);
        let ogeler: TurkodDeger[];
        if (kaynak.tur === 'liste' || kaynak.tur === 'kume') ogeler = kaynak.dizi;
        else if (kaynak.tur === 'metin') ogeler = [...kaynak.metinDeger].map((c) => TurkodDeger.metin(c));
        else if (kaynak.tur === 'sozluk') ogeler = [...kaynak.tablo.keys()].map((k) => TurkodDeger.metin(k));
        else throw new TurkodHatasi('`için` listeyi bekler.', adim.satir);

        for (const oge of ogeler) {
          const dongu = { degiskenler: new Map<string, TurkodDeger>([[adim.degisken, oge]]), sabitler: new Set<string>(), ust: baglam };
          try {
            await this.adimlariCalistir(adim.govde, dongu);
          } catch (e) {
            if (e === DUR) {
              this.durmaIstendi = false;
              break;
            }
            if (e === DEVAM) {
              this.durmaIstendi = false;
              continue;
            }
            throw e;
          }
        }
        return;
      }
      case 'fonksiyon': {
        const f: FonksiyonDegeri = { ad: adim.ad, parametreler: adim.parametreler, govde: adim.govde, kapali: baglam };
        this.fonksiyonlar.set(adim.ad, f);
        this.tan(adim.ad, new TurkodDeger('fonksiyon', f), baglam, false);
        return;
      }
      case 'nesne': {
        this.nesneTurleri.set(adim.ad, { ad: adim.ad, govde: adim.govde });
        return;
      }
      case 'olay': {
        const hedef = await this.degerlendir(adim.nesne, baglam, adim.satir);
        const nesne = hedef.tur === 'yerli' ? hedef.yerliDeger : undefined;
        const tur =
          nesne && typeof nesne === 'object' ? (nesne as Record<string, any>)._turkuiType : undefined;
        const kimlik =
          tur === 'component'
            ? (nesne as Record<string, any>)._componentId
            : tur === 'window'
              ? (nesne as Record<string, any>)._windowId
              : undefined;
        if (typeof kimlik !== 'string') {
          throw new TurkodHatasi(
            `"${adim.nesne}" bir TürkUI bileşeni veya penceresi değil; "${adim.olay}" olayı bağlanamaz.`,
            adim.satir
          );
        }
        let isleyiciler = this.turkuiOlaylari.get(kimlik);
        if (!isleyiciler) {
          isleyiciler = new Map();
          this.turkuiOlaylari.set(kimlik, isleyiciler);
        }
        isleyiciler.set(adim.olay, { govde: adim.govde, baglam, satir: adim.satir });
        if (nesne) this.turkuiBilesenleri.set(kimlik, nesne as Record<string, any>);

        // `göster()` çağrısından sonra kaydedilen pencere açılış olayı da çalışsın.
        if (
          tur === 'window' &&
          adim.olay === 'pencereAçıldığında' &&
          (nesne as Record<string, any>)._gosterildi === true &&
          !this.turkuiAcilisTetiklenen.has(kimlik)
        ) {
          await this.turkuiOlayTetikle(kimlik, adim.olay);
        }
        return;
      }
      case 'stil': {
        for (const grup of adim.gruplar) {
          const hedef = this.bul(grup.hedef, baglam);
          if (!hedef) {
            throw new TurkodHatasi(
              `\`stil\` bloğunda "${grup.hedef}" adlı değişken yok. Önce bileşeni oluşturun.`,
              grup.satir
            );
          }
          const nesne = hedef.tur === 'yerli' ? hedef.yerliDeger : undefined;
          const tur = nesne && typeof nesne === 'object' ? (nesne as Record<string, any>)._turkuiType : undefined;
          if (tur !== 'component' && tur !== 'window') {
            throw new TurkodHatasi(
              `"${grup.hedef}" bir TürkUI bileşeni ya da penceresi değil; \`stil\` bloğuyla stil uygulanamaz.`,
              grup.satir
            );
          }
          const bildirimMetni = async (bildirimler: StilBildirimi[]): Promise<string> => {
            const parcalar: string[] = [];
            for (const bildirim of bildirimler) {
              parcalar.push(bildirim.ad + ': ' + (await this.stilDegeriMetni(bildirim, baglam)) + ';');
            }
            return parcalar.join(' ');
          };

          // Durum grubu yoksa eski davranış korunur: düz bildirim listesi.
          let css = await bildirimMetni(grup.bildirimler);
          if (grup.durumlar.length > 0) {
            const kurallar: string[] = [];
            if (css) kurallar.push(`& { ${css} }`);
            for (const durum of grup.durumlar) {
              kurallar.push(`&${durum.ad} { ${await bildirimMetni(durum.bildirimler)} }`);
            }
            css = kurallar.join(' ');
          }
          if (tur === 'window') {
            // `pencere.stil(css)` ile aynı yol: pencere düzeyi CSS'i uygular.
            const pencereStili = (nesne as Record<string, any>).stil;
            if (typeof pencereStili === 'function') pencereStili.call(nesne, css);
            else yerliUyeYaz(nesne, 'stil', TurkodDeger.metin(css));
          } else {
            yerliUyeYaz(nesne, 'stil', TurkodDeger.metin(css));
          }
        }
        return;
      }
      case 'betik': {
        for (const grup of adim.gruplar) {
          const hedef = this.bul(grup.hedef, baglam);
          if (!hedef) {
            throw new TurkodHatasi(
              `\`betik\` bloğunda "${grup.hedef}" adlı değişken yok. Önce pencereyi oluşturun.`,
              grup.satir
            );
          }
          const nesne = hedef.tur === 'yerli' ? hedef.yerliDeger : undefined;
          const tur = nesne && typeof nesne === 'object' ? (nesne as Record<string, any>)._turkuiType : undefined;
          if (tur !== 'window') {
            throw new TurkodHatasi(
              `\`betik\` bloğu pencere hedeflidir: "${grup.hedef}" bir TürkUI penceresi olmalı. Örnek: \`TürkUI.betik { ${grup.hedef}( ... ) }\`.`,
              grup.satir
            );
          }
          const wId = String((nesne as Record<string, any>)._windowId || '');
          const harita = this.betikBilesenHaritasi(wId, baglam);
          const pencereler = this.betikPencereHaritasi(baglam);
          const betik = (nesne as Record<string, any>).betik;
          if (typeof betik !== 'function') {
            throw new TurkodHatasi('Bu pencerede `betik` desteklenmiyor.', grup.satir);
          }
          betik.call(nesne, grup.kod, harita, grup.satir, pencereler);
        }
        return;
      }
      case 'oyunSahne': {
        if (!oyunModuluEtkinMi()) throw new TurkodHatasi('Oyun modülü şu anda devre dışı. Açmak için `turkod.oyunModuluEtkin` ayarını etkinleştirin.', adim.satir);
        if (!this.bul('Oyun', baglam)) {
          throw new TurkodHatasi('`Oyun.sahne` için önce `içe_aktar Oyun` yazın.', adim.satir);
        }
        try {
          const python = oyunSahnesiniPythonaCevir(adim.kaynak, adim.satir);
          ursinaSahnesiniBaslat(python, this.secenekler.klasor, this.secenekler.yaz);
        } catch (e) {
          throw new TurkodHatasi(e instanceof Error ? e.message : String(e), adim.satir);
        }
        return;
      }
      case 'dene': {
        try {
          await this.adimlariCalistir(adim.govde, { degiskenler: new Map(), sabitler: new Set(), ust: baglam });
        } catch (e) {
          if (e instanceof Sinyal || e === DUR || e === DEVAM) throw e;
          const mesaj = e instanceof TurkodHatasi ? e.message : e instanceof Error ? e.message : String(e);
          const yakalama = { degiskenler: new Map<string, TurkodDeger>([[adim.hataAdi, TurkodDeger.metin(mesaj)]]), sabitler: new Set<string>(), ust: baglam };
          await this.adimlariCalistir(adim.yakala, yakalama);
        }
        return;
      }
    }
  }

  /** `stil` bloğundaki bir değeri CSS metnine çevirir. */
  private async stilDegeriMetni(bildirim: StilBildirimi, baglam: Baglam): Promise<string> {
    const metin = await this.stilDegeriHam(bildirim, baglam);
    // `geçiş: 1` gibi çıplak sayılar CSS'te geçersizdir; saniye olarak yorumlanır.
    if (bildirim.ad === 'geçiş' && /^\d+(?:[.,]\d+)?$/.test(metin.trim())) {
      return `${metin.trim().replace(',', '.')}s`;
    }
    return metin;
  }

  private async stilDegeriHam(bildirim: StilBildirimi, baglam: Baglam): Promise<string> {
    const ham = bildirim.deger.trim();
    // Sade bir ad: değişken varsa değeri, yoksa ham CSS sözcüğü (kırmızı, otomatik...).
    if (/^[A-Za-z_ğüşıöçĞÜŞİÖÇ][\wğüşıöçĞÜŞİÖÇ]*$/.test(ham)) {
      const deger = this.bul(ham, baglam);
      return deger ? this.stilDegeriYaz(deger) : ham;
    }
    // CSS işlevleri (`ölçek(1.05)`, `kaydır(10px, 0px)` ...) ham bırakılır;
    // renderer bunları İngilizce CSS karşılıklarına çevirir.
    const cssIslevi = /^([A-Za-z_ğüşıöçĞÜŞİÖÇ][\wğüşıöçĞÜŞİÖÇ]*)\s*\(/.exec(ham);
    if (cssIslevi && CSS_ISLEVLERI.has(cssIslevi[1])) return ham;
    // İşlev çağrısı ya da parantezli ifade: değerlendir (renk.rgb(1, 2, 3) gibi).
    if (/[()]/.test(ham)) {
      const deger = await this.degerlendir(ham, baglam, bildirim.satir);
      return this.stilDegeriYaz(deger);
    }
    return ham;
  }

  /** Türkod değerini CSS metnine dönüştürür. */
  private stilDegeriYaz(deger: TurkodDeger): string {
    if (deger.tur === 'metin') return deger.metinDeger;
    if (deger.tur === 'sayi') return yazdirilabilirMi(deger);
    if (deger.tur === 'mantiksal') return deger.mantiksalDeger ? 'Doğru' : 'Yanlış';
    const yerli = deger.tur === 'yerli' ? deger.yerliDeger : undefined;
    if (yerli && typeof yerli === 'object' && (yerli as Record<string, any>)._turkolRenk) {
      return String((yerli as Record<string, any>).renk ?? '');
    }
    return yazdirilabilirMi(deger);
  }

  private async satirCalistir(metin: string, satir: number, baglam: Baglam): Promise<void> {
    // değişken ad / OndalıklıDeğişken ad (:= veya = yoksa Boş)
    const tanim = /^(?:değişken|OndalıklıDeğişken)\s+([A-Za-z_ğüşıöçĞÜŞİÖÇ][\wğüşıöçĞÜŞİÖÇ]*)\s*(?:(?::=|=(?!=|>))\s*([\s\S]*))?$/.exec(metin);
    if (tanim) {
      const deger = tanim[2] !== undefined && tanim[2].trim() !== ''
        ? await this.degerlendir(tanim[2], baglam, satir)
        : TurkodDeger.bos();
      this.tan(tanim[1], deger, baglam, false);
      return;
    }

    // Atama: ad := ifade  |  ad += ifade  |  nesne.alan := ifade
    const atama = this.atamaAyir(metin);
    if (atama) {
      let deger = await this.degerlendir(atama.ifade, baglam, satir);
      if (atama.hedef.includes('[')) {
        const ac = atama.hedef.indexOf('[');
        const kok = atama.hedef.slice(0, ac).trim();
        const ic = atama.hedef.slice(ac + 1, atama.hedef.lastIndexOf(']'));
        const hedef = await this.degerlendir(kok, baglam, satir);
        const indeks = await this.degerlendir(ic, baglam, satir);
        if (atama.tur !== 'atan') {
          const eski = this.indeksOku(hedef, indeks, satir);
          deger = await this.ikiliIslem(atama.tur, eski, deger, satir);
        }
        if (hedef.tur === 'liste') {
          const i = Math.floor(sayiyaCevir(indeks, satir));
          hedef.dizi[i] = deger;
        } else if (hedef.tur === 'sozluk') {
          hedef.tablo.set(yazdirilabilir(indeks), deger);
        } else if (hedef.tur === 'nesne') {
          hedef.alanlar[yazdirilabilir(indeks)] = deger;
        } else if (hedef.tur === 'yerli') {
          yerliUyeYaz(hedef.yerliDeger, yazdirilabilir(indeks), deger);
        } else {
          throw new TurkodHatasi(`"${kok}" indekslenemiyor.`, satir);
        }
        return;
      }
      if (atama.hedef.includes('.')) {
        const nokta = atama.hedef.lastIndexOf('.');
        const kok = atama.hedef.slice(0, nokta);
        const alan = atama.hedef.slice(nokta + 1).trim();
        const hedef = await this.degerlendir(kok, baglam, satir);
        if (atama.tur !== 'atan') {
          const eski = await this.degerlendir(atama.hedef, baglam, satir);
          deger = await this.ikiliIslem(atama.tur, eski, deger, satir);
        }
        if (hedef.tur === 'nesne') hedef.alanlar[alan] = deger;
        else if (hedef.tur === 'sozluk') hedef.tablo.set(alan, deger);
        else if (hedef.tur === 'yerli') {
          try {
            yerliUyeYaz(hedef.yerliDeger, alan, deger);
          } catch (e) {
            throw new TurkodHatasi(e instanceof Error ? e.message : String(e), satir);
          }
        } else throw new TurkodHatasi(`"${kok}" alan taşımıyor.`, satir);
        return;
      }
      if (atama.tur === 'atan') {
        // `:=` var olan değişkeni günceller, yoksa en yakın kapsamda tanımlar.
        this.tan(atama.hedef, deger, baglam, !!this.bul(atama.hedef, baglam));
      } else {
        const eski = this.bul(atama.hedef, baglam);
        if (!eski) throw new TurkodHatasi(`"${atama.hedef}" tanımlı değil.`, satir);
        this.tan(atama.hedef, await this.ikiliIslem(atama.tur, eski, deger, satir), baglam, true);
      }
      return;
    }

    // dışa_aktar a, b  →  yalnızca kayıt amaçlı
    if (/^dışa_aktar\b/.test(metin)) return;

    // içe_aktar Modül | içe_aktar araclar/yardimci | içe_aktar "yol/dosya.tr"
    const ice = ICE_AKTAR_RE.exec(metin);
    if (ice) {
      await this.modulYukle(modulYoluTemizle(ice[1]), satir, baglam);
      return;
    }

    // Akış komutları
    if (metin === 'kır' || metin === 'dur') {
      this.durmaIstendi = true;
      throw DUR;
    }
    if (metin === 'devam_et') throw DEVAM;
    const don = /^(?:geri_döndür|dön|don)(?:\s+([\s\S]+))?$/.exec(metin);
    if (don) throw new Sinyal('don', don[1] ? await this.degerlendir(don[1], baglam, satir) : TurkodDeger.bos());

    // ifade olarak değerlendir (yazdır, fonksiyon çağrısı, metot çağrısı...)
    await this.degerlendir(metin, baglam, satir);
  }

  private atamaAyir(metin: string): { hedef: string; tur: 'atan' | 'ekle' | 'cikar' | 'carp' | 'bol' | 'mod'; ifade: string } | null {
    const islemler: { anahtar: string; tur: 'ekle' | 'cikar' | 'carp' | 'bol' | 'mod' }[] = [
      { anahtar: '+=', tur: 'ekle' },
      { anahtar: '-=', tur: 'cikar' },
      { anahtar: '*=', tur: 'carp' },
      { anahtar: '/=', tur: 'bol' },
      { anahtar: '%=', tur: 'mod' },
    ];
    const hedefRe = new RegExp(`^\\s*(${TANIMLAYICI}(?:\\s*\\.\\s*${TANIMLAYICI})*|${TANIMLAYICI}\\s*\\[[^\\]]*\\])(?=\\s*(?::=|=(?!=|>)|[+\\-*/%]=))\\s*`);
    const m = hedefRe.exec(metin);
    if (!m) return null;
    const kalan = metin.slice(m[0].length);
    if (kalan.startsWith(':=')) {
      return { hedef: m[1], tur: 'atan', ifade: kalan.slice(2).trim() };
    }
    if (kalan.startsWith('=') && !kalan.startsWith('==') && !kalan.startsWith('=>')) {
      return { hedef: m[1], tur: 'atan', ifade: kalan.slice(1).trim() };
    }
    for (const islem of islemler) {
      if (kalan.startsWith(islem.anahtar)) {
        return { hedef: m[1], tur: islem.tur, ifade: kalan.slice(islem.anahtar.length).trim() };
      }
    }
    return null;
  }

  /* ---------------- Kapsam ---------------- */

  private bul(ad: string, baglam: Baglam): TurkodDeger | undefined {
    let b: Baglam | undefined = baglam;
    while (b) {
      const v = b.degiskenler.get(ad);
      if (v) return v;
      b = b.ust;
    }
    return this.kuresel.degiskenler.get(ad);
  }

  private tan(ad: string, deger: TurkodDeger, baglam: Baglam, guncelle: boolean): void {
    if (guncelle) {
      let b: Baglam | undefined = baglam;
      while (b) {
        if (b.degiskenler.has(ad)) {
          if (b.sabitler.has(ad)) throw new TurkodHatasi(`"${ad}" sabit bir değer, değiştirilemez.`);
          b.degiskenler.set(ad, deger);
          return;
        }
        b = b.ust;
      }
      if (this.kuresel.degiskenler.has(ad)) {
        this.kuresel.degiskenler.set(ad, deger);
        return;
      }
    }
    baglam.degiskenler.set(ad, deger);
  }

  /* ---------------- İfade değerlendirme ---------------- */

  async degerlendir(kaynak: string, baglam: Baglam, satir: number): Promise<TurkodDeger> {
    // `yazdır a, b` biçimi (parantezsiz) de desteklenir.
    const yazdirKomutu = /^yazdır\s+(.+)$/.exec(kaynak.trim());
    if (yazdirKomutu && !kaynak.trim().startsWith('yazdır(')) {
      const parcalar = virgulleBol(yazdirKomutu[1]);
      const degerler: TurkodDeger[] = [];
      for (const parca of parcalar) degerler.push(await this.degerlendir(parca, baglam, satir));
      return this.yerlesikCagir('yazdır', degerler, satir);
    }
    const cozumleyici = new IfadeCozumleyici(kaynak, this, baglam, satir);
    const deger = await cozumleyici.cozumle();
    if (cozumleyici.kalan().trim() !== '') {
      throw new TurkodHatasi(`Beklenmeyen ifade: "${cozumleyici.kalan().trim()}"`, satir);
    }
    return deger;
  }

  async ikiliIslem(tur: string, sol: TurkodDeger, sag: TurkodDeger, satir: number): Promise<TurkodDeger> {
    if (tur === 'atan') return sag;
    if (tur === '+') {
      if (sol.tur === 'liste' && sag.tur === 'liste') return TurkodDeger.liste([...sol.dizi, ...sag.dizi]);
      if (sol.tur === 'metin' || sag.tur === 'metin') {
        return TurkodDeger.metin(yazdirilabilir(sol) + yazdirilabilir(sag));
      }
      if (sol.tur === 'sozluk' && sag.tur === 'sozluk') {
        const yeni = new Map(sol.tablo);
        for (const [k, v] of sag.tablo) yeni.set(k, v);
        return TurkodDeger.sozluk(yeni);
      }
    }
    const a = sayiyaCevir(sol, satir);
    const b = sayiyaCevir(sag, satir);
    switch (tur) {
      case 'ekle':
      case '+':
        return TurkodDeger.sayi(a + b);
      case 'cikar':
      case '-':
        return TurkodDeger.sayi(a - b);
      case 'carp':
      case '*':
        return TurkodDeger.sayi(a * b);
      case 'bol':
      case '/':
        if (b === 0) return TurkodDeger.sayi(a === 0 ? NaN : a > 0 ? Infinity : -Infinity);
        return TurkodDeger.sayi(a / b);
      case 'mod':
      case '%':
        if (b === 0) throw new TurkodHatasi('Sıfıra göre mod alınamaz.', satir);
        return TurkodDeger.sayi(a % b);
      default:
        throw new TurkodHatasi(`Bilinmeyen işlem: ${tur}`, satir);
    }
  }

  /* ---------------- Yerleşik komutlar ---------------- */

  async yerlesikCagir(ad: string, argumanlar: TurkodDeger[], satir: number): Promise<TurkodDeger> {
    const yaz = this.secenekler.yaz;
    const arg = (i: number) => argumanlar[i];
    const metin = (i: number) => yazdirilabilir(argumanlar[i]);
    const sayiArg = (i: number) => sayiyaCevir(argumanlar[i], satir);

    switch (ad) {
      case 'yazdır':
        yaz(argumanlar.map((a) => yazdirilabilir(a)).join(' ') + '\n');
        return TurkodDeger.bos();
      case 'uyarıYazdır':
        yaz('Uyarı: ' + argumanlar.map((a) => yazdirilabilir(a)).join(' ') + '\n');
        return TurkodDeger.bos();
      case 'hataYazdır':
        yaz('Hata: ' + argumanlar.map((a) => yazdirilabilir(a)).join(' ') + '\n');
        return TurkodDeger.bos();
      case 'bilgiYazdır':
        yaz(argumanlar.map((a) => yazdirilabilir(a)).join(' ') + '\n');
        return TurkodDeger.bos();
      case 'temizleEkran':
        yaz('\u001b[2J\u001b[H');
        return TurkodDeger.bos();
      case 'iste':
      case 'oku': {
        const soru = argumanlar.length > 0 ? metin(0) : '';
        const cevap = await this.secenekler.oku(soru);
        const temiz = cevap.replace(/\r?\n$/, '');
        const sayisalMi = temiz.trim() !== '' && !Number.isNaN(Number(temiz.replace(',', '.')));
        return ad === 'oku' && sayisalMi ? TurkodDeger.sayi(Number(temiz.replace(',', '.'))) : TurkodDeger.metin(temiz);
      }
      case 'hataFırlat':
        throw new TurkodHatasi(metin(0), satir);
      case 'uzunluk':
        if (arg(0).tur === 'metin') return TurkodDeger.sayi([...arg(0).metinDeger].length);
        if (arg(0).tur === 'liste' || arg(0).tur === 'kume') return TurkodDeger.sayi(arg(0).dizi.length);
        if (arg(0).tur === 'sozluk') return TurkodDeger.sayi(arg(0).tablo.size);
        return TurkodDeger.sayi(0);
      case 'büyükHarf':
      case 'buyukHarf':
      case 'BÜYÜKHARF':
      
        return TurkodDeger.metin(metin(0).replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase());
      case 'tersMetin':
        return TurkodDeger.metin([...metin(0)].reverse().join(''));
      case 'küçükHarf':
      case 'kucukHarf':
      case 'KÜÇÜKHARF':
        return TurkodDeger.metin(metin(0).replace(/I/g, 'ı').replace(/İ/g, 'i').toLowerCase());
      case 'kırp':
      case 'kirp':
        return TurkodDeger.metin(metin(0).trim());
      case 'solKırp':
      case 'solKirp':
        return TurkodDeger.metin(metin(0).replace(/^\s+/, ''));
      case 'sağKırp':
        return TurkodDeger.metin(metin(0).replace(/\s+$/, ''));
      case 'böl':
      case 'bol': {
        const kaynak = metin(0);
        const ayrac = metin(1);
        return TurkodDeger.liste(
          (ayrac === '' ? [...kaynak] : kaynak.split(ayrac)).map((p) => TurkodDeger.metin(p))
        );
      }
      case 'birleştir':
      case 'birlestir':
      case 'birleştirSözlük': {
        if (argumanlar.length >= 2 && arg(0).tur === 'liste' && arg(1).tur === 'liste') {
          return TurkodDeger.liste([...arg(0).dizi, ...arg(1).dizi]);
        }
        const ayrac = argumanlar.length > 1 ? metin(1) : '';
        return TurkodDeger.metin(arg(0).dizi.map((d) => yazdirilabilir(d)).join(ayrac));
      }
      case 'metinTekrarla':
        return TurkodDeger.metin(metin(0).repeat(Math.max(0, sayiArg(1))));
      case 'ilkKarakter':
        return TurkodDeger.metin([...metin(0)][0] ?? '');
      case 'sonKarakter':
        return TurkodDeger.metin([...metin(0)].pop() ?? '');
      case 'altMetin': {
        const s = metin(0);
        const bas = sayiArg(1);
        const son = argumanlar.length > 2 ? sayiArg(2) : s.length;
        return TurkodDeger.metin(s.slice(bas, son));
      }
      case 'içeriyor':
        if (arg(0).tur === 'liste') return TurkodDeger.mantiksal(arg(0).dizi.some((d) => ayniMi(d, arg(1))));
        if (arg(0).tur === 'sozluk') return TurkodDeger.mantiksal(arg(0).tablo.has(metin(1)));
        if (arg(0).tur === 'kume') return TurkodDeger.mantiksal(arg(0).dizi.some((d) => ayniMi(d, arg(1))));
        return TurkodDeger.mantiksal(metin(0).includes(metin(1)));
      case 'başlıyorMu':
        return TurkodDeger.mantiksal(metin(0).startsWith(metin(1)));
      case 'bitiyorMu':
        return TurkodDeger.mantiksal(metin(0).endsWith(metin(1)));
      case 'değiştir':
        return TurkodDeger.metin(metin(0).split(metin(1)).join(metin(2)));
      case 'ilkDeğiştir':
        return TurkodDeger.metin(metin(0).replace(metin(1), metin(2)));
      case 'sayıya':
      case 'sayiya':
        return TurkodDeger.sayi(sayiyaCevir(arg(0), satir));
      case 'metne':
        return TurkodDeger.metin(metin(0));
      case 'topla': {
        if (argumanlar.length === 1 && (arg(0).tur === 'liste' || arg(0).tur === 'kume')) {
          return TurkodDeger.sayi(arg(0).dizi.reduce((t, d) => t + sayiyaCevir(d, satir), 0));
        }
        return TurkodDeger.sayi(argumanlar.reduce((t, d) => t + sayiyaCevir(d, satir), 0));
      }
      case 'çarp':
        if (argumanlar.length === 1 && arg(0).tur === 'liste') {
          return TurkodDeger.sayi(arg(0).dizi.reduce((t, d) => t * sayiyaCevir(d, satir), 1));
        }
        return TurkodDeger.sayi(argumanlar.reduce((t, d) => t * sayiyaCevir(d, satir), 1));
      case 'ortalama': {
        const dizi = arg(0).tur === 'liste' ? arg(0).dizi : argumanlar;
        if (dizi.length === 0) return TurkodDeger.sayi(0);
        return TurkodDeger.sayi(dizi.reduce((t, d) => t + sayiyaCevir(d, satir), 0) / dizi.length);
      }
      case 'enBüyük':
        return TurkodDeger.sayi(Math.max(...(arg(0).tur === 'liste' ? arg(0).dizi : argumanlar).map((d) => sayiyaCevir(d, satir))));
      case 'enKüçük':
        return TurkodDeger.sayi(Math.min(...(arg(0).tur === 'liste' ? arg(0).dizi : argumanlar).map((d) => sayiyaCevir(d, satir))));
      case 'yuvarla':
        return TurkodDeger.sayi(Math.round(sayiArg(0)));
      case 'aşağıYuvarla':
        return TurkodDeger.sayi(Math.floor(sayiArg(0)));
      case 'yukarıYuvarla':
        return TurkodDeger.sayi(Math.ceil(sayiArg(0)));
      case 'mutlak':
        return TurkodDeger.sayi(Math.abs(sayiArg(0)));
      case 'karekök':
        return TurkodDeger.sayi(Math.sqrt(sayiArg(0)));
      case 'küpKök':
        return TurkodDeger.sayi(Math.cbrt(sayiArg(0)));
      case 'üs':
        return TurkodDeger.sayi(Math.pow(sayiArg(0), sayiArg(1)));
      case 'kalan':
        return TurkodDeger.sayi(sayiArg(0) % sayiArg(1));
      case 'mutlakYol':
        return TurkodDeger.metin(this.yol(metin(0)));
      case 'faktöriyel': {
        let n = Math.floor(sayiArg(0));
        let t = 1;
        while (n > 1) t *= n--;
        return TurkodDeger.sayi(t);
      }
      case 'asalMı': {
        const n = Math.floor(sayiArg(0));
        if (n < 2) return TurkodDeger.mantiksal(false);
        for (let i = 2; i * i <= n; i++) if (n % i === 0) return TurkodDeger.mantiksal(false);
        return TurkodDeger.mantiksal(true);
      }
      case 'çiftMi':
        return TurkodDeger.mantiksal(sayiArg(0) % 2 === 0);
      case 'tekMi':
        return TurkodDeger.mantiksal(sayiArg(0) % 2 !== 0);
      case 'pozitifMi':
        return TurkodDeger.mantiksal(sayiArg(0) > 0);
      case 'negatifMi':
        return TurkodDeger.mantiksal(sayiArg(0) < 0);
      case 'sıfırMı':
        return TurkodDeger.mantiksal(sayiArg(0) === 0);
      case 'sayıMı':
        return TurkodDeger.mantiksal(arg(0).tur === 'sayi' || (arg(0).tur === 'metin' && metin(0).trim() !== '' && !Number.isNaN(Number(metin(0).replace(',', '.')))));
      case 'boşMu':
        return TurkodDeger.mantiksal(!dogruluk(arg(0)));
      case 'tanımsızMı':
        return TurkodDeger.mantiksal(arg(0).tur === 'boş');
      case 'liste':
        if (argumanlar.length === 1 && arg(0).tur === 'liste') return arg(0);
        if (argumanlar.length === 1 && arg(0).tur === 'metin') return TurkodDeger.liste([...arg(0).metinDeger].map((c) => TurkodDeger.metin(c)));
        return TurkodDeger.liste(argumanlar);
      case 'boşListe':
        return TurkodDeger.liste([]);
      case 'sözlük':
        return TurkodDeger.sozluk(new Map());
      case 'boşSözlükMü':
        return TurkodDeger.mantiksal(arg(0).tur === 'sozluk' && arg(0).tablo.size === 0);
      case 'sözlükMü':
        return TurkodDeger.mantiksal(arg(0).tur === 'sozluk');
      case 'küme':
      case 'kume':
        return TurkodDeger.kume(argumanlar.flatMap((d) => (d.tur === 'liste' ? d.dizi : [d])));
      case 'ekle':
        if (arg(0).tur === 'liste') arg(0).dizi.push(arg(1));
        else if (arg(0).tur === 'kume' && !arg(0).dizi.some((d) => ayniMi(d, arg(1)))) arg(0).dizi.push(arg(1));
        return arg(0);
      case 'ekleBaşa':
      case 'başta':
        if (arg(0).tur === 'liste') arg(0).dizi.unshift(arg(1));
        return arg(0);
      case 'çıkar':
        if (arg(0).tur === 'liste') return arg(0).dizi.pop() ?? TurkodDeger.bos();
        return TurkodDeger.bos();
      case 'sil':
      case 'silAt':
        if (arg(0).tur === 'liste' && argumanlar.length > 1) return arg(0).dizi.splice(Math.floor(sayiyaCevir(arg(1), satir)), 1)[0] ?? TurkodDeger.bos();
        if (arg(0).tur === 'sozluk' && argumanlar.length > 1) {
          const v = arg(0).tablo.get(metin(1)) ?? TurkodDeger.bos();
          arg(0).tablo.delete(metin(1));
          return v;
        }
        if (arg(0).tur === 'kume' && argumanlar.length > 1) {
          const i = arg(0).dizi.findIndex((d) => ayniMi(d, arg(1)));
          if (i >= 0) arg(0).dizi.splice(i, 1);
        }
        return TurkodDeger.bos();
      case 'sırala':
      case 'anahtarlaraGöreSırala':
        if (arg(0).tur === 'liste') {
          arg(0).dizi.sort((a, b) => {
            if (a.tur === 'sayi' && b.tur === 'sayi') return a.sayisal - b.sayisal;
            return yazdirilabilir(a).localeCompare(yazdirilabilir(b), 'tr');
          });
        }
        return arg(0);
      case 'ters':
      case 'tersÇevir':
        if (arg(0).tur === 'liste' || arg(0).tur === 'kume') arg(0).dizi.reverse();
        else if (arg(0).tur === 'metin') return TurkodDeger.metin([...arg(0).metinDeger].reverse().join(''));
        return arg(0);
      case 'düzleştir':
        return TurkodDeger.liste(arg(0).dizi.flatMap((d) => (d.tur === 'liste' ? d.dizi : [d])));
      case 'filtrele': {
        const liste = arg(0).dizi;
        const sonuc: TurkodDeger[] = [];
        if (argumanlar.length > 1) {
          const aranan = arg(1);
          for (const d of liste) if (ayniMi(d, aranan) || yazdirilabilir(d).includes(yazdirilabilir(aranan))) sonuc.push(d);
        }
        return TurkodDeger.liste(sonuc);
      }
      case 'ilkEleman':
        if (arg(0).tur === 'liste' || arg(0).tur === 'kume') return arg(0).dizi[0] ?? TurkodDeger.bos();
        return TurkodDeger.metin([...metin(0)][0] ?? '');
      case 'sonEleman':
        if (arg(0).tur === 'liste' || arg(0).tur === 'kume') return arg(0).dizi[arg(0).dizi.length - 1] ?? TurkodDeger.bos();
        return TurkodDeger.metin([...metin(0)].pop() ?? '');
      case 'indeksBul':
      case 'bulİndeks':
        return TurkodDeger.sayi(arg(0).dizi.findIndex((d) => ayniMi(d, arg(1))));
      case 'kopyala':
      case 'derinKopya':
        return kopyala(arg(0));
      case 'benzersiz': {
        const sonuc: TurkodDeger[] = [];
        for (const d of arg(0).dizi) if (!sonuc.some((x) => ayniMi(x, d))) sonuc.push(d);
        return TurkodDeger.liste(sonuc);
      }
      case 'karıştır': {
        const dizi = [...arg(0).dizi];
        for (let i = dizi.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [dizi[i], dizi[j]] = [dizi[j], dizi[i]];
        }
        return TurkodDeger.liste(dizi);
      }
      case 'kume_birlesim':
      case 'küme_birleşim':
      case 'kume_kesisim':
      case 'küme_kesişim':
      case 'kume_fark':
      case 'küme_fark': {
        const a = arg(0).dizi;
        const b = arg(1).dizi;
        const icerir = (l: TurkodDeger[], d: TurkodDeger) => l.some((x) => ayniMi(x, d));
        if (ad.includes('birleş') || ad.includes('birlesim')) {
          return TurkodDeger.kume([...a, ...b.filter((d) => !icerir(a, d))]);
        }
        if (ad.includes('kesiş') || ad.includes('kesisim')) return TurkodDeger.kume(a.filter((d) => icerir(b, d)));
        return TurkodDeger.kume(a.filter((d) => !icerir(b, d)));
      }
      case 'kume_alt_mi':
      case 'küme_alt_mı':
        return TurkodDeger.mantiksal(arg(0).dizi.every((d) => arg(1).dizi.some((x) => ayniMi(x, d))));
      case 'anahtarlar':
        return TurkodDeger.liste([...arg(0).tablo.keys()].map((k) => TurkodDeger.metin(k)));
      case 'değerler':
        return TurkodDeger.liste([...arg(0).tablo.values()]);
      case 'jsonKodla':
        return TurkodDeger.metin(JSON.stringify(jsonlastir(arg(0))));
      case 'jsonÇöz':
        return jsondan(JSON.parse(metin(0)));
      case 'jsonMı':
        try {
          JSON.parse(metin(0));
          return TurkodDeger.mantiksal(true);
        } catch {
          return TurkodDeger.mantiksal(false);
        }
      case 'şimdiMs':
        return TurkodDeger.sayi(Date.now());
      case 'şimdi':
      case 'bugün':
        return TurkodDeger.metin(new Date().toLocaleDateString('tr-TR'));
      case 'saat':
        return TurkodDeger.metin(new Date().toLocaleTimeString('tr-TR'));
      case 'webİste':
      case 'httpİste': {
        const adres = metin(0).trim();
        if (adres === '') {
          throw new TurkodHatasi(
            '`webİste` bir adres bekler. Örnek: `webİste("https://ornek.com")`',
            satir
          );
        }
        if (typeof fetch !== 'function') {
          throw new TurkodHatasi('`webİste` bu ortamda kullanılamıyor: fetch bulunamadı.', satir);
        }
        const yontem = (
          argumanlar.length > 1 && metin(1).trim() !== '' ? metin(1).trim() : 'GET'
        ).toUpperCase();
        const govde = argumanlar.length > 2 ? metin(2) : '';
        const basliklar: Record<string, string> = {};
        if (argumanlar.length > 3 && arg(3).tur === 'sozluk') {
          for (const [ad, deger] of arg(3).tablo) basliklar[ad] = yazdirilabilir(deger);
        }
        const zamanAsimi =
          typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
            ? AbortSignal.timeout(20_000)
            : undefined;
        try {
          const yanit = await fetch(adres, {
            method: yontem,
            headers: basliklar,
            body: yontem === 'GET' || yontem === 'HEAD' || govde === '' ? undefined : govde,
            signal: zamanAsimi,
          });
          const icerik = await yanit.text();
          const yanitBasliklari: Record<string, string> = {};
          yanit.headers.forEach((deger, ad) => {
            yanitBasliklari[ad] = deger;
          });
          return jsondan({
            durum: yanit.status,
            başarılı: yanit.ok,
            metin: icerik,
            başlıklar: yanitBasliklari,
          });
        } catch (e) {
          const neden = e instanceof Error ? e.message : String(e);
          throw new TurkodHatasi(`\`webİste\` isteği başarısız oldu: ${neden}`, satir);
        }
      }
      case 'bekle': {
        const ms = argumanlar.length > 0 ? sayiArg(0) : 0;
        if (this.secenekler.gercekGecikme === false) return TurkodDeger.bos();
        await new Promise((r) => setTimeout(r, Math.min(ms, 60_000)));
        return TurkodDeger.bos();
      }
      case 'süreÖlç':
        return TurkodDeger.sayi(Date.now());
      case 'çalışmaKlasörü':
        return TurkodDeger.metin(this.calismaKlasoru);
      case 'ortamDeğişkeni':
        return TurkodDeger.metin(process.env[metin(0)] ?? '');
      case 'platform':
        return TurkodDeger.metin(process.platform);
      case 'kullanıcıAdı':
        return TurkodDeger.metin(process.env.USERNAME ?? process.env.USER ?? '');
      case 'evKlasörü':
        return TurkodDeger.metin(process.env.USERPROFILE ?? process.env.HOME ?? '');
      case 'sürüm':
        return TurkodDeger.metin('Türkod 0.3.0');
      case 'rastgeleSayı': {
        const alt = argumanlar.length > 1 ? sayiArg(0) : 0;
        const ust = argumanlar.length > 1 ? sayiArg(1) : sayiArg(0);
        return TurkodDeger.sayi(Math.floor(Math.random() * (ust - alt + 1)) + alt);
      }
      case 'rastgeleOndalık':
        return TurkodDeger.sayi(Math.random());
      case 'rastgeleEleman':
      case 'RastgeleSeç':
        return arg(0).dizi[Math.floor(Math.random() * arg(0).dizi.length)] ?? TurkodDeger.bos();
      case 'zarAt':
        return TurkodDeger.sayi(1 + Math.floor(Math.random() * 6));
      case 'yazıTura':
        return TurkodDeger.metin(Math.random() < 0.5 ? 'Yazı' : 'Tura');
      case 'uuid':
        return TurkodDeger.metin(crypto.randomUUID());
      case 'kısaKimlik':
        return TurkodDeger.metin(Math.random().toString(36).slice(2, 10));
      case 'mantıksala':
        return TurkodDeger.mantiksal(dogruluk(arg(0)));
      case 'tür_mü':
      case 'tur_mu':
        return TurkodDeger.mantiksal(arg(0).tur === metin(1) || arg(0).turAdi === metin(1));
      case 'biçim':
      case 'sayıBiçimle':
        if (arg(0).tur === 'sayi') {
          const basamak = argumanlar.length > 1 ? Math.max(0, Math.floor(sayiArg(1))) : 2;
          return TurkodDeger.metin(arg(0).sayisal.toFixed(basamak).replace('.', ','));
        }
        return TurkodDeger.metin(metin(0));
      case 'şablon':
      case 'desenDeğiştir': {
        let s = metin(0);
        for (let i = 1; i < argumanlar.length; i++) {
          s = s.split(`{${i - 1}}`).join(metin(i));
        }
        return TurkodDeger.metin(s);
      }
      case 'çağır': {
        const ad2 = metin(0);
        const f = this.fonksiyonlar.get(ad2);
        if (!f) throw new TurkodHatasi(`"${ad2}" fonksiyonu tanımlı değil.`, satir);
        return this.fonksiyonCagir(f, argumanlar.slice(1), satir);
      }
      case 'komutlar':
        return TurkodDeger.liste([...YERLESIK_ADLAR].sort((a, b) => a.localeCompare(b, 'tr')).map((a) => TurkodDeger.metin(a)));
      case 'yardım':
      case 'yardim':
        yaz('Türkod yerleşik komutları için README dosyasına bakın. Örnek: yazdır("merhaba")\n');
        return TurkodDeger.bos();
      default:
        break;
    }

    // Dosya komutları
    return this.dosyaKomutu(ad, argumanlar, metin, satir);
  }

  private async dosyaKomutu(
    ad: string,
    argumanlar: TurkodDeger[],
    metin: (i: number) => string,
    satir: number
  ): Promise<TurkodDeger> {
    const fs = await import('node:fs');
    const path = await import('node:path');
    switch (ad) {
      case 'dosyaOku':
        try {
          return TurkodDeger.metin(fs.readFileSync(this.yol(metin(0)), 'utf8'));
        } catch {
          throw new TurkodHatasi(`Dosya okunamadı: ${metin(0)}`, satir);
        }
      case 'dosyaYaz':
        fs.writeFileSync(this.yol(metin(0)), metin(1), 'utf8');
        return TurkodDeger.bos();
      case 'dosyaEkle':
        fs.appendFileSync(this.yol(metin(0)), metin(1), 'utf8');
        return TurkodDeger.bos();
      case 'dosyaVarMı':
        return TurkodDeger.mantiksal(fs.existsSync(this.yol(metin(0))));
      case 'dosyaSil':
        try {
          fs.unlinkSync(this.yol(metin(0)));
          return TurkodDeger.mantiksal(true);
        } catch {
          return TurkodDeger.mantiksal(false);
        }
      case 'dosyaListesi':
        try {
          return TurkodDeger.liste(fs.readdirSync(this.yol(metin(0))).map((f) => TurkodDeger.metin(f)));
        } catch {
          return TurkodDeger.liste([]);
        }
      case 'dosyaBoyutu':
        try {
          return TurkodDeger.sayi(fs.statSync(this.yol(metin(0))).size);
        } catch {
          return TurkodDeger.sayi(0);
        }
      case 'dosyaAdı':
        return TurkodDeger.metin(path.basename(metin(0)));
      case 'uzantı':
        return TurkodDeger.metin(path.extname(metin(0)));
      case 'klasörYolu':
        return TurkodDeger.metin(path.dirname(metin(0)));
      case 'yolBirleştir':
        return TurkodDeger.metin(path.join(...argumanlar.map((_, i) => metin(i))));
      case 'klasörVarMı':
        try {
          return TurkodDeger.mantiksal(fs.statSync(this.yol(metin(0))).isDirectory());
        } catch {
          return TurkodDeger.mantiksal(false);
        }
      case 'klasörOluştur':
        fs.mkdirSync(this.yol(metin(0)), { recursive: true });
        return TurkodDeger.bos();
      default:
        throw new TurkodHatasi(`"${ad}" bilinen bir komut değil.`, satir);
    }
  }

  private yol(p: string): string {
    const path = require('node:path') as typeof import('node:path');
    return path.isAbsolute(p) ? p : path.join(this.calismaKlasoru, p);
  }

  /* ---------------- Fonksiyonlar, nesneler, modüller ---------------- */

  async fonksiyonCagir(f: FonksiyonDegeri, argumanlar: TurkodDeger[], satir: number): Promise<TurkodDeger> {
    const kapsam: Baglam = { degiskenler: new Map(), sabitler: new Set(), ust: f.kapali };
    for (let i = 0; i < f.parametreler.length; i++) {
      const p = f.parametreler[i];
      let deger = argumanlar[i];
      if (deger === undefined) {
        if (p.varsayilan !== undefined) {
          deger = await this.degerlendir(p.varsayilan, f.kapali, satir);
        } else {
          deger = TurkodDeger.bos();
        }
      }
      kapsam.degiskenler.set(p.ad, deger);
    }
    try {
      await this.adimlariCalistir(f.govde, kapsam);
    } catch (e) {
      if (e instanceof Sinyal && e.tip === 'don') return e.deger ?? TurkodDeger.bos();
      if (e === DUR || e === DEVAM) return TurkodDeger.bos();
      throw e;
    }
    return TurkodDeger.bos();
  }

  /** Nesne metotlarını verilen kapsamda çalıştırır (alıcı alanları `bu` kapsamıdır). */
  async metotCalistir(f: FonksiyonDegeri, kapsam: Baglam): Promise<void> {
    await this.adimlariCalistir(f.govde, kapsam);
  }

  nesneOlustur(turAdi: string, satir: number, argumanlar: TurkodDeger[] = []): TurkodDeger {
    const tur = this.nesneTurleri.get(turAdi);
    if (!tur) throw new TurkodHatasi(`"${turAdi}" nesnesi tanımlı değil.`, satir);
    const alanlar: Record<string, TurkodDeger> = {};
    const nesne = TurkodDeger.nesne(alanlar, turAdi);
    // Alanları ve metotları tanımla (senkron varsayılanlarla)
    const varsayilanlar: [string, string][] = [];
    for (const adim of tur.govde) {
      if (adim.tip === 'fonksiyon') {
        const f: FonksiyonDegeri = {
          ad: adim.ad,
          parametreler: adim.parametreler,
          govde: adim.govde,
          kapali: this.kuresel,
        };
        alanlar[adim.ad] = new TurkodDeger('fonksiyon', f);
        continue;
      }
      if (adim.tip === 'satir') {
        const tanim = /^(?:değişken|OndalıklıDeğişken)\s+([A-Za-z_ğüşıöçĞÜŞİÖÇ][\wğüşıöçĞÜŞİÖÇ]*)\s*(?:(?::=|=(?!=|>))\s*([\s\S]*))?$/.exec(adim.metin);
        if (tanim) {
          varsayilanlar.push([tanim[1], tanim[2] ?? 'Boş']);
          continue;
        }
        const atama = this.atamaAyir(adim.metin);
        if (atama && atama.tur === 'atan' && !atama.hedef.includes('.') && !atama.hedef.includes('[')) {
          varsayilanlar.push([atama.hedef, atama.ifade]);
        }
        continue;
      }
      if (adim.tip === 'nesne') {
        alanlar[adim.ad] = this.nesneOlustur(adim.ad, satir);
      }
    }
    for (const [ad, ifade] of varsayilanlar) {
      alanlar[ad] = sezgiselDeger(ifade);
    }
    // Kurucu argümanları, tanımlı alanlara sırayla atanır.
    const alanAdlari = Object.keys(alanlar).filter((k) => alanlar[k].tur !== 'fonksiyon');
    for (let i = 0; i < argumanlar.length && i < alanAdlari.length; i++) {
      alanlar[alanAdlari[i]] = argumanlar[i];
    }
    return nesne;
  }

  nesneTuruVarMi(ad: string): boolean {
    return this.nesneTurleri.has(ad);
  }

  private async modulYukle(ad: string, satir: number, baglam: Baglam): Promise<void> {
    if (MODUL_NORMAL(ad) === 'oyun') {
      if (!oyunModuluEtkinMi()) throw new TurkodHatasi('Oyun modülü şu anda devre dışı. Açmak için `turkod.oyunModuluEtkin` ayarını etkinleştirin.', satir);
      this.kuresel.degiskenler.set('Oyun', TurkodDeger.yerli({ modül: 'Oyun' }, 'Oyun'));
      return;
    }

    if (zamanModulAdiMi(ad)) {
      this.kuresel.degiskenler.set('Zaman', TurkodDeger.yerli(zamanModuluOlustur().uyeler, 'Zaman'));
      return;
    }

    if (turkuiModulAdiMi(ad)) {
      const modul = this.secenekler.turkui;
      if (!modul) {
        throw new TurkodHatasi(
          `"${ad}" modülü bu çalıştırma ortamında kullanılamıyor. TürkUI için uzantı içinden çalıştırın.`,
          satir
        );
      }
      this.kuresel.degiskenler.set('TürkUI', TurkodDeger.yerli(modul.uyeler, 'TürkUI'));
      this.kuresel.degiskenler.set('renk', TurkodDeger.yerli(modul.renk, 'renk'));
      this.kuresel.degiskenler.set('gizle', TurkodDeger.metin('gizle'));
      return;
    }

    const kaynakKlasoru = this.secenekler.modulKlasoru ?? (this.secenekler.dosya
      ? path.dirname(this.secenekler.dosya)
      : this.secenekler.klasor);
    const dosya = this.secenekler.modulCoz?.(ad, kaynakKlasoru);
    if (!dosya) {
      throw new TurkodHatasi(
        `"${ad}" modülü bulunamadı. Dosyayı adıyla (yardimci), alt klasör yoluyla ` +
          `(araclar/yardimci) veya .tr uzantısıyla yazabilirsiniz.`,
        satir
      );
    }

    const onbellek = this.modulOnbellek.get(dosya);
    if (onbellek) {
      for (const [k, v] of onbellek.kuresel.degiskenler) this.kuresel.degiskenler.set(k, v);
      for (const [k, v] of onbellek.fonksiyonlar) this.fonksiyonlar.set(k, v);
      this.modulAdiAlaninaEkle(ad, onbellek.fonksiyonlar);
      return;
    }

    const kaynak = fs.readFileSync(dosya, 'utf8');
    const alt = new TurkodYorumlayici(kaynak, {
      ...this.secenekler,
      klasor: path.dirname(dosya),
      modulKlasoru: path.dirname(dosya),
      dosya,
      kanca: undefined,
      yaz: () => undefined,
    });
    await alt.calistir();
    this.modulOnbellek.set(dosya, { kuresel: alt.kuresel, fonksiyonlar: alt.fonksiyonlar });
    for (const [k, v] of alt.kuresel.degiskenler) this.kuresel.degiskenler.set(k, v);
    for (const [k, v] of alt.fonksiyonlar) this.fonksiyonlar.set(k, v);
    this.modulAdiAlaninaEkle(ad, alt.fonksiyonlar);
    // Modül içinde bağlanan TürkUI olayları ana yorumlayıcıdan tetiklenir.
    for (const [kimlik, isleyiciler] of alt.turkuiOlaylari) {
      const mevcut = this.turkuiOlaylari.get(kimlik);
      if (mevcut) {
        for (const [olay, isleyici] of isleyiciler) mevcut.set(olay, isleyici);
      } else {
        this.turkuiOlaylari.set(kimlik, new Map(isleyiciler));
      }
    }
    for (const [kimlik, bilesen] of alt.turkuiBilesenleri) {
      this.turkuiBilesenleri.set(kimlik, bilesen);
    }
  }

  /** İçe aktarılan dosyanın fonksiyonlarını dosya adından türetilen nesnede sunar. */
  private modulAdiAlaninaEkle(ad: string, fonksiyonlar: Map<string, FonksiyonDegeri>): void {
    const temizAd = modulYoluTemizle(ad).replace(/\.(?:tr|turkod)$/i, '');
    const parca = path.basename(temizAd);
    const takmaAd = parca ? parca.charAt(0).toLocaleLowerCase('tr-TR') + parca.slice(1) : '';
    if (!takmaAd || turkuiModulAdiMi(takmaAd)) return;

    const alanlar: Record<string, TurkodDeger> = {};
    for (const [ad2, f] of fonksiyonlar) {
      alanlar[ad2] = new TurkodDeger('fonksiyon', f);
    }
    this.kuresel.degiskenler.set(takmaAd, TurkodDeger.nesne(alanlar, 'modül'));
  }

  /* ---------------- Dışa açık yardımcılar ---------------- */

  /** Liste, küme, metin, sözlük ve yerli nesnelerde indeks okur. */
  indeksOku(hedef: TurkodDeger, indeks: TurkodDeger, satir: number): TurkodDeger {
    if (hedef.tur === 'liste' || hedef.tur === 'kume') {
      const i = Math.floor(sayiyaCevir(indeks, satir));
      const j = i < 0 ? hedef.dizi.length + i : i;
      return hedef.dizi[j] ?? TurkodDeger.bos();
    }
    if (hedef.tur === 'metin') {
      const karakterler = [...hedef.metinDeger];
      const i = Math.floor(sayiyaCevir(indeks, satir));
      const j = i < 0 ? karakterler.length + i : i;
      return TurkodDeger.metin(karakterler[j] ?? '');
    }
    if (hedef.tur === 'sozluk') {
      return hedef.tablo.get(yazdirilabilir(indeks)) ?? TurkodDeger.bos();
    }
    if (hedef.tur === 'yerli') {
      const yerli = hedef.yerliDeger;
      const hedefNesne = yerliFonksiyonMu(yerli) ? yerli.kaynak : yerli;
      if (hedefNesne !== null && typeof hedefNesne === 'object') {
        return turkodDegeri(Reflect.get(hedefNesne as object, yazdirilabilir(indeks)));
      }
    }
    throw new TurkodHatasi('İndeksleme yalnızca liste, küme, metin ve sözlükte yapılabilir.', satir);
  }

  /**
   * TürkUI penceresinden gelen olayı çalıştırır. Bileşen özellikleri (giriş
   * değeri, onay durumu vb.) önce yerli bileşen nesnesine uygulanır.
   */
  async turkuiOlayTetikle(
    bilesenId: string,
    olayAdi: string,
    ozellikler?: Record<string, unknown>
  ): Promise<void> {
    const bilesen = this.turkuiBilesenleri.get(bilesenId);
    if (bilesen && ozellikler) {
      for (const [ad, deger] of Object.entries(ozellikler)) {
        try {
          bilesen[ad] = deger;
        } catch {
          /* salt okunur özellik: yok say */
        }
      }
    }
    const isleyici = this.turkuiOlaylari.get(bilesenId)?.get(olayAdi);
    if (!isleyici) return;
    if (olayAdi === 'pencereAçıldığında') this.turkuiAcilisTetiklenen.add(bilesenId);
    const kapsam: Baglam = { degiskenler: new Map(), sabitler: new Set(), ust: isleyici.baglam };
    try {
      await this.adimlariCalistir(isleyici.govde, kapsam);
    } catch (e) {
      if (e instanceof Sinyal) {
        if (e.tip === 'don' || e.tip === 'cikis') return;
        throw e;
      }
      if (e === DUR || e === DEVAM) return;
      throw e;
    }
  }

  kureselDegiskenler(): Map<string, TurkodDeger> {
    return this.kuresel.degiskenler;
  }

  durdur(): void {
    this.cikisIstedi = true;
  }

  /** Test ve araçlar için çözümlenmiş adım ağacı. */
  adimlariAl(): Adim[] {
    return this.adimlar;
  }
}

function kopyala(d: TurkodDeger): TurkodDeger {
  switch (d.tur) {
    case 'liste':
      return TurkodDeger.liste(d.dizi.map(kopyala));
    case 'kume':
      return TurkodDeger.kume(d.dizi.map(kopyala));
    case 'sozluk': {
      const m = new Map<string, TurkodDeger>();
      for (const [k, v] of d.tablo) m.set(k, kopyala(v));
      return TurkodDeger.sozluk(m);
    }
    case 'nesne': {
      const alanlar: Record<string, TurkodDeger> = {};
      for (const [k, v] of Object.entries(d.alanlar)) alanlar[k] = kopyala(v);
      return TurkodDeger.nesne(alanlar, d.turAdi ?? '');
    }
    case 'yerli':
      return d;
    default:
      return d;
  }
}

function jsonlastir(d: TurkodDeger): unknown {
  switch (d.tur) {
    case 'metin':
      return d.metinDeger;
    case 'sayi':
      return d.sayisal;
    case 'mantiksal':
      return d.mantiksalDeger;
    case 'boş':
      return null;
    case 'liste':
    case 'kume':
      return d.dizi.map(jsonlastir);
    case 'sozluk':
      return Object.fromEntries([...d.tablo].map(([k, v]) => [k, jsonlastir(v)]));
    case 'nesne':
      return Object.fromEntries(Object.entries(d.alanlar).map(([k, v]) => [k, jsonlastir(v)]));
    case 'yerli':
      return d.yerliDeger;
    default:
      return null;
  }
}

function jsondan(v: unknown): TurkodDeger {
  if (v === null || v === undefined) return TurkodDeger.bos();
  if (typeof v === 'string') return TurkodDeger.metin(v);
  if (typeof v === 'number') return TurkodDeger.sayi(v);
  if (typeof v === 'boolean') return TurkodDeger.mantiksal(v);
  if (Array.isArray(v)) return TurkodDeger.liste(v.map(jsondan));
  const m = new Map<string, TurkodDeger>();
  for (const [k, x] of Object.entries(v as Record<string, unknown>)) m.set(k, jsondan(x));
  return TurkodDeger.sozluk(m);
}

/** Nesne varsayılanları için çok basit sabit değer çözümü. */
function sezgiselDeger(ifade: string): TurkodDeger {
  const t = ifade.trim();
  if (t.startsWith('"')) return TurkodDeger.metin(t.replace(/^"|"$/g, ''));
  if (t === 'Doğru') return TurkodDeger.mantiksal(true);
  if (t === 'Yanlış') return TurkodDeger.mantiksal(false);
  if (t === 'Boş') return TurkodDeger.bos();
  if (t.startsWith('[')) {
    const ic = t.slice(1, -1).trim();
    return TurkodDeger.liste(ic ? virgulleBol(ic).map((p) => sezgiselDeger(p)) : []);
  }
  const n = Number(t.replace(',', '.'));
  if (!Number.isNaN(n) && t !== '') return TurkodDeger.sayi(n);
  return TurkodDeger.bos();
}

function sabitIfade(d: TurkodDeger): TurkodDeger | undefined {
  return d;
}

/* ------------------------------------------------------------------ */
/* İfade çözümleyici                                                   */
/* ------------------------------------------------------------------ */

class IfadeCozumleyici {
  private i = 0;

  constructor(
    private readonly kaynak: string,
    private readonly yorumlayici: TurkodYorumlayici,
    private readonly baglam: Baglam,
    private readonly satir: number
  ) {}

  kalan(): string {
    return this.kaynak.slice(this.i);
  }

  async cozumle(): Promise<TurkodDeger> {
    const deger = await this.veya();
    return deger;
  }

  private boslukAt(): void {
    while (this.i < this.kaynak.length && /\s/.test(this.kaynak[this.i])) this.i++;
  }

  private dene(kelime: string): boolean {
    this.boslukAt();
    const kalan = this.kaynak.slice(this.i);
    if (kalan.startsWith(kelime)) {
      const sonraki = kalan[kelime.length];
      if (/^[A-Za-z0-9_ğüşıöçĞÜŞİÖÇ]$/.test(kelime[kelime.length - 1]) && sonraki && /[A-Za-z0-9_ğüşıöçĞÜŞİÖÇ]/.test(sonraki)) {
        return false;
      }
      this.i += kelime.length;
      return true;
    }
    return false;
  }

  private async veya(): Promise<TurkodDeger> {
    let sol = await this.ve();
    for (;;) {
      if (this.dene('veya') || this.dene('||')) {
        const sag = await this.ve();
        sol = TurkodDeger.mantiksal(dogruluk(sol) || dogruluk(sag));
        continue;
      }
      return sol;
    }
  }

  private async ve(): Promise<TurkodDeger> {
    let sol = await this.karsilastirma();
    for (;;) {
      if (this.dene('ve') || this.dene('&&')) {
        const sag = await this.karsilastirma();
        sol = TurkodDeger.mantiksal(dogruluk(sol) && dogruluk(sag));
        continue;
      }
      return sol;
    }
  }

  private async karsilastirma(): Promise<TurkodDeger> {
    const sol = await this.toplama();
    const islemler = ['==', '!=', '>=', '<=', '>', '<'];
    this.boslukAt();
    for (const islem of islemler) {
      if (this.dene(islem)) {
        const sag = await this.toplama();
        switch (islem) {
          case '==':
            return TurkodDeger.mantiksal(ayniMi(sol, sag));
          case '!=':
            return TurkodDeger.mantiksal(!ayniMi(sol, sag));
          default: {
            if (sol.tur === 'metin' && sag.tur === 'metin') {
              const s = sol.metinDeger.localeCompare(sag.metinDeger, 'tr');
              return TurkodDeger.mantiksal(
                islem === '>' ? s > 0 : islem === '<' ? s < 0 : islem === '>=' ? s >= 0 : s <= 0
              );
            }
            const a = sayiyaCevir(sol, this.satir);
            const b = sayiyaCevir(sag, this.satir);
            return TurkodDeger.mantiksal(
              islem === '>' ? a > b : islem === '<' ? a < b : islem === '>=' ? a >= b : a <= b
            );
          }
        }
      }
    }
    return sol;
  }

  private async toplama(): Promise<TurkodDeger> {
    let sol = await this.carpma();
    for (;;) {
      this.boslukAt();
      const c = this.kaynak[this.i];
      if (c === '+' || c === '-') {
        this.i++;
        const sag = await this.carpma();
        sol = await this.yorumlayici.ikiliIslem(c, sol, sag, this.satir);
        continue;
      }
      return sol;
    }
  }

  private async carpma(): Promise<TurkodDeger> {
    let sol = await this.tekil();
    for (;;) {
      this.boslukAt();
      const c = this.kaynak[this.i];
      if (c === '*' || c === '/' || c === '%') {
        this.i++;
        const sag = await this.tekil();
        sol = await this.yorumlayici.ikiliIslem(c, sol, sag, this.satir);
        continue;
      }
      return sol;
    }
  }

  private async tekil(): Promise<TurkodDeger> {
    this.boslukAt();
    if (this.dene('değil') || this.dene('!')) {
      const d = await this.tekil();
      return TurkodDeger.mantiksal(!dogruluk(d));
    }
    if (this.kaynak[this.i] === '-') {
      this.i++;
      const d = await this.tekil();
      return TurkodDeger.sayi(-sayiyaCevir(d, this.satir));
    }
    return this.sonek();
  }

  private async sonek(): Promise<TurkodDeger> {
    let deger = await this.birincil();
    for (;;) {
      this.boslukAt();
      const c = this.kaynak[this.i];
      if (c === '(') {
        // fonksiyon çağrısı
        this.i++;
        const argumanlar: TurkodDeger[] = [];
        this.boslukAt();
        if (this.kaynak[this.i] !== ')') {
          for (;;) {
            argumanlar.push(await this.cozumle());
            this.boslukAt();
            if (this.kaynak[this.i] === ',') {
              this.i++;
              continue;
            }
            break;
          }
        }
        this.boslukAt();
        if (this.kaynak[this.i] !== ')') throw new TurkodHatasi('Kapanmamış parantez: ")" bekleniyordu.', this.satir);
        this.i++;
        deger = await this.cagir(deger, argumanlar);
        continue;
      }
      if (c === '[') {
        this.i++;
        const indeks = await this.cozumle();
        this.boslukAt();
        if (this.kaynak[this.i] !== ']') throw new TurkodHatasi('Kapanmamış köşeli parantez: "]" bekleniyordu.', this.satir);
        this.i++;
        deger = this.indeksle(deger, indeks);
        continue;
      }
      if (c === '.') {
        this.i++;
        this.boslukAt();
        RE_TANIMLAYICI.lastIndex = this.i;
        const m = RE_TANIMLAYICI.exec(this.kaynak);
        if (!m) throw new TurkodHatasi('Noktadan sonra üye adı bekleniyordu.', this.satir);
        this.i = RE_TANIMLAYICI.lastIndex;
        const uye = m[0];
        if (deger.tur === 'sozluk') {
          deger = deger.tablo.get(uye) ?? TurkodDeger.bos();
        } else if (deger.tur === 'nesne') {
          const alan = deger.alanlar[uye];
          if (!alan) throw new TurkodHatasi(`"${deger.turAdi}" nesnesinde "${uye}" yok.`, this.satir);
          // Metot, tanımlandığı nesnenin alanlarına erişebilsin diye alıcı bağlanır.
          deger =
            alan.tur === 'fonksiyon'
              ? new TurkodDeger('fonksiyon', { ...(alan.deger as FonksiyonDegeri), alici: deger })
              : alan;
        } else if (deger.tur === 'yerli') {
          try {
            deger = yerliUyeOku(deger.yerliDeger, uye);
          } catch (e) {
            throw new TurkodHatasi(e instanceof Error ? e.message : String(e), this.satir);
          }
        } else if (METOT_TURLERI.has(deger.tur)) {
          this.boslukAt();
          if (this.kaynak[this.i] === '(') {
            // metin.uzunluk(), liste.ekle(x) gibi metot çağrıları
            deger = new TurkodDeger('fonksiyon', {
              ad: uye,
              parametreler: [],
              govde: [],
              kapali: this.baglam,
              alici: deger,
            } as FonksiyonDegeri);
          } else {
            // .uzunluk / sözlük anahtarı gibi özellik erişimleri
            deger = this.ozellik(deger, uye);
          }
        } else {
          throw new TurkodHatasi(`"${yazdirilabilir(deger)}" üzerinde üye erişimi yapılamaz.`, this.satir);
        }
        continue;
      }
      return deger;
    }
  }

  private async cagir(hedef: TurkodDeger, argumanlar: TurkodDeger[]): Promise<TurkodDeger> {
    if (hedef.tur === 'yerli') {
      const yerli = hedef.yerliDeger;
      if (yerliFonksiyonMu(yerli)) {
        try {
          const sonuc = await yerli.cagir(argumanlar.map(jsDegeri));
          return turkodDegeri(sonuc);
        } catch (e) {
          if (e instanceof TurkodHatasi) throw e;
          throw new TurkodHatasi(e instanceof Error ? e.message : String(e), this.satir);
        }
      }
      if (typeof yerli === 'function') {
        try {
          const sonuc = await (yerli as (...a: any[]) => any)(...argumanlar.map(jsDegeri));
          return turkodDegeri(sonuc);
        } catch (e) {
          if (e instanceof TurkodHatasi) throw e;
          throw new TurkodHatasi(e instanceof Error ? e.message : String(e), this.satir);
        }
      }
      throw new TurkodHatasi('Çağrılabilir bir değer bekleniyordu (yerli nesne çağrılamaz).', this.satir);
    }
    if (hedef.tur === 'fonksiyon') {
      const f = hedef.deger as FonksiyonDegeri;
      if (f.alici) {
        if (f.alici.tur === 'nesne' && (f.alici.turAdi === 'sayısal' || f.alici.turAdi === 'sayisal')) {
          if (f.ad === 'sayisal_iste' || f.ad === 'iste' || f.ad === 'oku' || f.ad === 'sayisal_oku') {
            const soru = argumanlar.length > 0 ? yazdirilabilir(argumanlar[0]) : '';
            const cevap = await this.yorumlayici['secenekler'].oku(soru);
            const temiz = cevap.replace(/\r?\n$/, '');
            const sayisalMi = temiz.trim() !== '' && !Number.isNaN(Number(temiz.replace(',', '.')));
            if (sayisalMi) return TurkodDeger.sayi(Number(temiz.replace(',', '.')));
            // sayısal.iste metin gelirse sayıya çevirmeyi dene, başarısızsa hata
            try {
              return TurkodDeger.sayi(sayiyaCevir(TurkodDeger.metin(temiz), this.satir));
            } catch {
              throw new TurkodHatasi(`sayısal.iste için sayı bekleniyordu.`, this.satir);
            }
          }
        }
        if (f.alici.tur === 'nesne' && f.govde.length > 0) {
          // Kullanıcı tanımlı nesne metodu: `bu` kapsamı nesnenin alanlarıdır.
          const kapsam: Baglam = {
            degiskenler: new Map(Object.entries(f.alici.alanlar)),
            sabitler: new Set(),
            ust: f.kapali,
          };
          for (let i = 0; i < f.parametreler.length; i++) {
            kapsam.degiskenler.set(f.parametreler[i].ad, argumanlar[i] ?? TurkodDeger.bos());
          }
          try {
            await this.yorumlayici.metotCalistir(f, kapsam);
          } catch (e) {
            if (e instanceof Sinyal && e.tip === 'don') return e.deger ?? TurkodDeger.bos();
            throw e;
          }
          return TurkodDeger.bos();
        }
        return this.metotCagir(f.alici, f.ad, argumanlar);
      }
      if (f.govde.length === 0 && YERLESIK_ADLAR.has(f.ad)) {
        return this.yorumlayici.yerlesikCagir(f.ad, argumanlar, this.satir);
      }
      return this.yorumlayici.fonksiyonCagir(f, argumanlar, this.satir);
    }
    const ayrinti = (hedef?.deger as { ad?: string } | undefined)?.ad ?? String(hedef?.deger);
    throw new TurkodHatasi(`Çağrılabilir bir değer bekleniyordu (${hedef?.tur}: ${ayrinti}).`, this.satir);
  }

  /** `liste.uzunluk` gibi özellik erişimleri. */
  private ozellik(hedef: TurkodDeger, ad: string): TurkodDeger {
    if (ad === 'uzunluk') {
      if (hedef.tur === 'metin') return TurkodDeger.sayi([...hedef.metinDeger].length);
      if (hedef.tur === 'sozluk') return TurkodDeger.sayi(hedef.tablo.size);
      return TurkodDeger.sayi(hedef.dizi.length);
    }
    if (hedef.tur === 'sozluk') return hedef.tablo.get(ad) ?? TurkodDeger.bos();
    throw new TurkodHatasi(`"${ad}" bilinen bir metot ya da özellik değil.`, this.satir);
  }

  /** Metin, liste, sözlük ve küme metotları. */
  private metotCagir(alici: TurkodDeger, ad: string, argumanlar: TurkodDeger[]): TurkodDeger {
    const s = this.satir;
    const a0 = argumanlar[0];
    const metin = (d: TurkodDeger | undefined) => (d === undefined ? '' : yazdirilabilir(d));
    const sayi = (d: TurkodDeger | undefined) => (d === undefined ? 0 : sayiyaCevir(d, s));

    if (alici.tur === 'metin') {
      const v = alici.metinDeger;
      switch (ad) {
        case 'uzunluk':
          return TurkodDeger.sayi([...v].length);
        case 'büyük_harf':
        case 'büyükHarf':
          return TurkodDeger.metin(v.replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase());
        case 'küçük_harf':
        case 'küçükHarf':
          return TurkodDeger.metin(v.replace(/I/g, 'ı').replace(/İ/g, 'i').toLowerCase());
        case 'içeriyor':
          return TurkodDeger.mantiksal(v.includes(metin(a0)));
        case 'başlangıçta_mı':
          return TurkodDeger.mantiksal(v.startsWith(metin(a0)));
        case 'bitişte_mi':
          return TurkodDeger.mantiksal(v.endsWith(metin(a0)));
        case 'değiştir':
          return TurkodDeger.metin(v.split(metin(a0)).join(metin(argumanlar[1])));
        case 'böl':
          return TurkodDeger.liste((metin(a0) === '' ? [...v] : v.split(metin(a0))).map((p) => TurkodDeger.metin(p)));
        case 'kırp':
          return TurkodDeger.metin(v.trim());
        case 'ters_çevir':
        case 'ters':
          return TurkodDeger.metin([...v].reverse().join(''));
        case 'ayır':
          return TurkodDeger.liste([...v].map((c) => TurkodDeger.metin(c)));
        default:
          break;
      }
      throw new TurkodHatasi(`"${ad}" metin metodu değil.`, s);
    }

    if (alici.tur === 'sozluk') {
      switch (ad) {
        case 'anahtarlar':
          return TurkodDeger.liste([...alici.tablo.keys()].map((k) => TurkodDeger.metin(k)));
        case 'değerler':
          return TurkodDeger.liste([...alici.tablo.values()]);
        case 'içeriyor':
          return TurkodDeger.mantiksal(alici.tablo.has(metin(a0)));
        case 'sil': {
          const v = alici.tablo.get(metin(a0)) ?? TurkodDeger.bos();
          alici.tablo.delete(metin(a0));
          return v;
        }
        case 'uzunluk':
          return TurkodDeger.sayi(alici.tablo.size);
        case 'ekle':
          alici.tablo.set(metin(a0), argumanlar[1] ?? TurkodDeger.bos());
          return alici;
        case 'temizle':
          alici.tablo.clear();
          return alici;
        case 'kopyala':
          return kopyala(alici);
        default:
          break;
      }
      throw new TurkodHatasi(`"${ad}" sözlük metodu değil.`, s);
    }

    // liste ve küme
    const dizi = alici.dizi;
    switch (ad) {
      case 'uzunluk':
        return TurkodDeger.sayi(dizi.length);
      case 'ekle':
        if (alici.tur === 'kume') {
          if (!dizi.some((d) => ayniMi(d, a0))) dizi.push(a0);
        } else {
          dizi.push(a0);
        }
        return alici;
      case 'çıkar':
        return dizi.pop() ?? TurkodDeger.bos();
      case 'başta':
        dizi.unshift(a0);
        return alici;
      case 'sırala':
        dizi.sort((a, b) => {
          if (a.tur === 'sayi' && b.tur === 'sayi') return a.sayisal - b.sayisal;
          return yazdirilabilir(a).localeCompare(yazdirilabilir(b), 'tr');
        });
        return alici;
      case 'ters':
        dizi.reverse();
        return alici;
      case 'sil': {
        const i = Math.floor(sayi(a0));
        const j = i < 0 ? dizi.length + i : i;
        const silinen = dizi.splice(j, 1)[0] ?? TurkodDeger.bos();
        return silinen;
      }
      case 'içeriyor':
        return TurkodDeger.mantiksal(dizi.some((d) => ayniMi(d, a0)));
      case 'ters_çevir':
        return TurkodDeger.liste([...dizi].reverse());
      case 'temizle':
        dizi.length = 0;
        return alici;
      case 'ilk_eleman':
        return dizi[0] ?? TurkodDeger.bos();
      case 'son_eleman':
        return dizi[dizi.length - 1] ?? TurkodDeger.bos();
      case 'indeks_bul':
        return TurkodDeger.sayi(dizi.findIndex((d) => ayniMi(d, a0)));
      case 'kopyala':
        return kopyala(alici);
      case 'liste_yap':
        return TurkodDeger.liste([...dizi]);
      default:
        throw new TurkodHatasi(`"${ad}" liste metodu değil.`, s);
    }
  }

  private indeksle(hedef: TurkodDeger, indeks: TurkodDeger): TurkodDeger {
    return this.yorumlayici.indeksOku(hedef, indeks, this.satir);
  }

  private async birincil(): Promise<TurkodDeger> {
    this.boslukAt();
    const c = this.kaynak[this.i];

    if (c === '"') {
      this.i++;
      let s = '';
      while (this.i < this.kaynak.length && this.kaynak[this.i] !== '"') {
        if (this.kaynak[this.i] === '\\') {
          this.i++;
          const k = this.kaynak[this.i];
          s += k === 'n' ? '\n' : k === 't' ? '\t' : k === '"' ? '"' : k === '\\' ? '\\' : k;
        } else {
          s += this.kaynak[this.i];
        }
        this.i++;
      }
      if (this.kaynak[this.i] !== '"') throw new TurkodHatasi('Kapanmamış metin: " bekleniyordu.', this.satir);
      this.i++;
      return TurkodDeger.metin(s);
    }

    if (c === '[') {
      this.i++;
      const ogeler: TurkodDeger[] = [];
      this.boslukAt();
      if (this.kaynak[this.i] !== ']') {
        for (;;) {
          ogeler.push(await this.cozumle());
          this.boslukAt();
          if (this.kaynak[this.i] === ',') {
            this.i++;
            continue;
          }
          break;
        }
      }
      this.boslukAt();
      if (this.kaynak[this.i] !== ']') throw new TurkodHatasi('Kapanmamış liste: "]" bekleniyordu.', this.satir);
      this.i++;
      return TurkodDeger.liste(ogeler);
    }

    if (c === '{') {
      this.i++;
      const tablo = new Map<string, TurkodDeger>();
      const kume: TurkodDeger[] = [];
      this.boslukAt();
      if (this.kaynak[this.i] !== '}') {
        for (;;) {
          this.boslukAt();
          let anahtar: string;
          if (this.kaynak[this.i] === '"') {
            anahtar = (await this.birincil()).metinDeger;
          } else {
            RE_TANIMLAYICI.lastIndex = this.i;
            const m = RE_TANIMLAYICI.exec(this.kaynak);
            if (!m) throw new TurkodHatasi('Sözlük anahtarı bekleniyordu.', this.satir);
            anahtar = m[0];
            this.i = RE_TANIMLAYICI.lastIndex;
          }
          this.boslukAt();
          if (this.kaynak[this.i] === ':') {
            this.i++;
            tablo.set(anahtar, await this.cozumle());
          } else {
            kume.push(TurkodDeger.metin(anahtar));
          }
          this.boslukAt();
          if (this.kaynak[this.i] === ',') {
            this.i++;
            continue;
          }
          break;
        }
      }
      this.boslukAt();
      if (this.kaynak[this.i] !== '}') throw new TurkodHatasi('Kapanmamış sözlük/küme: "}" bekleniyordu.', this.satir);
      this.i++;
      return tablo.size > 0 ? TurkodDeger.sozluk(tablo) : TurkodDeger.kume(kume);
    }

    if (c === '(') {
      this.i++;
      const d = await this.cozumle();
      this.boslukAt();
      if (this.kaynak[this.i] !== ')') throw new TurkodHatasi('Kapanmamış parantez: ")" bekleniyordu.', this.satir);
      this.i++;
      return d;
    }

    if (/[0-9]/.test(c ?? '')) {
      const m = /^\d+(?:[.,]\d+)?/.exec(this.kaynak.slice(this.i));
      if (m) {
        this.i += m[0].length;
        return TurkodDeger.sayi(Number(m[0].replace(',', '.')));
      }
    }

    RE_TANIMLAYICI.lastIndex = this.i;
    const ad = RE_TANIMLAYICI.exec(this.kaynak);
    if (ad) {
      this.i = RE_TANIMLAYICI.lastIndex;
      const isim = ad[0];
      switch (isim) {
        case 'Doğru':
          return TurkodDeger.mantiksal(true);
        case 'Yanlış':
          return TurkodDeger.mantiksal(false);
        case 'Boş':
          return TurkodDeger.bos();
        case 'PI':
          return TurkodDeger.sayi(Math.PI);
        case 'E':
          return TurkodDeger.sayi(Math.E);
        case 'TAU':
          return TurkodDeger.sayi(Math.PI * 2);
        case 'SONSUZ':
          return TurkodDeger.sayi(Infinity);
        case 'SÜRÜM':
          return TurkodDeger.metin('0.3.0');
        default:
          break;
      }

      this.boslukAt();
      if (this.kaynak[this.i] === '(' && this.yorumlayici.nesneTuruVarMi(isim)) {
        this.i++;
        const argumanlar: TurkodDeger[] = [];
        this.boslukAt();
        if (this.kaynak[this.i] !== ')') {
          for (;;) {
            argumanlar.push(await this.cozumle());
            this.boslukAt();
            if (this.kaynak[this.i] === ',') {
              this.i++;
              continue;
            }
            break;
          }
        }
        this.boslukAt();
        if (this.kaynak[this.i] !== ')') throw new TurkodHatasi('Kapanmamış parantez: ")" bekleniyordu.', this.satir);
        this.i++;
        return this.yorumlayici.nesneOlustur(isim, this.satir, argumanlar);
      }

      const degisken = this.yorumlayici['bul'](isim, this.baglam) as TurkodDeger | undefined;
      if (degisken) return degisken;

      const f = this.yorumlayici['fonksiyonlar'].get(isim) as FonksiyonDegeri | undefined;
      if (f) return new TurkodDeger('fonksiyon', f);

      if (YERLESIK_ADLAR.has(isim)) {
        return new TurkodDeger('fonksiyon', { ad: isim, parametreler: [], govde: [], kapali: this.baglam } as FonksiyonDegeri);
      }

      throw new TurkodHatasi(`"${isim}" tanımlı değil.`, this.satir);
    }

    throw new TurkodHatasi(
      this.i >= this.kaynak.length ? 'Eksik ifade.' : `Beklenmeyen karakter: "${this.kaynak[this.i]}"`,
      this.satir
    );
  }
}
