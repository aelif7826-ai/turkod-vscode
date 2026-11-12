const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { TurkodYorumlayici } = require('../out/calistir');
const { createTurkuiModulu } = require('../out/turkui');

/** TürkUI köprüsünü taklit eder ve yapılan çağrıları kaydeder. */
function sahteKopru() {
  const kayit = {
    pencereler: [],
    bilesenler: [],
    guncellemeler: [],
    gosterilenler: [],
    kapatilanlar: [],
    ileti: [],
    dosya: [],
    bildirim: [],
    hepsiKapatildi: false,
    durum: null,
  };

  const kopru = {
    baseDir: process.cwd(),
    onTurkuiCreateWindow: (baslik, id, props) => {
      kayit.pencereler.push({ baslik, id, props });
    },
    onTurkuiAddComponent: (pencereId, tur, id, props) => {
      kayit.bilesenler.push({ pencereId, tur, id, props });
    },
    onTurkuiUpdateComponent: (pencereId, id, prop, value) => {
      kayit.guncellemeler.push({ pencereId, id, prop, value });
    },
    onTurkuiShowWindow: (id) => kayit.gosterilenler.push(id),
    onTurkuiCloseWindow: (id) => kayit.kapatilanlar.push(id),
    onTurkuiIleti: async (tur, mesaj) => {
      kayit.ileti.push({ tur, mesaj });
      if (tur === 'onay') return true;
      return null;
    },
    onTurkuiSor: async (soru, varsayilan) => {
      kayit.ileti.push({ tur: 'sor', soru, varsayilan });
      return 'Mete';
    },
    onTurkuiDosya: async (tur, baslik, varsayilan, uzantilar) => {
      kayit.dosya.push({ tur, baslik, varsayilan, uzantilar });
      return tur === 'kaydet' ? 'C:\\yeni.txt' : 'C:\\secili.txt';
    },
    onTurkuiBildirim: async (baslik, icerik) => {
      kayit.bildirim.push({ baslik, icerik });
    },
    onTurkuiEkran: () => ({ genişlik: 1920, yükseklik: 1080, ölçek: 1, çalışmaAlanı: { x: 0, y: 0, genişlik: 1920, yükseklik: 1040 } }),
    onTurkuiPencereSayisi: () => 1,
    onTurkuiHepsiKapat: () => {
      kayit.hepsiKapatildi = true;
    },
    onTurkuiDurum: (fare, klavye, renk) => {
      kayit.durum = { fare, klavye, renk };
    },
  };

  return { kopru, kayit };
}

function bul(kayit, tur, sira = 0) {
  return kayit.bilesenler.filter((b) => b.tur === tur)[sira];
}

function guncelleme(kayit, id, prop) {
  return kayit.guncellemeler.filter((g) => g.id === id && g.prop === prop).at(-1);
}

(async () => {
  const { kopru, kayit } = sahteKopru();
  const cikti = [];
  const kaynak = [
    'içe_aktar TürkUI',
    '',
    'değişken p := TürkUI.pencere("Deneme")',
    'değişken etiket := p.metin("Merhaba")',
    'değişken dugme := p.buton("Tıkla")',
    'değişken giris := p.giriş("Ad")',
    'etiket.renk := renk.mavi',
    'dugme.arkaPlan := renk.kırmızı',
    'p.göster()',
    'p.başlık := "Yeni Başlık"',
    'etiket.renk := renk.yeşil',
    '',
    'dugme.tıklandığında',
    '    etiket.içerik := "Tıklandı: " + giris.değer',
    '    giris.renk := gizle',
    'son',
    '',
    'giris.değiştiğinde',
    '    etiket.içerik := "Yazı: " + giris.değer',
    'son',
    '',
    'değişken cevap := TürkUI.sor("Adın?", "Misafir")',
    'yazdır(cevap)',
    'eğer TürkUI.onay("Emin misin?") ise',
    '    yazdır("onay-tamam")',
    'son',
    'yazdır(TürkUI.dosyaSeç("Aç", "txt"))',
    'yazdır(TürkUI.ekran.genişlik)',
    'yazdır(TürkUI.pencereSayısı)',
    'TürkUI.bildirim("Başlık", "İçerik")',
  ].join('\n');

  const y = new TurkodYorumlayici(kaynak, {
    yaz: (m) => cikti.push(m),
    oku: async () => '',
    klasor: process.cwd(),
    gercekGecikme: false,
    turkui: createTurkuiModulu(kopru),
  });

  await y.calistir();

  // Pencere ve bileşenler oluşturulmalı.
  assert.strictEqual(kayit.pencereler.length, 1, 'bir pencere oluşturulmalı');
  assert.strictEqual(kayit.gosterilenler.length, 1, 'pencere gösterilmeli');

  const metin = bul(kayit, 'text');
  const buton = bul(kayit, 'button');
  const giris = bul(kayit, 'input');
  assert.ok(metin && buton && giris, 'metin, buton ve giriş bileşenleri eklenmeli');

  // Renk atamaları renk değerlerine çözülmeli.
  assert.strictEqual(metin.props.renk, '#89b4fa', 'renk.mavi metin rengine yazılmalı');
  assert.strictEqual(buton.props.arkaPlan, '#f38ba8', 'renk.kırmızı buton arka planına yazılmalı');
  const renkGuncelleme = guncelleme(kayit, metin.id, 'renk');
  assert.strictEqual(renkGuncelleme && renkGuncelleme.value, '#a6e3a1', 'sonradan atanan renk.web güncellenmeli');

  // Başlık değişimi pencereye iletilmeli.
  const baslik = guncelleme(kayit, '', '_title');
  assert.strictEqual(baslik && baslik.value, 'Yeni Başlık', 'pencere başlığı güncellenmeli');

  // Giriş olayı bileşen özelliğini uygulamalı.
  await y.turkuiOlayTetikle(giris.id, 'değiştiğinde', { değer: 'Mete' });
  let icerik = guncelleme(kayit, metin.id, 'içerik');
  assert.strictEqual(icerik && icerik.value, 'Yazı: Mete', 'giriş olayı etiketi güncellemeli');

  // Buton olayı ve `gizle` değeri.
  await y.turkuiOlayTetikle(buton.id, 'tıklandığında');
  icerik = guncelleme(kayit, metin.id, 'içerik');
  assert.strictEqual(icerik && icerik.value, 'Tıklandı: Mete', 'buton olayı giriş değerini okumalı');
  const gizleme = guncelleme(kayit, giris.id, 'renk');
  assert.strictEqual(gizleme && gizleme.value, '', '`gizle` rengi boşaltmalı');

  // Async diyaloglar ve modül özellikleri.
  const ciktiMetni = cikti.join('');
  assert.match(ciktiMetni, /Mete/, 'TürkUI.sor cevabı kullanılmalı');
  assert.match(ciktiMetni, /onay-tamam/, 'TürkUI.onay doğru dönmeli');
  assert.match(ciktiMetni, /C:\\secili\.txt/, 'dosyaSeç yolu dönmeli');
  assert.match(ciktiMetni, /1920/, 'ekran.genişlik okunmalı');
  assert.match(ciktiMetni, /(^|\n)1(\n|$)/, 'pencereSayısı okunmalı');
  assert.strictEqual(kayit.bildirim.length, 1, 'bildirim köprüye gitmeli');
  assert.ok(kayit.durum && kayit.durum.fare && kayit.durum.klavye && kayit.durum.renk, 'fare/klavye/renk paylaşılmalı');

  // `hepsiKapat` köprüyü çağırmalı.
  const ikinci = sahteKopru();
  const y2 = new TurkodYorumlayici('içe_aktar TürkUI\nTürkUI.hepsiKapat()\n', {
    yaz: () => undefined,
    oku: async () => '',
    klasor: process.cwd(),
    gercekGecikme: false,
    turkui: createTurkuiModulu(ikinci.kopru),
  });
  await y2.calistir();
  assert.strictEqual(ikinci.kayit.hepsiKapatildi, true, 'hepsiKapat köprüye gitmeli');

  // Şov dosyası tüm bileşenleri ve olay bloklarını ayrıştırabilmeli.
  const ucuncu = sahteKopru();
  const y3 = new TurkodYorumlayici(fs.readFileSync('test/turkui_showcase.tr', 'utf8'), {
    yaz: () => undefined,
    oku: async () => '',
    klasor: process.cwd(),
    gercekGecikme: false,
    turkui: createTurkuiModulu(ucuncu.kopru),
  });
  await y3.calistir();
  assert.strictEqual(ucuncu.kayit.pencereler.length, 1, 'şov dosyası bir pencere açmalı');
  assert.ok(ucuncu.kayit.bilesenler.length > 30, 'şov dosyası tüm bileşenleri eklemeli');
  assert.ok(y3.turkuiOlaylari.size > 10, 'şov dosyası olay işleyicilerini kaydetmeli');

  // Pencere düzeyi olaylar: `göster()` öncesi ve sonrası kayıt.
  const dorduncu = sahteKopru();
  const y4 = new TurkodYorumlayici(
    [
      'içe_aktar TürkUI',
      'değişken p := TürkUI.pencere("Olay")',
      'p.pencereAçıldığında',
      '    yazdır("önce-açıldı")',
      'son',
      'p.göster()',
    ].join('\n'),
    {
      yaz: (m) => dorduncu.kayit.ileti.push({ tur: 'çıktı', mesaj: m }),
      oku: async () => '',
      klasor: process.cwd(),
      gercekGecikme: false,
      turkui: createTurkuiModulu(dorduncu.kopru),
    }
  );
  await y4.calistir();
  const pencereId = dorduncu.kayit.pencereler[0].id;
  await y4.turkuiOlayTetikle(pencereId, 'pencereAçıldığında');
  assert.strictEqual(
    dorduncu.kayit.ileti.filter((k) => k.tur === 'çıktı').map((k) => k.mesaj).join(''),
    'önce-açıldı\n',
    'göster() öncesi kaydedilen pencere olayı çalışmalı'
  );

  const besinci = sahteKopru();
  const y5 = new TurkodYorumlayici(
    [
      'içe_aktar TürkUI',
      'değişken p := TürkUI.pencere("Olay")',
      'p.göster()',
      'p.pencereAçıldığında',
      '    yazdır("sonra-açıldı")',
      'son',
    ].join('\n'),
    {
      yaz: (m) => besinci.kayit.ileti.push({ tur: 'çıktı', mesaj: m }),
      oku: async () => '',
      klasor: process.cwd(),
      gercekGecikme: false,
      turkui: createTurkuiModulu(besinci.kopru),
    }
  );
  await y5.calistir();
  assert.strictEqual(
    besinci.kayit.ileti.filter((k) => k.tur === 'çıktı').map((k) => k.mesaj).join(''),
    'sonra-açıldı\n',
    'göster() sonrası kaydedilen pencere açılış olayı da çalışmalı'
  );

  // İçe aktarılan bir .tr modülündeki TürkUI bileşen olayları ana yorumlayıcıdan çalışmalı.
  const altinci = sahteKopru();
  const y6 = new TurkodYorumlayici('içe_aktar turkui_yardimci\n', {
    yaz: () => undefined,
    oku: async () => '',
    klasor: process.cwd(),
    gercekGecikme: false,
    modulCoz: (ad) => {
      const aday = path.join(process.cwd(), 'test', `${ad}.tr`);
      return fs.existsSync(aday) ? aday : undefined;
    },
    turkui: createTurkuiModulu(altinci.kopru),
  });
  await y6.calistir();
  const yardimciDugme = altinci.kayit.bilesenler.find((b) => b.tur === 'button');
  const yardimciEtiket = altinci.kayit.bilesenler.find((b) => b.tur === 'text');
  assert.ok(yardimciDugme && yardimciEtiket, 'modül bileşenleri eklenmeli');
  await y6.turkuiOlayTetikle(yardimciDugme.id, 'tıklandığında');
  const yardimciGuncel = guncelleme(altinci.kayit, yardimciEtiket.id, 'içerik');
  assert.strictEqual(
    yardimciGuncel && yardimciGuncel.value,
    'yardımcı tıklandı',
    'modüldeki olay ana yorumlayıcıdan çalışmalı'
  );

  // `=` ataması Studio uyumlu olmalı; `değişken b = ...` bileşen oluşturmalı.
  const yedinci = sahteKopru();
  const y7 = new TurkodYorumlayici(
    [
      'içe_aktar TürkUI',
      'değişken p = TürkUI.pencere("Eşittir")',
      'değişken b = p.buton("Tamam")',
      'p.göster()',
      'p.başlık = "Yeni"',
      'b.göster()',
    ].join('\n'),
    {
      yaz: () => undefined,
      oku: async () => '',
      klasor: process.cwd(),
      gercekGecikme: false,
      turkui: createTurkuiModulu(yedinci.kopru),
    }
  );
  await y7.calistir();
  assert.strictEqual(yedinci.kayit.pencereler.length, 1, '`=` ile pencere oluşturulmalı');
  assert.ok(bul(yedinci.kayit, 'button'), '`=` ile buton oluşturulmalı');
  const esittirBaslik = guncelleme(yedinci.kayit, '', '_title');
  assert.strictEqual(esittirBaslik && esittirBaslik.value, 'Yeni', '`=` ile özellik atanmalı');

  // Yeni nesil bileşenler: kutu çocukları, ilerleme, sekme, özel HTML, canvas, stil/sınıf.
  const sekizinci = sahteKopru();
  const y8 = new TurkodYorumlayici(
    [
      'içe_aktar TürkUI',
      'değişken p := TürkUI.pencere("Yeni")',
      'değişken k := p.kutu()',
      'değişken b := p.buton("İç")',
      'k.ekle(b)',
      'değişken pr := p.ilerleme()',
      'değişken sk := p.sekme()',
      'sk.ekle("Bir")',
      'sk.ekle("İki")',
      'değişken oz := p.özel("<b>Merhaba</b>", "b { color: red; }")',
      'değişken cv := p.canvas(320, 200)',
      'cv.arkaPlanDoldur(renk.mavi)',
      'cv.çizgi(0, 0, 10, 10)',
      'cv.yazı("Merhaba", 5, 5)',
      'p.stil("body { background: #000; }")',
      'p.göster()',
      'pr.artır(25)',
      'pr.maksimum := 50',
      'pr.değer := 40',
      'sk.seç("Bir")',
      'sk.temizle()',
      'oz.html := "<i>Yeni</i>"',
      'oz.sınıf := "kart"',
      'oz.stil := "color: red"',
      'cv.çizgi(1, 2, 3, 4)',
      'p.herZamanÜstte := Doğru',
      'p.css("body { color: #fff; }")',
    ].join('\n'),
    {
      yaz: () => undefined,
      oku: async () => '',
      klasor: process.cwd(),
      gercekGecikme: false,
      turkui: createTurkuiModulu(sekizinci.kopru),
    }
  );
  await y8.calistir();

  const kutu = bul(sekizinci.kayit, 'box');
  const icButon = bul(sekizinci.kayit, 'button');
  const ilerleme = bul(sekizinci.kayit, 'progress');
  const sekme = bul(sekizinci.kayit, 'tab');
  const ozel = bul(sekizinci.kayit, 'custom');
  const tuval = bul(sekizinci.kayit, 'canvas');
  assert.ok(kutu && icButon && ilerleme && sekme && ozel && tuval, 'yeni bileşenler eklenmeli');

  // Kutu çocuğu, gösterim öncesi `_parentId` ile taşınmalı.
  assert.strictEqual(icButon.props._parentId, kutu.id, 'kutu çocuğu ebeveyne bağlanmalı');

  // İlerleme değeri görsel olarak güncellenmeli.
  const ilerlemeDeger = guncelleme(sekizinci.kayit, ilerleme.id, 'değer');
  assert.strictEqual(ilerlemeDeger && ilerlemeDeger.value, 40, 'ilerleme değeri güncellenmeli');
  const ilerlemeMaks = guncelleme(sekizinci.kayit, ilerleme.id, 'maksimum');
  assert.strictEqual(ilerlemeMaks && ilerlemeMaks.value, 50, 'ilerleme maksimumu güncellenmeli');

  // Sekmeler gösterim öncesi sıraya alınmalı, seçim ve temizleme iletilmeli.
  const sekmeEklemeleri = sekizinci.kayit.guncellemeler.filter(
    (g) => g.id === sekme.id && g.prop === '_addTab'
  );
  assert.deepStrictEqual(
    sekmeEklemeleri.map((g) => g.value),
    ['Bir', 'İki'],
    'sekme öğeleri gösterimden sonra eklenmeli'
  );
  const sekmeSecim = guncelleme(sekizinci.kayit, sekme.id, '_selectTab');
  assert.strictEqual(sekmeSecim && sekmeSecim.value, 'Bir', 'sekme seçimi iletilmeli');
  assert.ok(guncelleme(sekizinci.kayit, sekme.id, '_clearTabs'), 'sekme temizleme iletilmeli');

  // Özel bileşen HTML/CSS ve stil/sınıf desteklemeli.
  assert.strictEqual(ozel.props.html, '<b>Merhaba</b>', 'özel HTML taşınmalı');
  assert.strictEqual(ozel.props.css, 'b { color: red; }', 'özel CSS taşınmalı');
  const ozelHtml = guncelleme(sekizinci.kayit, ozel.id, 'html');
  assert.strictEqual(ozelHtml && ozelHtml.value, '<i>Yeni</i>', 'özel HTML güncellenmeli');
  const ozelSinif = guncelleme(sekizinci.kayit, ozel.id, 'sınıf');
  assert.strictEqual(ozelSinif && ozelSinif.value, 'kart', 'sınıf güncellenmeli');
  const ozelStil = guncelleme(sekizinci.kayit, ozel.id, 'stil');
  assert.strictEqual(ozelStil && ozelStil.value, 'color: red', 'bileşen stili güncellenmeli');

  // Canvas boyutu ve komutları doğru sırayla iletilmeli.
  assert.strictEqual(tuval.props.genişlik, 320, 'canvas genişliği taşınmalı');
  assert.strictEqual(tuval.props.yükseklik, 200, 'canvas yüksekliği taşınmalı');
  const tuvalKomutlari = sekizinci.kayit.guncellemeler.filter(
    (g) => g.id === tuval.id && g.prop === '_canvasKomut'
  );
  assert.ok(tuvalKomutlari.length >= 4, 'canvas komutları gösterimde yeniden oynatılmalı');
  assert.strictEqual(tuvalKomutlari[0].value.komut, 'arkaPlan', 'ilk komut arka plan olmalı');
  assert.strictEqual(tuvalKomutlari[1].value.komut, 'çizgi', 'ikinci komut çizgi olmalı');
  assert.strictEqual(tuvalKomutlari[2].value.komut, 'yazı', 'üçüncü komut yazı olmalı');
  assert.strictEqual(tuvalKomutlari.at(-1).value.komut, 'çizgi', 'sonradan çizgi hemen iletilmeli');

  // Pencere düzeyi CSS ve canlı pencere özellikleri.
  const pencereCss = guncelleme(sekizinci.kayit, '', '_css');
  assert.strictEqual(pencereCss && pencereCss.value, 'body { color: #fff; }', 'pencere CSS güncellenmeli');
  const ustte = guncelleme(sekizinci.kayit, '', 'herZamanÜstte');
  assert.strictEqual(ustte && ustte.value, true, 'canlı pencere özelliği iletilmeli');

  // `TürkUI.betik` içinden başka pencereleri yönetme (düğme.tıklandığında ->
  // uygulama2.göster()). Betik pencerenin içinde çalıştığı için komut uzantıya
  // iletilir; burada yorumlayıcı tarafını doğruluyoruz.
  const dokuzuncu = sahteKopru();
  const y9 = new TurkodYorumlayici(
    [
      'içe_aktar TürkUI',
      'değişken uygulama := TürkUI.pencere("Ana")',
      'değişken uygulama2 := TürkUI.pencere("İkinci")',
      'uygulama2.gizle()',
      'değişken düğme := uygulama.buton("Aç")',
      'TürkUI.betik {',
      '    uygulama(',
      '        düğme.olayDinle("tıklandığında", fonksiyon() {',
      '            uygulama2.göster()',
      '        })',
      '    )',
      '}',
      'uygulama.göster()',
    ].join('\n'),
    {
      yaz: () => undefined,
      oku: async () => '',
      klasor: process.cwd(),
      gercekGecikme: false,
      turkui: createTurkuiModulu(dokuzuncu.kopru),
    }
  );
  await y9.calistir();

  const betikPaketi = guncelleme(dokuzuncu.kayit, '', '_betik');
  assert.ok(betikPaketi, 'betik paketi pencereye gönderilmeli');
  const pencerelerHaritasi = betikPaketi.value.pencereler;
  assert.deepStrictEqual(
    Object.keys(pencerelerHaritasi).sort(),
    ['uygulama', 'uygulama2'],
    'betik paketi pencere adlarını taşımalı'
  );
  assert.strictEqual(
    pencerelerHaritasi.uygulama,
    dokuzuncu.kayit.pencereler[0].id,
    'ana pencere kimliği eşlenmeli'
  );
  assert.ok(pencerelerHaritasi.uygulama2, 'gizli pencerenin kimliği de eşlenmeli');
  assert.strictEqual(betikPaketi.value.harita.düğme, bul(dokuzuncu.kayit, 'button').id, 'bileşen haritası korunmalı');

  // Betikten gelen komut ikinci pencereyi göstermeli.
  const ikinciId = pencerelerHaritasi.uygulama2;
  assert.strictEqual(dokuzuncu.kayit.pencereler.length, 1, 'gizli pencere oluşturulmamalı');
  y9.pencereKomutu(ikinciId, 'göster');
  assert.ok(
    dokuzuncu.kayit.gosterilenler.includes(ikinciId),
    'betik komutu pencereyi göstermeli'
  );
  assert.strictEqual(dokuzuncu.kayit.pencereler.length, 2, 'komut ikinci pencereyi oluşturmalı');

  // Bilinmeyen komut yok sayılmalı.
  y9.pencereKomutu(ikinciId, 'patlat');
  assert.strictEqual(dokuzuncu.kayit.pencereler.length, 2, 'bilinmeyen komut yok sayılmalı');

  // `geçiş: 1` gibi çıplak sayı saniye olarak yorumlanmalı.
  const onuncu = sahteKopru();
  const y10 = new TurkodYorumlayici(
    [
      'içe_aktar TürkUI',
      'değişken p := TürkUI.pencere("Geçiş")',
      'değişken b := p.buton("Tamam")',
      'TürkUI.stil {',
      '    b(',
      '        geçiş: 1',
      '    )',
      '}',
      'p.göster()',
    ].join('\n'),
    {
      yaz: () => undefined,
      oku: async () => '',
      klasor: process.cwd(),
      gercekGecikme: false,
      turkui: createTurkuiModulu(onuncu.kopru),
    }
  );
  await y10.calistir();
  const gecisButonu = bul(onuncu.kayit, 'button');
  assert.ok(gecisButonu, 'geçiş stilli buton oluşmalı');
  assert.match(String(gecisButonu.props.stil || ''), /geçiş:\s*1s/, 'çıplak sayı saniye olmalı');

  // Gösterim öncesi yapılan seçimler `göster()` sırasında uygulanmalı.
  const onBirinci = sahteKopru();
  const y11 = new TurkodYorumlayici(
    [
      'içe_aktar TürkUI',
      'değişken p := TürkUI.pencere("Seçim")',
      'değişken l := p.liste()',
      'l.ekle("Bir")',
      'l.ekle("İki")',
      'l.seç(1)',
      'değişken c := p.seçimKutusu()',
      'c.ekle("A")',
      'c.ekle("B")',
      'c.seç(0)',
      'değişken s := p.sekme()',
      's.ekle("Genel")',
      's.ekle("Detay")',
      's.seç("Detay")',
      'p.göster()',
    ].join('\n'),
    {
      yaz: () => undefined,
      oku: async () => '',
      klasor: process.cwd(),
      gercekGecikme: false,
      turkui: createTurkuiModulu(onBirinci.kopru),
    }
  );
  await y11.calistir();

  const listeSecim = guncelleme(onBirinci.kayit, 'lst_1', '_selectIndex');
  assert.strictEqual(listeSecim && listeSecim.value, 1, 'liste seçimi gösterimde uygulanmalı');

  const kutuSecim = guncelleme(onBirinci.kayit, 'cmb_1', '_selectIndex');
  assert.strictEqual(kutuSecim && kutuSecim.value, 0, 'seçim kutusu seçimi gösterimde uygulanmalı');

  const sekmeSecim2 = guncelleme(onBirinci.kayit, 'tab_1', '_selectTab');
  assert.strictEqual(sekmeSecim2 && sekmeSecim2.value, 'Detay', 'sekme seçimi gösterimde uygulanmalı');

  // Seçimler öğe ekleme kayıtlarından SONRA gelmeli.
  const sekmeEklemeleri2 = onBirinci.kayit.guncellemeler
    .filter((g) => g.id === 'tab_1')
    .map((g) => g.prop);
  assert.ok(
    sekmeEklemeleri2.indexOf('_selectTab') > sekmeEklemeleri2.lastIndexOf('_addTab'),
    'seçim öğeler eklendikten sonra uygulanmalı'
  );

  // Gömülü web tarayıcı bileşeni: adres, gezinme komutları ve takma adlar.
  const onIkinci = sahteKopru();
  const y12 = new TurkodYorumlayici(
    [
      'içe_aktar TürkUI',
      'değişken p := TürkUI.pencere("Tarayıcı")',
      'değişken t := p.tarayıcı("example.com")',
      't.anaSayfa := "https://turkod.example"',
      'değişken sonuc := p.metin("")',
      't.yüklendiğinde',
      '    sonuc.içerik := t.başlık',
      'son',
      't.hataOluştuğunda',
      '    sonuc.içerik := t.hata',
      'son',
      'p.göster()',
      't.git("https://ornek.test/sayfa")',
      't.geri()',
      't.ileri()',
      't.yenile()',
      't.durdur()',
      't.htmlYükle("<h1>Merhaba</h1>")',
      't.yakınlaştır(1.5)',
      'değişken w := p.webBrowser("https://takma.test")',
      'değişken w2 := p.webTarayıcı("https://takma2.test")',
    ].join('\n'),
    {
      yaz: () => undefined,
      oku: async () => '',
      klasor: process.cwd(),
      gercekGecikme: false,
      turkui: createTurkuiModulu(onIkinci.kopru),
    }
  );
  await y12.calistir();

  const tarayici = bul(onIkinci.kayit, 'webBrowser', 0);
  assert.ok(tarayici, 'tarayıcı bileşeni oluşmalı');
  assert.strictEqual(tarayici.props.adres, 'example.com', 'başlangıç adresi taşınmalı');
  assert.strictEqual(onIkinci.kayit.bilesenler.filter((b) => b.tur === 'webBrowser').length, 3, 'takma adlar aynı bileşeni üretmeli');

  const adresGuncellemesi = guncelleme(onIkinci.kayit, tarayici.id, 'adres');
  assert.strictEqual(adresGuncellemesi && adresGuncellemesi.value, 'https://ornek.test/sayfa', 'git adresi iletmeli');
  const htmlGuncellemesi = guncelleme(onIkinci.kayit, tarayici.id, 'html');
  assert.strictEqual(htmlGuncellemesi && htmlGuncellemesi.value, '<h1>Merhaba</h1>', 'htmlYükle içeriği iletmeli');
  const yakinlastirma = guncelleme(onIkinci.kayit, tarayici.id, 'yakınlaştırma');
  assert.strictEqual(yakinlastirma && yakinlastirma.value, 1.5, 'yakınlaştırma oranı iletilmeli');

  const tarayiciKomutlari = onIkinci.kayit.guncellemeler
    .filter((g) => g.id === tarayici.id)
    .map((g) => g.prop);
  for (const komut of ['_webGeri', '_webIleri', '_webYenile', '_webDurdur']) {
    assert.ok(tarayiciKomutlari.includes(komut), `${komut} komutu iletilmeli`);
  }

  // Tarayıcı olayları bileşen özelliklerini ve kullanıcı işleyicisini çalıştırmalı.
  const sonucMetni = bul(onIkinci.kayit, 'text');
  await y12.turkuiOlayTetikle(tarayici.id, 'yüklendiğinde', {
    adres: 'https://ornek.test/sayfa',
    başlık: 'Örnek Sayfa',
    yükleniyor: false,
  });
  const baslikGuncellemesi = guncelleme(onIkinci.kayit, sonucMetni.id, 'içerik');
  assert.strictEqual(
    baslikGuncellemesi && baslikGuncellemesi.value,
    'Örnek Sayfa',
    'yüklendiğinde olayı başlığı işleyiciye taşımalı'
  );

  await y12.turkuiOlayTetikle(tarayici.id, 'hataOluştuğunda', {
    hata: 'Sayfa bulunamadı',
    hataKodu: -105,
  });
  const hataGuncellemesi = guncelleme(onIkinci.kayit, sonucMetni.id, 'içerik');
  assert.strictEqual(
    hataGuncellemesi && hataGuncellemesi.value,
    'Sayfa bulunamadı',
    'hataOluştuğunda olayı hata metnini taşımalı'
  );

  console.log('turkui testleri geçti');
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
