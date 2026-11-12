/** `içe_aktar` sonrasındaki modül yolunu ayrı renklendiren deseni ekler. */
const fs = require('node:fs');

const yol = 'syntaxes/turkod.tmLanguage.json';
const json = JSON.parse(fs.readFileSync(yol, 'utf8'));

const desenler = json.patterns;
if (!desenler.some((d) => d.include === '#import-module')) {
  const yer = desenler.findIndex((d) => d.include === '#keyword-storage');
  desenler.splice(yer < 0 ? desenler.length : yer, 0, { include: '#import-module' });
}

json.repository['import-module'] = {
  match: '(\\biçe_aktar\\s+)("[^"]+"|\'[^\']+\'|[A-Za-z_ğüşıöçĞÜŞİÖÇ.][\\wğüşıöçĞÜŞİÖÇ./\\\\-]*)',
  captures: {
    1: { name: 'keyword.control.turkod' },
    2: { name: 'entity.name.namespace.turkod' },
  },
};

fs.writeFileSync(yol, `${JSON.stringify(json, null, 2)}\n`, 'utf8');
console.log('sözdizimi güncellendi');
