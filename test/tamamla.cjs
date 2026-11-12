const assert = require('node:assert');
const Module = require('node:module');

/* ---------------- küçük `vscode` taklidi ---------------- */

class MarkdownString {
  constructor(deger, destekli) {
    this.value = deger || '';
    this.isTrusted = !!destekli;
  }
  appendText(t) {
    this.value += t;
    return this;
  }
  appendMarkdown(t) {
    this.value += t;
    return this;
  }
  appendCodeblock(kod, dil) {
    this.value += `\n\`\`\`${dil || ''}\n${kod}\n\`\`\`\n`;
    return this;
  }
}

class SnippetString {
  constructor(deger) {
    this.value = deger;
  }
}

class Range {
  constructor(baslangicSatiri, baslangicSutunu, bitisSatiri, bitisSutunu) {
    this.start = { line: baslangicSatiri, character: baslangicSutunu };
    this.end = { line: bitisSatiri, character: bitisSutunu };
  }
}

class CompletionItem {
  constructor(etiket, tur) {
    this.label = etiket;
    this.kind = tur;
    this.detail = '';
    this.documentation = undefined;
    this.insertText = undefined;
    this.sortText = '';
  }
}

const vscode = {
  MarkdownString,
  SnippetString,
  Range,
  CompletionItem,
  CompletionItemKind: {
    Text: 0,
    Method: 1,
    Function: 2,
    Field: 4,
    Variable: 5,
    Class: 6,
    Module: 8,
    Property: 9,
    Value: 11,
    Keyword: 13,
    Snippet: 14,
    Constant: 20,
    Event: 23,
  },
  workspace: {
    getConfiguration: () => ({ get: () => undefined }),
    fs: { readDirectory: async () => [] },
    asRelativePath: (yol) => yol,
  },
  window: { activeTextEditor: undefined },
};

const gercekYukle = Module._load;
Module._load = function (istek, ...kalan) {
  if (istek === 'vscode') return vscode;
  return gercekYukle.call(this, istek, ...kalan);
};

const { TurkodTamamlamaSaglayici } = require('../out/tamamla');
const saglayici = new TurkodTamamlamaSaglayici();

function belge(metin) {
  const satirlar = metin.split('\n');
  return {
    getText: () => metin,
    lineAt: (i) => ({ text: satirlar[i] ?? '' }),
    uri: { scheme: 'file', fsPath: 'C:/test/ornek.tr' },
    fileName: 'C:/test/ornek.tr',
  };
}

function tamamla(metin, satir, sutun, tetikleyici) {
  return saglayici.provideCompletionItems(
    belge(metin),
    { line: satir, character: sutun },
    { isCancellationRequested: false },
    { triggerKind: tetikleyici ? 1 : 0, triggerCharacter: tetikleyici }
  );
}

/* ---------------- kontroller ---------------- */

// 1) İçe aktarma yokken tek "TürkUI" öğesi gelir ve içe aktarmayı ekler.
const duz = tamamla('değişken x := 1\n', 1, 0);
const turkuiOgeleri = duz.filter((i) => i.label === 'TürkUI');
assert.strictEqual(turkuiOgeleri.length, 1, 'tek TürkUI öğesi olmalı');
const modul = turkuiOgeleri[0];
assert.strictEqual(modul.kind, vscode.CompletionItemKind.Module, 'modül türünde olmalı');
assert.strictEqual(modul.detail, 'Yerleşik modül');
assert.strictEqual(modul.insertText, 'içe_aktar TürkUI', 'içe aktarma eklenmeli');

// Belge, modülün tüm üyelerini ve bileşenleri anlatmalı.
const modulBelgesi = modul.documentation.value;
for (const uye of ['pencere', 'onay', 'sor', 'bilgi', 'dosyaSeç', 'renk']) {
  assert.ok(modulBelgesi.includes(uye), `belge "${uye}" üyesini anlatmalı`);
}
for (const bilesen of ['metin', 'buton', 'giriş', 'liste', 'özel', 'canvas', 'tarayıcı']) {
  assert.ok(modulBelgesi.includes(bilesen), `belge "${bilesen}" bileşenini anlatmalı`);
}

// 2) İçe aktarma varsa yalnızca modül adı yazılır.
const iceAktarilmis = tamamla('içe_aktar TürkUI\ndeğişken u := TürkUI.pencere("x")\n', 2, 0);
const ikinci = iceAktarilmis.filter((i) => i.label === 'TürkUI');
assert.strictEqual(ikinci.length, 1);
assert.strictEqual(ikinci[0].insertText, 'TürkUI', 'içe aktarma zaten var');

// 3) `TürkUI.` sonrasında modül üyeleri listelenir.
const uyeSatiri = 'değişken u := TürkUI.';
const uyeler = tamamla(`içe_aktar TürkUI\n${uyeSatiri}\n`, 1, uyeSatiri.length, '.');
const uyeAdlari = uyeler.map((u) => u.label);
assert.ok(uyeAdlari.includes('pencere'), 'pencere üyesi önerilmeli');
assert.ok(uyeAdlari.includes('onay'), 'onay üyesi önerilmeli');

// `TürkUI.` listesinde `stil` bloğu da bulunmalı ve blok iskeleti yazmalı.
const stilUyesi = uyeler.find((u) => u.label === 'stil');
assert.ok(stilUyesi, 'stil bloğu TürkUI üyelerinde olmalı');
assert.strictEqual(stilUyesi.kind, vscode.CompletionItemKind.Snippet, 'stil bir blok önerisi');
assert.ok(
  String(stilUyesi.insertText.value).startsWith('stil {'),
  'stil bloğu iskeleti yapıştırılmalı'
);

// 4) `içe_aktar ` sonrasında yerleşik modüller (Zaman ve TürkUI) listelenir.
const moduller = tamamla('içe_aktar TürkUI', 0, 'içe_aktar TürkUI'.length);
const modulTurleri = moduller.filter((m) => m.kind === vscode.CompletionItemKind.Module);
assert.strictEqual(modulTurleri.length, 3, 'üç yerleşik modül önerilmeli');
assert.deepStrictEqual(
  modulTurleri.map((m) => m.label).sort(),
  ['Oyun', 'TürkUI', 'Zaman'].sort(),
  'Oyun, Zaman ve TürkUI önerilmeli'
);
for (const modul of modulTurleri) assert.strictEqual(modul.detail, 'Yerleşik modül');

// `Zaman.` sonrasında modül üyeleri listelenir.
const zamanSatiri = 'değişken z := Zaman.';
const zamanUyeleri = tamamla(`içe_aktar Zaman\n${zamanSatiri}\n`, 1, zamanSatiri.length, '.');
const zamanAdlari = zamanUyeleri.map((u) => u.label);
for (const ad of ['şimdi', 'biçimle', 'ekle', 'kronometre', 'geriSayım']) {
  assert.ok(zamanAdlari.includes(ad), `Zaman.${ad} önerilmeli`);
}

// 5b) `TürkUI` içe aktarılmadıysa `stil`/`betik` anahtar kelimeleri önerilmez.
const modulsuzAdlar = tamamla('yazdır("merhaba")\n', 0, 0).map((i) => i.label);
assert.ok(!modulsuzAdlar.includes('betik'), 'TürkUI yokken `betik` önerilmemeli');
assert.ok(!modulsuzAdlar.includes('stil'), 'TürkUI yokken `stil` önerilmemeli');
const modulluAdlar = tamamla('içe_aktar TürkUI\nyazdır("merhaba")\n', 1, 0).map((i) => i.label);
assert.ok(modulluAdlar.includes('betik'), 'TürkUI varken `betik` önerilmeli');
assert.ok(modulluAdlar.includes('stil'), 'TürkUI varken `stil` önerilmeli');

// 5) Parçacıklarda ayrı `turkui ...` girdileri kalmamalı.
const parcalar = require('../snippets/turkod.json');
const turkuiParcalari = Object.entries(parcalar).filter(([, p]) =>
  String(p.prefix).toLowerCase().startsWith('turkui')
);
assert.strictEqual(turkuiParcalari.length, 0, 'ayrı TürkUI parçacıkları kaldırılmalı');

/* ---------------- TürkUI.stil içi özellik tamamlaması ---------------- */

const stilBelgesi = [
  'içe_aktar TürkUI',
  'değişken uygulama := TürkUI.pencere("deneme")',
  'değişken düğme := uygulama.buton("Tamam")',
  'TürkUI.stil {',
  '    düğme(',
  '        ',
  '    )',
  '}',
  'uygulama.göster()',
];

// 6) Grup gövdesinde tüm stil özellikleri en üstte önerilir.
const stilMetni = stilBelgesi.join('\n');
const stilOnerileri = tamamla(stilMetni, 5, 8);
const stilAdlari = stilOnerileri.map((i) => i.label);
const ozellikToplam = require('../out/veri/stilOzellikleri').stilOzellikleri.length;
const durumToplam = require('../out/veri/stilDurumlari').stilDurumlari.length;
assert.strictEqual(
  stilAdlari.length,
  ozellikToplam + durumToplam,
  'tüm stil özellikleri ve durumlar önerilmeli'
);
for (const ad of ['arkaPlanRengi', 'yazıRengi', 'kenarYuvarlaklığı', 'yazıBoyutu', 'gölge']) {
  assert.ok(stilAdlari.includes(ad), `"${ad}" önerilmeli`);
}
assert.ok(stilAdlari.includes('üzerineGelince'), 'durum grubu önerilmeli');
assert.ok(
  stilOnerileri.every((i) => String(i.sortText).startsWith('0_')),
  'stil özellikleri ve durumlar listenin en üstünde olmalı'
);
assert.ok(
  stilOnerileri
    .filter((i) => i.label === 'arkaPlanRengi' || i.label === 'yazıRengi')
    .every((i) => String(i.sortText).startsWith('0_0_')),
  'stil özellikleri durumlardan önce gelmeli'
);
const arkaPlanOnerisi = stilOnerileri.find((i) => i.label === 'arkaPlanRengi');
assert.ok(
  String(arkaPlanOnerisi.insertText.value).startsWith('arkaPlanRengi: '),
  'özellik "ad: değer" olarak yapıştırılmalı'
);
assert.ok(
  String(arkaPlanOnerisi.detail).includes('background-color'),
  'ayrıntıda CSS karşılığı görünmeli'
);

// 7) Değer konumunda (satır ":" ile bitiyorsa) özellik önerilmez.
const degerBelgesi = stilBelgesi.slice();
degerBelgesi[5] = '        renk:';
const degerOnerileri = tamamla(degerBelgesi.join('\n'), 5, '        renk:'.length);
assert.ok(
  !degerOnerileri.some((i) => i.label === 'arkaPlanRengi'),
  'değer konumunda özellik önerilmemeli'
);

// 8) Blok gövdesinde (grup dışında) bileşenler ve pencere hedef olarak önerilir.
const hedefOnerileri = tamamla(stilMetni, 3, 'TürkUI.stil {'.length);
const hedefAdlari = hedefOnerileri.map((i) => i.label);
assert.ok(hedefAdlari.includes('düğme'), 'bileşen hedef olarak önerilmeli');
assert.ok(hedefAdlari.includes('uygulama'), 'pencere hedef olarak önerilmeli');
const pencereHedefi = hedefOnerileri.find((i) => i.label === 'uygulama');
assert.ok(
  String(pencereHedefi.detail).includes('pencere'),
  'pencere hedefi pencere düzeyi stil olarak açıklanmalı'
);

// Blokta pencere adının başı yazılırken de öneri gelmeli (eski hata: liste boş kalıyordu).
const yazilanBelgesi = [
  'içe_aktar TürkUI',
  'değişken uygulama := TürkUI.pencere("deneme")',
  'değişken düğme := uygulama.buton("Tamam")',
  'TürkUI.stil {',
  '    düğme(',
  '        arkaPlanRengi: kırmızı',
  '    )',
  '    uygu',
  '}',
];
const yazilanOnerileri = tamamla(yazilanBelgesi.join('\n'), 7, '    uygu'.length);
assert.ok(
  yazilanOnerileri.some((i) => i.label === 'uygulama'),
  'blokta "uygu" yazılırken pencere hedefi önerilmeli'
);

// 9) Blok dışında stil özellikleri önerilmez.
const disOneriler = tamamla('değişken x := 1\n\n', 1, 0);
assert.ok(
  !disOneriler.some((i) => i.label === 'arkaPlanRengi'),
  'blok dışında stil özelliği önerilmemeli'
);

// 10) Öneri listesi renderer'daki Türkçe CSS tablosuyla birebir aynı olmalı.
const fsModul = require('node:fs');
const html = fsModul.readFileSync(require('node:path').join(__dirname, '..', 'media', 'turkui-window.html'), 'utf8');
const tabloBasi = html.indexOf('const TURKCE_CSS_OZELLIK = {');
const tabloSonu = html.indexOf('};', tabloBasi);
const cssTablosu = {};
for (const m of html.slice(tabloBasi, tabloSonu).matchAll(/([A-Za-zÇĞİÖŞÜçğıöşü]+)\s*:\s*'([a-z-]+)'/g)) {
  cssTablosu[m[1]] = m[2];
}
const stilVerisi = require('../out/veri/stilOzellikleri').stilOzellikleri;
assert.strictEqual(stilVerisi.length, Object.keys(cssTablosu).length, 'özellik sayısı renderer ile aynı olmalı');
for (const ozellik of stilVerisi) {
  assert.strictEqual(cssTablosu[ozellik.ad], ozellik.css, `"${ozellik.ad}" CSS karşılığı eşleşmeli`);
}

// Durum tablosu da renderer ile birebir aynı olmalı.
const durumTabloBasi = html.indexOf('const TURKCE_CSS_DURUM = {');
const durumTabloSonu = html.indexOf('};', durumTabloBasi);
const durumTablosu = {};
for (const m of html.slice(durumTabloBasi, durumTabloSonu).matchAll(/([A-Za-zÇĞİÖŞÜçğıöşü]+)\s*:\s*'(:[a-z-]+)'/g)) {
  durumTablosu[m[1]] = m[2];
}
const durumVerisi = require('../out/veri/stilDurumlari').stilDurumlari;
assert.strictEqual(
  durumVerisi.length,
  Object.keys(durumTablosu).length,
  'durum sayısı renderer ile aynı olmalı'
);
for (const durum of durumVerisi) {
  assert.strictEqual(durumTablosu[durum.ad], durum.css, `"${durum.ad}" durum karşılığı eşleşmeli`);
}

// 11) Gruba zaten yazılmış özellikler tekrar önerilmez.
const yazilmisBelgesi = [
  'içe_aktar TürkUI',
  'değişken uygulama := TürkUI.pencere("deneme")',
  'değişken düğme := uygulama.buton("Tamam")',
  'TürkUI.stil {',
  '    düğme(',
  '        arkaPlanRengi: kırmızı',
  '        kenarYuvarlaklığı: 10px',
  '        ',
  '    )',
  '}',
  'uygulama.göster()',
];
const yazilmisOnerileri = tamamla(yazilmisBelgesi.join('\n'), 7, 8);
const yazilmisAdlari = yazilmisOnerileri.map((i) => i.label);
assert.ok(!yazilmisAdlari.includes('arkaPlanRengi'), 'yazılmış "arkaPlanRengi" tekrar önerilmemeli');
assert.ok(
  !yazilmisAdlari.includes('kenarYuvarlaklığı'),
  'yazılmış "kenarYuvarlaklığı" tekrar önerilmemeli'
);
assert.ok(yazilmisAdlari.includes('yazıRengi'), 'yazılmamış "yazıRengi" önerilmeli');
const stilVerisi0 = require('../out/veri/stilOzellikleri').stilOzellikleri;
const durumVerisi0 = require('../out/veri/stilDurumlari').stilDurumlari;
assert.strictEqual(
  yazilmisAdlari.length,
  stilVerisi0.length - 2 + durumVerisi0.length,
  'kullanılan 2 özellik listeden çıkmalı, durumlar eklenmeli'
);

// Hedef grubunda Türkçe durumlar da önerilir.
assert.ok(
  yazilmisAdlari.includes('üzerineGelince'),
  'hedef grubunda "üzerineGelince" durumu önerilmeli'
);
assert.ok(
  yazilmisOnerileri
    .filter((i) => i.label === 'üzerineGelince')
    .every((i) => String(i.detail).includes(':hover')),
  'durum önerisi CSS karşılığını göstermeli'
);

// Durum grubunun içinde aynı özellik yeniden önerilir, iç içe durum önerilmez.
const durumBelgesi = [
  'içe_aktar TürkUI',
  'değişken uygulama := TürkUI.pencere("deneme")',
  'değişken düğme := uygulama.buton("Tamam")',
  'TürkUI.stil {',
  '    düğme(',
  '        arkaPlanRengi: kırmızı',
  '        üzerineGelince(',
  '            ',
  '        )',
  '    )',
  '}',
];
const durumOnerileri = tamamla(durumBelgesi.join('\n'), 7, 12);
const durumAdlari = durumOnerileri.map((i) => i.label);
assert.ok(
  durumAdlari.includes('arkaPlanRengi'),
  'durum grubunda "arkaPlanRengi" yeniden önerilmeli'
);
assert.ok(
  !durumAdlari.includes('üzerineGelince'),
  'durum grubu içinde başka durum önerilmemeli'
);

// Aynı özellik başka bir bileşen grubunda yeniden önerilebilmeli.
const baskaGrupBelgesi = [
  'içe_aktar TürkUI',
  'değişken uygulama := TürkUI.pencere("deneme")',
  'değişken düğme := uygulama.buton("Tamam")',
  'değişken etiket := uygulama.metin("deneme")',
  'TürkUI.stil {',
  '    düğme(',
  '        arkaPlanRengi: kırmızı',
  '    )',
  '    etiket(',
  '        ',
  '    )',
  '}',
];
const baskaGrupOnerileri = tamamla(baskaGrupBelgesi.join('\n'), 9, 8);
assert.ok(
  baskaGrupOnerileri.some((i) => i.label === 'arkaPlanRengi'),
  'başka bileşen grubunda özellik yeniden önerilmeli'
);

// 12) Değer konumunda hazır değerler (renkler, ölçüler) önerilir.
const degerBelgesi2 = [
  'içe_aktar TürkUI',
  'değişken uygulama := TürkUI.pencere("deneme")',
  'değişken düğme := uygulama.buton("Tamam")',
  'TürkUI.stil {',
  '    düğme(',
  '        arkaPlanRengi: m',
  '    )',
  '}',
];
const degerOnerileri2 = tamamla(degerBelgesi2.join('\n'), 5, '        arkaPlanRengi: m'.length);
const degerAdlari2 = degerOnerileri2.map((i) => i.label);
assert.ok(degerAdlari2.includes('mavi'), 'değer konumunda "mavi" önerilmeli');
assert.ok(degerAdlari2.includes('mor'), 'değer konumunda "mor" önerilmeli');
assert.ok(degerAdlari2.includes('beyaz'), 'değer konumunda "beyaz" önerilmeli');
assert.ok(
  !degerAdlari2.includes('metinHizalama'),
  'değer konumunda özellik/metot önerilmemeli'
);
assert.ok(
  degerOnerileri2.every((i) => String(i.sortText).startsWith('0_')),
  'hazır değerler listenin en üstünde olmalı'
);

// Ölçü özelliklerinde sayısal değerler önerilir.
const olcuBelgesi = degerBelgesi2.slice();
olcuBelgesi[5] = '        kenarYuvarlaklığı: 1';
const olcuOnerileri = tamamla(olcuBelgesi.join('\n'), 5, '        kenarYuvarlaklığı: 1'.length);
const olcuAdlari = olcuOnerileri.map((i) => i.label);
assert.ok(olcuAdlari.includes('12px'), 'ölçü değeri "12px" önerilmeli');
assert.ok(olcuAdlari.includes('16px'), 'ölçü değeri "16px" önerilmeli');

// 13) Hazır değer listesi renderer'daki Türkçe değer tablosuyla aynı olmalı.
const degerBasi = html.indexOf('const TURKCE_CSS_DEGER = {');
const degerSonu = html.indexOf('};', degerBasi);
const cssDegerTablosu = {};
for (const m of html.slice(degerBasi, degerSonu).matchAll(/([A-Za-zÇĞİÖŞÜçğıöşü]+)\s*:\s*'([^']+)'/g)) {
  cssDegerTablosu[m[1]] = m[2];
}
const stilDegerVerisi = require('../out/veri/stilDegerleri');
const tumDegerler = new Map();
for (const d of stilDegerVerisi.renkDegerleri) tumDegerler.set(d.deger, d.css);
for (const d of stilDegerVerisi.ortakDegerler) tumDegerler.set(d.deger, d.css);
for (const [tr, en] of Object.entries(cssDegerTablosu)) {
  assert.strictEqual(tumDegerler.get(tr), en, `"${tr}" değeri renderer ile eşleşmeli`);
}

// 14) Renk değerinde rgb/rgba/hex şablonları önerilir.
const rgbBelgesi = degerBelgesi2.slice();
rgbBelgesi[5] = '        arkaPlanRengi: rg';
const rgbOnerileri = tamamla(rgbBelgesi.join('\n'), 5, '        arkaPlanRengi: rg'.length);
const rgbOnerisi = rgbOnerileri.find((i) => i.label === 'rgb()');
assert.ok(rgbOnerisi, 'rgb() şablonu önerilmeli');
assert.strictEqual(rgbOnerisi.kind, vscode.CompletionItemKind.Snippet, 'rgb bir şablon olmalı');
assert.ok(
  String(rgbOnerisi.insertText.value).startsWith('rgb('),
  'rgb(...) kodu yapıştırılmalı'
);
assert.ok(
  rgbOnerileri.some((i) => i.label === 'rgba()'),
  'rgba() şablonu önerilmeli'
);
assert.ok(
  rgbOnerileri.some((i) => i.label === '#rrggbb'),
  'hex renk şablonu önerilmeli'
);

/* ---------------- TürkUI.betik içi olay adı tamamlaması ---------------- */

// 15) `olayDinle("` konumunda Türkçe olay adları önerilir.
const olayBelgesi = [
  'içe_aktar TürkUI',
  'değişken u := TürkUI.pencere("x")',
  'değişken düğme := u.buton("Tamam")',
  'TürkUI.betik {',
  '    u(',
  '        düğme.olayDinle("tık',
  '    )',
  '}',
];
const olayOnerileri = tamamla(olayBelgesi.join('\n'), 5, '        düğme.olayDinle("tık'.length);
const olayAdlari = olayOnerileri.map((i) => i.label);
assert.strictEqual(olayAdlari.length, 18, '18 olay adı önerilmeli');
for (const ad of ['tıklandığında', 'tuşBasılınca', 'değiştiğinde', 'fareHareketinde']) {
  assert.ok(olayAdlari.includes(ad), `"${ad}" olayı önerilmeli`);
}
const tikOnerisi = olayOnerileri.find((i) => i.label === 'tıklandığında');
assert.strictEqual(tikOnerisi.kind, vscode.CompletionItemKind.Event, 'olay türünde olmalı');
assert.strictEqual(tikOnerisi.detail, 'tıklandığında → click', 'karşılığı gösterilmeli');

// 16) Açılış tırnağı henüz yazılmamışken de önerilir.
const tirsizBelge = olayBelgesi.slice();
tirsizBelge[5] = '        düğme.olayDinle(';
const tirsizOnerileri = tamamla(tirsizBelge.join('\n'), 5, '        düğme.olayDinle('.length);
assert.ok(
  tirsizOnerileri.some((i) => i.label === 'tıklandığında'),
  'tırnak yazılmadan da olay adları önerilmeli'
);

// 17) Tamamlanmış çağrıda olay listesi gösterilmez.
const tamBelge = olayBelgesi.slice();
tamBelge[5] = '        düğme.olayDinle("tıklandığında", işlev)';
const tamOnerileri = tamamla(tamBelge.join('\n'), 5, tamBelge[5].length);
assert.ok(
  !tamOnerileri.some((i) => i.label === 'tıklandığında'),
  'tamamlanmış çağrıda olay listesi çıkmamalı'
);

/* ---------------- tanımsız ad için hazır değişken tanımı ---------------- */

// 18) Satır başında tanımsız bir ad yazılınca `değişken ad := ` önerilir.
const yeniBelge = 'yazdır("Merhaba")\nasd';
const yeniOneriler = tamamla(yeniBelge, 1, 'asd'.length);
const yeniOneri = yeniOneriler.find((i) => i.label === 'değişken asd := ');
assert.ok(yeniOneri, 'tanımsız ad için hazır değişken tanımı önerilmeli');
assert.strictEqual(yeniOneri.kind, vscode.CompletionItemKind.Snippet, 'şablon türünde olmalı');
assert.strictEqual(yeniOneri.filterText, 'asd', 'yazılan adla eşleşmeli');
assert.strictEqual(
  String(yeniOneri.insertText.value),
  'değişken asd := ${1}',
  'değişken tanımı ve imleç yazılmalı'
);
assert.ok(
  String(yeniOneri.detail).includes('değişken'),
  'ayrıntıda tanım bilgisi görünmeli'
);

// 19) Girintili satır başında da önerilir.
const girintiliOneriler = tamamla('eğer Doğru ise\n    yeniAd', 1, '    yeniAd'.length);
assert.ok(
  girintiliOneriler.some((i) => i.label === 'değişken yeniAd := '),
  'girintili satırda da hazır değişken tanımı önerilmeli'
);

// 20) Tanımlı bir değişken için hazır tanım önerilmez.
const tanimliOneriler = tamamla('değişken sayi := 1\nsayi', 1, 'sayi'.length);
assert.ok(
  !tanimliOneriler.some((i) => String(i.label).startsWith('değişken sayi')),
  'tanımlı değişken için hazır tanım önerilmemeli'
);

// 21) Anahtar kelimenin başı yazılırken hazır tanım önerilmez.
const kelimeBasiOnerileri = tamamla('değişke', 0, 'değişke'.length);
assert.ok(
  !kelimeBasiOnerileri.some((i) => String(i.label).startsWith('değişken değişke')),
  'anahtar kelimenin başı yazılırken hazır tanım önerilmemeli'
);
assert.ok(
  kelimeBasiOnerileri.some((i) => i.label === 'değişken'),
  'anahtar kelime tamamlaması korunmalı'
);

// 22) Deyim içinde (satır başında değilken) hazır tanım önerilmez.
const deyimOnerileri = tamamla('yazdır(asd', 0, 'yazdır(asd'.length);
assert.ok(
  !deyimOnerileri.some((i) => String(i.label).startsWith('değişken asd')),
  'deyim içinde hazır değişken tanımı önerilmemeli'
);

// 23) Metin içinde hazır tanım önerilmez.
const metinOnerileri = tamamla('değişken x := "asd', 0, 'değişken x := "asd'.length);
assert.ok(
  !metinOnerileri.some((i) => String(i.label).startsWith('değişken asd')),
  'metin içinde hazır değişken tanımı önerilmemeli'
);

/* ---------------- ad--kategori formülleri ---------------- */

// 24) `asd--` yazınca tüm formüller listelenir.
const formulBelgesi = 'asd--';
const formulOnerileri = tamamla(formulBelgesi, 0, formulBelgesi.length, '-');
assert.strictEqual(formulOnerileri.length, 7, '7 formül önerilmeli');
const formulAdlari = formulOnerileri.map((i) => i.label);
for (const etiket of [
  'değişken asd :=',
  'OndalıklıDeğişken asd := 0,0',
  'değişken asd := ""',
  'değişken asd := 0',
  'değişken asd := []',
  'değişken asd := {"anahtar": değer}',
  'fonksiyon asd()',
]) {
  assert.ok(formulAdlari.includes(etiket), `"${etiket}" formülü önerilmeli`);
}
assert.ok(
  formulOnerileri.every((i) => i.kind === vscode.CompletionItemKind.Snippet),
  'formüller şablon türünde olmalı'
);

// 25) `asd--fonksiyon` Tam Tab ile fonksiyon iskeleti yazdırır.
const fonksiyonBelgesi = 'asd--fonksiyon';
const fonksiyonOnerileri = tamamla(fonksiyonBelgesi, 0, fonksiyonBelgesi.length);
assert.strictEqual(fonksiyonOnerileri.length, 1, 'tek formül eşleşmeli');
const fonksiyonFormulu = fonksiyonOnerileri[0];
assert.strictEqual(String(fonksiyonFormulu.label), 'fonksiyon asd()');
assert.strictEqual(
  String(fonksiyonFormulu.insertText.value),
  'fonksiyon asd()\n\t$0\nson',
  'fonksiyon iskeleti ve imleç yazılmalı'
);
assert.deepStrictEqual(
  fonksiyonFormulu.range.start,
  { line: 0, character: 0 },
  'aralık adın başında olmalı'
);
assert.deepStrictEqual(
  fonksiyonFormulu.range.end,
  { line: 0, character: fonksiyonBelgesi.length },
  'aralık `ad--kategori` metninin tamamını kapsamalı'
);
assert.ok(
  String(fonksiyonFormulu.detail).includes('asd--fonksiyon'),
  'ayrıntıda yazım biçimi görünmeli'
);
assert.ok(
  String(fonksiyonFormulu.documentation.value).includes('fonksiyon asd()'),
  'belgede üretilen kod görünmeli'
);
assert.ok(
  !fonksiyonOnerileri.some((i) => i.label === 'yazdır'),
  'formül bağlamında normal öneriler karışmamalı'
);

// 26) `asd--ondalıklı` ondalık değişken şablonu üretir.
const ondalikBelgesi = 'asd--ondalıklı';
const ondalikOnerileri = tamamla(ondalikBelgesi, 0, ondalikBelgesi.length);
assert.strictEqual(ondalikOnerileri.length, 1, 'tek ondalık formülü eşleşmeli');
assert.strictEqual(
  String(ondalikOnerileri[0].insertText.value),
  'OndalıklıDeğişken asd := ${1:0,0}'
);

// 27) Türkçe harf yazmadan da takma adla bulunur.
const sozlukBelgesi = 'asd--sozluk';
const sozlukOnerileri = tamamla(sozlukBelgesi, 0, sozlukBelgesi.length);
assert.strictEqual(sozlukOnerileri.length, 1, 'takma adla tek sözlük formülü');
assert.ok(
  String(sozlukOnerileri[0].label).includes('{"anahtar": değer}'),
  'sözlük iskeleti yazılmalı'
);

// 28) Girintili satırda aralık girintiden sonra başlar.
const girintiliFormulBelgesi = '    asd--fonk';
const girintiliFormulOnerileri = tamamla(
  girintiliFormulBelgesi,
  0,
  girintiliFormulBelgesi.length
);
assert.strictEqual(girintiliFormulOnerileri.length, 1, 'takma adla fonksiyon bulunmalı');
assert.deepStrictEqual(
  girintiliFormulOnerileri[0].range.start,
  { line: 0, character: 4 },
  'aralık girintiden sonra başlamalı'
);

// 29) Bilinmeyen kategori boş liste döndürür.
assert.strictEqual(tamamla('asd--zzz', 0, 'asd--zzz'.length).length, 0);

// 30) Metin içindeki `--` formül sayılmaz.
const metinFormulBelgesi = 'değişken x := "asd--fonksiyon';
const metinFormulOnerileri = tamamla(
  metinFormulBelgesi,
  0,
  metinFormulBelgesi.length
);
assert.ok(
  !metinFormulOnerileri.some((i) => String(i.detail).startsWith('Formül')),
  'metin içinde formül önerilmemeli'
);

// 31) `-` tuşu formül bağlamı dışında öneri açmaz.
const eksiBelgesi = 'değişken x := 1 -';
assert.strictEqual(
  tamamla(eksiBelgesi, 0, eksiBelgesi.length, '-').length,
  0,
  'formül dışında - tuşu öneri açmamalı'
);

/* ---------------- pencere üyelerinin sırası ve simgesi ---------------- */

const turkuiVerisi = require('../out/veri/turkui');

// 32) `uygulama.` listesinde nesneler en üstte, kendi aralarında alfabetik.
const pencereBelgesi = [
  'içe_aktar TürkUI',
  'değişken uygulama := TürkUI.pencere("deneme")',
  'değişken b := uygulama.',
];
const pencereSatiri = 'değişken b := uygulama.';
const pencereOnerileri = tamamla(pencereBelgesi.join('\n'), 2, pencereSatiri.length, '.');
const pencereAdlari = pencereOnerileri.map((i) => i.label);

assert.strictEqual(
  pencereAdlari.length,
  turkuiVerisi.turkuiPencereUyeleri.length,
  'tüm pencere üyeleri önerilmeli'
);

const bilesenAdlari = turkuiVerisi.TURKUI_BILESEN_ADLARI;
const beklenenBilesenler = [...bilesenAdlari].sort((a, b) => a.localeCompare(b, 'tr'));
assert.deepStrictEqual(
  pencereAdlari.slice(0, beklenenBilesenler.length),
  beklenenBilesenler,
  'nesneler en üstte ve alfabetik sırada olmalı'
);

const kalanUyeler = pencereAdlari.slice(beklenenBilesenler.length);
assert.deepStrictEqual(
  kalanUyeler,
  [...kalanUyeler].sort((a, b) => a.localeCompare(b, 'tr')),
  'nesnelerden sonraki üyeler alfabetik olmalı'
);

// Türkçe alfabe sırası korunmalı: `özel`, `onayKutusu` ile `radyo` arasında.
const ozelSirasi = pencereAdlari.indexOf('özel');
assert.ok(
  ozelSirasi > pencereAdlari.indexOf('onayKutusu') && ozelSirasi < pencereAdlari.indexOf('radyo'),
  'Türkçe harf sırası (ö) korunmalı'
);

// 33) Nesneler farklı simgeyle (Class), diğer üyeler eski simgeleriyle gösterilir.
const sinifSimgesi = vscode.CompletionItemKind.Class;
const bilesenOnerileri = pencereOnerileri.filter((i) => beklenenBilesenler.includes(i.label));
assert.strictEqual(bilesenOnerileri.length, bilesenAdlari.length, 'tüm nesneler sınıflandırılmalı');
assert.ok(
  bilesenOnerileri.every((i) => i.kind === sinifSimgesi),
  'nesneler Class simgesiyle gösterilmeli'
);
assert.ok(
  pencereOnerileri
    .filter((i) => !beklenenBilesenler.includes(i.label))
    .every((i) => i.kind !== sinifSimgesi),
  'nesne olmayan üyeler Class simgesi kullanmamalı'
);

// `sortText` dizideki sırayı birebir korur (VS Code listeyi yeniden sıralamaz).
pencereOnerileri.forEach((oge, sira) => {
  assert.strictEqual(
    oge.sortText,
    `0_${String(sira).padStart(3, '0')}`,
    'sortText yazılan sırayı korumalı'
  );
});

// 34) Tarayıcı bileşeni ve takma adları aynı üyeleri önermeli.
const tarayiciUyeleri = turkuiVerisi.turkuiBilesenUyeleri('tarayıcı').map((u) => u.ad);
for (const ad of ['tarayıcı', 'webTarayıcı', 'webBrowser']) {
  const tarayiciBelgesi = [
    'içe_aktar TürkUI',
    'değişken p := TürkUI.pencere("Tarayıcı")',
    `değişken t := p.${ad}("https://ornek.test")`,
    't.',
  ];
  const tarayiciSatiri = 't.';
  const tarayiciOnerileri = tamamla(tarayiciBelgesi.join('\n'), 3, tarayiciSatiri.length, '.');
  const tarayiciAdlari = tarayiciOnerileri.map((i) => i.label);
  for (const uye of ['git', 'geri', 'ileri', 'yenile', 'durdur', 'htmlYükle', 'yakınlaştır', 'adres', 'anaSayfa']) {
    assert.ok(
      tarayiciAdlari.includes(uye),
      `"${ad}" için "${uye}" üyesi önerilmeli`
    );
  }
  assert.deepStrictEqual(
    tarayiciAdlari,
    tarayiciUyeleri,
    `"${ad}" takma adı kanonik tarayıcı üyelerini kullanmalı`
  );
}

// 35) Olay blokları `.` sonrasında parçacık (Snippet) olarak önerilmeli.
const butonBelgesi = [
  'içe_aktar TürkUI',
  'değişken p := TürkUI.pencere("Olay")',
  'değişken b := p.buton("Tamam")',
  'b.',
];
const butonOnerileri = tamamla(butonBelgesi.join('\n'), 3, 'b.'.length, '.');
const tiklandi = butonOnerileri.find((i) => i.label === 'tıklandığında');
assert.ok(tiklandi, 'buton için "tıklandığında" önerilmeli');
assert.strictEqual(
  tiklandi.kind,
  vscode.CompletionItemKind.Snippet,
  'olay bloğu Snippet simgesiyle gösterilmeli'
);
const olayMetni = String(tiklandi.insertText.value);
assert.ok(olayMetni.startsWith('tıklandığında\n\t'), 'olay bloğu iskeleti yazılmalı');
assert.ok(olayMetni.trimEnd().endsWith('son'), 'olay bloğu "son" ile kapanmalı');

// Olayı olmayan bileşenlerde (metin) olay önerilmemeli.
const metinOlayBelgesi = [
  'içe_aktar TürkUI',
  'değişken p := TürkUI.pencere("Olay")',
  'değişken m := p.metin("Etiket")',
  'm.',
];
const metinOlayOnerileri = tamamla(metinOlayBelgesi.join('\n'), 3, 'm.'.length, '.');
assert.ok(
  !metinOlayOnerileri.some((i) => i.label === 'tıklandığında'),
  'metin bileşeninde olay önerilmemeli'
);

// Pencere düzeyi olaylar da listede olmalı.
assert.ok(pencereAdlari.includes('pencereAçıldığında'), 'pencere olayları önerilmeli');
assert.ok(pencereAdlari.includes('pencereKapatılırken'), 'pencere kapanış olayı önerilmeli');

// Tarayıcı olayları önerilmeli.
const tarayiciOlayBelgesi = [
  'içe_aktar TürkUI',
  'değişken p := TürkUI.pencere("Tarayıcı")',
  'değişken t := p.tarayıcı("https://ornek.test")',
  't.',
];
const tarayiciOlayAdlari = tamamla(
  tarayiciOlayBelgesi.join('\n'),
  3,
  't.'.length,
  '.'
).map((i) => i.label);
assert.ok(tarayiciOlayAdlari.includes('yüklendiğinde'), 'tarayıcı "yüklendiğinde" olayı önerilmeli');

/* ---------------- alt klasördeki modüller ---------------- */

const tamamlamaFs = require('node:fs');
const tamamlamaOs = require('node:os');
const tamamlamaPath = require('node:path');

const geciciProje = tamamlamaFs.mkdtempSync(tamamlamaPath.join(tamamlamaOs.tmpdir(), 'turkui-tamamlama-'));
const projeKaynak = tamamlamaPath.join(geciciProje, 'src');
tamamlamaFs.mkdirSync(tamamlamaPath.join(projeKaynak, 'araclar'), { recursive: true });
tamamlamaFs.writeFileSync(tamamlamaPath.join(geciciProje, 'uygulama.json'), '{}\n');
tamamlamaFs.writeFileSync(tamamlamaPath.join(projeKaynak, 'ana.tr'), '');
tamamlamaFs.writeFileSync(tamamlamaPath.join(projeKaynak, 'araclar', 'yardimci.tr'), '');
tamamlamaFs.writeFileSync(tamamlamaPath.join(projeKaynak, 'araclar', 'renkler.tr'), '');

const satir = 'içe_aktar ar';
const altKlasorBelgesi = {
  getText: () => satir,
  lineAt: (i) => ({ text: i === 0 ? satir : '' }),
  uri: { scheme: 'file', fsPath: tamamlamaPath.join(projeKaynak, 'ana.tr') },
  fileName: tamamlamaPath.join(projeKaynak, 'ana.tr'),
};
const altOneriler = saglayici.provideCompletionItems(
  altKlasorBelgesi,
  { line: 0, character: satir.length },
  { isCancellationRequested: false },
  { triggerKind: 0 }
);
const yolOnerisi = altOneriler.find((o) => o.label === 'araclar/yardimci');
assert.ok(yolOnerisi, 'alt klasördeki modül yol olarak önerilmeli');
assert.strictEqual(yolOnerisi.detail, 'Yerel modül');
assert.strictEqual(yolOnerisi.insertText, 'araclar/yardimci', 'yol bütünüyle yazılmalı');
assert.strictEqual(yolOnerisi.range.start.character, 'içe_aktar '.length, 'yazılan yol değiştirilmeli');
tamamlamaFs.rmSync(geciciProje, { recursive: true, force: true });

console.log('tamamla testleri geçti (37 kontrol)');
