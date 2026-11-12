/**
 * `TürkUI.stil { hedef( özellik: değer ) }` bloğunda kullanılabilen özellikler.
 *
 * `css` alanı renderer'daki (`media/turkui-window.html` → `TURKCE_CSS_OZELLIK`)
 * karşılığıdır; testler iki listenin ayrışmadığını doğrular. Yeni bir özellik
 * eklenecekse önce renderer'a, sonra buraya yazılır.
 */
export interface StilOzelligi {
  /** Türkçe özellik adı (blokta yazılan). */
  ad: string;
  /** Renderer'ın ürettiği CSS özelliği. */
  css: string;
  /** Kısa açıklama. */
  aciklama: string;
  /** Öneri yapıştırılırken kullanılan örnek değer. */
  ornek: string;
}

export const stilOzellikleri: StilOzelligi[] = [
  { ad: 'genişlik', css: 'width', aciklama: 'Bileşenin genişliği.', ornek: '200px' },
  { ad: 'yükseklik', css: 'height', aciklama: 'Bileşenin yüksekliği.', ornek: '120px' },
  { ad: 'enAzGenişlik', css: 'min-width', aciklama: 'En küçük genişlik.', ornek: '120px' },
  { ad: 'enAzYükseklik', css: 'min-height', aciklama: 'En küçük yükseklik.', ornek: '40px' },
  { ad: 'enÇokGenişlik', css: 'max-width', aciklama: 'En büyük genişlik.', ornek: '480px' },
  { ad: 'enÇokYükseklik', css: 'max-height', aciklama: 'En büyük yükseklik.', ornek: '320px' },
  { ad: 'içBoşluk', css: 'padding', aciklama: 'İç boşluk.', ornek: '12px 16px' },
  { ad: 'dışBoşluk', css: 'margin', aciklama: 'Dış boşluk.', ornek: '8px' },
  { ad: 'üstDışBoşluk', css: 'margin-top', aciklama: 'Üst dış boşluk.', ornek: '8px' },
  { ad: 'sağDışBoşluk', css: 'margin-right', aciklama: 'Sağ dış boşluk.', ornek: '8px' },
  { ad: 'altDışBoşluk', css: 'margin-bottom', aciklama: 'Alt dış boşluk.', ornek: '8px' },
  { ad: 'solDışBoşluk', css: 'margin-left', aciklama: 'Sol dış boşluk.', ornek: '8px' },
  { ad: 'arkaPlan', css: 'background', aciklama: 'Arka plan (renk veya görsel).', ornek: '#181825' },
  { ad: 'arkaPlanRengi', css: 'background-color', aciklama: 'Arka plan rengi.', ornek: 'mavi' },
  { ad: 'renk', css: 'color', aciklama: 'Yazı rengi (kısa yol).', ornek: 'beyaz' },
  { ad: 'yazıRengi', css: 'color', aciklama: 'Yazı rengi.', ornek: 'beyaz' },
  { ad: 'metinRengi', css: 'color', aciklama: 'Yazı rengi (eş anlamlı).', ornek: 'beyaz' },
  { ad: 'kenar', css: 'border', aciklama: 'Kenarlık (kalınlık biçim renk).', ornek: '1px düz #45475a' },
  { ad: 'üstKenar', css: 'border-top', aciklama: 'Üst kenarlık.', ornek: '1px düz #45475a' },
  { ad: 'sağKenar', css: 'border-right', aciklama: 'Sağ kenarlık.', ornek: '1px düz #45475a' },
  { ad: 'altKenar', css: 'border-bottom', aciklama: 'Alt kenarlık.', ornek: '1px düz #45475a' },
  { ad: 'solKenar', css: 'border-left', aciklama: 'Sol kenarlık.', ornek: '3px düz mavi' },
  { ad: 'kenarRengi', css: 'border-color', aciklama: 'Kenarlık rengi.', ornek: '#89b4fa' },
  { ad: 'kenarKalınlığı', css: 'border-width', aciklama: 'Kenarlık kalınlığı.', ornek: '2px' },
  { ad: 'kenarBiçimi', css: 'border-style', aciklama: 'Kenarlık biçimi.', ornek: 'düz' },
  { ad: 'kenarYuvarlaklığı', css: 'border-radius', aciklama: 'Köşe yuvarlaklığı.', ornek: '12px' },
  { ad: 'yazıBoyutu', css: 'font-size', aciklama: 'Yazı boyutu.', ornek: '15px' },
  { ad: 'yazıKalınlığı', css: 'font-weight', aciklama: 'Yazı kalınlığı.', ornek: '600' },
  { ad: 'yazıTipi', css: 'font-family', aciklama: 'Yazı tipi.', ornek: 'Segoe UI' },
  { ad: 'satırYüksekliği', css: 'line-height', aciklama: 'Satır yüksekliği.', ornek: '1.5' },
  { ad: 'harfAralığı', css: 'letter-spacing', aciklama: 'Harf aralığı.', ornek: '0.5px' },
  { ad: 'metinHizalama', css: 'text-align', aciklama: 'Metin hizalaması.', ornek: 'merkez' },
  { ad: 'gösterim', css: 'display', aciklama: 'Gösterim biçimi.', ornek: 'esnek' },
  { ad: 'yön', css: 'flex-direction', aciklama: 'Esnek düzen yönü.', ornek: 'sütun' },
  { ad: 'esneklik', css: 'flex', aciklama: 'Esnek büyüme/küçülme kısayolu.', ornek: '1 1 otomatik' },
  { ad: 'esnekBüyüme', css: 'flex-grow', aciklama: 'Esnek büyüme oranı.', ornek: '1' },
  { ad: 'esnekKüçülme', css: 'flex-shrink', aciklama: 'Esnek küçülme oranı.', ornek: '0' },
  { ad: 'esnekTaban', css: 'flex-basis', aciklama: 'Esnek başlangıç boyutu.', ornek: 'otomatik' },
  { ad: 'aralık', css: 'gap', aciklama: 'Öğeler arası boşluk.', ornek: '8px' },
  { ad: 'hizalamaÖğeleri', css: 'align-items', aciklama: 'Çapraz eksen hizalaması.', ornek: 'merkez' },
  { ad: 'hizalamaKendisi', css: 'align-self', aciklama: 'Tek öğenin çapraz hizalaması.', ornek: 'başlangıç' },
  { ad: 'yaslama', css: 'justify-content', aciklama: 'Ana eksen hizalaması.', ornek: 'aralıklı' },
  { ad: 'konum', css: 'position', aciklama: 'Konumlandırma türü.', ornek: 'göreli' },
  { ad: 'üst', css: 'top', aciklama: 'Üst konum.', ornek: '0px' },
  { ad: 'sağ', css: 'right', aciklama: 'Sağ konum.', ornek: '0px' },
  { ad: 'alt', css: 'bottom', aciklama: 'Alt konum.', ornek: '0px' },
  { ad: 'sol', css: 'left', aciklama: 'Sol konum.', ornek: '0px' },
  { ad: 'taşma', css: 'overflow', aciklama: 'Taşma davranışı.', ornek: 'gizli' },
  { ad: 'taşmaX', css: 'overflow-x', aciklama: 'Yatay taşma.', ornek: 'otomatik' },
  { ad: 'taşmaY', css: 'overflow-y', aciklama: 'Dikey taşma.', ornek: 'otomatik' },
  { ad: 'gölge', css: 'box-shadow', aciklama: 'Kutu gölgesi.', ornek: '0 4px 12px #00000040' },
  { ad: 'geçiş', css: 'transition', aciklama: 'Geçiş animasyonu.', ornek: '0.2s' },
  { ad: 'imleç', css: 'cursor', aciklama: 'Fare imleci.', ornek: 'elle' },
  { ad: 'opaklık', css: 'opacity', aciklama: 'Saydamlık (0-1).', ornek: '0.8' },
  { ad: 'sıra', css: 'order', aciklama: 'Esnek düzendeki sıra.', ornek: '1' },
  { ad: 'dönüşüm', css: 'transform', aciklama: 'Dönüşüm (kaydırma, ölçek).', ornek: 'ölçek(1.05)' },
  { ad: 'sütunlar', css: 'grid-template-columns', aciklama: 'Izgara sütunları.', ornek: '1fr 1fr' },
  { ad: 'satırlar', css: 'grid-template-rows', aciklama: 'Izgara satırları.', ornek: 'otomatik' },
  { ad: 'sütunAralığı', css: 'column-gap', aciklama: 'Sütunlar arası boşluk.', ornek: '8px' },
  { ad: 'satırAralığı', css: 'row-gap', aciklama: 'Satırlar arası boşluk.', ornek: '8px' },
  { ad: 'kutuBoyutlandırma', css: 'box-sizing', aciklama: 'Kutu boyutlandırma kuralı.', ornek: 'kutulu' },
  { ad: 'görünürlük', css: 'visibility', aciklama: 'Görünürlük.', ornek: 'görünür' },
];
