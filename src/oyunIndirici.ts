/** Oyun modülünün Python/Ursina bağımlılıklarını kullanıcıdan kurulum istemeden hazırlar. */
import * as fs from 'node:fs';
import * as http from 'node:http';
import * as https from 'node:https';
import * as os from 'node:os';
import * as path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import * as readline from 'node:readline';
import { modulKoku } from './uygulamaPaketleyici';
import { boyutMetni, IndirmeIlerlemesi } from './turkuiIndirici';

export const UV_SURUMU = '0.13.7';
export const OYUN_PYTHON_SURUMU = '3.12';
export const URSINA_SURUMU = '8.3.0';

export interface OyunModulIndirmeSecenekleri {
  ilerleme?: (bilgi: IndirmeIlerlemesi) => void;
  bilgi?: (metin: string) => void;
}

export interface OyunModulIndirmeSonucu {
  klasor: string;
  surum: string;
  pythonSurumu: string;
  zatenKurulu: boolean;
  boyutMb: number;
}

export interface KuruluOyunModulu {
  klasor: string;
  surum: string;
  pythonSurumu: string;
  boyutMb: number;
}

export function oyunModulKlasoru(): string {
  return path.join(modulKoku(), 'oyun');
}

export function oyunModulPythonYolu(): string | undefined {
  const kok = oyunModulKlasoru();
  const aday = process.platform === 'win32'
    ? path.join(kok, 'venv', 'Scripts', 'python.exe')
    : path.join(kok, 'venv', 'bin', 'python');
  try {
    const marker = JSON.parse(fs.readFileSync(path.join(kok, '.oyun-modul.json'), 'utf8')) as { kurulumSurumu?: number };
    return marker.kurulumSurumu === 2 && fs.existsSync(aday) ? aday : undefined;
  } catch {
    return undefined;
  }
}

function klasorBoyutuMb(klasor: string): number {
  let bayt = 0;
  const gez = (dizin: string): void => {
    let girdiler: fs.Dirent[];
    try { girdiler = fs.readdirSync(dizin, { withFileTypes: true }); } catch { return; }
    for (const girdi of girdiler) {
      const tam = path.join(dizin, girdi.name);
      if (girdi.isDirectory()) gez(tam);
      else if (girdi.isFile()) {
        try { bayt += fs.statSync(tam).size; } catch { /* geçici dosya değişmiş olabilir */ }
      }
    }
  };
  gez(klasor);
  return Math.round((bayt / (1024 * 1024)) * 10) / 10;
}

export function kuruluOyunModulu(): KuruluOyunModulu | undefined {
  if (!oyunModulPythonYolu()) return undefined;
  return {
    klasor: oyunModulKlasoru(),
    surum: URSINA_SURUMU,
    pythonSurumu: OYUN_PYTHON_SURUMU,
    boyutMb: klasorBoyutuMb(oyunModulKlasoru()),
  };
}

function uvVarlikAdi(): string {
  const mimari = process.arch === 'arm64' ? 'aarch64' : process.arch === 'x64' ? 'x86_64' : '';
  if (!mimari) throw new Error(`Oyun modülü bu işlemci mimarisini desteklemiyor: ${process.arch}`);
  if (process.platform === 'win32') return `uv-${mimari}-pc-windows-msvc.zip`;
  if (process.platform === 'darwin') return `uv-${mimari}-apple-darwin.tar.gz`;
  if (process.platform === 'linux') return `uv-${mimari}-unknown-linux-gnu.tar.gz`;
  throw new Error(`Oyun modülü bu işletim sistemini desteklemiyor: ${process.platform}`);
}

function uvIndirmeAdresleri(): string[] {
  const ad = uvVarlikAdi();
  return [
    `https://github.com/astral-sh/uv/releases/download/${UV_SURUMU}/${ad}`,
    `https://releases.astral.sh/github/uv/releases/download/${UV_SURUMU}/${ad}`,
  ];
}

function dosyaIndir(
  adres: string,
  hedef: string,
  ilerleme?: (bilgi: IndirmeIlerlemesi) => void,
  yonlendirme = 0
): Promise<void> {
  return new Promise<void>((coz, reddet) => {
    if (yonlendirme > 6) return reddet(new Error(`Çok fazla yönlendirme: ${adres}`));
    const istemci = adres.startsWith('http://') ? http : https;
    const istek = istemci.get(adres, { headers: { 'User-Agent': 'turkod-vscode', Accept: '*/*' } }, (yanit) => {
      const kod = yanit.statusCode ?? 0;
      if (kod >= 300 && kod < 400 && yanit.headers.location) {
        yanit.resume();
        const yeni = yanit.headers.location.startsWith('http') ? yanit.headers.location : new URL(yanit.headers.location, adres).toString();
        void dosyaIndir(yeni, hedef, ilerleme, yonlendirme + 1).then(coz, reddet);
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
        if (ilerleme) ilerleme({ alinan, toplam, yuzde: toplam > 0 ? Math.min(100, Math.floor(alinan * 100 / toplam)) : 0 });
      });
      yanit.on('error', (hata) => { akis.destroy(); reddet(hata); });
      akis.on('error', reddet);
      akis.on('finish', coz);
      yanit.pipe(akis);
    });
    istek.on('error', reddet);
    istek.setTimeout(60_000, () => istek.destroy(new Error(`İndirme zaman aşımı: ${adres}`)));
  });
}

function arsivAc(arsiv: string, hedef: string): void {
  fs.mkdirSync(hedef, { recursive: true });
  const tar = spawnSync('tar', ['-xf', arsiv, '-C', hedef], { stdio: 'ignore', windowsHide: true });
  if (tar.status === 0) return;
  if (process.platform === 'win32' && arsiv.toLowerCase().endsWith('.zip')) {
    const komut = `Expand-Archive -LiteralPath '${arsiv.replace(/'/g, "''")}' -DestinationPath '${hedef.replace(/'/g, "''")}' -Force`;
    const ps = spawnSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', komut], { stdio: 'ignore', windowsHide: true });
    if (ps.status === 0) return;
  }
  throw new Error(`Oyun modülü arşivi açılamadı: ${tar.error?.message ?? `çıkış kodu ${tar.status}`}`);
}

function dosyaBul(klasor: string, ad: string): string | undefined {
  let girdiler: fs.Dirent[];
  try { girdiler = fs.readdirSync(klasor, { withFileTypes: true }); } catch { return undefined; }
  for (const girdi of girdiler) {
    const tam = path.join(klasor, girdi.name);
    if (girdi.isDirectory()) {
      const alt = dosyaBul(tam, ad);
      if (alt) return alt;
    } else if (girdi.isFile() && girdi.name.toLowerCase() === ad.toLowerCase()) return tam;
  }
  return undefined;
}

function komutCalistir(
  program: string,
  argumanlar: string[],
  env: NodeJS.ProcessEnv,
  bilgi: (metin: string) => void
): Promise<void> {
  return new Promise<void>((coz, reddet) => {
    const surec = spawn(program, argumanlar, { env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    const hatalar: string[] = [];
    for (const akis of [surec.stdout, surec.stderr]) {
      if (!akis) continue;
      const satirlar = readline.createInterface({ input: akis });
      satirlar.on('line', (satir) => {
        if (akis === surec.stderr) hatalar.push(satir);
        if (satir.trim()) bilgi(satir.trim());
      });
    }
    surec.once('error', reddet);
    surec.once('close', (kod) => {
      if (kod === 0) coz();
      else reddet(new Error(`${path.basename(program)} başarısız oldu (çıkış kodu ${kod}).\n${hatalar.slice(-18).join('\n')}`));
    });
  });
}

function uvKomutuBul(klasor: string): string {
  const ad = process.platform === 'win32' ? 'uv.exe' : 'uv';
  const bulunan = dosyaBul(klasor, ad);
  if (!bulunan) throw new Error('İndirilen uv çalışma aracı arşivinde çalıştırılabilir dosya bulunamadı.');
  const hedef = path.join(klasor, 'tools', ad);
  fs.mkdirSync(path.dirname(hedef), { recursive: true });
  fs.copyFileSync(bulunan, hedef);
  return hedef;
}

/** uv, Python 3.12 ve Ursina'yı modül klasörüne kurar; sistem PATH/registry'sine dokunmaz. */
export async function oyunModulIndir(
  secenekler: OyunModulIndirmeSecenekleri = {}
): Promise<OyunModulIndirmeSonucu> {
  const bilgi = secenekler.bilgi ?? (() => undefined);
  const varOlan = kuruluOyunModulu();
  if (varOlan) return { ...varOlan, zatenKurulu: true };

  const kok = modulKoku();
  const hedef = oyunModulKlasoru();
  const gecici = path.join(kok, `.oyun-indiriliyor-${process.pid}-${Date.now()}`);
  const arsiv = path.join(os.tmpdir(), `turkod-uv-${UV_SURUMU}-${process.pid}${process.platform === 'win32' ? '.zip' : '.tar.gz'}`);
  fs.mkdirSync(kok, { recursive: true });
  fs.rmSync(hedef, { recursive: true, force: true });
  fs.mkdirSync(hedef, { recursive: true });
  fs.rmSync(gecici, { recursive: true, force: true });
  fs.mkdirSync(gecici, { recursive: true });

  try {
    let indirildi = false;
    let sonHata: Error | undefined;
    for (const adres of uvIndirmeAdresleri()) {
      try {
        bilgi(`uv çalışma aracı indiriliyor: ${adres}`);
        await dosyaIndir(adres, arsiv, secenekler.ilerleme);
        indirildi = true;
        break;
      } catch (hata) {
        sonHata = hata instanceof Error ? hata : new Error(String(hata));
        bilgi(`İndirme adresi başarısız: ${sonHata.message}`);
        fs.rmSync(arsiv, { force: true });
      }
    }
    if (!indirildi) throw new Error(`Oyun çalışma aracı indirilemedi: ${sonHata?.message ?? 'bağlantı kurulamadı'}`);

    const arsivKlasoru = path.join(gecici, 'uv-arsiv');
    bilgi('Oyun çalışma aracı açılıyor…');
    arsivAc(arsiv, arsivKlasoru);
    const uv = uvKomutuBul(arsivKlasoru);
    // uv çalışma zamanları kurulumdan sonra taşınamaz; Python ve venv baştan kalıcı hedefe kurulur.
    const pythonKurulum = path.join(hedef, 'python');
    const venv = path.join(hedef, 'venv');
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      UV_PYTHON_INSTALL_DIR: pythonKurulum,
      UV_CACHE_DIR: path.join(gecici, '.uv-cache'),
      UV_PYTHON_PREFERENCE: 'only-managed',
      UV_PYTHON_NO_REGISTRY: '1',
      UV_NO_PROGRESS: '1',
      UV_LINK_MODE: 'copy',
    };

    bilgi(`Yönetilen Python ${OYUN_PYTHON_SURUMU} indiriliyor…`);
    await komutCalistir(uv, ['python', 'install', OYUN_PYTHON_SURUMU], env, bilgi);
    bilgi(`Ursina ${URSINA_SURUMU} ve bağımlılıkları kuruluyor…`);
    await komutCalistir(uv, ['venv', '--python', OYUN_PYTHON_SURUMU, venv], env, bilgi);
    const python = process.platform === 'win32'
      ? path.join(venv, 'Scripts', 'python.exe')
      : path.join(venv, 'bin', 'python');
    await komutCalistir(uv, ['pip', 'install', '--python', python, `ursina==${URSINA_SURUMU}`], env, bilgi);
    bilgi('Oyun modülü doğrulanıyor…');
    await komutCalistir(python, ['-c', 'import ursina'], env, bilgi);

    fs.writeFileSync(path.join(hedef, '.oyun-modul.json'), JSON.stringify({ kurulumSurumu: 2, uv: UV_SURUMU, python: OYUN_PYTHON_SURUMU, ursina: URSINA_SURUMU }, null, 2), 'utf8');
    fs.rmSync(path.join(gecici, '.uv-cache'), { recursive: true, force: true });
    fs.rmSync(arsivKlasoru, { recursive: true, force: true });
    return {
      klasor: hedef,
      surum: URSINA_SURUMU,
      pythonSurumu: OYUN_PYTHON_SURUMU,
      zatenKurulu: false,
      boyutMb: klasorBoyutuMb(hedef),
    };
  } catch (hata) {
    fs.rmSync(hedef, { recursive: true, force: true });
    const mesaj = hata instanceof Error ? hata.message : String(hata);
    throw new Error(`Oyun modülü kurulamadı.\n${mesaj}\nİnternet bağlantısını denetleyip komutu yeniden çalıştır.`);
  } finally {
    fs.rmSync(arsiv, { force: true });
    fs.rmSync(gecici, { recursive: true, force: true });
  }
}
