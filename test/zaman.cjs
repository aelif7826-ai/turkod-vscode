/**
 * `Zaman` modülü testleri.
 *
 * Tarihler sabit verildiği için sonuçlar makineye göre değişmez; yalnızca
 * "şimdi" tabanlı kontroller aralık olarak sınanır.
 */
const assert = require('node:assert');
const { TurkodYorumlayici } = require('../out/calistir');
const { denetle } = require('../out/denetleyici');

const KAYNAK = [
  'içe_aktar Zaman',
  '',
  'yazdır(Zaman.biçimle("17.10.2026 14:35:07", "gg.AA.yyyy HH:mm:ss"))',
  'yazdır(Zaman.biçimle("2026-10-17", "yyyy/MM/dd"))',
  'yazdır(Zaman.biçimle("17.10.2026", "gg AyAdı yyyy, GünAdı"))',
  'yazdır(Zaman.ayAdı(11))',
  'yazdır(Zaman.günAdı("07.11.2026"))',
  'yazdır(Zaman.biçimle(Zaman.ekle("31.01.2026", 1, "ay"), "gg.AA.yyyy"))',
  'yazdır(Zaman.biçimle(Zaman.çıkar("17.10.2026", 2, "ay"), "gg.AA.yyyy"))',
  'yazdır(Zaman.biçimle(Zaman.ekle("17.10.2026 23:30", 90, "dakika"), "HH:mm"))',
  'yazdır(Zaman.fark("01.01.2026", "11.01.2026", "gün"))',
  'yazdır(Zaman.fark("01.01.2026 00:00", "01.01.2026 01:30", "saat"))',
  'yazdır(Zaman.önceMi("01.01.2026", "02.01.2026"))',
  'yazdır(Zaman.sonraMi("01.01.2026", "02.01.2026"))',
  'yazdır(Zaman.eşitMi("01.01.2026", "01.01.2026"))',
  'yazdır(Zaman.haftaSonuMu("07.11.2026"))',
  'yazdır(Zaman.artıkYılMı(2024))',
  'yazdır(Zaman.artıkYılMı(2026))',
  'yazdır(Zaman.ayGünSayısı(2026, 2))',
  'yazdır(Zaman.haftaNumarası("01.01.2026"))',
  'yazdır(Zaman.yılınGünü("31.12.2026"))',
  'değişken aralık := Zaman.ayAralığı("07.11.2026")',
  'yazdır(Zaman.biçimle(aralık.ilk, "gg.AA.yyyy"))',
  'yazdır(Zaman.biçimle(aralık.son, "gg.AA.yyyy"))',
  'yazdır(Zaman.süreMetni(3725000))',
  'yazdır(Zaman.süreMetni(850))',
  'değişken k := Zaman.kronometre()',
  'k.başlat()',
  'k.durdur()',
  'yazdır(k.geçen >= 0)',
  'yazdır(k.çalışıyor)',
  'değişken geri := Zaman.geriSayım("01.01.2030")',
  'yazdır(geri.bitti)',
  'yazdır(Zaman.şimdi().yıl > 2000)',
  'yazdır(Zaman.aylar[0])',
  'yazdır(Zaman.günler[6])',
  '',
].join('\n');

/** Kaynağı çalıştırıp çıktı satırlarını döndürür. */
async function calistir(icerik) {
  const cikti = [];
  const y = new TurkodYorumlayici(icerik, {
    yaz: (m) => cikti.push(m),
    oku: async () => '',
    klasor: process.cwd(),
    gercekGecikme: false,
  });
  await y.calistir();
  return cikti.join('');
}

(async () => {
  const cikti = await calistir(KAYNAK);
  const beklenen = [
    '17.10.2026 14:35:07',
    '2026/10/17',
    '17 Ekim 2026, Cumartesi',
    'Kasım',
    'Cumartesi',
    '28.02.2026',
    '17.08.2026',
    '01:00',
    '10',
    '1,5',
    'Doğru',
    'Yanlış',
    'Doğru',
    'Doğru',
    'Doğru',
    'Yanlış',
    '28',
    '1',
    '365',
    '01.11.2026',
    '30.11.2026',
    '1 saat 2 dakika 5 saniye',
    '850 ms',
    'Doğru',
    'Yanlış',
    'Yanlış',
    'Doğru',
    'Ocak',
    'Cumartesi',
    '',
  ].join('\n');
  assert.strictEqual(cikti, beklenen, 'Zaman modülü çıktıları beklenenle eşleşmeli');

  // Modül, `içe_aktar` yazılmadan kullanılamaz.
  await assert.rejects(
    calistir('yazdır(Zaman.şimdi().yıl)\n'),
    (e) => /Zaman/.test(e.message),
    'içe_aktar olmadan Zaman bilinmemeli'
  );

  // Geçersiz tarih anlaşılır hata verir.
  await assert.rejects(
    calistir('içe_aktar Zaman\nyazdır(Zaman.biçimle("bozuk", "gg"))\n'),
    (e) => /tarih çözümlenemedi/.test(e.message),
    'geçersiz tarih anlaşılır hata vermeli'
  );

  // Denetleyici `içe_aktar Zaman` yazımını kabul eder.
  assert.strictEqual(denetle('içe_aktar Zaman\n').length, 0, 'Zaman modülü denetleyicide geçerli');

  console.log('zaman testleri geçti (32 kontrol)');
})();
