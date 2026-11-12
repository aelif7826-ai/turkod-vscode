/**
 * İsteğe bağlı **TürkUI modülü** (Electron çalışma zamanı) indiricisi.
 *
 * Uzantı Electron'u içinde taşımaz; kurulum ~0,5 MB kalır. Kullanıcı bir kez
 *
 *   türkod yeni modül indir türküi
 *
 * yazınca çalışma zamanı şu klasöre indirilir ve `electronKlasoruBul` onu
 * otomatik bulur:
 *
 *   %LOCALAPPDATA%\turkui\modul\electron\<sürüm>\
 *
 * Bu modül `vscode` kullanmaz; hem `turkod` komut satırından hem uzantıdan
 * çağrılabilir, testlerden doğrudan çalıştırılabilir.
 */

import * as fs from 'node:fs';
import * as http from 'node:http';
import * as https from 'node:https';
import * as os from 'node:os';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  electronKlasoruGecerliMi,
  electronModulKlasoru,
  modulKoku,
} from './uygulamaPaketleyici';
import { oyunModuluEtkinMi } from './oyunDurumu';

/**
 * TURKOD Studio ile aynı sürüm: paketlenen uygulamalar Studio'nun ürettiği
 * çalışma zamanıyla aynı olsun diye sabit tutulur.
 */
export const VARSAYILAN_ELEKTRON_SURUMU = '28.3.3';

/** İndirilebilen modüller: kullanıcı adı → görünen ad. */
export const MODULLER = ['türküi', ...(oyunModuluEtkinMi() ? ['oyun' as const] : [])] as const;
export type ModulAdi = 'türküi' | 'oyun';

export interface IndirmeIlerlemesi {
  alinan: number;
  toplam: number;
  yuzde: number;
}

export interface ModulIndirmeSecenekleri {
  /** Electron sürümü; boş bırakılırsa {@link VARSAYILAN_ELEKTRON_SURUMU}. */
  surum?: string;
  /** İndirme ilerlemesi (yüzde 0-100). */
  ilerleme?: (bilgi: IndirmeIlerlemesi) => void;
  /** Bilgi satırları (hangi adresten indirildiği, açma, ...). */
  bilgi?: (metin: string) => void;
}

export interface ModulIndirmeSonucu {
  klasor: string;
  surum: string;
  zatenKurulu: boolean;
  boyutMb: number;
}

/**
 * Kullanıcının yazdığı modül adını çözer.
 * `türküi`, `turkui`, `türkui`, `turküi` aynı modüle gider.
 */
export function modulAdiCoz(ad: string | undefined): ModulAdi | undefined {
  const temiz = String(ad ?? '').trim().toLocaleLowerCase('tr');
  const sade = temiz
    .replace(/ü/g, 'u')
    .replace(/i̇/g, 'i')
    .replace(/ı/g, 'i');
  if (['türküi', 'turkui', 'türkui', 'turküi', 'turkui-modul', 'turkui modul'].includes(temiz)) {
    return 'türküi';
  }
  if (['turkui', 'turkui-modul', 'turkui modul', 'electron'].includes(sade)) return 'türküi';
  if (oyunModuluEtkinMi() && ['oyun', 'oyun-modul', 'oyun modul', 'game'].includes(sade)) return 'oyun';
  return undefined;
}

/** Electron'un indirme dosyalarındaki platform etiketi (`win32-x64`, `darwin-arm64`, ...). */
function platformEtiketi(): string {
  const mimari = process.arch === 'arm64' ? 'arm64' : process.arch === 'ia32' ? 'ia32' : 'x64';
  return `${process.platform}-${mimari}`;
}

/** Sırayla denenecek indirme adresleri (GitHub engelliyse ayna kullanılır). */
export function indirmeAdresleri(surum = VARSAYILAN_ELEKTRON_SURUMU): string[] {
  const dosya = `electron-v${surum}-${platformEtiketi()}.zip`;
  return [
    `https://github.com/electron/electron/releases/download/v${surum}/${dosya}`,
    `https://npmmirror.com/mirrors/electron/${surum}/${dosya}`,
  ];
}

function boyutMetni(bayt: number): string {
  return `${(bayt / (1024 * 1024)).toFixed(1)} MB`;
}

/** Bir klasörün toplam boyutu (MB). */
function klasorBoyutuMb(klasor: string): number {
  let toplam = 0;
  const gez = (yol: string): void => {
    let girdiler: fs.Dirent[];
    try {
      girdiler = fs.readdirSync(yol, { withFileTypes: true });
    } catch {
      return;
    }
    for (const girdi of girdiler) {
      const alt = path.join(yol, girdi.name);
      if (girdi.isDirectory()) {
        gez(alt);
      } else if (girdi.isFile()) {
        try {
          toplam += fs.statSync(alt).size;
        } catch {
          /* atla */
        }
      }
    }
  };
  gez(klasor);
  return Math.round((toplam / (1024 * 1024)) * 10) / 10;
}

/** HTTPS adresini (yönlendirmeleri izleyerek) dosyaya indirir. */
function adrestenIndir(
  adres: string,
  hedef: string,
  ilerleme?: (bilgi: IndirmeIlerlemesi) => void,
  yonlendirme = 0
): Promise<void> {
  return new Promise<void>((coz, reddet) => {
    if (yonlendirme > 5) {
      reddet(new Error(`Çok fazla yönlendirme: ${adres}`));
      return;
    }
    const istemci = adres.startsWith('http://') ? http : https;
    const istek = istemci.get(
      adres,
      { headers: { 'User-Agent': 'turkod-vscode', Accept: '*/*' } },
      (yanit) => {
        const kod = yanit.statusCode ?? 0;
        const konum = yanit.headers.location;
        if (kod >= 300 && kod < 400 && konum) {
          yanit.resume();
          const yeni = konum.startsWith('http') ? konum : new URL(konum, adres).toString();
          adrestenIndir(yeni, hedef, ilerleme, yonlendirme + 1).then(coz, reddet);
          return;
        }
        if (kod !== 200) {
          yanit.resume();
          reddet(new Error(`Sunucu ${kod} döndürdü: ${adres}`));
          return;
        }

        const toplam = Number(yanit.headers['content-length'] ?? 0);
        let alinan = 0;
        const akis = fs.createWriteStream(hedef);
        yanit.on('data', (parca: Buffer) => {
          alinan += parca.length;
          if (ilerleme) {
            const yuzde = toplam > 0 ? Math.min(100, Math.floor((alinan / toplam) * 100)) : 0;
            ilerleme({ alinan, toplam, yuzde });
          }
        });
        yanit.on('error', (e) => {
          akis.destroy();
          reddet(e);
        });
        akis.on('error', reddet);
        akis.on('finish', () => coz());
        yanit.pipe(akis);
      }
    );
    istek.on('error', reddet);
    istek.setTimeout(60_000, () => {
      istek.destroy(new Error(`İndirme zaman aşımı: ${adres}`));
    });
  });
}

/** Zip dosyasını hedef klasöre açar (Windows'ta `tar`, yoksa PowerShell / unzip). */
function zipAc(zip: string, hedef: string): void {
  fs.mkdirSync(hedef, { recursive: true });
  const powershellKomutu =
    `Expand-Archive -LiteralPath '${zip.replace(/'/g, "''")}' ` +
    `-DestinationPath '${hedef.replace(/'/g, "''")}' -Force`;
  const denemeler: Array<[string, string[]]> =
    process.platform === 'win32'
      ? [
          ['tar', ['-xf', zip, '-C', hedef]],
          ['powershell', ['-NoProfile', '-NonInteractive', '-Command', powershellKomutu]],
        ]
      : [['unzip', ['-q', '-o', zip, '-d', hedef]]];

  const hatalar: string[] = [];
  for (const [komut, argumanlar] of denemeler) {
    const sonuc = spawnSync(komut, argumanlar, { stdio: 'ignore', windowsHide: true });
    if (sonuc.status === 0) return;
    hatalar.push(`${komut}: ${sonuc.error ? sonuc.error.message : `çıkış kodu ${sonuc.status}`}`);
  }
  throw new Error(`Zip açılamadı: ${zip}\n  ${hatalar.join('\n  ')}`);
}

/**
 * TürkUI modülünü (Electron çalışma zamanı) indirir ve yerleştirir.
 * Modül zaten kuruluysa hiçbir şey indirilmez.
 */
export async function modulIndir(
  secenekler: ModulIndirmeSecenekleri = {}
): Promise<ModulIndirmeSonucu> {
  const surum = String(secenekler.surum ?? VARSAYILAN_ELEKTRON_SURUMU).trim() || VARSAYILAN_ELEKTRON_SURUMU;
  const bilgi = secenekler.bilgi ?? (() => undefined);
  const hedef = electronModulKlasoru(surum);

  if (electronKlasoruGecerliMi(hedef)) {
    return { klasor: hedef, surum, zatenKurulu: true, boyutMb: klasorBoyutuMb(hedef) };
  }

  const geciciZip = path.join(os.tmpdir(), `turkui-electron-${surum}-${process.pid}.zip`);
  const geciciKlasor = path.join(modulKoku(), 'electron', `.indiriliyor-${surum}-${process.pid}`);

  const adresler = indirmeAdresleri(surum);
  let sonHata: Error | undefined;
  try {
    fs.mkdirSync(path.dirname(geciciZip), { recursive: true });
    let indirildi = false;
    for (const adres of adresler) {
      try {
        bilgi(`İndiriliyor: ${adres}`);
        await adrestenIndir(adres, geciciZip, secenekler.ilerleme);
        indirildi = true;
        break;
      } catch (e) {
        sonHata = e instanceof Error ? e : new Error(String(e));
        bilgi(`Adres başarısız (${sonHata.message}); sıradaki deneniyor.`);
        fs.rmSync(geciciZip, { force: true });
      }
    }
    if (!indirildi) {
      throw new Error(
        `TürkUI modülü indirilemedi.\n  ${sonHata ? sonHata.message : 'Bilinmeyen hata'}\n` +
          '  • İnternet bağlantısını denetleyin.\n' +
          '  • Kurumsal ağda GitHub engelliyse ayna adresi otomatik denenir.'
      );
    }

    const zipBoyut = (() => {
      try {
        return fs.statSync(geciciZip).size;
      } catch {
        return 0;
      }
    })();
    bilgi(`Zip hazır: ${boyutMetni(zipBoyut)} — açılıyor…`);

    fs.rmSync(geciciKlasor, { recursive: true, force: true });
    zipAc(geciciZip, geciciKlasor);

    if (!electronKlasoruGecerliMi(geciciKlasor)) {
      throw new Error(
        'İndirilen dosya geçerli bir Electron dağıtımı değil.\n' +
          `  Doyayı elle indirip ${hedef} klasörüne açabilirsiniz.`
      );
    }

    fs.rmSync(hedef, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(hedef), { recursive: true });
    fs.renameSync(geciciKlasor, hedef);

    return { klasor: hedef, surum, zatenKurulu: false, boyutMb: klasorBoyutuMb(hedef) };
  } finally {
    fs.rmSync(geciciZip, { force: true });
    fs.rmSync(geciciKlasor, { recursive: true, force: true });
  }
}

export interface KuruluModul {
  surum: string;
  klasor: string;
  boyutMb: number;
}

/** Diskte hazır olan Electron sürümleri (en yenisi önce). */
export function kuruluModuller(): KuruluModul[] {
  const kok = path.join(modulKoku(), 'electron');
  let girdiler: fs.Dirent[];
  try {
    girdiler = fs.readdirSync(kok, { withFileTypes: true });
  } catch {
    return [];
  }
  const moduller: KuruluModul[] = [];
  for (const girdi of girdiler) {
    if (!girdi.isDirectory() || girdi.name.startsWith('.')) continue;
    const klasor = path.join(kok, girdi.name);
    if (!electronKlasoruGecerliMi(klasor)) continue;
    moduller.push({ surum: girdi.name, klasor, boyutMb: klasorBoyutuMb(klasor) });
  }
  return moduller.sort((a, b) =>
    b.surum.localeCompare(a.surum, 'en', { numeric: true })
  );
}

export { boyutMetni };
