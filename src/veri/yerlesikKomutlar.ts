export interface YerlesikKomutVerisi {
  ad: string;
  takmaAdlar?: string[];
  kategori: string;
  imza: string;
  aciklama: string;
  ornek: string;
  minArg: number;
  maxArg: number;
}

export const yerlesikKomutlar: YerlesikKomutVerisi[] = [
  {
    "ad": "büyükHarf",
    "takmaAdlar": [
      "buyukHarf",
      "BÜYÜKHARF"
    ],
    "kategori": "Metin",
    "imza": "büyükHarf(metin)",
    "aciklama": "Metnin tüm harflerini büyük harfe çevirir (Türkçe i→İ, ı→I kurallarıyla).",
    "ornek": "yazdır(büyükHarf(\"merhaba dünya\"))\n# MERHABA DÜNYA",
    "minArg": 1,
    "maxArg": 1
  },

  {
    "ad": "tersMetin",
    "kategori": "metin",
    "imza": "tersMetin(metin)",
    "aciklama":"Metini Ters Çevirir.",
    "ornek": " yazdır(tersMetin(\"merhaba dünya!\")) \n# !aynüd abahrem",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "küçükHarf",
    "takmaAdlar": [
      "kucukHarf",
      "KÜÇÜKHARF"
    ],
    "kategori": "Metin",
    "imza": "küçükHarf(metin)",
    "aciklama": "Metnin tüm harflerini küçük harfe çevirir (Türkçe I→ı, İ→i kurallarıyla).",
    "ornek": "yazdır(küçükHarf(\"MERHABA DÜNYA\"))\n# merhaba dünya",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "kırp",
    "takmaAdlar": [
      "kirp"
    ],
    "kategori": "Metin",
    "imza": "kırp(metin)",
    "aciklama": "Metnin başındaki ve sonundaki boşlukları siler.",
    "ornek": "yazdır(\"[\" + kırp(\"   merhaba   \") + \"]\")\n# [merhaba]",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "böl",
    "takmaAdlar": [
      "bol"
    ],
    "kategori": "Metin",
    "imza": "böl(metin, ayraç)",
    "aciklama": "Metni ayraçtan parçalayıp liste döndürür. Ayraç boş metinse harflere böler.",
    "ornek": "yazdır(böl(\"ali,ayşe,mehmet\", \",\"))\n# [\"ali\", \"ayşe\", \"mehmet\"]",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "birleştir",
    "takmaAdlar": [
      "birlestir"
    ],
    "kategori": "Metin",
    "imza": "birleştir(liste, ayraç := \"\")  ·  birleştir(liste1, liste2)",
    "aciklama": "Listeyi ayraçla metne birleştirir. İkinci argüman liste ise iki listeyi birleştirir; sözlük ise iki sözlüğü birleştirir.",
    "ornek": "yazdır(birleştir([\"a\", \"b\"], \"-\"))   # a-b\nyazdır(birleştir([1, 2], [3, 4]))     # [1, 2, 3, 4]",
    "minArg": 1,
    "maxArg": 2
  },
  {
    "ad": "uzunluk",
    "kategori": "Liste",
    "imza": "uzunluk(metin | liste | sözlük)",
    "aciklama": "Metnin karakter, listenin eleman, sözlüğün anahtar sayısını döndürür.",
    "ornek": "yazdır(uzunluk(\"merhaba\"))   # 7\nyazdır(uzunluk([1, 2, 3]))  # 3",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "ilkEleman",
    "takmaAdlar": [
      "ilk"
    ],
    "kategori": "Liste",
    "imza": "ilkEleman(liste | metin)",
    "aciklama": "Listenin ilk elemanını veya metnin ilk karakterini döndürür.",
    "ornek": "yazdır(ilkEleman([10, 20, 30]))  # 10\nyazdır(ilkEleman(\"abc\"))       # a",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "sonEleman",
    "kategori": "Liste",
    "imza": "sonEleman(liste | metin)",
    "aciklama": "Listenin son elemanını veya metnin son karakterini döndürür.",
    "ornek": "yazdır(sonEleman([10, 20, 30]))  # 30\nyazdır(sonEleman(\"abc\"))       # c",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "topla",
    "kategori": "Sayı",
    "imza": "topla(...sayılar)  ·  topla(liste)",
    "aciklama": "Verilen sayıları veya bir listenin sayılarını toplar.",
    "ornek": "yazdır(topla(1, 2, 3))      # 6\nyazdır(topla([10, 20, 30])) # 60",
    "minArg": 1,
    "maxArg": 99
  },
  {
    "ad": "yardım",
    "takmaAdlar": [
      "yardim"
    ],
    "kategori": "Akış",
    "imza": "yardım(komutAdı?)",
    "aciklama": "Bir yerleşik komutun kullanımını gösterir. Ad verilmezse tüm komutları listeler.",
    "ornek": "yardım(\"kırp\")   # kullanım bilgisini doğrudan yazar\nyardım()        # tüm komutları listeler",
    "minArg": 0,
    "maxArg": 1
  },
  {
    "ad": "değiştir",
    "kategori": "Metin",
    "imza": "değiştir(metin, eski, yeni)",
    "aciklama": "Metindeki tüm eşleşmeleri yenisiyle değiştirir.",
    "ornek": "yazdır(değiştir(\"a-b-a\", \"a\", \"X\"))\n# X-b-X",
    "minArg": 3,
    "maxArg": 3
  },
  {
    "ad": "ilkDeğiştir",
    "kategori": "Metin",
    "imza": "ilkDeğiştir(metin, eski, yeni)",
    "aciklama": "Yalnızca ilk eşleşmeyi değiştirir.",
    "ornek": "yazdır(ilkDeğiştir(\"a-b-a\", \"a\", \"X\"))\n# X-b-a",
    "minArg": 3,
    "maxArg": 3
  },
  {
    "ad": "içeriyor",
    "kategori": "Metin",
    "imza": "içeriyor(metin | liste | sözlük, aranan)",
    "aciklama": "Metinde parça, listede eleman, sözlükte anahtar var mı diye bakar.",
    "ornek": "yazdır(içeriyor(\"merhaba\", \"rha\"))   # Doğru\nyazdır(içeriyor([1, 2, 3], 2))      # Doğru",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "başlıyorMu",
    "kategori": "Metin",
    "imza": "başlıyorMu(metin, parça)",
    "aciklama": "Metin verilen parçayla başlıyor mu?",
    "ornek": "yazdır(başlıyorMu(\"merhaba\", \"mer\"))  # Doğru",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "bitiyorMu",
    "kategori": "Metin",
    "imza": "bitiyorMu(metin, parça)",
    "aciklama": "Metin verilen parçayla bitiyor mu?",
    "ornek": "yazdır(bitiyorMu(\"merhaba\", \"ba\"))  # Doğru",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "konumBul",
    "kategori": "Metin",
    "imza": "konumBul(metin, parça)",
    "aciklama": "Parçanın ilk bulunduğu konumu döndürür (0 tabanlı, yoksa -1).",
    "ornek": "yazdır(konumBul(\"merhaba\", \"r\"))  # 2",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "sonKonumBul",
    "kategori": "Metin",
    "imza": "sonKonumBul(metin, parça)",
    "aciklama": "Parçanın son bulunduğu konumu döndürür (yoksa -1).",
    "ornek": "yazdır(sonKonumBul(\"abab\", \"b\"))  # 3",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "altMetin",
    "kategori": "Metin",
    "imza": "altMetin(metin, başlangıç, uzunluk?)",
    "aciklama": "Belirtilen konumdan itibaren parça alır. Negatif başlangıç sondan sayar.",
    "ornek": "yazdır(altMetin(\"merhaba\", 1, 3))   # erh\nyazdır(altMetin(\"merhaba\", -3))     # aba",
    "minArg": 2,
    "maxArg": 3
  },
  {
    "ad": "karakterAt",
    "kategori": "Metin",
    "imza": "karakterAt(metin, indeks)",
    "aciklama": "Belirtilen indeksteki karakteri döndürür. Negatif indeks sondan sayar.",
    "ornek": "yazdır(karakterAt(\"abc\", 1))   # b\nyazdır(karakterAt(\"abc\", -1))  # c",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "ilkKarakter",
    "kategori": "Metin",
    "imza": "ilkKarakter(metin)",
    "aciklama": "Metnin ilk karakterini döndürür (boş metinde boş).",
    "ornek": "yazdır(ilkKarakter(\"abc\"))  # a",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "sonKarakter",
    "kategori": "Metin",
    "imza": "sonKarakter(metin)",
    "aciklama": "Metnin son karakterini döndürür (boş metinde boş).",
    "ornek": "yazdır(sonKarakter(\"abc\"))  # c",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "tersÇevir",
    "kategori": "Metin",
    "imza": "tersÇevir(metin | liste)",
    "aciklama": "Metnin karakterlerini veya listenin elemanlarını ters çevirir.",
    "ornek": "yazdır(tersÇevir(\"abc\"))     # cba\nyazdır(tersÇevir([1, 2, 3]))  # [3, 2, 1]",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "metinTekrarla",
    "kategori": "Metin",
    "imza": "metinTekrarla(metin, adet)",
    "aciklama": "Metni belirtilen sayıda tekrarlar.",
    "ornek": "yazdır(metinTekrarla(\"ab\", 3))  # ababab",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "doldurSol",
    "kategori": "Metin",
    "imza": "doldurSol(metin, uzunluk, karakter := \" \")",
    "aciklama": "Metni soldan belirtilen karakterle doldurur.",
    "ornek": "yazdır(doldurSol(\"5\", 3, \"0\"))  # 005",
    "minArg": 2,
    "maxArg": 3
  },
  {
    "ad": "doldurSağ",
    "kategori": "Metin",
    "imza": "doldurSağ(metin, uzunluk, karakter := \" \")",
    "aciklama": "Metni sağdan belirtilen karakterle doldurur.",
    "ornek": "yazdır(doldurSağ(\"5\", 3, \".\"))  # 5..",
    "minArg": 2,
    "maxArg": 3
  },
  {
    "ad": "sayıMı",
    "kategori": "Metin",
    "imza": "sayıMı(değer)",
    "aciklama": "Değer sayıya çevrilebiliyor mu? (virgüllü ondalık destekli)",
    "ornek": "yazdır(sayıMı(\"3,14\"))  # Doğru\nyazdır(sayıMı(\"abc\"))   # Yanlış",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "harfMi",
    "kategori": "Metin",
    "imza": "harfMi(metin, indeks?)",
    "aciklama": "Metnin tamamı harf mi? İndeks verilirse yalnızca o karaktere bakar.",
    "ornek": "yazdır(harfMi(\"abc\"))    # Doğru\nyazdır(harfMi(\"a1\"))    # Yanlış",
    "minArg": 1,
    "maxArg": 2
  },
  {
    "ad": "harfSayısı",
    "kategori": "Metin",
    "imza": "harfSayısı(metin)",
    "aciklama": "Metindeki harf sayısını döndürür (rakam ve boşluklar sayılmaz).",
    "ornek": "yazdır(harfSayısı(\"a1b2\"))  # 2",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "kelimeSayısı",
    "kategori": "Metin",
    "imza": "kelimeSayısı(metin)",
    "aciklama": "Metindeki kelime sayısını döndürür.",
    "ornek": "yazdır(kelimeSayısı(\"ali veli\"))  # 2",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "cümleSayısı",
    "kategori": "Metin",
    "imza": "cümleSayısı(metin)",
    "aciklama": "Metindeki cümle sayısını döndürür (. ! ? … ayraçlarına göre).",
    "ornek": "yazdır(cümleSayısı(\"Bir. İki! Üç?\"))  # 3",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "sesliSayısı",
    "kategori": "Metin",
    "imza": "sesliSayısı(metin)",
    "aciklama": "Metindeki Türkçe sesli harf sayısını döndürür.",
    "ornek": "yazdır(sesliSayısı(\"merhaba\"))  # 3",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "sessizSayısı",
    "kategori": "Metin",
    "imza": "sessizSayısı(metin)",
    "aciklama": "Metindeki sessiz (sesli olmayan) harf sayısını döndürür.",
    "ornek": "yazdır(sessizSayısı(\"merhaba\"))  # 4",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "mesafe",
    "kategori": "Metin",
    "imza": "mesafe(metin1, metin2)",
    "aciklama": "İki metin arasındaki Levenshtein düzenleme mesafesini döndürür.",
    "ornek": "yazdır(mesafe(\"kitten\", \"sitting\"))  # 3",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "benzerlik",
    "kategori": "Metin",
    "imza": "benzerlik(metin1, metin2)",
    "aciklama": "İki metnin benzerlik oranını 0-1 arasında döndürür.",
    "ornek": "yazdır(benzerlik(\"abc\", \"abc\"))  # 1",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "biçim",
    "kategori": "Metin",
    "imza": "biçim(şablon, ...değerler)",
    "aciklama": "Şablondaki {0}, {1} yer tutucularını sırayla doldurur.",
    "ornek": "yazdır(biçim(\"{0} + {1} = {2}\", 2, 3, 5))\n# 2 + 3 = 5",
    "minArg": 1,
    "maxArg": 99
  },
  {
    "ad": "şablon",
    "kategori": "Metin",
    "imza": "şablon(metin, sözlük)",
    "aciklama": "Metindeki {anahtar} yer tutucularını sözlük değerleriyle doldurur.",
    "ornek": "yazdır(şablon(\"Merhaba {isim}\", {\"isim\": \"Ali\"}))\n# Merhaba Ali",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "ayıkla",
    "kategori": "Metin",
    "imza": "ayıkla(metin, baştaki, sondaki)",
    "aciklama": "Metnin başındaki ve sonundaki verilen parçaları keser.",
    "ornek": "yazdır(ayıkla(\"[x]\", \"[\", \"]\"))  # x",
    "minArg": 3,
    "maxArg": 3
  },
  {
    "ad": "bölVeKırp",
    "kategori": "Metin",
    "imza": "bölVeKırp(metin, ayraç)",
    "aciklama": "Metni ayraçtan böler ve her parçayı kırpar.",
    "ornek": "yazdır(bölVeKırp(\" a , b \", \",\"))  # [a, b]",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "rastgeleMetin",
    "kategori": "Metin",
    "imza": "rastgeleMetin(uzunluk)",
    "aciklama": "Belirtilen uzunlukta rastgele harf-rakam metni üretir.",
    "ornek": "yazdır(rastgeleMetin(8))",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "satırlaraÖnek",
    "kategori": "Metin",
    "imza": "satırlaraÖnek(metin, önek)",
    "aciklama": "Her satırın başına verilen öneki ekler ve satır listesi döndürür.",
    "ornek": "yazdır(satırlaraÖnek(\"a\nb\", \"- \"))\n# [- a, - b]",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "satırlaraSonek",
    "kategori": "Metin",
    "imza": "satırlaraSonek(metin, sonek)",
    "aciklama": "Her satırın sonuna verilen soneki ekler ve satır listesi döndürür.",
    "ornek": "yazdır(satırlaraSonek(\"a\nb\", \";\"))\n# [a;, b;]",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "desenEşleşiyorMu",
    "kategori": "Metin",
    "imza": "desenEşleşiyorMu(metin, desen)",
    "aciklama": "Metin düzenli ifade (regex) desenine uyuyor mu?",
    "ornek": "yazdır(desenEşleşiyorMu(\"abc123\", \"[0-9]+\"))  # Doğru",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "desenBul",
    "kategori": "Metin",
    "imza": "desenBul(metin, desen)",
    "aciklama": "Desene uyan tüm parçaları liste olarak döndürür.",
    "ornek": "yazdır(desenBul(\"a1b22\", \"[0-9]+\"))  # [1, 22]",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "desenDeğiştir",
    "kategori": "Metin",
    "imza": "desenDeğiştir(metin, desen, yeni)",
    "aciklama": "Desene uyan tüm parçaları yenisiyle değiştirir ($1 gibi gruplar desteklenir).",
    "ornek": "yazdır(desenDeğiştir(\"a1b22\", \"[0-9]+\", \"#\"))  # a#b#",
    "minArg": 3,
    "maxArg": 3
  },
  {
    "ad": "desenBöl",
    "kategori": "Metin",
    "imza": "desenBöl(metin, desen)",
    "aciklama": "Metni düzenli ifade desenine göre böler.",
    "ornek": "yazdır(desenBöl(\"a1b22\", \"[0-9]+\"))  # [a, b, ]",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "urlKodla",
    "kategori": "Metin",
    "imza": "urlKodla(metin)",
    "aciklama": "Metni URL için yüzde kodlamasıyla kaçışlar.",
    "ornek": "yazdır(urlKodla(\"a b&c\"))  # a%20b%26c",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "urlÇöz",
    "kategori": "Metin",
    "imza": "urlÇöz(metin)",
    "aciklama": "Yüzde kodlamasını çözer.",
    "ornek": "yazdır(urlÇöz(\"a%20b\"))  # a b",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "htmlKaçışla",
    "kategori": "Metin",
    "imza": "htmlKaçışla(metin)",
    "aciklama": "HTML özel karakterlerini (& < > \" ') kaçışlar.",
    "ornek": "yazdır(htmlKaçışla(\"<b>\"))  # &lt;b&gt;",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "htmlÇöz",
    "kategori": "Metin",
    "imza": "htmlÇöz(metin)",
    "aciklama": "HTML kaçışlarını geri çözer.",
    "ornek": "yazdır(htmlÇöz(\"&lt;b&gt;\"))  # <b>",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "karakterKodu",
    "kategori": "Metin",
    "imza": "karakterKodu(karakter)",
    "aciklama": "Karakterin Unicode kod noktasını döndürür.",
    "ornek": "yazdır(karakterKodu(\"A\"))  # 65",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "karaktereÇevir",
    "kategori": "Metin",
    "imza": "karaktereÇevir(kod)",
    "aciklama": "Unicode kod noktasından karakter üretir.",
    "ornek": "yazdır(karaktereÇevir(65))  # A",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "başlıkBiçimi",
    "kategori": "Metin",
    "imza": "başlıkBiçimi(metin)",
    "aciklama": "Her kelimenin ilk harfini büyük, kalanını küçük yapar.",
    "ornek": "yazdır(başlıkBiçimi(\"merhaba dünya\"))  # Merhaba Dünya",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "cümleBiçimi",
    "kategori": "Metin",
    "imza": "cümleBiçimi(metin)",
    "aciklama": "Metnin yalnızca ilk harfini büyük, kalanını küçük yapar.",
    "ornek": "yazdır(cümleBiçimi(\"MERHABA DÜNYA\"))\n# Merhaba dünya",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "solKırp",
    "kategori": "Metin",
    "imza": "solKırp(metin)",
    "aciklama": "Metnin yalnızca başındaki boşlukları siler.",
    "ornek": "yazdır(\"[\" + solKırp(\"   x\") + \"]\")  # [x]",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "sağKırp",
    "kategori": "Metin",
    "imza": "sağKırp(metin)",
    "aciklama": "Metnin yalnızca sonundaki boşlukları siler.",
    "ornek": "yazdır(\"[\" + sağKırp(\"x   \") + \"]\")  # [x]",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "satırlaraBöl",
    "kategori": "Metin",
    "imza": "satırlaraBöl(metin)",
    "aciklama": "Metni satırlara bölüp liste döndürür.",
    "ornek": "yazdır(satırlaraBöl(\"a\nb\"))  # [a, b]",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "kelimelereBöl",
    "kategori": "Metin",
    "imza": "kelimelereBöl(metin)",
    "aciklama": "Metni boşluklardan bölüp kelime listesi döndürür.",
    "ornek": "yazdır(kelimelereBöl(\"ali  veli\"))  # [ali, veli]",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "çarp",
    "kategori": "Sayı",
    "imza": "çarp(...sayılar)  ·  çarp(liste)",
    "aciklama": "Verilen sayıları veya bir listenin sayılarını çarpar.",
    "ornek": "yazdır(çarp(2, 3, 4))      # 24\nyazdır(çarp([2, 5, 10])) # 100",
    "minArg": 1,
    "maxArg": 99
  },
  {
    "ad": "ortalama",
    "kategori": "Sayı",
    "imza": "ortalama(...sayılar)  ·  ortalama(liste)",
    "aciklama": "Sayıların veya listenin aritmetik ortalamasını döndürür.",
    "ornek": "yazdır(ortalama(10, 20, 30))    # 20\nyazdır(ortalama([2, 4, 6]))   # 4",
    "minArg": 1,
    "maxArg": 99
  },
  {
    "ad": "enBüyük",
    "kategori": "Sayı",
    "imza": "enBüyük(...sayılar)  ·  enBüyük(liste)",
    "aciklama": "Verilen sayıların veya listenin en büyüğünü döndürür.",
    "ornek": "yazdır(enBüyük(3, 9, 5))     # 9\nyazdır(enBüyük([2, 8, 4]))   # 8",
    "minArg": 1,
    "maxArg": 99
  },
  {
    "ad": "enKüçük",
    "kategori": "Sayı",
    "imza": "enKüçük(...sayılar)  ·  enKüçük(liste)",
    "aciklama": "Verilen sayıların veya listenin en küçüğünü döndürür.",
    "ornek": "yazdır(enKüçük(3, 9, 5))     # 3\nyazdır(enKüçük([2, 8, 4]))   # 2",
    "minArg": 1,
    "maxArg": 99
  },
  {
    "ad": "mutlak",
    "kategori": "Sayı",
    "imza": "mutlak(sayı)",
    "aciklama": "Sayının mutlak değerini döndürür.",
    "ornek": "yazdır(mutlak(-8))     # 8\nyazdır(mutlak(-3.5))  # 3.5",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "yuvarla",
    "kategori": "Sayı",
    "imza": "yuvarla(sayı, basamak := 0)",
    "aciklama": "Sayıyı en yakın tam sayıya veya belirtilen ondalık basamağa yuvarlar.",
    "ornek": "yazdır(yuvarla(3.6))        # 4\nyazdır(yuvarla(3.14159, 2)) # 3.14",
    "minArg": 1,
    "maxArg": 2
  },
  {
    "ad": "aşağıYuvarla",
    "kategori": "Sayı",
    "imza": "aşağıYuvarla(sayı)",
    "aciklama": "Sayıyı aşağıya (tabana) yuvarlar.",
    "ornek": "yazdır(aşağıYuvarla(3.9))  # 3",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "yukarıYuvarla",
    "kategori": "Sayı",
    "imza": "yukarıYuvarla(sayı)",
    "aciklama": "Sayıyı yukarıya (tavana) yuvarlar.",
    "ornek": "yazdır(yukarıYuvarla(3.1))  # 4",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "kalan",
    "kategori": "Sayı",
    "imza": "kalan(sayı, bölen)",
    "aciklama": "Bölme işleminden kalanı döndürür (mod).",
    "ornek": "yazdır(kalan(10, 3))  # 1",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "üs",
    "kategori": "Sayı",
    "imza": "üs(taban, kuvvet)",
    "aciklama": "Bir sayının kuvvetini hesaplar.",
    "ornek": "yazdır(üs(2, 10))  # 1024",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "karekök",
    "kategori": "Sayı",
    "imza": "karekök(sayı)",
    "aciklama": "Sayının karekökünü döndürür (negatif sayıda hata verir).",
    "ornek": "yazdır(karekök(81))  # 9",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "küpKök",
    "kategori": "Sayı",
    "imza": "küpKök(sayı)",
    "aciklama": "Sayının küp kökünü döndürür (negatiflerde de çalışır).",
    "ornek": "yazdır(küpKök(27))  # 3",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "işaret",
    "kategori": "Sayı",
    "imza": "işaret(sayı)",
    "aciklama": "Sayının işaretini döndürür: -1, 0 veya 1.",
    "ornek": "yazdır(işaret(-5))  # -1",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "sınırla",
    "kategori": "Sayı",
    "imza": "sınırla(sayı, alt, üst)",
    "aciklama": "Sayıyı alt-üst aralığına sıkıştırır (clamp).",
    "ornek": "yazdır(sınırla(15, 0, 10))  # 10",
    "minArg": 3,
    "maxArg": 3
  },
  {
    "ad": "aralıktaMı",
    "kategori": "Sayı",
    "imza": "aralıktaMı(sayı, alt, üst)",
    "aciklama": "Sayı alt-üst aralığında mı (uçlar dahil)?",
    "ornek": "yazdır(aralıktaMı(5, 1, 10))  # Doğru",
    "minArg": 3,
    "maxArg": 3
  },
  {
    "ad": "çiftMi",
    "kategori": "Sayı",
    "imza": "çiftMi(tamSayı)",
    "aciklama": "Tam sayı çift mi?",
    "ornek": "yazdır(çiftMi(10))  # Doğru",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "tekMi",
    "kategori": "Sayı",
    "imza": "tekMi(tamSayı)",
    "aciklama": "Tam sayı tek mi?",
    "ornek": "yazdır(tekMi(7))  # Doğru",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "asalMı",
    "kategori": "Sayı",
    "imza": "asalMı(tamSayı)",
    "aciklama": "Sayı asal mı?",
    "ornek": "yazdır(asalMı(97))  # Doğru",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "çarpanlaraAyır",
    "kategori": "Sayı",
    "imza": "çarpanlaraAyır(tamSayı)",
    "aciklama": "Sayıyı asal çarpanlarına ayırıp liste döndürür.",
    "ornek": "yazdır(çarpanlaraAyır(360))  # [2, 2, 2, 3, 3, 5]",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "ebob",
    "kategori": "Sayı",
    "imza": "ebob(a, b)",
    "aciklama": "İki sayının en büyük ortak bölenini döndürür.",
    "ornek": "yazdır(ebob(24, 36))  # 12",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "ekok",
    "kategori": "Sayı",
    "imza": "ekok(a, b)",
    "aciklama": "İki sayının en küçük ortak katını döndürür.",
    "ornek": "yazdır(ekok(4, 6))  # 12",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "faktöriyel",
    "kategori": "Sayı",
    "imza": "faktöriyel(n)",
    "aciklama": "n! değerini hesaplar (0-170 arası).",
    "ornek": "yazdır(faktöriyel(5))  # 120",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "basamakSayısı",
    "kategori": "Sayı",
    "imza": "basamakSayısı(sayı)",
    "aciklama": "Tam sayının kaç basamaklı olduğunu döndürür.",
    "ornek": "yazdır(basamakSayısı(12345))  # 5",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "basamaklarıAyır",
    "kategori": "Sayı",
    "imza": "basamaklarıAyır(sayı)",
    "aciklama": "Tam sayının rakamlarını liste olarak döndürür.",
    "ornek": "yazdır(basamaklarıAyır(1234))  # [1, 2, 3, 4]",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "sayıBiçimle",
    "kategori": "Sayı",
    "imza": "sayıBiçimle(sayı, basamak := 2)",
    "aciklama": "Sayıyı Türkçe biçimde yazar: binlik nokta, ondalık virgül.",
    "ornek": "yazdır(sayıBiçimle(1234.5))     # 1.234,50\nyazdır(sayıBiçimle(1234.567, 1))  # 1.234,6",
    "minArg": 1,
    "maxArg": 2
  },
  {
    "ad": "yüzde",
    "kategori": "Sayı",
    "imza": "yüzde(sayı, oran)",
    "aciklama": "Sayının yüzde kaçı olduğunu hesaplar.",
    "ornek": "yazdır(yüzde(200, 15))  # 30",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "yüzdeDeğişim",
    "kategori": "Sayı",
    "imza": "yüzdeDeğişim(eski, yeni)",
    "aciklama": "İki değer arasındaki yüzde değişimi hesaplar.",
    "ornek": "yazdır(yüzdeDeğişim(100, 120))  # 20",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "oran",
    "kategori": "Sayı",
    "imza": "oran(a, b)",
    "aciklama": "a bölü b oranını döndürür.",
    "ornek": "yazdır(oran(10, 4))  # 2.5",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "yakınMı",
    "kategori": "Sayı",
    "imza": "yakınMı(a, b, tolerans := 0.000001)",
    "aciklama": "İki sayı tolerans içinde eşit mi?",
    "ornek": "yazdır(yakınMı(0.1 + 0.2, 0.3))  # Doğru",
    "minArg": 2,
    "maxArg": 3
  },
  {
    "ad": "rastgeleSayı",
    "kategori": "Sayı",
    "imza": "rastgeleSayı(alt, üst)",
    "aciklama": "Alt ve üst dahil olacak şekilde rastgele tam sayı üretir.",
    "ornek": "yazdır(rastgeleSayı(1, 6))  # 1-6 arası",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "rastgeleOndalık",
    "kategori": "Sayı",
    "imza": "rastgeleOndalık(alt, üst)",
    "aciklama": "Alt ile üst arasında rastgele ondalıklı sayı üretir.",
    "ornek": "yazdır(rastgeleOndalık(0, 1))  # 0-1 arası",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "rastgeleNormal",
    "kategori": "Sayı",
    "imza": "rastgeleNormal(ortalama, sapma)",
    "aciklama": "Normal (Gauss) dağılımına uygun rastgele sayı üretir.",
    "ornek": "yazdır(rastgeleNormal(0, 1))",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "yazıTura",
    "kategori": "Sayı",
    "imza": "yazıTura()",
    "aciklama": "Yazı tura atar: rastgele Doğru veya Yanlış.",
    "ornek": "yazdır(yazıTura())  # Doğru veya Yanlış",
    "minArg": 0,
    "maxArg": 0
  },
  {
    "ad": "zarAt",
    "kategori": "Sayı",
    "imza": "zarAt(yüz := 6)",
    "aciklama": "1 ile yüz arasında rastgele zar değeri üretir.",
    "ornek": "yazdır(zarAt())     # 1-6\nyazdır(zarAt(20))  # 1-20",
    "minArg": 0,
    "maxArg": 1
  },
  {
    "ad": "tamSayıMı",
    "kategori": "Sayı",
    "imza": "tamSayıMı(değer)",
    "aciklama": "Değer tam sayı mı?",
    "ornek": "yazdır(tamSayıMı(5))    # Doğru\nyazdır(tamSayıMı(5.5))  # Yanlış",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "pozitifMi",
    "kategori": "Sayı",
    "imza": "pozitifMi(sayı)",
    "aciklama": "Sayı sıfırdan büyük mü?",
    "ornek": "yazdır(pozitifMi(5))  # Doğru",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "negatifMi",
    "kategori": "Sayı",
    "imza": "negatifMi(sayı)",
    "aciklama": "Sayı sıfırdan küçük mü?",
    "ornek": "yazdır(negatifMi(-5))  # Doğru",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "sıfırMı",
    "kategori": "Sayı",
    "imza": "sıfırMı(sayı)",
    "aciklama": "Sayı sıfır mı? (çok küçük değerlerde toleranslı)",
    "ornek": "yazdır(sıfırMı(0))  # Doğru",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "ikiliye",
    "kategori": "Sayı",
    "imza": "ikiliye(tamSayı)",
    "aciklama": "Sayıyı ikilik (binary) metne çevirir.",
    "ornek": "yazdır(ikiliye(10))  # 1010",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "onaltılıya",
    "kategori": "Sayı",
    "imza": "onaltılıya(tamSayı)",
    "aciklama": "Sayıyı onaltılık (hex) metne çevirir.",
    "ornek": "yazdır(onaltılıya(255))  # ff",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "sekizliye",
    "kategori": "Sayı",
    "imza": "sekizliye(tamSayı)",
    "aciklama": "Sayıyı sekizlik (octal) metne çevirir.",
    "ornek": "yazdır(sekizliye(64))  # 100",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "ikiliden",
    "kategori": "Sayı",
    "imza": "ikiliden(metin)",
    "aciklama": "İkilik metni sayıya çevirir.",
    "ornek": "yazdır(ikiliden(\"1010\"))  # 10",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "onaltılıdan",
    "kategori": "Sayı",
    "imza": "onaltılıdan(metin)",
    "aciklama": "Onaltılık metni sayıya çevirir.",
    "ornek": "yazdır(onaltılıdan(\"ff\"))  # 255",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "sekizliden",
    "kategori": "Sayı",
    "imza": "sekizliden(metin)",
    "aciklama": "Sekizlik metni sayıya çevirir.",
    "ornek": "yazdır(sekizliden(\"100\"))  # 64",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "boşListe",
    "kategori": "Liste",
    "imza": "boşListe()",
    "aciklama": "Boş liste döndürür.",
    "ornek": "yazdır(boşListe())  # []",
    "minArg": 0,
    "maxArg": 0
  },
  {
    "ad": "diziOluştur",
    "kategori": "Liste",
    "imza": "diziOluştur(adet, değer := Boş)",
    "aciklama": "Belirtilen sayıda elemandan oluşan liste üretir.",
    "ornek": "yazdır(diziOluştur(3, 0))  # [0, 0, 0]",
    "minArg": 1,
    "maxArg": 2
  },
  {
    "ad": "ekle",
    "kategori": "Liste",
    "imza": "ekle(liste | küme, değer)  ·  ekle(sözlük, anahtar, değer)",
    "aciklama": "Listeye/kümeye eleman, sözlüğe anahtar-değer ekler.",
    "ornek": "değişken l := [1, 2]\nyazdır(ekle(l, 3))  # [1, 2, 3]\nyazdır(ekle(sözlük(), \"a\", 1))  # { a: 1 }",
    "minArg": 2,
    "maxArg": 3
  },
  {
    "ad": "sil",
    "kategori": "Liste",
    "imza": "sil(liste | küme, değer)  ·  sil(sözlük, anahtar)",
    "aciklama": "Değeri listeden/kümeden, anahtarı sözlükten siler.",
    "ornek": "değişken l := [1, 2, 3]\nyazdır(sil(l, 2))  # [1, 3]",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "silAt",
    "kategori": "Liste",
    "imza": "silAt(liste, indeks)",
    "aciklama": "Belirtilen indeksteki elemanı siler (negatif indeks sondan sayar).",
    "ornek": "değişken l := [10, 20, 30]\nyazdır(silAt(l, 1))  # [10, 30]",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "ekleBaşa",
    "kategori": "Liste",
    "imza": "ekleBaşa(liste, değer)",
    "aciklama": "Listenin başına eleman ekler.",
    "ornek": "değişken l := [2, 3]\nyazdır(ekleBaşa(l, 1))  # [1, 2, 3]",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "dilim",
    "kategori": "Liste",
    "imza": "dilim(liste, başlangıç, adet?)",
    "aciklama": "Listenin bir bölümünü döndürür (negatif başlangıç sondan sayar).",
    "ornek": "yazdır(dilim([10, 20, 30, 40], 1, 2))  # [20, 30]",
    "minArg": 2,
    "maxArg": 3
  },
  {
    "ad": "ilkN",
    "kategori": "Liste",
    "imza": "ilkN(liste, adet)",
    "aciklama": "Listenin ilk n elemanını döndürür.",
    "ornek": "yazdır(ilkN([1, 2, 3, 4], 2))  # [1, 2]",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "sonN",
    "kategori": "Liste",
    "imza": "sonN(liste, adet)",
    "aciklama": "Listenin son n elemanını döndürür.",
    "ornek": "yazdır(sonN([1, 2, 3, 4], 2))  # [3, 4]",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "indeksBul",
    "kategori": "Liste",
    "imza": "indeksBul(liste, değer)",
    "aciklama": "Değerin ilk bulunduğu indeksi döndürür (yoksa -1).",
    "ornek": "yazdır(indeksBul([1, 2, 3], 2))  # 1",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "sırala",
    "kategori": "Liste",
    "imza": "sırala(liste, yön := \"artan\")",
    "aciklama": "Listenin sıralanmış bir kopyasını döndürür (\"artan\" / \"azalan\").",
    "ornek": "yazdır(sırala([3, 1, 2]))           # [1, 2, 3]\nyazdır(sırala([3, 1, 2], \"azalan\"))  # [3, 2, 1]",
    "minArg": 1,
    "maxArg": 2
  },
  {
    "ad": "benzersiz",
    "kategori": "Liste",
    "imza": "benzersiz(liste)",
    "aciklama": "Tekrarlanan elemanları kaldırır (ilk görülme sırası korunur).",
    "ornek": "yazdır(benzersiz([1, 2, 2, 3, 1]))  # [1, 2, 3]",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "düzleştir",
    "kategori": "Liste",
    "imza": "düzleştir(liste, derinlik := 1)",
    "aciklama": "İç içe listeleri belirtilen derinliğe kadar açar.",
    "ornek": "yazdır(düzleştir([[1, 2], [3, [4]]]))  # [1, 2, 3, [4]]",
    "minArg": 1,
    "maxArg": 2
  },
  {
    "ad": "filtrele",
    "kategori": "Liste",
    "imza": "filtrele(liste, koşul)",
    "aciklama": "Koşulu sağlayan elemanlardan yeni liste üretir.",
    "ornek": "yazdır(filtrele([1, 2, 3, 4], (x) => x % 2 == 0))  # [2, 4]",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "eşle",
    "kategori": "Liste",
    "imza": "eşle(liste, dönüşüm)",
    "aciklama": "Her elemanı fonksiyondan geçirip yeni liste üretir.",
    "ornek": "yazdır(eşle([1, 2, 3], (x) => x * 2))  # [2, 4, 6]",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "indirge",
    "kategori": "Liste",
    "imza": "indirge(liste, fonksiyon, başlangıç?)",
    "aciklama": "Listeyi tek bir değere indirger (başlangıç verilmezse ilk eleman).",
    "ornek": "yazdır(indirge([1, 2, 3], (a, b) => a + b, 0))  # 6",
    "minArg": 2,
    "maxArg": 3
  },
  {
    "ad": "her",
    "kategori": "Liste",
    "imza": "her(liste, koşul)",
    "aciklama": "Tüm elemanlar koşulu sağlıyor mu?",
    "ornek": "yazdır(her([2, 4, 6], (x) => x % 2 == 0))  # Doğru",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "bazı",
    "kategori": "Liste",
    "imza": "bazı(liste, koşul)",
    "aciklama": "En az bir eleman koşulu sağlıyor mu?",
    "ornek": "yazdır(bazı([1, 2, 3], (x) => x > 2))  # Doğru",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "hiçbiri",
    "kategori": "Liste",
    "imza": "hiçbiri(liste, koşul)",
    "aciklama": "Hiçbir eleman koşulu sağlamıyor mu?",
    "ornek": "yazdır(hiçbiri([1, 2, 3], (x) => x > 5))  # Doğru",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "bul",
    "kategori": "Liste",
    "imza": "bul(liste, koşul)",
    "aciklama": "Koşulu sağlayan ilk elemanı döndürür (yoksa Boş).",
    "ornek": "yazdır(bul([1, 2, 3, 4], (x) => x > 2))  # 3",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "bulİndeks",
    "kategori": "Liste",
    "imza": "bulİndeks(liste, koşul)",
    "aciklama": "Koşulu sağlayan ilk elemanın indeksini döndürür (yoksa -1).",
    "ornek": "yazdır(bulİndeks([1, 2, 3, 4], (x) => x > 2))  # 2",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "say",
    "kategori": "Liste",
    "imza": "say(liste, koşul)",
    "aciklama": "Koşulu sağlayan eleman sayısını döndürür.",
    "ornek": "yazdır(say([1, 2, 3, 4], (x) => x % 2 == 0))  # 2",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "grupla",
    "kategori": "Liste",
    "imza": "grupla(liste, anahtarFonksiyonu)",
    "aciklama": "Elemanları fonksiyonun döndürdüğü anahtara göre gruplar.",
    "ornek": "yazdır(grupla([1, 2, 3, 4], (x) => x % 2))  # { 0: [2, 4], 1: [1, 3] }",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "karıştır",
    "kategori": "Liste",
    "imza": "karıştır(liste)",
    "aciklama": "Listenin karıştırılmış bir kopyasını döndürür.",
    "ornek": "yazdır(uzunluk(karıştır([1, 2, 3, 4])))  # 4",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "rastgeleElemanlar",
    "kategori": "Liste",
    "imza": "rastgeleElemanlar(liste, adet)",
    "aciklama": "Listeden tekrarsız rastgele n eleman seçer.",
    "ornek": "yazdır(uzunluk(rastgeleElemanlar([1, 2, 3], 2)))  # 2",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "kesişim",
    "kategori": "Liste",
    "imza": "kesişim(liste1, liste2)",
    "aciklama": "İki listede ortak bulunan elemanları döndürür.",
    "ornek": "yazdır(kesişim([1, 2, 3], [2, 3, 4]))  # [2, 3]",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "fark",
    "kategori": "Liste",
    "imza": "fark(liste1, liste2)",
    "aciklama": "liste1 içinde olup liste2 içinde olmayan elemanları döndürür.",
    "ornek": "yazdır(fark([1, 2, 3], [2]))  # [1, 3]",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "eşitMi",
    "kategori": "Liste",
    "imza": "eşitMi(değer1, değer2)",
    "aciklama": "İki değer derinlemesine eşit mi? (liste ve sözlükler dahil)",
    "ornek": "yazdır(eşitMi([1, [2]], [1, [2]]))  # Doğru",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "parçala",
    "kategori": "Liste",
    "imza": "parçala(liste, parçaBoyu)",
    "aciklama": "Listeyi belirtilen boyutta parçalara böler.",
    "ornek": "yazdır(parçala([1, 2, 3, 4, 5], 2))  # [[1, 2], [3, 4], [5]]",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "sıkıştır",
    "kategori": "Liste",
    "imza": "sıkıştır(liste1, liste2)",
    "aciklama": "İki listeyi eleman çiftleri hâlinde birleştirir.",
    "ornek": "yazdır(sıkıştır([1, 2], [\"a\", \"b\"]))  # [[1, a], [2, b]]",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "aç",
    "kategori": "Liste",
    "imza": "aç(liste)",
    "aciklama": "Çift listesini iki ayrı listeye açar (sıkıştır tersi).",
    "ornek": "yazdır(aç([[1, \"a\"], [2, \"b\"]]))  # [[1, 2], [a, b]]",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "döndür",
    "kategori": "Liste",
    "imza": "döndür(liste, adet)",
    "aciklama": "Listeyi sağa doğru belirtilen sayıda döndürür.",
    "ornek": "yazdır(döndür([1, 2, 3], 1))  # [3, 1, 2]",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "yerDeğiştir",
    "kategori": "Liste",
    "imza": "yerDeğiştir(liste, indeks1, indeks2)",
    "aciklama": "İki elemanın yerini değiştirir.",
    "ornek": "değişken l := [1, 2, 3]\nyazdır(yerDeğiştir(l, 0, 2))  # [3, 2, 1]",
    "minArg": 3,
    "maxArg": 3
  },
  {
    "ad": "tekrarEt",
    "kategori": "Liste",
    "imza": "tekrarEt(değer, adet)",
    "aciklama": "Aynı değeri belirtilen sayıda içeren liste üretir.",
    "ornek": "yazdır(tekrarEt(\"x\", 3))  # [x, x, x]",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "sözlük",
    "kategori": "Sözlük",
    "imza": "sözlük()",
    "aciklama": "Boş sözlük döndürür.",
    "ornek": "yazdır(sözlük())  # {}",
    "minArg": 0,
    "maxArg": 0
  },
  {
    "ad": "anahtarlar",
    "kategori": "Sözlük",
    "imza": "anahtarlar(sözlük)",
    "aciklama": "Sözlüğün anahtarlarını liste olarak döndürür.",
    "ornek": "yazdır(anahtarlar({\"a\": 1, \"b\": 2}))  # [a, b]",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "değerler",
    "kategori": "Sözlük",
    "imza": "değerler(sözlük)",
    "aciklama": "Sözlüğün değerlerini liste olarak döndürür.",
    "ornek": "yazdır(değerler({\"a\": 1, \"b\": 2}))  # [1, 2]",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "girdiler",
    "kategori": "Sözlük",
    "imza": "girdiler(sözlük)",
    "aciklama": "Sözlüğü [anahtar, değer] çiftleri listesine çevirir.",
    "ornek": "yazdır(girdiler({\"a\": 1}))  # [[a, 1]]",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "seç",
    "kategori": "Sözlük",
    "imza": "seç(sözlük, anahtarlar)",
    "aciklama": "Yalnızca verilen anahtarları içeren yeni sözlük döndürür.",
    "ornek": "yazdır(seç({\"a\": 1, \"b\": 2}, [\"a\"]))  # { a: 1 }",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "at",
    "kategori": "Sözlük",
    "imza": "at(sözlük, anahtarlar)",
    "aciklama": "Verilen anahtarları çıkarıp yeni sözlük döndürür.",
    "ornek": "yazdır(at({\"a\": 1, \"b\": 2}, [\"a\"]))  # { b: 2 }",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "birleştirSözlük",
    "kategori": "Sözlük",
    "imza": "birleştirSözlük(sözlük1, sözlük2)",
    "aciklama": "İki sözlüğü birleştirir; ikinci sözlüğün değerleri kazanır.",
    "ornek": "yazdır(birleştirSözlük({\"a\": 1}, {\"b\": 2}))  # { a: 1, b: 2 }",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "dönüştür",
    "kategori": "Sözlük",
    "imza": "dönüştür(sözlük, fonksiyon)",
    "aciklama": "Sözlüğün her değerini fonksiyondan geçirir.",
    "ornek": "yazdır(dönüştür({\"a\": 1}, (v) => v * 2))  # { a: 2 }",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "filtreleSözlük",
    "kategori": "Sözlük",
    "imza": "filtreleSözlük(sözlük, koşul)",
    "aciklama": "Koşulu sağlayan değerlerin girdilerini tutar.",
    "ornek": "yazdır(filtreleSözlük({\"a\": 1, \"b\": 2}, (v) => v > 1))  # { b: 2 }",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "varsayılanAl",
    "kategori": "Sözlük",
    "imza": "varsayılanAl(sözlük, anahtar, yedek)",
    "aciklama": "Anahtar yoksa yedek değeri döndürür.",
    "ornek": "yazdır(varsayılanAl({\"a\": 1}, \"b\", 9))  # 9",
    "minArg": 3,
    "maxArg": 3
  },
  {
    "ad": "sözlükMü",
    "kategori": "Sözlük",
    "imza": "sözlükMü(değer)",
    "aciklama": "Değer düz bir sözlük mü?",
    "ornek": "yazdır(sözlükMü({\"a\": 1}))  # Doğru",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "boşSözlükMü",
    "kategori": "Sözlük",
    "imza": "boşSözlükMü(sözlük)",
    "aciklama": "Sözlük boş mu?",
    "ornek": "yazdır(boşSözlükMü(sözlük()))  # Doğru",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "anahtarlaraGöreSırala",
    "kategori": "Sözlük",
    "imza": "anahtarlaraGöreSırala(sözlük)",
    "aciklama": "Sözlüğü anahtarlara göre alfabetik sıralar.",
    "ornek": "yazdır(anahtarlaraGöreSırala({\"b\": 2, \"a\": 1}))  # { a: 1, b: 2 }",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "değereGöreSırala",
    "kategori": "Sözlük",
    "imza": "değereGöreSırala(sözlük)",
    "aciklama": "Sözlüğü değerlere göre sıralar.",
    "ornek": "yazdır(değereGöreSırala({\"a\": 3, \"b\": 1}))  # { b: 1, a: 3 }",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "derinKopya",
    "kategori": "Sözlük",
    "imza": "derinKopya(değer)",
    "aciklama": "Liste/sözlük değerinin iç içe tam kopyasını üretir.",
    "ornek": "değişken a := {\"x\": [1, 2]}\ndeğişken b := derinKopya(a)\nyazdır(b)  # { x: [1, 2] }",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "mantıksala",
    "kategori": "Tip",
    "imza": "mantıksala(değer)",
    "aciklama": "Değeri Doğru/Yanlış değerine çevirir.",
    "ornek": "yazdır(mantıksala(1))    # Doğru\nyazdır(mantıksala(\"\"))   # Yanlış",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "listeye",
    "kategori": "Tip",
    "imza": "listeye(değer)",
    "aciklama": "Metni, kümeyi, aralığı veya sözlüğü listeye çevirir.",
    "ornek": "yazdır(listeye(\"abc\"))          # [a, b, c]\nyazdır(listeye(aralık(1, 4)))  # [1, 2, 3]",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "sözlüğe",
    "kategori": "Tip",
    "imza": "sözlüğe(değer)",
    "aciklama": "Girdi listesini ([anahtar, değer]) sözlüğe çevirir.",
    "ornek": "yazdır(sözlüğe([[\"a\", 1], [\"b\", 2]]))  # { a: 1, b: 2 }",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "tanımsızMı",
    "kategori": "Tip",
    "imza": "tanımsızMı(değer)",
    "aciklama": "Değer Boş (tanımsız) mu?",
    "ornek": "yazdır(tanımsızMı(Boş))  # Doğru",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "boşMu",
    "kategori": "Tip",
    "imza": "boşMu(değer)",
    "aciklama": "Değer boş mu? (Boş, 0, \"\", [], {}, boş küme)",
    "ornek": "yazdır(boşMu(\"\"))    # Doğru\nyazdır(boşMu([1]))  # Yanlış",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "varsayılan",
    "kategori": "Tip",
    "imza": "varsayılan(değer, yedek)",
    "aciklama": "Değer boşsa (Boş, \"\", [], {}) yedeği döndürür.",
    "ornek": "yazdır(varsayılan(Boş, 5))  # 5\nyazdır(varsayılan(\"x\", 5))  # x",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "yazdırılabilir",
    "kategori": "Tip",
    "imza": "yazdırılabilir(değer)",
    "aciklama": "Değeri okunabilir (girintili JSON) metne çevirir.",
    "ornek": "yazdır(yazdırılabilir({\"a\": 1}))",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "kopyala",
    "kategori": "Tip",
    "imza": "kopyala(değer)",
    "aciklama": "Liste/sözlük değerinin derin kopyasını üretir.",
    "ornek": "değişken a := [1, [2]]\ndeğişken b := kopyala(a)\nyazdır(b)  # [1, [2]]",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "şimdi",
    "kategori": "Tarih",
    "imza": "şimdi()",
    "aciklama": "Şu anki saati SS:DD:SS biçiminde döndürür.",
    "ornek": "yazdır(şimdi())  # 14:35:07",
    "minArg": 0,
    "maxArg": 0
  },
  {
    "ad": "şimdiMs",
    "kategori": "Tarih",
    "imza": "şimdiMs()",
    "aciklama": "Unix zaman damgasını milisaniye olarak döndürür.",
    "ornek": "yazdır(şimdiMs() > 0)  # Doğru",
    "minArg": 0,
    "maxArg": 0
  },
  {
    "ad": "bugün",
    "kategori": "Tarih",
    "imza": "bugün()",
    "aciklama": "Bugünün tarihini GG.AA.YYYY biçiminde döndürür.",
    "ornek": "yazdır(bugün())  # 17.10.2026",
    "minArg": 0,
    "maxArg": 0
  },
  {
    "ad": "tarihSaati",
    "kategori": "Tarih",
    "imza": "tarihSaati()",
    "aciklama": "Tarih ve saati birlikte döndürür.",
    "ornek": "yazdır(tarihSaati())  # 17.10.2026 14:35:07",
    "minArg": 0,
    "maxArg": 0
  },
  {
    "ad": "yıl",
    "kategori": "Tarih",
    "imza": "yıl()",
    "aciklama": "İçinde bulunulan yılı döndürür.",
    "ornek": "yazdır(yıl())  # 2026",
    "minArg": 0,
    "maxArg": 0
  },
  {
    "ad": "ay",
    "kategori": "Tarih",
    "imza": "ay()",
    "aciklama": "İçinde bulunulan ayı döndürür (1-12).",
    "ornek": "yazdır(ay())  # 10",
    "minArg": 0,
    "maxArg": 0
  },
  {
    "ad": "gün",
    "kategori": "Tarih",
    "imza": "gün()",
    "aciklama": "Ayın gününü döndürür.",
    "ornek": "yazdır(gün())  # 17",
    "minArg": 0,
    "maxArg": 0
  },
  {
    "ad": "saat",
    "kategori": "Tarih",
    "imza": "saat()",
    "aciklama": "Saati döndürür (0-23).",
    "ornek": "yazdır(saat())  # 14",
    "minArg": 0,
    "maxArg": 0
  },
  {
    "ad": "dakika",
    "kategori": "Tarih",
    "imza": "dakika()",
    "aciklama": "Dakikayı döndürür (0-59).",
    "ornek": "yazdır(dakika())  # 35",
    "minArg": 0,
    "maxArg": 0
  },
  {
    "ad": "saniye",
    "kategori": "Tarih",
    "imza": "saniye()",
    "aciklama": "Saniyeyi döndürür (0-59).",
    "ornek": "yazdır(saniye())  # 7",
    "minArg": 0,
    "maxArg": 0
  },
  {
    "ad": "haftanınGünü",
    "kategori": "Tarih",
    "imza": "haftanınGünü()",
    "aciklama": "Bugünün haftanın hangi günü olduğunu döndürür.",
    "ornek": "yazdır(haftanınGünü())  # Cuma",
    "minArg": 0,
    "maxArg": 0
  },
  {
    "ad": "yılınGünü",
    "kategori": "Tarih",
    "imza": "yılınGünü()",
    "aciklama": "Yılın kaçıncı günü olduğunu döndürür (1-366).",
    "ornek": "yazdır(yılınGünü())  # 290",
    "minArg": 0,
    "maxArg": 0
  },
  {
    "ad": "tarihEkle",
    "kategori": "Tarih",
    "imza": "tarihEkle(tarih, günSayısı)",
    "aciklama": "Tarihe belirtilen gün sayısını ekler.",
    "ornek": "yazdır(tarihEkle(\"01.01.2026\", 10))  # 11.01.2026",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "tarihFarkı",
    "kategori": "Tarih",
    "imza": "tarihFarkı(tarih1, tarih2)",
    "aciklama": "İki tarih arasındaki gün farkını döndürür (tarih2 - tarih1).",
    "ornek": "yazdır(tarihFarkı(\"01.01.2026\", \"11.01.2026\"))  # 10",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "yaşHesapla",
    "kategori": "Tarih",
    "imza": "yaşHesapla(doğumTarihi)",
    "aciklama": "Doğum tarihinden bugüne kadar geçen tam yıl sayısı.",
    "ornek": "yazdır(yaşHesapla(\"01.01.2000\"))  # yaş",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "tarihBiçimle",
    "kategori": "Tarih",
    "imza": "tarihBiçimle(tarih, desen)",
    "aciklama": "Tarihi desene göre biçimlendirir (yyyy, MM, dd, HH, mm, ss).",
    "ornek": "yazdır(tarihBiçimle(\"17.10.2026\", \"yyyy/MM/dd\"))  # 2026/10/17",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "tarihÇöz",
    "kategori": "Tarih",
    "imza": "tarihÇöz(metin)",
    "aciklama": "Tarih metnini çözüp GG.AA.YYYY biçiminde döndürür.",
    "ornek": "yazdır(tarihÇöz(\"17.10.2026\"))  # 17.10.2026",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "bekle",
    "kategori": "Tarih",
    "imza": "bekle(saniye)",
    "aciklama": "Programı belirtilen saniye kadar bekletir (uygulama donmaz).",
    "ornek": "bekle(1)  # 1 saniye bekler",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "süreÖlç",
    "kategori": "Tarih",
    "imza": "süreÖlç(fonksiyon)",
    "aciklama": "Fonksiyonun çalışma süresini milisaniye olarak ölçer.",
    "ornek": "değişken ms := süreÖlç(() => topla(1, 2))\nyazdır(ms >= 0)  # Doğru",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "uuid",
    "kategori": "Kodlama",
    "imza": "uuid()",
    "aciklama": "Benzersiz bir UUID (v4) üretir.",
    "ornek": "yazdır(uuid())  # 3f2b...-....",
    "minArg": 0,
    "maxArg": 0
  },
  {
    "ad": "kısaKimlik",
    "kategori": "Kodlama",
    "imza": "kısaKimlik(uzunluk := 8)",
    "aciklama": "URL güvenli kısa rastgele kimlik üretir.",
    "ornek": "yazdır(kısaKimlik(8))  # aB3xK9pQ",
    "minArg": 0,
    "maxArg": 1
  },
  {
    "ad": "özet",
    "kategori": "Kodlama",
    "imza": "özet(metin, algoritma := \"sha256\")",
    "aciklama": "Metnin karma özetini (hash) hex olarak döndürür.",
    "ornek": "yazdır(özet(\"abc\", \"sha256\"))\n# ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    "minArg": 1,
    "maxArg": 2
  },
  {
    "ad": "base64Kodla",
    "kategori": "Kodlama",
    "imza": "base64Kodla(metin)",
    "aciklama": "Metni Base64 biçimine çevirir.",
    "ornek": "yazdır(base64Kodla(\"merhaba\"))  # bWVyaGFiYQ==",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "base64Çöz",
    "kategori": "Kodlama",
    "imza": "base64Çöz(metin)",
    "aciklama": "Base64 metnini çözer.",
    "ornek": "yazdır(base64Çöz(\"bWVyaGFiYQ==\"))  # merhaba",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "hexKodla",
    "kategori": "Kodlama",
    "imza": "hexKodla(metin)",
    "aciklama": "Metni onaltılık (hex) biçime çevirir.",
    "ornek": "yazdır(hexKodla(\"A\"))  # 41",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "hexÇöz",
    "kategori": "Kodlama",
    "imza": "hexÇöz(metin)",
    "aciklama": "Onaltılık metni çözer.",
    "ornek": "yazdır(hexÇöz(\"41\"))  # A",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "kontrolToplamı",
    "kategori": "Kodlama",
    "imza": "kontrolToplamı(metin)",
    "aciklama": "Metnin CRC32 kontrol toplamını döndürür.",
    "ornek": "yazdır(kontrolToplamı(\"abc\"))  # 891568578",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "karmaKod",
    "kategori": "Kodlama",
    "imza": "karmaKod(metin)",
    "aciklama": "Metinden sayısal bir karma kod üretir (djb2).",
    "ornek": "yazdır(karmaKod(\"abc\"))  # 193485963",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "güvenliRastgele",
    "kategori": "Kodlama",
    "imza": "güvenliRastgele(alt, üst)",
    "aciklama": "Kriptografik olarak güvenli rastgele tam sayı üretir.",
    "ornek": "yazdır(güvenliRastgele(1, 10))  # 1-10 arası",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "şifreÜret",
    "kategori": "Kodlama",
    "imza": "şifreÜret(uzunluk := 12)",
    "aciklama": "Harf, rakam ve sembol içeren güçlü rastgele şifre üretir.",
    "ornek": "yazdır(şifreÜret(12))",
    "minArg": 0,
    "maxArg": 1
  },
  {
    "ad": "jsonKodla",
    "kategori": "Kodlama",
    "imza": "jsonKodla(değer)",
    "aciklama": "Değeri JSON metnine çevirir.",
    "ornek": "yazdır(jsonKodla([1, 2, 3]))  # [1,2,3]",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "jsonÇöz",
    "kategori": "Kodlama",
    "imza": "jsonÇöz(metin)",
    "aciklama": "JSON metnini değere çevirir.",
    "ornek": "yazdır(jsonÇöz(\"[1, 2, 3]\"))  # [1, 2, 3]",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "csvAyrıştır",
    "kategori": "Kodlama",
    "imza": "csvAyrıştır(metin)",
    "aciklama": "CSV metnini satır ve alan listesine çevirir.",
    "ornek": "yazdır(csvAyrıştır(\"a,b\nc,d\"))  # [[a, b], [c, d]]",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "csvOluştur",
    "kategori": "Kodlama",
    "imza": "csvOluştur(satırlar)",
    "aciklama": "Satır listesinden CSV metni üretir.",
    "ornek": "yazdır(csvOluştur([[\"a\", \"b\"], [\"c\", \"d\"]]))  # a,b\\nc,d",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "epostaMı",
    "kategori": "Doğrulama",
    "imza": "epostaMı(metin)",
    "aciklama": "Metin geçerli bir e-posta adresi mi?",
    "ornek": "yazdır(epostaMı(\"a@b.com\"))  # Doğru",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "urlMi",
    "kategori": "Doğrulama",
    "imza": "urlMi(metin)",
    "aciklama": "Metin geçerli bir http/https adresi mi?",
    "ornek": "yazdır(urlMi(\"https://ornek.com\"))  # Doğru",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "şifreGücü",
    "kategori": "Doğrulama",
    "imza": "şifreGücü(metin)",
    "aciklama": "Şifre gücünü 0-4 arası puanlar (uzunluk, büyük/küçük harf, rakam, sembol).",
    "ornek": "yazdır(şifreGücü(\"Abc12345!\"))  # 4",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "telefonMı",
    "kategori": "Doğrulama",
    "imza": "telefonMı(metin)",
    "aciklama": "Metin Türkiye telefon numarası biçiminde mi?",
    "ornek": "yazdır(telefonMı(\"05551234567\"))  # Doğru",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "tcknMı",
    "kategori": "Doğrulama",
    "imza": "tcknMı(metin)",
    "aciklama": "Metin geçerli bir T.C. kimlik numarası mı?",
    "ornek": "yazdır(tcknMı(\"10000000146\"))  # Doğru",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "ibanMı",
    "kategori": "Doğrulama",
    "imza": "ibanMı(metin)",
    "aciklama": "Metin geçerli bir TR IBAN mı? (mod-97 doğrulaması)",
    "ornek": "yazdır(ibanMı(\"TR330006100519786457841326\"))  # Doğru",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "postaKoduMı",
    "kategori": "Doğrulama",
    "imza": "postaKoduMı(metin)",
    "aciklama": "Metin 5 haneli posta kodu mu?",
    "ornek": "yazdır(postaKoduMı(\"34000\"))  # Doğru",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "kullanıcıAdıMı",
    "kategori": "Doğrulama",
    "imza": "kullanıcıAdıMı(metin)",
    "aciklama": "Metin 3-20 karakterlik geçerli kullanıcı adı mı?",
    "ornek": "yazdır(kullanıcıAdıMı(\"ali_123\"))  # Doğru",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "jsonMı",
    "kategori": "Doğrulama",
    "imza": "jsonMı(metin)",
    "aciklama": "Metin geçerli JSON mu?",
    "ornek": "yazdır(jsonMı(\"[1, 2, 3]\"))  # Doğru",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "tarihMı",
    "kategori": "Doğrulama",
    "imza": "tarihMı(metin)",
    "aciklama": "Metin geçerli bir GG.AA.YYYY tarihi mi?",
    "ornek": "yazdır(tarihMı(\"31.02.2026\"))  # Yanlış\nyazdır(tarihMı(\"17.10.2026\"))  # Doğru",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "hataYazdır",
    "kategori": "Konsol",
    "imza": "hataYazdır(değer1, ...)",
    "aciklama": "Çıktıya hata satırı yazar.",
    "ornek": "hataYazdır(\"Dosya bulunamadı\")  # ❌ Dosya bulunamadı",
    "minArg": 1,
    "maxArg": 99
  },
  {
    "ad": "uyarıYazdır",
    "kategori": "Konsol",
    "imza": "uyarıYazdır(değer1, ...)",
    "aciklama": "Çıktıya uyarı satırı yazar.",
    "ornek": "uyarıYazdır(\"Dikkat!\")  # ⚠️ Dikkat!",
    "minArg": 1,
    "maxArg": 99
  },
  {
    "ad": "bilgiYazdır",
    "kategori": "Konsol",
    "imza": "bilgiYazdır(değer1, ...)",
    "aciklama": "Çıktıya bilgi satırı yazar.",
    "ornek": "bilgiYazdır(\"İşlem tamam\")  # ℹ️ İşlem tamam",
    "minArg": 1,
    "maxArg": 99
  },
  {
    "ad": "temizleEkran",
    "kategori": "Konsol",
    "imza": "temizleEkran()",
    "aciklama": "Terminal çıktısını temizler.",
    "ornek": "temizleEkran()",
    "minArg": 0,
    "maxArg": 0
  },
  {
    "ad": "oku",
    "kategori": "Konsol",
    "imza": "oku(soru := \"\")",
    "aciklama": "Kullanıcıdan girdi alır (iste gibi programı duraklatır).",
    "ornek": "değişken ad := oku(\"Adınız: \")\nyazdır(\"Merhaba \" + ad)",
    "minArg": 0,
    "maxArg": 1
  },
  {
    "ad": "onayla",
    "kategori": "Konsol",
    "imza": "onayla(soru)",
    "aciklama": "Kullanıcıya e/h sorusu sorar; Doğru/Yanlış döndürür.",
    "ornek": "eğer onayla(\"Devam edilsin mi?\") ise\n  yazdır(\"devam\")\nson",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "seçenekSor",
    "kategori": "Konsol",
    "imza": "seçenekSor(soru, seçenekler)",
    "aciklama": "Numaralı seçenekler sunar ve seçilen elemanı döndürür.",
    "ornek": "değişken renk := seçenekSor(\"Renk?\", [\"kırmızı\", \"mavi\"])",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "ilerleme",
    "kategori": "Konsol",
    "imza": "ilerleme(yüzde)",
    "aciklama": "Terminale yüzde çubuğu yazar.",
    "ornek": "ilerleme(50)  # [██████████░░░░░░░░░░] %50",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "başlıkAyarla",
    "kategori": "Konsol",
    "imza": "başlıkAyarla(metin)",
    "aciklama": "Pencere başlığını değiştirir.",
    "ornek": "başlıkAyarla(\"Hesap Makinesi\")",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "çık",
    "kategori": "Akış",
    "imza": "çık()",
    "aciklama": "Programı hemen sonlandırır.",
    "ornek": "yazdır(\"a\")\nçık()\nyazdır(\"b\")  # b yazılmaz",
    "minArg": 0,
    "maxArg": 1
  },
  {
    "ad": "hataFırlat",
    "kategori": "Akış",
    "imza": "hataFırlat(mesaj)",
    "aciklama": "Hata fırlatır (dene/yakala ile yakalanabilir).",
    "ornek": "dene\n  hataFırlat(\"bir sorun\")\nyakala hata\n  yazdır(hata)\nson",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "doğrula",
    "kategori": "Akış",
    "imza": "doğrula(koşul, mesaj := \"Doğrulama başarısız.\")",
    "aciklama": "Koşul doğru değilse hata fırlatır.",
    "ornek": "doğrula(5 > 3)\ndoğrula(1 > 2, \"1, 2den büyük olamaz\")",
    "minArg": 1,
    "maxArg": 2
  },
  {
    "ad": "çağır",
    "kategori": "Akış",
    "imza": "çağır(fonksiyon, ...argümanlar)",
    "aciklama": "Bir fonksiyonu verilen argümanlarla çağırır.",
    "ornek": "fonksiyon kare(x)\n  geri_döndür x * x\nson\nyazdır(çağır(kare, 4))  # 16",
    "minArg": 1,
    "maxArg": 99
  },
  {
    "ad": "uygula",
    "kategori": "Akış",
    "imza": "uygula(fonksiyon, argümanListesi)",
    "aciklama": "Fonksiyonu bir liste argümanla çağırır.",
    "ornek": "fonksiyon topla(a, b)\n  geri_döndür a + b\nson\nyazdır(uygula(topla, [2, 3]))  # 5",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "komutlar",
    "kategori": "Akış",
    "imza": "komutlar(filtre := \"\")",
    "aciklama": "Yerleşik komut adlarını listeler; filtre verilirse ada göre süzer.",
    "ornek": "yazdır(komutlar(\"harf\"))  # harf içeren komutlar",
    "minArg": 0,
    "maxArg": 1
  },
  {
    "ad": "sürüm",
    "kategori": "Akış",
    "imza": "sürüm()",
    "aciklama": "Türkod Studio sürümünü döndürür.",
    "ornek": "yazdır(sürüm())  # 1.6.0",
    "minArg": 0,
    "maxArg": 0
  },
  {
    "ad": "dosyaOku",
    "kategori": "Sistem",
    "imza": "dosyaOku(yol)",
    "aciklama": "Proje klasöründeki bir metin dosyasını UTF-8 olarak okur.",
    "ornek": "yazdır(dosyaOku(\"veri.txt\"))",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "dosyaYaz",
    "kategori": "Sistem",
    "imza": "dosyaYaz(yol, içerik)",
    "aciklama": "Dosyaya yazar (varsa üzerine yazar, yoksa oluşturur).",
    "ornek": "dosyaYaz(\"not.txt\", \"merhaba\")",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "dosyaEkle",
    "kategori": "Sistem",
    "imza": "dosyaEkle(yol, içerik)",
    "aciklama": "Dosyanın sonuna ekler (yoksa oluşturur).",
    "ornek": "dosyaEkle(\"not.txt\", \"\\ndünya\")",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "dosyaVarMı",
    "kategori": "Sistem",
    "imza": "dosyaVarMı(yol)",
    "aciklama": "Dosya var mı?",
    "ornek": "yazdır(dosyaVarMı(\"not.txt\"))  # Doğru",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "klasörVarMı",
    "kategori": "Sistem",
    "imza": "klasörVarMı(yol)",
    "aciklama": "Klasör var mı?",
    "ornek": "yazdır(klasörVarMı(\".\"))  # Doğru",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "klasörOluştur",
    "kategori": "Sistem",
    "imza": "klasörOluştur(yol)",
    "aciklama": "Klasör oluşturur (üst klasörler dahil).",
    "ornek": "klasörOluştur(\"veriler\")",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "dosyaSil",
    "kategori": "Sistem",
    "imza": "dosyaSil(yol)",
    "aciklama": "Dosyayı siler (klasör silmez).",
    "ornek": "dosyaSil(\"not.txt\")",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "dosyaBoyutu",
    "kategori": "Sistem",
    "imza": "dosyaBoyutu(yol)",
    "aciklama": "Dosyanın boyutunu bayt olarak döndürür.",
    "ornek": "yazdır(dosyaBoyutu(\"not.txt\"))  # 7",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "dosyaListesi",
    "kategori": "Sistem",
    "imza": "dosyaListesi(klasör := \".\")",
    "aciklama": "Klasördeki dosya ve klasör adlarını listeler.",
    "ornek": "yazdır(dosyaListesi())",
    "minArg": 0,
    "maxArg": 1
  },
  {
    "ad": "yolBirleştir",
    "kategori": "Sistem",
    "imza": "yolBirleştir(...parçalar)",
    "aciklama": "Yol parçalarını platforma uygun biçimde birleştirir.",
    "ornek": "yazdır(yolBirleştir(\"klasör\", \"dosya.txt\"))",
    "minArg": 1,
    "maxArg": 99
  },
  {
    "ad": "dosyaAdı",
    "kategori": "Sistem",
    "imza": "dosyaAdı(yol)",
    "aciklama": "Yoldan dosya adını çıkarır.",
    "ornek": "yazdır(dosyaAdı(\"a/b.txt\"))  # b.txt",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "uzantı",
    "kategori": "Sistem",
    "imza": "uzantı(yol)",
    "aciklama": "Dosya uzantısını (noktasız) döndürür.",
    "ornek": "yazdır(uzantı(\"a/b.txt\"))  # txt",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "klasörYolu",
    "kategori": "Sistem",
    "imza": "klasörYolu(yol)",
    "aciklama": "Yoldan klasör kısmını çıkarır.",
    "ornek": "yazdır(klasörYolu(\"a/b.txt\"))  # a",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "mutlakYol",
    "kategori": "Sistem",
    "imza": "mutlakYol(yol)",
    "aciklama": "Göreli yolu proje klasörüne göre tam yola çevirir.",
    "ornek": "yazdır(mutlakYol(\"veri.txt\"))",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "çalışmaKlasörü",
    "kategori": "Sistem",
    "imza": "çalışmaKlasörü()",
    "aciklama": "Aktif proje klasörünü döndürür.",
    "ornek": "yazdır(çalışmaKlasörü())",
    "minArg": 0,
    "maxArg": 0
  },
  {
    "ad": "ortamDeğişkeni",
    "kategori": "Sistem",
    "imza": "ortamDeğişkeni(ad)",
    "aciklama": "Ortam değişkeninin değerini döndürür (yoksa boş).",
    "ornek": "yazdır(ortamDeğişkeni(\"PATH\"))",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "platform",
    "kategori": "Sistem",
    "imza": "platform()",
    "aciklama": "İşletim sistemi adını döndürür (win32, darwin, linux).",
    "ornek": "yazdır(platform())  # win32",
    "minArg": 0,
    "maxArg": 0
  },
  {
    "ad": "kullanıcıAdı",
    "kategori": "Sistem",
    "imza": "kullanıcıAdı()",
    "aciklama": "Sistem kullanıcı adını döndürür.",
    "ornek": "yazdır(kullanıcıAdı())",
    "minArg": 0,
    "maxArg": 0
  },
  {
    "ad": "evKlasörü",
    "kategori": "Sistem",
    "imza": "evKlasörü()",
    "aciklama": "Kullanıcının ev klasörünü döndürür.",
    "ornek": "yazdır(evKlasörü())",
    "minArg": 0,
    "maxArg": 0
  },
  {
    "ad": "panoyaKopyala",
    "kategori": "Sistem",
    "imza": "panoyaKopyala(metin)",
    "aciklama": "Metni panoya kopyalar.",
    "ornek": "panoyaKopyala(\"merhaba\")",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "panodanOku",
    "kategori": "Sistem",
    "imza": "panodanOku()",
    "aciklama": "Pano içeriğini metin olarak döndürür.",
    "ornek": "yazdır(panodanOku())",
    "minArg": 0,
    "maxArg": 0
  },
  {
    "ad": "ExeIcon",
    "kategori": "Sistem",
    "imza": "ExeIcon(\"dosya.ico\")",
    "aciklama": "EXE üretiminde kullanılacak simge dosyasını belirler. Çalışma sırasında işlem yapmaz.",
    "ornek": "ExeIcon(\"ikon.ico\")",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "RastgeleSeç",
    "kategori": "Sayı",
    "imza": "RastgeleSeç(seçenek1, seçenek2, ...)",
    "aciklama": "Verilen seçenekler arasından rastgele birini seçer.",
    "ornek": "yazdır(RastgeleSeç(\"a\", \"b\", \"c\"))",
    "minArg": 1,
    "maxArg": 99
  },
  {
    "ad": "tür",
    "takmaAdlar": [
      "tur"
    ],
    "kategori": "Tip",
    "imza": "tür(değer)",
    "aciklama": "Değerin türünü metin olarak döndürür.",
    "ornek": "yazdır(tür(5))   # Sayı",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "tür_mü",
    "takmaAdlar": [
      "tur_mu"
    ],
    "kategori": "Tip",
    "imza": "tür_mü(değer, \"tür\")",
    "aciklama": "Değerin belirtilen türde olup olmadığını kontrol eder.",
    "ornek": "yazdır(tür_mü(5, \"Sayı\"))   # Doğru",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "sayıya",
    "takmaAdlar": [
      "sayiya"
    ],
    "kategori": "Tip",
    "imza": "sayıya(değer)",
    "aciklama": "Değeri sayıya çevirir.",
    "ornek": "yazdır(sayıya(\"42\"))   # 42",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "ondalıklıya",
    "takmaAdlar": [
      "ondalikliya"
    ],
    "kategori": "Tip",
    "imza": "ondalıklıya(değer)",
    "aciklama": "Değeri ondalıklı sayıya çevirir.",
    "ornek": "yazdır(ondalıklıya(\"3,14\"))",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "metne",
    "kategori": "Tip",
    "imza": "metne(değer)",
    "aciklama": "Değeri metne çevirir.",
    "ornek": "yazdır(metne(42))   # 42",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "küme",
    "takmaAdlar": [
      "kume"
    ],
    "kategori": "Tip",
    "imza": "küme(değerler)",
    "aciklama": "Küme oluşturur.",
    "ornek": "değişken s := küme([1, 2, 2, 3])",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "liste",
    "kategori": "Tip",
    "imza": "liste(kümeVeyaAralık)",
    "aciklama": "Kümeyi veya aralığı listeye çevirir.",
    "ornek": "yazdır(liste(aralık(1, 5)))",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "küme_birleşim",
    "takmaAdlar": [
      "kume_birlesim"
    ],
    "kategori": "Tip",
    "imza": "küme_birleşim(küme1, küme2)",
    "aciklama": "İki kümenin birleşimini döndürür.",
    "ornek": "yazdır(küme_birleşim(küme([1, 2]), küme([2, 3])))",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "küme_kesişim",
    "takmaAdlar": [
      "kume_kesisim"
    ],
    "kategori": "Tip",
    "imza": "küme_kesişim(küme1, küme2)",
    "aciklama": "İki kümenin kesişimini döndürür.",
    "ornek": "yazdır(küme_kesişim(küme([1, 2]), küme([2, 3])))",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "küme_fark",
    "takmaAdlar": [
      "kume_fark"
    ],
    "kategori": "Tip",
    "imza": "küme_fark(küme1, küme2)",
    "aciklama": "İki kümenin farkını döndürür.",
    "ornek": "yazdır(küme_fark(küme([1, 2]), küme([2, 3])))",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "küme_alt_mı",
    "takmaAdlar": [
      "kume_alt_mi"
    ],
    "kategori": "Tip",
    "imza": "küme_alt_mı(küme1, küme2)",
    "aciklama": "Birinci kümenin ikincinin alt kümesi olup olmadığını kontrol eder.",
    "ornek": "yazdır(küme_alt_mı(küme([1]), küme([1, 2])))",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "aralık",
    "takmaAdlar": [
      "aralik"
    ],
    "kategori": "Sayı",
    "imza": "aralık(başlangıç, bitiş)",
    "aciklama": "Sayı aralığı oluşturur.",
    "ornek": "yazdır(aralık(1, 5))",
    "minArg": 2,
    "maxArg": 2
  },
  {
    "ad": "aralık_to_liste",
    "takmaAdlar": [
      "aralik_to_liste"
    ],
    "kategori": "Sayı",
    "imza": "aralık_to_liste(aralık)",
    "aciklama": "Sayı aralığını listeye çevirir.",
    "ornek": "yazdır(aralık_to_liste(aralık(1, 5)))",
    "minArg": 1,
    "maxArg": 1
  },
  {
    "ad": "webİste",
    "takmaAdlar": [
      "httpİste"
    ],
    "kategori": "Web",
    "imza": "webİste(adres, yöntem := \"GET\", gövde := \"\", başlıklar := {})",
    "aciklama": "İnternete istek atıp yanıtı sözlük olarak döndürür (durum, başarılı, metin, başlıklar).",
    "ornek": "yanit := webİste(\"https://ornek.com/veri.json\")\neğer yanit.başarılı\n\tyazdır(yanit.metin)\nson",
    "minArg": 1,
    "maxArg": 4
  },


];
