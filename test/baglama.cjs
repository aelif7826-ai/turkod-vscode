/**
 * Dosya bağlama (`içe_aktar`) testleri.
 *
 * Aynı klasör, alt klasör, tırnaklı yol, `../` ve proje kökü araması sınanır.
 */
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { TurkodYorumlayici, TurkodHatasi, modulDosyasiBul, projeKokuBul } = require('../out/calistir');
const { denetle } = require('../out/denetleyici');

const gecici = fs.mkdtempSync(path.join(os.tmpdir(), 'turkui-baglama-'));
const kok = path.join(gecici, 'proje');
const kaynakKlasoru = path.join(kok, 'src');

function yaz(goreli, icerik) {
  const tam = path.join(kok, goreli);
  fs.mkdirSync(path.dirname(tam), { recursive: true });
  fs.writeFileSync(tam, icerik, 'utf8');
  return tam;
}

yaz('uygulama.json', '{ "ad": "baglama", "giriş": "src/ana.tr" }\n');
yaz(
  'src/araclar/yardimci.tr',
  [
    'değişken YardimciSurum := "1.0"',
    '',
    'fonksiyon selamla(ad)',
    '    geri_döndür "Merhaba, " + ad',
    'son',
    '',
  ].join('\n')
);
yaz(
  'src/araclar/boşluk lu.tr',
  ['fonksiyon bosluklu()', '    geri_döndür "boşluklu"', 'son', ''].join('\n')
);
yaz(
  'ortak/paylasilan.tr',
  ['fonksiyon paylasilanDeger()', '    geri_döndür 42', 'son', ''].join('\n')
);
yaz(
  'src/araclar/derin/kullanim.tr',
  ['içe_aktar ../yardimci', 'yazdır(selamla("Derin"))', ''].join('\n')
);

/** Kaynağı, dosyanın kendi klasörüne göre bağlayarak çalıştırır. */
async function calistir(icerik, dosya) {
  const cikti = [];
  const y = new TurkodYorumlayici(icerik, {
    yaz: (m) => cikti.push(m),
    oku: async () => '',
    klasor: kok,
    dosya,
    gercekGecikme: false,
    modulCoz: (ad, klasor) => modulDosyasiBul(ad, klasor || kaynakKlasoru),
  });
  await y.calistir();
  return cikti.join('');
}

(async () => {
  const anaDosya = path.join(kaynakKlasoru, 'ana.tr');

  // 1) Alt klasördeki dosya yol ile bağlanır; fonksiyon ve değişken paylaşılır.
  let cikti = await calistir(
    ['içe_aktar araclar/yardimci', 'yazdır(selamla("Metehan"))', 'yazdır(YardimciSurum)', ''].join(
      '\n'
    ),
    anaDosya
  );
  assert.strictEqual(cikti, 'Merhaba, Metehan\n1.0\n', 'alt klasör modülü kullanılmalı');

  // 2) Tırnaklı ve boşluk içeren yol da çalışır.
  cikti = await calistir(
    ['içe_aktar "araclar/boşluk lu.tr"', 'yazdır(bosluklu())', ''].join('\n'),
    anaDosya
  );
  assert.strictEqual(cikti, 'boşluklu\n', 'tırnaklı yol ile modül bağlanmalı');

  // 3) Yol verilmeden yazılan ad, proje içindeki alt klasörlerde aranır.
  cikti = await calistir(
    ['içe_aktar paylasilan', 'yazdır(paylasilanDeger())', ''].join('\n'),
    anaDosya
  );
  assert.strictEqual(cikti, '42\n', 'ad ile alt klasördeki modül bulunmalı');

  // 4) Göreli yol, dosyanın kendi klasörüne göre çözülür (`../yardimci`).
  const derin = path.join(kaynakKlasoru, 'araclar', 'derin', 'kullanim.tr');
  cikti = await calistir(fs.readFileSync(derin, 'utf8'), derin);
  assert.strictEqual(cikti, 'Merhaba, Derin\n', '../ ile üst klasördeki modül bağlanmalı');

  // 5) Aynı klasördeki modül, kısa adla (eski davranış) bağlanmaya devam eder.
  const yanDosya = path.join(kaynakKlasoru, 'araclar', 'ana2.tr');
  cikti = await calistir(
    ['içe_aktar yardimci', 'yazdır(selamla("Yan"))', ''].join('\n'),
    yanDosya
  );
  assert.strictEqual(cikti, 'Merhaba, Yan\n', 'aynı klasördeki modül kısa adla bulunmalı');

  // 6) Çözümleyici doğrudan da doğru dosyayı döndürür.
  assert.strictEqual(
    modulDosyasiBul('araclar/yardimci', kaynakKlasoru),
    path.join(kaynakKlasoru, 'araclar', 'yardimci.tr'),
    'yol ile dosya bulunmalı'
  );
  assert.strictEqual(
    modulDosyasiBul('yardimci', kaynakKlasoru),
    path.join(kaynakKlasoru, 'araclar', 'yardimci.tr'),
    'ad ile alt klasördeki dosya bulunmalı'
  );
  assert.strictEqual(
    modulDosyasiBul('./araclar/yardimci.tr', kaynakKlasoru),
    path.join(kaynakKlasoru, 'araclar', 'yardimci.tr'),
    './ ve uzantı ile dosya bulunmalı'
  );
  assert.strictEqual(modulDosyasiBul('yok/boyle', kaynakKlasoru), undefined, 'olmayan dosya yok');
  assert.strictEqual(projeKokuBul(path.join(kaynakKlasoru, 'araclar')), kok, 'proje kökü bulunmalı');

  // 7) Bulunamayan modül anlaşılır hata verir.
  await assert.rejects(
    calistir('içe_aktar yokboyle\n', anaDosya),
    (e) => e instanceof TurkodHatasi && /bulunamadı/.test(e.message),
    'eksik modül anlaşılır hata vermeli'
  );

  // 8) Denetleyici yol yazımını kabul eder, iki modülü reddeder.
  const gecerli = denetle('içe_aktar araclar/yardimci\n');
  assert.strictEqual(gecerli.length, 0, 'yol yazımı hata vermemeli');
  const tirnakli = denetle('içe_aktar "araclar/boşluk lu.tr"\n');
  assert.strictEqual(tirnakli.length, 0, 'tırnaklı yol hata vermemeli');
  const gecersiz = denetle('içe_aktar a b\n');
  assert.ok(
    gecersiz.some((s) => /içe_aktar/.test(s.mesaj)),
    'iki modül yazımı hata olarak bildirilmeli'
  );

  console.log('baglama testleri geçti (12 kontrol)');
})().finally(() => {
  fs.rmSync(gecici, { recursive: true, force: true });
});
