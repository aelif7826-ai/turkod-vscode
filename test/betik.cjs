// `TürkUI.betik { pencere( ... ) }` bloğunun testleri.
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { TurkodYorumlayici } = require('../out/calistir');
const { createTurkuiModulu } = require('../out/turkui');
const betikVerisi = require('../out/veri/betikSozcukleri');

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

/** Pencereye gönderilen son betik paketi. */
function betikBul(kayit) {
  const guncelleme = kayit.guncellemeler.filter((g) => g.id === '' && g.prop === '_betik').pop();
  return guncelleme ? guncelleme.value : undefined;
}

/** `media/turkui-window.html` içindeki Türkçe betik bölümünü Node'da çalıştırır. */
function betikBolumu() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'media', 'turkui-window.html'), 'utf8');
  const bas = html.indexOf('// >>> TURKCE_BETIK_BASLANGIC');
  const son = html.indexOf('// <<< TURKCE_BETIK_BITIS');
  assert.ok(bas >= 0 && son > bas, 'renderer içinde betik bölümü bulunmalı');
  return html.slice(bas, son);
}

/** Betik bölümünü sahte `window` ile yükler; `ek` ile istenen adlar döndürülür. */
function bolumYukle(ek) {
  const gosterilenler = [];
  const pencere = { alert: (metin) => gosterilenler.push(String(metin)) };
  const sonuc = new Function('window', betikBolumu() + `\nreturn { ${ek} };`)(pencere);
  return { ...sonuc, pencere, gosterilenler };
}

let gecen = 0;
function ok(ad) {
  gecen++;
  console.log('  ✓ ' + ad);
}

(async () => {
  console.log('betik bloğu testleri');

  // ── 1. Temel kullanım: pencere + bileşen eşlemesi ──
  {
    const { y, kayit } = calistir(`
içe_aktar TürkUI
değişken uygulama := TürkUI.pencere("deneme")
değişken etiket := uygulama.metin("0")
değişken düğme := uygulama.buton("Artır")

TürkUI.betik {
    uygulama(
        değişken sayi := 0
        düğme.olayDinle("click", fonksiyon() {
            sayi := sayi + 1
            etiket.içerik := "Sayaç: " + sayi
        })
    )
}
uygulama.göster()
`);
    await y.calistir();
    const paket = betikBul(kayit);
    assert.ok(paket, 'pencereye `_betik` gönderilmeli');
    assert.ok(paket.kod.includes('değişken sayi := 0'), 'kod olduğu gibi taşınmalı: ' + paket.kod);
    assert.strictEqual(paket.harita['etiket'], 'txt_1', 'etiket bileşenine bağlanmalı');
    assert.strictEqual(paket.harita['düğme'], 'btn_1', 'düğme bileşenine bağlanmalı');
    assert.ok(paket.satir > 0, 'blok satırı bildirilmeli');
    ok('betik paketi kod, bileşen eşlemesi ve satırla gönderildi');
  }

  // ── 2. Süslü parantez ve metin karışıklığı ──
  {
    const { y, kayit } = calistir(`
içe_aktar TürkUI
değişken uygulama := TürkUI.pencere("deneme")

TürkUI.betik {
    uygulama(
        konsol.yaz("}")
        eğer (Doğru) {
            konsol.yaz("{")
        }
    )
}
uygulama.göster()
`);
    await y.calistir();
    const paket = betikBul(kayit);
    assert.ok(paket && paket.kod.includes('konsol.yaz("}")'), 'metin içindeki süslü parantez korunmalı');
    ok('metin içindeki süslü parantezler blok sınırını bozmuyor');
  }

  // ── 3. Yorum satırı ve blok yorumu ──
  {
    const { y, kayit } = calistir(`
içe_aktar TürkUI
değişken uygulama := TürkUI.pencere("deneme")

TürkUI.betik {
    uygulama(
        // bu bir yorum )
        /* ve bu da ) */
        konsol.yaz("bitti")
    )
}
uygulama.göster()
`);
    await y.calistir();
    const paket = betikBul(kayit);
    assert.ok(paket && paket.kod.includes('konsol.yaz("bitti")'), 'yorumlar sonrası kod korunmalı');
    ok('yorum içindeki parantezler sayımı bozmuyor');
  }

  // ── 4. Hatalar ──
  {
    const { y } = calistir(`
içe_aktar TürkUI
değişken uygulama := TürkUI.pencere("deneme")
değişken düğme := uygulama.buton("bir")

TürkUI.betik {
    düğme(
        konsol.yaz("x")
    )
}
`);
    await assert.rejects(
      y.calistir(),
      (e) => /pencere hedeflidir/.test(e.message),
      'bileşen hedefi reddedilmeli'
    );
    ok('bileşen hedefi reddediliyor, pencere isteniyor');
  }

  {
    const { y } = calistir(`
içe_aktar TürkUI
değişken uygulama := TürkUI.pencere("deneme")

TürkUI.betik {
    olmayanPencere(
        konsol.yaz("x")
    )
}
`);
    await assert.rejects(y.calistir(), (e) => /adlı değişken yok/.test(e.message), 'tanımsız hedef');
    ok('tanımsız hedef anlaşılır hata veriyor');
  }

  {
    const { y } = calistir(`
içe_aktar TürkUI
değişken uygulama := TürkUI.pencere("deneme")

TürkUI.betik {
    uygulama(
        konsol.yaz("x")
}
`);
    await assert.rejects(
      y.calistir(),
      (e) => /kapatılmamış/.test(e.message),
      'eksik parantez hatası'
    );
    ok('kapatılmamış grup anlaşılır hata veriyor');
  }

  {
    const { y } = calistir(`
içe_aktar TürkUI
değişken uygulama := TürkUI.pencere("deneme")

betik {
    uygulama(
        konsol.yaz("x")
    )
}
`);
    await assert.rejects(
      y.calistir(),
      (e) => /TürkUI modülüne aittir/.test(e.message) && /TürkUI\.betik/.test(e.message),
      'başıboş `betik` bloğu modüle yönlendirmeli'
    );
    ok('başıboş `betik {` yerine `TürkUI.betik` öneriliyor');
  }

  {
    const { y } = calistir(`
içe_aktar TürkUI
değişken uygulama := TürkUI.pencere("deneme")

uygulama.betik {
    uygulama(
        konsol.yaz("x")
    )
}
`);
    await assert.rejects(
      y.calistir(),
      (e) => /TürkUI modülüne aittir/.test(e.message),
      'pencere üzerinden betik bloğu reddedilmeli'
    );
    ok('`pencere.betik { }` reddediliyor');
  }

  // ── 5. Gösterimden sonra gelen betik anında gönderilir ──
  {
    const { y, kayit } = calistir(`
içe_aktar TürkUI
değişken uygulama := TürkUI.pencere("deneme")
uygulama.göster()

TürkUI.betik {
    uygulama(
        konsol.yaz("sonradan")
    )
}
`);
    await y.calistir();
    const paket = betikBul(kayit);
    assert.ok(paket && paket.kod.includes('sonradan'), 'gösterimden sonra da betik gönderilmeli');
    ok('pencere gösterildikten sonra yazılan betik de çalışıyor');
  }

  // ── 6. Türkçe → JavaScript çevirici ──
  {
    const { turkceBetik } = bolumYukle('turkceBetik');

    const cevir = (kod) => turkceBetik(kod);
    assert.strictEqual(cevir('değişken sayi := 0'), 'let sayi = 0');
    assert.strictEqual(cevir('sabit ad := "Metehan"'), 'const ad = "Metehan"');
    assert.strictEqual(cevir('düğme.içerik := "Merhaba"'), 'düğme.textContent = "Merhaba"');
    assert.strictEqual(cevir('giriş.değer'), 'giriş.value');
    assert.strictEqual(cevir('eğer (a ve b) { }'), 'if (a && b) { }');
    assert.strictEqual(cevir('eğer (değil hazır) { }'), 'if (! hazır) { }');
    assert.strictEqual(cevir('değilse { }'), 'else { }');
    assert.strictEqual(cevir('fonksiyon() { }'), 'function() { }');
    assert.strictEqual(cevir('için (değişken i := 0; i < 3; i++) { }'), 'for (let i = 0; i < 3; i++) { }');
    assert.strictEqual(cevir('konsol.yaz("Merhaba")'), 'console.log("Merhaba")');
    assert.strictEqual(cevir('kutu.sınıfEkle("vurgulu")'), 'kutu.classList.add("vurgulu")');
    assert.strictEqual(cevir('liste.ekle(5)'), 'liste.push(5)');
    assert.strictEqual(cevir('tuval.bağlamAl("ikiBoyut")'), 'tuval.getContext("2d")');
    assert.strictEqual(cevir('tuval.genişlik'), 'tuval.width');
    assert.strictEqual(cevir('bağlam.dolguDikdörtgen(0, 0, 4, 4)'), 'bağlam.fillRect(0, 0, 4, 4)');
    assert.strictEqual(cevir('animasyonKaresi(dalga)'), 'requestAnimationFrame(dalga)');
    assert.strictEqual(cevir('yeni tarih().yerelSaatMetni("tr-TR")'), 'new Date().toLocaleTimeString("tr-TR")');
    assert.strictEqual(cevir('olay.tuş'), 'olay.key');
    assert.strictEqual(cevir('olay.engelle()'), 'olay.preventDefault()');
    assert.strictEqual(cevir('matematik.sinüs(t)'), 'Math.sin(t)');
    ok('tuval, animasyon ve yerel biçim adları Türkçe çevriliyor');

    // Olay adları da Türkçe yazılır; düz metinler korunur.
    assert.strictEqual(cevir('düğme.olayDinle("tıklandığında", işlev)'), 'düğme.addEventListener("click", işlev)');
    assert.strictEqual(cevir('düğme.olayKaldır("tıklandığında", işlev)'), 'düğme.removeEventListener("click", işlev)');
    assert.strictEqual(cevir('belge.olayDinle("tuşBasılınca", işlev)'), 'document.addEventListener("keydown", işlev)');
    assert.strictEqual(cevir('belge.olayDinle("keydown", işlev)'), 'document.addEventListener("keydown", işlev)');
    assert.strictEqual(cevir('etiket.içerik := "tıklandığında"'), 'etiket.textContent = "tıklandığında"');
    ok('olay adları Türkçe, olay dışı metinler dokunulmuyor');
    assert.strictEqual(cevir('matematik.yuvarla(1.6)'), 'Math.round(1.6)');
    assert.strictEqual(cevir('yeni tarih()'), 'new Date()');
    assert.strictEqual(cevir('Doğru'), 'true');
    assert.strictEqual(cevir('Yanlış'), 'false');
    assert.strictEqual(cevir('Boş'), 'null');
    ok('anahtar kelimeler, hazır adlar ve üyeler çevrildi');

    // Metinler ve yorumlar korunur.
    assert.strictEqual(cevir('"değişken eğer"'), '"değişken eğer"');
    assert.strictEqual(cevir("'fonksiyon'"), "'fonksiyon'");
    assert.strictEqual(cevir('// değişken\nx'), '// değişken\nx');
    ok('metin ve yorumlar değiştirilmiyor');

    // Şablon metni: düz kısım korunur, `${...}` çevrilir.
    assert.strictEqual(cevir('`değişken: ${sayi}`'), '`değişken: ${sayi}`');
    assert.strictEqual(cevir('`değer: ${giriş.değer}`'), '`değer: ${giriş.value}`');
    ok('şablon metinlerinde yalnızca ${...} çevriliyor');

    // Nesne anahtarları korunur.
    assert.strictEqual(cevir('değişken k := { içerik: 1 }'), 'let k = { içerik: 1 }');
    ok('nesne anahtarları çevrilmiyor');

    // Yayma (`...`) üye sayılmaz.
    assert.strictEqual(cevir('yeni dizi(...liste)'), 'new Array(...liste)');
    ok('yayma operatörü üye çevirisini tetiklemiyor');

    // Çevrilmeyen adlar olduğu gibi kalır (İngilizce JS de çalışır).
    assert.strictEqual(cevir('console.log("x")'), 'console.log("x")');
    ok('tabloda olmayan adlar olduğu gibi geçiyor');
  }

  // ── 6b. mesajKutusu.Mesaj kısa kullanımı ──
  {
    const { turkceBetik: cevir } = bolumYukle('turkceBetik');
    assert.strictEqual(
      cevir('mesajKutusu.Mesaj("merhaba")'),
      'turkuiMessagebox.Message("merhaba")'
    );
    ok('`mesajKutusu.Mesaj("...")` doğru JavaScript\'e çevriliyor');

    const { pencere, gosterilenler } = bolumYukle('');
    const turkuiMessagebox = pencere.turkuiMessagebox;
    const kutu = turkuiMessagebox.Message('merhaba');
    assert.strictEqual(gosterilenler.length, 1, 'kısa kullanım pencereyi hemen açmalı');
    assert.ok(gosterilenler[0].includes('merhaba'), 'ileti görünmeli');
    assert.strictEqual(kutu.message, 'merhaba');
    ok('`mesajKutusu.Mesaj("merhaba")` `yeni` olmadan hemen gösteriyor');

    const hazir = new turkuiMessagebox.Message({ başlık: 'Bilgi', ileti: 'Merhaba' });
    assert.strictEqual(gosterilenler.length, 1, 'nesne ile oluşturmak hemen göstermemeli');
    hazir.show();
    assert.strictEqual(gosterilenler.length, 2, 'göster() çağrısı pencereyi açmalı');
    assert.ok(gosterilenler[1].includes('Bilgi') && gosterilenler[1].includes('Merhaba'));
    ok('`yeni mesajKutusu.Mesaj({...}).göster()` eski kullanımı bozulmadı');
  }

  // ── 7. Öneri tabloları renderer ile birebir aynı ──
  {
    const tablolar = bolumYukle(
      'TURKCE_BETIK_ANAHTAR, TURKCE_BETIK_GENEL, TURKCE_BETIK_UYE, TURKCE_BETIK_OLAY'
    );

    const karsilastir = (etiket, veri, tablo) => {
      assert.strictEqual(
        veri.length,
        Object.keys(tablo).length,
        `${etiket} sayısı renderer ile aynı olmalı`
      );
      for (const sozcuk of veri) {
        assert.strictEqual(
          tablo[sozcuk.ad],
          sozcuk.karsilik,
          `"${sozcuk.ad}" karşılığı eşleşmeli`
        );
      }
    };

    karsilastir('anahtar kelime', betikVerisi.betikAnahtarKelimeleri, tablolar.TURKCE_BETIK_ANAHTAR);
    karsilastir('genel ad', betikVerisi.betikGenelAdlari, tablolar.TURKCE_BETIK_GENEL);
    // Mesaj kutusu metotları ayrı listede tutulur; renderer tek tabloda birleştirir.
    const tumUyeler = betikVerisi.betikUyeAdlari.concat(betikVerisi.mesajKutusuUyeAdlari);
    karsilastir('üye', tumUyeler, tablolar.TURKCE_BETIK_UYE);
    karsilastir('olay', betikVerisi.betikOlayAdlari, tablolar.TURKCE_BETIK_OLAY);
    ok('öneri tabloları renderer tablolarıyla aynı');
  }

  // ── 8. Denetleyici çeviricisi renderer ile aynı sonucu verir ──
  {
    const { turkceBetik: rendererCevir } = bolumYukle('turkceBetik');
    const { turkceBetik: denetleyiciCevir } = require('../out/veri/betikCeviri');
    const ornekler = [
      'düğme.olayDinle("tıklandığında", fonksiyon() { yazı.içerik := "x" })',
      'için (değişken i := 0; i < 3; i++) { konsol.yaz(`kare: ${i}`) }',
      'tuval.bağlamAl("ikiBoyut")',
      'matematik.sinüs(t) + matematik.yuvarla(1.6)',
      'yeni tarih().yerelSaatMetni("tr-TR")',
      'değişken k := { içerik: 1 } // yorum',
      'düğme.olayKaldır("tuşBasılınca", işlev)',
    ];
    for (const ornek of ornekler) {
      assert.strictEqual(
        denetleyiciCevir(ornek),
        rendererCevir(ornek),
        'çeviriciler aynı olmalı: ' + ornek
      );
    }
    ok('denetleyici çeviricisi renderer ile aynı çıktıyı veriyor');
  }

  console.log('\nTÜM TESTLER GEÇTİ (' + gecen + ' kontrol)');
})().catch((e) => {
  console.error('TEST HATASI:', e && e.message ? e.message : e);
  process.exitCode = 1;
});
