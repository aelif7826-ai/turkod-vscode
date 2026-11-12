/**
 * TürkUI uygulamalarını **tek bir `.exe`** dosyasına paketler.
 *
 * Electron uygulamaları çalışmak için yanında `*.dll`, `*.pak` ve `resources/`
 * klasörünü ister. Tek dosya dağıtımı için uygulama klasörü sıkıştırılıp küçük
 * bir başlatıcının (`runtime/baslatici/baslatici.exe`) arkasına eklenir:
 *
 *     [başlatıcı.exe] [zip arşivi] [40 baytlık kuyruk]
 *
 * Kullanıcı yalnızca `.exe` dosyasını kopyalar. İlk çalıştırmada başlatıcı
 * arşivi `%LOCALAPPDATA%\TürkUI\Uygulamalar\<özet>` klasörüne açar; sonraki
 * çalıştırmalarda hazır klasörü kullanır (hızlı açılış).
 *
 * Bu modül `vscode` kullanmaz; testlerden doğrudan çağrılabilir.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as zlib from 'node:zlib';
import * as crypto from 'node:crypto';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { ISARET_DOSYASI } from './uygulamaPaketleyici';

/** Tek dosyanın sonundaki imza. */
export const SFX_IMZASI = 'TRKDSFX1';

/** İmza (8) + özet (16) + arşiv başlangıcı (8) + arşiv uzunluğu (8). */
export const SFX_KUYRUK_BOYU = 40;

/** Tek dosya içindeki arşivde kullanılan sıkıştırma seviyesi. */
const SIKISTIRMA_SEVIYESI = 6;

export interface SfxSecenekleri {
  /** Paketlenmiş uygulama klasörü (kaynak). */
  klasor: string;
  /** Üretilecek tek dosya (`.exe`). */
  exeYolu: string;
  /** Gömülecek başlatıcı: `runtime/baslatici/baslatici.exe`. */
  baslaticiYolu: string;
  /** İlerleme bildirimi: dosya adı ve 0-1 arası oran. */
  ilerleme?: (mesaj: string, oran?: number) => void;
}

export interface SfxSonucu {
  /** Üretilen tek dosya. */
  exeYolu: string;
  /** Dosya boyutu (bayt). */
  boyut: number;
  /** Arşiv özeti (önbellek klasörünün adı). */
  ozet: string;
  /** Arşive giren dosya sayısı. */
  dosyaSayisi: number;
}

export interface SfxBilgisi {
  /** Arşiv özeti (16 bayt, hex). */
  ozet: string;
  /** Başlatıcının (yani arşivin başlangıcının) boyutu. */
  baslaticiBoyutu: number;
  /** Arşiv uzunluğu. */
  arsivBoyutu: number;
}

/** Dosyanın tek dosya paketi olup olmadığını denetler; değilse `undefined` döner. */
export function sfxBilgisi(exeYolu: string): SfxBilgisi | undefined {
  let fd: number | undefined;
  try {
    const boyut = fs.statSync(exeYolu).size;
    if (boyut < SFX_KUYRUK_BOYU + 64) return undefined;
    fd = fs.openSync(exeYolu, 'r');
    const kuyruk = Buffer.alloc(SFX_KUYRUK_BOYU);
    fs.readSync(fd, kuyruk, 0, SFX_KUYRUK_BOYU, boyut - SFX_KUYRUK_BOYU);
    if (kuyruk.toString('ascii', 0, 8) !== SFX_IMZASI) return undefined;
    const baslaticiBoyutu = Number(kuyruk.readBigInt64LE(24));
    const arsivBoyutu = Number(kuyruk.readBigInt64LE(32));
    if (baslaticiBoyutu <= 0 || arsivBoyutu <= 0) return undefined;
    return {
      ozet: kuyruk.toString('hex', 8, 24),
      baslaticiBoyutu,
      arsivBoyutu,
    };
  } catch {
    return undefined;
  } finally {
    if (fd !== undefined) {
      try {
        fs.closeSync(fd);
      } catch {
        /* yok say */
      }
    }
  }
}

/**
 * Uygulama klasörünü tek bir `.exe` dosyasına dönüştürür.
 *
 * Hedef dosya varsa üzerine yazılır. Dosya çalışıyorsa anlaşılır bir hata verir.
 */
export async function tekDosyaOlustur(secenekler: SfxSecenekleri): Promise<SfxSonucu> {
  if (!fs.existsSync(secenekler.baslaticiYolu)) {
    throw new Error(
      `Tek dosya başlatıcısı bulunamadı: ${secenekler.baslaticiYolu}\n` +
        'Uzantı kurulumu eksik olabilir; "npm run baslatici" ile yeniden derleyin.'
    );
  }
  if (!fs.existsSync(secenekler.klasor)) {
    throw new Error(`Paketlenecek klasör bulunamadı: ${secenekler.klasor}`);
  }

  const exeYolu = path.resolve(secenekler.exeYolu);
  await fs.promises.mkdir(path.dirname(exeYolu), { recursive: true });

  const gecici = `${exeYolu}.arsiv-${process.pid}`;
  const birlesik = `${exeYolu}.yeni-${process.pid}`;
  try {
    secenekler.ilerleme?.('Arşiv oluşturuluyor...', 0);
    const arsiv = await arsivYaz(secenekler.klasor, gecici, secenekler.ilerleme);

    const baslaticiBoyutu = fs.statSync(secenekler.baslaticiYolu).size;
    secenekler.ilerleme?.('Tek dosya birleştiriliyor...', 1);

    await fs.promises.copyFile(secenekler.baslaticiYolu, birlesik);
    await pipeline(fs.createReadStream(gecici), fs.createWriteStream(birlesik, { flags: 'a' }));

    const kuyruk = Buffer.alloc(SFX_KUYRUK_BOYU);
    // Kuyrukta SHA-256'nın ilk 16 baytı tutulur; başlatıcı önbellek klasörü olarak kullanır.
    const ozet = arsiv.ozet.slice(0, 32);
    kuyruk.write(SFX_IMZASI, 0, 'ascii');
    Buffer.from(ozet, 'hex').copy(kuyruk, 8, 0, 16);
    kuyruk.writeBigInt64LE(BigInt(baslaticiBoyutu), 24);
    kuyruk.writeBigInt64LE(BigInt(arsiv.boyut), 32);
    await fs.promises.appendFile(birlesik, kuyruk);

    // Hazır dosya hedefe taşınır: yazma yarıda kalsa bile eski .exe bozulmaz.
    try {
      await fs.promises.rename(birlesik, exeYolu);
    } catch (e) {
      throw new Error(
        `Tek dosya yazılamadı: ${exeYolu}\n` +
          'Dosya çalışıyor olabilir; uygulamayı kapatıp yeniden deneyin.\n' +
          (e instanceof Error ? e.message : String(e))
      );
    }

    return {
      exeYolu,
      boyut: baslaticiBoyutu + arsiv.boyut + SFX_KUYRUK_BOYU,
      ozet,
      dosyaSayisi: arsiv.dosyaSayisi,
    };
  } finally {
    for (const dosya of [gecici, birlesik]) {
      try {
        fs.rmSync(dosya, { force: true });
      } catch {
        /* yok say */
      }
    }
  }
}

/* ---------------- zip ---------------- */

interface ArsivSonucu {
  boyut: number;
  ozet: string;
  dosyaSayisi: number;
}

interface ArsivGirdisi {
  ad: Buffer;
  ham: number;
  sikistirilmis: number;
  crc: number;
  zaman: { tarih: number; saat: number };
  yerelBaslangic: number;
}

/** Klasördeki tüm dosyaları (alt klasörlerle) sıralı biçimde listeler. */
function dosyaListesi(klasor: string, atlanan: Set<string> = new Set()): string[] {
  const sonuc: string[] = [];
  const girdiler = fs.readdirSync(klasor, { withFileTypes: true });
  girdiler.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

  for (const girdi of girdiler) {
    if (atlanan.has(girdi.name)) continue;
    const tam = path.join(klasor, girdi.name);
    if (girdi.isDirectory()) {
      sonuc.push(...dosyaListesi(tam, atlanan));
    } else if (girdi.isFile()) {
      sonuc.push(tam);
    }
  }
  return sonuc;
}

/** Bir Transform: geçen baytları sayar ve CRC32 hesaplar. */
class Sayac extends Transform {
  boyut = 0;
  crc = 0;

  override _transform(
    parca: Buffer,
    _kodlama: BufferEncoding,
    geri: (hata?: Error | null, veri?: Buffer) => void
  ): void {
    this.crc = crcGuncelle(this.crc, parca);
    this.boyut += parca.length;
    geri(null, parca);
  }
}

let crcTablosu: Uint32Array | undefined;

function crcTablosuAl(): Uint32Array {
  if (crcTablosu) return crcTablosu;
  const tablo = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    tablo[i] = c >>> 0;
  }
  crcTablosu = tablo;
  return tablo;
}

function crcGuncelle(crc: number, veri: Buffer): number {
  const tablo = crcTablosuAl();
  let c = (crc ^ 0xffffffff) >>> 0;
  for (let i = 0; i < veri.length; i++) {
    c = (tablo[(c ^ veri[i]) & 0xff] ^ (c >>> 8)) >>> 0;
  }
  return (c ^ 0xffffffff) >>> 0;
}

/** DOS biçiminde tarih/saat (zip başlıkları için). */
function dosZamani(zaman: Date): { tarih: number; saat: number } {
  const yil = Math.max(1980, Math.min(2107, zaman.getFullYear()));
  const tarih = ((yil - 1980) << 9) | ((zaman.getMonth() + 1) << 5) | zaman.getDate();
  const saat =
    (zaman.getHours() << 11) | (zaman.getMinutes() << 5) | Math.floor(zaman.getSeconds() / 2);
  return { tarih, saat };
}

/** Sıralı yazan basit dosya yazıcısı (konum her zaman açıkça verilir). */
class Yazici {
  private readonly fd: number;
  konum = 0;

  constructor(yol: string) {
    this.fd = fs.openSync(yol, 'w');
  }

  yaz(veri: Buffer): void {
    fs.writeSync(this.fd, veri, 0, veri.length, this.konum);
    this.konum += veri.length;
  }

  kapat(): void {
    fs.closeSync(this.fd);
  }
}

function yerelBaslik(ad: Buffer, zaman: { tarih: number; saat: number }): Buffer {
  const baslik = Buffer.alloc(30 + ad.length);
  baslik.writeUInt32LE(0x04034b50, 0);
  baslik.writeUInt16LE(20, 4); // sürüm
  baslik.writeUInt16LE(0x0808, 6); // bit 3: veri tanımlayıcı, bit 11: UTF-8
  baslik.writeUInt16LE(8, 8); // deflate
  baslik.writeUInt16LE(zaman.saat, 10);
  baslik.writeUInt16LE(zaman.tarih, 12);
  baslik.writeUInt32LE(0, 14); // crc → tanımlayıcıda
  baslik.writeUInt32LE(0, 18); // sıkıştırılmış boyut → tanımlayıcıda
  baslik.writeUInt32LE(0, 22); // ham boyut → tanımlayıcıda
  baslik.writeUInt16LE(ad.length, 26);
  baslik.writeUInt16LE(0, 28); // ek alan yok
  ad.copy(baslik, 30);
  return baslik;
}

function veriTanilayici(crc: number, sikistirilmis: number, ham: number): Buffer {
  const tanilayici = Buffer.alloc(16);
  tanilayici.writeUInt32LE(0x08074b50, 0);
  tanilayici.writeUInt32LE(crc >>> 0, 4);
  tanilayici.writeUInt32LE(sikistirilmis, 8);
  tanilayici.writeUInt32LE(ham, 12);
  return tanilayici;
}

function merkeziKayit(girdi: ArsivGirdisi): Buffer {
  const kayit = Buffer.alloc(46 + girdi.ad.length);
  kayit.writeUInt32LE(0x02014b50, 0);
  kayit.writeUInt16LE(20, 4); // üreten sürüm
  kayit.writeUInt16LE(20, 6); // gereken sürüm
  kayit.writeUInt16LE(0x0808, 8);
  kayit.writeUInt16LE(8, 10);
  kayit.writeUInt16LE(girdi.zaman.saat, 12);
  kayit.writeUInt16LE(girdi.zaman.tarih, 14);
  kayit.writeUInt32LE(girdi.crc >>> 0, 16);
  kayit.writeUInt32LE(girdi.sikistirilmis, 20);
  kayit.writeUInt32LE(girdi.ham, 24);
  kayit.writeUInt16LE(girdi.ad.length, 28);
  kayit.writeUInt16LE(0, 30); // ek alan
  kayit.writeUInt16LE(0, 32); // açıklama
  kayit.writeUInt16LE(0, 34); // disk
  kayit.writeUInt16LE(0, 36); // iç öznitelikler
  kayit.writeUInt32LE(0, 38); // dış öznitelikler
  kayit.writeUInt32LE(girdi.yerelBaslangic, 42);
  girdi.ad.copy(kayit, 46);
  return kayit;
}

function sonKayit(sayi: number, boyut: number, baslangic: number): Buffer {
  const kayit = Buffer.alloc(22);
  kayit.writeUInt32LE(0x06054b50, 0);
  kayit.writeUInt16LE(0, 4);
  kayit.writeUInt16LE(0, 6);
  kayit.writeUInt16LE(sayi, 8);
  kayit.writeUInt16LE(sayi, 10);
  kayit.writeUInt32LE(boyut, 12);
  kayit.writeUInt32LE(baslangic, 16);
  kayit.writeUInt16LE(0, 20);
  return kayit;
}

const EN_BUYUK = 0xffffffff;

/** Klasörü deflate sıkıştırmalı bir ZIP arşivine yazar. */
async function arsivYaz(
  klasor: string,
  hedef: string,
  ilerleme?: (mesaj: string, oran?: number) => void
): Promise<ArsivSonucu> {
  const dosyalar = dosyaListesi(klasor, new Set([ISARET_DOSYASI]));
  if (dosyalar.length === 0) {
    throw new Error(`Paketlenecek dosya bulunamadı: ${klasor}`);
  }

  // Özet içerikten üretilir (ad + boyut + CRC): aynı içerik her zaman aynı
  // önbellek klasörünü kullanır, dosya tarihleri özeti değiştirmez.
  const ozetleyici = crypto.createHash('sha256');
  const yazici = new Yazici(hedef);
  const girdiler: ArsivGirdisi[] = [];

  try {
    for (let i = 0; i < dosyalar.length; i++) {
      const tam = dosyalar[i];
      const goreli = path.relative(klasor, tam).split(path.sep).join('/');
      const ad = Buffer.from(goreli, 'utf8');
      const istat = fs.statSync(tam);
      const zaman = dosZamani(istat.mtime);

      const yerelBaslangic = yazici.konum;
      yazici.yaz(yerelBaslik(ad, zaman));
      const veriBaslangici = yazici.konum;

      const ham = new Sayac();
      const sikistirilmis = new Sayac();
      const cikis = fs.createWriteStream(hedef, { flags: 'r+', start: veriBaslangici });
      await pipeline(
        fs.createReadStream(tam),
        ham,
        zlib.createDeflateRaw({ level: SIKISTIRMA_SEVIYESI }),
        sikistirilmis,
        cikis
      );

      if (ham.boyut > EN_BUYUK || sikistirilmis.boyut > EN_BUYUK) {
        throw new Error(`Dosya çok büyük: ${goreli} (4 GB üzeri tek dosya desteklenmiyor).`);
      }

      yazici.konum = veriBaslangici + sikistirilmis.boyut;
      yazici.yaz(veriTanilayici(ham.crc, sikistirilmis.boyut, ham.boyut));

      girdiler.push({
        ad,
        ham: ham.boyut,
        sikistirilmis: sikistirilmis.boyut,
        crc: ham.crc,
        zaman,
        yerelBaslangic,
      });

      ozetleyici.update(goreli, 'utf8');
      ozetleyici.update('\0');
      ozetleyici.update(`${ham.boyut}:${ham.crc >>> 0}\n`, 'utf8');

      ilerleme?.(`Sıkıştırılıyor: ${goreli}`, (i + 1) / dosyalar.length);
    }

    if (girdiler.length > 0xffff) {
      throw new Error('Arşivde çok fazla dosya var (65535 üzeri).');
    }

    const merkeziBaslangic = yazici.konum;
    for (const girdi of girdiler) {
      yazici.yaz(merkeziKayit(girdi));
    }
    const merkeziBoyut = yazici.konum - merkeziBaslangic;

    if (merkeziBaslangic > EN_BUYUK) {
      throw new Error('Arşiv 4 GB sınırını aşıyor.');
    }

    yazici.yaz(sonKayit(girdiler.length, merkeziBoyut, merkeziBaslangic));
  } finally {
    yazici.kapat();
  }

  const boyut = fs.statSync(hedef).size;
  if (boyut > EN_BUYUK) {
    throw new Error('Arşiv 4 GB sınırını aşıyor.');
  }

  return { boyut, ozet: ozetleyici.digest('hex'), dosyaSayisi: girdiler.length };
}
