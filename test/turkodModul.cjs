const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

/**
 * `türkod yeni modül indir türküi` akışının çevrimdışı testleri.
 *
 * Gerçek %LOCALAPPDATA% klasörüne dokunmamak için modül kökü geçici bir
 * klasöre alınır; indirme hiç denenmez (ağ gerekmez).
 */
const gecici = fs.mkdtempSync(path.join(os.tmpdir(), 'turkod-modul-'));
process.env.TURKOD_MODUL_KLASORU = gecici;
delete process.env.TURKOD_ELECTRON;

const {
  VARSAYILAN_ELEKTRON_SURUMU,
  indirmeAdresleri,
  kuruluModuller,
  modulAdiCoz,
} = require('../out/turkuiIndirici');
const { electronKlasoruBul, electronKlasoruGecerliMi, electronModulKlasoru } = require('../out/uygulamaPaketleyici');
const { main } = require('../out/turkodCli');

function sessizCalistir(iste) {
  const yaz = process.stdout.write.bind(process.stdout);
  const hataYaz = process.stderr.write.bind(process.stderr);
  process.stdout.write = () => true;
  process.stderr.write = () => true;
  return Promise.resolve(iste()).finally(() => {
    process.stdout.write = yaz;
    process.stderr.write = hataYaz;
  });
}

async function calistir() {
  // 1) Modül adı çözümleme: Türkçe/İngilizce yazımlar aynı modüle gider.
  assert.equal(modulAdiCoz('türküi'), 'türküi');
  assert.equal(modulAdiCoz('turkui'), 'türküi');
  assert.equal(modulAdiCoz('türkui'), 'türküi');
  assert.equal(modulAdiCoz('TÜRKÜİ'), 'türküi');
  assert.equal(modulAdiCoz('electron'), 'türküi');
  assert.equal(modulAdiCoz('bilinmeyen'), undefined);
  assert.equal(modulAdiCoz(undefined), undefined);

  // 2) İndirme adresleri: GitHub + ayna, sürüm ve platform adı doğru.
  const adresler = indirmeAdresleri();
  assert.equal(adresler.length, 2);
  assert.ok(adresler[0].includes(`v${VARSAYILAN_ELEKTRON_SURUMU}/electron-v${VARSAYILAN_ELEKTRON_SURUMU}-`));
  assert.ok(adresler[0].startsWith('https://github.com/electron/electron/releases/download/'));
  assert.ok(adresler[1].startsWith('https://npmmirror.com/mirrors/electron/'));
  assert.ok(adresler.every((adres) => adres.endsWith('.zip')));

  // 3) Boş klasör geçerli Electron sayılmaz, modül listesi boş döner.
  const hedef = electronModulKlasoru('28.3.3');
  fs.mkdirSync(hedef, { recursive: true });
  assert.equal(electronKlasoruGecerliMi(hedef), false);
  assert.deepEqual(kuruluModuller(), []);

  // 4) Sahte bir Electron dağıtımı: modül klasörü otomatik bulunur.
  fs.writeFileSync(path.join(hedef, process.platform === 'win32' ? 'electron.exe' : 'electron'), '');
  fs.writeFileSync(path.join(hedef, 'resources.pak'), '');
  assert.equal(electronKlasoruGecerliMi(hedef), true);
  const bulunan = kuruluModuller();
  assert.equal(bulunan.length, 1);
  assert.equal(bulunan[0].surum, '28.3.3');
  assert.equal(electronKlasoruBul(), hedef);

  // 5) Komut satırı: kurulu modülü listeler.
  assert.equal(await sessizCalistir(() => main(['modül', 'liste'])), 0);
  assert.equal(await sessizCalistir(() => main(['yeni', 'modül', 'liste'])), 0);

  // 6) Komut satırı: bilinmeyen modül hata verir, ağa çıkmaz.
  assert.equal(await sessizCalistir(() => main(['yeni', 'modül', 'indir', 'bilinmeyen'])), 1);
  assert.equal(await sessizCalistir(() => main(['modül', 'indir'])), 1);

  // 7) Yardım ve sürüm çalışır.
  assert.equal(await sessizCalistir(() => main(['yardım'])), 0);
  assert.equal(await sessizCalistir(() => main(['sürüm'])), 0);

  fs.rmSync(gecici, { recursive: true, force: true });
  console.log('turkod modül testleri geçti ✔');
}

calistir().catch((hata) => {
  console.error(hata);
  process.exitCode = 1;
});
