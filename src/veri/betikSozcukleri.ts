/**
 * `TürkUI.betik { pencere( ... ) }` bloklarında kullanılan Türkçe JavaScript.
 *
 * `stilOzellikleri.ts` (Türkçe CSS) dosyasının betik karşılığıdır. Üç tablo vardır:
 *
 * - `betikAnahtarKelimeleri`: söz dizimi (`değişken`, `eğer`, `fonksiyon`, ...)
 * - `betikGenelAdlari`: hazır nesneler ve işlevler (`belge`, `konsol`, `getir`, ...)
 * - `betikUyeAdlari`: nokta sonrası üyeler (`içerik`, `olayDinle`, `sırala`, ...)
 *
 * Bu tablolar `media/turkui-window.html` içindeki `TURKCE_BETIK_*` tablolarıyla
 * birebir aynı olmalıdır; `test/betik.cjs` ikisinin ayrışmadığını doğrular.
 * Yeni bir sözcük eklenecekse önce renderer'a, sonra buraya yazılır.
 */
export interface BetikSozcugu {
  /** Blokta yazılan Türkçe ad. */
  ad: string;
  /** Renderer'ın ürettiği JavaScript karşılığı. */
  karsilik: string;
  /** Kısa açıklama. */
  aciklama: string;
  /** Öneri yapıştırılırken kullanılan örnek. */
  ornek: string;
}

/** Söz dizimi anahtar kelimeleri. */
export const betikAnahtarKelimeleri: BetikSozcugu[] = [
  { ad: 'değişken', karsilik: 'let', aciklama: 'Değişken tanımlar.', ornek: 'değişken sayi := 0' },
  { ad: 'sabit', karsilik: 'const', aciklama: 'Değişmeyen sabit tanımlar.', ornek: 'sabit ad := "Metehan"' },
  { ad: 'eğer', karsilik: 'if', aciklama: 'Koşullu blok başlatır.', ornek: 'eğer (sayi > 5) { }' },
  { ad: 'değilse', karsilik: 'else', aciklama: 'Koşul yanlışsa çalışır.', ornek: 'değilse { }' },
  { ad: 'için', karsilik: 'for', aciklama: 'Sayarak döner.', ornek: 'için (değişken i := 0; i < 3; i++) { }' },
  { ad: 'iken', karsilik: 'while', aciklama: 'Koşul doğru oldukça döner.', ornek: 'iken (sayi < 10) { }' },
  { ad: 'yap', karsilik: 'do', aciklama: 'En az bir kez çalışan döngü başlatır.', ornek: 'yap { } iken (koşul)' },
  { ad: 'fonksiyon', karsilik: 'function', aciklama: 'İşlev tanımlar.', ornek: 'fonksiyon selam() { }' },
  { ad: 'geri_döndür', karsilik: 'return', aciklama: 'Değer döndürür.', ornek: 'geri_döndür sayi' },
  { ad: 'dön', karsilik: 'return', aciklama: 'Değer döndürür (kısa yol).', ornek: 'dön sayi' },
  { ad: 'kır', karsilik: 'break', aciklama: 'Döngüyü sonlandırır.', ornek: 'kır' },
  { ad: 'devam_et', karsilik: 'continue', aciklama: 'Sonraki tura geçer.', ornek: 'devam_et' },
  { ad: 'dene', karsilik: 'try', aciklama: 'Hata yakalama bloğu başlatır.', ornek: 'dene { } yakala (hata) { }' },
  { ad: 'yakala', karsilik: 'catch', aciklama: 'Hatayı yakalar.', ornek: 'yakala (hata) { }' },
  { ad: 'sonunda', karsilik: 'finally', aciklama: 'Her durumda çalışır.', ornek: 'sonunda { }' },
  { ad: 'fırlat', karsilik: 'throw', aciklama: 'Hata fırlatır.', ornek: 'fırlat "bir sorun var"' },
  { ad: 'yeni', karsilik: 'new', aciklama: 'Yeni nesne üretir.', ornek: 'yeni tarih()' },
  { ad: 'sınıf', karsilik: 'class', aciklama: 'Sınıf tanımlar.', ornek: 'sınıf Kisi { }' },
  { ad: 'bu', karsilik: 'this', aciklama: 'Geçerli nesneyi gösterir.', ornek: 'bu.ad' },
  { ad: 'bekle', karsilik: 'await', aciklama: 'Sözün sonucunu bekler.', ornek: 'bekle getir(url)' },
  { ad: 'eşzamansız', karsilik: 'async', aciklama: 'Eşzamansız işlev tanımlar.', ornek: 'eşzamansız fonksiyon yukle() { }' },
  { ad: 'türü', karsilik: 'typeof', aciklama: 'Değerin türünü verir.', ornek: 'türü sayi' },
  { ad: 'sil', karsilik: 'delete', aciklama: 'Nesne alanını siler.', ornek: 'sil kisi.ad' },
  { ad: 'içinde', karsilik: 'in', aciklama: 'Anahtar var mı diye bakar.', ornek: 'eğer ("ad" içinde kisi) { }' },
  { ad: 'ait', karsilik: 'of', aciklama: 'Değerler üzerinde döner.', ornek: 'için (değişken x ait liste) { }' },
  { ad: 've', karsilik: '&&', aciklama: 'Mantıksal "ve".', ornek: 'eğer (a ve b) { }' },
  { ad: 'veya', karsilik: '||', aciklama: 'Mantıksal "veya".', ornek: 'eğer (a veya b) { }' },
  { ad: 'değil', karsilik: '!', aciklama: 'Mantıksal "değil".', ornek: 'eğer (değil hazır) { }' },
  { ad: 'Doğru', karsilik: 'true', aciklama: 'Doğru değeri.', ornek: 'değişken hazır := Doğru' },
  { ad: 'Yanlış', karsilik: 'false', aciklama: 'Yanlış değeri.', ornek: 'değişken hazır := Yanlış' },
  { ad: 'Boş', karsilik: 'null', aciklama: 'Boş (tanımsız) değer.', ornek: 'değişken secim := Boş' },
  { ad: 'tanımsız', karsilik: 'undefined', aciklama: 'Tanımsız değer.', ornek: 'tanımsız' },
];

/** Hazır nesneler ve işlevler. */
export const betikGenelAdlari: BetikSozcugu[] = [
  { ad: 'belge', karsilik: 'document', aciklama: 'Sayfa belgesi.', ornek: 'belge.sorgula("#kutu")' },
  { ad: 'pencere', karsilik: 'window', aciklama: 'Pencere nesnesi.', ornek: 'pencere.genişlik' },
  { ad: 'konsol', karsilik: 'console', aciklama: 'Geliştirici konsolu.', ornek: 'konsol.yaz("Merhaba")' },
  { ad: 'mesajKutusu', karsilik: 'turkuiMessagebox', aciklama: 'Onay, soru ve hata mesajı pencereleri gösterir.', ornek: 'mesajKutusu.hataGöster("Hata", "Bir sorun oluştu")' },
  { ad: 'Zaman', karsilik: 'turkuiZaman', aciklama: 'Türkod zaman modülünün TürkUI betiğindeki bekleme işlevlerine erişir.', ornek: 'Zaman.bekle(1)' },
  { ad: 'matematik', karsilik: 'Math', aciklama: 'Matematik işlevleri.', ornek: 'matematik.yuvarla(1.6)' },
  { ad: 'tarih', karsilik: 'Date', aciklama: 'Tarih ve saat.', ornek: 'yeni tarih()' },
  { ad: 'json', karsilik: 'JSON', aciklama: 'JSON çözme ve yazma.', ornek: 'json.çöz(metin)' },
  { ad: 'söz', karsilik: 'Promise', aciklama: 'Eşzamansız işlem.', ornek: 'yeni söz(...)' },
  { ad: 'depo', karsilik: 'localStorage', aciklama: 'Kalıcı yerel depolama.', ornek: 'depo.ayarla("ad", "Metehan")' },
  { ad: 'oturumDeposu', karsilik: 'sessionStorage', aciklama: 'Oturumluk depolama.', ornek: 'oturumDeposu.ayarla("ad", "Metehan")' },
  { ad: 'zamanlayıcı', karsilik: 'setTimeout', aciklama: 'Bir süre sonra çalıştırır.', ornek: 'zamanlayıcı(fonksiyon() { }, 1000)' },
  { ad: 'aralık', karsilik: 'setInterval', aciklama: 'Belirli aralıkla çalıştırır.', ornek: 'aralık(fonksiyon() { }, 1000)' },
  { ad: 'zamanlayıcıDurdur', karsilik: 'clearTimeout', aciklama: 'Zamanlayıcıyı durdurur.', ornek: 'zamanlayıcıDurdur(kimlik)' },
  { ad: 'aralıkDurdur', karsilik: 'clearInterval', aciklama: 'Aralığı durdurur.', ornek: 'aralıkDurdur(kimlik)' },
  { ad: 'animasyonKaresi', karsilik: 'requestAnimationFrame', aciklama: 'Her çizim karesinde çalıştırır.', ornek: 'animasyonKaresi(dalga)' },
  { ad: 'animasyonDurdur', karsilik: 'cancelAnimationFrame', aciklama: 'Kare isteğini iptal eder.', ornek: 'animasyonDurdur(kimlik)' },
  { ad: 'getir', karsilik: 'fetch', aciklama: 'İnternetten veri ister.', ornek: 'bekle getir("https://ornek.com")' },
  { ad: 'uyarı', karsilik: 'alert', aciklama: 'Uyarı penceresi gösterir.', ornek: 'uyarı("Merhaba")' },
  { ad: 'onayla', karsilik: 'confirm', aciklama: 'Evet/hayır sorar.', ornek: 'onayla("Emin misin?")' },
  { ad: 'istek', karsilik: 'prompt', aciklama: 'Metin girdisi ister.', ornek: 'istek("Adın ne?")' },
  { ad: 'tamsayı', karsilik: 'parseInt', aciklama: 'Metni tam sayıya çevirir.', ornek: 'tamsayı("42")' },
  { ad: 'ondalık', karsilik: 'parseFloat', aciklama: 'Metni ondalığa çevirir.', ornek: 'ondalık("3.14")' },
  { ad: 'sayıya', karsilik: 'Number', aciklama: 'Sayıya çevirir.', ornek: 'sayıya("42")' },
  { ad: 'mantığa', karsilik: 'Boolean', aciklama: 'Mantıksal değere çevirir.', ornek: 'mantığa(1)' },
  { ad: 'metne', karsilik: 'String', aciklama: 'Metne çevirir.', ornek: 'metne(42)' },
  { ad: 'dizi', karsilik: 'Array', aciklama: 'Dizi üretir.', ornek: 'yeni dizi(1, 2, 3)' },
  { ad: 'nesne', karsilik: 'Object', aciklama: 'Nesne yardımcıları.', ornek: 'nesne.anahtarlar(kisi)' },
];

/** TürkUI mesaj kutusu metotları. */
export const mesajKutusuUyeAdlari: BetikSozcugu[] = [
  { ad: 'tamamİptalSor', karsilik: 'askokcancel', aciklama: 'Tamam/İptal sorar; Tamam seçilirse Doğru döndürür.', ornek: 'mesajKutusu.tamamİptalSor("Onay", "Devam edilsin mi?")' },
  { ad: 'Mesaj', karsilik: 'Message', aciklama: 'Mesaj kutusu gösterir. Kısa kullanımda iletiyi doğrudan alır ve hemen gösterir; nesne verilirse başlık/ileti ayarlanır.', ornek: 'mesajKutusu.Mesaj("Merhaba")' },
  { ad: 'soruSor', karsilik: 'askquestion', aciklama: 'Evet/Hayır sorar; "yes" veya "no" metnini döndürür.', ornek: 'mesajKutusu.soruSor("Soru", "Devam edilsin mi?")' },
  { ad: 'yenidenDeneİptalSor', karsilik: 'askretrycancel', aciklama: 'Yeniden Dene/İptal sorar; Yeniden Dene seçilirse Doğru döndürür.', ornek: 'mesajKutusu.yenidenDeneİptalSor("Bağlantı", "Yeniden denensin mi?")' },
  { ad: 'evetHayırSor', karsilik: 'askyesno', aciklama: 'Evet/Hayır sorar ve Doğru/Yanlış döndürür.', ornek: 'mesajKutusu.evetHayırSor("Onay", "Silinsin mi?")' },
  { ad: 'hataGöster', karsilik: 'showerror', aciklama: 'Hata simgeli mesaj penceresi gösterir.', ornek: 'mesajKutusu.hataGöster("Hata", "Bir sorun oluştu")' },
  { ad: 'uyarıGöster', karsilik: 'showwarning', aciklama: 'Uyarı simgeli mesaj penceresi gösterir.', ornek: 'mesajKutusu.uyarıGöster("Uyarı", "Dikkat")' },
  { ad: 'göster', karsilik: 'show', aciklama: 'Hazırlanan mesaj kutusunu gösterir.', ornek: 'yeni mesajKutusu.Mesaj({başlık: "Bilgi", ileti: "Merhaba"}).göster()' },
];

/**
 * `olayDinle` / `olayKaldır` çağrısında metin olarak yazılan Türkçe olay adları.
 *
 * Renderer'daki `TURKCE_BETIK_OLAY` tablosuyla birebir aynı olmalıdır;
 * `test/betik.cjs` ikisinin ayrışmadığını doğrular.
 */
export const betikOlayAdlari: BetikSozcugu[] = [
  { ad: 'tıklandığında', karsilik: 'click', aciklama: 'Öğeye tıklanınca çalışır.', ornek: 'düğme.olayDinle("tıklandığında", işlev)' },
  { ad: 'çiftTıklandığında', karsilik: 'dblclick', aciklama: 'Öğeye çift tıklanınca çalışır.', ornek: 'kutu.olayDinle("çiftTıklandığında", işlev)' },
  { ad: 'sağTıklandığında', karsilik: 'contextmenu', aciklama: 'Öğeye sağ tıklanınca çalışır.', ornek: 'kutu.olayDinle("sağTıklandığında", işlev)' },
  { ad: 'basıldığında', karsilik: 'mousedown', aciklama: 'Fare düğmesine basılınca çalışır.', ornek: 'kutu.olayDinle("basıldığında", işlev)' },
  { ad: 'bırakıldığında', karsilik: 'mouseup', aciklama: 'Fare düğmesi bırakılınca çalışır.', ornek: 'kutu.olayDinle("bırakıldığında", işlev)' },
  { ad: 'üzerineGelindiğinde', karsilik: 'mouseenter', aciklama: 'Fare öğenin üzerine gelince çalışır.', ornek: 'kutu.olayDinle("üzerineGelindiğinde", işlev)' },
  { ad: 'üzerindenÇıkıldığında', karsilik: 'mouseleave', aciklama: 'Fare öğenin üzerinden çıkınca çalışır.', ornek: 'kutu.olayDinle("üzerindenÇıkıldığında", işlev)' },
  { ad: 'fareHareketinde', karsilik: 'mousemove', aciklama: 'Fare öğe üzerinde hareket ederken çalışır.', ornek: 'kutu.olayDinle("fareHareketinde", işlev)' },
  { ad: 'fareTekerleği', karsilik: 'wheel', aciklama: 'Fare tekerleği çevrilince çalışır.', ornek: 'kutu.olayDinle("fareTekerleği", işlev)' },
  { ad: 'tuşBasılınca', karsilik: 'keydown', aciklama: 'Klavye tuşuna basılınca çalışır.', ornek: 'giriş.olayDinle("tuşBasılınca", işlev)' },
  { ad: 'tuşBırakılınca', karsilik: 'keyup', aciklama: 'Klavye tuşu bırakılınca çalışır.', ornek: 'giriş.olayDinle("tuşBırakılınca", işlev)' },
  { ad: 'tuşBasımı', karsilik: 'keypress', aciklama: 'Tuşa basılıp karakter üretilince çalışır.', ornek: 'giriş.olayDinle("tuşBasımı", işlev)' },
  { ad: 'değiştiğinde', karsilik: 'change', aciklama: 'Değer değişip alan bırakılınca çalışır.', ornek: 'giriş.olayDinle("değiştiğinde", işlev)' },
  { ad: 'girdiğinde', karsilik: 'input', aciklama: 'Her yazılan karakterde çalışır.', ornek: 'giriş.olayDinle("girdiğinde", işlev)' },
  { ad: 'odaklandığında', karsilik: 'focus', aciklama: 'Öğe odak alınca çalışır.', ornek: 'giriş.olayDinle("odaklandığında", işlev)' },
  { ad: 'odağıKaybettiğinde', karsilik: 'blur', aciklama: 'Öğe odağı kaybedince çalışır.', ornek: 'giriş.olayDinle("odağıKaybettiğinde", işlev)' },
  { ad: 'gönderildiğinde', karsilik: 'submit', aciklama: 'Form gönderilince çalışır.', ornek: 'form.olayDinle("gönderildiğinde", işlev)' },
  { ad: 'yüklendiğinde', karsilik: 'load', aciklama: 'Sayfa yüklenince çalışır.', ornek: 'pencere.olayDinle("yüklendiğinde", işlev)' },
];

/** Nokta sonrası üye adları. */
export const betikUyeAdlari: BetikSozcugu[] = [
  // Belge öğeleri
  { ad: 'içerik', karsilik: 'textContent', aciklama: 'Öğenin yazısı.', ornek: 'etiket.içerik := "Merhaba"' },
  { ad: 'metin', karsilik: 'textContent', aciklama: 'Öğenin yazısı (eş anlamlı).', ornek: 'düğme.metin := "Tamam"' },
  { ad: 'html', karsilik: 'innerHTML', aciklama: 'Öğenin HTML içeriği.', ornek: 'kutu.html := "<b>kalın</b>"' },
  { ad: 'değer', karsilik: 'value', aciklama: 'Girdi alanının değeri.', ornek: 'giriş.değer' },
  { ad: 'sınıfEkle', karsilik: 'classList.add', aciklama: 'CSS sınıfı ekler.', ornek: 'kutu.sınıfEkle("vurgulu")' },
  { ad: 'sınıfSil', karsilik: 'classList.remove', aciklama: 'CSS sınıfını siler.', ornek: 'kutu.sınıfSil("vurgulu")' },
  { ad: 'sınıfDeğiştir', karsilik: 'classList.toggle', aciklama: 'CSS sınıfını aç/kapat yapar.', ornek: 'kutu.sınıfDeğiştir("vurgulu")' },
  { ad: 'sınıfVar', karsilik: 'classList.contains', aciklama: 'CSS sınıfı var mı diye bakar.', ornek: 'kutu.sınıfVar("vurgulu")' },
  { ad: 'sınıflar', karsilik: 'classList', aciklama: 'Öğenin CSS sınıf listesi.', ornek: 'kutu.sınıflar' },
  { ad: 'olayDinle', karsilik: 'addEventListener', aciklama: 'Olay dinleyicisi ekler.', ornek: 'düğme.olayDinle("click", işlev)' },
  { ad: 'olayKaldır', karsilik: 'removeEventListener', aciklama: 'Olay dinleyicisini kaldırır.', ornek: 'düğme.olayKaldır("click", işlev)' },
  { ad: 'sorgula', karsilik: 'querySelector', aciklama: 'İlk eşleşen öğeyi bulur.', ornek: 'belge.sorgula(".kart")' },
  { ad: 'sorgulaTümü', karsilik: 'querySelectorAll', aciklama: 'Tüm eşleşen öğeleri bulur.', ornek: 'belge.sorgulaTümü(".kart")' },
  { ad: 'çocukEkle', karsilik: 'appendChild', aciklama: 'Alt öğe ekler.', ornek: 'kutu.çocukEkle(yeniÖğe)' },
  { ad: 'kaldır', karsilik: 'remove', aciklama: 'Öğeyi sayfadan kaldırır.', ornek: 'kutu.kaldır()' },
  { ad: 'odaklan', karsilik: 'focus', aciklama: 'Öğeye odaklanır.', ornek: 'giriş.odaklan()' },
  { ad: 'odakKaldır', karsilik: 'blur', aciklama: 'Öğenin odağını kaldırır.', ornek: 'giriş.odakKaldır()' },
  { ad: 'stilVer', karsilik: 'style.setProperty', aciklama: 'Tek bir CSS özelliği yazar.', ornek: 'kutu.stilVer("width", "100px")' },
  { ad: 'stilAl', karsilik: 'style.getPropertyValue', aciklama: 'Bir CSS özelliğini okur.', ornek: 'kutu.stilAl("width")' },
  // Dizi ve metin
  { ad: 'uzunluk', karsilik: 'length', aciklama: 'Dizinin/metnin uzunluğu.', ornek: 'liste.uzunluk' },
  { ad: 'ekle', karsilik: 'push', aciklama: 'Dizinin sonuna ekler.', ornek: 'liste.ekle(5)' },
  { ad: 'çıkar', karsilik: 'pop', aciklama: 'Dizinin sonundan çıkarır.', ornek: 'liste.çıkar()' },
  { ad: 'baştanal', karsilik: 'shift', aciklama: 'Dizinin başından çıkarır.', ornek: 'liste.baştanal()' },
  { ad: 'başaEkle', karsilik: 'unshift', aciklama: 'Dizinin başına ekler.', ornek: 'liste.başaEkle(0)' },
  { ad: 'birleştir', karsilik: 'join', aciklama: 'Diziyi metne çevirir.', ornek: 'liste.birleştir(", ")' },
  { ad: 'böl', karsilik: 'split', aciklama: 'Metni diziye böler.', ornek: 'metin.böl(" ")' },
  { ad: 'dilimle', karsilik: 'slice', aciklama: 'Parça alır.', ornek: 'liste.dilimle(0, 3)' },
  { ad: 'içerir', karsilik: 'includes', aciklama: 'İçeriyor mu diye bakar.', ornek: 'liste.içerir(5)' },
  { ad: 'süz', karsilik: 'filter', aciklama: 'Koşula uyanları seçer.', ornek: 'liste.süz(x => x > 3)' },
  { ad: 'dönüştür', karsilik: 'map', aciklama: 'Her öğeyi dönüştürür.', ornek: 'liste.dönüştür(x => x * 2)' },
  { ad: 'azalt', karsilik: 'reduce', aciklama: 'Tek değere indirger.', ornek: 'liste.azalt((a, b) => a + b, 0)' },
  { ad: 'sırala', karsilik: 'sort', aciklama: 'Sıralar.', ornek: 'liste.sırala()' },
  { ad: 'tersÇevir', karsilik: 'reverse', aciklama: 'Sırayı ters çevirir.', ornek: 'liste.tersÇevir()' },
  { ad: 'bul', karsilik: 'find', aciklama: 'İlk uyanı bulur.', ornek: 'liste.bul(x => x > 3)' },
  { ad: 'indeks', karsilik: 'indexOf', aciklama: 'Konumunu bulur.', ornek: 'liste.indeks(5)' },
  { ad: 'büyükHarf', karsilik: 'toUpperCase', aciklama: 'Büyük harfe çevirir.', ornek: 'metin.büyükHarf()' },
  { ad: 'küçükHarf', karsilik: 'toLowerCase', aciklama: 'Küçük harfe çevirir.', ornek: 'metin.küçükHarf()' },
  { ad: 'kırp', karsilik: 'trim', aciklama: 'Baş/son boşlukları siler.', ornek: 'metin.kırp()' },
  { ad: 'değiştir', karsilik: 'replace', aciklama: 'Metin parçasını değiştirir.', ornek: 'metin.değiştir("a", "b")' },
  { ad: 'tekrarla', karsilik: 'repeat', aciklama: 'Metni tekrarlar.', ornek: 'metin.tekrarla(3)' },
  { ad: 'başlar', karsilik: 'startsWith', aciklama: 'Bu metinle başlıyor mu?', ornek: 'metin.başlar("Mer")' },
  { ad: 'biter', karsilik: 'endsWith', aciklama: 'Bu metinle bitiyor mu?', ornek: 'metin.biter("haba")' },
  { ad: 'metneÇevir', karsilik: 'toString', aciklama: 'Metne çevirir.', ornek: 'sayi.metneÇevir()' },
  // Söz
  { ad: 'sonra', karsilik: 'then', aciklama: 'Söz tamamlanınca çalışır.', ornek: 'getir(url).sonra(...)' },
  { ad: 'yakala', karsilik: 'catch', aciklama: 'Söz hatasını yakalar.', ornek: 'getir(url).yakala(...)' },
  // Zaman ve yerel biçim
  { ad: 'yerelSaatMetni', karsilik: 'toLocaleTimeString', aciklama: 'Saati yerel biçimde metne çevirir.', ornek: 'tarih.yerelSaatMetni("tr-TR")' },
  { ad: 'yerelTarihMetni', karsilik: 'toLocaleDateString', aciklama: 'Tarihi yerel biçimde metne çevirir.', ornek: 'tarih.yerelTarihMetni("tr-TR")' },
  { ad: 'yerelMetin', karsilik: 'toLocaleString', aciklama: 'Tarihi ve saati yerel biçimde metne çevirir.', ornek: 'sayi.yerelMetin("tr-TR")' },
  // Olay ve öğe
  { ad: 'engelle', karsilik: 'preventDefault', aciklama: 'Olayın varsayılan davranışını engeller.', ornek: 'olay.engelle()' },
  { ad: 'tuş', karsilik: 'key', aciklama: 'Basılan tuşun adı.', ornek: 'olay.tuş' },
  { ad: 'genişlik', karsilik: 'width', aciklama: 'Öğenin genişliği.', ornek: 'tuval.genişlik' },
  { ad: 'yükseklik', karsilik: 'height', aciklama: 'Öğenin yüksekliği.', ornek: 'tuval.yükseklik' },
  // Tuval (canvas) çizimi
  { ad: 'bağlamAl', karsilik: 'getContext', aciklama: 'Çizim bağlamını alır.', ornek: 'tuval.bağlamAl("2d")' },
  { ad: 'dolguRengi', karsilik: 'fillStyle', aciklama: 'Dolgu rengi.', ornek: 'bağlam.dolguRengi := "mavi"' },
  { ad: 'çizgiRengi', karsilik: 'strokeStyle', aciklama: 'Çizgi rengi.', ornek: 'bağlam.çizgiRengi := "beyaz"' },
  { ad: 'çizgiKalınlığı', karsilik: 'lineWidth', aciklama: 'Çizgi kalınlığı.', ornek: 'bağlam.çizgiKalınlığı := 2' },
  { ad: 'yazıTipi', karsilik: 'font', aciklama: 'Tuval yazı tipi.', ornek: 'bağlam.yazıTipi := "16px Consolas"' },
  { ad: 'saydamlık', karsilik: 'globalAlpha', aciklama: 'Genel saydamlık (0-1).', ornek: 'bağlam.saydamlık := 0.6' },
  { ad: 'alanıTemizle', karsilik: 'clearRect', aciklama: 'Dikdörtgen alanı temizler.', ornek: 'bağlam.alanıTemizle(0, 0, 800, 220)' },
  { ad: 'dolguDikdörtgen', karsilik: 'fillRect', aciklama: 'Dolu dikdörtgen çizer.', ornek: 'bağlam.dolguDikdörtgen(0, 0, 10, 10)' },
  { ad: 'çizgiDikdörtgen', karsilik: 'strokeRect', aciklama: 'Çerçeve dikdörtgen çizer.', ornek: 'bağlam.çizgiDikdörtgen(0, 0, 10, 10)' },
  { ad: 'doldur', karsilik: 'fill', aciklama: 'Yolu doldurur.', ornek: 'bağlam.doldur()' },
  { ad: 'çiz', karsilik: 'stroke', aciklama: 'Yolun çizgisini çizer.', ornek: 'bağlam.çiz()' },
  { ad: 'yolBaşlat', karsilik: 'beginPath', aciklama: 'Yeni çizim yolu başlatır.', ornek: 'bağlam.yolBaşlat()' },
  { ad: 'yolKapat', karsilik: 'closePath', aciklama: 'Çizim yolunu kapatır.', ornek: 'bağlam.yolKapat()' },
  { ad: 'taşı', karsilik: 'moveTo', aciklama: 'Çizim imlecini taşır.', ornek: 'bağlam.taşı(0, 0)' },
  { ad: 'çizgiEkle', karsilik: 'lineTo', aciklama: 'İmleçten çizgi çeker.', ornek: 'bağlam.çizgiEkle(100, 50)' },
  { ad: 'yay', karsilik: 'arc', aciklama: 'Yay veya daire çizer.', ornek: 'bağlam.yay(50, 50, 20, 0, 6.28)' },
  { ad: 'yazıYaz', karsilik: 'fillText', aciklama: 'Tuval üzerine yazı yazar.', ornek: 'bağlam.yazıYaz("Merhaba", 10, 20)' },
  { ad: 'çizgiYazı', karsilik: 'strokeText', aciklama: 'Çerçeveli yazı yazar.', ornek: 'bağlam.çizgiYazı("Merhaba", 10, 20)' },
  { ad: 'ölç', karsilik: 'measureText', aciklama: 'Yazının ölçüsünü verir.', ornek: 'bağlam.ölç("Merhaba").genişlik' },
  { ad: 'kaydet', karsilik: 'save', aciklama: 'Çizim durumunu saklar.', ornek: 'bağlam.kaydet()' },
  { ad: 'geriAl', karsilik: 'restore', aciklama: 'Saklanan çizim durumuna döner.', ornek: 'bağlam.geriAl()' },
  { ad: 'döndür', karsilik: 'rotate', aciklama: 'Tuvali döndürür.', ornek: 'bağlam.döndür(0.5)' },
  { ad: 'ötele', karsilik: 'translate', aciklama: 'Tuvali kaydırır.', ornek: 'bağlam.ötele(100, 0)' },
  { ad: 'ölçekle', karsilik: 'scale', aciklama: 'Tuvali ölçekler.', ornek: 'bağlam.ölçekle(2, 2)' },
  // Matematik
  { ad: 'yuvarla', karsilik: 'round', aciklama: 'En yakın tam sayıya yuvarlar.', ornek: 'matematik.yuvarla(1.6)' },
  { ad: 'taban', karsilik: 'floor', aciklama: 'Aşağı yuvarlar.', ornek: 'matematik.taban(1.9)' },
  { ad: 'tavan', karsilik: 'ceil', aciklama: 'Yukarı yuvarlar.', ornek: 'matematik.tavan(1.1)' },
  { ad: 'mutlak', karsilik: 'abs', aciklama: 'Mutlak değer.', ornek: 'matematik.mutlak(-5)' },
  { ad: 'rastgele', karsilik: 'random', aciklama: '0-1 arası rastgele sayı.', ornek: 'matematik.rastgele()' },
  { ad: 'üs', karsilik: 'pow', aciklama: 'Üs alır.', ornek: 'matematik.üs(2, 3)' },
  { ad: 'karekök', karsilik: 'sqrt', aciklama: 'Karekök alır.', ornek: 'matematik.karekök(16)' },
  { ad: 'enAz', karsilik: 'min', aciklama: 'En küçük değer.', ornek: 'matematik.enAz(3, 7)' },
  { ad: 'enÇok', karsilik: 'max', aciklama: 'En büyük değer.', ornek: 'matematik.enÇok(3, 7)' },
  { ad: 'sinüs', karsilik: 'sin', aciklama: 'Sinüs değeri.', ornek: 'matematik.sinüs(0)' },
  { ad: 'kosinüs', karsilik: 'cos', aciklama: 'Kosinüs değeri.', ornek: 'matematik.kosinüs(0)' },
  { ad: 'tanjant', karsilik: 'tan', aciklama: 'Tanjant değeri.', ornek: 'matematik.tanjant(0)' },
  // Konsol
  { ad: 'yaz', karsilik: 'log', aciklama: 'Konsola yazar.', ornek: 'konsol.yaz("Merhaba")' },
  { ad: 'uyar', karsilik: 'warn', aciklama: 'Konsola uyarı yazar.', ornek: 'konsol.uyar("Dikkat")' },
  { ad: 'hata', karsilik: 'error', aciklama: 'Konsola hata yazar.', ornek: 'konsol.hata("Sorun")' },
  { ad: 'bilgi', karsilik: 'info', aciklama: 'Konsola bilgi yazar.', ornek: 'konsol.bilgi("Bilgi")' },
];
