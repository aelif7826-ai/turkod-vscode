const assert = require('node:assert');
const { MasaustuPencereSunucusu } = require('../out/turkuiPenceresi');

const SAYFA =
  '<!DOCTYPE html><html lang="tr"><body><div id="turkui-root"></div>' +
  '<script nonce="abc">/* ana betik */</script></body></html>';

(async () => {
  const mesajlar = [];
  let kapanan = null;
  const sunucu = new MasaustuPencereSunucusu(
    {
      html: () => SAYFA,
      mesaj: (pencereId, mesaj) => mesajlar.push({ pencereId, mesaj }),
      kapandi: (pencereId) => {
        kapanan = pencereId;
      },
      hata: (mesaj) => {
        throw new Error(mesaj);
      },
    },
    'C:/sahte/tarayici.exe'
  );

  await sunucu.baslat();
  const hedef = sunucu.pencereOlustur('p1', 'Deneme', { genişlik: 500, yükseklik: 400 });
  const temel = sunucu.adres('p1');
  assert.ok(temel.startsWith('http://127.0.0.1:'), 'yerel adres üretilmeli');

  // Sayfa sunulur ve webview köprüsü ana betikten önce eklenir.
  const yanit = await fetch(temel);
  assert.strictEqual(yanit.status, 200, 'pencere sayfası 200 dönmeli');
  assert.ok(yanit.headers.get('content-type').includes('text/html'));
  const html = await yanit.text();
  assert.ok(html.includes('acquireVsCodeApi'), 'köprü betiği eklenmeli');
  assert.ok(html.includes('<script nonce="abc">'), 'özgün sayfa korunmalı');
  assert.ok(
    html.indexOf('acquireVsCodeApi') < html.indexOf('/* ana betik */'),
    'köprü ana betikten önce gelmeli'
  );

  // Rastgele jeton olmadan erişilemez.
  const yanlis = await fetch(temel.replace(/\/[0-9a-f]{24}\//, '/000000000000000000000000/'));
  assert.strictEqual(yanlis.status, 404, 'geçersiz jeton reddedilmeli');

  // Sunucu → pencere (SSE).
  // Sayfa bağlanmadan gönderilen mesaj sıraya alınmalı, bağlanınca iletilmeli.
  hedef.gonder({ channel: 'onceden', data: { sira: 1 } });
  const denetleyici = new AbortController();
  const sse = await fetch(`${temel}olaylar`, { signal: denetleyici.signal });
  assert.strictEqual(sse.status, 200);
  assert.ok(sse.headers.get('content-type').includes('text/event-stream'));
  const okuyucu = sse.body.getReader();
  let tampon = '';
  while (!tampon.includes('"onceden"')) {
    const { value, done } = await okuyucu.read();
    if (done) break;
    tampon += Buffer.from(value).toString('utf8');
  }
  assert.ok(tampon.includes('"sira":1'), 'bağlantı öncesi mesaj sıraya alınmalı');
  await new Promise((r) => setTimeout(r, 20));
  hedef.gonder({ channel: 'deneme', data: { deger: 1 } });
  tampon = '';
  while (!tampon.includes('data:')) {
    const { value, done } = await okuyucu.read();
    if (done) break;
    tampon += Buffer.from(value).toString('utf8');
  }
  assert.ok(tampon.includes('"channel":"deneme"'), 'sunucu mesajı pencereye ulaşmalı');
  assert.ok(tampon.includes('"deger":1'), 'mesaj verisi korunmalı');
  denetleyici.abort();

  // Pencere → sunucu.
  const postalama = await fetch(`${temel}mesaj`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel: 'turkui:hazir', data: { oturum: 'oturum-1' } }),
  });
  assert.strictEqual(postalama.status, 204, 'mesaj 204 ile onaylanmalı');
  await new Promise((r) => setTimeout(r, 50));
  assert.strictEqual(mesajlar.length, 1, 'pencere mesajı iletilmeli');
  assert.strictEqual(mesajlar[0].pencereId, 'p1');
  assert.strictEqual(mesajlar[0].mesaj.channel, 'turkui:hazir');
  assert.strictEqual(mesajlar[0].mesaj.data.oturum, 'oturum-1');

  // Başlık değişimi ve kapatma.
  hedef.baslikAyarla('Yeni Başlık');
  hedef.kapat();
  assert.strictEqual(kapanan, 'p1', 'kapanış bildirilmeli');
  const kapali = await fetch(temel);
  assert.strictEqual(kapali.status, 404, 'kapanan pencereye erişilememeli');

  sunucu.dispose();
  console.log('turkui masaüstü pencere testleri geçti');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
