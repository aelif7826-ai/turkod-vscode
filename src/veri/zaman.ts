/**
 * `Zaman` modülü tamamlama verileri.
 *
 * `Zaman.` yazıldığında önerilen üyeler; imza ve kısa açıklamalar burada
 * tutulur. Davranış `src/zaman.ts` dosyasındadır.
 */

import type { TurkuiUyeVerisi } from './turkui';

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

/** `Zaman.` sonrasında önerilen modül üyeleri. */
export const zamanUyeleri: TurkuiUyeVerisi[] = [
  fonksiyon('bekle', 'bekle(saniye) · boş', 'Programı belirtilen saniye kadar eşzamansız bekletir (en fazla 60 saniye).', ['saniye']),
  fonksiyon(
    'şimdi',
    'şimdi() · tarih',
    'Şu anki zamanı tarih nesnesi olarak döndürür (yıl, ay, gün, saat, dakika, saniye, salise, ms, saatDilimi).'
  ),
  fonksiyon(
    'şimdiMetni',
    'şimdiMetni(desen := "gg.AA.yyyy HH:mm") · metin',
    'Şu anki zamanı desene göre biçimlendirir.',
    ['desen']
  ),
  fonksiyon('bugünMetni', 'bugünMetni() · metin', 'Bugünün tarihini `07.11.2026` biçiminde döndürür.'),
  fonksiyon(
    'biçimle',
    'biçimle(tarih, desen) · metin',
    'Tarihi desene göre biçimlendirir: `gg` `dd` gün, `AA` `MM` ay, `yyyy` yıl, `HH` saat, `mm` dakika, `ss` saniye, `SSS` salise, `GünAdı`, `AyAdı`.',
    ['tarih', 'desen']
  ),
  fonksiyon('ayAdı', 'ayAdı(ay) · metin', 'Ay adını döndürür: `11` → `Kasım`.', ['ay']),
  fonksiyon('günAdı', 'günAdı(tarih) · metin', 'Gün adını döndürür: `7.11.2026` → `Cumartesi`.', ['tarih']),
  fonksiyon(
    'ekle',
    'ekle(tarih, miktar, birim := "gün") · tarih',
    'Tarihe süre ekler. Birim: `ms`, `saniye`, `dakika`, `saat`, `gün`, `hafta`, `ay`, `yıl`.',
    ['tarih', 'miktar', 'birim']
  ),
  fonksiyon(
    'çıkar',
    'çıkar(tarih, miktar, birim := "gün") · tarih',
    'Tarihten süre çıkarır. Birimler `ekle` ile aynıdır.',
    ['tarih', 'miktar', 'birim']
  ),
  fonksiyon(
    'fark',
    'fark(tarih1, tarih2, birim := "ms") · sayı',
    'İki tarih arasındaki farkı verir (`tarih2 - tarih1`). `ay` ve `yıl` ortalama uzunlukla hesaplanır.',
    ['tarih1', 'tarih2', 'birim']
  ),
  fonksiyon('önceMi', 'önceMi(tarih1, tarih2) · mantıksal', 'Birinci tarih ikinciden önce mi?', [
    'tarih1',
    'tarih2',
  ]),
  fonksiyon('sonraMi', 'sonraMi(tarih1, tarih2) · mantıksal', 'Birinci tarih ikinciden sonra mı?', [
    'tarih1',
    'tarih2',
  ]),
  fonksiyon('eşitMi', 'eşitMi(tarih1, tarih2) · mantıksal', 'İki tarih aynı anda mı?', [
    'tarih1',
    'tarih2',
  ]),
  fonksiyon('haftaSonuMu', 'haftaSonuMu(tarih) · mantıksal', 'Tarih cumartesi veya pazar mı?', ['tarih']),
  fonksiyon('artıkYılMı', 'artıkYılMı(yıl) · mantıksal', 'Yıl artık yıl mı? (`2024` → `Doğru`)', ['yıl']),
  fonksiyon('ayGünSayısı', 'ayGünSayısı(yıl, ay) · sayı', 'Ayın gün sayısı: `(2026, 2)` → `28`.', [
    'yıl',
    'ay',
  ]),
  fonksiyon('haftaNumarası', 'haftaNumarası(tarih) · sayı', 'Yılın kaçıncı haftası (ISO).', ['tarih']),
  fonksiyon('yılınGünü', 'yılınGünü(tarih) · sayı', 'Yılın kaçıncı günü (1-366).', ['tarih']),
  fonksiyon(
    'ayAralığı',
    'ayAralığı(tarih) · sözlük',
    'Ayın ilk ve son gününü döndürür: `{ ilk, son }`.',
    ['tarih']
  ),
  fonksiyon(
    'kronometre',
    'kronometre() · sözlük',
    'Kronometre oluşturur: `başlat()`, `durdur()`, `sıfırla()`, `geçen`, `çalışıyor`.'
  ),
  fonksiyon(
    'geriSayım',
    'geriSayım(tarih) · sözlük',
    'Hedefe kalan süre: `{ gün, saat, dakika, saniye, bitti }`.',
    ['tarih']
  ),
  fonksiyon(
    'süreMetni',
    'süreMetni(ms) · metin',
    'Milisaniyeyi okunabilir süreye çevirir: `3725000` → `1 saat 2 dakika 5 saniye`.',
    ['ms']
  ),
  ozellik('aylar', 'aylar · liste', 'Türkçe ay adları (`Ocak` ... `Aralık`).'),
  ozellik('günler', 'günler · liste', 'Türkçe gün adları; `0` → `Pazar`.'),
];
