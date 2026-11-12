export interface OneriVerisi {
  ad: string;
  aciklama: string;
  ornek?: string;
  snippet?: string;
}

export const anahtarKelimeler: OneriVerisi[] = [
  {
    ad: 'değişken',
    aciklama: 'Değişken tanımlar ve değer atar.',
    ornek: 'değişken ad := "Metehan"',
    snippet: 'değişken ${1:ad} := ${2:değer}',
  },
  {
    ad: 'OndalıklıDeğişken',
    aciklama: 'Virgüllü ondalık sayı değişkeni tanımlar.',
    ornek: 'OndalıklıDeğişken pi := 3,14',
    snippet: 'OndalıklıDeğişken ${1:ad} := ${2:0,0}',
  },
  {
    ad: 'stil',
    aciklama:
      'Bileşenlere ve pencereye Türkçe CSS uygular. HTML yok, İngilizce özellik yok. ' +
      'Durumlar da Türkçedir: `üzerineGelince`, `basılıyken`, `odaklıyken` ... `TürkUI.stil` olarak yazılır.',
    ornek:
      'TürkUI.stil {\n\tbuton1(\n\t\tarkaPlanRengi: kırmızı\n\t\tkenarYuvarlaklığı: 10px\n\t\tüzerineGelince(\n\t\t\tarkaPlanRengi: mavi\n\t\t)\n\t)\n}',
  },
  {
    ad: 'betik',
    aciklama:
      'Pencereye Türkçe JavaScript bağlar. `TürkUI.betik { pencere( ... ) }` olarak yazılır; anahtar kelimeler, hazır nesneler ve üyeler Türkçedir.',
    ornek:
      'TürkUI.betik {\n\tuygulama(\n\t\tdeğişken sayi := 0\n\t\tdüğme.olayDinle("click", fonksiyon() {\n\t\t\tsayi := sayi + 1\n\t\t\tetiket.içerik := "Sayaç: " + sayi\n\t\t})\n\t)\n}',
  },
  {
    ad: 'yazdır',
    aciklama: 'Verilen değerleri çıktıya yazdırır.',
    ornek: 'yazdır("Merhaba", 5)',
    snippet: 'yazdır(${1})',
  },
  {
    ad: 'eğer',
    aciklama: 'Koşullu blok başlatır.',
    ornek: 'eğer a > b ise\n\tyazdır("büyük")\nson',
    snippet: 'eğer ${1:koşul} ise\n\t$0\nson',
  },
  {
    ad: 'değilse',
    aciklama: 'Eğer koşulu yanlışsa çalışacak bloğu başlatır.',
    ornek: 'değilse\n\tyazdır("küçük")',
    snippet: 'değilse\n\t$0',
  },
  {
    ad: 'değilse-eğer',
    aciklama: 'Önceki koşul yanlışsa yeni bir koşul dener (else-if).',
    ornek: 'değilse-eğer b > a ise\n\tyazdır("b büyük")',
    snippet: 'değilse-eğer ${1:koşul} ise\n\t$0',
  },
  {
    ad: 'ise',
    aciklama: 'eğer koşulunu bitirir.',
    ornek: 'eğer hazır ise',
  },
  {
    ad: 'iste',
    aciklama: 'Kullanıcıdan girdi alır.',
    ornek: 'değişken ad := iste("Adınız: ")',
    snippet: 'iste(${1:soru})',
  },
  {
    ad: 'son',
    aciklama: 'Bloğu kapatır.',
    ornek: 'son',
  },
  {
    ad: 'fonksiyon',
    aciklama: 'Yeniden kullanılabilir fonksiyon tanımlar.',
    ornek: 'fonksiyon topla(a, b)\n\tgeri_döndür a + b\nson',
    snippet: 'fonksiyon ${1:ad}(${2})\n\t$0\nson',
  },
  {
    ad: 'döngü',
    aciklama: 'Belirtilen sayıda tekrar eden döngü başlatır.',
    ornek: 'döngü 3 kez\n\tyazdır("tekrar")\nson',
    snippet: 'döngü ${1:3} kez\n\t$0\nson',
  },
  {
    ad: 'kez',
    aciklama: 'döngü sayısını belirtir.',
    ornek: 'döngü 5 kez',
  },
  {
    ad: 'SonsuzDöngü',
    aciklama: 'Koşul sağlandığı sürece dönen döngü başlatır.',
    ornek: 'SonsuzDöngü sayac < 10 ise\n\tsayac := sayac + 1\nson',
    snippet: 'SonsuzDöngü ${1:koşul}\n\t$0\nson',
  },
  {
    ad: 'geri_döndür',
    aciklama: 'Fonksiyondan değer döndürür.',
    ornek: 'geri_döndür a + b',
    snippet: 'geri_döndür ${1:değer}',
  },
  {
    ad: 'dön',
    aciklama: 'geri_döndür ile aynıdır.',
    ornek: 'dön 42',
    snippet: 'dön ${1:değer}',
  },
  {
    ad: 'don',
    aciklama: 'geri_döndür ile aynıdır.',
    ornek: 'don 42',
    snippet: 'don ${1:değer}',
  },
  {
    ad: 'için',
    aciklama: 'Liste üzerinde eleman bazlı döngü başlatır.',
    ornek: 'için eleman içinde liste\n\tyazdır(eleman)\nson',
    snippet: 'için ${1:eleman} içinde ${2:liste}\n\t$0\nson',
  },
  {
    ad: 'içinde',
    aciklama: 'için döngüsünde listeyi belirtir.',
    ornek: 'için x içinde [1, 2, 3]',
  },
  {
    ad: 'kır',
    aciklama: 'İçinde bulunduğu döngüyü hemen sonlandırır (Python’daki break).',
    ornek: 'için i içinde [1, 2, 3]\n\teğer i == 2 ise\n\t\tkır\n\tson\n\tyazdır(i)\nson',
  },
  {
    ad: 'dur',
    aciklama: 'Döngüyü sonlandırır; `kır` ile aynıdır (Python’daki break).',
    ornek: 'dur',
  },
  {
    ad: 'devam_et',
    aciklama: 'Döngünün sonraki adımına geçer.',
    ornek: 'devam_et',
  },
  {
    ad: 'içe_aktar',
    aciklama: 'Modül içe aktarır.',
    ornek: 'içe_aktar TürkUI',
    snippet: 'içe_aktar ${1:Modül}',
  },
  {
    ad: 'dışa_aktar',
    aciklama: 'Tanımlı sembolleri dışa aktarır.',
    ornek: 'dışa_aktar topla, pi',
    snippet: 'dışa_aktar ${1:isim}',
  },
  {
    ad: 'dene',
    aciklama: 'Hata yakalama bloğu başlatır.',
    ornek: 'dene\n\thataFırlat("hata")\nyakala h\n\tyazdır(h)\nson',
    snippet: 'dene\n\t$0\nyakala ${1:hata}\n\t\nson',
  },
  {
    ad: 'yakala',
    aciklama: 'Hata yakalama bloğunu başlatır.',
    ornek: 'yakala hata\n\tyazdır(hata)',
    snippet: 'yakala ${1:hata}\n\t$0',
  },
  {
    ad: 'nesne',
    aciklama: 'Nesne (sınıf benzeri) tanımlar.',
    ornek: 'nesne Kisi\n\tdeğişken ad := "Ali"\nson',
    snippet: 'nesne ${1:Ad}\n\t$0\nson',
  },
];

export const mantiksalOperatorler: OneriVerisi[] = [
  {
    ad: 've',
    aciklama: 'Mantıksal VE operatörü.',
    ornek: 'eğer a > 0 ve b > 0 ise',
  },
  {
    ad: 'veya',
    aciklama: 'Mantıksal VEYA operatörü.',
    ornek: 'eğer a > 0 veya b > 0 ise',
  },
  {
    ad: 'değil',
    aciklama: 'Mantıksal DEĞİL operatörü.',
    ornek: 'eğer değil hazır ise',
  },
];

export const sabitler: OneriVerisi[] = [
  {
    ad: 'Doğru',
    aciklama: 'Boolean doğru değeri.',
    ornek: 'değişken aktif := Doğru',
  },
  {
    ad: 'Yanlış',
    aciklama: 'Boolean yanlış değeri.',
    ornek: 'değişken aktif := Yanlış',
  },
  {
    ad: 'Boş',
    aciklama: 'Boş (null) değeri.',
    ornek: 'değişken değer := Boş',
  },
  {
    ad: 'PI',
    aciklama: 'Pi sayısı.',
    ornek: 'yazdır(PI)',
  },
  {
    ad: 'E',
    aciklama: 'Euler sayısı.',
    ornek: 'yazdır(E)',
  },
  {
    ad: 'TAU',
    aciklama: 'Tau sabiti (2π).',
    ornek: 'yazdır(TAU)',
  },
  {
    ad: 'SONSUZ',
    aciklama: 'Sonsuzluk sabiti.',
    ornek: 'yazdır(SONSUZ)',
  },
  {
    ad: 'SÜRÜM',
    aciklama: 'Türkod sürümü.',
    ornek: 'yazdır(SÜRÜM)',
  },
];
