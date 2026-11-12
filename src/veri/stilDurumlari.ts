/**
 * `TürkUI.stil { hedef( ... durum( özellik: değer ) ) }` bloklarında
 * kullanılabilen Türkçe durum (CSS sözde sınıf) grupları.
 *
 * `css` alanı renderer'daki (`media/turkui-window.html` → `TURKCE_CSS_DURUM`)
 * karşılığıdır; testler iki listenin ayrışmadığını doğrular. Yeni bir durum
 * eklenecekse önce renderer'a, sonra buraya yazılır.
 */
export interface StilDurumu {
  /** Türkçe durum adı (blokta yazılan). */
  ad: string;
  /** Renderer'ın ürettiği CSS sözde sınıfı (`:hover` gibi). */
  css: string;
  /** Kısa açıklama. */
  aciklama: string;
  /** Öneri şablonunda kullanılan örnek özellik/değer. */
  ornek: string;
}

export const stilDurumlari: StilDurumu[] = [
  {
    ad: 'üzerineGelince',
    css: ':hover',
    aciklama: 'Fare bileşenin üzerine geldiğinde (:hover).',
    ornek: 'arkaPlanRengi: kırmızı',
  },
  {
    ad: 'basılıyken',
    css: ':active',
    aciklama: 'Fare bileşenin üzerinde basılı tutulurken (:active).',
    ornek: 'arkaPlanRengi: mor',
  },
  {
    ad: 'odaklıyken',
    css: ':focus',
    aciklama: 'Bileşen odaktayken (:focus).',
    ornek: 'kenarRengi: mavi',
  },
  {
    ad: 'odakİçindeyken',
    css: ':focus-within',
    aciklama: 'Bileşenin içindeki bir öğe odaktayken (:focus-within).',
    ornek: 'kenarRengi: mavi',
  },
  {
    ad: 'seçiliyken',
    css: ':checked',
    aciklama: 'Onay kutusu, radyo veya anahtar seçiliyken (:checked).',
    ornek: 'arkaPlanRengi: yeşil',
  },
  {
    ad: 'etkinken',
    css: ':enabled',
    aciklama: 'Bileşen etkinken (:enabled).',
    ornek: 'opaklık: 1',
  },
  {
    ad: 'devreDışıyken',
    css: ':disabled',
    aciklama: 'Bileşen devre dışıyken (:disabled).',
    ornek: 'opaklık: 0.5',
  },
  {
    ad: 'ilkÇocukken',
    css: ':first-child',
    aciklama: 'Kapsayıcısının ilk çocuğuyken (:first-child).',
    ornek: 'üstDışBoşluk: 0',
  },
  {
    ad: 'sonÇocukken',
    css: ':last-child',
    aciklama: 'Kapsayıcısının son çocuğuyken (:last-child).',
    ornek: 'altDışBoşluk: 0',
  },
  {
    ad: 'tekÇocukken',
    css: ':only-child',
    aciklama: 'Kapsayıcısının tek çocuğuyken (:only-child).',
    ornek: 'genişlik: 100%',
  },
  {
    ad: 'boşken',
    css: ':empty',
    aciklama: 'Bileşenin içi boşken (:empty).',
    ornek: 'gösterim: yok',
  },
  {
    ad: 'geçerliyken',
    css: ':valid',
    aciklama: 'Giriş değeri geçerliyken (:valid).',
    ornek: 'kenarRengi: yeşil',
  },
  {
    ad: 'geçersizken',
    css: ':invalid',
    aciklama: 'Giriş değeri geçersizken (:invalid).',
    ornek: 'kenarRengi: kırmızı',
  },
  {
    ad: 'zorunluyken',
    css: ':required',
    aciklama: 'Giriş zorunluyken (:required).',
    ornek: 'kenarRengi: sarı',
  },
  {
    ad: 'bağlantıyken',
    css: ':link',
    aciklama: 'Henüz ziyaret edilmemiş bağlantıyken (:link).',
    ornek: 'renk: mavi',
  },
  {
    ad: 'ziyaretEdilmişken',
    css: ':visited',
    aciklama: 'Daha önce ziyaret edilmiş bağlantıyken (:visited).',
    ornek: 'renk: mor',
  },
  {
    ad: 'hedefken',
    css: ':target',
    aciklama: 'Sayfa içi hedef öğeyken (:target).',
    ornek: 'arkaPlanRengi: sarı',
  },
];

/** Durum adı geçerli mi? */
export function stilDurumuMu(ad: string): boolean {
  return stilDurumlari.some((durum) => durum.ad === ad);
}

/** Durum adının CSS karşılığını döndürür (`üzerineGelince` → `:hover`). */
export function stilDurumuCss(ad: string): string | undefined {
  return stilDurumlari.find((durum) => durum.ad === ad)?.css;
}
