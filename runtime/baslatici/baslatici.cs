// TürkUI tek dosya (.exe) başlatıcısı.
//
// Bu küçük program, kendi sonuna eklenmiş ZIP arşivini bulur; uygulamayı
// %LOCALAPPDATA%\TürkUI\Uygulamalar\<özet> klasörüne bir kez açar ve içindeki
// .exe dosyasını başlatır. Böylece dağıtılan tek bir dosya yeterli olur.
//
// Arşiv biçimi (src/uygulamaSfx.ts ile üretilir):
//   [bu .exe] [zip verisi] [40 baytlık kuyruk]
// Kuyruk: "TRKDSFX1" (8) + SHA-256'nın ilk 16 baytı + zip başlangıcı (8)
//         + zip uzunluğu (8) — tüm sayılar küçük endian (LE).

using System;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;

[assembly: AssemblyTitle("TürkUI Uygulaması")]
[assembly: AssemblyDescription("TürkUI tek dosya uygulama başlatıcısı")]
[assembly: AssemblyProduct("TürkUI")]
[assembly: AssemblyCompany("Türkod")]
[assembly: AssemblyVersion("1.0.0.0")]
[assembly: AssemblyFileVersion("1.0.0.0")]

namespace Turkod.Sfx
{
    internal static class Program
    {
        private const string Imza = "TRKDSFX1";
        private const int KuyrukBoyu = 40;
        private const uint MB_SIMGEHATA = 0x00000010;
        private const uint MB_USTTE = 0x00010000;

        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        private static extern int MessageBoxW(IntPtr pencere, string metin, string baslik, uint tur);

        [STAThread]
        private static int Main(string[] argumanlar)
        {
            try
            {
                string kendisi = Assembly.GetExecutingAssembly().Location;
                if (string.IsNullOrEmpty(kendisi) || !File.Exists(kendisi))
                {
                    throw new Exception("Başlatıcı dosyası bulunamadı.");
                }

                string uygulama = Hazirla(kendisi);

                ProcessStartInfo bilgi = new ProcessStartInfo(uygulama);
                bilgi.WorkingDirectory = Path.GetDirectoryName(uygulama);
                bilgi.UseShellExecute = false;
                bilgi.Arguments = ArgumanlariBirlestir(argumanlar);
                Process.Start(bilgi);
                return 0;
            }
            catch (Exception hata)
            {
                MessageBoxW(
                    IntPtr.Zero,
                    "Uygulama başlatılamadı.\r\n\r\n" + hata.Message,
                    "TürkUI",
                    MB_SIMGEHATA | MB_USTTE
                );
                return 1;
            }
        }

        /// <summary>Arşivi (gerekirse) açar ve çalıştırılacak .exe yolunu döndürür.</summary>
        private static string Hazirla(string kendisi)
        {
            long zipBasi;
            long zipUzunlugu;
            string ozet;

            using (FileStream akis = new FileStream(kendisi, FileMode.Open, FileAccess.Read, FileShare.Read))
            {
                if (akis.Length < KuyrukBoyu + 64)
                {
                    throw new Exception("Dosya bozuk: çok küçük.");
                }

                akis.Seek(-KuyrukBoyu, SeekOrigin.End);
                byte[] kuyruk = new byte[KuyrukBoyu];
                OkuTam(akis, kuyruk, KuyrukBoyu);

                string imza = Encoding.ASCII.GetString(kuyruk, 0, 8);
                if (imza != Imza)
                {
                    throw new Exception("Dosya imzası geçersiz. Dosya eksik indirilmiş veya bozulmuş olabilir.");
                }

                ozet = BitConverter.ToString(kuyruk, 8, 16).Replace("-", string.Empty).ToLowerInvariant();
                zipBasi = BitConverter.ToInt64(kuyruk, 24);
                zipUzunlugu = BitConverter.ToInt64(kuyruk, 32);

                if (zipBasi <= 0 || zipUzunlugu <= 0 || zipBasi + zipUzunlugu > akis.Length)
                {
                    throw new Exception("Arşiv konumu geçersiz. Dosya bozulmuş olabilir.");
                }
            }

            string ad = Path.GetFileNameWithoutExtension(kendisi);
            foreach (char gecersiz in Path.GetInvalidFileNameChars())
            {
                ad = ad.Replace(gecersiz, '_');
            }

            if (ad.Trim().Length == 0)
            {
                ad = "Uygulama";
            }

            string kok = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "TürkUI",
                "Uygulamalar",
                ad.Trim()
            );
            string hedef = Path.Combine(kok, ozet);
            string isaret = Path.Combine(hedef, ".hazir");

            if (!File.Exists(isaret))
            {
                Ac(kendisi, kok, hedef, isaret, zipBasi, zipUzunlugu);
                EskileriTemizle(kok, hedef);
            }

            string[] adaylar = Directory.GetFiles(hedef, "*.exe", SearchOption.TopDirectoryOnly);
            if (adaylar.Length == 0)
            {
                throw new Exception("Arşivde çalıştırılabilir dosya bulunamadı.");
            }

            Array.Sort(adaylar, StringComparer.OrdinalIgnoreCase);
            return adaylar[0];
        }

        /// <summary>Arşivi geçici bir klasöre açar, sonra hedef klasöre taşır.</summary>
        private static void Ac(string kendisi, string kok, string hedef, string isaret, long zipBasi, long zipUzunlugu)
        {
            Directory.CreateDirectory(kok);

            string gecici = hedef + ".tmp-" + Process.GetCurrentProcess().Id;
            try
            {
                if (Directory.Exists(gecici))
                {
                    Directory.Delete(gecici, true);
                }
            }
            catch
            {
                /* eski geçici klasör silinemezse yeni bir ad kullanılır */
                gecici = hedef + ".tmp-" + Guid.NewGuid().ToString("N");
            }

            Directory.CreateDirectory(gecici);

            try
            {
                using (FileStream akis = new FileStream(kendisi, FileMode.Open, FileAccess.Read, FileShare.Read))
                using (AltAkim parca = new AltAkim(akis, zipBasi, zipUzunlugu))
                using (ZipArchive zip = new ZipArchive(parca, ZipArchiveMode.Read))
                {
                    string geciciTam = Path.GetFullPath(gecici);

                    foreach (ZipArchiveEntry girdi in zip.Entries)
                    {
                        string ad = girdi.FullName.Replace('\\', '/');
                        string yol = Path.GetFullPath(
                            Path.Combine(gecici, ad.Replace('/', Path.DirectorySeparatorChar))
                        );

                        // Arşiv dışına yazma girişimlerini (zip slip) engelle.
                        if (!yol.StartsWith(geciciTam, StringComparison.OrdinalIgnoreCase))
                        {
                            continue;
                        }

                        if (string.IsNullOrEmpty(girdi.Name))
                        {
                            Directory.CreateDirectory(yol);
                            continue;
                        }

                        Directory.CreateDirectory(Path.GetDirectoryName(yol));
                        using (Stream kaynakAkis = girdi.Open())
                        using (FileStream hedefAkis = new FileStream(yol, FileMode.Create, FileAccess.Write, FileShare.None))
                        {
                            kaynakAkis.CopyTo(hedefAkis, 81920);
                        }
                    }
                }

                File.WriteAllText(Path.Combine(gecici, ".hazir"), "1");

                if (Directory.Exists(hedef))
                {
                    try
                    {
                        Directory.Delete(hedef, true);
                    }
                    catch
                    {
                        /* kullanımda olabilir; aşağıdaki taşıma denenir */
                    }
                }

                try
                {
                    Directory.Move(gecici, hedef);
                }
                catch
                {
                    // Başka bir kopya aynı anda açmış olabilir.
                    if (!File.Exists(isaret))
                    {
                        throw;
                    }
                }
            }
            finally
            {
                try
                {
                    if (Directory.Exists(gecici))
                    {
                        Directory.Delete(gecici, true);
                    }
                }
                catch
                {
                    /* yok say */
                }
            }
        }

        /// <summary>
        /// Aynı uygulamanın eski sürüm klasörlerini siler.
        ///
        /// Çalışan bir kopyanın dosyaları kilitli olacağından önce çalışıp
        /// çalışmadığı denetlenir; klasör önce yeniden adlandırılır, sonra
        /// silinir. Böylece silme yarıda kalsa bile çalışan uygulama bozulmaz.
        /// </summary>
        private static void EskileriTemizle(string kok, string hedef)
        {
            try
            {
                string hedefTam = Path.GetFullPath(hedef).TrimEnd('\\');

                foreach (string klasor in Directory.GetDirectories(kok))
                {
                    if (Path.GetFileName(klasor).StartsWith(".sil-", StringComparison.OrdinalIgnoreCase))
                    {
                        SilmeyiDene(klasor);
                        continue;
                    }

                    if (string.Equals(Path.GetFullPath(klasor).TrimEnd('\\'), hedefTam, StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }

                    if (!File.Exists(Path.Combine(klasor, ".hazir")) || KilitliMi(klasor))
                    {
                        continue;
                    }

                    string yeni = klasor + ".sil-" + Guid.NewGuid().ToString("N");
                    try
                    {
                        Directory.Move(klasor, yeni);
                    }
                    catch
                    {
                        continue;
                    }

                    SilmeyiDene(yeni);
                }
            }
            catch
            {
                /* temizlik başarısız olsa da uygulama açılır */
            }
        }

        /// <summary>Klasördeki çalıştırılabilir dosyalar kullanımda mı?</summary>
        private static bool KilitliMi(string klasor)
        {
            foreach (string dosya in Directory.GetFiles(klasor, "*.exe", SearchOption.TopDirectoryOnly))
            {
                try
                {
                    using (new FileStream(dosya, FileMode.Open, FileAccess.ReadWrite, FileShare.None))
                    {
                    }
                }
                catch
                {
                    return true;
                }
            }

            return false;
        }

        private static void SilmeyiDene(string klasor)
        {
            try
            {
                Directory.Delete(klasor, true);
            }
            catch
            {
                /* kilitli dosya varsa sonraki açılışta yeniden denenir */
            }
        }

        private static string ArgumanlariBirlestir(string[] argumanlar)
        {
            if (argumanlar == null || argumanlar.Length == 0)
            {
                return string.Empty;
            }

            StringBuilder metin = new StringBuilder();
            foreach (string arguman in argumanlar)
            {
                if (metin.Length > 0)
                {
                    metin.Append(' ');
                }

                metin.Append('"').Append(arguman.Replace("\"", "\\\"")).Append('"');
            }

            return metin.ToString();
        }

        private static void OkuTam(Stream akis, byte[] tampon, int uzunluk)
        {
            int okunan = 0;
            while (okunan < uzunluk)
            {
                int parca = akis.Read(tampon, okunan, uzunluk - okunan);
                if (parca <= 0)
                {
                    throw new EndOfStreamException("Dosya beklenenden kısa.");
                }

                okunan += parca;
            }
        }

        /// <summary>Dosyanın yalnızca bir bölümünü gösteren, aranabilir akış.</summary>
        private sealed class AltAkim : Stream
        {
            private readonly Stream kaynak;
            private readonly long basi;
            private readonly long uzunlugu;
            private long konum;

            public AltAkim(Stream kaynak, long basi, long uzunlugu)
            {
                this.kaynak = kaynak;
                this.basi = basi;
                this.uzunlugu = uzunlugu;
            }

            public override bool CanRead
            {
                get { return true; }
            }

            public override bool CanSeek
            {
                get { return true; }
            }

            public override bool CanWrite
            {
                get { return false; }
            }

            public override long Length
            {
                get { return uzunlugu; }
            }

            public override long Position
            {
                get { return konum; }
                set { konum = value; }
            }

            public override int Read(byte[] tampon, int baslangic, int adet)
            {
                long kalan = uzunlugu - konum;
                if (kalan <= 0)
                {
                    return 0;
                }

                if (adet > kalan)
                {
                    adet = (int)kalan;
                }

                kaynak.Position = basi + konum;
                int okunan = kaynak.Read(tampon, baslangic, adet);
                if (okunan > 0)
                {
                    konum += okunan;
                }

                return okunan;
            }

            public override long Seek(long ofset, SeekOrigin nereden)
            {
                long yeni;
                switch (nereden)
                {
                    case SeekOrigin.Begin:
                        yeni = ofset;
                        break;
                    case SeekOrigin.Current:
                        yeni = konum + ofset;
                        break;
                    case SeekOrigin.End:
                        yeni = uzunlugu + ofset;
                        break;
                    default:
                        throw new ArgumentOutOfRangeException("nereden");
                }

                if (yeni < 0)
                {
                    throw new IOException("Geçersiz konum.");
                }

                konum = yeni;
                return konum;
            }

            public override void Flush()
            {
            }

            public override void SetLength(long deger)
            {
                throw new NotSupportedException();
            }

            public override void Write(byte[] tampon, int baslangic, int adet)
            {
                throw new NotSupportedException();
            }
        }
    }
}
