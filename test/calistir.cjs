const fs = require('node:fs');
const path = require('node:path');
const { TurkodYorumlayici } = require('../out/calistir');

async function main() {
  const dosya = process.argv[2] || 'test/temel.tr';
  const kaynak = fs.readFileSync(dosya, 'utf8');
  const y = new TurkodYorumlayici(kaynak, {
    yaz: (m) => process.stdout.write(m),
    oku: async (soru) => { process.stdout.write(soru); return process.env.TURKOD_GIRDI || ''; },
    klasor: path.dirname(path.resolve(dosya)),
    gercekGecikme: false,
    modulCoz: (ad) => {
      const aday = path.join(path.dirname(path.resolve(dosya)), ad + '.tr');
      return fs.existsSync(aday) ? aday : undefined;
    },
  });
  try {
    await y.calistir();
  } catch (e) {
    console.error('\nHATA:', e.message, e.satir ? `(satır ${e.satir})` : '');
    process.exitCode = 1;
  }
}
main();
