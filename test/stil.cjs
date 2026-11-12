// `stil { ... }` bloğunun testleri.
const assert = require('node:assert');
const { TurkodYorumlayici } = require('../out/calistir');
const { createTurkuiModulu } = require('../out/turkui');

/** TürkUI köprüsünü taklit eder. */
function sahteKopru() {
  const kayit = { bilesenler: [], guncellemeler: [] };
  return {
    kayit,
    kopru: {
      baseDir: process.cwd(),
      onTurkuiCreateWindow: () => {},
      onTurkuiAddComponent: (pencereId, tur, id, props) => kayit.bilesenler.push({ tur, id, props }),
      onTurkuiUpdateComponent: (pencereId, id, prop, value) => kayit.guncellemeler.push({ id, prop, value }),
      onTurkuiShowWindow: () => {},
      onTurkuiCloseWindow: () => {},
      onTurkuiIleti: async () => null,
      onTurkuiSor: async () => '',
      onTurkuiDosya: async () => '',
      onTurkuiBildirim: async () => {},
      onTurkuiEkran: () => ({ genişlik: 1920, yükseklik: 1080, ölçek: 1, çalışmaAlanı: { x: 0, y: 0, genişlik: 1920, yükseklik: 1040 } }),
      onTurkuiPencereSayisi: () => 1,
      onTurkuiHepsiKapat: () => {},
      onTurkuiDurum: () => {},
    },
  };
}

function calistir(kaynak) {
  const { kayit, kopru } = sahteKopru();
  const y = new TurkodYorumlayici(kaynak, {
    yaz: () => {},
    oku: async () => '',
    klasor: process.cwd(),
    gercekGecikme: false,
    turkui: createTurkuiModulu(kopru),
  });
  return { y, kayit };
}

/** Bileşene uygulanan son stil metni. */
function stilBul(kayit, id) {
  const guncelleme = kayit.guncellemeler.filter((g) => g.id === id && g.prop === 'stil').pop();
  if (guncelleme) return String(guncelleme.value || '');
  const bilesen = kayit.bilesenler.find((b) => b.id === id);
  return String((bilesen && bilesen.props && bilesen.props.stil) || '');
}

let gecen = 0;
function ok(ad) {
  gecen++;
  console.log('  ✓ ' + ad);
}

(async () => {
  console.log('stil bloğu testleri');

  // ── 1. Temel kullanım: iki bileşen, Türkçe özellikler ──
  {
    const { y, kayit } = calistir(`
içe_aktar TürkUI
değişken uygulama := TürkUI.pencere("deneme")
değişken buton1 := uygulama.buton("bir")
değişken buton2 := uygulama.buton("iki")

TürkUI.stil {
    buton1(
        arkaPlanRengi: kırmızı
        renk: siyah
    )
    buton2(
        kenarYuvarlaklığı: 12px
    )
}
uygulama.göster()
`);
    await y.calistir();
    const s1 = stilBul(kayit, 'btn_1');
    const s2 = stilBul(kayit, 'btn_2');
    assert.ok(s1.includes('arkaPlanRengi: kırmızı;'), 'buton1 stili: ' + s1);
    assert.ok(s1.includes('renk: siyah;'), 'buton1 stili: ' + s1);
    assert.ok(s2.includes('kenarYuvarlaklığı: 12px;'), 'buton2 stili: ' + s2);
    ok('iki bileşene ayrı ayrı stil yazıldı');
  }

  // ── 2. Değişken ve renk işlevi ile değer ──
  {
    const { y, kayit } = calistir(`
içe_aktar TürkUI
değişken uygulama := TürkUI.pencere("deneme")
değişken buton1 := uygulama.buton("bir")
değişken anaRenk := "#313244"
değişken kenar := 4

TürkUI.stil {
    buton1(
        arkaPlan: anaRenk
        kenarYuvarlaklığı: kenar
        kenarRengi: renk.rgb(30, 30, 46)
    )
}
uygulama.göster()
`);
    await y.calistir();
    const s = stilBul(kayit, 'btn_1');
    assert.ok(s.includes('arkaPlan: #313244;'), 'gelen: ' + s);
    assert.ok(s.includes('kenarYuvarlaklığı: 4;'), 'gelen: ' + s);
    assert.ok(s.includes('kenarRengi: rgb(30,30,46);'), 'gelen: ' + s);
    ok('değişken değerler ve renk.rgb() çözüldü');
  }

  // ── 3. Ham CSS değerleri (düz, gölge, tam, önemli) ──
  {
    const { y, kayit } = calistir(`
içe_aktar TürkUI
değişken uygulama := TürkUI.pencere("deneme")
değişken kutu := uygulama.yatayDüzen()

TürkUI.stil {
    kutu(
        kenar: 1px düz #313244
        gölge: 0 4px 12px #00000040
        genişlik: tam
    )
}
uygulama.göster()
`);
    await y.calistir();
    const s = stilBul(kayit, 'lay_1');
    assert.ok(s.includes('kenar: 1px düz #313244;'), 'gelen: ' + s);
    assert.ok(s.includes('gölge: 0 4px 12px #00000040;'), 'gelen: ' + s);
    assert.ok(s.includes('genişlik: tam;'), 'gelen: ' + s);
    ok('ham CSS değerleri olduğu gibi korundu');
  }

  // ── 4. Tek satırda yazım ──
  {
    const { y, kayit } = calistir(`
içe_aktar TürkUI
değişken uygulama := TürkUI.pencere("deneme")
değişken metin1 := uygulama.metin("deneme")

TürkUI.stil { metin1( renk: mavi; yazıBoyutu: 18px ) }
uygulama.göster()
`);
    await y.calistir();
    const s = stilBul(kayit, 'txt_1');
    assert.ok(s.includes('renk: mavi;'), 'gelen: ' + s);
    assert.ok(s.includes('yazıBoyutu: 18px;'), 'gelen: ' + s);
    ok('tek satırlık blok ve ";" ayracı çalışıyor');
  }

  // ── 4b. Durum grupları (`üzerineGelince`, `basılıyken`, ...) ──
  {
    const { y, kayit } = calistir(`
içe_aktar TürkUI
değişken uygulama := TürkUI.pencere("deneme")
değişken buton1 := uygulama.buton("bir")

TürkUI.stil {
    buton1(
        arkaPlanRengi: mavi
        geçiş: 0.2s
        üzerineGelince(
            arkaPlanRengi: kırmızı
            dönüşüm: ölçek(1.05)
        )
        basılıyken(
            opaklık: 0.8
        )
    )
}
uygulama.göster()
`);
    await y.calistir();
    const s = stilBul(kayit, 'btn_1');
    assert.ok(s.includes('& { arkaPlanRengi: mavi; geçiş: 0.2s; }'), 'temel kural: ' + s);
    assert.ok(
      s.includes('&üzerineGelince { arkaPlanRengi: kırmızı; dönüşüm: ölçek(1.05); }'),
      'hover kuralı: ' + s
    );
    assert.ok(s.includes('&basılıyken { opaklık: 0.8; }'), 'active kuralı: ' + s);
    ok('durum grupları CSS kurallarına dönüştürüldü');
  }

  // Yalnızca durum grubu varsa gereksiz `& { }` üretilmez.
  {
    const { y, kayit } = calistir(`
içe_aktar TürkUI
değişken uygulama := TürkUI.pencere("deneme")
değişken metin1 := uygulama.metin("deneme")

TürkUI.stil {
    metin1(
        üzerineGelince(
            renk: kırmızı
        )
    )
}
uygulama.göster()
`);
    await y.calistir();
    const s = stilBul(kayit, 'txt_1');
    assert.strictEqual(s, '&üzerineGelince { renk: kırmızı; }', 'gelen: ' + s);
    ok('yalnızca durum grubu doğru üretildi');
  }

  // Aynı satırda hedef ve durum yazımı.
  {
    const { y, kayit } = calistir(`
içe_aktar TürkUI
değişken uygulama := TürkUI.pencere("deneme")
değişken metin1 := uygulama.metin("deneme")

TürkUI.stil { metin1( renk: mavi; üzerineGelince( renk: kırmızı ) ) }
uygulama.göster()
`);
    await y.calistir();
    const s = stilBul(kayit, 'txt_1');
    assert.ok(s.includes('& { renk: mavi; }'), 'temel kural: ' + s);
    assert.ok(s.includes('&üzerineGelince { renk: kırmızı; }'), 'durum kuralı: ' + s);
    ok('aynı satırda yazılan durum grubu çalışıyor');
  }

  // Pencere hedefinde de durum grubu desteklenir.
  {
    const { y, kayit } = calistir(`
içe_aktar TürkUI
değişken uygulama := TürkUI.pencere("deneme")

TürkUI.stil {
    uygulama(
        arkaPlanRengi: siyah
        üzerineGelince(
            arkaPlanRengi: #1e1e2e
        )
    )
}
uygulama.göster()
`);
    await y.calistir();
    const pencereStili = kayit.guncellemeler.filter((g) => g.id === '' && g.prop === '_css').pop();
    assert.ok(pencereStili, 'pencere düzeyi stil gönderilmeli');
    const deger = String(pencereStili.value);
    assert.ok(deger.includes('& { arkaPlanRengi: siyah; }'), 'pencere temel kuralı: ' + deger);
    assert.ok(deger.includes('&üzerineGelince {'), 'pencere durum kuralı: ' + deger);
    ok('pencere hedefinde durum grubu çalışıyor');
  }

  // Bilinmeyen durum anlaşılır hata verir.
  {
    const { y } = calistir(`
içe_aktar TürkUI
değişken uygulama := TürkUI.pencere("deneme")
değişken buton1 := uygulama.buton("bir")

TürkUI.stil {
    buton1(
        üzerineGelincee(
            renk: kırmızı
        )
    )
}
`);
    await assert.rejects(y.calistir(), (e) => /bilinmiyor/.test(e.message), 'bilinmeyen durum hatası');
    ok('bilinmeyen durum anlaşılır hata veriyor');
  }

  // Durum grupları iç içe yazılamaz.
  {
    const { y } = calistir(`
içe_aktar TürkUI
değişken uygulama := TürkUI.pencere("deneme")
değişken buton1 := uygulama.buton("bir")

TürkUI.stil {
    buton1(
        üzerineGelince(
            basılıyken(
                renk: kırmızı
            )
        )
    )
}
`);
    await assert.rejects(y.calistir(), (e) => /iç içe/.test(e.message), 'iç içe durum hatası');
    ok('iç içe durum grupları reddediliyor');
  }

  // Değere bitişik yazılan durum grubu anlaşılır hata verir.
  {
    const { y } = calistir(`
içe_aktar TürkUI
değişken uygulama := TürkUI.pencere("deneme")
değişken buton1 := uygulama.buton("bir")

TürkUI.stil {
    buton1(
        renk: mavi üzerineGelince( renk: kırmızı )
    )
}
`);
    await assert.rejects(y.calistir(), (e) => /yeni satırda/.test(e.message), 'bitişik durum hatası');
    ok('değere bitişik yazılan durum grubu anlaşılır hata veriyor');
  }

  // ── 5. Hatalar ──
  {
    const { y } = calistir(`
içe_aktar TürkUI
değişken uygulama := TürkUI.pencere("deneme")
değişken buton1 := uygulama.buton("bir")

TürkUI.stil {
    buton1
}
`);
    await assert.rejects(y.calistir(), (e) => /bekleniyordu/.test(e.message), 'eksik "(" hatası');
    ok('eksik "(" anlaşılır hata veriyor');
  }

  // Pencere hedefi, `pencere.stil(css)` ile aynı etkiyi yapar.
  {
    const { y, kayit } = calistir(`
içe_aktar TürkUI
değişken uygulama := TürkUI.pencere("deneme")

TürkUI.stil {
    uygulama(
        renk: kırmızı
    )
}
uygulama.göster()
`);
    await y.calistir();
    const pencereStili = kayit.guncellemeler.filter((g) => g.id === '' && g.prop === '_css').pop();
    assert.ok(pencereStili, 'pencere düzeyi stil gönderilmeli');
    assert.ok(
      String(pencereStili.value).includes('renk: kırmızı;'),
      'pencere stili: ' + pencereStili.value
    );
    ok('pencere hedefi pencere düzeyi stil uyguluyor');
  }

  {
    const { y } = calistir(`
içe_aktar TürkUI
değişken uygulama := TürkUI.pencere("deneme")
değişken sayı := 5

TürkUI.stil {
    sayı(
        renk: kırmızı
    )
}
`);
    await assert.rejects(
      y.calistir(),
      (e) => /TürkUI bileşeni ya da penceresi değil/.test(e.message),
      'TürkUI dışı hedef reddedilmeli'
    );
    ok('TürkUI dışı hedef reddediliyor');
  }

  {
    const { y } = calistir(`
içe_aktar TürkUI
değişken uygulama := TürkUI.pencere("deneme")
değişken buton1 := uygulama.buton("bir")

TürkUI.stil {
    buton1(
        renk kırmızı
    )
}
`);
    await assert.rejects(y.calistir(), (e) => /özellik: değer/.test(e.message), 'iki nokta eksikse hata');
    ok('"özellik: değer" biçimi denetleniyor');
  }

  {
    const { y } = calistir(`
içe_aktar TürkUI
değişken uygulama := TürkUI.pencere("deneme")
değişken buton1 := uygulama.buton("bir")

TürkUI.stil {
    olmayanBilesen(
        renk: kırmızı
    )
}
`);
    await assert.rejects(y.calistir(), (e) => /adlı değişken yok/.test(e.message), 'tanımsız hedef hatası');
    ok('tanımsız hedef anlaşılır hata veriyor');
  }

  // ── 6. Blok adı TürkUI modülüne bağlı ──
  {
    const { y, kayit } = calistir(`
içe_aktar TürkUI
değişken uygulama := TürkUI.pencere("deneme")
değişken buton1 := uygulama.buton("bir")

turkui.stil {
    buton1(
        renk: mavi
    )
}
uygulama.göster()
`);
    await y.calistir();
    const s = stilBul(kayit, 'btn_1');
    assert.ok(s.includes('renk: mavi;'), 'küçük harfli modül adı: ' + s);
    ok('küçük harfli `turkui.stil` çalışıyor');
  }

  {
    const { y } = calistir(`
içe_aktar TürkUI
değişken uygulama := TürkUI.pencere("deneme")
değişken buton1 := uygulama.buton("bir")

stil {
    buton1(
        renk: kırmızı
    )
}
`);
    await assert.rejects(
      y.calistir(),
      (e) => /TürkUI modülüne aittir/.test(e.message) && /TürkUI\.stil/.test(e.message),
      'başıboş `stil` bloğu modüle yönlendirmeli'
    );
    ok('başıboş `stil {` yerine `TürkUI.stil` öneriliyor');
  }

  {
    const { y } = calistir(`
içe_aktar TürkUI
değişken uygulama := TürkUI.pencere("deneme")

uygulama.stil {
    uygulama(
        renk: kırmızı
    )
}
`);
    await assert.rejects(
      y.calistir(),
      (e) => /TürkUI modülüne aittir/.test(e.message),
      'pencere üzerinden stil bloğu reddedilmeli'
    );
    ok('`pencere.stil { }` reddediliyor');
  }

  // ── 7. Renderer CSS çevirisi (HTML içindeki gerçek fonksiyonlar) ──
  {
    const fs = require('node:fs');
    const path = require('node:path');
    const html = fs.readFileSync(path.join(__dirname, '..', 'media', 'turkui-window.html'), 'utf8');
    const bas = html.indexOf('const TURKCE_CSS_OZELLIK = {');
    const son = html.indexOf('    function stilUygula(');
    assert.ok(bas >= 0 && son > bas, 'renderer CSS bloğu bulunmalı');
    const { turkceCss, stilKapsamla } = new Function(
      html.slice(bas, son) + '\nreturn { turkceCss, stilKapsamla };'
    )();

    const css = stilKapsamla(
      turkceCss(
        '& { arkaPlanRengi: mavi; } &üzerineGelince { arkaPlanRengi: kırmızı; dönüşüm: ölçek(1.05); }'
      ),
      '#btn_1'
    );
    assert.ok(css.includes('#btn_1 { background-color: #89b4fa }'), 'temel kural: ' + css);
    assert.ok(
      css.includes('#btn_1:hover { background-color: #f38ba8; transform: scale(1.05) }'),
      'hover kuralı: ' + css
    );
    assert.ok(
      stilKapsamla(turkceCss('&seçiliyken { arkaPlanRengi: yeşil; }'), '#chk_1').includes(
        '#chk_1:checked'
      ),
      'seçiliyken → :checked olmalı'
    );
    ok('renderer Türkçe durumları CSS sözde sınıflarına çeviriyor');
  }

  console.log('\nTÜM TESTLER GEÇTİ (' + gecen + ' kontrol)');
})().catch((e) => {
  console.error('TEST HATASI:', e && e.message ? e.message : e);
  process.exitCode = 1;
});
