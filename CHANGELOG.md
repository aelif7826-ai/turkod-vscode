# Değişiklik Günlüğü

Tüm önemli değişiklikler bu dosyada tutulur.

## [0.8.0] - 2026-11-12

- **Düzeltme:** TürkUI olay adları (`tıklandığında`, `değiştiğinde`, `seçildiğinde`,
  `pencereAçıldığında` vb.) artık `.` sonrası önerilerde çıkıyor. Öneri seçildiğinde
  olay bloğu iskeleti (`olay\n\t...\nson`) yazılır. Yalnızca bileşenin gerçekten
  desteklediği olaylar listelenir.

- **Yeni:** **Tek dosya (.exe) paketleme.** *Türkod: Uygulama Olarak Paketle* komutu artık
  "Tek dosya" veya "Klasör" biçimini sorar. Tek dosyada uygulama, Electron çalışma zamanıyla
  birlikte tek bir `.exe` içine gömülür (başlatıcı + deflate arşiv); dağıtımda yalnızca bu
  dosya gerekir. İlk açılışta arşiv `%LOCALAPPDATA%\TürkUI\Uygulamalar\<özet>` klasörüne
  açılır, sonraki açılışlar hazır klasörü kullanır. Başlatıcı kaynağı
  `runtime/baslatici/baslatici.cs`, derleme komutu `npm run baslatici`.

- **Yeni:** TürkUI'ye Windows Forms `WebBrowser` benzeri gömülü `tarayıcı`
  bileşeni eklendi (`webTarayıcı` / `webBrowser` takma adları). Electron
  çalışma zamanında gerçek `<webview>`, diğer ortamlarda güvenli `<iframe>`
  kullanılır. `adres`, `html`, `anaSayfa`, `başlık`, `yükleniyor`, gezinme
  geçmişi ve `yakınlaştırma` özellikleri; `git`/`aç`, `geri`, `ileri`, `yenile`,
  `durdur`, `htmlYükle`/`belgeYaz` ve yakınlaştırma komutları; `yüklendiğinde`,
  `yüklenmeyeBaşladığında`, `adresDeğiştiğinde`, `başlıkDeğiştiğinde` ve
  `hataOluştuğunda` olayları desteklenir. Yerel dosya yolları `file://`
  adresine çevrilir; webview misafirlerinde Node erişimi ve preload kapatılır.
- **Yeni:** `türküi` komut satırı aracı. `türküi yeni <ad>` Flutter'daki gibi
  proje oluşturur: `uygulama.json` (Türkçe alanlar), `src/ana.tr`,
  `src/araclar/yardimci.tr`, `assets/`, `README.md`, `.gitignore`.
  `türküi çalıştır` giriş dosyasını çalıştırır; `içe_aktar TürkUI` varsa
  gerçek masaüstü uygulaması olarak başlatır. `türküi yardım` / `türküi sürüm`.
- **Yeni:** İki dosyayı bağlama güçlendirildi. `içe_aktar` artık alt klasör
  yollarını (`araclar/yardimci`), tırnaklı yolları (`"araclar/boşluk lu.tr"`),
  `./` ve `../` yazımlarını ve proje kökü/`src` aramasını destekler. Yollar içe
  aktaran dosyaya göre çözülür; ad verilirse alt klasörler de taranır. Aynı
  çözümleyici yorumlayıcı, VS Code, terminal ve `.exe` çalışma zamanında
  kullanılır; tamamlama, canlı denetim ve renklendirme güncellendi.
- **Düzeltme:** `liste`, `seçimKutusu` ve `sekme` bileşenlerinde `seç()`
  çağrısı pencere gösterilmeden önce yapıldığında artık **gösterim sırasında
  uygulanıyor**. Önceden seçim sessizce yok sayılıyordu.
- **Yeni:** TürkUI önerilerinde (`.`) **görsel bileşenler (nesneler) en üstte**,
  kendi aralarında Türkçe alfabe sırasıyla listelenir. Pencere komutları ve
  özellikleri arkalarında yine alfabetiktir. Nesneler öneri listesinde farklı
  bir simgeyle (`Class`) gösterilir; `buton`, `metin`, `canvas` gibi bileşenler
  `göster`, `genişlik` gibi üyelerden kolayca ayırt edilir.
- **Yeni:** `TürkUI.stil` içinde **Türkçe durum grupları** (CSS sözde sınıfları)
  kullanılabilir. Hedef grubunun içine iç içe yazılır; tamamlamada önerilir:

  ```turkod
  TürkUI.stil {
      buton1(
          arkaPlanRengi: mavi
          geçiş: 0.2s
          üzerineGelince(
              arkaPlanRengi: kırmızı
              dönüşüm: ölçek(1.05)
          )
          basılıyken(
              arkaPlanRengi: mor
          )
      )
  }
  ```

  Durumlar: `üzerineGelince` (:hover), `basılıyken` (:active), `odaklıyken`
  (:focus), `odakİçindeyken` (:focus-within), `seçiliyken` (:checked),
  `etkinken` (:enabled), `devreDışıyken` (:disabled), `ilkÇocukken`
  (:first-child), `sonÇocukken` (:last-child), `tekÇocukken` (:only-child),
  `boşken` (:empty), `geçerliyken` (:valid), `geçersizken` (:invalid),
  `zorunluyken` (:required), `bağlantıyken` (:link), `ziyaretEdilmişken`
  (:visited), `hedefken` (:target). Pencere hedefinde de çalışır; iç içe durum
  grupları anlaşılır hatayla reddedilir.
- **Düzeltme:** Paketlenen TürkUI uygulamaları, yorumlayıcının kullandığı
  `out/veri/` modüllerini de içeriyor. Önceden `calistir.js` içindeki
  `./veri/stilDurumlari` isteği karşılanmıyor ve uygulama
  "Cannot find module './veri/stilDurumlari'" hatasıyla açılmıyordu.
- **Düzeltme:** `dönüşüm: ölçek(1.05)` ve `kaydır(10px, 0px)` gibi Türkçe CSS
  işlevleri artık değişken çağrısı sanılmıyor; `scale(...)`, `translate(...)`
  olarak çevriliyor (önceden "ölçek tanımlı değil" hatası veriyordu).
- **Yeni:** `TürkUI.betik` artık **başka pencereleri** de yönetebiliyor.
  Betik, pencerenin içinde çalıştığı için önceden yalnızca kendi bileşenlerine
  erişebiliyordu; artık dosyadaki her pencere adı (`uygulama2`) betikte
  kullanılabilir:

  ```turkod
  TürkUI.betik {
      uygulama(
          düğme.olayDinle("tıklandığında", fonksiyon() {
              uygulama2.göster()
          })
      )
  }
  ```

  `göster`, `gizle`, `kapat`, `küçült`, `büyüt`, `normal` komutları uzantıya
  iletilir ve yorumlayıcı gerçek pencereyi yönetir; hem webview hem masaüstü
  pencere modunda çalışır. Bilinmeyen komutlar yok sayılır.
- **Düzeltme:** `TürkUI.stil` içinde `geçiş: 1` gibi çıplak sayı yazıldığında
  CSS'e `1s` olarak aktarılır (önceden `1` geçersiz CSS üretiyordu).

- **Yeni:** Satır başında Türkod'da tanımlı olmayan bir ad yazıldığında
  (`asd` gibi) öneri listesinde hazır değişken tanımı çıkar: `değişken asd := `.
  Tab'a basınca tanım yazılır ve imleç değer konumunda kalır. Öneri; ad dosyada
  tanımlıysa, bir anahtar kelime/sabit/yerleşik komutla eşleşiyorsa ya da
  yazılan harflerle başlayan başka bir öneri varsa (`değişke` → `değişken`)
  gösterilmez; böylece mevcut tamamlamalar bozulmaz. Metin ve yorum içinde,
  ayrıca `TürkUI.stil { ... }` gövdesinde öneri çıkmaz.
- Türkod dosyalarında **Tab** ile öneri kabul edilir
  (`[turkod]` için varsayılan `editor.tabCompletion: on`); kullanıcı ayarı
  bunu istediği gibi değiştirebilir.
- **Yeni:** `ad--kategori` formülleri eklendi. `asd--fonksiyon` yazıp Tab'a
  basınca `fonksiyon asd()` iskeleti (imleç gövdede), `asd--ondalıklı` yazınca
  `OndalıklıDeğişken asd := 0,0` gelir. İlk sürümde 7 formül var: `değişken`,
  `ondalıklı`, `metin`, `sayı`, `liste`, `sözlük`, `fonksiyon`. `asd--` yazınca
  liste tamamı görünür; `sozluk`, `ondalikli`, `fonk` gibi ASCII takma adlar
  çalışır. Formüller `src/veri/formuller.ts` tablosunda tutulur, yeni formül
  eklemek tek satırdır.

- **Düzeltme:** `TürkUI.betik` içinde bileşen adları `null` geliyordu
  (`Cannot read properties of null (reading 'getContext')`). Renderer bileşenlere
  `turkui-` önekiyle kimlik veriyor, betik ise öneksiz kimlik arıyordu. Artık
  önce bileşen kayıt defterine, sonra `turkui-<kimlik>` önekli öğeye bakılıyor;
  bileşenler henüz yerleşmemişse betik birkaç kare bekleyip yeniden deneniyor.
- `TürkUI.betik { pencere( ... ) }` bloğu eklendi: pencereye **Türkçe
  JavaScript** bağlanıyor. Anahtar kelimeler (`değişken`, `eğer`, `fonksiyon`,
  `için`, `dön`, ...), hazır adlar (`belge`, `konsol`, `matematik`, `getir`, ...)
  ve üyeler (`içerik`, `değer`, `sınıfEkle`, `olayDinle`, `ekle`, ...) Türkçe
  yazılır; `:=` ataması `=` olur. Çeviri tablosu `src/veri/betikSozcukleri.ts`
  içinde tutulur ve renderer tablolarıyla birebir aynıdır (Türkçe CSS
  tablosunun karşılığı).
- Betikteki pencere ve bileşen adları doğrudan kullanılabilir
  (`etiket.içerik := "Sayaç: " + sayi`); adlar DOM öğelerine bağlanır. Her betik
  kendi kapsamında (IIFE) çalışır, tanımlar diğer blokları etkilemez.
- Betik hataları pencerenin altında kırmızı bildirim olarak gösterilir ve dosya
  satırına eşlenir: `Betik hatası (satır 41): ...`.
- Canlı denetim `TürkUI.betik` bloklarını tanır; blok içindeki `//`, `/* */`
  yorumları ve tırnaklar sayılmaz, kapatılmamış blok bildirilir. Başıboş
  `betik {` veya `pencere.betik {` yazılırsa `TürkUI.betik` önerilir.
- Betik sözlüğü genişletildi; İngilizce API adı yazmak gerekmiyor:
  `animasyonKaresi` (`requestAnimationFrame`), `animasyonDurdur`, `yerelSaatMetni`,
  `yerelTarihMetni`, `yerelMetin`, `belge.olayDinle(...)` geri çağrısında `olay.tuş`
  ve `olay.engelle()`, öğelerde `genişlik` / `yükseklik`, matematikte `sinüs`,
  `kosinüs`, `tanjant`.
- **Düzeltme:** `TürkUI.betik` gövdesindeki söz dizimi hataları artık **Sorunlar**
  panelinde dosya satırıyla gösterilir. Türkçe kaynak çevrilip derlenir
  (`src/veri/betikCeviri.ts`), hata satırı betik bloğunun gerçek satırına
  eşlenir; ör. `olayDinle("üzerineGelindiğinde" fonksiyon(){` yazılınca
  *“Betik söz dizimi hatası: missing ) after argument list. Virgül ve
  parantezleri kontrol edin.”* uyarısı o satırda çıkar. Grup sarmalayıcıları
  (`uygulama( ... )`) ayıklanır, doğru yazılmış betik hata üretmez.
- Otomatik tamamlamada `olayDinle("` / `olayKaldır("` konumunda **18 Türkçe olay
  adı** önerilir (`tıklandığında`, `tuşBasılınca`, `değiştiğinde`, ...); her
  öneri İngilizce karşılığını ve açıklamasını gösterir. Öneri tırnağı yazınca
  kendiliğinden açılır; tamamlanmış çağrıda liste çıkmaz.
- Olay adları da Türkçe yazılır: `düğme.olayDinle("tıklandığında", ...)`,
  `"tuşBasılınca"`, `"değiştiğinde"`, `"fareHareketinde"` gibi adlar dosya
  dilindeki olay bloklarıyla aynıdır (`tıklandığında`, `çiftTıklandığında`,
  `sağTıklandığında`, `üzerineGelindiğinde`, `üzerindenÇıkıldığında`,
  `tuşBırakılınca`, `odaklandığında`, `odağıKaybettiğinde`, `girdiğinde`,
  `gönderildiğinde`, `yüklendiğinde`, `fareTekerleği`, ...). Çeviri yalnızca
  `olayDinle` / `olayKaldır` çağrısının ilk argümanına uygulanır; düz metinler
  değişmez.
- Tuval bağlamı `tuval.bağlamAl("ikiBoyut")` ile alınır (renderer bunu `"2d"`
  olarak iletir); `"2d"` yazmak gerekmez.
- Tuval (canvas) çizimi tamamen Türkçe: `bağlamAl`, `dolguRengi`, `çizgiRengi`,
  `çizgiKalınlığı`, `yazıTipi`, `saydamlık`, `alanıTemizle`, `dolguDikdörtgen`,
  `çizgiDikdörtgen`, `doldur`, `çiz`, `yolBaşlat`, `yolKapat`, `taşı`,
  `çizgiEkle`, `yay`, `yazıYaz`, `çizgiYazı`, `ölç`, `kaydet`, `geriAl`,
  `döndür`, `ötele`, `ölçekle`.
- `renk.doğrusalGeçiş(...)` ve `renk.ışınımsalGeçiş(...)` eklendi: gradyanlar
  İngilizce CSS yazmadan üretiliyor. Sayı yön açı (derece) sayılır; `sağa`,
  `aşağı`, `sağaAşağı`, `çember`, `elips` gibi yönler kabul edilir.
- Otomatik tamamlamada `TürkUI.betik` gövdesinde anahtar kelimeler, hazır adlar,
  nokta sonrası Türkçe üyeler ve dosyadaki bileşen adları önerilir; tablo
  dışındaki (İngilizce) JavaScript de olduğu gibi çalışır.

- **Düzeltme (F5):** VS Code 1.144'te hata ayıklayıcı (js-debug) bağlanınca
  uzantı süreci `code 134` (SIGABRT) ile çöküyor ve geliştirme penceresi hemen
  kapanıyordu. F5 artık varsayılan olarak hata ayıklayıcı olmadan geliştirme
  penceresini açar; hata ayıklamalı yapılandırma listede ikinci seçenek olarak
  korunur (Run and Debug → "Uzantıyı Çalıştır (hata ayıklamalı)").
- **Düzeltme:** `TürkUI.stil { pencere( arkaPlanRengi: yeşil ) }` gibi pencere
  düzeyi stiller uygulanmıyordu. Renderer, seçicisiz düz bildirim listesini
  geçersiz CSS olarak yazıyordu; artık bu bildirimler pencere gövdesine
  (`body`) uygulanıyor. `pencere.stil("arkaPlanRengi: yeşil")` de aynı şekilde
  çalışıyor.
- **Düzeltme:** `TürkUI.stil` bloğunda pencere artık hedef olarak öneriliyor ve
  pencere düzeyi CSS uyguluyor (`pencere.stil(...)` ile aynı etki). Önceden blokta
  bir bileşen varsa yalnızca bileşenler listelendiği için pencere adını yazmaya
  başlayınca öneri listesi boş kalıyordu.
- **Düzeltme (F5):** Hata ayıklama penceresi açılıp hemen kapanıyordu. Geliştirme
  penceresi artık `--disable-extensions` ile yalnızca geliştirilen uzantıyı
  yükler (kurulu Türkod sürümü ve ağır uzantılarla çakışma biter) ve ön derleme
  `npm` betiğine bağlı kalmadan doğrudan `node` + `tsc` ile yapılır.
- **Düzeltme:** Masaüstü TürkUI penceresi beklenmedik şekilde çökerse kapanmak
  yerine kendini yeniden yükler; program bitmediyse `window-all-closed`
  uygulamayı sonlandırmaz.

- **Düzeltme:** Paketlenmiş TürkUI uygulaması VS Code'dan başlatıldığında anında
  `çıkış kodu 9` ile kapanıyordu. Nedeni, uzantı sürecinin taşıdığı
  `ELECTRON_RUN_AS_NODE` değişkeninin alt sürece geçmesiydi; artık uygulama
  başlatılırken bu değişken ortamdan temizleniyor.
- `TürkUI.stil { hedef( özellik: değer ) }` bloğu eklendi: bileşen stilleri
  Türkçe özellik adlarıyla, HTML yazmadan tanımlanabiliyor. Palet renkleri
  (`kırmızı`, `mavi`, `#313244`, ...) değer olarak kullanılabiliyor. Blok
  TürkUI modülüne bağlıdır; başıboş `stil {` yazılırsa anlaşılır hata verilir.
- Canlı denetim `TürkUI.stil` bloklarını tanıyor; blok içindeki renk kodları
  yorum sayılmıyor ve kapatılmamış blok bildiriliyor.
- Otomatik tamamlamada TürkUI artık tek bir modül öğesi olarak öneriliyor;
  ayrı `turkui ...` parçacıkları kaldırıldı. Modül belgesi tüm üyeleri ve
  bileşenleri listeliyor.
- `TürkUI.stil` bloğunda **değer konumunda** hazır değerler öneriliyor: renk
  özelliklerinde palet (`mavi`, `kırmızı`, `beyaz`, ...), ölçü özelliklerinde
  yaygın değerler (`12px`, `16px`, `%50`, ...) ve tüm özelliklerde ortak
  değerler (`merkez`, `otomatik`, `gizli`, ...). Böylece `arkaPlanRengi: m`
  yazınca `mavi` listede çıkıyor; genel metot önerileri görünmüyor.
  Renk değerlerinde ayrıca `rgb(...)`, `rgba(...)` ve `#rrggbb` şablonları da
  öneriliyor; seçildiğinde imleç kodun içine yerleşiyor.
- `TürkUI.stil { hedef( ... ) }` bloğunun içinde `Ctrl+Space` ile **62 stil
  özelliği** (arka plan, yazı, kenarlık, düzen, ızgara, gölge, geçiş, konum)
  listenin en üstünde öneriliyor. Her öneri `özellik: örnekDeğer` olarak
  yapıştırılıyor ve ayrıntı bölmesinde CSS karşılığı gösteriliyor. Blok
  gövdesinde bileşenler hedef olarak, blok dışında stil özellikleri önerilmiyor.
  Bir hedef grubunda zaten yazılmış özellikler (ör. `arkaPlanRengi`,
  `kenarYuvarlaklığı`) tekrar önerilmiyor; farklı bileşen gruplarında ise
  yeniden önerilebiliyor.
- Çalıştırma güvenliği: program başlamadan önce kaynak dosya otomatik
  yedekleniyor (son 20 sürüm, `globalStorage/yedek`). Aynı içerik tekrar
  yedeklenmiyor.
- Paketlenmiş uygulama bir hata verdiğinde hata penceresi kapanana kadar
  uygulama açık kalıyor; önceden pencere anında kapanıp hata okunamıyordu.
  Ayrıca çalıştırma günlüğü `globalStorage/loglar/uygulama.log` dosyasına
  yazılıyor.

## [0.7.0]

- **TürkUI genişletildi:** `özel(html, css)` ile Shadow DOM tabanlı ham HTML/CSS
  bileşeni ve `canvas(genişlik, yükseklik)` ile 2B çizim tuvali eklendi.
- Canvas çizim komutları: `arkaPlanDoldur`, `temizle`, `çizgi`, `dikdörtgen`,
  `daire`, `yay`, `yazı` ve `görsel`.
- Bileşenlerde `sınıf` ve `stil`, pencerede `stil(...)` / `css(...)` ile CSS
  desteği eklendi. Bileşen stili yalnızca o bileşeni etkiler.
- `kutu` artık gerçekten çocuk ekleyip çıkarabiliyor (`ekle`, `çıkar`, `temizle`);
  `çocukEkle` da aynı davranışı kullanır.
- `ilerleme` değeri, `minimum` / `maksimum` değişimleri ve `artır` / `azalt`
  çağrıları arayüzde anında güncelleniyor.
- Sekme tıklamaları artık `seçili` ve `seçiliİndeks` bilgisini olayla gönderiyor;
  `seçimKutusu` için `seçili` ataması görsel seçimi güncelliyor.
- Pencere özellikleri (`herZamanÜstte`, `şeffaflık`, `tamEkran`, `ikon`, boyut,
  konum, min/maks boyut ve pencere düğmeleri) oluşturulduktan sonra da uygulanıyor.
- `pencere.ikon` artık Electron çalışma zamanında gerçekten kullanılıyor.
- Pencere boyutu güncellenirken diğer eksenin sıfırlanmasına yol açan hata giderildi.
- `özel`, `canvas`, `stil` / `css` için otomatik tamamlama, kod parçacıkları ve
  söz dizimi renklendirmesi eklendi.

## [0.6.0]

- **TürkUI grafik arayüz modülü** eklendi: `içe_aktar TürkUI` ile pencere, metin, buton,
  giriş, liste, görsel, ilerleme, onay kutusu, seçim kutusu, sekme, metin alanı, kaydırıcı,
  anahtar, radyo ve düzen bileşenleri kullanılabilir.
- TürkUI pencereleri VS Code içinde webview paneli olarak açılır; `turkui-window.html`
  arayüzü Studio sürümüyle aynı görünümü ve davranışı kullanır.
- Bileşen olay blokları (`dugme.tıklandığında ... son`), pencere düzeyi olaylar
  (`pencereAçıldığında`, `pencereKapatılırken`), canlı özellik atamaları ve renk
  paleti (`renk.mavi`, `renk.rgb`, `renk.hex`) desteklenir.
- `TürkUI.onay`, `TürkUI.sor`, dosya/klasör seçme ve bildirim diyalogları VS Code
  arayüzüne bağlandı.
- TürkUI kullanan programlar uzantı sürecinde çalışır; son pencere kapanana kadar olay
  işleyicileri yaşamaya devam eder. `Türkod: Durdur` açık pencereleri de kapatır.
- TürkUI üyeleri, pencere/bileşen özellikleri ve renkler için otomatik tamamlama eklendi;
  `gizle` canlı denetime tanıtıldı.
- `içe_aktar ` sonrasındaki öneri listesinde artık yalnızca modül adları görünür;
  anahtar kelimeler ve yerleşik komutlar listelenmez.
- `değişken` atamalarında Studio ile uyumlu `=` operatörü de kabul edilir
  (`değişken x = 5`, `nesne.alan = değer`).
- TürkUI modülü, bileşen metotları ve olay adları için ayrı söz dizimi renklendirmesi eklendi.
- TürkUI pencereleri artık VS Code'dan bağımsız, gerçek masaüstü pencerelerinde açılır
  (Windows Forms gibi): kendi başlık çubuğu, görev çubuğu düğmesi, boyutu ve konumu vardır.
  Program, çalıştırılırken sessizce Electron tabanlı bir `<Ad>.exe` uygulamasına paketlenir
  ve o uygulama başlatılır; Edge/Chrome penceresi kullanılmaz. Son pencere kapanınca uygulama
  sonlanır ve terminal kabuk istemine döner.
- **Türkod: Uygulama Olarak Paketle (.exe)** komutu eklendi: seçilen klasöre `<Ad>.exe`,
  Electron çalışma zamanı, `resources/app` ve uygulamaya özel `ikon.ico` üretir. Klasör
  başka bir bilgisayara kopyalanarak çalıştırılabilir.
- `turkod.electronKlasoru` ayarı eklendi; boşsa TURKOD Studio kurulumu ve `TURKOD_ELECTRON`
  ortam değişkeni üzerinden Electron aranır. Electron yoksa veya satır satır hata ayıklarken
  pencereler yedek olarak webview panelinde açılır.
- TürkUI çalışma zamanı testleri ve `test/turkui_showcase.tr` örnek uygulaması eklendi.

## [0.5.2]

- `kır` komutu eklendi: Python'daki `break` gibi içinde bulunduğu döngüyü hemen sonlandırır.
  Eski `dur` yazımı geriye dönük uyumluluk için aynen çalışmaya devam ediyor.
- `kır` söz dizimi renklendirmesine, otomatik tamamlamaya ve canlı denetime eklendi;
  döngü dışında kullanılırsa hata olarak bildirilir.
- `kır` / `dur` / `devam_et` davranışı için çalışma zamanı testleri eklendi.

## [0.5.1]

- Öneri ayrıntıları artık ayrı bir sekmede değil, **öneri listesinin hemen yanındaki**
  ayrıntı bölmesinde açılıyor.
- Belgeler zenginleştirildi: imza, açıklama, kategori ve örnek birlikte gösteriliyor.
- Öneri listesindeyken sağ ok tuşunu ele geçiren kısayol kaldırıldı; ayrıntı bölmesini
  `Ctrl+Space` ile açıp kapatabilirsiniz.
- `Türkod: Seçili Öneriyi Açıkla` komutu kaldırıldı; `Türkod: Açıklama Panelini Aç`
  komutu imleçteki öğeyi ayrı panelde göstermeye devam ediyor.

## [0.5.0]

- Canlı sözdizimi denetimi eklendi: yazarken hatalar **Problems** panelinde listeleniyor ve
  ilgili satırın altı kırmızı çiziliyor.
- Denetlenenler: eksik/fazla `son`, `eğer ... ise` ve `değilse-eğer ... ise` yapısı,
  `döngü ... kez`, `fonksiyon`/`nesne`/`için` tanımları, `değişken ... := ...`,
  `değilse`/`yakala` yerleşimi, kapatılmamış parantez/metin, yazımı yakın komutlar.
- Çok satırlı metinler ve arayüz olay blokları (`buton.tıklandığında ... son`) destekleniyor.

## [0.4.3]

- Söz dizimi renklendirme dosyasındaki geçersiz JSON kaçışı (`\s`) düzeltildi; bu hata
  nedeniyle dil bilgisi hiç yüklenemiyor ve `değilse eğer` / `değilse-eğer` renklenmiyordu.

## [0.4.2]

- `değilse-eğer` (else-if) söz dizimi eklendi: `eğer ... ise` / `değilse-eğer ... ise` / `değilse` / `son`.
- `değilse-eğer` zincirleri fonksiyon ve döngü içinde kullanıldığında bir dıştaki bloğun `son`
  satırının yanlışlıkla tüketilmesi (ve sonraki kodun yutulması) giderildi.
- Eski `değilse eğer` yazımı geriye dönük uyumluluk için desteklenmeye devam ediyor.
- Otomatik tamamlama ve söz dizimi renklendirmesine `değilse-eğer` eklendi.

## [0.4.1]

- Öneri listesinde sağ ok tuşuna basınca seçili Türkod öğesi yan panelde açıklanıyor
  (imza, kategori, açıklama ve örnek).
- `Türkod: Açıklama Panelini Aç` komutu imlecin altındaki öğeyi açıklar.

## [0.4.0]

- Çalıştırma artık gerçek bir terminalde yapılıyor: program bitince terminalde kabuk istemi
  (ör. `PS D:\proje>`) görünür ve terminal kullanılmaya devam edilebilir.
- Türkçe karakterler için terminal UTF-8 (chcp 65001) olarak ayarlanır.
- `iste` / `oku` girdisi terminalden normal şekilde alınır.
- Hata durumunda terminalde kırmızı hata satırı ve "Satıra git" düğmeli bildirim gösterilir.
- Hata ayıklama (satır satır) önceki davranışını korur.

## [0.3.4]

- Girdi (`oku` / `iste`) beklerken Durdur'a basıldığında çalıştırmanın takılı kalması giderildi.

## [0.3.3]

- Terminal oluşturulur oluşturulmaz yazılan çıktının kaybolması giderildi: terminal hazır olana kadar
  çıktı biriktiriliyor ve hazır olduğunda tek seferde basılıyor.
- Çalıştırma, terminal hazır olmadan başlamıyor; ilk çalıştırmada boş terminal sorunu giderildi.

## [0.3.2]

- Çıktı artık kabuğa `Write-Host`/`printf` komutu yazdırılmadan doğrudan Türkod terminaline basılıyor;
  terminalde yalnızca programın kendi çıktısı görünüyor (`yazdır("awdasd")` → `awdasd`).
- Dosya adı başlığı ve "Program bitti" satırı kaldırıldı.
- `iste` / `oku` girdisi terminalde normal yazılarak alınıyor; geçici dosya bekleme yöntemi kaldırıldı.

## [0.3.1]

- Durum çubuğunun sağ köşesine **Çalıştır** (▶) düğmesi eklendi; etkin dosya Türkod olduğunda
  görünür ve program çalışırken gizlenir.

## [0.3.0]

- Kod çalıştırma eklendi: `F5` ile program Türkod terminalinde çalışır.
- Satır satır hata ayıklama eklendi (`Shift+F5`): Devam / Sonraki satır / Durdur, satır vurgusu ve değişken dökümü.
- İmlece kadar çalıştırma (`Ctrl+Shift+F5`) ve seçimi çalıştırma (`Ctrl+Enter`) eklendi.
- Çalışan programı durdurma (`Ctrl+F2`) ve durum çubuğu göstergesi eklendi.
- Hata durumunda satır numarası, terminal çıktısı ve "Satıra git" düğmesi eklendi.
- Türkod yorumlayıcısı eklendi: değişkenler, koşullar, döngüler, fonksiyonlar, nesneler, `dene`/`yakala`,
  modüller (`içe_aktar`), metin/liste/sözlük/küme işlemleri ve yerleşik komutların büyük bölümü.

## [0.2.0]

- Otomatik tamamlama eklendi: anahtar kelimeler, sabitler, 254 yerleşik komut ve dosya içi semboller.
- Fonksiyonlar için parametre yer tutuculu snippet desteği eklendi.
- Nokta sonrası üye önerileri eklendi: metin, liste, sözlük, küme metotları ve nesne üyeleri.
- Kullanıcı tanımlı fonksiyonların yerleşik komutları gölgelemesi desteklendi.
- Modül önerileri kapsam dışı bırakıldı.

## [0.1.0]

- `.tr` dosyaları için Türkod dil desteği eklendi.
- Anahtar kelimeler, sabitler, yerleşik komutlar, metinler, sayılar, yorumlar ve operatörler için söz dizimi renklendirme eklendi.
- Fonksiyon tanımları, fonksiyon çağrıları, nesne türleri ve üye erişimleri renklendirildi.
- Parantez eşleştirme, otomatik kapatma ve blok girintileme kuralları eklendi.

## [0.0.1]

- İlk proje iskeleti.
