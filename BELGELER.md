# Türkod — Başvuru Kılavuzu

> Bu dosya Türkod VS Code uzantısının ayrıntılı başvuru kılavuzudur.
> Kısa tanıtım ve kurulum için [README.md](README.md) sayfasına bakın.

Türkçe programlama dili **Türkod** için VS Code dil desteği.

## Özellikler

- `.tr` dosyaları için dil tanımı (`turkod`)
- Söz dizimi renklendirme:
  - anahtar kelimeler (`değişken`, `eğer`, `döngü`, `fonksiyon`, `nesne`, `dene`/`yakala`, ...)
  - mantıksal operatörler (`ve`, `veya`, `değil`)
  - sabitler (`Doğru`, `Yanlış`, `Boş`, `PI`, `E`, `TAU`, `SONSUZ`, `SÜRÜM`)
  - 239 yerleşik komut (`büyükHarf`, `oku`, `dosyaOku`, `sırala`, ...)
  - metinler, sayılar, yorumlar ve operatörler
  - fonksiyon tanımları, fonksiyon çağrıları, nesne türleri ve üye erişimleri
- Yorum satırı: `#`
- Parantez eşleştirme, otomatik kapatma ve blok girintileme
- Canlı sözdizimi denetimi (Python'daki gibi):
  - yazarken hatalar **Problems** panelinde listelenir ve satırın altı kırmızı çizilir
  - eksik `son`, hatalı `eğer ... ise`, `döngü ... kez`, kapatılmamış parantez/metin,
    yanlış `değilse`/`yakala` kullanımı ve komut yazım hataları anında bildirilir
- Otomatik tamamlama:
  - anahtar kelimeler, sabitler ve 254 yerleşik komut
  - dosyadaki değişkenler, fonksiyonlar, nesneler, döngü ve hata değişkenleri
  - imza, açıklama, kategori ve örnek içeren öneri belgeleri
  - belge, öneri listesinin hemen yanındaki ayrıntı bölmesinde açılır (`Ctrl+Space` ile aç/kapat)
  - parametre yer tutuculu snippet'ler
  - satır başında tanımsız bir ad yazınca hazır değişken tanımı: `asd` → `değişken asd := ` (Tab ile kabul)
  - `ad--kategori` formülleri: `asd--fonksiyon`, `asd--ondalıklı`, `asd--sözlük` ... (Tab ile kabul)
- Nokta sonrası üye önerileri:
  - metin, liste, sözlük ve küme metotları
  - `nesne` ile tanımlanan türlerin alanları ve metotları
  - TürkUI pencere ve bileşen üyeleri, hazır renkler

- Zaman modülü:
  - `içe_aktar Zaman` ile biçimlendirme, tarih aritmetiği, karşılaştırma,
    hafta/ay bilgileri, kronometre, geri sayım ve okunabilir süre metni

- TürkUI grafik arayüzü:
  - `içe_aktar TürkUI` ile pencere, buton, giriş, liste, ilerleme çubuğu,
    sekme, kaydırıcı, anahtar, özel HTML/CSS ve canvas bileşenleri
  - bileşenlerde `sınıf` / `stil`, pencerede `stil(...)` ile CSS desteği
  - pencereler VS Code içinde **webview paneli** olarak açılır
  - `dugme.tıklandığında ... son` gibi olay blokları ve canlı özellik atamaları
  - `TürkUI.onay`, `TürkUI.sor`, `TürkUI.dosyaSeç` gibi diyaloglar
  - `renk` paleti (`renk.mavi`, `renk.rgb(...)`, `renk.hex(...)`) ve `gizle` değeri

- Kod çalıştırma:
  - `F5` / `Ctrl+F5` ile programı **Türkod** terminalinde çalıştırma
  - `Shift+F5` ile satır satır **hata ayıklama** (Devam / Sonraki satır / Durdur)
  - `Ctrl+Shift+F5` ile **imlece kadar** çalıştırma, `Ctrl+Enter` ile **seçimi** çalıştırma
  - `Ctrl+F2` ile çalışan programı durdurma
  - sağ alt köşede (durum çubuğu) **▶ Çalıştır** düğmesi; editörün sağ üst köşesinde de play düğmesi
  - hata mesajında satır numarası ve "Satıra git" düğmesi
  - program bitince terminalde kabuk istemi görünür ve terminal kullanılmaya devam edilebilir;
    çıktı Python'daki gibi `PS D:\proje> turkod` satırının altında görünür
  - `iste` / `oku` girdileri terminalden normal şekilde yazılarak alınır

## Çalıştırma

Bir `.tr` dosyası açın ve `F5`'e basın. Program `Türkod` adlı terminalde çalışır.

| Kısayol | İşlev |
| --- | --- |
| `F5` / `Ctrl+F5` | Çalıştır |
| `Shift+F5` | Satır satır hata ayıkla |
| `Ctrl+Shift+F5` | İmlece kadar çalıştır |
| `Ctrl+Enter` | Seçimi çalıştır |
| `Ctrl+F2` | Durdur |

Komutlar sağ tık menüsünde ve Komut Paleti'nde `Türkod:` önekiyle de bulunur.

## Türküi komut satırı (`türküi`)

Flutter'daki gibi proje oluşturup çalıştırmak için terminal kullanılabilir:

```powershell
npm link                 # bir kez: türküi komutunu sisteme bağlar
türküi yeni merhaba      # proje oluşturur
cd merhaba
türküi çalıştır          # çalıştırır
```

Oluşan proje:

```
merhaba/
  uygulama.json          proje ayarları (ad, sürüm, giriş, varlıklar)
  src/ana.tr             giriş dosyası (TürkUI penceresi)
  src/araclar/yardimci.tr  ana dosyaya bağlanan ikinci dosya
  assets/                görseller, sesler
  README.md
  .gitignore
```

| Komut | İşlev |
| --- | --- |
| `türküi yeni <ad>` | Yeni proje oluşturur (`--klasor <üst klasör>`) |
| `türküi çalıştır [dosya]` | `uygulama.json` içindeki giriş dosyasını çalıştırır |
| `türküi yardım` / `türküi sürüm` | Kullanım / sürüm |

## `türkod` komut satırı (isteğe bağlı modüller)

Ağır çalışma zamanları uzantıyla birlikte gelmez; istendiğinde indirilir:

```powershell
türkod yeni modül indir türküi   # TürkUI için Electron çalışma zamanı (~250 MB)
türkod modül liste               # indirilmiş modülleri gösterir
```

| Komut | İşlev |
| --- | --- |
| `türkod yeni modül indir türküi` | TürkUI modülünü indirir (GitHub, engellenirse ayna) |
| `türkod modül indir türküi` | Aynı komutun kısa yazımı |
| `türkod modül liste` | İndirilmiş modülleri ve boyutlarını listeler |
| `--sürüm <sürüm>` | Farklı bir Electron sürümü indirir (varsayılan TURKOD Studio ile aynı) |

`türküi çalıştır`, `içe_aktar TürkUI` varsa programı gerçek bir masaüstü
uygulaması (`.exe`) olarak başlatır; Electron gerekir. Penceresiz programlar
terminalde çalışır. Göreli yollar proje köküne göredir.

### İki dosyayı bağlama (`içe_aktar`)

Bir dosyadaki fonksiyon ve değişkenler başka bir dosyada `içe_aktar` ile
kullanılır. Yol, **içe aktaran dosyanın** klasörüne göre çözülür; ayrıca proje
kökünün `src/` klasörü ve proje kökü de aranır:

```tr
# src/ana.tr
içe_aktar araclar/yardimci

yazdır(selamla("Metehan"))
```

Kabul edilen yazımlar:

```tr
içe_aktar Yardimci                 # aynı klasördeki Yardimci.tr
içe_aktar araclar/yardimci         # alt klasör
içe_aktar "araclar/boşluk lu.tr"   # boşluk içeren yol
içe_aktar ../ortak/araclar         # üst klasör
```

Yol verilmeden yalnızca ad yazılırsa (`içe_aktar yardimci`) proje içindeki alt
klasörler de taranır. Yorumlayıcı, VS Code, terminal ve `.exe` çalışma zamanı
aynı çözümleyiciyi kullanır.

### Desteklenen dil öğeleri

`değişken` / `OndalıklıDeğişken`, `eğer`/`değilse`/`değilse-eğer`/`ise`/`son`, `döngü N kez`, `SonsuzDöngü koşul`,
`için x içinde liste`, `fonksiyon`, `nesne`, `dene`/`yakala`, `kır` / `dur`, `devam_et`, `geri_döndür`/`dön`,
`içe_aktar` (başka bir `.tr` dosyasını bağlar), `dışa_aktar`, metin/liste/sözlük/küme değerleri,
indeksleme, üye erişimi ve metotlar (`liste.ekle`, `metin.uzunluk`, `sözlük.anahtarlar`, ...).

`kır` döngüyü hemen sonlandırır (Python'daki `break`), `devam_et` sonraki tura geçer
(Python'daki `continue`). Eski yazım `dur` da `kır` ile aynı işi yapar.
Atamalarda `:=` ile birlikte Studio uyumlu `=` de kullanılabilir (`değişken x = 5`).

Çıktı için `yazdır`, girdi için `iste`/`oku`, hata için `hataFırlat` kullanılır. Dosya, metin, sayı,
liste, sözlük ve tarih komutlarının büyük bölümü çalışma zamanında desteklenir.

### Formüller (`ad--kategori`)

Bir ad yazıp `--` ekleyince hazır kod formülleri listelenir; **Tab** ile kabul edilir.
`asd--` yazıp durursan tüm formüller görünür. Türkçe harf yazmak istemezsen takma adlar da
çalışır (`asd--sozluk`, `asd--ondalikli`, `asd--degisken`).

| Yazım | Üretilen kod |
| --- | --- |
| `asd--değişken` | `değişken asd := ` |
| `asd--ondalıklı` | `OndalıklıDeğişken asd := 0,0` |
| `asd--metin` | `değişken asd := ""` |
| `asd--sayı` | `değişken asd := 0` |
| `asd--liste` | `değişken asd := []` |
| `asd--sözlük` | `değişken asd := {"anahtar": değer}` |
| `asd--fonksiyon` | `fonksiyon asd()` + gövde + `son` |

Yeni formül eklemek için `src/veri/formuller.ts` dosyasına tek kayıt eklemek yeterlidir
(`{ad}` yazılan adla değişir, `$0` imlecin duracağı yerdir).

### Zaman (tarih ve saat)

`içe_aktar Zaman` ile tarih ve saat işlemleri yapılır. Ağır bir çalışma zamanı
gerektirmez; uzantı, terminal, `türküi` ve paketlenen `.exe` içinde aynı çalışır.

```tr
içe_aktar Zaman

yazdır(Zaman.biçimle("17.10.2026", "gg AyAdı yyyy, GünAdı"))            # 17 Ekim 2026, Cumartesi
yazdır(Zaman.biçimle(Zaman.ekle("31.01.2026", 1, "ay"), "gg.AA.yyyy"))  # 28.02.2026
yazdır(Zaman.fark("01.01.2026", "11.01.2026", "gün"))                  # 10

değişken k := Zaman.kronometre()
k.başlat()
# ... iş ...
k.durdur()
yazdır(Zaman.süreMetni(k.geçen))   # 1 saat 2 dakika 5 saniye
```

Tarihler `{ yıl, ay, gün, saat, dakika, saniye, salise, ms, saatDilimi }` alanlı
nesnelerdir. Tarih yerine metin (`"17.10.2026"`, `"2026-10-17 14:35"`), sayı
(epoch ms) veya `Boş` (şu an) verilebilir.

| Komut | İşlev |
| --- | --- |
| `Zaman.şimdi()` | Şu anki zamanı tarih nesnesi olarak döndürür |
| `Zaman.şimdiMetni(desen)` | Şu anki zamanı biçimlendirir |
| `Zaman.bugünMetni()` | `07.11.2026` |
| `Zaman.biçimle(tarih, desen)` | Desene göre biçimlendirir |
| `Zaman.ayAdı(ay)` / `Zaman.günAdı(tarih)` | `Kasım` / `Cumartesi` |
| `Zaman.aylar` / `Zaman.günler` | Türkçe ad listeleri |
| `Zaman.ekle(tarih, miktar, birim)` / `Zaman.çıkar(...)` | Tarih aritmetiği (takvim tabanlı `ay`, `yıl`) |
| `Zaman.fark(tarih1, tarih2, birim)` | İki tarih arasındaki fark |
| `Zaman.önceMi` / `sonraMi` / `eşitMi` | Karşılaştırma |
| `Zaman.haftaSonuMu` / `Zaman.artıkYılMı` | Sorgular |
| `Zaman.ayGünSayısı(yıl, ay)` | `2026, 2` → `28` |
| `Zaman.haftaNumarası` / `Zaman.yılınGünü` | ISO hafta / yılın günü |
| `Zaman.ayAralığı(tarih)` | `{ ilk, son }` |
| `Zaman.kronometre()` | `başlat`, `durdur`, `sıfırla`, `geçen`, `çalışıyor` |
| `Zaman.geriSayım(tarih)` | `{ gün, saat, dakika, saniye, bitti }` |
| `Zaman.süreMetni(ms)` | `1 saat 2 dakika 5 saniye` |

Desen harfleri: `gg` / `dd` gün, `AA` / `MM` ay sayısı, `yyyy` / `yy` yıl,
`HH` saat, `mm` dakika, `ss` saniye, `SSS` salise, `AyAdı`, `GünAdı`.
Birimler: `ms`, `saniye`, `dakika`, `saat`, `gün`, `hafta`, `ay`, `yıl`.

### TürkUI (grafik arayüz)

TürkUI, TURKOD Studio'daki masaüstü arayüz modülünün VS Code sürümüdür. `içe_aktar TürkUI`
yazıldığında modül ile birlikte `renk` paleti ve `gizle` değeri de kullanılabilir olur.
Pencereler, Visual Studio'daki Windows Forms gibi **VS Code'dan bağımsız gerçek masaüstü
pencerelerinde** açılır: kendi başlık çubuğu, görev çubuğu düğmesi, boyutu ve konumu vardır.
`içe_aktar ` sonrasında öneri listesinde yalnızca modül adları (TürkUI ve aynı klasördeki
`.tr` dosyaları) gösterilir.

Çalıştırma sırasında program önce sessizce gerçek bir Windows uygulamasına paketlenir
(`<Ad>.exe`) ve o uygulama başlatılır; yani pencereler tarayıcıda değil, kendi sürecinde
açar. `yazdır`/`oku` için uygulamanın kendi konsol penceresi kullanılır. Son pencere
kapanınca uygulama sonlanır ve terminal kabuk istemine döner.

> **Gereksinim:** TürkUI uygulamaları Electron ile çalışır. Uzantı Electron'u **içinde
> taşımaz** (kurulum ~0,5 MB kalır); gerekince indirilir:
>
> ```powershell
> türkod yeni modül indir türküi
> ```
>
> Bu komut çalışma zamanını `%LOCALAPPDATA%\turkui\modul\electron\<sürüm>` klasörüne indirir
> (~250 MB) ve uzantı oradan otomatik bulur. Komut Paleti'ndeki
> **Türkod: TürkUI Modülünü İndir** düğmesi de aynı işi yapar. TURKOD Studio kuruluysa
> `node_modules/electron/dist` klasörü zaten otomatik bulunur; farklı bir yerdeyse
> `turkod.electronKlasoru` ayarına veya `TURKOD_ELECTRON` ortam değişkenine yolu yazın.
> Electron bulunamazsa (veya satır satır hata ayıklarken) pencereler yedek olarak VS Code
> webview panelinde açılır.

Dağıtılabilir uygulama üretmek için komut paletinden **Türkod: Uygulama Olarak Paketle (.exe)**
çalıştırın. İki biçim sunulur:

- **Tek dosya (.exe):** uygulama, Electron çalışma zamanıyla birlikte tek bir `.exe` içine
  gömülür. Dosya başka bir bilgisayara kopyalanıp doğrudan çalıştırılabilir; ilk açılışta
  kendini `%LOCALAPPDATA%\TürkUI\Uygulamalar` klasörüne açar, sonraki açılışlar hızlıdır.
- **Klasör:** seçilen klasörde `<Ad>.exe`, Electron çalışma zamanı ve `resources/app` ile
  birlikte kendi simgesi (`ikon.ico`) üretilir; klasör olduğu gibi başka bir bilgisayara
  kopyalanabilir.

```tr
içe_aktar TürkUI

değişken p := TürkUI.pencere("Merhaba")
değişken etiket := p.metin("Adınız nedir?")
değişken giris := p.giriş("Adınızı yazın")
değişken dugme := p.buton("Selamla")
p.göster()

dugme.tıklandığında
    etiket.içerik := "Merhaba " + giris.değer
    etiket.renk := renk.yeşil
son
```

Kullanılabilir bileşenler: `metin`, `buton`, `giriş`, `kutu`, `liste`, `görsel`, `ilerleme`,
`onayKutusu`, `seçimKutusu`, `sekme`, `metinAlanı`, `kaydırıcı`, `anahtar`, `radyo`,
`özel`, `canvas`, `tarayıcı`, `dikeyDüzen`, `yatayDüzen`, `gridDüzen` ve `esnekAlan`.

Her bileşende ortak konum/boyut özelliklerinin yanında `sınıf` ve `stil` de kullanılabilir:

```tr
dugme.sınıf := "vurgulu-buton"
dugme.stil := "box-shadow: 0 4px 14px rgba(137, 180, 250, 0.35);"
uygulama.stil(".vurgulu-buton { letter-spacing: 0.5px; }")   # pencere düzeyi CSS
```

Türkçe özellik adlarıyla toplu stil yazmak için `TürkUI.stil` bloğunu kullanın.
HTML ve İngilizce CSS gerekmez; palet renkleri (`kırmızı`, `#313244`, ...) doğrudan
değer olarak yazılabilir:

```tr
TürkUI.stil {
    dugme(
        arkaPlanRengi: mavi
        yazıRengi: siyah
        kenarYuvarlaklığı: 10px
    )
}
```

Durumlar (CSS sözde sınıfları) da Türkçedir. Hedef grubunun içine iç içe yazılır:

```tr
TürkUI.stil {
    dugme(
        arkaPlanRengi: mavi
        geçiş: 0.2s
        üzerineGelince(
            arkaPlanRengi: mor
            dönüşüm: ölçek(1.05)
        )
        basılıyken(
            arkaPlanRengi: kırmızı
        )
    )
}
```

Kullanılabilir durumlar: `üzerineGelince` (:hover), `basılıyken` (:active),
`odaklıyken` (:focus), `odakİçindeyken` (:focus-within), `seçiliyken` (:checked),
`etkinken` (:enabled), `devreDışıyken` (:disabled), `ilkÇocukken` (:first-child),
`sonÇocukken` (:last-child), `tekÇocukken` (:only-child), `boşken` (:empty),
`geçerliyken` (:valid), `geçersizken` (:invalid), `zorunluyken` (:required),
`bağlantıyken` (:link), `ziyaretEdilmişken` (:visited), `hedefken` (:target).
Durum grupları iç içe yazılamaz; her durum kendi `özellik: değer` satırlarını taşır.

Pencere adı da hedef olarak yazılabilir; bu, `pencere.stil(...)` ile aynı etkiyi
yapar ve pencere düzeyi CSS uygular:

```tr
TürkUI.stil {
    uygulama(
        arkaPlanRengi: siyah
    )
}
```

Türkçe JavaScript yazmak için `TürkUI.betik` bloğunu kullanın. Blok bir pencereyi
hedefler; anahtar kelimeler, hazır nesneler ve üyeler Türkçedir. Dosyadaki
pencere/bileşen adları betikte doğrudan kullanılabilir:

```tr
TürkUI.betik {
    uygulama(
        değişken sayi := 0
        düğme.olayDinle("click", fonksiyon() {
            sayi := sayi + 1
            etiket.içerik := "Sayaç: " + sayi
        })
    )
}
```

Karşılıklar: `değişken` / `sabit`, `eğer` / `değilse`, `için`, `iken`,
`fonksiyon`, `dön`, `dene` / `yakala`, `ve` / `veya` / `değil`, `:=` ataması;
hazır adlar `belge`, `pencere`, `konsol`, `matematik`, `zamanlayıcı`, `getir`,
`animasyonKaresi`; üyeler `içerik`, `değer`, `sınıfEkle`, `olayDinle`, `ekle`,
`sırala`, `yaz`, `yerelSaatMetni`.

Tuval çizimi de Türkçedir (`bağlamAl`, `dolguRengi`, `dolguDikdörtgen`, `yay`,
`yazıTipi`, `yazıYaz`, ...). Gradyanlar `renk` modülünden üretilir; yön sayı
olarak veya Türkçe adla verilebilir:

```tr
TürkUI.stil {
    uygulama(
        arkaPlan: renk.doğrusalGeçiş(160, "#1e1e2e", "#11111b")
    )
}
```
Olay adları da Türkçedir; dosya dilindeki olay bloklarıyla aynı adlar kullanılır:
`tıklandığında`, `çiftTıklandığında`, `sağTıklandığında`, `üzerineGelindiğinde`,
`üzerindenÇıkıldığında`, `tuşBasılınca`, `tuşBırakılınca`, `değiştiğinde`,
`girdiğinde`, `odaklandığında`, `odağıKaybettiğinde`, `fareHareketinde`,
`fareTekerleği`.

```tr
düğme.olayDinle("tıklandığında", fonksiyon() {
    yazi.içerik := "Merhaba!"
})
```

Olay adlarını ezberlemek gerekmez: `olayDinle("` yazınca öneri listesi açılır
(18 olay, İngilizce karşılığı ve açıklamasıyla).

Tabloda olmayan adlar olduğu gibi kalır, yani İngilizce JavaScript de çalışır.

Betik, pencerenin içinde çalıştığı için kendi bileşenlerine ek olarak **diğer
pencereleri de** yönetebilir. Dosyadaki pencere adları betikte kullanılabilir;
`göster`, `gizle`, `kapat`, `küçült`, `büyüt`, `normal` komutları gerçek
pencereye uygulanır:

```tr
değişken uygulama := TürkUI.pencere("Ana")
değişken uygulama2 := TürkUI.pencere("İkinci")
uygulama2.gizle()

değişken düğme := uygulama.buton("Pencere 2")

TürkUI.betik {
    uygulama(
        düğme.olayDinle("tıklandığında", fonksiyon() {
            uygulama2.göster()
        })
    )
}

uygulama.göster()
```

Aynı işi olay bloğuyla da yapabilirsiniz:

```tr
düğme.tıklandığında
    uygulama2.göster()
son
```

`TürkUI.stil` içinde `geçiş` değerine çıplak sayı yazılabilir: `geçiş: 1`
otomatik olarak `1s` olur.
Betik hataları pencerenin altında satır numarasıyla gösterilir; her betik kendi
kapsamında çalıştığı için tanımlar birbirine karışmaz.

`özel(html, css)` ham HTML/CSS ile kendi bileşeninizi oluşturur. İçerik Shadow DOM'da
çalıştığı için CSS sayfanın geri kalanına sızmaz; güvenlik gereği içerikteki betikler
çalıştırılmaz.

```tr
değişken kart := uygulama.özel("<div class='kart'>Merhaba</div>", ".kart { padding: 16px; }")
kart.html := "<div class='kart'>Güncellendi</div>"
```

`canvas(genişlik, yükseklik)` 2B çizim tuvali ekler. Çizim komutları:
`arkaPlanDoldur`, `temizle`, `çizgi`, `dikdörtgen`, `daire`, `yay`, `yazı` ve `görsel`.

```tr
değişken tuval := uygulama.canvas(480, 240)
tuval.arkaPlanDoldur(renk.hex("#181825"))
tuval.daire(90, 120, 60, renk.mavi, Doğru)
tuval.yazı("TürkUI Canvas", 180, 105, 22, renk.beyaz)
```

`tarayıcı(adres)` gömülü web tarayıcı bileşeni ekler; `webTarayıcı` ve `webBrowser`
takma adları da aynı bileşeni üretir. Electron çalışma zamanında gerçek gömülü
tarayıcı (`webview`), diğer ortamlarda güvenli `iframe` kullanılır.

```tr
değişken tarayici := uygulama.tarayıcı("https://ornek.com")
tarayici.anaSayfa := "https://ornek.com"
tarayici.geri()
tarayici.ileri()
tarayici.yenile()
tarayici.git("https://ornek.com/sayfa")
tarayici.htmlYükle("<h1>Merhaba</h1>")
tarayici.yakınlaştır(1.25)

tarayici.yüklendiğinde
    değişken başlık := tarayici.başlık
son
```

Tarayıcı özellikleri: `adres` (`url`), `html`, `anaSayfa`, `başlık`, `yükleniyor`,
`geriGidebilir`, `ileriGidebilir` ve `yakınlaştırma`. Komutlar: `git`/`aç`, `geri`,
`ileri`, `yenile`, `durdur`, `anaSayfayaGit`, `htmlYükle`/`belgeYaz`, `yakınlaştır`
ve `yakınlaştırmaSıfırla`. Olaylar: `yüklendiğinde`, `yüklenmeyeBaşladığında`,
`adresDeğiştiğinde`, `başlıkDeğiştiğinde` ve `hataOluştuğunda`. Hata olayında
`hata` (metin) ve `hataKodu` (sayı) alanları dolar.

Yerel dosya yolu verildiğinde (`C:\site\index.html` veya Electron çalışma
zamanında çalışma klasörüne göre `sayfa.html`) dosya `file://` adresine çevrilir.
Adres `http://`/`https://` ile başlamıyorsa `https://` eklenir.

Olay blokları bileşen adı ve olay adıyla yazılır:
`tıklandığında`, `değiştiğinde`, `seçildiğinde`, `enterBasılınca`, `üzerineGelindiğinde`,
`üzerindenÇıkıldığında`, `odaklandığında`, `odağıKaybettiğinde`, `çiftTıklandığında`,
`sağTıklandığında`, `fareHareketinde`, `fareTekerleği`, `tuşBasılınca`, `tuşBırakılınca`,
`yüklendiğinde`, `yüklenmeyeBaşladığında`, `adresDeğiştiğinde`, `başlıkDeğiştiğinde`,
`hataOluştuğunda`, `pencereAçıldığında` ve `pencereKapatılırken`.

Diyaloglar: `TürkUI.onay`, `TürkUI.sor`, `TürkUI.uyarı`, `TürkUI.bilgi`,
`TürkUI.dosyaSeç`, `TürkUI.dosyaKaydet`, `TürkUI.klasörSeç`, `TürkUI.bildirim`.
Açık pencere kaldığı sürece program sona ermiş olsa bile olaylar çalışmaya devam eder;
son pencere kapanınca veya `Türkod: Durdur` ile çalıştırma biter.

## Kurulum

```powershell
code --install-extension turkod-vscode.vsix
```

## Geliştirme

```powershell
npm install
npm run compile
```

`F5` ile Uzantı Geliştirme Konağı'nda (Extension Development Host) çalıştırın ve bir `.tr` dosyası açın.

## Paketleme

```powershell
npm run package
```

Tek dosya (.exe) başlatıcısını yeniden derlemek için (kaynak: `runtime/baslatici/baslatici.cs`):

```powershell
npm run baslatici
```

### Çalıştırma motorunu sınamak

```powershell
node test/calistir.cjs test/temel.tr
```

TürkUI testleri ve örnek uygulama:

```powershell
node test/turkui.cjs
node test/calistir.cjs test/turkui_showcase.tr
```

Çıktı: `turkod-vscode.vsix`
