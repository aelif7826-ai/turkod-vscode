/**
 * TürkUI tamamlama verileri.
 *
 * Bileşen API'si TURKOD Studio ile aynıdır; burada yalnızca editörde öneri
 * olarak gösterilecek adlar, imzalar ve kısa açıklamalar tutulur.
 */

export interface TurkuiUyeVerisi {
  ad: string;
  aciklama: string;
  imza: string;
  parametreler?: string[];
  tur?: 'fonksiyon' | 'özellik' | 'blok';
  /** `blok` türündeki üyelerin yapıştırılacak iskeleti. */
  snippet?: string;
  /**
   * Pencere üzerinde görsel bileşen (nesne) üreten üye mi?
   *
   * `buton`, `metin`, `canvas` ... gibi bileşenler öneri listesinde en üstte
   * ve farklı simgeyle gösterilir.
   */
  bilesen?: boolean;
}

const fonksiyon = (
  ad: string,
  imza: string,
  aciklama: string,
  parametreler: string[] = []
): TurkuiUyeVerisi => ({ ad, imza, aciklama, parametreler, tur: 'fonksiyon' });

const ozellik = (ad: string, imza: string, aciklama: string): TurkuiUyeVerisi => ({
  ad,
  imza,
  aciklama,
  tur: 'özellik',
});

/**
 * Olay bloğu üyesi: `bileşen.tıklandığında ... son`.
 *
 * Öneri listesinde parçacık (snippet) olarak görünür; seçildiğinde olay bloğu
 * iskeleti yazılır.
 */
const olay = (ad: string, aciklama: string, govde = 'yazdır("olay")'): TurkuiUyeVerisi => ({
  ad,
  imza: `${ad} · olay bloğu`,
  aciklama: `${aciklama} Bloğu \`bileşen.${ad}\` ile başlatıp \`son\` ile kapatın.`,
  tur: 'blok',
  snippet: `${ad}\n\t\${1:${govde}}\nson`,
});

/** `TürkUI.` sonrasında önerilen modül üyeleri. */
export const turkuiUyeleri: TurkuiUyeVerisi[] = [
  fonksiyon('pencere', 'pencere(başlık: metin) · pencere', 'Yeni bir TürkUI penceresi oluşturur.', ['başlık']),
  fonksiyon('uyarı', 'uyarı(mesaj: metin)', 'Uyarı penceresi gösterir.', ['mesaj']),
  fonksiyon('bilgi', 'bilgi(mesaj: metin)', 'Bilgi penceresi gösterir.', ['mesaj']),
  fonksiyon('onay', 'onay(soru: metin) · mantıksal', 'Evet/Hayır onayı ister.', ['soru']),
  fonksiyon('sor', 'sor(soru: metin, varsayılan := "") · metin', 'Kullanıcıdan metin girişi ister.', ['soru', 'varsayılan']),
  fonksiyon('dosyaSeç', 'dosyaSeç(başlık := "", uzantılar := "") · metin', 'Dosya seçme penceresi açar.', ['başlık', 'uzantılar']),
  fonksiyon('dosyaKaydet', 'dosyaKaydet(varsayılanAd := "", uzantılar := "") · metin', 'Kaydetme penceresi açar.', ['varsayılanAd', 'uzantılar']),
  fonksiyon('klasörSeç', 'klasörSeç(başlık := "") · metin', 'Klasör seçme penceresi açar.', ['başlık']),
  fonksiyon('bildirim', 'bildirim(başlık: metin, içerik := "")', 'Masaüstü bildirimi gösterir.', ['başlık', 'içerik']),
  fonksiyon('hepsiKapat', 'hepsiKapat()', 'Açık tüm TürkUI pencerelerini kapatır.'),
  ozellik('ekran', 'ekran · sözlük', 'Ekran bilgileri (genişlik, yükseklik, ölçek, çalışmaAlanı).'),
  ozellik('pencereSayısı', 'pencereSayısı · sayı', 'Açık pencere sayısı.'),
  ozellik('fare', 'fare · sözlük', 'Canlı fare durumu (x, y, solTık, sağTık, ortaTık, tekerlek).'),
  ozellik('klavye', 'klavye · sözlük', 'Canlı klavye durumu (tuş, basıldığında, bırakıldığında).'),
  ozellik('renk', 'renk · renk nesnesi', 'Hazır renkler (renk.mavi, renk.kırmızı, renk.rgb(...)).'),
  {
    ad: 'stil',
    imza: 'stil { hedef( özellik: değer · üzerineGelince( ... ) ) }',
    aciklama:
      'Bileşen stillerini Türkçe özellik adlarıyla tanımlar. HTML ve İngilizce CSS gerekmez. ' +
      'Durumlar da Türkçedir: `üzerineGelince` (:hover), `basılıyken` (:active), `odaklıyken` (:focus) ...',
    tur: 'blok',
    snippet:
      'stil {\n\t${1:bileşen}(\n\t\t${2:arkaPlanRengi}: ${3:kırmızı}\n\t\t${4:kenarYuvarlaklığı}: ${5:10px}\n\t\t${6:üzerineGelince}(\n\t\t\t${7:arkaPlanRengi}: ${8:mavi}\n\t\t)\n\t)\n}',
  },
  {
    ad: 'betik',
    imza: 'betik { pencere( ... ) }',
    aciklama:
      'Pencere ve bileşen olaylarını Türkçe JavaScript ile yönetir. Betik gövdesinde değişken, koşul, işlev ve olay adları Türkçedir.',
    tur: 'blok',
    snippet: 'betik {\n\tuygulama(\n\t\t${1}\n\t)\n}',
  },
];

/**
 * TürkUI penceresinin ürettiği görsel bileşenler (nesneler).
 *
 * Öneri listesinde bunlar en üstte, kendi aralarında alfabetik sırada
 * gösterilir; kalan pencere üyeleri (komutlar ve özellikler) onların
 * arkasından alfabetik olarak gelir.
 */
export const TURKUI_BILESEN_ADLARI = [
  'metin', 'buton', 'giriş', 'kutu', 'liste', 'görsel', 'ilerleme',
  'onayKutusu', 'seçimKutusu', 'sekme', 'dikeyDüzen', 'yatayDüzen',
  'gridDüzen', 'esnekAlan', 'metinAlanı', 'kaydırıcı', 'anahtar', 'radyo',
  'özel', 'canvas', 'tarayıcı', 'webTarayıcı', 'webBrowser',
  'ses', 'tablo', 'modal',
];

/** Bir pencere üyesi görsel bileşen mi? */
export function turkuiBileseniMi(ad: string): boolean {
  return TURKUI_BILESEN_ADLARI.includes(ad);
}

const pencereBilesenleri: TurkuiUyeVerisi[] = [
  fonksiyon('metin', 'metin(metin: metin) · bileşen', 'Metin bileşeni ekler.', ['metin']),
  fonksiyon('buton', 'buton(etiket: metin) · buton', 'Buton bileşeni ekler.', ['etiket']),
  fonksiyon('giriş', 'giriş(yerTutucu := "") · giriş', 'Metin girişi bileşeni ekler.', ['yerTutucu']),
  fonksiyon('kutu', 'kutu() · kutu', 'Kutu (kapsayıcı) bileşeni ekler.'),
  fonksiyon('liste', 'liste() · liste', 'Liste bileşeni ekler.'),
  fonksiyon('görsel', 'görsel(kaynak: metin) · görsel', 'Görsel bileşeni ekler.', ['kaynak']),
  fonksiyon('ilerleme', 'ilerleme() · ilerleme', 'İlerleme çubuğu ekler.'),
  fonksiyon('onayKutusu', 'onayKutusu(metin: metin) · onayKutusu', 'Onay kutusu ekler.', ['metin']),
  fonksiyon('seçimKutusu', 'seçimKutusu() · seçimKutusu', 'Açılır seçim kutusu ekler.'),
  fonksiyon('sekme', 'sekme() · sekme', 'Sekme bileşeni ekler.'),
  fonksiyon('dikeyDüzen', 'dikeyDüzen() · düzen', 'Dikey düzen ekler.'),
  fonksiyon('yatayDüzen', 'yatayDüzen() · düzen', 'Yatay düzen ekler.'),
  fonksiyon('gridDüzen', 'gridDüzen() · düzen', 'Izgara düzen ekler.'),
  fonksiyon('esnekAlan', 'esnekAlan() · esnek alan', 'Kalan boşluğu dolduran esnek alan ekler.'),
  fonksiyon('metinAlanı', 'metinAlanı(yerTutucu := "") · metinAlanı', 'Çok satırlı metin alanı ekler.', ['yerTutucu']),
  fonksiyon('kaydırıcı', 'kaydırıcı(minimum := 0, maksimum := 100) · kaydırıcı', 'Kaydırıcı ekler.', ['minimum', 'maksimum']),
  fonksiyon('anahtar', 'anahtar(metin := "") · anahtar', 'Açma/kapama anahtarı ekler.', ['metin']),
  fonksiyon('radyo', 'radyo(seçenekler: liste) · radyo', 'Radyo düğmesi grubu ekler.', ['seçenekler']),
  fonksiyon('özel', 'özel(html: metin, css := "") · özel', 'Ham HTML/CSS ile özel bileşen ekler.', ['html', 'css']),
  fonksiyon('canvas', 'canvas(genişlik := 640, yükseklik := 360) · canvas', '2B çizim tuvali ekler.', ['genişlik', 'yükseklik']),
  fonksiyon('ses', 'ses(kaynak: metin, döngü := yanlış) · ses', 'Ses dosyası çalar (mp3, wav, ogg).', ['kaynak', 'döngü']),
  fonksiyon('tablo', 'tablo(başlıklar := liste) · tablo', 'Başlıklı satır/sütun tablosu ekler.', ['başlıklar']),
  fonksiyon('modal', 'modal(başlık := "") · modal', 'Pencereyi kaplayan katman (modal) ekler.', ['başlık']),
  fonksiyon('tarayıcı', 'tarayıcı(adres := "") · tarayıcı', 'Gömülü web tarayıcı bileşeni ekler.', ['adres']),
  fonksiyon('webTarayıcı', 'webTarayıcı(adres := "") · tarayıcı', 'Gömülü web tarayıcı bileşeni ekler (takma ad).', ['adres']),
  fonksiyon('webBrowser', 'webBrowser(adres := "") · tarayıcı', 'Gömülü web tarayıcı bileşeni ekler (takma ad).', ['adres']),
  fonksiyon('stil', 'stil(css: metin)', 'Pencereye genel CSS ekler.', ['css']),
  fonksiyon('css', 'css(css: metin)', 'Pencereye genel CSS ekler.', ['css']),
  fonksiyon('merkezle', 'merkezle()', 'Pencereyi ekranın ortasına taşır.'),
  fonksiyon('odaklan', 'odaklan()', 'Pencereyi öne getirir.'),
  fonksiyon('logo', 'logo(dosya: metin)', 'Pencereye logo (uygulama simgesi) atar.', ['dosya']),
  fonksiyon('pencereArkaPlanResmi', 'pencereArkaPlanResmi(dosya: metin)', 'Pencereye arka plan resmi atar.', ['dosya']),
  fonksiyon('arkaPlanResmiAyarla', 'arkaPlanResmiAyarla(dosya: metin)', 'Pencereye arka plan resmi atar.', ['dosya']),
  fonksiyon('göster', 'göster()', 'Pencereyi gösterir.'),
  fonksiyon('gizle', 'gizle()', 'Pencereyi gizler.'),
  fonksiyon('küçült', 'küçült()', 'Pencereyi küçültür.'),
  fonksiyon('büyüt', 'büyüt()', 'Pencereyi büyütür.'),
  fonksiyon('normal', 'normal()', 'Pencereyi normal boyuta döndürür.'),
  fonksiyon('kapat', 'kapat()', 'Pencereyi kapatır.'),
  ozellik('başlık', 'başlık · metin', 'Pencere başlığı.'),
  ozellik('arkaPlan', 'arkaPlan · renk', 'Pencere arka plan rengi.'),
  ozellik('genişlik', 'genişlik · sayı', 'Pencere genişliği.'),
  ozellik('yükseklik', 'yükseklik · sayı', 'Pencere yüksekliği.'),
  ozellik('x', 'x · sayı', 'Pencere yatay konumu.'),
  ozellik('y', 'y · sayı', 'Pencere dikey konumu.'),
  ozellik('minGenişlik', 'minGenişlik · sayı', 'En küçük pencere genişliği.'),
  ozellik('minYükseklik', 'minYükseklik · sayı', 'En küçük pencere yüksekliği.'),
  ozellik('maksGenişlik', 'maksGenişlik · sayı', 'En büyük pencere genişliği.'),
  ozellik('maksYükseklik', 'maksYükseklik · sayı', 'En büyük pencere yüksekliği.'),
  ozellik('şeffaflık', 'şeffaflık · sayı', 'Pencere saydamlığı (0-1).'),
  ozellik('herZamanÜstte', 'herZamanÜstte · mantıksal', 'Pencere her zaman üstte mi?'),
  ozellik('üstte', 'üstte · mantıksal', 'Pencere her zaman üstte mi?'),
  ozellik('çerçevesiz', 'çerçevesiz · mantıksal', 'Pencere çerçevesiz mi?'),
  ozellik('boyutlandırılabilir', 'boyutlandırılabilir · mantıksal', 'Pencere boyutlandırılabilir mi?'),
  ozellik('başlıkÇubuğu', 'başlıkÇubuğu · mantıksal', 'Özel başlık çubuğu gösterilsin mi?'),
  ozellik('tamEkran', 'tamEkran · mantıksal', 'Pencere tam ekran mı?'),
  ozellik('küçültülebilir', 'küçültülebilir · mantıksal', 'Pencere küçültülebilir mi?'),
  ozellik('büyütülebilir', 'büyütülebilir · mantıksal', 'Pencere büyütülebilir mi?'),
  ozellik('kapatılabilir', 'kapatılabilir · mantıksal', 'Pencere kapatılabilir mi?'),
  ozellik('ikon', 'ikon · metin', 'Pencere simgesi.'),
  ozellik('arkaPlanResmi', 'arkaPlanResmi · metin', 'Pencere arka plan resmi yolu.'),
  ozellik('açılışAnimasyonu', 'açılışAnimasyonu · metin', 'Açılış animasyonu (solma, kayma, büyüme, yok).'),
  ozellik('boyut', 'boyut · metin', 'Pencere boyutu (genişlikxyükseklik).'),
  ozellik('konum', 'konum · metin', 'Pencere konumu (x,y).'),
].map((uye) => (turkuiBileseniMi(uye.ad) ? { ...uye, bilesen: true } : uye));

/* ---------------- olaylar ---------------- */

/** Butonun fare ve klavye olayları. */
const butonOlaylari: TurkuiUyeVerisi[] = [
  olay('tıklandığında', 'Butona tıklanınca çalışır.'),
  olay('basıldığında', 'Fare düğmesine basılınca çalışır.'),
  olay('bırakıldığında', 'Fare düğmesi bırakılınca çalışır.'),
  olay('üzerineGelindiğinde', 'Fare butonun üzerine gelince çalışır.'),
  olay('üzerindenÇıkıldığında', 'Fare butonun üzerinden çıkınca çalışır.'),
  olay('tuşBasılınca', 'Buton odaklıyken bir tuşa basılınca çalışır.'),
  olay('tuşBırakılınca', 'Buton odaklıyken tuş bırakılınca çalışır.'),
];

/** Giriş alanlarının olayları. */
const girisOlaylari: TurkuiUyeVerisi[] = [
  olay('değiştiğinde', 'Girilen değer değişince çalışır.'),
  olay('odaklandığında', 'Alan odağı alınca çalışır.'),
  olay('odağıKaybettiğinde', 'Alan odağı kaybedince çalışır.'),
  olay('enterBasılınca', 'Enter tuşuna basılınca çalışır.'),
  olay('tuşBasılınca', 'Bir tuşa basılınca çalışır.'),
  olay('tuşBırakılınca', 'Tuş bırakılınca çalışır.'),
];

const onayKutusuOlaylari: TurkuiUyeVerisi[] = [
  olay('tıklandığında', 'Onay kutusuna tıklanınca çalışır.'),
  olay('değiştiğinde', 'İşaret durumu değişince çalışır.'),
];

/** Liste, radyo ve seçim kutusu: seçim değişince. */
const secimOlaylari: TurkuiUyeVerisi[] = [
  olay('seçildiğinde', 'Bir öğe seçilince çalışır.'),
];

const degisimOlaylari: TurkuiUyeVerisi[] = [
  olay('değiştiğinde', 'Değer değişince çalışır.'),
];

/** `özel` bileşenin (ham HTML) olayları. */
const ozelOlaylari: TurkuiUyeVerisi[] = [
  olay('tıklandığında', 'Bileşene tıklanınca çalışır.'),
  olay('çiftTıklandığında', 'Bileşene çift tıklanınca çalışır.'),
  olay('sağTıklandığında', 'Bileşene sağ tıklanınca çalışır.'),
  olay('fareTekerleği', 'Fare tekerleği döndürülünce çalışır.'),
  olay('fareHareketinde', 'Fare bileşen üzerinde hareket edince çalışır.'),
  olay('değiştiğinde', 'Değer değişince çalışır.'),
  olay('enterBasılınca', 'Enter tuşuna basılınca çalışır.'),
  olay('tuşBasılınca', 'Bir tuşa basılınca çalışır.'),
  olay('tuşBırakılınca', 'Tuş bırakılınca çalışır.'),
  olay('odaklandığında', 'Bileşen odağı alınca çalışır.'),
  olay('odağıKaybettiğinde', 'Bileşen odağı kaybedince çalışır.'),
];

/** Gömülü tarayıcı olayları. */
const tarayiciOlaylari: TurkuiUyeVerisi[] = [
  olay('yüklendiğinde', 'Sayfa yüklenince çalışır.'),
  olay('yüklenmeyeBaşladığında', 'Sayfa yüklenmeye başlayınca çalışır.'),
  olay('adresDeğiştiğinde', 'Sayfa adresi değişince çalışır.'),
  olay('başlıkDeğiştiğinde', 'Sayfa başlığı değişince çalışır.'),
  olay('hataOluştuğunda', 'Sayfa yüklenirken hata olursa çalışır.'),
];

/** Pencere düzeyi olaylar. */
const pencereOlaylari: TurkuiUyeVerisi[] = [
  olay('pencereAçıldığında', 'Pencere gösterilince bir kez çalışır.'),
  olay('pencereKapatılırken', 'Pencere kapanmadan önce çalışır.'),
];

/** Ortak bileşen üyeleri. */
const bilesenOrtak: TurkuiUyeVerisi[] = [
  fonksiyon('göster', 'göster() · göster(süre)', 'Bileşeni gösterir.'),
  fonksiyon('gizle', 'gizle() · gizle(süre)', 'Bileşeni gizler.'),
  fonksiyon('sağ', 'sağ(miktar: sayı)', 'Bileşeni sağa kaydırır.', ['miktar']),
  fonksiyon('sol', 'sol(miktar: sayı)', 'Bileşeni sola kaydırır.', ['miktar']),
  fonksiyon('aşağı', 'aşağı(miktar: sayı)', 'Bileşeni aşağı kaydırır.', ['miktar']),
  fonksiyon('yukarı', 'yukarı(miktar: sayı)', 'Bileşeni yukarı kaydırır.', ['miktar']),
  ozellik('x', 'x · sayı', 'Yatay konum (yüzde).'),
  ozellik('y', 'y · sayı', 'Dikey konum (yüzde).'),
  ozellik('right', 'right · sayı', 'Sağdan konum (yüzde).'),
  ozellik('genişlik', 'genişlik · sayı', 'Genişlik.'),
  ozellik('yükseklik', 'yükseklik · sayı', 'Yükseklik.'),
  ozellik('şeffaflık', 'şeffaflık · sayı', 'Saydamlık (0-1).'),
  ozellik('arkaPlan', 'arkaPlan · renk', 'Arka plan rengi.'),
  ozellik('kenar', 'kenar · sayı', 'Kenarlık kalınlığı.'),
  ozellik('kenarRengi', 'kenarRengi · renk', 'Kenarlık rengi.'),
  ozellik('kenarKalınlığı', 'kenarKalınlığı · sayı', 'Kenarlık kalınlığı.'),
  ozellik('yuvarlaklık', 'yuvarlaklık · sayı', 'Köşe yuvarlaklığı.'),
  ozellik('dolgu', 'dolgu · sayı', 'İç boşluk.'),
  ozellik('sınıf', 'sınıf · metin', 'CSS sınıf adları (boşlukla ayrılır).'),
  ozellik('stil', 'stil · metin', 'Bileşene özel CSS bildirimleri.'),
];

const metinBilesen: TurkuiUyeVerisi[] = [
  ozellik('içerik', 'içerik · metin', 'Görünen metin.'),
  ozellik('renk', 'renk · renk', 'Yazı rengi.'),
  ozellik('yazıRenk', 'yazıRenk · renk', 'Yazı rengi.'),
  ozellik('yazıBoyutu', 'yazıBoyutu · sayı', 'Yazı boyutu.'),
  ozellik('yazıTipi', 'yazıTipi · metin', 'Yazı tipi.'),
  ozellik('kalın', 'kalın · mantıksal', 'Kalın yazı.'),
  ozellik('italik', 'italik · mantıksal', 'İtalik yazı.'),
  ozellik('altıÇizili', 'altıÇizili · mantıksal', 'Altı çizili yazı.'),
  ozellik('hizalama', 'hizalama · metin', 'Metin hizalaması.'),
  fonksiyon('değiştir', 'değiştir(metin: metin)', 'Metni değiştirir.', ['metin']),
  fonksiyon('temizle', 'temizle()', 'Metni temizler.'),
];

const butonBilesen: TurkuiUyeVerisi[] = [
  ...butonOlaylari,
  ozellik('metin', 'metin · metin', 'Buton yazısı.'),
  ozellik('renk', 'renk · renk', 'Yazı rengi.'),
  ozellik('yazıRenk', 'yazıRenk · renk', 'Yazı rengi.'),
  ozellik('yazıBoyutu', 'yazıBoyutu · sayı', 'Yazı boyutu.'),
  ozellik('etkin', 'etkin · mantıksal', 'Buton etkin mi?'),
  fonksiyon('etkinleştir', 'etkinleştir()', 'Butonu etkinleştirir.'),
  fonksiyon('devreDışıBırak', 'devreDışıBırak()', 'Butonu devre dışı bırakır.'),
  fonksiyon('metinDeğiştir', 'metinDeğiştir(metin: metin)', 'Buton yazısını değiştirir.', ['metin']),
];

const girisBilesen: TurkuiUyeVerisi[] = [
  ...girisOlaylari,
  ozellik('değer', 'değer · metin', 'Girilen değer.'),
  ozellik('yerTutucu', 'yerTutucu · metin', 'Yer tutucu metin.'),
  ozellik('renk', 'renk · renk', 'Yazı rengi.'),
  ozellik('yazıRenk', 'yazıRenk · renk', 'Yazı rengi.'),
  ozellik('yazıBoyutu', 'yazıBoyutu · sayı', 'Yazı boyutu.'),
  ozellik('şifre', 'şifre · mantıksal', 'Şifre alanı mı?'),
  ozellik('etkin', 'etkin · mantıksal', 'Giriş etkin mi?'),
  fonksiyon('ayarla', 'ayarla(değer: metin)', 'Giriş değerini ayarlar.', ['değer']),
  fonksiyon('temizle', 'temizle()', 'Girişi temizler.'),
  fonksiyon('odaklan', 'odaklan()', 'Girişe odaklanır.'),
  fonksiyon('odağıKaldır', 'odağıKaldır()', 'Giriş odağını kaldırır.'),
];

const metinAlaniBilesen: TurkuiUyeVerisi[] = [
  ...girisBilesen,
  ozellik('satır', 'satır · sayı', 'Satır sayısı.'),
  ozellik('sütun', 'sütun · sayı', 'Sütun sayısı.'),
  ozellik('saltOkunur', 'saltOkunur · mantıksal', 'Salt okunur mu?'),
  ozellik('sözcükKaydırma', 'sözcükKaydırma · mantıksal', 'Sözcük kaydırma.'),
  fonksiyon('ekle', 'ekle(metin: metin)', 'Metnin sonuna ekler.', ['metin']),
];

const listeBilesen: TurkuiUyeVerisi[] = [
  ...secimOlaylari,
  ozellik('seçili', 'seçili · metin', 'Seçili öğe.'),
  ozellik('seçiliİndeks', 'seçiliİndeks · sayı', 'Seçili öğenin indeksi.'),
  ozellik('renk', 'renk · renk', 'Yazı rengi.'),
  ozellik('yazıRenk', 'yazıRenk · renk', 'Yazı rengi.'),
  fonksiyon('ekle', 'ekle(öğe: metin)', 'Listeye öğe ekler.', ['öğe']),
  fonksiyon('sil', 'sil(öğe: metin) · sil(indeks: sayı)', 'Listeden öğe siler.', ['öğe']),
  fonksiyon('temizle', 'temizle()', 'Listeyi temizler.'),
  fonksiyon('seç', 'seç(indeks: sayı)', 'Öğe seçer.', ['indeks']),
];

const gorselBilesen: TurkuiUyeVerisi[] = [
  ozellik('kaynak', 'kaynak · metin', 'Görsel yolu veya data URI.'),
  ozellik('oran', 'oran · mantıksal', 'Oranı koru.'),
  ozellik('doldur', 'doldur · mantıksal', 'Alanı doldur.'),
  fonksiyon('değiştir', 'değiştir(kaynak: metin)', 'Görseli değiştirir.', ['kaynak']),
];

const ilerlemeBilesen: TurkuiUyeVerisi[] = [
  ozellik('değer', 'değer · sayı', 'İlerleme değeri.'),
  ozellik('minimum', 'minimum · sayı', 'En küçük değer.'),
  ozellik('maksimum', 'maksimum · sayı', 'En büyük değer.'),
  ozellik('renk', 'renk · renk', 'Çubuk rengi.'),
  fonksiyon('artır', 'artır(miktar: sayı)', 'Değeri artırır.', ['miktar']),
  fonksiyon('azalt', 'azalt(miktar: sayı)', 'Değeri azaltır.', ['miktar']),
  fonksiyon('sıfırla', 'sıfırla()', 'Değeri sıfırlar.'),
];

const onayKutusuBilesen: TurkuiUyeVerisi[] = [
  ...onayKutusuOlaylari,
  ozellik('seçili', 'seçili · mantıksal', 'İşaretli mi?'),
  ozellik('metin', 'metin · metin', 'Onay kutusu yazısı.'),
  ozellik('renk', 'renk · renk', 'Yazı rengi.'),
  ozellik('yazıRenk', 'yazıRenk · renk', 'Yazı rengi.'),
  fonksiyon('seç', 'seç()', 'İşaretler.'),
  fonksiyon('kaldır', 'kaldır()', 'İşareti kaldırır.'),
];

const anahtarBilesen: TurkuiUyeVerisi[] = [
  ...degisimOlaylari,
  ozellik('açık', 'açık · mantıksal', 'Anahtar açık mı?'),
  ozellik('metin', 'metin · metin', 'Anahtar yazısı.'),
  ozellik('renk', 'renk · renk', 'Yazı rengi.'),
  ozellik('yazıRenk', 'yazıRenk · renk', 'Yazı rengi.'),
  ozellik('etkin', 'etkin · mantıksal', 'Anahtar etkin mi?'),
  fonksiyon('aç', 'aç()', 'Anahtarı açar.'),
  fonksiyon('kapat', 'kapat()', 'Anahtarı kapatır.'),
  fonksiyon('değiştir', 'değiştir()', 'Açık/kapalı durumunu değiştirir.'),
];

const radyoBilesen: TurkuiUyeVerisi[] = [
  ...secimOlaylari,
  ozellik('seçili', 'seçili · metin', 'Seçili seçenek.'),
  ozellik('seçiliİndeks', 'seçiliİndeks · sayı', 'Seçili seçeneğin indeksi.'),
  ozellik('renk', 'renk · renk', 'Yazı rengi.'),
  ozellik('yazıRenk', 'yazıRenk · renk', 'Yazı rengi.'),
  fonksiyon('ekle', 'ekle(seçenek: metin)', 'Seçenek ekler.', ['seçenek']),
  fonksiyon('sil', 'sil(seçenek: metin) · sil(indeks: sayı)', 'Seçenek siler.', ['seçenek']),
  fonksiyon('temizle', 'temizle()', 'Seçenekleri temizler.'),
  fonksiyon('seç', 'seç(indeks: sayı)', 'Seçenek seçer.', ['indeks']),
];

const sekmeBilesen: TurkuiUyeVerisi[] = [
  ...degisimOlaylari,
  ozellik('seçili', 'seçili · metin', 'Seçili sekme.'),
  fonksiyon('ekle', 'ekle(sekme: metin)', 'Sekme ekler.', ['sekme']),
  fonksiyon('sil', 'sil(sekme: metin) · sil(indeks: sayı)', 'Sekme siler.', ['sekme']),
  fonksiyon('seç', 'seç(sekme: metin)', 'Sekme seçer.', ['sekme']),
];

const ozelBilesen: TurkuiUyeVerisi[] = [
  ...ozelOlaylari,
  ozellik('html', 'html · metin', 'Bileşenin HTML içeriği.'),
  ozellik('içerik', 'içerik · metin', 'Bileşenin HTML içeriği.'),
  ozellik('css', 'css · metin', 'Bileşene özel CSS (Shadow DOM içinde).'),
  fonksiyon('değiştir', 'değiştir(html: metin)', 'HTML içeriğini değiştirir.', ['html']),
  fonksiyon('htmlEkle', 'htmlEkle(html: metin)', 'HTML içeriğinin sonuna ekler.', ['html']),
  fonksiyon('stilEkle', 'stilEkle(css: metin)', 'CSS içeriğinin sonuna ekler.', ['css']),
];

const canvasBilesen: TurkuiUyeVerisi[] = [
  fonksiyon('temizle', 'temizle()', 'Tuvali temizler.'),
  fonksiyon('arkaPlanDoldur', 'arkaPlanDoldur(renk: renk)', 'Tuvali arka plan rengiyle doldurur.', ['renk']),
  fonksiyon('çizgi', 'çizgi(x1, y1, x2, y2, renk, kalınlık)', 'Çizgi çizer.', ['x1', 'y1', 'x2', 'y2', 'renk', 'kalınlık']),
  fonksiyon('dikdörtgen', 'dikdörtgen(x, y, genişlik, yükseklik, renk, dolgu, kalınlık)', 'Dikdörtgen çizer.', ['x', 'y', 'genişlik', 'yükseklik', 'renk', 'dolgu', 'kalınlık']),
  fonksiyon('daire', 'daire(x, y, yarıçap, renk, dolgu, kalınlık)', 'Daire çizer.', ['x', 'y', 'yarıçap', 'renk', 'dolgu', 'kalınlık']),
  fonksiyon('yay', 'yay(x, y, yarıçap, başlangıç, bitiş, renk, kalınlık)', 'Yay çizer.', ['x', 'y', 'yarıçap', 'başlangıç', 'bitiş', 'renk', 'kalınlık']),
  fonksiyon('yazı', 'yazı(metin, x, y, boyut, renk, yazıTipi)', 'Tuval üzerine yazı yazar.', ['metin', 'x', 'y', 'boyut', 'renk', 'yazıTipi']),
  fonksiyon('görsel', 'görsel(kaynak, x, y, genişlik, yükseklik)', 'Tuval üzerine görsel çizer.', ['kaynak', 'x', 'y', 'genişlik', 'yükseklik']),
];

const tarayiciBilesen: TurkuiUyeVerisi[] = [
  ...tarayiciOlaylari,
  ozellik('adres', 'adres · metin', 'Görüntülenen sayfanın adresi.'),
  ozellik('url', 'url · metin', 'Sayfa adresi (adres takma adı).'),
  ozellik('html', 'html · metin', 'Doğrudan yüklenecek HTML içeriği.'),
  ozellik('anaSayfa', 'anaSayfa · metin', 'Tarayıcının ana sayfa adresi.'),
  ozellik('başlık', 'başlık · metin', 'Yüklü sayfanın başlığı.'),
  ozellik('yükleniyor', 'yükleniyor · mantıksal', 'Sayfa şu anda yükleniyor mu?'),
  ozellik('geriGidebilir', 'geriGidebilir · mantıksal', 'Geri gezinme geçmişi var mı?'),
  ozellik('ileriGidebilir', 'ileriGidebilir · mantıksal', 'İleri gezinme geçmişi var mı?'),
  ozellik('yakınlaştırma', 'yakınlaştırma · sayı', 'Sayfa yakınlaştırma oranı (0.25-5).'),
  fonksiyon('git', 'git(adres: metin)', 'Belirtilen adrese gider.', ['adres']),
  fonksiyon('aç', 'aç(adres: metin)', 'Belirtilen adresi açar.', ['adres']),
  fonksiyon('geri', 'geri()', 'Gezinme geçmişinde bir adım geri gider.'),
  fonksiyon('ileri', 'ileri()', 'Gezinme geçmişinde bir adım ileri gider.'),
  fonksiyon('yenile', 'yenile()', 'Sayfayı yeniden yükler.'),
  fonksiyon('durdur', 'durdur()', 'Sayfa yüklemesini durdurur.'),
  fonksiyon('anaSayfayaGit', 'anaSayfayaGit()', 'Ana sayfaya gider.'),
  fonksiyon('htmlYükle', 'htmlYükle(html: metin)', 'Verilen HTML içeriğini yükler.', ['html']),
  fonksiyon('belgeYaz', 'belgeYaz(html: metin)', 'Verilen HTML içeriğini yazar.', ['html']),
  fonksiyon('yakınlaştır', 'yakınlaştır(oran: sayı)', 'Sayfayı belirtilen oranda yakınlaştırır.', ['oran']),
  fonksiyon('yakınlaştırmaSıfırla', 'yakınlaştırmaSıfırla()', 'Yakınlaştırmayı normale döndürür.'),
];

/** Ses bileşeninin olayları. */
const sesOlaylari: TurkuiUyeVerisi[] = [
  olay('çalmayaBaşladığında', 'Ses çalmaya başlayınca çalışır.'),
  olay('duraklatıldığında', 'Ses duraklatılınca çalışır.'),
  olay('bittiğinde', 'Ses sonuna gelince çalışır.'),
  olay('değiştiğinde', 'Çalma konumu değişince çalışır (`konum`, `süre`).'),
];

const sesBilesen: TurkuiUyeVerisi[] = [
  ...sesOlaylari,
  ozellik('kaynak', 'kaynak · metin', 'Ses dosyası yolu veya adresi.'),
  ozellik('döngü', 'döngü · mantıksal', 'Ses bitince baştan çalsın mı?'),
  ozellik('sesSeviyesi', 'sesSeviyesi · sayı', 'Ses seviyesi (0-1).'),
  ozellik('konum', 'konum · sayı', 'Çalma konumu (saniye).'),
  ozellik('süre', 'süre · sayı', 'Ses süresi (saniye).'),
  ozellik('kontroller', 'kontroller · mantıksal', 'Oynatma kontrolleri görünsün mü?'),
  fonksiyon('çal', 'çal()', 'Sesi çalar.'),
  fonksiyon('duraklat', 'duraklat()', 'Sesi duraklatır.'),
  fonksiyon('durdur', 'durdur()', 'Sesi durdurup başa alır.'),
  fonksiyon('başaAl', 'başaAl()', 'Çalma konumunu başa alır.'),
  fonksiyon('değiştir', 'değiştir(kaynak: metin)', 'Ses dosyasını değiştirir.', ['kaynak']),
];

const tabloBilesen: TurkuiUyeVerisi[] = [
  olay('seçildiğinde', 'Tabloda bir satır seçilince çalışır.'),
  ozellik('başlıklar', 'başlıklar · liste', 'Sütun başlıkları.'),
  ozellik('satırlar', 'satırlar · liste', 'Tablodaki satırlar.'),
  ozellik('seçiliİndeks', 'seçiliİndeks · sayı', 'Seçili satırın indeksi.'),
  ozellik('şeritli', 'şeritli · mantıksal', 'Satırlar bir açık bir koyu mu?'),
  ozellik('başlıkGöster', 'başlıkGöster · mantıksal', 'Başlık satırı görünsün mü?'),
  ozellik('renk', 'renk · renk', 'Yazı rengi.'),
  ozellik('yazıBoyutu', 'yazıBoyutu · sayı', 'Yazı boyutu.'),
  fonksiyon('satırEkle', 'satırEkle(satır: liste) · satırEkle(sözlük)', 'Tabloya satır ekler.', ['satır']),
  fonksiyon('satırSil', 'satırSil(indeks: sayı)', 'Satırı siler.', ['indeks']),
  fonksiyon('hücreAyarla', 'hücreAyarla(satır: sayı, sütun: sayı, değer: metin)', 'Hücre değerini değiştirir.', ['satır', 'sütun', 'değer']),
  fonksiyon('başlıklarıAyarla', 'başlıklarıAyarla(başlıklar: liste)', 'Sütun başlıklarını değiştirir.', ['başlıklar']),
  fonksiyon('seç', 'seç(indeks: sayı)', 'Satır seçer.', ['indeks']),
  fonksiyon('temizle', 'temizle()', 'Bütün satırları siler.'),
];

const modalBilesen: TurkuiUyeVerisi[] = [
  olay('kapatıldığında', 'Modal kapatılınca çalışır.'),
  ozellik('başlık', 'başlık · metin', 'Modal başlığı.'),
  ozellik('karartma', 'karartma · sayı', 'Arka plan karartması (0-1).'),
  ozellik('kapatmaDüğmesi', 'kapatmaDüğmesi · mantıksal', 'Kapatma düğmesi görünsün mü?'),
  fonksiyon('ekle', 'ekle(çocuk: bileşen)', 'Modala bileşen ekler.', ['çocuk']),
  fonksiyon('çocukEkle', 'çocukEkle(çocuk: bileşen)', 'Modala bileşen ekler.', ['çocuk']),
  fonksiyon('çıkar', 'çıkar(çocuk: bileşen)', 'Modaldan bileşen çıkarır.', ['çocuk']),
  fonksiyon('çocukÇıkar', 'çocukÇıkar(çocuk: bileşen)', 'Modaldan bileşen çıkarır.', ['çocuk']),
  fonksiyon('temizle', 'temizle()', 'Modalı temizler.'),
  fonksiyon('kapat', 'kapat()', 'Modalı kapatır.'),
];

const kutuBilesen: TurkuiUyeVerisi[] = [
  ozellik('aralık', 'aralık · sayı', 'Alt bileşenler arası boşluk.'),
  fonksiyon('ekle', 'ekle(çocuk: bileşen)', 'Kutuya bileşen ekler.', ['çocuk']),
  fonksiyon('çocukEkle', 'çocukEkle(çocuk: bileşen)', 'Kutuya bileşen ekler.', ['çocuk']),
  fonksiyon('çıkar', 'çıkar(çocuk: bileşen)', 'Kutudan bileşen çıkarır.', ['çocuk']),
  fonksiyon('çocukÇıkar', 'çocukÇıkar(çocuk: bileşen)', 'Kutudan bileşen çıkarır.', ['çocuk']),
  fonksiyon('temizle', 'temizle()', 'Kutuyu temizler.'),
];

const duzenBilesen: TurkuiUyeVerisi[] = [
  ozellik('aralık', 'aralık · sayı', 'Öğeler arası boşluk.'),
  ozellik('hizalama', 'hizalama · metin', 'Ana eksen hizalaması.'),
  ozellik('çaprazHizalama', 'çaprazHizalama · metin', 'Çapraz eksen hizalaması.'),
  ozellik('yön', 'yön · metin', 'Düzen yönü.'),
  ozellik('sarma', 'sarma · mantıksal', 'Satır sarma.'),
  ozellik('sütun', 'sütun · sayı', 'Sütun sayısı.'),
  ozellik('satır', 'satır · sayı', 'Satır sayısı.'),
  fonksiyon('ekle', 'ekle(çocuk: bileşen)', 'Düzene bileşen ekler.', ['çocuk']),
  fonksiyon('çıkar', 'çıkar(çocuk: bileşen)', 'Düzenden bileşen çıkarır.', ['çocuk']),
  fonksiyon('temizle', 'temizle()', 'Düzeni temizler.'),
];

/** Bileşen türüne göre ek üyeler. */
const bilesenOzel: Record<string, TurkuiUyeVerisi[]> = {
  metin: metinBilesen,
  buton: butonBilesen,
  giriş: girisBilesen,
  kutu: kutuBilesen,
  liste: listeBilesen,
  görsel: gorselBilesen,
  ilerleme: ilerlemeBilesen,
  onayKutusu: onayKutusuBilesen,
  seçimKutusu: listeBilesen,
  sekme: sekmeBilesen,
  metinAlanı: metinAlaniBilesen,
  kaydırıcı: [...ilerlemeBilesen, ...degisimOlaylari],
  anahtar: anahtarBilesen,
  radyo: radyoBilesen,
  özel: ozelBilesen,
  canvas: canvasBilesen,
  tarayıcı: tarayiciBilesen,
  ses: sesBilesen,
  tablo: tabloBilesen,
  modal: modalBilesen,
  dikeyDüzen: duzenBilesen,
  yatayDüzen: duzenBilesen,
  gridDüzen: duzenBilesen,
  esnekAlan: [ozellik('büyüme', 'büyüme · sayı', 'Esneme oranı.')],
};

/** Takma adlı bileşenleri kanonik ada çevirir. */
const BILESEN_TAKMA_ADLARI: Record<string, string> = {
  webTarayıcı: 'tarayıcı',
  webBrowser: 'tarayıcı',
};

/** Bileşen türü için ortak + türe özel üyeler. */
export function turkuiBilesenUyeleri(tur: string): TurkuiUyeVerisi[] {
  const anahtar = BILESEN_TAKMA_ADLARI[tur] ?? tur;
  return [...bilesenOrtak, ...(bilesenOzel[anahtar] ?? [])];
}

export const turkuiPencereUyeleri: TurkuiUyeVerisi[] = [...pencereBilesenleri, ...pencereOlaylari];

/** `renk.` sonrasında önerilen hazır renkler. */
export const turkuiRenkUyeleri: TurkuiUyeVerisi[] = [
  ...['kırmızı', 'mavi', 'yeşil', 'sarı', 'turuncu', 'mor', 'pembe', 'beyaz', 'siyah', 'gri', 'turkuaz', 'camGöbeği', 'şeffaf'].map(
    (ad) => ozellik(ad, `${ad} · renk`, 'Hazır renk değeri.')
  ),
  fonksiyon('rgb', 'rgb(r: sayı, g: sayı, b: sayı) · renk', 'RGB rengi üretir.', ['r', 'g', 'b']),
  fonksiyon('rgba', 'rgba(r: sayı, g: sayı, b: sayı, a: sayı) · renk', 'RGBA rengi üretir.', ['r', 'g', 'b', 'a']),
  fonksiyon('hex', 'hex(değer: metin) · renk', 'Hex renk değeri üretir.', ['değer']),
  fonksiyon('geçiş', 'geçiş(hedef: renk, süre: sayı) · geçiş', 'Renk geçişi üretir.', ['hedef', 'süre']),
  fonksiyon(
    'doğrusalGeçiş',
    'doğrusalGeçiş(yön: sayı veya metin, ...renkler) · renk',
    'Doğrusal gradyan üretir. Sayı yön açı (derece) sayılır.',
    ['yön', 'renk']
  ),
  fonksiyon(
    'ışınımsalGeçiş',
    'ışınımsalGeçiş(yön: metin, ...renkler) · renk',
    'Işınımsal (radyal) gradyan üretir.',
    ['yön', 'renk']
  ),
];
