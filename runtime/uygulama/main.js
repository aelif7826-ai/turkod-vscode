'use strict';

/**
 * Türkod masaüstü uygulaması çalışma zamanı.
 *
 * Bu dosya, `Türkod: Uygulama Olarak Paketle` komutuyla üretilen klasöre
 * kopyalanır. Electron ana süreci olarak çalışır: TürkUI pencerelerini açar,
 * yorumlayıcıyı (`out/calistir.js`) çalıştırır ve çıktı/girdi için kendi
 * konsol penceresini kullanır.
 */

const { app, BrowserWindow, Notification, dialog, ipcMain, screen } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const KOK = __dirname;

/** Hata ayıklama günlüğü (yalnızca TURKOD_DEBUG ortam değişkeni verildiğinde yazılır). */
function izle(mesaj) {
  if (!process.env.TURKOD_DEBUG) return;
  try {
    fs.appendFileSync(process.env.TURKOD_DEBUG, `${new Date().toISOString()} ${mesaj}\n`);
  } catch {
    /* yok say */
  }
}

/** Uygulamanın ayarları: hangi program çalıştırılacak (paketleme sırasında yazılır). */
const AYARLAR = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(KOK, 'uygulama.json'), 'utf8')) || {};
  } catch {
    return {};
  }
})();

const KAYNAK =
  process.env.TURKOD_KAYNAK && fs.existsSync(process.env.TURKOD_KAYNAK)
    ? process.env.TURKOD_KAYNAK
    : path.join(KOK, typeof AYARLAR.kaynak === 'string' ? AYARLAR.kaynak : 'kaynak.tr');
const IKON = path.join(KOK, 'ikon.ico');
/**
 * Göreli yolların (modüller, görseller) çözümlendiği klasör. VS Code'dan
 * çalıştırırken proje klasörü verilir; dağıtılan uygulamada programın yanıdır.
 */
const CALISMA_KLASORU =
  process.env.TURKOD_KLASOR && fs.existsSync(process.env.TURKOD_KLASOR)
    ? process.env.TURKOD_KLASOR
    : path.dirname(KAYNAK);
/**
 * `içe_aktar` yollarının çözümlendiği gerçek kaynak dosya. Paketlenen kopya
 * `resources/app/kaynak` altında olduğu için göreli yollar proje klasörüne
 * göre çözülsün diye ayrıca verilir.
 */
const GIRIS_DOSYASI =
  process.env.TURKOD_GIRIS && fs.existsSync(process.env.TURKOD_GIRIS)
    ? process.env.TURKOD_GIRIS
    : KAYNAK;

const { TurkodYorumlayici, modulDosyasiBul } = require('./out/calistir');
const { createTurkuiModulu } = require('./out/turkui');

/** Açık TürkUI pencereleri: pencereId -> durum. */
const pencereler = new Map();
/** webContents kimliği -> pencereId. */
const webIcerikleri = new Map();

let yorumlayici = null;
let programBitti = false;
let cikiyor = false;
let konsol = null;
let bekleyenGirdi = null;
let ciktiMetni = '';
let fare;
let klavye;

/* ---------------- yardımcılar ---------------- */

const RESIM_TURLERI = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

/**
 * Göreli bir varlık dosyasını (görsel, ses, simge...) arar.
 *
 * Uygulamanın giriş dosyası `src/` altında olabilir, varlıklar ise proje
 * kökünde (`uygulama.json` yanında) durabilir. Bu yüzden sırasıyla çalışma
 * klasörü, kaynak dosyanın klasörü ve üst klasörler denenir; `uygulama.json`
 * bulunan klasör proje kökü sayılır.
 */
function varlikYoluBul(deger) {
  const ham = String(deger || '').trim();
  if (!ham) return undefined;
  const koke = (k) => path.resolve(k, ham);
  const adaylar = [];
  const ekle = (k) => {
    if (!k) return;
    const tam = path.resolve(k);
    if (!adaylar.includes(tam)) adaylar.push(tam);
  };

  if (path.isAbsolute(ham)) {
    ekle(ham);
  } else {
    ekle(koke(CALISMA_KLASORU));
    ekle(koke(path.dirname(KAYNAK)));
    ekle(koke(path.dirname(GIRIS_DOSYASI)));
    let d = path.resolve(CALISMA_KLASORU);
    for (let i = 0; i < 8; i += 1) {
      ekle(koke(d));
      const ust = path.dirname(d);
      if (ust === d) break;
      d = ust;
    }
  }

  for (const aday of adaylar) {
    try {
      if (fs.existsSync(aday) && fs.statSync(aday).isFile()) return aday;
    } catch {
      /* yol okunamadı */
    }
  }
  return undefined;
}

/** Yerel görseli, sayfanın CSP'sinin izin verdiği data URI'ye çevirir. */
function resimVeriUri(yol) {
  const ham = String(yol || '').trim();
  if (!ham) return '';
  if (/^(data:|https?:|blob:)/i.test(ham)) return ham;
  const tam = varlikYoluBul(ham);
  if (!tam) return ham;
  try {
    const veri = fs.readFileSync(tam);
    const tur = RESIM_TURLERI[path.extname(tam).toLowerCase()] || 'application/octet-stream';
    return `data:${tur};base64,${veri.toString('base64')}`;
  } catch {
    return ham;
  }
}

function sayi(deger, varsayilan) {
  const n = Number(deger);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : varsayilan;
}

function olcu(deger) {
  if (deger === undefined || deger === null || deger === '') return undefined;
  const n = Number(deger);
  return Number.isFinite(n) ? Math.round(n) : undefined;
}

/** Pencere simgesi için geçerli dosya yolunu döndürür. */
function ikonYolu(deger) {
  const ham = String(deger || '').trim();
  if (!ham) return undefined;
  return varlikYoluBul(ham);
}

/** Tarayıcı adresini URL'ye çevirir; yerel dosya yollarını `file://` yapar. */
function webAdresCoz(deger) {
  const ham = String(deger || '').trim();
  if (!ham) return '';
  if (/^(https?:|data:|file:|blob:|about:)/i.test(ham)) return ham;
  const tam = varlikYoluBul(ham);
  if (tam) return pathToFileURL(tam).href;
  return ham;
}

/** Gömülü `<webview>` misafirlerini kısıtlar: düğüm erişimi ve preload yok. */
function webviewGuvenligi(win) {
  win.webContents.on('will-attach-webview', (olay, webPreferences, params) => {
    delete webPreferences.preload;
    webPreferences.nodeIntegration = false;
    webPreferences.nodeIntegrationInSubFrames = false;
    webPreferences.contextIsolation = true;
    webPreferences.sandbox = true;
    webPreferences.webSecurity = true;
    webPreferences.allowRunningInsecureContent = false;
    const adres = String(params.src || '').trim();
    if (adres && !/^(https?:|data:|file:|about:|blob:)/i.test(adres)) olay.preventDefault();
  });
  win.webContents.on('did-attach-webview', (_olay, misafir) => {
    try {
      misafir.setWindowOpenHandler(() => ({ action: 'deny' }));
      misafir.on('will-navigate', (olay, adres) => {
        if (!/^(https?:|data:|file:|about:|blob:|chrome-error:)/i.test(String(adres || ''))) {
          olay.preventDefault();
        }
      });
    } catch {
      /* misafir hazır değil */
    }
  });
}

/* ---------------- pencereye mesaj ---------------- */

/**
 * Tekilleştirilmemesi gereken sıralı bileşen komutları.
 *
 * `_addItem` / `_addTab` / `_setCell` gibi komutlar aynı özellik adını kullansa
 * da her çağrı ayrı bir işlemdir (liste öğesi ekle, hücre yaz...). Bunlar
 * "son değer kazanır" kuralıyla birleştirilirse önceki öğeler kaybolur.
 */
function siraliKomutMu(prop) {
  return (
    prop.startsWith('_add') ||
    prop.startsWith('_remove') ||
    prop.startsWith('_clear') ||
    prop.startsWith('_canvas') ||
    prop.startsWith('_web') ||
    prop.startsWith('_audio') ||
    prop.startsWith('_select') ||
    prop === '_setCell' ||
    prop === '_setHeaders'
  );
}

function gonder(pencereId, kanal, veri) {
  const durum = pencereler.get(pencereId);
  if (!durum) return;
  // Aynı bileşen özelliğinin eski güncellemesini tutmak yerine son değeri sakla.
  // Sıralı komutlar (öğe ekleme vb.) bu kuraldan muaftır.
  if (
    kanal === 'turkui:updateComponent' &&
    veri &&
    typeof veri.id === 'string' &&
    typeof veri.prop === 'string' &&
    !siraliKomutMu(veri.prop)
  ) {
    const eski = durum.gecmis.findIndex(
      (m) =>
        m.channel === kanal &&
        m.data &&
        m.data.id === veri.id &&
        m.data.prop === veri.prop
    );
    if (eski >= 0) durum.gecmis.splice(eski, 1);
  }
  durum.gecmis.push({ channel: kanal, data: veri });
  if (durum.gecmis.length > 5000) durum.gecmis.splice(0, durum.gecmis.length - 5000);
  if (!durum.hazir) return;
  if (!durum.win.isDestroyed()) durum.win.webContents.send('turkui:mesaj', { channel: kanal, data: veri });
}

function pencereMesaji(pencereId, ham) {
  if (!ham || typeof ham !== 'object') return;
  const kanal = ham.channel;
  const veri = ham.data || {};

  if (kanal === 'turkui:hazir') {
    const durum = pencereler.get(pencereId);
    if (!durum) return;
    const oturum = typeof veri.oturum === 'string' ? veri.oturum : '';
    if (durum.hazir && oturum && durum.oturum === oturum) return;
    durum.oturum = oturum || undefined;
    durum.hazir = true;
    for (const mesaj of durum.gecmis) {
      if (!durum.win.isDestroyed()) durum.win.webContents.send('turkui:mesaj', mesaj);
    }
    return;
  }

  if (kanal === 'turkui:event') {
    const bilesenId = String(veri.componentId || '');
    const olay = String(veri.eventName || '');
    if (!bilesenId || !olay) return;
    if (!yorumlayici) return;
    const ozellikler = veri.props && typeof veri.props === 'object' ? veri.props : undefined;
    yorumlayici.turkuiOlayTetikle(bilesenId, olay, ozellikler).catch((e) => hataYaz(e));
    return;
  }

  if (kanal === 'turkui:mouseState') {
    if (!fare) return;
    if (veri.x !== undefined) fare.x = veri.x;
    if (veri.y !== undefined) fare.y = veri.y;
    if (veri.solTık !== undefined) fare.solTık = veri.solTık;
    if (veri.sağTık !== undefined) fare.sağTık = veri.sağTık;
    if (veri.ortaTık !== undefined) fare.ortaTık = veri.ortaTık;
    if (veri.tekerlek !== undefined) fare.tekerlek = (Number(fare.tekerlek) || 0) + Number(veri.tekerlek);
    return;
  }

  if (kanal === 'turkui:keyState') {
    if (klavye && veri.tuş !== undefined) klavye.tuş = veri.tuş;
    return;
  }

  if (kanal === 'turkui:windowClose') {
    pencereKapat(pencereId);
    return;
  }

  if (kanal === 'turkui:windowMinimize' || kanal === 'turkui:windowMaximize' || kanal === 'turkui:windowUnmaximize') {
    const durum = pencereler.get(pencereId);
    if (!durum || durum.win.isDestroyed()) return;
    if (kanal === 'turkui:windowMinimize') durum.win.minimize();
    else if (kanal === 'turkui:windowMaximize') {
      if (durum.win.isMaximized()) durum.win.unmaximize();
      else durum.win.maximize();
    } else durum.win.unmaximize();
    return;
  }

  if (kanal === 'turkui:windowCenter') {
    pencereler.get(pencereId)?.win.center();
  }
}

/* ---------------- pencereler ---------------- */

function pencereOlustur(baslik, pencereId, props) {
  const mevcut = pencereler.get(pencereId);
  if (mevcut) {
    if (!mevcut.win.isDestroyed()) {
      mevcut.win.setTitle(String(props.başlık || baslik || mevcut.baslik || 'TürkUI'));
      mevcut.win.show();
      mevcut.win.focus();
    }
    return;
  }

  const p = props || {};
  const win = new BrowserWindow({
    width: sayi(p.genişlik || p.genislik, 820),
    height: sayi(p.yükseklik || p.yukseklik, 620),
    x: olcu(p.x),
    y: olcu(p.y),
    title: String(p.başlık || baslik || 'TürkUI'),
    icon: ikonYolu(p.ikon) || (fs.existsSync(IKON) ? IKON : undefined),
    show: false,
    frame: p.çerçevesiz !== true,
    resizable: p.boyutlandırılabilir !== false,
    alwaysOnTop: p.herZamanÜstte === true || p.üstte === true,
    minimizable: p.küçültülebilir !== false,
    maximizable: p.büyütülebilir !== false,
    closable: p.kapatılabilir !== false,
    fullscreen: p.tamEkran === true,
    backgroundColor: '#1e1e2e',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(KOK, 'preload.js'),
      contextIsolation: false,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false,
      backgroundThrottling: false,
      webviewTag: true,
    },
  });
  win.setMenu(null);
  webviewGuvenligi(win);
  if (p.minGenişlik || p.minYükseklik) {
    win.setMinimumSize(sayi(p.minGenişlik, 0), sayi(p.minYükseklik, 0));
  }
  if (p.maksGenişlik || p.maksYükseklik) {
    win.setMaximumSize(sayi(p.maksGenişlik, 0), sayi(p.maksYükseklik, 0));
  }
  if (p.şeffaflık !== undefined) {
    const oran = Number(p.şeffaflık);
    if (Number.isFinite(oran)) win.setOpacity(Math.min(1, Math.max(0.1, oran)));
  }

  const durum = {
    win,
    webIcerikId: win.webContents.id,
    baslik: String(p.başlık || baslik || 'TürkUI'),
    props: { ...p },
    hazir: false,
    oturum: undefined,
    gecmis: [],
    bilesenler: new Set(),
    gosterildi: false,
    propsGonderildi: false,
    acildiBildirildi: false,
  };
  pencereler.set(pencereId, durum);
  webIcerikleri.set(win.webContents.id, pencereId);

  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  // Pencere kendiliğinden kapanmasın: renderer çökerse pencereyi yok etmek
  // yerine içeriği yeniden yükle. Kullanıcı penceresi açık kalır.
  win.webContents.on('render-process-gone', (_olay, ayrinti) => {
    const sebep = (ayrinti && ayrinti.reason) || 'bilinmiyor';
    izle(`pencere render süreci çöktü: ${pencereId} sebep=${sebep}`);
    if (sebep === 'clean-exit' || win.isDestroyed()) return;
    setTimeout(() => {
      if (!win.isDestroyed() && !win.webContents.isDestroyed()) win.webContents.reload();
    }, 400);
  });
  win.on('unresponsive', () => izle(`pencere yanıt vermiyor: ${pencereId}`));
  win.on('responsive', () => izle(`pencere yeniden yanıt veriyor: ${pencereId}`));

  win.on('closed', () => {
    izle(`pencere kapandı: ${pencereId}`);
    webIcerikleri.delete(durum.webIcerikId);
    if (pencereler.get(pencereId) !== durum) return;
    pencereler.delete(pencereId);
    if (durum.acildiBildirildi && yorumlayici) {
      yorumlayici.turkuiOlayTetikle(pencereId, 'pencereKapatılırken').catch((e) => hataYaz(e));
    }
    izle(`kalan pencere: ${pencereler.size}, program bitti: ${programBitti}`);
    // Windows Forms davranışı: program bittiyse son pencere kapanınca uygulama kapanır.
    // Pencere yıkımı sürerken normal kapanış kilitlenebildiği için süreç doğrudan sonlandırılır.
    if (programBitti && pencereler.size === 0) {
      setImmediate(() => {
        izle('çıkılıyor (app.exit)');
        if (cikiyor) return;
        cikiyor = true;
        bekleyenGirdi = null;
        app.exit(0);
      });
      return;
    }
    belkiBitir();
  });

  win.loadFile(path.join(KOK, 'media', 'turkui-window.html'));
  return durum;
}

function pencereGoster(pencereId) {
  const durum = pencereler.get(pencereId);
  if (!durum || durum.win.isDestroyed()) return;
  if (!durum.propsGonderildi) {
    durum.propsGonderildi = true;
    pencerePropsGonder(pencereId, durum.props);
  }
  gonder(pencereId, 'turkui:updateComponent', { id: '', prop: '_show', value: true });
  durum.gosterildi = true;
  if (!durum.acildiBildirildi) {
    durum.acildiBildirildi = true;
    if (yorumlayici) yorumlayici.turkuiOlayTetikle(pencereId, 'pencereAçıldığında').catch((e) => hataYaz(e));
  }
  if (durum.win.isVisible()) {
    durum.win.focus();
  } else if (durum.win.webContents.isLoading()) {
    durum.win.once('ready-to-show', () => {
      if (!durum.win.isDestroyed()) durum.win.show();
    });
  } else {
    durum.win.show();
  }
}

function pencereKapat(pencereId) {
  const durum = pencereler.get(pencereId);
  if (!durum || durum.win.isDestroyed()) return;
  durum.win.close();
}

function hepsiniKapat() {
  for (const durum of [...pencereler.values()]) {
    try {
      if (!durum.win.isDestroyed()) durum.win.close();
    } catch {
      /* yok say */
    }
  }
}

function pencerePropsGonder(pencereId, props) {
  const gonderProp = (prop, deger) => gonder(pencereId, 'turkui:updateComponent', { id: '', prop, value: deger });
  gonderProp('_title', String(props.başlık || pencereler.get(pencereId)?.baslik || 'TürkUI'));
  const resim = String(props.arkaPlanResmi || '').trim();
  if (resim) gonderProp('_arkaPlanResmi', resimVeriUri(resim));
  if (props.açılışAnimasyonu !== undefined) gonderProp('_açılışAnimasyon', String(props.açılışAnimasyonu || ''));
  if (props.başlıkÇubuğu !== undefined) gonderProp('_başlıkÇubuğu', props.başlıkÇubuğu === true);
}

/* ---------------- bileşenler ---------------- */

function bilesenEkle(pencereId, tur, id, props) {
  const durum = pencereler.get(pencereId);
  if (!durum || durum.bilesenler.has(id)) return;
  durum.bilesenler.add(id);
  const kopya = { ...props };
  if (tur === 'image' && typeof kopya.kaynak === 'string') kopya.kaynak = resimVeriUri(kopya.kaynak);
  if (tur === 'audio' && typeof kopya.kaynak === 'string') kopya.kaynak = webAdresCoz(kopya.kaynak);
  if (tur === 'webBrowser' && typeof kopya.adres === 'string') kopya.adres = webAdresCoz(kopya.adres);
  gonder(pencereId, 'turkui:addComponent', { type: tur, id, props: kopya });
}

/** Pencere özelliğini çalışma anında uygular (oluşturulduktan sonra da). */
function pencereOzelligiUygula(durum, ozellik, deger) {
  if (!durum || !durum.win || durum.win.isDestroyed()) return;
  const win = durum.win;
  durum.props[ozellik] = deger;
  switch (ozellik) {
    case 'genişlik':
    case 'yükseklik':
    case 'x':
    case 'y': {
      const b = win.getBounds();
      const yeni = { x: b.x, y: b.y, width: b.width, height: b.height };
      if (ozellik === 'genişlik') yeni.width = sayi(deger, b.width);
      else if (ozellik === 'yükseklik') yeni.height = sayi(deger, b.height);
      else if (ozellik === 'x') yeni.x = olcu(deger) ?? b.x;
      else yeni.y = olcu(deger) ?? b.y;
      win.setBounds(yeni);
      break;
    }
    case 'minGenişlik':
      win.setMinimumSize(sayi(deger, 0), sayi(durum.props.minYükseklik, 0));
      break;
    case 'minYükseklik':
      win.setMinimumSize(sayi(durum.props.minGenişlik, 0), sayi(deger, 0));
      break;
    case 'maksGenişlik': {
      const g = Number(deger);
      if (Number.isFinite(g) && g > 0) win.setMaximumSize(Math.round(g), sayi(durum.props.maksYükseklik, 0));
      break;
    }
    case 'maksYükseklik': {
      const y = Number(deger);
      if (Number.isFinite(y) && y > 0) win.setMaximumSize(sayi(durum.props.maksGenişlik, 0), Math.round(y));
      break;
    }
    case 'şeffaflık': {
      const oran = Number(deger);
      if (Number.isFinite(oran)) win.setOpacity(Math.min(1, Math.max(0.1, oran)));
      break;
    }
    case 'herZamanÜstte':
    case 'üstte':
      win.setAlwaysOnTop(deger === true);
      break;
    case 'tamEkran':
      win.setFullScreen(deger === true);
      break;
    case 'boyutlandırılabilir':
      win.setResizable(deger !== false);
      break;
    case 'küçültülebilir':
      win.setMinimizable(deger !== false);
      break;
    case 'büyütülebilir':
      win.setMaximizable(deger !== false);
      break;
    case 'kapatılabilir':
      win.setClosable(deger !== false);
      break;
    case 'ikon': {
      const yol = ikonYolu(deger);
      if (yol) {
        try {
          win.setIcon(yol);
        } catch {
          /* simge atanamadı */
        }
      }
      break;
    }
    default:
      break;
  }
}

function bilesenGuncelle(pencereId, id, ozellik, deger) {
  if (id === '') {
    const durum = pencereler.get(pencereId);
    switch (ozellik) {
      case '_title':
      case 'başlık': {
        const baslik = String(deger ?? '');
        if (durum) {
          durum.baslik = baslik;
          if (!durum.win.isDestroyed()) durum.win.setTitle(baslik);
        }
        gonder(pencereId, 'turkui:updateComponent', { id: '', prop: '_title', value: baslik });
        return;
      }
      case 'arkaPlanResmi':
        gonder(pencereId, 'turkui:updateComponent', { id: '', prop: '_arkaPlanResmi', value: resimVeriUri(deger) });
        return;
      case 'açılışAnimasyonu':
        gonder(pencereId, 'turkui:updateComponent', { id: '', prop: '_açılışAnimasyon', value: String(deger ?? '') });
        return;
      case 'başlıkÇubuğu':
        gonder(pencereId, 'turkui:updateComponent', { id: '', prop: '_başlıkÇubuğu', value: deger === true });
        return;
      case '_odaklan':
        if (durum && !durum.win.isDestroyed()) durum.win.focus();
        return;
      case '_center':
        if (durum && !durum.win.isDestroyed()) durum.win.center();
        return;
      case '_minimize':
        if (durum && !durum.win.isDestroyed()) durum.win.minimize();
        return;
      case '_maximize':
        if (durum && !durum.win.isDestroyed()) durum.win.maximize();
        return;
      case '_restore':
        if (durum && !durum.win.isDestroyed()) durum.win.unmaximize();
        return;
      case '_close':
        pencereKapat(pencereId);
        return;
      case 'genişlik':
      case 'yükseklik':
      case 'x':
      case 'y':
      case 'minGenişlik':
      case 'minYükseklik':
      case 'maksGenişlik':
      case 'maksYükseklik':
      case 'şeffaflık':
      case 'herZamanÜstte':
      case 'üstte':
      case 'boyutlandırılabilir':
      case 'tamEkran':
      case 'ikon':
      case 'küçültülebilir':
      case 'büyütülebilir':
      case 'kapatılabilir':
        pencereOzelligiUygula(durum, ozellik, deger);
        return;
      case 'çerçevesiz':
        // Çerçeve, pencere oluşturulduktan sonra değiştirilemez (Electron kısıtı).
        if (durum) durum.props[ozellik] = deger;
        return;
      default:
        break;
    }
    gonder(pencereId, 'turkui:updateComponent', { id: '', prop: ozellik, value: deger });
    return;
  }

  let yeniDeger = deger;
  if (ozellik === 'kaynak') {
    yeniDeger = resimVeriUri(deger);
  } else if (ozellik === 'adres') {
    yeniDeger = webAdresCoz(deger);
  } else if (
    ozellik === '_canvasKomut' &&
    deger &&
    typeof deger === 'object' &&
    deger.komut === 'görsel' &&
    typeof deger.kaynak === 'string'
  ) {
    yeniDeger = { ...deger, kaynak: resimVeriUri(deger.kaynak) };
  }
  gonder(pencereId, 'turkui:updateComponent', { id, prop: ozellik, value: yeniDeger });
}

/* ---------------- diyaloglar ---------------- */

async function ileti(tur, mesaj) {
  if (tur === 'onay') {
    const secim = await dialog.showMessageBox(aktifPencere(), {
      type: 'question',
      message: String(mesaj || 'Onaylıyor musunuz?'),
      buttons: ['Evet', 'Hayır'],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    });
    return secim.response === 0;
  }
  await dialog.showMessageBox(aktifPencere(), {
    type: tur === 'uyarı' ? 'warning' : 'info',
    message: String(mesaj || ''),
    buttons: ['Tamam'],
    noLink: true,
  });
  return null;
}

function aktifPencere() {
  const odakli = BrowserWindow.getFocusedWindow();
  if (odakli) return odakli;
  for (const durum of pencereler.values()) {
    if (!durum.win.isDestroyed()) return durum.win;
  }
  return undefined;
}

function sor(soru, varsayilan) {
  return new Promise((tamam) => {
    const pencere = new BrowserWindow({
      width: 480,
      height: 200,
      title: 'Girdi',
      icon: fs.existsSync(IKON) ? IKON : undefined,
      parent: aktifPencere(),
      modal: true,
      resizable: false,
      minimizable: false,
      maximizable: false,
      autoHideMenuBar: true,
      backgroundColor: '#1e1e2e',
      webPreferences: {
        preload: path.join(KOK, 'preload.js'),
        contextIsolation: false,
        nodeIntegration: false,
        sandbox: false,
      },
    });
    pencere.setMenu(null);
    let cevaplandi = false;
    const bitir = (deger) => {
      if (cevaplandi) return;
      cevaplandi = true;
      ipcMain.removeListener('turkui:sor-cevap', cevap);
      if (!pencere.isDestroyed()) pencere.close();
      tamam(deger);
    };
    const cevap = (_olay, veri) => bitir(veri && veri.iptal ? '' : String((veri && veri.deger) || ''));
    ipcMain.on('turkui:sor-cevap', cevap);
    pencere.on('closed', () => bitir(''));
    pencere.loadFile(path.join(KOK, 'sor.html'), {
      query: { soru: String(soru || ''), varsayilan: String(varsayilan || '') },
    });
  });
}

async function dosyaDiyalogu(tur, baslik, varsayilan, uzantilar) {
  const liste = Array.isArray(uzantilar) ? uzantilar.map((u) => String(u).replace(/^\./, '')).filter(Boolean) : [];
  const filtreler = liste.length ? [{ name: 'Desteklenen dosyalar', extensions: liste }] : undefined;
  let varsayilanYol = String(varsayilan || '').trim();
  if (varsayilanYol) {
    varsayilanYol = path.isAbsolute(varsayilanYol) ? varsayilanYol : path.join(CALISMA_KLASORU, varsayilanYol);
  }
  const pencere = aktifPencere();
  if (tur === 'klasor') {
    const sonuc = await dialog.showOpenDialog(pencere, {
      title: baslik || 'Klasör Seç',
      properties: ['openDirectory'],
      defaultPath: varsayilanYol || CALISMA_KLASORU,
    });
    return sonuc.canceled || !sonuc.filePaths.length ? '' : sonuc.filePaths[0];
  }
  if (tur === 'kaydet') {
    const sonuc = await dialog.showSaveDialog(pencere, {
      title: baslik || 'Kaydet',
      defaultPath: varsayilanYol || CALISMA_KLASORU,
      filters: filtreler,
    });
    return sonuc.canceled || !sonuc.filePath ? '' : sonuc.filePath;
  }
  const sonuc = await dialog.showOpenDialog(pencere, {
    title: baslik || 'Aç',
    properties: ['openFile'],
    defaultPath: varsayilanYol || CALISMA_KLASORU,
    filters: filtreler,
  });
  return sonuc.canceled || !sonuc.filePaths.length ? '' : sonuc.filePaths[0];
}

function bildirim(baslik, icerik) {
  if (!Notification.isSupported()) return;
  new Notification({ title: String(baslik || 'Türkod'), body: String(icerik || ''), icon: fs.existsSync(IKON) ? IKON : undefined }).show();
}

function ekranBilgisi() {
  const ekran = screen.getPrimaryDisplay();
  return {
    genişlik: ekran.size.width,
    yükseklik: ekran.size.height,
    ölçek: ekran.scaleFactor || 1,
    çalışmaAlanı: {
      x: ekran.workArea.x,
      y: ekran.workArea.y,
      genişlik: ekran.workArea.width,
      yükseklik: ekran.workArea.height,
    },
  };
}

/* ---------------- konsol ---------------- */

function konsolAc() {
  if (konsol && !konsol.isDestroyed()) return konsol;
  konsol = new BrowserWindow({
    width: 760,
    height: 400,
    title: 'Konsol',
    icon: fs.existsSync(IKON) ? IKON : undefined,
    backgroundColor: '#11111b',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(KOK, 'preload.js'),
      contextIsolation: false,
      nodeIntegration: false,
      sandbox: false,
    },
  });
  konsol.setMenu(null);
  konsol.loadFile(path.join(KOK, 'konsol.html'));
  konsol.on('closed', () => {
    konsol = null;
    if (bekleyenGirdi) {
      const bekleyen = bekleyenGirdi;
      bekleyenGirdi = null;
      bekleyen.tamam('');
    }
    belkiBitir();
  });
  return konsol;
}

/** Konsol penceresini (varsa) kapatır. */
function konsoluKapat() {
  const pencere = konsol;
  konsol = null;
  if (pencere && !pencere.isDestroyed()) {
    try {
      pencere.destroy();
    } catch {
      /* yok say */
    }
  }
}

function yaz(metin) {
  const s = String(metin ?? '');
  if (!s) return;
  process.stdout.write(s);
  ciktiMetni += s;
  if (ciktiMetni.length > 400000) ciktiMetni = ciktiMetni.slice(-400000);
  const pencere = konsolAc();
  if (pencere.webContents.isLoading()) {
    pencere.webContents.once('did-finish-load', () => {
      if (!pencere.isDestroyed()) pencere.webContents.send('turkui:konsol-yazi', s);
    });
  } else {
    pencere.webContents.send('turkui:konsol-yazi', s);
  }
}

function girdiAl(soru) {
  const pencere = konsolAc();
  pencere.show();
  pencere.focus();
  return new Promise((tamam) => {
    bekleyenGirdi = { tamam };
    const gonderSoru = () => {
      if (!pencere.isDestroyed()) pencere.webContents.send('turkui:konsol-soru', String(soru ?? ''));
    };
    if (pencere.webContents.isLoading()) pencere.webContents.once('did-finish-load', gonderSoru);
    else gonderSoru();
  });
}

ipcMain.on('turkui:konsol-girdi', (_olay, deger) => {
  const bekleyen = bekleyenGirdi;
  bekleyenGirdi = null;
  if (bekleyen) bekleyen.tamam(String(deger ?? ''));
});

/* ---------------- yorumlayıcı ---------------- */

/** Açık hata penceresi sayısı: kullanıcı okuyana kadar uygulama kapanmaz. */
let acikHataPenceresi = 0;

function hataYaz(hata) {
  const mesaj = hata instanceof Error ? hata.message : String(hata);
  const satir = hata && hata.satir ? ` (satır ${hata.satir})` : '';
  izle(`hata${satir}: ${mesaj}`);
  yaz(`Hata${satir}: ${mesaj}\n`);
  acikHataPenceresi += 1;
  void dialog
    .showMessageBox(aktifPencere(), {
      type: 'error',
      title: 'Türkod hatası',
      message: `Hata${satir}`,
      detail: mesaj,
      buttons: ['Tamam'],
      noLink: true,
    })
    .finally(() => {
      acikHataPenceresi = Math.max(0, acikHataPenceresi - 1);
      belkiBitir();
    });
}

/** `içe_aktar` ile bağlanan dosyayı çözer (alt klasörler ve proje kökü dahil). */
function modulCoz(ad, klasor) {
  return modulDosyasiBul(ad, klasor || CALISMA_KLASORU);
}

const kopru = {
  get baseDir() {
    return CALISMA_KLASORU;
  },
  onTurkuiCreateWindow: pencereOlustur,
  onTurkuiAddComponent: bilesenEkle,
  onTurkuiUpdateComponent: bilesenGuncelle,
  onTurkuiShowWindow: pencereGoster,
  onTurkuiCloseWindow: pencereKapat,
  onTurkuiIleti: ileti,
  onTurkuiSor: sor,
  onTurkuiDosya: dosyaDiyalogu,
  onTurkuiBildirim: bildirim,
  onTurkuiEkran: ekranBilgisi,
  onTurkuiPencereSayisi: () => pencereler.size,
  onTurkuiHepsiKapat: hepsiniKapat,
  onTurkuiDurum: (yeniFare, yeniKlavye) => {
    fare = yeniFare;
    klavye = yeniKlavye;
  },
};

function belkiBitir() {
  if (!programBitti || cikiyor) return;
  if (pencereler.size > 0) return;
  if (konsol && !konsol.isDestroyed()) return;
  if (bekleyenGirdi) return;
  if (acikHataPenceresi > 0) return;
  uygulamayiKapat();
}

/**
 * Uygulamayı kapatır. Kapanış bir kez başlatılır; pencere yıkımı sırasında
 * tekrar çağrılması kilitlenmeye yol açabileceği için korumalıdır.
 */
function uygulamayiKapat() {
  if (cikiyor) return;
  cikiyor = true;
  bekleyenGirdi = null;
  konsoluKapat();
  app.quit();
  // Electron kapanışı tamamlayamazsa süreç asılı kalmasın.
  const zorla = setTimeout(() => app.exit(0), 4000);
  if (typeof zorla.unref === 'function') zorla.unref();
}

async function calistir() {
  izle(`program başladı: ${KAYNAK}`);
  if (!fs.existsSync(KAYNAK)) {
    await dialog.showMessageBox({ type: 'error', message: `Program bulunamadı: ${KAYNAK}`, buttons: ['Tamam'] });
    app.quit();
    return;
  }
  let kod;
  try {
    kod = fs.readFileSync(KAYNAK, 'utf8');
  } catch (e) {
    hataYaz(e);
    programBitti = true;
    belkiBitir();
    return;
  }

  yorumlayici = new TurkodYorumlayici(kod, {
    yaz,
    oku: girdiAl,
    klasor: CALISMA_KLASORU,
    dosya: GIRIS_DOSYASI,
    gercekGecikme: true,
    modulCoz,
    turkui: createTurkuiModulu(kopru),
  });

  try {
    await yorumlayici.calistir();
  } catch (e) {
    hataYaz(e);
  } finally {
    programBitti = true;
    izle(`program bitti, açık pencere: ${pencereler.size}`);
    belkiBitir();
  }
}

/* ---------------- Electron ---------------- */

if (process.platform === 'win32') app.setAppUserModelId('com.turkod.uygulama');

app.on('window-all-closed', () => {
  izle('window-all-closed');
  // Program hâlâ çalışıyorsa pencere kaybı uygulamayı öldürmesin; program
  // bitince `belkiBitir` zaten kapatır. Böylece pencere kazara kapanırsa
  // süreç sessizce sonlanmaz.
  if (!cikiyor && programBitti) app.quit();
});

app.on('child-process-gone', (_olay, ayrinti) => {
  izle(
    `alt süreç kapandı: tür=${(ayrinti && ayrinti.type) || '-'} sebep=${(ayrinti && ayrinti.reason) || '-'}`
  );
});

app.on('before-quit', () => {
  izle('before-quit');
});

app.on('will-quit', () => {
  izle('will-quit');
});

process.on('exit', (kod) => {
  izle(`süreç çıkıyor: ${kod}`);
});

ipcMain.on('turkui:mesaj', (olay, mesaj) => {
  const pencereId = webIcerikleri.get(olay.sender.id);
  if (!pencereId) return;
  pencereMesaji(pencereId, mesaj);
});

app.whenReady().then(() => {
  void calistir();
});
