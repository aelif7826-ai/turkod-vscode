/**
 * Türkod programını gerçek bir terminalde çalıştıran yardımcı süreç.
 *
 * Uzantı bu dosyayı VS Code'un kendi Node çalıştırıcısıyla başlatır; böylece program çıktısı
 * doğrudan terminale yazılır ve program bitince kabuk istemine (ör. `PS D:\proje>`) dönülür.
 *
 * Kullanım: terminalCalistirici.js <kaynak dosya> <klasör> <hata dosyası> <bitti dosyası>
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';
import { TurkodHatasi, TurkodYorumlayici, modulDosyasiBul } from './calistir';

const [, , kaynakDosyasi, klasorArg, hataDosyasi, bittiDosyasi] = process.argv;
const klasor = klasorArg || process.cwd();

const satirlar: string[] = [];
let bekleyen: ((satir: string) => void) | undefined;

const okuyucu = readline.createInterface({ input: process.stdin, terminal: false });
okuyucu.on('line', (satir) => {
  if (bekleyen) {
    const coz = bekleyen;
    bekleyen = undefined;
    coz(satir);
    return;
  }
  satirlar.push(satir);
});
okuyucu.on('close', () => {
  const coz = bekleyen;
  bekleyen = undefined;
  coz?.('');
});

function oku(soru: string): Promise<string> {
  if (soru) process.stdout.write(soru);
  const hazir = satirlar.shift();
  if (hazir !== undefined) return Promise.resolve(hazir);
  return new Promise<string>((coz) => {
    bekleyen = coz;
  });
}

function yaz(metin: string): void {
  process.stdout.write(metin);
}

function modulCoz(ad: string, kaynakKlasoru?: string): string | undefined {
  return modulDosyasiBul(ad, kaynakKlasoru || klasor);
}

async function main(): Promise<void> {
  if (!kaynakDosyasi || !fs.existsSync(kaynakDosyasi)) {
    process.stderr.write('Türkod: çalıştırılacak kaynak dosya bulunamadı.\n');
    process.exit(1);
  }

  const kaynak = fs.readFileSync(kaynakDosyasi, 'utf8');
  const yorumlayici = new TurkodYorumlayici(kaynak, {
    yaz,
    oku,
    klasor,
    // Uzantı programı geçici dosyadan çalıştırır; importlar gerçek kaynak klasöründen çözülmeli.
    modulKlasoru: klasor,
    dosya: kaynakDosyasi,
    gercekGecikme: true,
    modulCoz,
  });

  try {
    await yorumlayici.calistir();
  } catch (e) {
    const hata = e instanceof TurkodHatasi ? e : new TurkodHatasi(e instanceof Error ? e.message : String(e));
    const yer = hata.satir ? ` (satır ${hata.satir})` : '';
    process.stderr.write(`\u001b[31mHata${yer}: ${hata.message}\u001b[0m\n`);
    if (hataDosyasi) {
      try {
        fs.writeFileSync(hataDosyasi, JSON.stringify({ mesaj: hata.message, satir: hata.satir ?? null }), 'utf8');
      } catch {
        /* yok say */
      }
    }
    process.exitCode = 1;
  } finally {
    okuyucu.close();
    if (bittiDosyasi) {
      try {
        fs.writeFileSync(bittiDosyasi, '', 'utf8');
      } catch {
        /* yok say */
      }
    }
    // stdin açık kaldığı sürece Node süreci ayakta kalır; kabuk istemine dönebilmek için çık.
    process.exit(process.exitCode ?? 0);
  }
}

void main();
