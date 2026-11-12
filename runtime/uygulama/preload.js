'use strict';

/**
 * TürkUI sayfası ile Electron ana süreci arasındaki köprü.
 *
 * Sayfa `acquireVsCodeApi()` beklediği için aynı arayüz sunulur; mesajlar
 * `{ channel, data }` zarfıyla taşınır. Böylece `media/turkui-window.html`
 * değiştirilmeden çalışır.
 */

const { ipcRenderer } = require('electron');

/**
 * Yalnızca Electron çalışma zamanında tanımlanır. Renderer bu işarete bakarak
 * `<webview>` (gerçek gömülü tarayıcı) ile `<iframe>` arasında seçim yapar.
 */
window.turkuiWebview = true;

window.acquireVsCodeApi = function () {
  return {
    postMessage(mesaj) {
      try {
        ipcRenderer.send('turkui:mesaj', mesaj || {});
      } catch {
        /* yok say */
      }
    },
    getState() {
      return undefined;
    },
    setState() {},
  };
};

ipcRenderer.on('turkui:mesaj', (_olay, mesaj) => {
  window.dispatchEvent(new MessageEvent('message', { data: mesaj }));
});

/** Konsol ve girdi pencerelerinin kullandığı küçük köprü. */
window.turkuiPencere = {
  gonder(kanal, veri) {
    ipcRenderer.send(kanal, veri);
  },
  dinle(kanal, geri) {
    ipcRenderer.on(kanal, (_olay, veri) => geri(veri));
  },
};
