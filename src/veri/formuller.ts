/**
 * `ad--kategori` yazımıyla çağrılan hazır kod formülleri.
 *
 * Yeni formül eklemek için listeye bir kayıt eklemek yeterlidir; tamamlama
 * mantığı (`src/tamamla.ts`) bu tabloyu okur.
 */
export interface FormulVerisi {
  /** `ad--kategori` yazımındaki kategori adı. */
  kategori: string;
  /** Türkçe harf yazmadan kullanılabilecek takma adlar. */
  takmaAdlar?: string[];
  aciklama: string;
  /**
   * Üretilen kod. `{ad}` yazılan adla değiştirilir; `${1:...}` yer tutucu,
   * `$0` ise Tab'dan sonra imlecin duracağı yerdir.
   */
  sablon: string;
  /** Adın yazım biçimi. Varsayılan: yazıldığı gibi. */
  adBicimi?: 'aynen' | 'buyukHarf';
}

export const formuller: FormulVerisi[] = [
  {
    kategori: 'değişken',
    takmaAdlar: ['degisken'],
    aciklama: 'Değer tutan değişken tanımlar.',
    sablon: 'değişken {ad} := ${1}',
  },
  {
    kategori: 'ondalıklı',
    takmaAdlar: ['ondalikli', 'ondalık', 'ondalik'],
    aciklama: 'Virgüllü ondalık sayı değişkeni tanımlar.',
    sablon: 'OndalıklıDeğişken {ad} := ${1:0,0}',
  },
  {
    kategori: 'metin',
    takmaAdlar: ['yazı', 'yazi'],
    aciklama: 'Metin (string) değişkeni tanımlar.',
    sablon: 'değişken {ad} := "${1}"',
  },
  {
    kategori: 'sayı',
    takmaAdlar: ['sayi'],
    aciklama: 'Sayı değişkeni tanımlar.',
    sablon: 'değişken {ad} := ${1:0}',
  },
  {
    kategori: 'liste',
    takmaAdlar: ['dizi'],
    aciklama: 'Liste (dizi) değişkeni tanımlar.',
    sablon: 'değişken {ad} := [${1}]',
  },
  {
    kategori: 'sözlük',
    takmaAdlar: ['sozluk'],
    aciklama: 'Anahtar-değer çiftlerinden oluşan sözlük tanımlar.',
    sablon: 'değişken {ad} := {"${1:anahtar}": ${2:değer}}',
  },
  {
    kategori: 'fonksiyon',
    takmaAdlar: ['fonk', 'fn'],
    aciklama: 'Parametresiz fonksiyon tanımlar; imleç gövdeye gelir.',
    sablon: 'fonksiyon {ad}()\n\t$0\nson',
  },
];
