const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  ISARET_DOSYASI,
  calismaZamaniOnbellegi,
  electronKlasoruBul,
  electronKlasoruGecerliMi,
  electronOrtami,
  guvenliAd,
  kaynakYedekle,
  paketle,
  simgeYaz,
} = require('../out/uygulamaPaketleyici');
const { SFX_KUYRUK_BOYU, sfxBilgisi, tekDosyaOlustur } = require('../out/uygulamaSfx');

const kok = path.resolve(__dirname, '..');
const baslatici = path.join(kok, 'runtime', 'baslatici', 'baslatici.exe');

/* ---------------- yardımcılar (Electron gerekmez) ---------------- */

assert.strictEqual(guvenliAd('Sayaç: v1?'), 'Sayaç v1', 'dosya adı temizlenmeli');
assert.strictEqual(guvenliAd('   '), 'Uygulama', 'boş ad varsayılana dönmeli');
assert.strictEqual(guvenliAd('ad.'), 'ad', 'sondaki nokta atılmalı');

// VS Code'un uzantı sürecinden gelen ELECTRON_RUN_AS_NODE alt sürece geçmemeli
// (geçerse paketlenmiş .exe Node gibi davranıp 9 koduyla kapanır).
const kirlıOrtam = {
  PATH: 'C:\\Windows',
  ELECTRON_RUN_AS_NODE: '1',
  electron_run_as_node: '1',
  TURKOD_KAYNAK: 'a.tr',
};
const temizOrtam = electronOrtami(kirlıOrtam);
assert.strictEqual(temizOrtam.ELECTRON_RUN_AS_NODE, undefined, 'ELECTRON_RUN_AS_NODE temizlenmeli');
assert.strictEqual(temizOrtam.electron_run_as_node, undefined, 'küçük harfli varyant da temizlenmeli');
assert.strictEqual(temizOrtam.PATH, 'C:\\Windows', 'diğer değişkenler korunmalı');
assert.strictEqual(temizOrtam.TURKOD_KAYNAK, 'a.tr', 'Türkod değişkenleri korunmalı');
assert.strictEqual(kirlıOrtam.ELECTRON_RUN_AS_NODE, '1', 'girdi ortamı değiştirilmemeli');

/* ---------------- kaynak yedekleme ---------------- */

const yedekKlasoru = path.join(os.tmpdir(), `turkod-yedek-${Date.now()}`);
const yedekZamani = new Date(2026, 0, 2, 3, 4, 5);
const ilkYedek = kaynakYedekle(yedekKlasoru, 'uygulama', 'yazdır("bir")\n', 3, yedekZamani);
assert.ok(ilkYedek, 'ilk yedek yazılmalı');
assert.ok(fs.readFileSync(ilkYedek, 'utf8').includes('yazdır'), 'yedek içeriği korunmalı');

// Aynı içerik tekrar yedeklenmemeli.
assert.strictEqual(
  kaynakYedekle(yedekKlasoru, 'uygulama', 'yazdır("bir")\n', 3, new Date(2026, 0, 2, 3, 5, 0)),
  undefined,
  'aynı içerik yeniden yedeklenmemeli'
);

// Farklı içerikler birikir, en fazla 3 yedek kalır.
for (let i = 0; i < 5; i++) {
  kaynakYedekle(yedekKlasoru, 'uygulama', `yazdır("${i}")\n`, 3, new Date(2026, 0, 2, 4, i, 0));
}
const kalanYedekler = fs.readdirSync(yedekKlasoru).filter((d) => d.endsWith('.tr'));
assert.strictEqual(kalanYedekler.length, 3, 'en fazla 3 yedek tutulmalı');
assert.ok(
  fs.readdirSync(yedekKlasoru).some((d) => fs.readFileSync(path.join(yedekKlasoru, d), 'utf8') === 'yazdır("4")\n'),
  'son içerik yedekler arasında olmalı'
);
assert.strictEqual(kaynakYedekle(yedekKlasoru, 'uygulama', '', 3), undefined, 'boş içerik yedeklenmemeli');
fs.rmSync(yedekKlasoru, { recursive: true, force: true });

const geciciIkon = path.join(os.tmpdir(), `turkod-ikon-${Date.now()}.ico`);
simgeYaz(geciciIkon);
const iko = fs.readFileSync(geciciIkon);
assert.strictEqual(iko.readUInt16LE(0), 0, 'ICO ayrılmış alan 0 olmalı');
assert.strictEqual(iko.readUInt16LE(2), 1, 'ICO tipi 1 (simge) olmalı');
assert.strictEqual(iko.readUInt16LE(4), 1, 'tek simge içermeli');
assert.strictEqual(iko.readUInt8(6), 0, 'genişlik 256 için 0 yazılmalı');
assert.strictEqual(iko.readUInt16LE(10), 1, 'renk düzlemi 1 olmalı');
assert.strictEqual(iko.readUInt16LE(12), 32, '32 bit olmalı');
assert.strictEqual(iko.readUInt32LE(22 + 4), 256, 'BITMAPINFOHEADER genişliği');
assert.strictEqual(iko.readUInt32LE(22 + 8), 512, 'yükseklik XOR+AND olmalı');
assert.ok(iko.length > 260000, 'piksel verisi yazılmalı');
fs.rmSync(geciciIkon, { force: true });

/* ---------------- tek dosya başlatıcısı ---------------- */

// Tek dosya paketleme, depoda derlenmiş küçük bir başlatıcıya dayanır.
assert.ok(fs.existsSync(baslatici), `tek dosya başlatıcısı eksik: ${baslatici}`);
assert.ok(fs.statSync(baslatici).size > 1024, 'başlatıcı boş olmamalı');
assert.strictEqual(sfxBilgisi(baslatici), undefined, 'başlatıcı tek dosya paketi sayılmamalı');

/* ---------------- paketleme (Electron varsa) ---------------- */

const electron = electronKlasoruBul();
if (!electron) {
  console.log('uygulama paketleyici testleri atlandı (Electron çalışma zamanı yok)');
  process.exit(0);
}
assert.ok(electronKlasoruGecerliMi(electron), 'Electron klasörü geçerli olmalı');

const gecici = fs.mkdtempSync(path.join(os.tmpdir(), 'turkod-paket-'));
const kaynakYolu = path.join(gecici, 'deneme.tr');
fs.writeFileSync(kaynakYolu, 'içe_aktar TürkUI\nyazdır("merhaba")\n', 'utf8');

const secenekler = {
  kaynakYolu,
  ciktiKlasoru: path.join(gecici, 'Deneme'),
  uygulamaAdi: 'Deneme',
  electronKlasoru: electron,
  calistirmaKlasoru: path.join(kok, 'runtime', 'uygulama'),
  medyaDosyasi: path.join(kok, 'media', 'turkui-window.html'),
  calistirJs: path.join(kok, 'out', 'calistir.js'),
  turkuiJs: path.join(kok, 'out', 'turkui.js'),
  kaynakKopyala: false,
};

(async () => {
try {
  const sonuc = paketle(secenekler);
  assert.ok(fs.existsSync(sonuc.exeYolu), 'uygulama .exe üretilmeli');
  assert.strictEqual(path.basename(sonuc.exeYolu), 'Deneme.exe', '.exe uygulama adını almalı');
  assert.ok(sonuc.kopyalandi, 'ilk paketleme çalışma zamanını kopyalamalı');
  assert.ok(fs.existsSync(path.join(sonuc.klasor, ISARET_DOSYASI)), 'işaret dosyası yazılmalı');

  for (const dosya of [
    'resources/app/main.js',
    'resources/app/preload.js',
    'resources/app/konsol.html',
    'resources/app/sor.html',
    'resources/app/out/calistir.js',
    'resources/app/out/turkui.js',
    'resources/app/out/zaman.js',
    'resources/app/out/oyun.js',
    'resources/app/out/oyunIndirici.js',
    'resources/app/out/veri/stilDurumlari.js',
    'resources/app/media/turkui-window.html',
    'resources/app/kaynak/deneme.tr',
    'resources/app/ikon.ico',
    'resources/app/uygulama.json',
    'resources/app/package.json',
    'resources.pak',
    'locales/tr.pak',
  ]) {
    assert.ok(fs.existsSync(path.join(sonuc.klasor, dosya)), `eksik dosya: ${dosya}`);
  }
  assert.ok(
    !fs.existsSync(path.join(sonuc.klasor, 'resources', 'default_app.asar')),
    'varsayılan Electron uygulaması kaldırılmalı'
  );

  const html = fs.readFileSync(path.join(sonuc.klasor, 'resources/app/media/turkui-window.html'), 'utf8');
  assert.ok(!html.includes('__TURKUI_NONCE__'), 'nonce yer tutucusu değiştirilmeli');

  const ayar = JSON.parse(fs.readFileSync(path.join(sonuc.klasor, 'resources/app/uygulama.json'), 'utf8'));
  assert.strictEqual(ayar.kaynak, 'kaynak/deneme.tr', 'uygulama programı göstermeli');

  const manifest = JSON.parse(fs.readFileSync(path.join(sonuc.klasor, 'resources/app/package.json'), 'utf8'));
  assert.strictEqual(manifest.main, 'main.js', 'giriş dosyası main.js olmalı');
  assert.strictEqual(manifest.productName, 'Deneme');

  // İkinci paketleme yüzlerce MB'ı yeniden kopyalamamalı.
  const ikinci = paketle(secenekler);
  assert.strictEqual(ikinci.kopyalandi, false, 'ikinci paketleme yalnızca uygulama dosyalarını tazelemeli');

  // Yabancı bir klasörün üzerine yazılmamalı.
  const yabanci = path.join(gecici, 'Yabanci');
  fs.mkdirSync(yabanci, { recursive: true });
  fs.writeFileSync(path.join(yabanci, 'onemli.txt'), 'veri', 'utf8');
  assert.throws(
    () => paketle({ ...secenekler, ciktiKlasoru: yabanci, uygulamaAdi: 'Yabanci' }),
    /boş değil/,
    'işaretsiz dolu klasör korunmalı'
  );
  assert.ok(fs.existsSync(path.join(yabanci, 'onemli.txt')), 'kullanıcı dosyası silinmemeli');

  // Ortak çalışma zamanı önbelleği tekrar kullanılmalı.
  const onbellek = calismaZamaniOnbellegi(electron, path.join(gecici, 'onbellek'));
  assert.ok(electronKlasoruGecerliMi(onbellek), 'önbellek geçerli olmalı');
  assert.ok(
    !fs.existsSync(path.join(onbellek, 'resources', 'default_app.asar')),
    'önbellekte uygulama klasörü olmamalı'
  );
  assert.strictEqual(calismaZamaniOnbellegi(electron, path.join(gecici, 'onbellek')), onbellek);

  // Tek dosya: başlatıcı + arşiv + kuyruk tek bir .exe içinde birleşmeli.
  const tekExe = path.join(gecici, 'Deneme-tek.exe');
  const sfx = await tekDosyaOlustur({
    klasor: sonuc.klasor,
    exeYolu: tekExe,
    baslaticiYolu: baslatici,
  });
  assert.ok(fs.existsSync(tekExe), 'tek dosya üretilmeli');
  assert.strictEqual(fs.statSync(tekExe).size, sfx.boyut, 'bildirilen boyut dosyayla eşleşmeli');
  assert.ok(sfx.boyut > 1024 * 1024, 'tek dosya çalışma zamanını içermeli');
  assert.ok(sfx.dosyaSayisi > 10, 'arşivde uygulama dosyaları olmalı');
  assert.match(sfx.ozet, /^[0-9a-f]{32}$/, 'özet 16 bayt (hex) olmalı');

  const bilgi = sfxBilgisi(tekExe);
  assert.ok(bilgi, 'tek dosyanın kuyruğu okunabilmeli');
  assert.strictEqual(bilgi.ozet, sfx.ozet, 'kuyruktaki özet ile sonuç aynı olmalı');
  assert.strictEqual(bilgi.baslaticiBoyutu, fs.statSync(baslatici).size, 'arşiv başlatıcıdan sonra başlamalı');
  assert.strictEqual(
    bilgi.baslaticiBoyutu + bilgi.arsivBoyutu + SFX_KUYRUK_BOYU,
    sfx.boyut,
    'dosya = başlatıcı + arşiv + kuyruk olmalı'
  );
  assert.strictEqual(sfxBilgisi(sonuc.exeYolu), undefined, 'klasör paketindeki .exe tek dosya sayılmamalı');

  // Gömülü arşiv geçerli bir ZIP olmalı: son kaydı (EOCD) okuyup dosya sayısını doğrula.
  const arsivFd = fs.openSync(tekExe, 'r');
  try {
    const sonKayit = Buffer.alloc(22);
    fs.readSync(arsivFd, sonKayit, 0, 22, bilgi.baslaticiBoyutu + bilgi.arsivBoyutu - 22);
    assert.strictEqual(sonKayit.readUInt32LE(0), 0x06054b50, 'ZIP son kaydı bulunmalı');
    assert.strictEqual(sonKayit.readUInt16LE(10), sfx.dosyaSayisi, 'dosya sayısı eşleşmeli');
    assert.strictEqual(sonKayit.readUInt32LE(12) + sonKayit.readUInt32LE(16), bilgi.arsivBoyutu - 22);
  } finally {
    fs.closeSync(arsivFd);
  }

  // Aynı hedefe yeniden yazılabilmeli (üzerine yazma).
  const tekrar = await tekDosyaOlustur({ klasor: sonuc.klasor, exeYolu: tekExe, baslaticiYolu: baslatici });
  assert.strictEqual(tekrar.ozet, sfx.ozet, 'aynı içerik aynı özete sahip olmalı');
  assert.strictEqual(tekrar.boyut, sfx.boyut, 'tekrar paketleme aynı boyutu üretmeli');

  console.log('uygulama paketleyici testleri geçti');
} finally {
  try {
    fs.rmSync(gecici, { recursive: true, force: true });
  } catch {
    /* yok say */
  }
}
})().catch((hata) => {
  console.error(hata);
  process.exit(1);
});
