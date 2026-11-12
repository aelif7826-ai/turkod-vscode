/**
 * TürkUI pencerelerini gerçek masaüstü pencereleri olarak açar.
 *
 * VS Code webview'i her zaman bir editör sekmesine (ya da VS Code'un yardımcı
 * penceresine) bağlıdır; Windows Forms'taki gibi bağımsız bir pencere elde
 * edilemez. Burada `media/turkui-window.html` sayfası yerel bir HTTP
 * sunucusundan sunulur ve sistemdeki Edge/Chrome tarafından `--app` kipinde
 * açılır. Böylece pencerenin kendi başlık çubuğu, görev çubuğu düğmesi, boyutu
 * ve konumu olur; VS Code penceresinden tamamen bağımsızdır.
 *
 * İletişim:
 *   - sunucu → pencere : Server-Sent Events (`/olaylar`)
 *   - pencere → sunucu : `POST /mesaj`
 *
 * Her pencere ayrı bir tarayıcı profiliyle başlatılır; böylece pencere
 * kapatıldığında süreç sonlanır ve uzantı bunu kesin olarak algılar.
 */

import * as fs from 'node:fs';
import * as http from 'node:http';
import type { AddressInfo } from 'node:net';
import * as os from 'node:os';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { ChildProcess, spawn } from 'node:child_process';

/** Pencereyi temsil eden taşıyıcı; webview ve masaüstü penceresi aynı arayüzü kullanır. */
export interface TurkuiPencereHedefi {
  gonder(mesaj: { channel: string; data: unknown }): void;
  baslikAyarla(baslik: string): void;
  goster(): void;
  kapat(): void;
}

export interface MasaustuSecenekleri {
  /** Pencerenin HTML içeriği (her istekte taze nonce ile). */
  html: () => string;
  /** Pencere sayfasından gelen mesaj. */
  mesaj: (pencereId: string, mesaj: unknown) => void;
  /** Kullanıcı pencereyi kapattı (ya da süreç sonlandı). */
  kapandi: (pencereId: string) => void;
  /** Pencere açma/yazma hataları. */
  hata?: (mesaj: string) => void;
}

interface PencereKaydi {
  id: string;
  baslik: string;
  props: Record<string, unknown>;
  /** Açık SSE bağlantıları. */
  istemciler: Set<http.ServerResponse>;
  /** Pencere sayfayı henüz bağlamadıysa biriken mesajlar. */
  bekleyen: unknown[];
  surec?: ChildProcess;
  kapaniyor: boolean;
  tamamlandi: boolean;
  profil: string;
}

/** Sistemde kullanılabilir bir Chromium tarayıcısı arar (Edge → Chrome → Brave). */
export function tarayiciBul(): string | undefined {
  if (process.platform !== 'win32') return undefined;
  const ortam = process.env;
  const adaylar: string[] = [];
  const ekle = (kok: string | undefined, ...parcalar: string[]): void => {
    if (kok) adaylar.push(path.join(kok, ...parcalar));
  };
  for (const kok of ['PROGRAMFILES(X86)', 'PROGRAMFILES', 'LOCALAPPDATA']) {
    ekle(ortam[kok], 'Microsoft', 'Edge', 'Application', 'msedge.exe');
  }
  for (const kok of ['PROGRAMFILES', 'PROGRAMFILES(X86)', 'LOCALAPPDATA']) {
    ekle(ortam[kok], 'Google', 'Chrome', 'Application', 'chrome.exe');
  }
  for (const kok of ['PROGRAMFILES', 'PROGRAMFILES(X86)', 'LOCALAPPDATA']) {
    ekle(ortam[kok], 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe');
  }
  for (const yol of adaylar) {
    try {
      if (fs.existsSync(yol)) return yol;
    } catch {
      /* erişilemeyen yol */
    }
  }
  return undefined;
}

export class MasaustuPencereSunucusu {
  private sunucu?: http.Server;
  private port = 0;
  /** Rastgele yol belirteci; başka süreçlerin sunucuya erişmesini engeller. */
  private readonly jeton = crypto.randomBytes(12).toString('hex');
  private kayitlar = new Map<string, PencereKaydi>();
  private baslama?: Promise<void>;
  private kapandi = false;

  constructor(
    private readonly secenekler: MasaustuSecenekleri,
    private readonly tarayici: string
  ) {}

  /** Sunucuyu (gerekirse) başlatır; aynı anda birden çok çağrı güvenlidir. */
  baslat(): Promise<void> {
    if (this.sunucu) return Promise.resolve();
    if (!this.baslama) {
      this.baslama = new Promise<void>((tamam, hata) => {
        const sunucu = http.createServer((istek, yanit) => this.istek(istek, yanit));
        sunucu.once('error', (e) => {
          this.baslama = undefined;
          hata(e);
        });
        sunucu.listen(0, '127.0.0.1', () => {
          const adres = sunucu.address() as AddressInfo;
          this.port = adres.port;
          this.sunucu = sunucu;
          sunucu.unref();
          tamam();
        });
      });
    }
    return this.baslama;
  }

  /** Pencerenin sayfa adresi; masaüstü penceresi bu adresi açar. */
  adres(pencereId: string): string {
    return `http://127.0.0.1:${this.port}/${this.jeton}/${encodeURIComponent(pencereId)}/`;
  }

  /** Yeni bir pencere kaydı oluşturur; pencere `goster()` ile açılır. */
  pencereOlustur(
    pencereId: string,
    baslik: string,
    props: Record<string, unknown>
  ): TurkuiPencereHedefi {
    const kayit: PencereKaydi = {
      id: pencereId,
      baslik,
      props: { ...props },
      istemciler: new Set(),
      bekleyen: [],
      kapaniyor: false,
      tamamlandi: false,
      profil: path.join(
        os.tmpdir(),
        'turkod-turkui',
        `${process.pid}-${Date.now()}-${pencereId.replace(/[^\w-]/g, '')}`
      ),
    };
    this.kayitlar.set(pencereId, kayit);
    return {
      gonder: (mesaj) => this.gonder(pencereId, mesaj),
      baslikAyarla: (yeni) => {
        kayit.baslik = yeni;
      },
      goster: () => {
        void this.goster(pencereId);
      },
      kapat: () => this.kapat(pencereId),
    };
  }

  /** Pencereye mesaj yazar (SSE). Sayfa henüz bağlanmadıysa sıraya alınır. */
  gonder(pencereId: string, mesaj: unknown): void {
    const kayit = this.kayitlar.get(pencereId);
    if (!kayit) return;
    if (kayit.istemciler.size === 0) {
      kayit.bekleyen.push(mesaj);
      if (kayit.bekleyen.length > 5000) kayit.bekleyen.splice(0, kayit.bekleyen.length - 5000);
      return;
    }
    this.yaz(kayit, mesaj);
  }

  private yaz(kayit: PencereKaydi, mesaj: unknown): void {
    const veri = `data: ${JSON.stringify(mesaj)}\n\n`;
    for (const yanit of [...kayit.istemciler]) {
      try {
        yanit.write(veri);
      } catch {
        kayit.istemciler.delete(yanit);
      }
    }
  }

  /** Pencere zaten açıksa öne getirir, değilse açar. */
  private async goster(pencereId: string): Promise<void> {
    const kayit = this.kayitlar.get(pencereId);
    if (!kayit || kayit.kapaniyor || this.kapandi) return;
    if (kayit.surec && kayit.surec.exitCode === null && !kayit.surec.killed) {
      this.odakla(kayit);
      return;
    }
    try {
      await this.baslat();
    } catch (e) {
      this.secenekler.hata?.(
        `TürkUI sunucusu başlatılamadı: ${e instanceof Error ? e.message : String(e)}`
      );
      return;
    }
    if (this.kapandi || kayit.kapaniyor) return;
    this.baslatTarayici(kayit);
  }

  private baslatTarayici(kayit: PencereKaydi): void {
    try {
      fs.mkdirSync(kayit.profil, { recursive: true });
    } catch {
      /* profil klasörü oluşturulamazsa tarayıcı kendi profilini kurar */
    }
    const boyut = this.boyut(kayit.props);
    const argumanlar = [
      `--app=${this.adres(kayit.id)}`,
      `--user-data-dir=${kayit.profil}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-sync',
      '--disable-features=Translate',
      `--window-size=${boyut.genislik},${boyut.yukseklik}`,
    ];
    if (boyut.x !== undefined && boyut.y !== undefined) {
      argumanlar.push(`--window-position=${boyut.x},${boyut.y}`);
    }
    const surec = spawn(this.tarayici, argumanlar, { stdio: 'ignore', windowsHide: false });
    kayit.surec = surec;
    surec.once('error', (e) => {
      this.secenekler.hata?.(`TürkUI penceresi açılamadı: ${e.message}`);
    });
    surec.once('exit', () => {
      if (kayit.surec === surec) kayit.surec = undefined;
      // Kullanıcı pencereyi kapattı (ya da süreç çöktü).
      this.tamamla(kayit.id);
    });
  }

  /** Pencereyi kapatır; kapanış olayı `kapandi` ile bildirilir. */
  kapat(pencereId: string): void {
    const kayit = this.kayitlar.get(pencereId);
    if (!kayit || kayit.tamamlandi) return;
    kayit.kapaniyor = true;
    const pid = kayit.surec?.pid;
    if (pid) {
      // Tarayıcı alt süreçleriyle birlikte kapansın.
      try {
        spawn('taskkill', ['/pid', String(pid), '/T', '/F'], {
          stdio: 'ignore',
          windowsHide: true,
        }).on('error', () => undefined);
      } catch {
        /* taskkill yoksa aşağıdaki kill devreye girer */
      }
      try {
        kayit.surec?.kill();
      } catch {
        /* süreç zaten kapanmış olabilir */
      }
    }
    this.tamamla(pencereId);
  }

  private tamamla(pencereId: string): void {
    const kayit = this.kayitlar.get(pencereId);
    if (!kayit || kayit.tamamlandi) return;
    kayit.tamamlandi = true;
    this.kayitlar.delete(pencereId);
    for (const yanit of [...kayit.istemciler]) {
      try {
        yanit.end();
      } catch {
        /* bağlantı kapanmış */
      }
    }
    kayit.istemciler.clear();
    if (kayit.surec) {
      try {
        kayit.surec.kill();
      } catch {
        /* yok say */
      }
      kayit.surec = undefined;
    }
    this.profilSil(kayit.profil);
    this.secenekler.kapandi(pencereId);
  }

  private profilSil(profil: string): void {
    const sil = (deneme: number): void => {
      try {
        fs.rmSync(profil, { recursive: true, force: true });
      } catch {
        if (deneme < 3) {
          const zamanlayici = setTimeout(() => sil(deneme + 1), 400 * (deneme + 1));
          zamanlayici.unref();
        }
      }
    };
    const ilk = setTimeout(() => sil(0), 300);
    ilk.unref();
  }

  /** Pencereyi öne getirir (Windows'ta AppActivate). */
  private odakla(kayit: PencereKaydi): void {
    const pid = kayit.surec?.pid;
    if (!pid) return;
    try {
      const betik = `(New-Object -ComObject WScript.Shell).AppActivate(${pid}) | Out-Null`;
      spawn('powershell', ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command', betik], {
        stdio: 'ignore',
        windowsHide: true,
      }).on('error', () => undefined);
    } catch {
      /* odaklanma desteklenmiyorsa yok say */
    }
  }

  private boyut(props: Record<string, unknown>): {
    genislik: number;
    yukseklik: number;
    x?: number;
    y?: number;
  } {
    const sayi = (deger: unknown, varsayilan: number): number => {
      const n = Number(deger);
      return Number.isFinite(n) && n > 0 ? Math.round(n) : varsayilan;
    };
    const konum = (deger: unknown): number | undefined => {
      const n = Number(deger);
      return Number.isFinite(n) ? Math.round(n) : undefined;
    };
    return {
      genislik: sayi(props['genişlik'] ?? props['genislik'], 820),
      yukseklik: sayi(props['yükseklik'] ?? props['yukseklik'], 620),
      x: konum(props['x']),
      y: konum(props['y']),
    };
  }

  /* ---------------- HTTP ---------------- */

  private istek(istek: http.IncomingMessage, yanit: http.ServerResponse): void {
    const url = new URL(istek.url ?? '/', 'http://127.0.0.1');
    const parcalar = url.pathname.split('/').filter(Boolean);
    if (parcalar[0] !== this.jeton || parcalar.length < 2) {
      this.kisaYanit(yanit, 404);
      return;
    }
    const pencereId = decodeURIComponent(parcalar[1]);
    const islem = parcalar[2] ?? '';
    const kayit = this.kayitlar.get(pencereId);
    if (!kayit) {
      this.kisaYanit(yanit, 404);
      return;
    }
    if (islem === '') {
      this.sayfaGonder(yanit, pencereId);
      return;
    }
    if (islem === 'olaylar') {
      this.sse(istek, yanit, kayit);
      return;
    }
    if (islem === 'mesaj' && istek.method === 'POST') {
      this.mesajAl(istek, yanit, kayit);
      return;
    }
    this.kisaYanit(yanit, 404);
  }

  private kisaYanit(yanit: http.ServerResponse, kod: number): void {
    try {
      yanit.writeHead(kod);
      yanit.end();
    } catch {
      /* bağlantı kapanmış */
    }
  }

  private sayfaGonder(yanit: http.ServerResponse, pencereId: string): void {
    const govde = Buffer.from(this.sayfa(pencereId), 'utf8');
    try {
      yanit.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': govde.length,
        'Cache-Control': 'no-store',
      });
      yanit.end(govde);
    } catch {
      /* bağlantı kapanmış */
    }
  }

  private sse(istek: http.IncomingMessage, yanit: http.ServerResponse, kayit: PencereKaydi): void {
    try {
      yanit.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-store',
        Connection: 'keep-alive',
      });
      yanit.write(': turkui\n\n');
    } catch {
      return;
    }
    kayit.istemciler.add(yanit);
    // Sayfa bağlanmadan biriken mesajları şimdi gönder.
    if (kayit.bekleyen.length > 0) {
      const bekleyen = kayit.bekleyen;
      kayit.bekleyen = [];
      for (const mesaj of bekleyen) this.yaz(kayit, mesaj);
    }
    const temizle = (): void => {
      kayit.istemciler.delete(yanit);
    };
    istek.on('close', temizle);
    istek.on('error', temizle);
    yanit.on('error', temizle);
  }

  private mesajAl(
    istek: http.IncomingMessage,
    yanit: http.ServerResponse,
    kayit: PencereKaydi
  ): void {
    let ham = '';
    istek.setEncoding('utf8');
    istek.on('data', (parca: string) => {
      ham += parca;
      if (ham.length > 50_000_000) istek.destroy();
    });
    istek.on('end', () => {
      this.kisaYanit(yanit, 204);
      if (!ham) return;
      let mesaj: unknown;
      try {
        mesaj = JSON.parse(ham);
      } catch {
        return;
      }
      try {
        this.secenekler.mesaj(kayit.id, mesaj);
      } catch (e) {
        this.secenekler.hata?.(e instanceof Error ? e.message : String(e));
      }
    });
  }

  /**
   * Sayfayı, webview köprüsünü taklit eden küçük bir betikle birlikte üretir.
   * `media/turkui-window.html` böylece hem webview'de hem masaüstü penceresinde
   * değiştirilmeden çalışır.
   */
  private sayfa(pencereId: string): string {
    const temel = `/${this.jeton}/${encodeURIComponent(pencereId)}`;
    let sayfa = this.secenekler.html();
    // Sayfadaki CSP `nonce` ile inline betiklere izin verir; köprü betiği de
    // aynı nonce'u taşımalı. Ayrıca SSE/POST için kendi kaynağına bağlantı izni
    // gerekir (webview'de buna ihtiyaç yoktur).
    const nonceEslesme = /<script[^>]*\bnonce="([^"]+)"/.exec(sayfa);
    const nonce = nonceEslesme ? nonceEslesme[1] : '';
    const nonceNitelik = nonce ? ` nonce="${nonce}"` : '';
    sayfa = sayfa.replace(
      /default-src 'none';/,
      "default-src 'none'; connect-src 'self';"
    );
    const kabuk = [
      `<script${nonceNitelik}>`,
      '(function () {',
      `  var temel = ${JSON.stringify(temel)};`,
      '  window.acquireVsCodeApi = function () {',
      '    return {',
      '      postMessage: function (mesaj) {',
      '        try {',
      '          fetch(temel + "/mesaj", {',
      '            method: "POST",',
      '            headers: { "Content-Type": "application/json" },',
      '            body: JSON.stringify(mesaj || {}),',
      '            keepalive: true',
      '          }).catch(function () {});',
      '        } catch (e) {}',
      '      },',
      '      getState: function () { return undefined; },',
      '      setState: function () {}',
      '    };',
      '  };',
      '  try {',
      '    var kaynak = new EventSource(temel + "/olaylar");',
      '    kaynak.onmessage = function (olay) {',
      '      var mesaj;',
      '      try { mesaj = JSON.parse(olay.data); } catch (e) { return; }',
      '      window.dispatchEvent(new MessageEvent("message", { data: mesaj }));',
      '    };',
      '  } catch (e) {}',
      '})();',
      '</script>',
    ].join('\n');
    return sayfa.replace(/<script\s+nonce=/, `${kabuk}\n<script nonce=`);
  }

  /** Tüm pencereleri kapatır ve sunucuyu durdurur. */
  dispose(): void {
    this.kapandi = true;
    for (const id of [...this.kayitlar.keys()]) this.kapat(id);
    try {
      this.sunucu?.close();
    } catch {
      /* zaten kapalı */
    }
    this.sunucu = undefined;
    this.baslama = undefined;
  }
}
