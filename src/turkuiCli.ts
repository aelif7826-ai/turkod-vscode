/**
 * `türküi` komut satırı aracı.
 *
 * Flutter'daki `flutter create` / `flutter run` akışına benzer:
 *
 *   türküi yeni <ad>          → uygulama.json, src/, assets/ içeren proje oluşturur
 *   türküi çalıştır [giriş]   → projeyi çalıştırır (TürkUI varsa gerçek pencere)
 *   türküi yardım             → kullanım bilgisi
 *
 * Bu dosya `vscode` kullanmaz; `bin/turkui.js` üzerinden düz Node ile çalışır.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { modulDosyasiBul, projeKokuBul, turkuiModulAdiMi } from './calistir';
import { electronKlasoruBul, electronOrtami, guvenliAd, paketle } from './uygulamaPaketleyici';

/** `uygulama.json` içeriği (Türkçe alan adları). */
export interface UygulamaAyarlari {
  ad?: string;
  sürüm?: string;
  açıklama?: string;
  /** Giriş dosyası; proje köküne göre yazılır. */
  giriş?: string;
  /** Eski/paketlenmiş uygulamalarla uyumluluk için. */
  kaynak?: string;
  /** Projeye dahil edilen varlık klasörleri (görsel, ses...). */
  varlıklar?: string[];
}

/** Uzantının kurulu olduğu klasör (out/ bir üst klasör). */
function uzantiKoku(): string {
  return path.resolve(__dirname, '..');
}

function yaz(metin = ''): void {
  process.stdout.write(`${metin}\n`);
}

function hataYaz(metin: string): void {
  process.stderr.write(`${metin}\n`);
}

/* ---------------- proje oluşturma ---------------- */

const PROJE_ADI_RE = /^[A-Za-z0-9ğüşıöçĞÜŞİÖÇ][A-Za-z0-9ğüşıöçĞÜŞİÖÇ._-]*$/;
const WINDOWS_AYRILMIS_ADLAR = new Set([
  'con',
  'prn',
  'aux',
  'nul',
  'com1',
  'com2',
  'com3',
  'com4',
  'com5',
  'com6',
  'com7',
  'com8',
  'com9',
  'lpt1',
  'lpt2',
  'lpt3',
  'lpt4',
  'lpt5',
  'lpt6',
  'lpt7',
  'lpt8',
  'lpt9',
]);

/** Proje adı klasör adı olarak kullanılabilir mi? */
export function projeAdiGecerliMi(ad: string): boolean {
  const temiz = String(ad ?? '').trim();
  if (!PROJE_ADI_RE.test(temiz)) return false;
  if (temiz === '.' || temiz === '..') return false;
  return !WINDOWS_AYRILMIS_ADLAR.has(temiz.toLocaleLowerCase('tr'));
}

function uygulamaJsonu(ad: string): string {
  const ayarlar: UygulamaAyarlari = {
    ad,
    sürüm: '0.1.0',
    açıklama: `${ad} — Türküi uygulaması`,
    giriş: 'src/ana.tr',
    varlıklar: ['assets'],
  };
  return `${JSON.stringify(ayarlar, null, 2)}\n`;
}

function anaDosya(ad: string): string {
  return `# ${ad} — Türküi uygulaması
#
# Giriş dosyası: uygulama.json → "giriş": "src/ana.tr"
# Çalıştır:      türküi çalıştır

içe_aktar TürkUI

# Yardımcı dosya (src/araclar/yardimci.tr) ana dosyaya böyle bağlanır.
# selamla ve sayacMetni fonksiyonları artık bu dosyada kullanılabilir.
içe_aktar araclar/yardimci

değişken uygulama := TürkUI.pencere("${ad}")
değişken baslik := uygulama.metin("Merhaba, ${ad}!")
değişken sayac := uygulama.metin(sayacMetni(0))
değişken dugme := uygulama.buton("Tıkla")

değişken tiklama := 0

uygulama.göster()

dugme.tıklandığında
    tiklama := tiklama + 1
    sayac.içerik := sayacMetni(tiklama)
    eğer tiklama >= 5 ise
        baslik.içerik := selamla("${ad}")
    son
son
`;
}

function yardimciDosya(): string {
  return `# Yardımcı dosya — başka bir dosyadan şöyle bağlanır:
#     içe_aktar araclar/yardimci
# Bağlandıktan sonra buradaki fonksiyonlar ana dosyada doğrudan kullanılır.

fonksiyon selamla(ad)
    geri_döndür "Merhaba, " + ad + "!"
son

fonksiyon sayacMetni(sayi)
    geri_döndür "Tıklama sayısı: " + sayi
son
`;
}

function projeReadme(ad: string): string {
  return `# ${ad}

Türküi ile yazılmış bir masaüstü uygulaması.

## Çalıştırma

\`\`\`powershell
türküi çalıştır
\`\`\`

TürkUI pencereleri için Electron gerekir. Electron bulunamazsa \`TURKOD_ELECTRON\`
ortam değişkenine Electron klasörünü yazın.

## Klasör düzeni

| Yol | Açıklama |
| --- | --- |
| \`uygulama.json\` | Proje ayarları: ad, sürüm, giriş dosyası, varlıklar |
| \`src/ana.tr\` | Giriş dosyası (ilk çalışan dosya) |
| \`src/araclar/yardimci.tr\` | Ana dosyaya bağlanan ikinci dosya |
| \`assets/\` | Görsel, ses ve diğer varlıklar |

## İki dosyayı bağlama

Bir dosyadaki fonksiyon ve değişkenleri başka bir dosyada kullanmak için
\`içe_aktar\` yazılır:

\`\`\`tr
# src/ana.tr
içe_aktar araclar/yardimci

yazdır(selamla("Metehan"))
\`\`\`

Yol yazımı serbesttir; hepsi aynı dosyayı bulur:

\`\`\`tr
içe_aktar araclar/yardimci
içe_aktar "araclar/yardimci.tr"
içe_aktar ./araclar/yardimci
içe_aktar ../ortak/araclar
\`\`\`

Yol verilmeden yalnızca ad yazılırsa (\`içe_aktar yardimci\`) proje içindeki alt
klasörler de taranır.
`;
}

const GITIGNORE = `.turkui/
node_modules/
dist/
*.exe
`;

const VARLIK_README = `# assets

Görseller, sesler ve diğer dosyalar buraya konur. Proje köküne göre göreli
yolla kullanılır:

\`\`\`tr
değişken simge := uygulama.görsel("assets/simge.png")
\`\`\`

Yeni bir varlık klasörü eklerseniz \`uygulama.json\` içindeki \`varlıklar\`
listesine de yazın.
`;

/** Projede oluşturulacak dosyalar: göreli yol → içerik. */
function projeDosyalari(ad: string): Record<string, string> {
  return {
    'uygulama.json': uygulamaJsonu(ad),
    'README.md': projeReadme(ad),
    '.gitignore': GITIGNORE,
    'src/ana.tr': anaDosya(ad),
    'src/araclar/yardimci.tr': yardimciDosya(),
    'assets/README.md': VARLIK_README,
  };
}

export interface YeniProjeSecenekleri {
  /** Projenin oluşturulacağı **üst** klasör; proje `<üst>/<ad>` olarak açılır. */
  hedef?: string;
}

export interface YeniProjeSonucu {
  klasor: string;
  dosyalar: string[];
}

/**
 * Flutter'daki `create` gibi yeni bir Türküi projesi oluşturur.
 * Hedef klasör doluysa hiçbir dosya yazılmadan hata verir.
 */
export function yeniProje(ad: string, secenekler: YeniProjeSecenekleri = {}): YeniProjeSonucu {
  const temizAd = String(ad ?? '').trim();
  if (!projeAdiGecerliMi(temizAd)) {
    throw new Error(
      `Geçersiz proje adı: "${temizAd}". Harf, rakam, "_", "-" ve "." kullanın; ` +
        'boşluk ve klasör ayırıcıları kullanılamaz.'
    );
  }

  const ustKlasor = path.resolve(secenekler.hedef ?? process.cwd());
  const klasor = path.join(ustKlasor, temizAd);
  if (fs.existsSync(klasor)) {
    const icerik = fs.readdirSync(klasor);
    if (icerik.length > 0) {
      throw new Error(
        `Hedef klasör boş değil: ${klasor}\n` +
          'Var olan dosyaların üzerine yazmamak için başka bir ad seçin.'
      );
    }
  }

  const dosyalar = projeDosyalari(temizAd);
  for (const [goreli, icerik] of Object.entries(dosyalar)) {
    const hedef = path.join(klasor, goreli);
    fs.mkdirSync(path.dirname(hedef), { recursive: true });
    fs.writeFileSync(hedef, icerik, 'utf8');
  }

  return { klasor, dosyalar: Object.keys(dosyalar) };
}

/* ---------------- proje çalıştırma ---------------- */

function ayarlariOku(klasor: string): UygulamaAyarlari {
  try {
    const ham = fs.readFileSync(path.join(klasor, 'uygulama.json'), 'utf8');
    const ayarlar = JSON.parse(ham) as UygulamaAyarlari;
    return ayarlar && typeof ayarlar === 'object' ? ayarlar : {};
  } catch {
    return {};
  }
}

function dosyaMi(yol: string): boolean {
  try {
    return fs.statSync(yol).isFile();
  } catch {
    return false;
  }
}

/** Giriş dosyasını (ve bağlanan dosyalarını) tarayarak `içe_aktar TürkUI` arar. */
function turkuiKullaniyorMu(dosya: string, gorulen = new Set<string>()): boolean {
  const anahtar = dosya.toLocaleLowerCase('tr');
  if (gorulen.has(anahtar)) return false;
  gorulen.add(anahtar);

  let kaynak: string;
  try {
    kaynak = fs.readFileSync(dosya, 'utf8');
  } catch {
    return false;
  }

  const klasor = path.dirname(dosya);
  const iceAktarilanlar: string[] = [];
  for (const ham of kaynak.split(/\r?\n/)) {
    const satir = ham.trim();
    const ice = /^içe_aktar\s+(.+)$/.exec(satir);
    if (!ice) continue;
    const ifade = ice[1].replace(/^["']|["']$/g, '').trim();
    if (turkuiModulAdiMi(ifade)) return true;
    iceAktarilanlar.push(ifade);
  }

  for (const ifade of iceAktarilanlar) {
    const yol = modulDosyasiBul(ifade, klasor);
    if (yol && turkuiKullaniyorMu(yol, gorulen)) return true;
  }
  return false;
}

function calistirmaOnbellegi(): string {
  const taban =
    process.env.LOCALAPPDATA || process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache');
  return path.join(taban, 'turkui', 'calistir');
}

/** Bir süreci çalıştırır ve çıkış kodunu döndürür. */
function surecCalistir(
  komut: string,
  argumanlar: string[],
  secenekler: { cwd: string; env?: NodeJS.ProcessEnv }
): Promise<number> {
  return new Promise<number>((coz, reddet) => {
    const surec = spawn(komut, argumanlar, { ...secenekler, stdio: 'inherit', windowsHide: false });
    surec.on('error', (e) => reddet(e));
    surec.on('exit', (kod) => coz(kod ?? 1));
  });
}

/** Projeyi TürkUI penceresiyle çalıştırır (Electron gerekir). */
async function uygulamaOlarakCalistir(
  projeKoku: string,
  giris: string,
  uygulamaAdi: string
): Promise<number> {
  const electron = electronKlasoruBul();
  if (!electron) {
    throw new Error(
      'TürkUI penceresi için Electron bulunamadı.\n' +
        '  • İndirmek için: türkod yeni modül indir türküi\n' +
        '  • TURKOD Studio kuruluysa otomatik bulunur.\n' +
        '  • Farklı bir yerdeyse TURKOD_ELECTRON ortam değişkenine Electron klasörünü yazın.\n' +
        '  • Penceresiz programlar için giriş dosyasında `içe_aktar TürkUI` kullanmayın.'
    );
  }

  const uzanti = uzantiKoku();
  const ad = guvenliAd(uygulamaAdi);
  const kimlik = crypto.createHash('sha1').update(projeKoku).digest('hex').slice(0, 8);
  const hedef = path.join(calistirmaOnbellegi(), `${ad}-${kimlik}`);
  fs.mkdirSync(hedef, { recursive: true });

  const sonuc = paketle({
    kaynakYolu: giris,
    ciktiKlasoru: hedef,
    uygulamaAdi: ad,
    electronKlasoru: electron,
    calistirmaKlasoru: path.join(uzanti, 'runtime', 'uygulama'),
    medyaDosyasi: path.join(uzanti, 'media', 'turkui-window.html'),
    calistirJs: path.join(uzanti, 'out', 'calistir.js'),
    turkuiJs: path.join(uzanti, 'out', 'turkui.js'),
    kaynakKopyala: false,
  });

  hataYaz(`Uygulama hazır: ${sonuc.exeYolu}`);
  return surecCalistir(sonuc.exeYolu, ['--no-sandbox'], {
    cwd: projeKoku,
    env: {
      ...electronOrtami(),
      TURKOD_KAYNAK: sonuc.kaynakYolu,
      TURKOD_GIRIS: giris,
      TURKOD_KLASOR: projeKoku,
    },
  });
}

export interface CalistirSecenekleri {
  /** Çalışma klasörü; varsayılan `process.cwd()`. */
  klasor?: string;
  /** Çalıştırılacak dosya (proje köküne göre veya mutlak). */
  giris?: string;
}

/**
 * Projeyi çalıştırır. Konsol programları `türküi` sürecinde, TürkUI programları
 * gerçek bir masaüstü uygulaması (.exe) olarak başlatılır.
 */
export async function projeCalistir(secenekler: CalistirSecenekleri = {}): Promise<number> {
  const baslangic = path.resolve(secenekler.klasor ?? process.cwd());
  const projeKoku = projeKokuBul(baslangic) ?? baslangic;
  const ayarlar = ayarlariOku(projeKoku);

  const istenen = secenekler.giris ?? ayarlar.giriş ?? ayarlar.kaynak ?? 'src/ana.tr';
  const giris = path.isAbsolute(istenen) ? istenen : path.resolve(projeKoku, istenen);
  if (!dosyaMi(giris)) {
    throw new Error(
      `Giriş dosyası bulunamadı: ${giris}\n` +
        'uygulama.json içindeki "giriş" alanını veya çalıştırılacak dosyayı denetleyin.'
    );
  }

  const uygulamaAdi = String(ayarlar.ad ?? path.basename(projeKoku));
  if (turkuiKullaniyorMu(giris)) {
    return uygulamaOlarakCalistir(projeKoku, giris, uygulamaAdi);
  }

  // Penceresiz program: terminal yorumlayıcısı doğrudan çalıştırılır.
  const calistirici = path.join(__dirname, 'terminalCalistirici.js');
  return surecCalistir(process.execPath, [calistirici, giris, projeKoku], { cwd: projeKoku });
}

/* ---------------- komut satırı ---------------- */

const YARDIM = `türküi — Türküi uygulamaları için komut satırı aracı

Kullanım:
  türküi yeni <ad>              Yeni proje oluşturur
  türküi çalıştır [dosya]       Projeyi çalıştırır (uygulama.json → giriş)
  türküi yardım                 Bu bilgiyi gösterir
  türküi sürüm                  Sürümü gösterir

Seçenekler:
  --klasor, -k <yol>            Projenin oluşturulacağı üst klasör
  --giris <dosya>               Çalıştırılacak giriş dosyası

Örnekler:
  türküi yeni merhaba
  cd merhaba
  türküi çalıştır
`;

function surum(): string {
  try {
    const paket = JSON.parse(fs.readFileSync(path.join(uzantiKoku(), 'package.json'), 'utf8')) as {
      version?: string;
    };
    return paket.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

/** `--klasor değer` / `-k değer` seçeneğini ayırır. */
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

/** Komut satırını çalıştırır ve çıkış kodunu döndürür. */
export async function main(argumanlar: string[]): Promise<number> {
  const [komut, ...gerisi] = argumanlar;

  if (!komut || ['yardım', 'yardim', 'help', '-h', '--help'].includes(komut)) {
    yaz(YARDIM);
    return 0;
  }
  if (['sürüm', 'surum', 'version', '-v', '--version'].includes(komut)) {
    yaz(`türküi ${surum()}`);
    return 0;
  }

  if (['yeni', 'create', 'oluştur', 'olustur'].includes(komut)) {
    const { kalan, deger } = secenekAyir(gerisi, ['--klasor', '-k']);
    const ad = kalan[0];
    if (!ad) {
      hataYaz('Kullanım: türküi yeni <ad> [--klasor <yol>]');
      return 1;
    }
    const sonuc = yeniProje(ad, { hedef: deger });
    yaz(`✔ Proje oluşturuldu: ${sonuc.klasor}`);
    for (const dosya of sonuc.dosyalar) yaz(`    ${dosya}`);
    yaz();
    yaz('Sonraki adım:');
    yaz(`    cd ${path.relative(process.cwd(), sonuc.klasor) || '.'}`);
    yaz('    türküi çalıştır');
    return 0;
  }

  if (['çalıştır', 'calistir', 'run'].includes(komut)) {
    const { kalan, deger } = secenekAyir(gerisi, ['--giris']);
    return projeCalistir({ giris: deger ?? kalan[0] });
  }

  hataYaz(`Bilinmeyen komut: ${komut}`);
  yaz(YARDIM);
  return 1;
}

/** `bin/turkui.js` bu işlevi çağırır. */
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
