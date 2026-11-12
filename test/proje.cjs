/**
 * `türküi` komut satırı aracı testleri.
 *
 * - `türküi yeni` proje iskeletini oluşturur mu?
 * - Oluşturulan uygulama, iki dosya bağlanmış hâlde çalışıyor mu?
 * - Konsol projesi `türküi çalıştır` ile çalışıyor mu?
 */
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { yeniProje, projeAdiGecerliMi, projeCalistir } = require('../out/turkuiCli');
const { TurkodYorumlayici, modulDosyasiBul } = require('../out/calistir');
const { createTurkuiModulu } = require('../out/turkui');

const gecici = fs.mkdtempSync(path.join(os.tmpdir(), 'turkui-proje-'));

/** TürkUI köprüsünü taklit eder ve çağrıları kaydeder. */
function sahteKopru() {
  const kayit = { pencereler: [], bilesenler: [], guncellemeler: [], gosterilenler: [] };
  const kopru = {
    baseDir: process.cwd(),
    onTurkuiCreateWindow: (baslik, id, props) => kayit.pencereler.push({ baslik, id, props }),
    onTurkuiAddComponent: (pencereId, tur, id, props) =>
      kayit.bilesenler.push({ pencereId, tur, id, props }),
    onTurkuiUpdateComponent: (pencereId, id, prop, value) =>
      kayit.guncellemeler.push({ pencereId, id, prop, value }),
    onTurkuiShowWindow: (id) => kayit.gosterilenler.push(id),
    onTurkuiCloseWindow: () => undefined,
    onTurkuiIleti: async () => null,
    onTurkuiSor: async () => '',
    onTurkuiDosya: async () => null,
    onTurkuiBildirim: async () => undefined,
    onTurkuiEkran: () => ({
      genişlik: 1920,
      yükseklik: 1080,
      ölçek: 1,
      çalışmaAlanı: { x: 0, y: 0, genişlik: 1920, yükseklik: 1040 },
    }),
    onTurkuiPencereSayisi: () => 1,
    onTurkuiHepsiKapat: () => undefined,
    onTurkuiDurum: () => undefined,
  };
  return { kopru, kayit };
}

function sonGuncelleme(kayit, id, prop) {
  return kayit.guncellemeler.filter((g) => g.id === id && g.prop === prop).at(-1);
}

(async () => {
  /* ---------------- proje adı doğrulaması ---------------- */

  assert.strictEqual(projeAdiGecerliMi('deneme'), true);
  assert.strictEqual(projeAdiGecerliMi('uygulama_2'), true);
  assert.strictEqual(projeAdiGecerliMi('çok-güzel.proje'), true);
  for (const kotu of ['', 'boşluk var', 'a/b', 'a\\b', '.gizli', 'CON']) {
    assert.strictEqual(projeAdiGecerliMi(kotu), false, `"${kotu}" geçersiz olmalı`);
  }

  /* ---------------- proje oluşturma ---------------- */

  const sonuc = yeniProje('deneme', { hedef: gecici });
  const proje = sonuc.klasor;
  assert.strictEqual(proje, path.join(gecici, 'deneme'), 'proje <üst>/<ad> altında açılmalı');

  for (const dosya of [
    'uygulama.json',
    'README.md',
    '.gitignore',
    'src/ana.tr',
    'src/araclar/yardimci.tr',
    'assets/README.md',
  ]) {
    assert.ok(fs.existsSync(path.join(proje, dosya)), `${dosya} oluşturulmalı`);
  }

  const ayarlar = JSON.parse(fs.readFileSync(path.join(proje, 'uygulama.json'), 'utf8'));
  assert.strictEqual(ayarlar.ad, 'deneme', 'uygulama.json ad alanı');
  assert.strictEqual(ayarlar.giriş, 'src/ana.tr', 'uygulama.json giriş alanı');
  assert.deepStrictEqual(ayarlar.varlıklar, ['assets'], 'varlıklar bildirilmeli');

  const ana = fs.readFileSync(path.join(proje, 'src/ana.tr'), 'utf8');
  assert.match(ana, /içe_aktar araclar\/yardimci/, 'ana dosya yardımcı dosyayı bağlamalı');
  assert.match(ana, /içe_aktar TürkUI/, 'ana dosya TürkUI kullanmalı');

  // Dolu klasörün üzerine yazılmaz.
  assert.throws(() => yeniProje('deneme', { hedef: gecici }), /boş değil/);

  /* ---------------- oluşturulan uygulamayı çalıştır ---------------- */

  const { kopru, kayit } = sahteKopru();
  const cikti = [];
  const yorumlayici = new TurkodYorumlayici(ana, {
    yaz: (m) => cikti.push(m),
    oku: async () => '',
    klasor: proje,
    dosya: path.join(proje, 'src/ana.tr'),
    gercekGecikme: false,
    modulCoz: (ad, klasor) => modulDosyasiBul(ad, klasor || path.join(proje, 'src')),
    turkui: createTurkuiModulu(kopru),
  });
  await yorumlayici.calistir();

  assert.strictEqual(kayit.pencereler.length, 1, 'bir pencere açılmalı');
  assert.strictEqual(kayit.pencereler[0].baslik, 'deneme', 'pencere başlığı proje adı olmalı');
  assert.strictEqual(kayit.gosterilenler.length, 1, 'pencere gösterilmeli');

  const metinler = kayit.bilesenler.filter((b) => b.tur === 'text');
  const buton = kayit.bilesenler.find((b) => b.tur === 'button');
  assert.ok(metinler.length >= 2, 'başlık ve sayaç metinleri eklenmeli');
  assert.ok(buton, 'buton eklenmeli');

  const sayac = metinler[1];
  const baslik = metinler[0];
  assert.strictEqual(
    sonGuncelleme(kayit, sayac.id, 'içerik'),
    undefined,
    'sayaç başlangıçta güncellenmemeli (içerik bileşende)'
  );

  // Butona basınca bağlanan dosyadaki fonksiyon sayaç metnini üretir.
  await yorumlayici.turkuiOlayTetikle(buton.id, 'tıklandığında');
  assert.strictEqual(
    sonGuncelleme(kayit, sayac.id, 'içerik')?.value,
    'Tıklama sayısı: 1',
    'ilk tıklamada sayaç 1 olmalı'
  );

  for (let i = 0; i < 4; i++) await yorumlayici.turkuiOlayTetikle(buton.id, 'tıklandığında');
  assert.strictEqual(
    sonGuncelleme(kayit, sayac.id, 'içerik')?.value,
    'Tıklama sayısı: 5',
    'beş tıklamada sayaç 5 olmalı'
  );
  assert.strictEqual(
    sonGuncelleme(kayit, baslik.id, 'içerik')?.value,
    'Merhaba, deneme!',
    'beş tıklamada başlık yardımcı dosyadaki selamla fonksiyonuyla güncellenmeli'
  );

  /* ---------------- konsol projesi `çalıştır` ---------------- */

  const konsol = path.join(gecici, 'konsol');
  fs.mkdirSync(path.join(konsol, 'src', 'araclar'), { recursive: true });
  fs.writeFileSync(
    path.join(konsol, 'uygulama.json'),
    `${JSON.stringify({ ad: 'konsol', giriş: 'src/ana.tr' }, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(konsol, 'src', 'araclar', 'yardimci.tr'),
    'fonksiyon selamla(ad)\n    geri_döndür "Merhaba, " + ad\nson\n',
    'utf8'
  );
  fs.writeFileSync(
    path.join(konsol, 'src', 'ana.tr'),
    'içe_aktar araclar/yardimci\nyazdır(selamla("Konsol"))\n',
    'utf8'
  );

  const kod = await projeCalistir({ klasor: konsol });
  assert.strictEqual(kod, 0, 'konsol projesi hatasız çalışmalı');

  console.log('proje testleri geçti (24 kontrol)');
})().finally(() => {
  fs.rmSync(gecici, { recursive: true, force: true });
});
