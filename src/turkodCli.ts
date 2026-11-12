/**
 * `türkod` komut satırı aracı — isteğe bağlı modülleri indirir.
 *
 * Uzantı ağır çalışma zamanlarını içinde taşımaz; gerektiğinde indirilir:
 *
 *   türkod yeni modül indir türküi     → TürkUI (Electron) çalışma zamanını indirir
 *   türkod modül liste                 → indirilmiş modülleri listeler
 *   türkod yardım                      → kullanım
 *
 * Bu dosya `vscode` kullanmaz; `bin/turkod.js` üzerinden düz Node ile çalışır.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  MODULLER,
  VARSAYILAN_ELEKTRON_SURUMU,
  boyutMetni,
  kuruluModuller,
  modulAdiCoz,
  modulIndir,
} from './turkuiIndirici';
import { kuruluOyunModulu, oyunModulIndir, OYUN_PYTHON_SURUMU, URSINA_SURUMU } from './oyunIndirici';

const YARDIM = `türkod — Türkod komut satırı aracı

Kullanım:
  türkod yeni modül indir <ad>   Modülü indirir (türküi veya oyun)
  türkod modül indir <ad>        Aynısı, kısa yol
  türkod modül liste             İndirilmiş modülleri gösterir
  türkod yardım                  Bu bilgiyi gösterir
  türkod sürüm                   Sürümü gösterir

Seçenekler:
  --sürüm, -s <sürüm>            İndirilecek Electron sürümü (varsayılan ${VARSAYILAN_ELEKTRON_SURUMU})

Modüller:
  türküi    TürkUI pencereleri için Electron çalışma zamanı (~250 MB)
  oyun      Oyun pencereleri için yönetilen Python ve Ursina

Örnekler:
  türkod yeni modül indir türküi
  türkod yeni modül indir oyun
  türküi çalıştır
`;

function yaz(metin = ''): void {
  process.stdout.write(`${metin}\n`);
}

function hataYaz(metin: string): void {
  process.stderr.write(`${metin}\n`);
}

function surum(): string {
  try {
    const paket = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '..', 'package.json'), 'utf8')
    ) as { version?: string };
    return paket.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

/** `--sürüm değer` / `-s değer` seçeneğini ayırır. */
function secenekAyir(
  argumanlar: string[],
  adlar: string[]
): { kalan: string[]; deger?: string } {
  const kalan: string[] = [];
  let deger: string | undefined;
  for (let i = 0; i < argumanlar.length; i++) {
    const arguman = argumanlar[i];
    if (adlar.includes(arguman)) {
      deger = argumanlar[i + 1];
      i++;
      continue;
    }
    if (adlar.some((ad) => arguman.startsWith(`${ad}=`))) {
      deger = arguman.slice(arguman.indexOf('=') + 1);
      continue;
    }
    kalan.push(arguman);
  }
  return { kalan, deger };
}

/** İndirme ilerlemesini tek satırda gösterir (terminalde %10'luk adımlarla). */
function ilerlemeYazici(): (bilgi: { alinan: number; toplam: number; yuzde: number }) => void {
  let sonYuzde = -1;
  const tty = Boolean(process.stdout.isTTY);
  return (bilgi) => {
    const adim = tty ? 2 : 10;
    if (bilgi.yuzde === sonYuzde || bilgi.yuzde % adim !== 0) return;
    sonYuzde = bilgi.yuzde;
    const toplam = bilgi.toplam > 0 ? ` / ${boyutMetni(bilgi.toplam)}` : '';
    const satir = `  %${String(bilgi.yuzde).padStart(3)}  ${boyutMetni(bilgi.alinan)}${toplam}`;
    process.stdout.write(tty ? `\r${satir}` : `${satir}\n`);
  };
}

async function modulIndirKomutu(ad: string | undefined, surumDegeri?: string): Promise<number> {
  if (!ad) {
    hataYaz('Kullanım: türkod yeni modül indir <ad>');
    yaz(`Modüller: ${MODULLER.join(', ')}`);
    return 1;
  }

  const modul = modulAdiCoz(ad);
  if (!modul) {
    hataYaz(`Bilinmeyen modül: ${ad}`);
    yaz(`Kullanılabilir modüller: ${MODULLER.join(', ')}`);
    return 1;
  }

  const electronSurumu = surumDegeri?.trim() || VARSAYILAN_ELEKTRON_SURUMU;
  if (modul === 'oyun') {
    yaz(`Oyun modülü indiriliyor (Python ${OYUN_PYTHON_SURUMU} + Ursina ${URSINA_SURUMU})…`);
    const sonuc = await oyunModulIndir({ bilgi: (metin) => hataYaz(`  ${metin}`), ilerleme: ilerlemeYazici() });
    if (process.stdout.isTTY) process.stdout.write('\n');
    yaz(`✔ ${sonuc.zatenKurulu ? 'Modül zaten kurulu' : 'Modül hazır'}: ${sonuc.klasor} (${sonuc.boyutMb} MB)`);
    yaz('Artık `içe_aktar Oyun` kullanan programlar oyun penceresi açabilir.');
    return 0;
  }
  yaz(`TürkUI modülü indiriliyor (Electron ${electronSurumu})…`);

  const sonuc = await modulIndir({
    surum: electronSurumu,
    bilgi: (metin) => hataYaz(`  ${metin}`),
    ilerleme: ilerlemeYazici(),
  });
  if (process.stdout.isTTY) process.stdout.write('\n');

  if (sonuc.zatenKurulu) {
    yaz(`✔ Modül zaten kurulu: ${sonuc.klasor} (${sonuc.boyutMb} MB)`);
  } else {
    yaz(`✔ Modül hazır: ${sonuc.klasor} (${sonuc.boyutMb} MB)`);
  }
  yaz();
  yaz('Artık `içe_aktar TürkUI` kullanan programlar gerçek pencerelerle çalışır:');
  yaz('    türküi çalıştır');
  return 0;
}

function modulListeKomutu(): number {
  const kurulu = kuruluModuller();
  const oyun = kuruluOyunModulu();
  if (kurulu.length === 0 && !oyun) {
    yaz('İndirilmiş modül yok.');
    yaz('TürkUI için: türkod yeni modül indir türküi');
    return 0;
  }
  yaz('Kurulu modüller:');
  for (const modul of kurulu) {
    yaz(`  türküi  Electron ${modul.surum}  (${modul.boyutMb} MB)`);
    yaz(`          ${modul.klasor}`);
  }
  if (oyun) {
    yaz(`  oyun    Python ${oyun.pythonSurumu} + Ursina ${oyun.surum}  (${oyun.boyutMb} MB)`);
    yaz(`          ${oyun.klasor}`);
  }
  return 0;
}

/** Komut satırını çalıştırır ve çıkış kodunu döndürür. */
export async function main(argumanlar: string[]): Promise<number> {
  const [komut, ...gerisi] = argumanlar;

  if (!komut || ['yardım', 'yardim', 'help', '-h', '--help'].includes(komut)) {
    yaz(YARDIM);
    return 0;
  }
  if (['sürüm', 'surum', 'version', '-v', '--version'].includes(komut)) {
    yaz(`türkod ${surum()}`);
    return 0;
  }

  if (['modül', 'modul', 'module', 'yeni', 'eklenti'].includes(komut)) {
    const { kalan, deger } = secenekAyir(gerisi, ['--sürüm', '--surum', '-s']);
    // `yeni modül indir türküi`, `modül indir türküi`, `modül türküi` aynı işi yapar.
    const dolgu = new Set([
      'modül',
      'modul',
      'module',
      'yeni',
      'eklenti',
      'indir',
      'yükle',
      'yukle',
      'kur',
      'ekle',
      'install',
    ]);
    if (kalan.some((arguman) => ['liste', 'list', 'durum'].includes(arguman))) {
      return modulListeKomutu();
    }
    const ad = kalan.find((arguman) => !dolgu.has(arguman));
    return modulIndirKomutu(ad, deger);
  }

  hataYaz(`Bilinmeyen komut: ${komut}`);
  yaz(YARDIM);
  return 1;
}

/** `bin/turkod.js` bu işlevi çağırır. */
export function baslat(): void {
  void main(process.argv.slice(2))
    .then((kod) => {
      process.exitCode = kod;
    })
    .catch((e) => {
      const mesaj = e instanceof Error ? e.message : String(e);
      hataYaz(`Hata: ${mesaj}`);
      process.exitCode = 1;
    });
}
