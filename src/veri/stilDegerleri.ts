/**
 * `TürkUI.stil { hedef( özellik: değer ) }` bloklarında değer olarak
 * kullanılabilen hazır değerler.
 *
 * Renk paleti ve ortak değerler renderer'daki (`media/turkui-window.html` →
 * `TURKCE_CSS_DEGER`) tabloyla aynıdır; testler ikisinin ayrışmadığını doğrular.
 */
export interface StilDegeri {
  /** Blokta yazılan Türkçe değer. */
  deger: string;
  /** Kısa açıklama. */
  aciklama: string;
  /** Renderer'ın ürettiği CSS karşılığı. */
  css?: string;
}

/** Hazır renk paleti. */
export const renkDegerleri: StilDegeri[] = [
  { deger: 'kırmızı', aciklama: 'Kırmızı', css: '#f38ba8' },
  { deger: 'mavi', aciklama: 'Mavi', css: '#89b4fa' },
  { deger: 'yeşil', aciklama: 'Yeşil', css: '#a6e3a1' },
  { deger: 'sarı', aciklama: 'Sarı', css: '#f9e2af' },
  { deger: 'turuncu', aciklama: 'Turuncu', css: '#fab387' },
  { deger: 'mor', aciklama: 'Mor', css: '#cba6f7' },
  { deger: 'pembe', aciklama: 'Pembe', css: '#f5c2e7' },
  { deger: 'beyaz', aciklama: 'Beyaz', css: '#cdd6f4' },
  { deger: 'siyah', aciklama: 'Siyah', css: '#11111b' },
  { deger: 'gri', aciklama: 'Gri', css: '#6c7086' },
  { deger: 'turkuaz', aciklama: 'Turkuaz', css: '#94e2d5' },
  { deger: 'şeffaf', aciklama: 'Saydam', css: 'transparent' },
];

/** Renk kabul eden stil özellikleri. */
export const renkOzellikleri: string[] = [
  'arkaPlan',
  'arkaPlanRengi',
  'renk',
  'yazıRengi',
  'metinRengi',
  'kenar',
  'üstKenar',
  'sağKenar',
  'altKenar',
  'solKenar',
  'kenarRengi',
  'gölge',
];

/** Tüm özelliklerde geçerli ortak değerler. */
export const ortakDegerler: StilDegeri[] = [
  { deger: 'esnek', aciklama: 'Esnek kutu', css: 'flex' },
  { deger: 'merkez', aciklama: 'Ortala', css: 'center' },
  { deger: 'orta', aciklama: 'Ortala', css: 'center' },
  { deger: 'aralıklı', aciklama: 'İki yana yay', css: 'space-between' },
  { deger: 'çevreli', aciklama: 'Çevresine yay', css: 'space-around' },
  { deger: 'başlangıç', aciklama: 'Başlangıca hizala', css: 'flex-start' },
  { deger: 'bitiş', aciklama: 'Bitişe hizala', css: 'flex-end' },
  { deger: 'gizli', aciklama: 'Gizle', css: 'hidden' },
  { deger: 'görünür', aciklama: 'Görünür yap', css: 'visible' },
  { deger: 'otomatik', aciklama: 'Otomatik', css: 'auto' },
  { deger: 'satır', aciklama: 'Yatay', css: 'row' },
  { deger: 'sütun', aciklama: 'Dikey', css: 'column' },
  { deger: 'kalın', aciklama: 'Kalın yazı', css: 'bold' },
  { deger: 'eğik', aciklama: 'Eğik yazı', css: 'italic' },
  { deger: 'mutlak', aciklama: 'Mutlak konum', css: 'absolute' },
  { deger: 'göreli', aciklama: 'Göreli konum', css: 'relative' },
  { deger: 'sabit', aciklama: 'Sabit konum', css: 'fixed' },
  { deger: 'yapışkan', aciklama: 'Yapışkan konum', css: 'sticky' },
  { deger: 'kutulu', aciklama: 'Kenarlık boyutu dahil', css: 'border-box' },
  { deger: 'içerikKadar', aciklama: 'İçerik kadar', css: 'fit-content' },
  { deger: 'tam', aciklama: 'Tam boy', css: '100%' },
  { deger: 'elle', aciklama: 'El imleci', css: 'pointer' },
  { deger: 'yok', aciklama: 'Yok', css: 'none' },
  { deger: 'düz', aciklama: 'Düz kenarlık', css: 'solid' },
  { deger: 'kesikli', aciklama: 'Kesikli kenarlık', css: 'dashed' },
  { deger: 'noktalı', aciklama: 'Noktalı kenarlık', css: 'dotted' },
  { deger: 'sarmalı', aciklama: 'Alt satıra sar', css: 'wrap' },
  { deger: 'sarmasız', aciklama: 'Sarma', css: 'nowrap' },
  { deger: 'tekrar', aciklama: 'Tekrarla', css: 'repeat' },
  { deger: 'doğrusal', aciklama: 'Doğrusal geçiş', css: 'linear' },
  { deger: 'ızgara', aciklama: 'Izgara düzeni', css: 'grid' },
  { deger: 'sol', aciklama: 'Sola hizala', css: 'left' },
  { deger: 'sağ', aciklama: 'Sağa hizala', css: 'right' },
  { deger: 'üst', aciklama: 'Üste hizala', css: 'top' },
  { deger: 'alt', aciklama: 'Alta hizala', css: 'bottom' },
];

/** Özelliğe özel yaygın değerler. */
export const ozellikDegerleri: Record<string, StilDegeri[]> = {
  genişlik: [
    { deger: '100%', aciklama: 'Tam genişlik' },
    { deger: '50%', aciklama: 'Yarım genişlik' },
    { deger: '200px', aciklama: 'Sabit genişlik' },
    { deger: '320px', aciklama: 'Sabit genişlik' },
  ],
  yükseklik: [
    { deger: '100%', aciklama: 'Tam yükseklik' },
    { deger: '120px', aciklama: 'Sabit yükseklik' },
    { deger: '240px', aciklama: 'Sabit yükseklik' },
  ],
  enAzGenişlik: [
    { deger: '120px', aciklama: 'En az genişlik' },
    { deger: '240px', aciklama: 'En az genişlik' },
  ],
  enAzYükseklik: [
    { deger: '40px', aciklama: 'En az yükseklik' },
    { deger: '80px', aciklama: 'En az yükseklik' },
  ],
  enÇokGenişlik: [
    { deger: '480px', aciklama: 'En çok genişlik' },
    { deger: '640px', aciklama: 'En çok genişlik' },
  ],
  enÇokYükseklik: [
    { deger: '320px', aciklama: 'En çok yükseklik' },
    { deger: '480px', aciklama: 'En çok yükseklik' },
  ],
  içBoşluk: [
    { deger: '0', aciklama: 'İç boşluk yok' },
    { deger: '8px', aciklama: 'Küçük iç boşluk' },
    { deger: '12px 16px', aciklama: 'Dikey / yatay iç boşluk' },
    { deger: '16px', aciklama: 'Orta iç boşluk' },
    { deger: '24px', aciklama: 'Büyük iç boşluk' },
  ],
  dışBoşluk: [
    { deger: '0', aciklama: 'Dış boşluk yok' },
    { deger: '4px', aciklama: 'Çok küçük dış boşluk' },
    { deger: '8px', aciklama: 'Küçük dış boşluk' },
    { deger: '16px', aciklama: 'Orta dış boşluk' },
    { deger: '24px', aciklama: 'Büyük dış boşluk' },
  ],
  üstDışBoşluk: [
    { deger: '0', aciklama: 'Boşluk yok' },
    { deger: '8px', aciklama: 'Küçük boşluk' },
    { deger: '16px', aciklama: 'Orta boşluk' },
  ],
  sağDışBoşluk: [
    { deger: '0', aciklama: 'Boşluk yok' },
    { deger: '8px', aciklama: 'Küçük boşluk' },
    { deger: '16px', aciklama: 'Orta boşluk' },
  ],
  altDışBoşluk: [
    { deger: '0', aciklama: 'Boşluk yok' },
    { deger: '8px', aciklama: 'Küçük boşluk' },
    { deger: '16px', aciklama: 'Orta boşluk' },
  ],
  solDışBoşluk: [
    { deger: '0', aciklama: 'Boşluk yok' },
    { deger: '8px', aciklama: 'Küçük boşluk' },
    { deger: '16px', aciklama: 'Orta boşluk' },
  ],
  aralık: [
    { deger: '0', aciklama: 'Aralık yok' },
    { deger: '4px', aciklama: 'Küçük aralık' },
    { deger: '8px', aciklama: 'Orta aralık' },
    { deger: '12px', aciklama: 'Geniş aralık' },
  ],
  sütunAralığı: [
    { deger: '0', aciklama: 'Aralık yok' },
    { deger: '8px', aciklama: 'Orta aralık' },
    { deger: '16px', aciklama: 'Geniş aralık' },
  ],
  satırAralığı: [
    { deger: '0', aciklama: 'Aralık yok' },
    { deger: '8px', aciklama: 'Orta aralık' },
    { deger: '16px', aciklama: 'Geniş aralık' },
  ],
  kenarKalınlığı: [
    { deger: '0', aciklama: 'Kenarlık yok' },
    { deger: '1px', aciklama: 'İnce kenarlık' },
    { deger: '2px', aciklama: 'Orta kenarlık' },
    { deger: '3px', aciklama: 'Kalın kenarlık' },
  ],
  kenarYuvarlaklığı: [
    { deger: '0', aciklama: 'Köşeler düz' },
    { deger: '4px', aciklama: 'Hafif yuvarlak' },
    { deger: '8px', aciklama: 'Yuvarlak' },
    { deger: '12px', aciklama: 'Belirgin yuvarlak' },
    { deger: '16px', aciklama: 'Çok yuvarlak' },
    { deger: '50%', aciklama: 'Daire / elips' },
    { deger: '9999px', aciklama: 'Hap biçimi' },
  ],
  yazıBoyutu: [
    { deger: '12px', aciklama: 'Küçük yazı' },
    { deger: '13px', aciklama: 'Küçük yazı' },
    { deger: '14px', aciklama: 'Normal yazı' },
    { deger: '15px', aciklama: 'Normal yazı' },
    { deger: '16px', aciklama: 'Rahat yazı' },
    { deger: '18px', aciklama: 'Büyük yazı' },
    { deger: '24px', aciklama: 'Başlık yazısı' },
    { deger: '32px', aciklama: 'Büyük başlık' },
  ],
  yazıKalınlığı: [
    { deger: '400', aciklama: 'Normal kalınlık' },
    { deger: '500', aciklama: 'Orta kalınlık' },
    { deger: '600', aciklama: 'Yarı kalın' },
    { deger: '700', aciklama: 'Kalın' },
  ],
  yazıTipi: [
    { deger: 'Segoe UI', aciklama: 'Windows arayüz yazı tipi' },
    { deger: 'Arial', aciklama: 'Yaygın sans-serif' },
    { deger: 'Georgia', aciklama: 'Serif yazı tipi' },
    { deger: 'Consolas', aciklama: 'Eş aralıklı yazı tipi' },
    { deger: 'monospace', aciklama: 'Eş aralıklı (sistem)' },
  ],
  satırYüksekliği: [
    { deger: '1', aciklama: 'Sıkı satır' },
    { deger: '1.2', aciklama: 'Sıkı satır' },
    { deger: '1.4', aciklama: 'Rahat satır' },
    { deger: '1.5', aciklama: 'Rahat satır' },
    { deger: '1.8', aciklama: 'Geniş satır' },
    { deger: '2', aciklama: 'Çok geniş satır' },
  ],
  harfAralığı: [
    { deger: '0', aciklama: 'Aralık yok' },
    { deger: '0.5px', aciklama: 'Hafif aralık' },
    { deger: '1px', aciklama: 'Orta aralık' },
    { deger: '2px', aciklama: 'Geniş aralık' },
  ],
  opaklık: [
    { deger: '0', aciklama: 'Tamamen saydam' },
    { deger: '0.25', aciklama: 'Çok saydam' },
    { deger: '0.5', aciklama: 'Yarı saydam' },
    { deger: '0.75', aciklama: 'Hafif saydam' },
    { deger: '1', aciklama: 'Tamamen opak' },
  ],
  sıra: [
    { deger: '0', aciklama: 'İlk sıra' },
    { deger: '1', aciklama: 'İkinci sıra' },
    { deger: '2', aciklama: 'Üçüncü sıra' },
  ],
  esnekBüyüme: [
    { deger: '0', aciklama: 'Büyüme yok' },
    { deger: '1', aciklama: 'Boş alanı doldur' },
    { deger: '2', aciklama: 'İki kat büyü' },
  ],
  esnekKüçülme: [
    { deger: '0', aciklama: 'Küçülme yok' },
    { deger: '1', aciklama: 'Gerektiğinde küçül' },
  ],
  esnekTaban: [
    { deger: '0', aciklama: 'Sıfır taban' },
    { deger: '100%', aciklama: 'Tam genişlik tabanı' },
    { deger: '200px', aciklama: 'Sabit taban' },
  ],
  geçiş: [
    { deger: '0.2s', aciklama: 'Hızlı geçiş' },
    { deger: '0.3s', aciklama: 'Orta geçiş' },
    { deger: '0.5s', aciklama: 'Yavaş geçiş' },
  ],
  gölge: [
    { deger: '0 2px 8px #00000033', aciklama: 'Hafif gölge' },
    { deger: '0 4px 12px #00000040', aciklama: 'Orta gölge' },
    { deger: '0 8px 24px #00000059', aciklama: 'Belirgin gölge' },
  ],
  sütunlar: [
    { deger: '1fr 1fr', aciklama: 'İki eşit sütun' },
    { deger: '1fr 1fr 1fr', aciklama: 'Üç eşit sütun' },
    { deger: 'tekrar(2, 1fr)', aciklama: 'İki eşit sütun' },
  ],
  satırlar: [
    { deger: '1fr', aciklama: 'Tek satır' },
    { deger: 'tekrar(2, otomatik)', aciklama: 'İki otomatik satır' },
  ],
  dönüşüm: [
    { deger: 'ölçek(1.05)', aciklama: 'Hafif büyüt' },
    { deger: 'ölçek(0.95)', aciklama: 'Hafif küçült' },
    { deger: 'kaydır(10px, 0px)', aciklama: 'Sağa kaydır' },
  ],
};
