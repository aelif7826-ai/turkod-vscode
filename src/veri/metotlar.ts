export interface MetotVerisi {
  ad: string;
  aciklama: string;
  parametreler: string[];
}

export const metinMetotlari: MetotVerisi[] = [
  { ad: 'uzunluk', aciklama: 'Metnin karakter sayısını döndürür.', parametreler: [] },
  { ad: 'büyük_harf', aciklama: 'Metni büyük harfe çevirir.', parametreler: [] },
  { ad: 'küçük_harf', aciklama: 'Metni küçük harfe çevirir.', parametreler: [] },
  { ad: 'içeriyor', aciklama: 'Metnin verilen parçayı içerip içermediğini kontrol eder.', parametreler: ['aranan'] },
  { ad: 'başlangıçta_mı', aciklama: 'Metnin verilen önekle başlayıp başlamadığını kontrol eder.', parametreler: ['önek'] },
  { ad: 'bitişte_mi', aciklama: 'Metnin verilen sonekle bitip bitmediğini kontrol eder.', parametreler: ['sonek'] },
  { ad: 'değiştir', aciklama: 'Metindeki tüm eşleşmeleri değiştirir.', parametreler: ['arama', 'değiştirme'] },
  { ad: 'böl', aciklama: 'Metni ayraçtan bölerek liste döndürür.', parametreler: ['ayraç'] },
  { ad: 'kırp', aciklama: 'Metnin başındaki ve sonundaki boşlukları temizler.', parametreler: [] },
];

export const listeMetotlari: MetotVerisi[] = [
  { ad: 'uzunluk', aciklama: 'Listenin eleman sayısını döndürür.', parametreler: [] },
  { ad: 'ekle', aciklama: 'Listenin sonuna eleman ekler.', parametreler: ['değer'] },
  { ad: 'çıkar', aciklama: 'Listenin son elemanını çıkarır.', parametreler: [] },
  { ad: 'başta', aciklama: 'Listenin başına eleman ekler.', parametreler: ['değer'] },
  { ad: 'sırala', aciklama: 'Listeyi sıralar.', parametreler: [] },
  { ad: 'ters', aciklama: 'Listeyi tersine çevirir.', parametreler: [] },
  { ad: 'sil', aciklama: 'Verilen indeksteki elemanı siler.', parametreler: ['indeks'] },
  { ad: 'içeriyor', aciklama: 'Listenin verilen elemanı içerip içermediğini kontrol eder.', parametreler: ['değer'] },
  { ad: 'ters_çevir', aciklama: 'Listenin tersini döndürür.', parametreler: [] },
  { ad: 'temizle', aciklama: 'Listenin tüm elemanlarını siler.', parametreler: [] },
  { ad: 'ilk_eleman', aciklama: 'İlk elemanı döndürür.', parametreler: [] },
  { ad: 'son_eleman', aciklama: 'Son elemanı döndürür.', parametreler: [] },
  { ad: 'indeks_bul', aciklama: 'Elemanın indeksini bulur.', parametreler: ['değer'] },
  { ad: 'kopyala', aciklama: 'Listenin kopyasını döndürür.', parametreler: [] },
];

export const sozlukMetotlari: MetotVerisi[] = [
  { ad: 'anahtarlar', aciklama: 'Sözlüğün anahtarlarını liste olarak döndürür.', parametreler: [] },
  { ad: 'değerler', aciklama: 'Sözlüğün değerlerini liste olarak döndürür.', parametreler: [] },
  { ad: 'içeriyor', aciklama: 'Sözlüğün verilen anahtarı içerip içermediğini kontrol eder.', parametreler: ['anahtar'] },
  { ad: 'sil', aciklama: 'Verilen anahtarı sözlükten siler.', parametreler: ['anahtar'] },
];

export const kumeMetotlari: MetotVerisi[] = [
  { ad: 'ekle', aciklama: 'Kümeye eleman ekler.', parametreler: ['değer'] },
  { ad: 'sil', aciklama: 'Kümeden eleman siler.', parametreler: ['değer'] },
  { ad: 'içeriyor', aciklama: 'Kümenin verilen elemanı içerip içermediğini kontrol eder.', parametreler: ['değer'] },
  { ad: 'temizle', aciklama: 'Kümenin tüm elemanlarını siler.', parametreler: [] },
  { ad: 'liste_yap', aciklama: 'Kümeyi listeye çevirir.', parametreler: [] },
];
