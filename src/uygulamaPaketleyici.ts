/**
 * TürkUI programlarını, VS Code'a hiç bağlı olmayan gerçek bir Windows uygulamasına paketler.
 *
 * Üretilen klasör:
 *   <Ad>.exe            → Electron çalıştırıcısı (electron.exe'nin adı değiştirilmiş kopyası)
 *   *.dll, *.pak, ...   → Electron çalışma zamanı dosyaları
 *   resources/app/      → uygulamanın kendisi
 *       main.js         → pencere yöneticisi (runtime/uygulama/main.js)
 *       preload.js      → `acquireVsCodeApi` köprüsü
 *       konsol.html     → `yazdır`/`oku` penceresi
 *       sor.html        → `sor` penceresi
 *       media/          → TürkUI arayüzü
 *       out/            → yorumlayıcı (`calistir.js`, `turkui.js`, `veri/`)
 *       kaynak/         → program ve yanındaki modüller
 *       ikon.ico        → uygulama simgesi
 *
 * Bu modül `vscode` kullanmaz; testlerden doğrudan çağrılabilir.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

/** Hedef klasörün bu uzantı tarafından üretildiğini gösteren işaret dosyası. */
export const ISARET_DOSYASI = '.turkod-uygulama.json';

export interface PaketSecenekleri {
  /** Paketlenecek `.tr` dosyası. */
  kaynakYolu: string;
  /** Kaydedilmemiş değişiklikler için dosya içeriği; verilmezse dosyadan okunur. */
  kaynakMetni?: string;
  /** Uygulamanın oluşturulacağı klasör. */
  ciktiKlasoru: string;
  /** Uygulama (ve `.exe`) adı. */
  uygulamaAdi: string;
  /** Electron dağıtım klasörü (`electron.exe` burada). */
  electronKlasoru: string;
  /** `runtime/uygulama` klasörü. */
  calistirmaKlasoru: string;
  /** `media/turkui-window.html`. */
  medyaDosyasi: string;
  /** Derlenmiş yorumlayıcı (`out/calistir.js`). */
  calistirJs: string;
  /** Derlenmiş TürkUI modülü (`out/turkui.js`). */
  turkuiJs: string;
  /**
   * `true` ise kaynak klasördeki yardımcı dosyalar da (`.tr`, görsel vb.) uygulamaya
   * kopyalanır; dağıtılabilir paket için gereklidir. Çalıştırma sırasında `false`
   * kullanılır ve dosyalar doğrudan proje klasöründen okunur.
   */
  kaynakKopyala?: boolean;
  /** Çalışma zamanı dosyalarını yeniden kopyalamaya zorlar. */
  tamKopyala?: boolean;
}

export interface PaketSonucu {
  /** Başlatılacak `.exe` dosyası. */
  exeYolu: string;
  /** Uygulama klasörü. */
  klasor: string;
  /** Uygulamanın içindeki program dosyası (`resources/app/kaynak/...`). */
  kaynakYolu: string;
  /** Uygulama simgesi (üretilemediyse tanımsız). */
  ikonYolu?: string;
  /** Çalışma zamanı dosyaları bu çağrıda kopyalandı mı? */
  kopyalandi: boolean;
}

interface Isaret {
  surum: 1;
  uygulamaAdi: string;
  electronSurumu: string;
  olusturulma: string;
}

/**
 * Electron tabanlı uygulamaları başlatırken kullanılacak ortam.
 *
 * VS Code'un uzantı süreci `ELECTRON_RUN_AS_NODE=1` ile çalışır. Bu değişken
 * alt sürece geçerse paketlenmiş `.exe` Electron yerine düz Node gibi davranır,
 * `--no-sandbox` seçeneğini reddeder ve süreç 9 koduyla kapanır. Bu yüzden
 * değişken (Windows'ta adı büyük/küçük harf duyarsız) ortamdan temizlenir.
 */
export function electronOrtami(kaynak: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  const ortam: NodeJS.ProcessEnv = { ...kaynak };
  for (const anahtar of Object.keys(ortam)) {
    if (anahtar.toLowerCase() === 'electron_run_as_node') delete ortam[anahtar];
  }
  return ortam;
}

/**
 * Çalıştırmadan önce program kaynağını yedekler.
 *
 * Yanlışlıkla silinen/bozulan bir `.tr` dosyasının son hâli her çalıştırmada
 * saklanır. Aynı içerik arka arkaya yedeklenmez; klasörde en fazla `enFazla`
 * yedek tutulur ve en eskiler silinir. Yedek yazılamazsa `undefined` döner
 * (çalıştırmayı engellemez).
 */
export function kaynakYedekle(
  klasor: string,
  ad: string,
  metin: string,
  enFazla = 20,
  simdi: Date = new Date()
): string | undefined {
  try {
    if (typeof metin !== 'string' || metin.length === 0) return undefined;
    fs.mkdirSync(klasor, { recursive: true });
    const yedekler = fs
      .readdirSync(klasor)
      .filter((dosya) => dosya.toLowerCase().endsWith('.tr'))
      .map((dosya) => {
        const yol = path.join(klasor, dosya);
        try {
          return { yol, zaman: fs.statSync(yol).mtimeMs };
        } catch {
          return undefined;
        }
      })
      .filter((girdi): girdi is { yol: string; zaman: number } => Boolean(girdi))
      .sort((a, b) => b.zaman - a.zaman);

    // Son yedek zaten aynıysa yeniden yazma.
    if (yedekler.length > 0) {
      try {
        if (fs.readFileSync(yedekler[0].yol, 'utf8') === metin) return undefined;
      } catch {
        /* okunamazsa yeni yedek yazılır */
      }
    }

    const iki = (n: number) => String(n).padStart(2, '0');
    const damga =
      `${simdi.getFullYear()}${iki(simdi.getMonth() + 1)}${iki(simdi.getDate())}` +
      `-${iki(simdi.getHours())}${iki(simdi.getMinutes())}${iki(simdi.getSeconds())}`;
    let hedef = path.join(klasor, `${ad}-${damga}.tr`);
    let sira = 1;
    while (fs.existsSync(hedef)) {
      hedef = path.join(klasor, `${ad}-${damga}-${sira}.tr`);
      sira += 1;
    }
    fs.writeFileSync(hedef, metin, 'utf8');

    const hepsi = [hedef, ...yedekler.map((y) => y.yol)];
    for (const eski of hepsi.slice(Math.max(1, enFazla))) {
      try {
        fs.rmSync(eski, { force: true });
      } catch {
        /* yok say */
      }
    }
    return hedef;
  } catch {
    return undefined;
  }
}

/** Windows dosya adlarında kullanılamayan karakterleri temizler. */
export function guvenliAd(ad: string): string {
  const temiz = String(ad ?? '')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .replace(/[. ]+$/g, '')
    .trim();
  return temiz === '' ? 'Uygulama' : temiz;
}

/** Verilen klasörün geçerli bir Electron dağıtımı olup olmadığını denetler. */
export function electronKlasoruGecerliMi(klasor: string | undefined): boolean {
  if (!klasor) return false;
  const exe = process.platform === 'win32' ? 'electron.exe' : 'electron';
  try {
    return fs.statSync(path.join(klasor, exe)).isFile() && fs.statSync(path.join(klasor, 'resources.pak')).isFile();
  } catch {
    return false;
  }
}

/**
 * İsteğe bağlı indirilen modüllerin kökü (`türkod yeni modül indir türküi`).
 * `TURKOD_MODUL_KLASORU` yalnızca testler/özel kurulumlar için kökü değiştirir.
 */
export function modulKoku(): string {
  const ozel = process.env.TURKOD_MODUL_KLASORU?.trim();
  if (ozel) return ozel;
  const taban =
    process.env.LOCALAPPDATA || process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache');
  return path.join(taban, 'turkui', 'modul');
}

/** İndirilen Electron sürümünün klasörü (ör. `...\modul\electron\28.3.3`). */
export function electronModulKlasoru(surum: string): string {
  const guvenli = String(surum ?? '').trim().replace(/[^0-9A-Za-z.\-]/g, '');
  return path.join(modulKoku(), 'electron', guvenli || 'bilinmeyen');
}

/** İndirilmiş (hazır) Electron sürüm klasörleri, en yenisi önce. */
function indirilmisElectronKlasorleri(): string[] {
  const kok = path.join(modulKoku(), 'electron');
  try {
    return fs
      .readdirSync(kok, { withFileTypes: true })
      .filter((girdi) => girdi.isDirectory() && !girdi.name.startsWith('.'))
      .map((girdi) => path.join(kok, girdi.name))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

/**
 * Electron çalışma zamanını arar.
 *
 * Sıra: açık ayar → `TURKOD_ELECTRON` ortam değişkeni → indirilen TürkUI modülü →
 * TURKOD Studio kurulumları → kullanıcı profilindeki yaygın kurulum yerleri.
 */
export function electronKlasoruBul(ayar?: string, ekAdaylar: string[] = []): string | undefined {
  const adaylar: string[] = [];
  const ekle = (yol: string | undefined): void => {
    if (yol && !adaylar.includes(yol)) adaylar.push(yol);
  };

  ekle(ayar?.trim() || undefined);
  ekle(process.env.TURKOD_ELECTRON);
  for (const aday of indirilmisElectronKlasorleri()) ekle(aday);
  for (const aday of ekAdaylar) ekle(aday);

  const ev = process.env.USERPROFILE || process.env.HOME || '';
  for (const kok of ['D:\\TurkodStudio', 'C:\\TurkodStudio', path.join(ev, 'TurkodStudio')]) {
    ekle(path.join(kok, 'node_modules', 'electron', 'dist'));
  }

  for (const aday of adaylar) {
    if (electronKlasoruGecerliMi(aday)) return aday;
  }
  return undefined;
}

/** Electron sürümünü `version` dosyasından okur (yoksa boş). */
function electronSurumu(klasor: string): string {
  try {
    return fs.readFileSync(path.join(klasor, 'version'), 'utf8').trim();
  } catch {
    return '';
  }
}

/**
 * Electron dağıtımını, uygulama klasörleriyle aynı sürücüde tutulan ortak bir
 * önbelleğe kopyalar. Böylece her uygulama için yüzlerce MB yeniden kopyalanmaz;
 * uygulama klasörleri bu önbellekten sabit bağ (hardlink) ile beslenir.
 */
export function calismaZamaniOnbellegi(electronKlasoru: string, onbellekKoku: string): string {
  const surum = electronSurumu(electronKlasoru) || 'bilinmeyen';
  const hedef = path.join(onbellekKoku, `electron-${surum.replace(/[^\w.-]/g, '_')}`);
  if (electronKlasoruGecerliMi(hedef)) return hedef;

  fs.mkdirSync(hedef, { recursive: true });
  for (const girdi of fs.readdirSync(electronKlasoru, { withFileTypes: true })) {
    if (girdi.name === 'resources') continue;
    const kaynakYol = path.join(electronKlasoru, girdi.name);
    const hedefYol = path.join(hedef, girdi.name);
    try {
      fs.rmSync(hedefYol, { recursive: true, force: true });
    } catch {
      /* yok say */
    }
    if (girdi.isDirectory()) klasoruKopyala(kaynakYol, hedefYol);
    else if (girdi.isFile()) baglaVeyaKopyala(kaynakYol, hedefYol);
  }
  return hedef;
}

/** Mümkünse sabit bağ (hardlink) kurar; olmazsa dosyayı kopyalar. */
function baglaVeyaKopyala(kaynak: string, hedef: string): void {
  fs.mkdirSync(path.dirname(hedef), { recursive: true });
  try {
    fs.linkSync(kaynak, hedef);
    return;
  } catch {
    /* farklı sürücü ya da izin yok: kopyala */
  }
  fs.copyFileSync(kaynak, hedef);
}

/** Bir klasörü (alt klasörleriyle) hedefe bağlar/kopyalar. */
function klasoruKopyala(kaynak: string, hedef: string, atla: (ad: string) => boolean = () => false): void {
  fs.mkdirSync(hedef, { recursive: true });
  for (const girdi of fs.readdirSync(kaynak, { withFileTypes: true })) {
    if (atla(girdi.name)) continue;
    const kaynakYol = path.join(kaynak, girdi.name);
    const hedefYol = path.join(hedef, girdi.name);
    if (girdi.isDirectory()) klasoruKopyala(kaynakYol, hedefYol, atla);
    else if (girdi.isFile()) baglaVeyaKopyala(kaynakYol, hedefYol);
  }
}

/**
 * Derlenmiş giriş dosyalarının `require` ile kullandığı yerel modülleri hedef
 * klasöre kopyalar.
 *
 * Bağımlılıklar derlenmiş JS'te açıkça yazıldığı için grafik takip edilir;
 * yeni bir yerleşik modül (ör. `Oyun`) elle listeye eklenmeden pakete girer.
 */
function bagimliModulleriKopyala(girisler: string[], hedefKlasor: string): void {
  const kok = path.dirname(girisler[0] ?? '');
  const gorulen = new Set<string>();

  const coz = (dosya: string, istek: string): string | undefined => {
    const temel = path.resolve(path.dirname(dosya), istek);
    for (const aday of [temel, `${temel}.js`, path.join(temel, 'index.js')]) {
      if (fs.existsSync(aday) && fs.statSync(aday).isFile()) return aday;
    }
    return undefined;
  };

  const gez = (dosya: string): void => {
    const tam = path.resolve(dosya);
    if (gorulen.has(tam)) return;
    gorulen.add(tam);
    const hedef = path.join(hedefKlasor, path.relative(kok, tam));
    fs.mkdirSync(path.dirname(hedef), { recursive: true });
    fs.copyFileSync(tam, hedef);
    let metin = '';
    try {
      metin = fs.readFileSync(tam, 'utf8');
    } catch {
      return;
    }
    for (const eslesme of metin.matchAll(/require\(\s*['"](\.[^'"]+)['"]\s*\)/g)) {
      const bagimli = coz(tam, eslesme[1]);
      if (bagimli) gez(bagimli);
    }
  };

  for (const giris of girisler) gez(giris);
}

function işaretOku(klasor: string): Isaret | undefined {
  try {
    const ham = JSON.parse(fs.readFileSync(path.join(klasor, ISARET_DOSYASI), 'utf8')) as Isaret;
    if (ham && ham.surum === 1) return ham;
  } catch {
    /* işaret yok */
  }
  return undefined;
}

/**
 * Uygulamayı paketler. Aynı klasör daha önce bu uzantı tarafından üretildiyse
 * yalnızca uygulama dosyaları tazelenir; çalışma zamanı (yüzlerce MB) yeniden
 * kopyalanmaz.
 */
export function paketle(secenekler: PaketSecenekleri): PaketSonucu {
  if (!electronKlasoruGecerliMi(secenekler.electronKlasoru)) {
    throw new Error(
      `Electron çalışma zamanı bulunamadı: ${secenekler.electronKlasoru}\n` +
        'TürkUI uygulamaları için Electron gerekir (TURKOD Studio kurulumundaki ' +
        'node_modules/electron/dist klasörü kullanılır).'
    );
  }

  const kaynakMetni =
    secenekler.kaynakMetni ?? fs.readFileSync(secenekler.kaynakYolu, 'utf8');
  const uygulamaAdi = guvenliAd(secenekler.uygulamaAdi);
  const klasor = path.resolve(secenekler.ciktiKlasoru);
  const eskiAd = path.basename(secenekler.kaynakYolu);
  const surum = electronSurumu(secenekler.electronKlasoru);

  const isaret = işaretOku(klasor);
  const exeAdi = `${uygulamaAdi}.exe`;
  const exeYolu = path.join(klasor, exeAdi);
  const tamKopyala =
    secenekler.tamKopyala === true ||
    !isaret ||
    isaret.electronSurumu !== surum ||
    isaret.uygulamaAdi !== uygulamaAdi ||
    !fs.existsSync(exeYolu);

  if (tamKopyala) {
    // Klasör doluysa ve bizim üretmediğimiz bir içerikse kullanıcı verisi ezilmesin.
    if (fs.existsSync(klasor)) {
      const icerik = fs.readdirSync(klasor);
      if (icerik.length > 0 && !isaret) {
        throw new Error(
          `Hedef klasör boş değil: ${klasor}\n` +
            'Var olan dosyaların üzerine yazmamak için boş bir klasör seçin.'
        );
      }
      if (isaret) fs.rmSync(klasor, { recursive: true, force: true });
    }
    fs.mkdirSync(klasor, { recursive: true });

    const electronExe = path.join(
      secenekler.electronKlasoru,
      process.platform === 'win32' ? 'electron.exe' : 'electron'
    );
    // Çalışma zamanı: her şey kopyalanır; `resources` altında yalnızca uygulamamız olur.
    for (const girdi of fs.readdirSync(secenekler.electronKlasoru, { withFileTypes: true })) {
      if (girdi.name === 'resources') continue;
      const kaynakYol = path.join(secenekler.electronKlasoru, girdi.name);
      const hedefYol = path.join(klasor, girdi.name === path.basename(electronExe) ? exeAdi : girdi.name);
      if (girdi.isDirectory()) klasoruKopyala(kaynakYol, hedefYol);
      else if (girdi.isFile()) baglaVeyaKopyala(kaynakYol, hedefYol);
    }
    if (!fs.existsSync(exeYolu)) baglaVeyaKopyala(electronExe, exeYolu);
  }

  const app = path.join(klasor, 'resources', 'app');
  fs.mkdirSync(app, { recursive: true });

  // Electron'un varsayılan uygulaması bizim uygulamamızı gölgelemesin.
  const varsayilan = path.join(klasor, 'resources', 'default_app.asar');
  try {
    fs.rmSync(varsayilan, { force: true });
  } catch {
    /* yok say */
  }

  // Boş `resources/app` klasöründe kalan eski dosyaları temizle.
  for (const girdi of fs.readdirSync(app)) {
    fs.rmSync(path.join(app, girdi), { recursive: true, force: true });
  }

  const calistirma = secenekler.calistirmaKlasoru;
  for (const dosya of ['main.js', 'preload.js', 'konsol.html', 'sor.html']) {
    fs.copyFileSync(path.join(calistirma, dosya), path.join(app, dosya));
  }

  const out = path.join(app, 'out');
  fs.mkdirSync(out, { recursive: true });
  // Yorumlayıcı (`calistir.js`) ve TürkUI modülü, yerleşik modülleri
  // (`Oyun`, `Zaman`, `veri/...`) `require` ile kullanır; pakete kendileriyle
  // birlikte tüm yerel bağımlılıkları kopyalanır.
  bagimliModulleriKopyala([secenekler.calistirJs, secenekler.turkuiJs], out);

  // `calistir.js` kendi `veri/` modüllerini de kullanır (ör. `stilDurumlari`);
  // yorumlayıcının yanındaki veri klasörü pakete birlikte kopyalanır.
  const yorumlayiciVeri = path.join(path.dirname(secenekler.calistirJs), 'veri');
  if (fs.existsSync(yorumlayiciVeri)) {
    klasoruKopyala(yorumlayiciVeri, path.join(out, 'veri'));
  }

  const media = path.join(app, 'media');
  fs.mkdirSync(media, { recursive: true });
  const nonce = crypto.randomBytes(16).toString('base64');
  const html = fs
    .readFileSync(secenekler.medyaDosyasi, 'utf8')
    .replace(/__TURKUI_NONCE__/g, nonce);
  fs.writeFileSync(path.join(media, 'turkui-window.html'), html, 'utf8');

  // Program ve (dağıtımda) yanındaki dosyalar.
  const kaynakKlasoru = path.join(app, 'kaynak');
  fs.mkdirSync(kaynakKlasoru, { recursive: true });
  const programYolu = path.join(kaynakKlasoru, eskiAd);
  fs.writeFileSync(programYolu, kaynakMetni, 'utf8');

  if (secenekler.kaynakKopyala) {
    const kaynakKlasor = path.dirname(path.resolve(secenekler.kaynakYolu));
    const cikti = path.resolve(klasor);
    klasoruKopyala(kaynakKlasor, kaynakKlasoru, (ad) => {
      if (ad === 'node_modules' || ad === '.git' || ad.startsWith('.turkod')) return true;
      if (path.resolve(kaynakKlasor, ad) === cikti) return true;
      return ad === eskiAd;
    });
  }

  // Uygulama ayarları: kaynak dosya ve pencere simgesi.
  fs.writeFileSync(
    path.join(app, 'uygulama.json'),
    `${JSON.stringify({ kaynak: path.relative(app, programYolu).replace(/\\/g, '/') }, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(app, 'package.json'),
    `${JSON.stringify(
      {
        name: 'turkod-uygulama',
        productName: uygulamaAdi,
        version: '1.0.0',
        description: `${uygulamaAdi} — TürkUI uygulaması`,
        main: 'main.js',
        private: true,
      },
      null,
      2
    )}\n`,
    'utf8'
  );

  let ikonYolu: string | undefined;
  try {
    ikonYolu = path.join(app, 'ikon.ico');
    simgeYaz(ikonYolu);
  } catch {
    ikonYolu = undefined;
  }

  const yeniIsaret: Isaret = {
    surum: 1,
    uygulamaAdi,
    electronSurumu: surum,
    olusturulma: new Date().toISOString(),
  };
  fs.writeFileSync(
    path.join(klasor, ISARET_DOSYASI),
    `${JSON.stringify(yeniIsaret, null, 2)}\n`,
    'utf8'
  );

  return { exeYolu, klasor, kaynakYolu: programYolu, ikonYolu, kopyalandi: tamKopyala };
}

/* ---------------- simge ---------------- */

/**
 * 256×256, 32 bit BMP tabanlı bir `.ico` üretir: mor zemin üzerinde beyaz "T".
 * Electron penceresi ve görev çubuğu bu simgeyi kullanır.
 */
export function simgeYaz(dosya: string): void {
  const boyut = 256;
  const piksel = Buffer.alloc(boyut * boyut * 4);
  const mor = { r: 124, g: 58, b: 237 };

  const yuvarlakKose = (x: number, y: number): boolean => {
    const yaricap = 48;
    const sol = yaricap;
    const sag = boyut - 1 - yaricap;
    const ust = yaricap;
    const alt = boyut - 1 - yaricap;
    const dx = x < sol ? sol - x : x > sag ? x - sag : 0;
    const dy = y < ust ? ust - y : y > alt ? y - alt : 0;
    return dx * dx + dy * dy <= yaricap * yaricap;
  };

  // "T" harfinin kolları (kutu koordinatları).
  const dikeySol = 104;
  const dikeySag = 152;
  const yatayUst = 62;
  const yatayAlt = 110;
  const govdeAlt = 204;

  for (let y = 0; y < boyut; y++) {
    for (let x = 0; x < boyut; x++) {
      if (!yuvarlakKose(x, y)) continue;
      const harfteMi =
        (x >= 48 && x <= 207 && y >= yatayUst && y <= yatayAlt) ||
        (x >= dikeySol && x <= dikeySag && y >= yatayAlt && y <= govdeAlt);
      // BMP satırları aşağıdan yukarı yazılır.
      const indeks = ((boyut - 1 - y) * boyut + x) * 4;
      if (harfteMi) {
        piksel[indeks] = 255;
        piksel[indeks + 1] = 255;
        piksel[indeks + 2] = 255;
        piksel[indeks + 3] = 255;
      } else {
        // Üstten alta hafif açılan bir degrade.
        const oran = 0.82 + (y / boyut) * 0.18;
        piksel[indeks] = Math.min(255, Math.round(mor.b * oran));
        piksel[indeks + 1] = Math.min(255, Math.round(mor.g * oran));
        piksel[indeks + 2] = Math.min(255, Math.round(mor.r * oran));
        piksel[indeks + 3] = 255;
      }
    }
  }

  const maskeSatir = Math.ceil(boyut / 32) * 4;
  const maske = Buffer.alloc(maskeSatir * boyut);
  const baslik = Buffer.alloc(40);
  baslik.writeUInt32LE(40, 0);
  baslik.writeInt32LE(boyut, 4);
  baslik.writeInt32LE(boyut * 2, 8); // XOR + AND yüksekliği
  baslik.writeUInt16LE(1, 12);
  baslik.writeUInt16LE(32, 14);
  baslik.writeUInt32LE(piksel.length, 20);

  const yonlendirici = Buffer.alloc(6);
  yonlendirici.writeUInt16LE(1, 2); // 1 simge
  yonlendirici.writeUInt16LE(1, 4);

  const girdi = Buffer.alloc(16);
  girdi.writeUInt8(0, 0); // 256 → 0
  girdi.writeUInt8(0, 1);
  girdi.writeUInt16LE(1, 4);
  girdi.writeUInt16LE(32, 6);
  girdi.writeUInt32LE(baslik.length + piksel.length + maske.length, 8);
  girdi.writeUInt32LE(22, 12);

  fs.writeFileSync(dosya, Buffer.concat([yonlendirici, girdi, baslik, piksel, maske]));
}
