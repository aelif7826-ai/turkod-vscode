const assert = require('node:assert');
const { denetle } = require('../out/denetleyici');

function mesajlar(metin) {
  return denetle(metin).map((s) => s.mesaj);
}

function hataVar(metin, parca) {
  return mesajlar(metin).some((m) => m.includes(parca));
}

// Geçerli kodda sorun olmamalı.
assert.deepStrictEqual(
  mesajlar('değişken x := 5\neğer x > 1 ise\n    yazdır(x)\nson\n'),
  [],
  'geçerli kod sorun üretmemeli'
);

assert.deepStrictEqual(
  mesajlar(
    'fonksiyon sınıflandır(n)\n' +
      '    eğer n < 0 ise\n' +
      '        geri_döndür "negatif"\n' +
      '    değilse-eğer n == 0 ise\n' +
      '        geri_döndür "sıfır"\n' +
      '    değilse\n' +
      '        geri_döndür "pozitif"\n' +
      '    son\n' +
      'son\n' +
      'yazdır(sınıflandır(3))\n'
  ),
  [],
  'değilse-eğer zinciri geçerli olmalı'
);

// `:=` ve `=` atama için birlikte kabul edilir (Studio uyumluluğu).
assert.deepStrictEqual(
  mesajlar('değişken x = 5\nyazdır(x)\n'),
  [],
  '`=` ile değişken tanımı geçerli olmalı'
);

// Eksik atama operatörü yakalanmalı.
assert.ok(hataVar('değişken x 5', 'biçiminde olmalı'));

// `eğer` sonunda `ise` eksikliği.
assert.ok(hataVar('eğer x > 1\n    yazdır(x)\nson', '`ise` ile bitmelidir'));

// `döngü ... kez` eksikliği.
assert.ok(hataVar('döngü 3\n    yazdır("x")\nson', 'kez'));

// Kapatılmayan blok.
assert.ok(hataVar('eğer x > 1 ise\n    yazdır(x)\n', '`son` eksik'));

// Fazladan `son`.
assert.ok(hataVar('son', 'Fazladan `son`'));

// Komut yazım hatası.
assert.ok(hataVar('yazdr("x")', 'Bunu mu demek istediniz: `yazdır`'));

// Kapatılmayan parantez.
assert.ok(hataVar('yazdır((1 + 2)', '`)` eksik'));

// `TürkUI.stil { ... }` bloğu kendi sözdizimini kullanır: renk kodları ve bildirimler
// normal kod denetimine takılmamalı.
assert.deepStrictEqual(
  mesajlar(
    'değişken kutu := 1\n' +
      'TürkUI.stil {\n' +
      '    kutu(\n' +
      '        arkaPlan: #181825\n' +
      '        kenar: 1px düz #313244\n' +
      '        renk: kırmızı\n' +
      '    )\n' +
      '}\n'
  ),
  [],
  '`TürkUI.stil` bloğu uyarı üretmemeli'
);

// Kapatılmayan `TürkUI.stil` bloğu bildirilmeli.
assert.ok(
  hataVar('değişken kutu := 1\nTürkUI.stil {\n    kutu(\n        renk: kırmızı\n    )\n', '`TürkUI.stil` bloğu kapatılmamış')
);

// ---- `TürkUI.betik` söz dizimi denetimi ----

// Eksik virgül ("..." fonksiyon()) yakalanmalı ve doğru satırı göstermeli.
const betikHatasi = denetle(
  'içe_aktar TürkUI\n' +
    'değişken u := TürkUI.pencere("x")\n' +
    'değişken düğme := u.buton("Tamam")\n' +
    'değişken yazı := u.metin("")\n' +
    'TürkUI.betik {\n' +
    '    u(\n' +
    '        düğme.olayDinle("üzerineGelindiğinde" fonksiyon(){\n' +
    '            yazı.içerik :="mouse üzerinde"\n' +
    '        })\n' +
    '    )\n' +
    '}\n'
);
const betikSorunu = betikHatasi.find((s) => /Betik söz dizimi hatası/.test(s.mesaj));
assert.ok(betikSorunu, 'betikteki söz dizimi hatası bildirilmeli');
assert.strictEqual(betikSorunu.satir, 6, 'hata eksik virgül satırında gösterilmeli');

// Doğru yazılmış betik ve Türkçe sözcükler hata üretmemeli.
assert.deepStrictEqual(
  mesajlar(
    'içe_aktar TürkUI\n' +
      'değişken u := TürkUI.pencere("x")\n' +
      'değişken düğme := u.buton("Tamam")\n' +
      'değişken yazı := u.metin("")\n' +
      'TürkUI.betik {\n' +
      '    u(\n' +
      '        değişken sayı := 0\n' +
      '        düğme.olayDinle("tıklandığında", fonksiyon() {\n' +
      '            sayı := sayı + 1\n' +
      '            yazı.içerik := metne(sayı)\n' +
      '        })\n' +
      '    )\n' +
      '}\n'
  ),
  [],
  'geçerli betik uyarı üretmemeli'
);

console.log('denetleyici testleri geçti');
