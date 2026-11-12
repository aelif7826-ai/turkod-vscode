const assert = require('node:assert');
const { TurkodYorumlayici } = require('../out/calistir');

async function calistir(kaynak) {
  const parcalar = [];
  const yorumlayici = new TurkodYorumlayici(kaynak, {
    yaz: (metin) => parcalar.push(metin),
    oku: async () => '',
    klasor: process.cwd(),
  });
  await yorumlayici.calistir();
  return parcalar.join('').trim();
}

(async () => {
  // `kır`, Python'daki break gibi döngüyü sonlandırmalı.
  const kir = await calistir(
    [
      'değişken toplam := 0',
      'için i içinde [1, 2, 3, 4, 5]',
      '    eğer i == 4 ise',
      '        kır',
      '    son',
      '    toplam := toplam + i',
      'son',
      'yazdır(toplam)',
    ].join('\n')
  );
  assert.strictEqual(kir, '6', '`kır` döngüyü 4. turda bitirmeli (1+2+3)');

  // `dur` eski yazım olarak aynı davranışı sürdürmeli.
  const dur = await calistir(
    ['döngü 5 kez', '    yazdır("tur")', '    dur', 'son', 'yazdır("bitti")'].join('\n')
  );
  assert.strictEqual(dur, 'tur\nbitti', '`dur` döngüyü ilk turda bitirmeli');

  // `devam_et` hâlâ çalışmalı.
  const devam = await calistir(
    ['için i içinde [1, 2, 3]', '    eğer i == 2 ise', '        devam_et', '    son', '    yazdır(i)', 'son'].join(
      '\n'
    )
  );
  assert.strictEqual(devam, '1\n3', '`devam_et` yalnızca 2. turu atlamalı');

  // Döngü dışında `kır` hata vermeli.
  await assert.rejects(
    () => calistir('kır'),
    /yalnızca döngü içinde/,
    'döngü dışında `kır` hata vermeli'
  );

  console.log('kır/dur testleri geçti');
})().catch((hata) => {
  console.error(hata);
  process.exit(1);
});
