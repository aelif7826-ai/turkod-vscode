import * as vscode from 'vscode';
import { yerlesikKomutlar } from './veri/yerlesikKomutlar';
import { anahtarKelimeler, mantiksalOperatorler, sabitler } from './veri/anahtarKelimeler';
import { kumeMetotlari, listeMetotlari, metinMetotlari, sozlukMetotlari } from './veri/metotlar';

interface AciklamaVerisi {
  ad: string;
  tur: string;
  imza?: string;
  kategori?: string;
  aciklama: string;
  ornek?: string;
}

const HARF = 'A-Za-z0-9_ğüşıöçĞÜŞİÖÇ';

/** Ada göre Türkod öğesi (komut, anahtar kelime, sabit veya metot) açıklamasını bulur. */
export function aciklamaBul(onek: string, metotMu: boolean): AciklamaVerisi | undefined {
  const adaylar: AciklamaVerisi[] = [];

  if (!metotMu) {
    for (const k of yerlesikKomutlar) {
      adaylar.push({
        ad: k.ad,
        tur: 'Yerleşik komut',
        imza: k.imza,
        kategori: k.kategori,
        aciklama: k.aciklama,
        ornek: k.ornek,
      });
      for (const takma of k.takmaAdlar ?? []) {
        adaylar.push({
          ad: takma,
          tur: 'Yerleşik komut',
          imza: k.imza,
          kategori: k.kategori,
          aciklama: `${k.aciklama}\n\nAsıl ad: ${k.ad}`,
          ornek: k.ornek,
        });
      }
    }
    for (const k of [...anahtarKelimeler, ...mantiksalOperatorler, ...sabitler]) {
      adaylar.push({ ad: k.ad, tur: 'Dil öğesi', aciklama: k.aciklama, ornek: k.ornek });
    }
  }

  for (const metot of [...metinMetotlari, ...listeMetotlari, ...sozlukMetotlari, ...kumeMetotlari]) {
    adaylar.push({
      ad: metot.ad,
      tur: 'Metot',
      imza: `${metot.ad}(${metot.parametreler.join(', ')})`,
      aciklama: metot.aciklama,
    });
  }

  const kucuk = (metin: string) => metin.toLocaleLowerCase('tr');
  const aranan = kucuk(onek);

  let enIyi: AciklamaVerisi | undefined;
  let enIyiPuan = Number.POSITIVE_INFINITY;
  for (const aday of adaylar) {
    const ad = kucuk(aday.ad);
    if (!ad.startsWith(aranan)) continue;
    const puan = (ad === aranan ? 0 : 1) * 1000 + aday.ad.length;
    if (puan < enIyiPuan) {
      enIyiPuan = puan;
      enIyi = aday;
    }
  }
  return enIyi;
}

/** Seçili öneriyi (imleçteki kelimeyi) ayrı bir panelde açıklar. */
export class TurkodAciklamaPaneli implements vscode.Disposable {
  private panel?: vscode.WebviewPanel;

  dispose(): void {
    this.panel?.dispose();
    this.panel = undefined;
  }

  /** Komut paletinden çağrılır: imlecin altındaki kelimeyi açıklar. */
  async imlectekiniAnlat(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'turkod') {
      void vscode.window.showInformationMessage('Önce bir Türkod (.tr) dosyası açın.');
      return;
    }
    const aralik = editor.document.getWordRangeAtPosition(editor.selection.active, new RegExp(`[${HARF}]+`));
    const kelime = aralik ? editor.document.getText(aralik) : '';
    const veri = kelime ? aciklamaBul(kelime, false) : undefined;
    if (!veri) {
      void vscode.window.showInformationMessage(`"${kelime}" için Türkod açıklaması bulunamadı.`);
      return;
    }
    this.goster(veri);
  }

  private goster(veri: AciklamaVerisi): void {
    if (!this.panel) {
      this.panel = vscode.window.createWebviewPanel(
        'turkod.aciklama',
        'Türkod Açıklama',
        vscode.ViewColumn.Beside,
        { enableScripts: false, retainContextWhenHidden: true }
      );
      this.panel.onDidDispose(() => {
        this.panel = undefined;
      });
    }
    this.panel.title = `Türkod: ${veri.ad}`;
    this.panel.webview.html = this.html(veri);
    this.panel.reveal(vscode.ViewColumn.Beside, true);
  }

  private html(veri: AciklamaVerisi): string {
    const kacis = (metin: string) =>
      metin.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const etiket =
      veri.kategori ?? (veri.tur === 'Metot' ? 'Metot' : veri.tur);
    return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
<style>
  body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 20px 26px; line-height: 1.55; }
  h1 { font-size: 22px; margin: 0 0 6px; font-weight: 600; }
  .etiket { display: inline-block; font-size: 11px; letter-spacing: .04em; text-transform: uppercase; padding: 3px 9px; border-radius: 10px; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); }
  .imza { margin: 16px 0; font-family: var(--vscode-editor-font-family); font-size: 14px; padding: 10px 14px; border-radius: 6px; background: var(--vscode-textCodeBlock-background); border-left: 3px solid var(--vscode-focusBorder); white-space: pre-wrap; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .06em; opacity: .7; margin: 26px 0 8px; }
  p { margin: 0 0 12px; white-space: pre-wrap; }
  pre { font-family: var(--vscode-editor-font-family); font-size: 13px; padding: 14px; border-radius: 6px; background: var(--vscode-textCodeBlock-background); overflow-x: auto; white-space: pre; }
  .bos { opacity: .6; font-style: italic; }
</style>
</head>
<body>
  <span class="etiket">${kacis(etiket)}</span>
  <h1>${kacis(veri.ad)}</h1>
  ${veri.imza ? `<div class="imza">${kacis(veri.imza)}</div>` : ''}
  <h2>Açıklama</h2>
  <p>${kacis(veri.aciklama)}</p>
  <h2>Örnek</h2>
  ${veri.ornek ? `<pre>${kacis(veri.ornek)}</pre>` : '<p class="bos">Bu öğe için örnek yok.</p>'}
</body>
</html>`;
  }
}
