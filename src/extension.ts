import * as vscode from 'vscode';
import { TurkodTamamlamaSaglayici } from './tamamla';
import { TurkodCalistirici } from './calistirici';
import { TurkodAciklamaPaneli } from './aciklama';
import { denetle as turkodDenetle } from './denetleyici';
import { modulIndir } from './turkuiIndirici';

export function activate(context: vscode.ExtensionContext): void {
  const oyunDurumunuAyarla = (): void => {
    process.env.TURKOD_OYUN_MODULU = vscode.workspace
      .getConfiguration('turkod')
      .get<boolean>('oyunModuluEtkin', false) ? '1' : '0';
  };
  oyunDurumunuAyarla();
  const saglayici = vscode.languages.registerCompletionItemProvider(
    { language: 'turkod', scheme: '*' },
    new TurkodTamamlamaSaglayici(),
    '.',
    ' ',
    '-',
    '"',
    "'"
  );

  const calistirici = new TurkodCalistirici(context);
  const aciklama = new TurkodAciklamaPaneli();

  const sorunKanal = vscode.languages.createDiagnosticCollection('turkod');
  const zamanlayicilar = new Map<string, ReturnType<typeof setTimeout>>();

  function denetle(belge: vscode.TextDocument): void {
    if (belge.languageId !== 'turkod') {
      sorunKanal.delete(belge.uri);
      return;
    }
    const sonuclar = (() => {
      try {
        return turkodDenetle(belge.getText());
      } catch (hata) {
        console.error('Türkod denetleyici hatası:', hata);
        return [];
      }
    })();
    const tanilar = sonuclar.map((sorun) => {
      const aralik = new vscode.Range(sorun.satir, sorun.baslangic, sorun.satir, sorun.bitis);
      const tani = new vscode.Diagnostic(
        aralik,
        sorun.mesaj,
        sorun.onem === 'hata' ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning
      );
      tani.source = 'Türkod';
      return tani;
    });
    sorunKanal.set(belge.uri, tanilar);
  }

  /** Yazarken her tuşta değil, kısa bir gecikmeden sonra denetler (Python'daki gibi canlı). */
  function planla(belge: vscode.TextDocument): void {
    const anahtar = belge.uri.toString();
    const eski = zamanlayicilar.get(anahtar);
    if (eski !== undefined) clearTimeout(eski);
    zamanlayicilar.set(
      anahtar,
      setTimeout(() => {
        zamanlayicilar.delete(anahtar);
        denetle(belge);
      }, 300)
    );
  }

  function temizle(belge: vscode.TextDocument): void {
    const anahtar = belge.uri.toString();
    const eski = zamanlayicilar.get(anahtar);
    if (eski !== undefined) {
      clearTimeout(eski);
      zamanlayicilar.delete(anahtar);
    }
    sorunKanal.delete(belge.uri);
  }

  context.subscriptions.push(
    saglayici,
    calistirici,
    aciklama,
    sorunKanal,
    {
      dispose: () => {
        for (const zamanlayici of zamanlayicilar.values()) clearTimeout(zamanlayici);
        zamanlayicilar.clear();
      },
    },
    vscode.workspace.onDidOpenTextDocument(denetle),
    vscode.workspace.onDidChangeTextDocument((e) => planla(e.document)),
    vscode.workspace.onDidSaveTextDocument(denetle),
    vscode.workspace.onDidCloseTextDocument(temizle),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('turkod.oyunModuluEtkin')) oyunDurumunuAyarla();
    }),
    vscode.window.onDidChangeActiveTextEditor((e) => {
      if (e) denetle(e.document);
    }),
    vscode.commands.registerCommand('turkod.aciklama', () => aciklama.imlectekiniAnlat()),
    
    vscode.commands.registerCommand('turkod.calistir', () => calistirici.calistir()),
    vscode.commands.registerCommand('turkod.hataAyikla', () => calistirici.hataAyikla()),
    vscode.commands.registerCommand('turkod.imleceKadarCalistir', () => calistirici.imleceKadarCalistir()),
    vscode.commands.registerCommand('turkod.secimiCalistir', () => calistirici.secimiCalistir()),
    vscode.commands.registerCommand('turkod.durdur', () => calistirici.durdur()),
    vscode.commands.registerCommand('turkod.uygulamaPaketle', () => calistirici.uygulamaPaketle()),
    vscode.commands.registerCommand('turkod.modulIndir', () => modulIndirKomutu())
  );

  if (vscode.window.activeTextEditor) {
    denetle(vscode.window.activeTextEditor.document);
  }
}

/**
 * TürkUI modülünü (Electron çalışma zamanı) indirir.
 * Uzantı Electron'u içinde taşımadığı için bu isteğe bağlı adımdır.
 */
async function modulIndirKomutu(): Promise<void> {
  let yuzde = 0;
  try {
    const sonuc = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'TürkUI modülü indiriliyor',
        cancellable: false,
      },
      (ilerleme) =>
        modulIndir({
          ilerleme: (bilgi) => {
            const artis = Math.max(0, bilgi.yuzde - yuzde);
            yuzde = bilgi.yuzde;
            ilerleme.report({
              message: `%${bilgi.yuzde} (${(bilgi.alinan / (1024 * 1024)).toFixed(1)} MB)`,
              increment: artis,
            });
          },
        })
    );

    const mesaj = sonuc.zatenKurulu
      ? `TürkUI modülü zaten kurulu (${sonuc.boyutMb} MB).`
      : `TürkUI modülü hazır: ${sonuc.boyutMb} MB`;
    const secim = await vscode.window.showInformationMessage(mesaj, 'Klasörü Aç');
    if (secim) void vscode.env.openExternal(vscode.Uri.file(sonuc.klasor));
  } catch (hata) {
    const mesaj = hata instanceof Error ? hata.message : String(hata);
    void vscode.window.showErrorMessage(
      `TürkUI modülü indirilemedi: ${mesaj} — terminalde \`türkod yeni modül indir türküi\` deneyin.`
    );
  }
}

export function deactivate(): void {}
