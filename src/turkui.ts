/**
 * TürkUI — masaüstü grafik arayüzü modülü.
 *
 * Bu dosya TURKOD Studio'daki TürkUI modülünün VS Code sürümüdür. Studio'da
 * pencereler Electron ile açılır; burada aynı bileşen API'si VS Code webview
 * panellerine bağlanır. Dil tarafı (bileşen nesneleri, özellikler, olaylar)
 * Studio ile birebir aynı davranır.
 */

import * as fsModule from 'node:fs';
import * as pathModule from 'node:path';

/** TürkUI'de kullanılan hazır renk isimleri. */
export const TURKUI_RENKLER: Record<string, string> = {
  kırmızı: '#f38ba8',
  kirmizi: '#f38ba8',
  mavi: '#89b4fa',
  yeşil: '#a6e3a1',
  yesil: '#a6e3a1',
  sarı: '#f9e2af',
  sari: '#f9e2af',
  turuncu: '#fab387',
  mor: '#cba6f7',
  pembe: '#f5c2e7',
  beyaz: '#cdd6f4',
  siyah: '#11111b',
  gri: '#6c7086',
  turkuaz: '#94e2d5',
  camGöbeği: '#89dceb',
  camGobegi: '#89dceb',
  şeffaf: 'transparent',
  seffaf: 'transparent',
};

/** `renk.mavi` gibi hazır renk değeri. */
export class RenkDegeri {
  readonly _turkolRenk = true;
  readonly renk: string;
  constructor(renk: string) {
    this.renk = renk;
  }
  geçiş(süre: number): RenkGeçiş {
    return { _turkolGeçiş: true, toColor: this.renk, duration: süre };
  }
  toString(): string {
    return this.renk;
  }
  valueOf(): string {
    return this.renk;
  }
}

/** Renk geçişi (yumuşak animasyon) değeri. */
export interface RenkGeçiş {
  _turkolGeçiş: true;
  toColor: string;
  duration: number;
}

export function renkGecisiMi(deger: unknown): deger is RenkGeçiş {
  return !!deger && typeof deger === 'object' && (deger as RenkGeçiş)._turkolGeçiş === true;
}

export function renkDegeriMi(deger: unknown): deger is RenkDegeri {
  return !!deger && typeof deger === 'object' && (deger as RenkDegeri)._turkolRenk === true;
}

/** Hazır renk paleti ve renk üreticileri. */
export function createRenkNesnesi(): Record<string, any> {
  const renk: Record<string, any> = { _turkolRenkModulu: true };
  for (const [ad, hex] of Object.entries(TURKUI_RENKLER)) {
    Object.defineProperty(renk, ad, { get: () => new RenkDegeri(hex), enumerable: true });
  }
  renk.rgb = (r: any, g: any, b: any) => {
    const rr = Math.max(0, Math.min(255, Number(r) || 0));
    const gg = Math.max(0, Math.min(255, Number(g) || 0));
    const bb = Math.max(0, Math.min(255, Number(b) || 0));
    return new RenkDegeri(`rgb(${rr},${gg},${bb})`);
  };
  renk.rgba = (r: any, g: any, b: any, a: any) => {
    const rr = Math.max(0, Math.min(255, Number(r) || 0));
    const gg = Math.max(0, Math.min(255, Number(g) || 0));
    const bb = Math.max(0, Math.min(255, Number(b) || 0));
    const aa = Math.max(0, Math.min(1, Number(a) || 1));
    return new RenkDegeri(`rgba(${rr},${gg},${bb},${aa})`);
  };
  renk.hex = (h: any) => {
    const s = String(h);
    if (/^#[0-9a-fA-F]{6}$/.test(s) || /^#[0-9a-fA-F]{8}$/.test(s)) return new RenkDegeri(s);
    return new RenkDegeri('#cdd6f4');
  };
  // Gradyanlar: renk.doğrusalGeçiş(160, mavi, siyah) — sayı yön açı (derece) sayılır.
  const gecisYonu = (yon: any): string => {
    if (typeof yon === 'number') return `${yon}deg`;
    const YONLER: Record<string, string> = {
      'sağa': 'to right',
      'sola': 'to left',
      'yukarı': 'to top',
      'aşağı': 'to bottom',
      'sağaAşağı': 'to bottom right',
      'solaAşağı': 'to bottom left',
      'sağaYukarı': 'to top right',
      'solaYukarı': 'to top left',
      'çember': 'circle',
      'daire': 'circle',
      'elips': 'ellipse',
    };
    const ham = String(yon);
    return YONLER[ham] || ham;
  };
  const gecisMetni = (tur: string, yon: any, renkler: any[]): string => {
    const renkMetni = (v: any): string =>
      v && typeof v === 'object' && (v as RenkDegeri)._turkolRenk
        ? String((v as RenkDegeri).renk)
        : String(v);
    const aci = gecisYonu(yon);
    const durak = renkler.filter((r) => r !== undefined && r !== null && r !== '');
    const govde = [aci, ...durak.map(renkMetni)].join(', ');
    return `${tur}-gradient(${govde})`;
  };
  renk.doğrusalGeçiş = (yon: any, ...renkler: any[]) =>
    new RenkDegeri(gecisMetni('linear', yon, renkler));
  renk.ışınımsalGeçiş = (yon: any, ...renkler: any[]) =>
    new RenkDegeri(gecisMetni('radial', yon, renkler));
  // renk.geçiş(başlangıç, hedef, süre) veya renk.geçiş(hedef, süre)
  renk.geçiş = (arg1: any, arg2: any, arg3: any) => {
    const renkStr = (v: any): string => {
      if (v instanceof RenkDegeri) return v.renk;
      if (typeof v === 'string') return v;
      return '';
    };
    let hedef: any;
    let sure: any;
    if (arg1 instanceof RenkDegeri || typeof arg1 === 'string') {
      if (arg2 instanceof RenkDegeri || typeof arg2 === 'string') {
        hedef = arg2;
        sure = arg3;
      } else {
        hedef = arg1;
        sure = arg2;
      }
    }
    const hedefStr = renkStr(hedef);
    if (!hedefStr) {
      throw new Error('renk.geçiş: Geçerli bir hedef renk verilmelidir.\nÖrnek: renk.geçiş(renk.mavi, renk.turuncu, 5)');
    }
    const s = Number(sure);
    return { _turkolGeçiş: true, toColor: hedefStr, duration: Number.isFinite(s) && s > 0 ? s : 1 };
  };
  return renk;
}

/**
 * `yazı.renk.mavi` / `uygulama.arkaPlan.yeşil` zincirli renk atamaları için
 * canlı renk nesnesi üretir.
 */
export function createCanliRenkNesnesi(oku: () => string, ayarla: (renk: string) => void): Record<string, any> {
  const renkModulu = createRenkNesnesi();
  const canli: Record<string, any> = {
    _turkolRenk: true,
    rgb: (r: any, g: any, b: any) => {
      const c = renkModulu.rgb(r, g, b);
      ayarla(c.renk);
      return c;
    },
    rgba: (r: any, g: any, b: any, a: any) => {
      const c = renkModulu.rgba(r, g, b, a);
      ayarla(c.renk);
      return c;
    },
    hex: (h: any) => {
      const c = renkModulu.hex(h);
      ayarla(c.renk);
      return c;
    },
    geçiş: (süre: any) => {
      const s = Number(süre);
      return { _turkolGeçiş: true, toColor: oku(), duration: Number.isFinite(s) && s > 0 ? s : 1 };
    },
    toString: () => oku(),
    valueOf: () => oku(),
  };
  Object.defineProperty(canli, 'renk', { get: () => oku() });
  for (const [ad, hex] of Object.entries(TURKUI_RENKLER)) {
    Object.defineProperty(canli, ad, {
      get: () => {
        ayarla(hex);
        return new RenkDegeri(hex);
      },
      configurable: true,
      enumerable: true,
    });
  }
  return canli;
}

/** VS Code tarafındaki pencere/diyalog köprüsü. */
export interface TurkuiKopru {
  /** Göreli yolların çözümlendiği çalışma klasörü. */
  baseDir: string;
  onTurkuiCreateWindow?: (baslik: string, pencereId: string, props: Record<string, any>) => void;
  onTurkuiAddComponent?: (pencereId: string, tur: string, id: string, props: Record<string, any>) => void;
  onTurkuiUpdateComponent?: (pencereId: string, id: string, ozellik: string, deger: unknown) => void;
  onTurkuiShowWindow?: (pencereId: string) => void;
  onTurkuiCloseWindow?: (pencereId: string) => void;
  onTurkuiIleti?: (
    tur: 'uyarı' | 'bilgi' | 'onay',
    mesaj: string
  ) => boolean | null | Promise<boolean | null>;
  onTurkuiSor?: (soru: string, varsayilan: string) => string | Promise<string>;
  onTurkuiDosya?: (
    tur: 'ac' | 'kaydet' | 'klasor',
    baslik: string,
    varsayilan: string,
    uzantilar: string[]
  ) => string | Promise<string>;
  onTurkuiBildirim?: (baslik: string, icerik: string) => void | Promise<void>;
  onTurkuiEkran?: () => Record<string, any> | null;
  onTurkuiPencereSayisi?: () => number;
  onTurkuiHepsiKapat?: () => void;
  /** Modül hazır olduğunda canlı fare/klavye/renk nesnelerini paylaşır. */
  onTurkuiDurum?: (fare: Record<string, any>, klavye: Record<string, any>, renk: Record<string, any>) => void;
}

export interface TurkuiModulu {
  /** `TürkUI` değişkenine bağlanan üye nesnesi. */
  uyeler: Record<string, any>;
  fare: Record<string, any>;
  klavye: Record<string, any>;
  renk: Record<string, any>;
}

interface PencereDurumu {
  shown: boolean;
  pending: Array<{ type: string; id: string; props: Record<string, any> }>;
  componentProps: Record<string, Record<string, any>>;
  title: string;
  pendingItemAdditions?: Array<{ id: string; item: string; prop?: string }>;
  /** Pencere gösterilmeden önce biriken bileşen güncellemeleri (tuval komutları). */
  pendingUpdates?: Array<{ id: string; prop: string; value: any }>;
  /** `pencere.stil(...)` ile atanan pencere düzeyi CSS. */
  stil?: string;
  /** `TürkUI.betik { pencere( ... ) }` ile gönderilen Türkçe betik. */
  betik?: {
    kod: string;
    harita: Record<string, string>;
    satir: number;
    /** Dosyadaki pencere adları → pencere kimlikleri. */
    pencereler?: Record<string, string>;
  };
}

/** TürkUI modülünü oluşturur. */
export function createTurkuiModulu(host?: TurkuiKopru): TurkuiModulu {
  const componentCounters: Record<string, number> = {};
  const windowStates: Record<string, PencereDurumu> = {};

  function generateId(): string {
    return 'tw_' + Math.random().toString(36).slice(2, 11);
  }

  function getOrCreateWindowState(wId: string, title?: string): PencereDurumu {
    if (!windowStates[wId]) {
      windowStates[wId] = { shown: false, pending: [], componentProps: {}, title: title || '' };
    }
    return windowStates[wId];
  }

  function sendComponent(windowId: string, type: string, id: string, props: Record<string, any>): void {
    host?.onTurkuiAddComponent?.(windowId, type, id, { ...props });
  }

  function updateComponent(
    windowId: string,
    id: string,
    prop: string,
    value: any,
    hemen = false
  ): void {
    const state = windowStates[windowId];
    // Tuval ve tarayıcı komutları pencere görünmeden önce birikir; `göster()`
    // sırasında bileşen eklendikten sonra sırayla gönderilir.
    if (
      !hemen &&
      state &&
      !state.shown &&
      id !== '' &&
      (prop.startsWith('_canvas') || prop.startsWith('_web'))
    ) {
      if (!state.pendingUpdates) state.pendingUpdates = [];
      state.pendingUpdates.push({ id, prop, value });
      return;
    }
    host?.onTurkuiUpdateComponent?.(windowId, id, prop, value);
  }

  /**
   * Gösterim öncesi yapılan seçimleri sıraya alır.
   *
   * `liste`, `seçimKutusu` ve `sekme` bileşenlerinde `seç()` pencere
   * görünmeden çağrılabilir. Bu durumda seçim `pendingUpdates` kuyruğuna
   * eklenir ve `göster()` sırasında öğeler eklendikten sonra uygulanır.
   */
  function secimGuncelle(windowId: string, id: string, prop: string, value: any): void {
    const state = windowStates[windowId];
    if (!state) return;
    if (state.shown) {
      updateComponent(windowId, id, prop, value);
      return;
    }
    if (!state.pendingUpdates) state.pendingUpdates = [];
    state.pendingUpdates.push({ id, prop, value });
  }

  function kopruYok(komut: string): never {
    throw new Error(
      `TürkUI.${komut} bu ortamda desteklenmiyor: pencere ve diyalog köprüsü kurulamamış.`
    );
  }

  function metinArg(v: any): string {
    if (v === null || v === undefined) return '';
    return String(v);
  }

  function uzantiListesi(v: any): string[] {
    if (v === null || v === undefined || v === '') return [];
    const dizi = Array.isArray(v) ? v : String(v).split(',');
    const out: string[] = [];
    for (const x of dizi) {
      const s = String(x).trim().replace(/^\./, '');
      if (s.length > 0) out.push(s);
    }
    return out;
  }

  function cozumleYol(p: string): string {
    if (pathModule.isAbsolute(p)) return p;
    const temel = host?.baseDir || process.cwd();
    return pathModule.join(temel, p);
  }

  /**
   * Logo dosyasını çözer: mutlak yol doğrudan kullanılır, göreli yol önce
   * program klasöründe, bulunamazsa üst klasörlerde aranır.
   *
   * Böylece `src/ana.tr` içinden `logo.png` yazıldığında proje kökündeki
   * `logo.png` de bulunur.
   */
  function logoYoluBul(p: string): string {
    if (pathModule.isAbsolute(p)) return p;
    const temel = pathModule.resolve(host?.baseDir || process.cwd());
    let klasor = temel;
    for (;;) {
      const aday = pathModule.join(klasor, p);
      try {
        if (fsModule.existsSync(aday)) return aday;
      } catch {
        /* izin hatası: üst klasöre devam */
      }
      const ust = pathModule.dirname(klasor);
      if (ust === klasor) return pathModule.join(temel, p);
      klasor = ust;
    }
  }

  function pencereProps(wId: string): Record<string, any> {
    const props = windowStates[wId]?.componentProps[''] || {};
    const out: Record<string, any> = {};
    for (const [anahtar, deger] of Object.entries(props)) {
      if (anahtar.startsWith('_')) continue;
      out[anahtar] = deger;
    }
    if (out['açılışAnimasyonu'] === undefined) out['açılışAnimasyonu'] = 'solma';
    return out;
  }

  async function dosyaDiyalogu(
    tur: 'ac' | 'kaydet' | 'klasor',
    baslik: any,
    varsayilan: any,
    uzantilar: any
  ): Promise<string> {
    const komut = tur === 'ac' ? 'dosyaSeç' : tur === 'kaydet' ? 'dosyaKaydet' : 'klasörSeç';
    if (!host?.onTurkuiDosya) kopruYok(komut);
    const yol = await host.onTurkuiDosya(tur, metinArg(baslik), metinArg(varsayilan), uzantiListesi(uzantilar));
    return typeof yol === 'string' ? yol : '';
  }

  function defineStringProp(obj: any, key: string, wId: string, compId: string, def: string): void {
    Object.defineProperty(obj, key, {
      get: () => windowStates[wId]?.componentProps[compId]?.[key] ?? def,
      set: (val) => {
        if (!windowStates[wId]) return;
        if (!windowStates[wId].componentProps[compId]) windowStates[wId].componentProps[compId] = {};
        windowStates[wId].componentProps[compId][key] = val;
        if (windowStates[wId].shown) updateComponent(wId, compId, key, val);
      },
      configurable: true,
      enumerable: true,
    });
  }

  function defineColorProp(obj: any, key: string, wId: string, compId: string, def: string): void {
    Object.defineProperty(obj, key, {
      get: () => {
        const oku = () => {
          const stored = windowStates[wId]?.componentProps[compId]?.[key];
          if (stored === undefined || stored === null) return def;
          return String(stored);
        };
        return createCanliRenkNesnesi(oku, (renk) => {
          if (!windowStates[wId]) return;
          if (!windowStates[wId].componentProps[compId]) windowStates[wId].componentProps[compId] = {};
          windowStates[wId].componentProps[compId][key] = renk;
          if (windowStates[wId].shown) updateComponent(wId, compId, key, renk);
        });
      },
      set: (val) => {
        if (!windowStates[wId]) return;
        if (!windowStates[wId].componentProps[compId]) windowStates[wId].componentProps[compId] = {};
        if (val === 'gizle') {
          windowStates[wId].componentProps[compId][key] = '';
          if (windowStates[wId].shown) updateComponent(wId, compId, key, '');
          return;
        }
        if (val && typeof val === 'object') {
          if (val._turkolGeçiş) {
            windowStates[wId].componentProps[compId][key] = val.toColor;
            if (windowStates[wId].shown) updateComponent(wId, compId, key, val);
            return;
          }
          if (val._turkolRenk) {
            windowStates[wId].componentProps[compId][key] = val.renk;
            if (windowStates[wId].shown) updateComponent(wId, compId, key, val.renk);
            return;
          }
        }
        windowStates[wId].componentProps[compId][key] = val;
        if (windowStates[wId].shown) updateComponent(wId, compId, key, val);
      },
      configurable: true,
      enumerable: true,
    });
  }

  function aliasProp(obj: any, alias: string, target: string, _wId: string, _compId: string): void {
    Object.defineProperty(obj, alias, {
      get: () => obj[target],
      set: (val) => {
        obj[target] = val;
      },
      configurable: true,
      enumerable: true,
    });
  }

  function defineNumProp(obj: any, key: string, wId: string, compId: string, def: number): void {
    Object.defineProperty(obj, key, {
      get: () => windowStates[wId]?.componentProps[compId]?.[key] ?? def,
      set: (val) => {
        if (!windowStates[wId]) return;
        if (!windowStates[wId].componentProps[compId]) windowStates[wId].componentProps[compId] = {};
        windowStates[wId].componentProps[compId][key] = val;
        if (windowStates[wId].shown) updateComponent(wId, compId, key, val);
      },
      configurable: true,
      enumerable: true,
    });
  }

  function defineBoolProp(obj: any, key: string, wId: string, compId: string, def: boolean): void {
    Object.defineProperty(obj, key, {
      get: () => windowStates[wId]?.componentProps[compId]?.[key] ?? def,
      set: (val) => {
        if (!windowStates[wId]) return;
        if (!windowStates[wId].componentProps[compId]) windowStates[wId].componentProps[compId] = {};
        windowStates[wId].componentProps[compId][key] = val;
        if (windowStates[wId].shown) updateComponent(wId, compId, key, val);
      },
      configurable: true,
      enumerable: true,
    });
  }

  function transitionableAction(action: (süre: number) => void): any {
    const fn: any = () => {
      action(0);
    };
    fn.geçiş = (süre: any) => {
      const d = Number(süre);
      action(Number.isFinite(d) && d > 0 ? d : 0);
    };
    return fn;
  }

  function makeComponentBase(id: string, type: string, wId: string): Record<string, any> {
    const setVisible = (visible: boolean, süre: number): void => {
      if (!windowStates[wId]) return;
      if (!windowStates[wId].componentProps[id]) windowStates[wId].componentProps[id] = {};
      const props = windowStates[wId].componentProps[id];
      props._visible = visible;
      if (süre > 0) props._visibleGeçiş = süre;
      else delete props._visibleGeçiş;
      if (windowStates[wId].shown) {
        if (süre > 0) updateComponent(wId, id, '_visibleGeçiş', süre);
        updateComponent(wId, id, '_visible', visible);
      }
    };
    const obj: Record<string, any> = {
      _turkuiType: 'component',
      _componentId: id,
      _windowId: wId,
      _type: type,
      göster: transitionableAction((s) => setVisible(true, s)),
      gizle: transitionableAction((s) => setVisible(false, s)),
      sağ: (miktar: any) => {
        const m = Number(miktar);
        if (!Number.isFinite(m)) return;
        obj.x = (obj.x || 0) + m;
      },
      sol: (miktar: any) => {
        const m = Number(miktar);
        if (!Number.isFinite(m)) return;
        obj.x = (obj.x || 0) - m;
      },
      aşağı: (miktar: any) => {
        const m = Number(miktar);
        if (!Number.isFinite(m)) return;
        obj.y = (obj.y || 0) + m;
      },
      yukarı: (miktar: any) => {
        const m = Number(miktar);
        if (!Number.isFinite(m)) return;
        obj.y = (obj.y || 0) - m;
      },
    };
    defineNumProp(obj, 'x', wId, id, 0);
    defineNumProp(obj, 'y', wId, id, 0);
    defineNumProp(obj, 'right', wId, id, undefined as any);
    defineNumProp(obj, 'genişlik', wId, id, 0);
    defineNumProp(obj, 'yükseklik', wId, id, 0);
    defineNumProp(obj, 'şeffaflık', wId, id, 1);
    defineColorProp(obj, 'arkaPlan', wId, id, '');
    defineNumProp(obj, 'kenar', wId, id, 0);
    defineColorProp(obj, 'kenarRengi', wId, id, '#45475a');
    defineNumProp(obj, 'kenarKalınlığı', wId, id, 0);
    defineNumProp(obj, 'yuvarlaklık', wId, id, 0);
    defineNumProp(obj, 'dolgu', wId, id, 0);
    // CSS sınıfı ve bileşene özel CSS bildirimleri.
    defineStringProp(obj, 'sınıf', wId, id, '');
    defineStringProp(obj, 'stil', wId, id, '');
    return obj;
  }

  function makeTextComponent(id: string, wId: string, text: string): Record<string, any> {
    const obj = makeComponentBase(id, 'text', wId);
    defineStringProp(obj, 'içerik', wId, id, text);
    defineColorProp(obj, 'renk', wId, id, '#cdd6f4');
    aliasProp(obj, 'yazıRenk', 'renk', wId, id);
    defineNumProp(obj, 'yazıBoyutu', wId, id, 15);
    defineStringProp(obj, 'yazıTipi', wId, id, 'Segoe UI');
    defineBoolProp(obj, 'kalın', wId, id, false);
    defineBoolProp(obj, 'italik', wId, id, false);
    defineBoolProp(obj, 'altıÇizili', wId, id, false);
    defineStringProp(obj, 'hizalama', wId, id, 'left');
    obj.değiştir = (yeniMetin: any) => {
      obj.içerik = String(yeniMetin);
    };
    obj.temizle = () => {
      obj.içerik = '';
    };
    return obj;
  }

  function makeButtonComponent(id: string, wId: string, label: string): Record<string, any> {
    const obj = makeComponentBase(id, 'button', wId);
    defineStringProp(obj, 'metin', wId, id, label);
    defineColorProp(obj, 'renk', wId, id, '#1e1e2e');
    aliasProp(obj, 'yazıRenk', 'renk', wId, id);
    defineColorProp(obj, 'arkaPlan', wId, id, '#89b4fa');
    defineNumProp(obj, 'yazıBoyutu', wId, id, 14);
    defineNumProp(obj, 'kenar', wId, id, 0);
    defineColorProp(obj, 'kenarRengi', wId, id, '');
    defineNumProp(obj, 'kenarKalınlığı', wId, id, 0);
    defineNumProp(obj, 'yuvarlaklık', wId, id, 6);
    defineBoolProp(obj, 'etkin', wId, id, true);
    obj.etkinleştir = () => {
      obj.etkin = true;
    };
    obj.devreDışıBırak = () => {
      obj.etkin = false;
    };
    obj.metinDeğiştir = (yeniMetin: any) => {
      obj.metin = String(yeniMetin);
    };
    return obj;
  }

  function makeInputComponent(id: string, wId: string, placeholder: string): Record<string, any> {
    const obj = makeComponentBase(id, 'input', wId);
    defineStringProp(obj, 'değer', wId, id, '');
    defineStringProp(obj, 'yerTutucu', wId, id, placeholder);
    defineColorProp(obj, 'renk', wId, id, '#cdd6f4');
    aliasProp(obj, 'yazıRenk', 'renk', wId, id);
    defineColorProp(obj, 'arkaPlan', wId, id, '#313244');
    defineNumProp(obj, 'yazıBoyutu', wId, id, 14);
    defineBoolProp(obj, 'şifre', wId, id, false);
    defineBoolProp(obj, 'etkin', wId, id, true);
    obj.ayarla = (yeniDeğer: any) => {
      obj.değer = String(yeniDeğer);
    };
    obj.temizle = () => {
      obj.değer = '';
    };
    obj.odaklan = () => {
      if (windowStates[wId]?.shown) updateComponent(wId, id, '_focus', true);
    };
    obj.odağıKaldır = () => {
      if (windowStates[wId]?.shown) updateComponent(wId, id, '_blur', true);
    };
    return obj;
  }

  function makeBoxComponent(id: string, wId: string): Record<string, any> {
    const obj = makeComponentBase(id, 'box', wId);
    defineNumProp(obj, 'kenar', wId, id, 0);
    defineColorProp(obj, 'kenarRengi', wId, id, '#45475a');
    defineNumProp(obj, 'kenarKalınlığı', wId, id, 1);
    defineNumProp(obj, 'yuvarlaklık', wId, id, 8);
    defineNumProp(obj, 'dolgu', wId, id, 0);
    defineNumProp(obj, 'aralık', wId, id, 8);
    const children: any[] = [];

    obj.ekle = (child: any) => {
      const childId = child && child._componentId;
      if (!childId || !windowStates[wId] || children.indexOf(child) >= 0) return;
      children.push(child);
      if (!windowStates[wId].componentProps[childId]) {
        windowStates[wId].componentProps[childId] = {};
      }
      windowStates[wId].componentProps[childId]._parentId = id;
      if (windowStates[wId].shown) updateComponent(wId, id, '_addChild', childId);
    };

    obj.çıkar = (child: any) => {
      const idx = children.indexOf(child);
      if (idx >= 0) children.splice(idx, 1);
      const childId = child && child._componentId;
      if (childId && windowStates[wId]) {
        if (windowStates[wId].componentProps[childId]) {
          delete windowStates[wId].componentProps[childId]._parentId;
        }
        if (windowStates[wId].shown) updateComponent(wId, id, '_removeChild', childId);
      }
    };

    obj.temizle = () => {
      for (const child of children) {
        const childId = child && child._componentId;
        if (childId && windowStates[wId]?.componentProps[childId]) {
          delete windowStates[wId].componentProps[childId]._parentId;
        }
        if (childId && windowStates[wId]?.shown) {
          updateComponent(wId, id, '_removeChild', childId);
        }
      }
      children.length = 0;
    };

    obj.çocukEkle = obj.ekle;
    obj.çocukÇıkar = obj.çıkar;
    return obj;
  }

  function makeListComponent(id: string, wId: string): Record<string, any> {
    const items: string[] = [];
    const obj = makeComponentBase(id, 'list', wId);
    defineStringProp(obj, 'seçili', wId, id, '');
    defineNumProp(obj, 'seçiliİndeks', wId, id, -1);
    defineColorProp(obj, 'renk', wId, id, '#cdd6f4');
    aliasProp(obj, 'yazıRenk', 'renk', wId, id);
    obj.ekle = (item: any) => {
      const s = String(item);
      items.push(s);
      if (windowStates[wId]?.shown) {
        updateComponent(wId, id, '_addItem', s);
      } else if (windowStates[wId]) {
        if (!windowStates[wId].pendingItemAdditions) windowStates[wId].pendingItemAdditions = [];
        windowStates[wId].pendingItemAdditions.push({ id, item: s });
      }
    };
    obj.sil = (item: any) => {
      const idx = typeof item === 'number' ? item : items.indexOf(String(item));
      if (idx >= 0 && idx < items.length) {
        items.splice(idx, 1);
        if (windowStates[wId]?.shown) updateComponent(wId, id, '_removeItem', idx);
      }
    };
    obj.temizle = () => {
      items.length = 0;
      if (windowStates[wId]?.shown) updateComponent(wId, id, '_clearItems', true);
    };
    obj.seç = (idx: any) => {
      const i = Number(idx);
      if (i >= 0 && i < items.length) {
        obj.seçili = items[i];
        obj.seçiliİndeks = i;
        secimGuncelle(wId, id, '_selectIndex', i);
      }
    };
    return obj;
  }

  function makeImageComponent(id: string, wId: string, source: string): Record<string, any> {
    const obj = makeComponentBase(id, 'image', wId);
    defineStringProp(obj, 'kaynak', wId, id, source);
    defineBoolProp(obj, 'oran', wId, id, true);
    defineBoolProp(obj, 'doldur', wId, id, false);
    obj.değiştir = (yeniKaynak: any) => {
      obj.kaynak = String(yeniKaynak);
    };
    return obj;
  }

  function makeProgressComponent(id: string, wId: string): Record<string, any> {
    const obj = makeComponentBase(id, 'progress', wId);
    defineNumProp(obj, 'değer', wId, id, 0);
    defineNumProp(obj, 'minimum', wId, id, 0);
    defineNumProp(obj, 'maksimum', wId, id, 100);
    defineColorProp(obj, 'renk', wId, id, '#89b4fa');
    aliasProp(obj, 'yazıRenk', 'renk', wId, id);
    obj.artır = (miktar: any) => {
      obj.değer = Math.min(obj.maksimum, obj.değer + Number(miktar));
    };
    obj.azalt = (miktar: any) => {
      obj.değer = Math.max(obj.minimum, obj.değer - Number(miktar));
    };
    obj.sıfırla = () => {
      obj.değer = obj.minimum;
    };
    return obj;
  }

  function makeCheckboxComponent(id: string, wId: string, label: string): Record<string, any> {
    const obj = makeComponentBase(id, 'checkbox', wId);
    defineBoolProp(obj, 'seçili', wId, id, false);
    defineStringProp(obj, 'metin', wId, id, label);
    defineColorProp(obj, 'renk', wId, id, '#cdd6f4');
    aliasProp(obj, 'yazıRenk', 'renk', wId, id);
    obj.seç = () => {
      obj.seçili = true;
    };
    obj.kaldır = () => {
      obj.seçili = false;
    };
    return obj;
  }

  function makeTextAreaComponent(id: string, wId: string, placeholder: string): Record<string, any> {
    const obj = makeComponentBase(id, 'textarea', wId);
    defineStringProp(obj, 'değer', wId, id, '');
    defineStringProp(obj, 'yerTutucu', wId, id, placeholder);
    defineColorProp(obj, 'renk', wId, id, '#cdd6f4');
    aliasProp(obj, 'yazıRenk', 'renk', wId, id);
    defineColorProp(obj, 'arkaPlan', wId, id, '#313244');
    defineNumProp(obj, 'yazıBoyutu', wId, id, 14);
    defineNumProp(obj, 'satır', wId, id, 5);
    defineNumProp(obj, 'sütun', wId, id, 30);
    defineBoolProp(obj, 'saltOkunur', wId, id, false);
    defineBoolProp(obj, 'sözcükKaydırma', wId, id, true);
    defineBoolProp(obj, 'etkin', wId, id, true);
    obj.ayarla = (yeniDeğer: any) => {
      obj.değer = String(yeniDeğer);
    };
    obj.temizle = () => {
      obj.değer = '';
    };
    obj.ekle = (ek: any) => {
      obj.değer = obj.değer + String(ek);
    };
    obj.odaklan = () => {
      if (windowStates[wId]?.shown) updateComponent(wId, id, '_focus', true);
    };
    obj.odağıKaldır = () => {
      if (windowStates[wId]?.shown) updateComponent(wId, id, '_blur', true);
    };
    return obj;
  }

  function makeSliderComponent(id: string, wId: string, min: number, max: number): Record<string, any> {
    const obj = makeComponentBase(id, 'slider', wId);
    defineNumProp(obj, 'değer', wId, id, min);
    defineNumProp(obj, 'minimum', wId, id, min);
    defineNumProp(obj, 'maksimum', wId, id, max);
    defineNumProp(obj, 'adım', wId, id, 1);
    defineBoolProp(obj, 'dikey', wId, id, false);
    defineColorProp(obj, 'renk', wId, id, '#89b4fa');
    defineColorProp(obj, 'arkaPlan', wId, id, '#313244');
    obj.artır = (miktar: any) => {
      obj.değer = Math.min(obj.maksimum, obj.değer + Number(miktar));
    };
    obj.azalt = (miktar: any) => {
      obj.değer = Math.max(obj.minimum, obj.değer - Number(miktar));
    };
    obj.sıfırla = () => {
      obj.değer = obj.minimum;
    };
    return obj;
  }

  function makeSwitchComponent(id: string, wId: string, label: string): Record<string, any> {
    const obj = makeComponentBase(id, 'switch', wId);
    defineBoolProp(obj, 'açık', wId, id, false);
    defineStringProp(obj, 'metin', wId, id, label);
    defineColorProp(obj, 'renk', wId, id, '#cdd6f4');
    aliasProp(obj, 'yazıRenk', 'renk', wId, id);
    defineBoolProp(obj, 'etkin', wId, id, true);
    obj.aç = () => {
      obj.açık = true;
    };
    obj.kapat = () => {
      obj.açık = false;
    };
    obj.değiştir = () => {
      obj.açık = !obj.açık;
    };
    return obj;
  }

  function makeRadioComponent(id: string, wId: string, items: any[]): Record<string, any> {
    const allItems: string[] = [];
    const obj = makeComponentBase(id, 'radio', wId);
    defineStringProp(obj, 'seçili', wId, id, '');
    defineNumProp(obj, 'seçiliİndeks', wId, id, -1);
    defineColorProp(obj, 'renk', wId, id, '#cdd6f4');
    aliasProp(obj, 'yazıRenk', 'renk', wId, id);
    obj.ekle = (item: any) => {
      const s = String(item);
      allItems.push(s);
      if (windowStates[wId]?.shown) {
        updateComponent(wId, id, '_addItem', s);
      } else if (windowStates[wId]) {
        if (!windowStates[wId].pendingItemAdditions) windowStates[wId].pendingItemAdditions = [];
        windowStates[wId].pendingItemAdditions.push({ id, item: s });
      }
    };
    obj.sil = (item: any) => {
      const idx = typeof item === 'number' ? item : allItems.indexOf(String(item));
      if (idx >= 0 && idx < allItems.length) {
        allItems.splice(idx, 1);
        if (windowStates[wId]?.shown) updateComponent(wId, id, '_removeItem', idx);
      }
    };
    obj.temizle = () => {
      allItems.length = 0;
      if (windowStates[wId]?.shown) updateComponent(wId, id, '_clearItems', true);
    };
    obj.seç = (idx: any) => {
      const i = Number(idx);
      if (i >= 0 && i < allItems.length) {
        obj.seçili = allItems[i];
        obj.seçiliİndeks = i;
        if (windowStates[wId]?.shown) updateComponent(wId, id, '_selectIndex', i);
      }
    };
    for (const it of items) obj.ekle(it);
    return obj;
  }

  function makeComboComponent(id: string, wId: string): Record<string, any> {
    const items: string[] = [];
    const obj = makeComponentBase(id, 'combo', wId);
    defineStringProp(obj, 'seçili', wId, id, '');
    defineNumProp(obj, 'seçiliİndeks', wId, id, -1);
    obj.ekle = (item: any) => {
      const s = String(item);
      items.push(s);
      if (windowStates[wId]?.shown) {
        updateComponent(wId, id, '_addItem', s);
      } else if (windowStates[wId]) {
        if (!windowStates[wId].pendingItemAdditions) windowStates[wId].pendingItemAdditions = [];
        windowStates[wId].pendingItemAdditions.push({ id, item: s });
      }
    };
    obj.sil = (item: any) => {
      const idx = typeof item === 'number' ? item : items.indexOf(String(item));
      if (idx >= 0 && idx < items.length) {
        items.splice(idx, 1);
        if (windowStates[wId]?.shown) updateComponent(wId, id, '_removeItem', idx);
      }
    };
    obj.temizle = () => {
      items.length = 0;
      if (windowStates[wId]?.shown) updateComponent(wId, id, '_clearItems', true);
    };
    obj.seç = (idx: any) => {
      const i = Number(idx);
      if (i >= 0 && i < items.length) {
        obj.seçili = items[i];
        obj.seçiliİndeks = i;
        secimGuncelle(wId, id, '_selectIndex', i);
      }
    };
    return obj;
  }

  function makeTabComponent(id: string, wId: string): Record<string, any> {
    const tabs: string[] = [];
    const obj = makeComponentBase(id, 'tab', wId);
    defineStringProp(obj, 'seçili', wId, id, '');
    defineNumProp(obj, 'seçiliİndeks', wId, id, -1);
    obj.ekle = (tabName: any) => {
      const s = String(tabName);
      tabs.push(s);
      if (windowStates[wId]?.shown) {
        updateComponent(wId, id, '_addTab', s);
      } else if (windowStates[wId]) {
        if (!windowStates[wId].pendingItemAdditions) windowStates[wId].pendingItemAdditions = [];
        windowStates[wId].pendingItemAdditions.push({ id, item: s, prop: '_addTab' });
      }
    };
    obj.sil = (tabName: any) => {
      const idx = typeof tabName === 'number' ? tabName : tabs.indexOf(String(tabName));
      if (idx >= 0 && idx < tabs.length) {
        const s = tabs[idx];
        tabs.splice(idx, 1);
        if (windowStates[wId]?.shown) {
          updateComponent(wId, id, '_removeTab', idx);
        } else if (windowStates[wId]?.pendingItemAdditions) {
          windowStates[wId].pendingItemAdditions = windowStates[wId].pendingItemAdditions.filter(
            (x) => !(x.id === id && x.item === s && x.prop === '_addTab')
          );
        }
      }
    };
    obj.temizle = () => {
      tabs.length = 0;
      if (windowStates[wId]?.shown) {
        updateComponent(wId, id, '_clearTabs', true);
      } else if (windowStates[wId]?.pendingItemAdditions) {
        windowStates[wId].pendingItemAdditions = windowStates[wId].pendingItemAdditions.filter(
          (x) => x.id !== id
        );
      }
    };
    obj.seç = (tabName: any) => {
      const s = String(tabName);
      const idx = tabs.indexOf(s);
      if (idx >= 0) {
        obj.seçili = s;
        obj.seçiliİndeks = idx;
        secimGuncelle(wId, id, '_selectTab', s);
      }
    };
    return obj;
  }

  function makeSpacerComponent(id: string, wId: string): Record<string, any> {
    const obj = makeComponentBase(id, 'flexSpace', wId);
    defineNumProp(obj, 'büyüme', wId, id, 1);
    return obj;
  }

  /** Ses bileşeni: pencerede görünmez bir `<audio>` öğesi olarak çalışır. */
  function makeAudioComponent(
    id: string,
    wId: string,
    kaynak: string,
    dongu: boolean
  ): Record<string, any> {
    const obj = makeComponentBase(id, 'audio', wId);
    defineStringProp(obj, 'kaynak', wId, id, kaynak);
    defineBoolProp(obj, 'döngü', wId, id, dongu);
    defineNumProp(obj, 'sesSeviyesi', wId, id, 1);
    defineNumProp(obj, 'konum', wId, id, 0);
    defineNumProp(obj, 'süre', wId, id, 0);
    defineBoolProp(obj, 'kontroller', wId, id, false);
    const komut = (ad: string): void => {
      secimGuncelle(wId, id, '_audioKomut', { komut: ad });
    };
    obj.çal = () => komut('çal');
    obj.duraklat = () => komut('duraklat');
    obj.durdur = () => komut('durdur');
    obj.başaAl = () => komut('başaAl');
    obj.değiştir = (yeniKaynak: any) => {
      obj.kaynak = String(yeniKaynak);
    };
    return obj;
  }

  /** Tablo bileşeni: başlıklı satır/sütun ızgarası. */
  function makeTableComponent(id: string, wId: string, basliklar: string[]): Record<string, any> {
    const rows: string[][] = [];
    const basliklarKopya = basliklar.slice();
    const obj = makeComponentBase(id, 'table', wId);
    defineNumProp(obj, 'seçiliİndeks', wId, id, -1);
    defineBoolProp(obj, 'şeritli', wId, id, true);
    defineBoolProp(obj, 'başlıkGöster', wId, id, true);
    defineColorProp(obj, 'renk', wId, id, '#cdd6f4');
    aliasProp(obj, 'yazıRenk', 'renk', wId, id);
    defineColorProp(obj, 'arkaPlan', wId, id, '#1e1e2e');
    defineColorProp(obj, 'kenarRengi', wId, id, '#45475a');
    defineNumProp(obj, 'yazıBoyutu', wId, id, 14);
    Object.defineProperty(obj, 'başlıklar', {
      get: () => basliklarKopya.slice(),
      set: () => undefined,
      enumerable: true,
      configurable: true,
    });
    Object.defineProperty(obj, 'satırlar', {
      get: () => rows.map((satir) => satir.slice()),
      set: () => undefined,
      enumerable: true,
      configurable: true,
    });
    /** Liste veya sözlük değerini başlık sırasına göre metin satırına çevirir. */
    const satirDegerleri = (satir: any): string[] => {
      if (Array.isArray(satir)) return satir.map((hucre) => metinArg(hucre));
      if (satir && typeof satir === 'object') {
        const anahtarlar = basliklarKopya;
        const kaynak = satir as Record<string, any>;
        if (anahtarlar.length > 0) {
          return anahtarlar.map((anahtar) =>
            kaynak[anahtar] === undefined ? '' : metinArg(kaynak[anahtar])
          );
        }
        return Object.values(kaynak).map((hucre) => metinArg(hucre));
      }
      return [metinArg(satir)];
    };
    obj.satırEkle = (satir: any) => {
      const degerler = satirDegerleri(satir);
      rows.push(degerler);
      secimGuncelle(wId, id, '_addRow', degerler);
    };
    obj.satırSil = (indeks: any) => {
      const i = Number(indeks);
      if (!Number.isInteger(i) || i < 0 || i >= rows.length) return;
      rows.splice(i, 1);
      secimGuncelle(wId, id, '_removeRow', i);
    };
    obj.temizle = () => {
      rows.length = 0;
      secimGuncelle(wId, id, '_clearRows', true);
    };
    obj.hücreAyarla = (satir: any, sütun: any, deger: any) => {
      const s = Number(satir);
      const k = Number(sütun);
      if (!rows[s] || k < 0) return;
      rows[s][k] = metinArg(deger);
      secimGuncelle(wId, id, '_setCell', { satır: s, sütun: k, değer: rows[s][k] });
    };
    obj.seç = (indeks: any) => {
      const i = Number(indeks);
      if (!Number.isInteger(i) || i < 0 || i >= rows.length) return;
      obj.seçiliİndeks = i;
      secimGuncelle(wId, id, '_selectRow', i);
    };
    obj.başlıklarıAyarla = (yeni: any) => {
      const liste = Array.isArray(yeni) ? yeni.map((x) => metinArg(x)) : [metinArg(yeni)];
      basliklarKopya.length = 0;
      basliklarKopya.push(...liste);
      secimGuncelle(wId, id, '_setHeaders', basliklarKopya.slice());
    };
    return obj;
  }

  /** Modal (katman) bileşeni: pencereyi kaplayan, başlangıçta gizli kart. */
  function makeModalComponent(id: string, wId: string, baslik: string): Record<string, any> {
    const obj = makeComponentBase(id, 'modal', wId);
    defineStringProp(obj, 'başlık', wId, id, baslik);
    defineNumProp(obj, 'genişlik', wId, id, 420);
    defineNumProp(obj, 'karartma', wId, id, 0.55);
    defineBoolProp(obj, 'kapatmaDüğmesi', wId, id, true);
    defineColorProp(obj, 'arkaPlan', wId, id, '#1e1e2e');
    defineColorProp(obj, 'renk', wId, id, '#cdd6f4');
    defineNumProp(obj, 'yuvarlaklık', wId, id, 12);
    defineNumProp(obj, 'dolgu', wId, id, 16);
    defineNumProp(obj, 'aralık', wId, id, 10);
    const children: any[] = [];

    obj.ekle = (child: any) => {
      const childId = child && child._componentId;
      if (!childId || !windowStates[wId] || children.indexOf(child) >= 0) return;
      children.push(child);
      if (!windowStates[wId].componentProps[childId]) {
        windowStates[wId].componentProps[childId] = {};
      }
      windowStates[wId].componentProps[childId]._parentId = id;
      if (windowStates[wId].shown) updateComponent(wId, id, '_addChild', childId);
    };

    obj.çıkar = (child: any) => {
      const idx = children.indexOf(child);
      if (idx >= 0) children.splice(idx, 1);
      const childId = child && child._componentId;
      if (childId && windowStates[wId]) {
        if (windowStates[wId].componentProps[childId]) {
          delete windowStates[wId].componentProps[childId]._parentId;
        }
        if (windowStates[wId].shown) updateComponent(wId, id, '_removeChild', childId);
      }
    };

    obj.temizle = () => {
      for (const child of children) {
        const childId = child && child._componentId;
        if (childId && windowStates[wId]?.componentProps[childId]) {
          delete windowStates[wId].componentProps[childId]._parentId;
        }
        if (childId && windowStates[wId]?.shown) {
          updateComponent(wId, id, '_removeChild', childId);
        }
      }
      children.length = 0;
    };

    obj.çocukEkle = obj.ekle;
    obj.çocukÇıkar = obj.çıkar;
    obj.kapat = () => {
      obj.gizle();
    };
    return obj;
  }

  function sayiArg(v: any, varsayilan: number): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : varsayilan;
  }

  function renkMetni(v: any, varsayilan: string): string {
    if (v && typeof v === 'object') {
      if ((v as any)._turkolRenk) return String((v as any).renk);
      if ((v as any)._turkolGeçiş) return String((v as any).toColor);
    }
    if (typeof v === 'string' && v.trim() !== '') return v;
    return varsayilan;
  }

  /** HTML/CSS ile serbest bileşen. Shadow DOM sayesinde CSS dışarı sızmaz. */
  function makeCustomComponent(
    id: string,
    wId: string,
    html: string,
    css: string
  ): Record<string, any> {
    const obj = makeComponentBase(id, 'custom', wId);
    defineStringProp(obj, 'html', wId, id, html);
    aliasProp(obj, 'içerik', 'html', wId, id);
    defineStringProp(obj, 'css', wId, id, css);
    obj.değiştir = (yeniHtml: any) => {
      obj.html = String(yeniHtml);
    };
    obj.htmlEkle = (ek: any) => {
      obj.html = String(obj.html ?? '') + String(ek);
    };
    obj.stilEkle = (ek: any) => {
      obj.css = String(obj.css ?? '') + '\n' + String(ek);
    };
    return obj;
  }

  /**
   * Gömülü web tarayıcı bileşeni (Windows Forms `WebBrowser` benzeri).
   *
   * Electron çalışma zamanında `<webview>`, Edge/VS Code webview ortamında
   * `<iframe>` kullanılır. Adres ve HTML değişiklikleri renderer'a iletilir;
   * gezinme durumu (`geriGidebilir`, `başlık`, ...) olaylarla geri yazılır.
   */
  function makeWebBrowserComponent(id: string, wId: string, adres: string): Record<string, any> {
    const obj = makeComponentBase(id, 'webBrowser', wId);
    defineStringProp(obj, 'adres', wId, id, adres);
    aliasProp(obj, 'url', 'adres', wId, id);
    defineStringProp(obj, 'html', wId, id, '');
    defineStringProp(obj, 'anaSayfa', wId, id, '');
    defineStringProp(obj, 'başlık', wId, id, '');
    defineBoolProp(obj, 'yükleniyor', wId, id, false);
    defineBoolProp(obj, 'geriGidebilir', wId, id, false);
    defineBoolProp(obj, 'ileriGidebilir', wId, id, false);
    defineNumProp(obj, 'yakınlaştırma', wId, id, 1);

    const git = (hedef?: any) => {
      const ham = metinArg(hedef).trim();
      if (ham) {
        obj.adres = ham;
        return;
      }
      const ana = metinArg(obj.anaSayfa).trim();
      if (ana) obj.adres = ana;
    };
    obj.git = git;
    obj.aç = git;

    const komut = (ad: string) => {
      if (windowStates[wId]?.shown) updateComponent(wId, id, ad, true);
    };
    obj.geri = () => komut('_webGeri');
    obj.ileri = () => komut('_webIleri');
    obj.yenile = () => komut('_webYenile');
    obj.durdur = () => komut('_webDurdur');
    obj.anaSayfayaGit = () => {
      const ana = metinArg(obj.anaSayfa).trim();
      if (ana) obj.adres = ana;
    };
    obj.htmlYükle = (icerik: any) => {
      obj.html = metinArg(icerik);
    };
    obj.belgeYaz = obj.htmlYükle;
    obj.yakınlaştır = (deger: any) => {
      const n = Number(deger);
      if (!Number.isFinite(n)) return;
      obj.yakınlaştırma = Math.min(5, Math.max(0.25, n));
    };
    obj.yakınlaştırmaSıfırla = () => {
      obj.yakınlaştırma = 1;
    };
    return obj;
  }

  /** Canvas 2B çizim bileşeni. Komutlar önce biriktirilir, pencere açılınca uygulanır. */
  function makeCanvasComponent(
    id: string,
    wId: string,
    genislik: number,
    yukseklik: number
  ): Record<string, any> {
    const obj = makeComponentBase(id, 'canvas', wId);
    defineNumProp(obj, 'genişlik', wId, id, genislik);
    defineNumProp(obj, 'yükseklik', wId, id, yukseklik);
    const gonder = (komut: Record<string, any>): void => {
      updateComponent(wId, id, '_canvasKomut', komut);
    };
    obj.temizle = () => gonder({ komut: 'temizle' });
    obj.arkaPlanDoldur = (renk: any) =>
      gonder({ komut: 'arkaPlan', renk: renkMetni(renk, '#1e1e2e') });
    obj.çizgi = (x1: any, y1: any, x2: any, y2: any, renk?: any, kalınlık?: any) =>
      gonder({
        komut: 'çizgi',
        x1: sayiArg(x1, 0),
        y1: sayiArg(y1, 0),
        x2: sayiArg(x2, 0),
        y2: sayiArg(y2, 0),
        renk: renkMetni(renk, '#89b4fa'),
        kalınlık: sayiArg(kalınlık, 2),
      });
    obj.dikdörtgen = (
      x: any,
      y: any,
      genislikArg: any,
      yukseklikArg: any,
      renk?: any,
      dolgu?: any,
      kalınlık?: any
    ) =>
      gonder({
        komut: 'dikdörtgen',
        x: sayiArg(x, 0),
        y: sayiArg(y, 0),
        genişlik: sayiArg(genislikArg, 0),
        yükseklik: sayiArg(yukseklikArg, 0),
        renk: renkMetni(renk, '#89b4fa'),
        dolgu: dolgu === true,
        kalınlık: sayiArg(kalınlık, 2),
      });
    obj.daire = (x: any, y: any, yarıçap: any, renk?: any, dolgu?: any, kalınlık?: any) =>
      gonder({
        komut: 'daire',
        x: sayiArg(x, 0),
        y: sayiArg(y, 0),
        yarıçap: sayiArg(yarıçap, 0),
        renk: renkMetni(renk, '#89b4fa'),
        dolgu: dolgu === true,
        kalınlık: sayiArg(kalınlık, 2),
      });
    obj.yay = (
      x: any,
      y: any,
      yarıçap: any,
      başlangıç: any,
      bitiş: any,
      renk?: any,
      kalınlık?: any
    ) =>
      gonder({
        komut: 'yay',
        x: sayiArg(x, 0),
        y: sayiArg(y, 0),
        yarıçap: sayiArg(yarıçap, 0),
        başlangıç: sayiArg(başlangıç, 0),
        bitiş: sayiArg(bitiş, Math.PI * 2),
        renk: renkMetni(renk, '#89b4fa'),
        kalınlık: sayiArg(kalınlık, 2),
      });
    obj.yazı = (
      metin: any,
      x: any,
      y: any,
      boyut?: any,
      renk?: any,
      yazıTipi?: any
    ) =>
      gonder({
        komut: 'yazı',
        metin: metinArg(metin),
        x: sayiArg(x, 0),
        y: sayiArg(y, 0),
        boyut: sayiArg(boyut, 16),
        renk: renkMetni(renk, '#cdd6f4'),
        yazıTipi: metinArg(yazıTipi) || 'Segoe UI',
      });
    obj.görsel = (kaynak: any, x: any, y: any, genislikArg?: any, yukseklikArg?: any) =>
      gonder({
        komut: 'görsel',
        kaynak: metinArg(kaynak),
        x: sayiArg(x, 0),
        y: sayiArg(y, 0),
        genişlik: sayiArg(genislikArg, 0),
        yükseklik: sayiArg(yukseklikArg, 0),
      });
    return obj;
  }

  function makeLayoutBase(id: string, wId: string, layoutType: string): Record<string, any> {
    const setVisibleLayout = (visible: boolean, süre: number): void => {
      if (!windowStates[wId]) return;
      if (!windowStates[wId].componentProps[id]) windowStates[wId].componentProps[id] = {};
      const props = windowStates[wId].componentProps[id];
      props._visible = visible;
      if (süre > 0) props._visibleGeçiş = süre;
      else delete props._visibleGeçiş;
      if (windowStates[wId].shown) {
        if (süre > 0) updateComponent(wId, id, '_visibleGeçiş', süre);
        updateComponent(wId, id, '_visible', visible);
      }
    };
    const obj: Record<string, any> = {
      _turkuiType: 'component',
      _componentId: id,
      _windowId: wId,
      _type: layoutType,
      _children: [],
      göster: transitionableAction((s) => setVisibleLayout(true, s)),
      gizle: transitionableAction((s) => setVisibleLayout(false, s)),
      ekle: (child: any) => {
        const childId = child && child._componentId;
        if (!childId || !windowStates[wId]) return;
        if (obj._children.indexOf(child) >= 0) return;
        obj._children.push(child);
        if (!windowStates[wId].componentProps[childId]) windowStates[wId].componentProps[childId] = {};
        windowStates[wId].componentProps[childId]._parentId = id;
        if (windowStates[wId].shown) updateComponent(wId, id, '_addChild', childId);
      },
      çıkar: (child: any) => {
        const idx = obj._children.indexOf(child);
        if (idx >= 0) obj._children.splice(idx, 1);
        const childId = child && child._componentId;
        if (childId && windowStates[wId]) {
          if (windowStates[wId].componentProps[childId]) {
            delete windowStates[wId].componentProps[childId]._parentId;
          }
          if (windowStates[wId].shown) updateComponent(wId, id, '_removeChild', childId);
        }
      },
      temizle: () => {
        if (windowStates[wId]?.shown) {
          for (const child of obj._children) {
            if (child && child._componentId) updateComponent(wId, id, '_removeChild', child._componentId);
          }
        }
        obj._children = [];
      },
      sağ: (miktar: any) => {
        const m = Number(miktar);
        if (!Number.isFinite(m)) return;
        obj.x = (obj.x || 0) + m;
      },
      sol: (miktar: any) => {
        const m = Number(miktar);
        if (!Number.isFinite(m)) return;
        obj.x = (obj.x || 0) - m;
      },
      aşağı: (miktar: any) => {
        const m = Number(miktar);
        if (!Number.isFinite(m)) return;
        obj.y = (obj.y || 0) + m;
      },
      yukarı: (miktar: any) => {
        const m = Number(miktar);
        if (!Number.isFinite(m)) return;
        obj.y = (obj.y || 0) - m;
      },
    };
    defineNumProp(obj, 'x', wId, id, 0);
    defineNumProp(obj, 'y', wId, id, 0);
    defineNumProp(obj, 'right', wId, id, undefined as any);
    defineNumProp(obj, 'genişlik', wId, id, 0);
    defineNumProp(obj, 'yükseklik', wId, id, 0);
    defineNumProp(obj, 'şeffaflık', wId, id, 1);
    defineColorProp(obj, 'arkaPlan', wId, id, '');
    defineNumProp(obj, 'aralık', wId, id, 8);
    defineNumProp(obj, 'dolgu', wId, id, 0);
    defineNumProp(obj, 'kenar', wId, id, 0);
    defineColorProp(obj, 'kenarRengi', wId, id, '#45475a');
    defineNumProp(obj, 'kenarKalınlığı', wId, id, 0);
    defineNumProp(obj, 'yuvarlaklık', wId, id, 0);
    defineStringProp(obj, 'hizalama', wId, id, 'sol');
    defineStringProp(obj, 'çaprazHizalama', wId, id, 'doldur');
    defineStringProp(
      obj,
      'yön',
      wId,
      id,
      layoutType === 'yatayLayout' ? 'yatay' : layoutType === 'gridLayout' ? 'sütun' : 'dikey'
    );
    defineBoolProp(obj, 'sarma', wId, id, false);
    defineNumProp(obj, 'sütun', wId, id, 0);
    defineNumProp(obj, 'satır', wId, id, 0);
    defineStringProp(obj, 'sınıf', wId, id, '');
    defineStringProp(obj, 'stil', wId, id, '');
    return obj;
  }

  function buildPencere(title: string): Record<string, any> {
    const wId = generateId();
    const state = getOrCreateWindowState(wId, title);

    const win: Record<string, any> = {
      _turkuiType: 'window',
      _windowId: wId,
      _title: title,
      // Yorumlayıcı, `göster()` sonrası kaydedilen `pencereAçıldığında`
      // işleyicisini çalıştırabilmek için pencere durumunu okur.
      _gosterildi: false,
    };

    Object.defineProperty(win, 'başlık', {
      get: () => state.title,
      set: (val) => {
        state.title = String(val);
        if (state.shown) updateComponent(wId, '', '_title', String(val));
      },
      enumerable: true,
    });

    const arkaPlanProp = { value: '', changed: false };
    Object.defineProperty(win, 'arkaPlan', {
      get: () =>
        createCanliRenkNesnesi(
          () => arkaPlanProp.value,
          (renk) => {
            arkaPlanProp.value = renk;
            arkaPlanProp.changed = true;
            if (state.shown) updateComponent(wId, '', '_bg', renk);
          }
        ),
      set: (val) => {
        if (val && typeof val === 'object') {
          if (val._turkolGeçiş) {
            arkaPlanProp.value = val.toColor;
            arkaPlanProp.changed = true;
            if (state.shown) updateComponent(wId, '', '_bg', val);
            return;
          }
          if (val._turkolRenk) {
            arkaPlanProp.value = val.renk;
            arkaPlanProp.changed = true;
            if (state.shown) updateComponent(wId, '', '_bg', val.renk);
            return;
          }
        }
        arkaPlanProp.value = val;
        arkaPlanProp.changed = true;
        if (state.shown) updateComponent(wId, '', '_bg', val);
      },
      enumerable: true,
    });

    defineNumProp(win, 'genişlik', wId, '', 640);
    defineNumProp(win, 'yükseklik', wId, '', 480);
    defineNumProp(win, 'x', wId, '', 0);
    defineNumProp(win, 'y', wId, '', 0);
    defineNumProp(win, 'minGenişlik', wId, '', 400);
    defineNumProp(win, 'minYükseklik', wId, '', 300);
    defineNumProp(win, 'maksGenişlik', wId, '', 0);
    defineNumProp(win, 'maksYükseklik', wId, '', 0);
    defineNumProp(win, 'şeffaflık', wId, '', 1);
    defineBoolProp(win, 'herZamanÜstte', wId, '', false);
    aliasProp(win, 'üstte', 'herZamanÜstte', wId, '');
    defineBoolProp(win, 'çerçevesiz', wId, '', true);
    defineBoolProp(win, 'boyutlandırılabilir', wId, '', true);
    defineBoolProp(win, 'başlıkÇubuğu', wId, '', false);
    defineBoolProp(win, 'tamEkran', wId, '', false);
    defineBoolProp(win, 'küçültülebilir', wId, '', true);
    defineBoolProp(win, 'büyütülebilir', wId, '', true);
    defineBoolProp(win, 'kapatılabilir', wId, '', true);
    defineStringProp(win, 'ikon', wId, '', '');
    defineStringProp(win, 'arkaPlanResmi', wId, '', '');
    defineStringProp(win, 'açılışAnimasyonu', wId, '', 'solma');

    Object.defineProperty(win, 'boyut', {
      get: () => `${win.genişlik}x${win.yükseklik}`,
      set: () => undefined,
      enumerable: true,
    });

    Object.defineProperty(win, 'konum', {
      get: () => `${win.x},${win.y}`,
      set: () => undefined,
      enumerable: true,
    });

    function addToPending(type: string, id: string, props: Record<string, any>): void {
      if (!windowStates[wId]) return;
      if (windowStates[wId].shown) {
        sendComponent(wId, type, id, props);
      } else {
        windowStates[wId].pending.push({ type, id, props });
      }
      if (!windowStates[wId].componentProps[id]) windowStates[wId].componentProps[id] = {};
      Object.assign(windowStates[wId].componentProps[id], props);
    }

    win.metin = (text: any) => {
      const id = 'txt_' + (componentCounters['text'] = (componentCounters['text'] || 0) + 1);
      addToPending('text', id, { text: String(text) });
      return makeTextComponent(id, wId, String(text));
    };

    win.buton = (label: any) => {
      const id = 'btn_' + (componentCounters['button'] = (componentCounters['button'] || 0) + 1);
      addToPending('button', id, { label: String(label) });
      return makeButtonComponent(id, wId, String(label));
    };

    win.giriş = (placeholder: any) => {
      const id = 'inp_' + (componentCounters['input'] = (componentCounters['input'] || 0) + 1);
      addToPending('input', id, { placeholder: String(placeholder) });
      return makeInputComponent(id, wId, String(placeholder));
    };

    win.kutu = () => {
      const id = 'box_' + (componentCounters['box'] = (componentCounters['box'] || 0) + 1);
      addToPending('box', id, {});
      return makeBoxComponent(id, wId);
    };

    win.liste = () => {
      const id = 'lst_' + (componentCounters['list'] = (componentCounters['list'] || 0) + 1);
      addToPending('list', id, {});
      return makeListComponent(id, wId);
    };

    win.görsel = (source: any) => {
      const id = 'img_' + (componentCounters['image'] = (componentCounters['image'] || 0) + 1);
      addToPending('image', id, { kaynak: String(source) });
      return makeImageComponent(id, wId, String(source));
    };

    win.ilerleme = () => {
      const id = 'prg_' + (componentCounters['progress'] = (componentCounters['progress'] || 0) + 1);
      addToPending('progress', id, {});
      return makeProgressComponent(id, wId);
    };

    win.onayKutusu = (label: any) => {
      const id = 'chk_' + (componentCounters['checkbox'] = (componentCounters['checkbox'] || 0) + 1);
      addToPending('checkbox', id, { metin: String(label) });
      return makeCheckboxComponent(id, wId, String(label));
    };

    win.seçimKutusu = () => {
      const id = 'cmb_' + (componentCounters['combo'] = (componentCounters['combo'] || 0) + 1);
      addToPending('combo', id, {});
      return makeComboComponent(id, wId);
    };

    win.sekme = () => {
      const id = 'tab_' + (componentCounters['tab'] = (componentCounters['tab'] || 0) + 1);
      addToPending('tab', id, {});
      return makeTabComponent(id, wId);
    };

    win.dikeyDüzen = () => {
      const id = 'lay_' + (componentCounters['layout'] = (componentCounters['layout'] || 0) + 1);
      addToPending('dikeyLayout', id, {});
      return makeLayoutBase(id, wId, 'dikeyLayout');
    };

    win.yatayDüzen = () => {
      const id = 'lay_' + (componentCounters['layout'] = (componentCounters['layout'] || 0) + 1);
      addToPending('yatayLayout', id, {});
      return makeLayoutBase(id, wId, 'yatayLayout');
    };

    win.gridDüzen = () => {
      const id = 'lay_' + (componentCounters['layout'] = (componentCounters['layout'] || 0) + 1);
      addToPending('gridLayout', id, {});
      return makeLayoutBase(id, wId, 'gridLayout');
    };

    win.esnekAlan = () => {
      const id = 'spc_' + (componentCounters['flexSpace'] = (componentCounters['flexSpace'] || 0) + 1);
      addToPending('flexSpace', id, {});
      return makeSpacerComponent(id, wId);
    };

    win.metinAlanı = (placeholder: any) => {
      const id = 'txta_' + (componentCounters['textarea'] = (componentCounters['textarea'] || 0) + 1);
      const ph = placeholder === undefined || placeholder === null ? '' : String(placeholder);
      addToPending('textarea', id, { placeholder: ph });
      return makeTextAreaComponent(id, wId, ph);
    };

    win.kaydırıcı = (min: any, max: any) => {
      const id = 'sld_' + (componentCounters['slider'] = (componentCounters['slider'] || 0) + 1);
      const mn = Number(min);
      const mx = Number(max);
      const defMin = Number.isFinite(mn) ? mn : 0;
      const defMax = Number.isFinite(mx) ? mx : 100;
      addToPending('slider', id, { minimum: defMin, maksimum: defMax, değer: defMin });
      return makeSliderComponent(id, wId, defMin, defMax);
    };

    win.anahtar = (label: any) => {
      const id = 'sw_' + (componentCounters['switch'] = (componentCounters['switch'] || 0) + 1);
      const lbl = label === undefined || label === null ? '' : String(label);
      addToPending('switch', id, { metin: lbl });
      return makeSwitchComponent(id, wId, lbl);
    };

    win.radyo = (items: any) => {
      const id = 'rad_' + (componentCounters['radio'] = (componentCounters['radio'] || 0) + 1);
      addToPending('radio', id, {});
      const initial: any[] = Array.isArray(items) ? items : items === undefined || items === null ? [] : [items];
      return makeRadioComponent(id, wId, initial);
    };

    win.özel = (html: any, css?: any) => {
      const id = 'cus_' + (componentCounters['custom'] = (componentCounters['custom'] || 0) + 1);
      const h = metinArg(html);
      const c = metinArg(css);
      addToPending('custom', id, { html: h, css: c });
      return makeCustomComponent(id, wId, h, c);
    };

    win.canvas = (genislik?: any, yukseklik?: any) => {
      const id = 'cnv_' + (componentCounters['canvas'] = (componentCounters['canvas'] || 0) + 1);
      const g = Number(genislik);
      const y = Number(yukseklik);
      const gg = Number.isFinite(g) && g > 0 ? Math.round(g) : 640;
      const yy = Number.isFinite(y) && y > 0 ? Math.round(y) : 360;
      addToPending('canvas', id, { genişlik: gg, yükseklik: yy });
      return makeCanvasComponent(id, wId, gg, yy);
    };

    win.ses = (kaynak?: any, dongu?: any) => {
      const id = 'aud_' + (componentCounters['audio'] = (componentCounters['audio'] || 0) + 1);
      const k = metinArg(kaynak).trim();
      const d = dongu === true;
      addToPending('audio', id, {
        kaynak: k,
        döngü: d,
        sesSeviyesi: 1,
        konum: 0,
        süre: 0,
        kontroller: false,
      });
      return makeAudioComponent(id, wId, k, d);
    };

    win.tablo = (basliklar?: any) => {
      const id = 'tbl_' + (componentCounters['table'] = (componentCounters['table'] || 0) + 1);
      const liste = Array.isArray(basliklar)
        ? basliklar.map((b) => metinArg(b))
        : basliklar === undefined || basliklar === null || basliklar === ''
          ? []
          : [metinArg(basliklar)];
      addToPending('table', id, {
        başlıklar: liste,
        seçiliİndeks: -1,
        şeritli: true,
        başlıkGöster: true,
      });
      return makeTableComponent(id, wId, liste);
    };

    win.modal = (baslik?: any) => {
      const id = 'mdl_' + (componentCounters['modal'] = (componentCounters['modal'] || 0) + 1);
      const b = metinArg(baslik);
      addToPending('modal', id, {
        başlık: b,
        genişlik: 420,
        karartma: 0.55,
        kapatmaDüğmesi: true,
        arkaPlan: '#1e1e2e',
        renk: '#cdd6f4',
        yuvarlaklık: 12,
        dolgu: 16,
        aralık: 10,
        _visible: false,
      });
      return makeModalComponent(id, wId, b);
    };

    const webTarayici = (adres?: any) => {
      const id = 'web_' + (componentCounters['webBrowser'] = (componentCounters['webBrowser'] || 0) + 1);
      const a = metinArg(adres).trim();
      addToPending('webBrowser', id, {
        adres: a,
        html: '',
        anaSayfa: '',
        başlık: '',
        yükleniyor: false,
        geriGidebilir: false,
        ileriGidebilir: false,
        yakınlaştırma: 1,
      });
      return makeWebBrowserComponent(id, wId, a);
    };
    win.tarayıcı = webTarayici;
    win.webTarayıcı = webTarayici;
    win.webBrowser = webTarayici;

    win.stil = (css: any) => {
      const s = metinArg(css);
      if (windowStates[wId]) windowStates[wId].stil = s;
      if (windowStates[wId]?.shown) updateComponent(wId, '', '_css', s);
      return '';
    };
    win.css = win.stil;

    /**
     * `TürkUI.betik { pencere( ... ) }` bloğunu pencereye bağlar.
     *
     * Betik, renderer'da Türkçe JavaScript'ten gerçek JavaScript'e çevrilip
     * nonce'lu `<script>` ile çalıştırılır. `harita`, dosyadaki değişken
     * adlarını (`düğme`) bileşen kimliklerine (`btn_1`) bağlar.
     */
    win.betik = (kod: any, harita?: any, satir?: any, pencereler?: any) => {
      const k = metinArg(kod);
      const h: Record<string, string> =
        harita && typeof harita === 'object' ? { ...(harita as Record<string, string>) } : {};
      const p: Record<string, string> =
        pencereler && typeof pencereler === 'object'
          ? { ...(pencereler as Record<string, string>) }
          : {};
      const s = Number(satir);
      const paket = { kod: k, harita: h, satir: Number.isFinite(s) ? s : 0, pencereler: p };
      if (windowStates[wId]) windowStates[wId].betik = paket;
      if (windowStates[wId]?.shown) updateComponent(wId, '', '_betik', paket);
      return '';
    };

    win.merkezle = () => {
      if (windowStates[wId]?.shown) updateComponent(wId, '', '_center', true);
    };

    win.odaklan = () => {
      if (windowStates[wId]?.shown) updateComponent(wId, '', '_odaklan', true);
      return '';
    };

    win.pencereArkaPlanResmi = (dosya: any) => {
      const ham = metinArg(dosya).trim();
      const tam = ham === '' ? '' : cozumleYol(ham);
      win.arkaPlanResmi = tam;
      return tam;
    };
    win.arkaPlanResmiAyarla = win.pencereArkaPlanResmi;

    /**
     * `uygulama.logo("logo.png")` — pencereye logo (uygulama simgesi) atar.
     *
     * Yol, program klasörüne göre çözülür. Logo özel başlık çubuğunda görünür
     * ve pencere/görev çubuğu simgesi olarak kullanılır.
     */
    win.logo = (dosya: any) => {
      const ham = metinArg(dosya).trim();
      const tam = ham === '' ? '' : logoYoluBul(ham);
      if (windowStates[wId]) {
        if (!windowStates[wId].componentProps['']) windowStates[wId].componentProps[''] = {};
        windowStates[wId].componentProps['']['logo'] = tam;
      }
      // Aynı dosya pencere simgesi olarak da kullanılsın (Electron penceresi).
      win.ikon = tam;
      if (windowStates[wId]?.shown) updateComponent(wId, '', 'logo', tam);
      return tam;
    };

    win.göster = () => {
      if (host?.onTurkuiCreateWindow) {
        host.onTurkuiCreateWindow(state.title || title, wId, pencereProps(wId));
        for (const comp of windowStates[wId]?.pending || []) {
          const currentProps = windowStates[wId]?.componentProps[comp.id];
          const mergedProps = currentProps ? { ...comp.props, ...currentProps } : comp.props;
          sendComponent(wId, comp.type, comp.id, mergedProps);
        }
        if (windowStates[wId]?.pendingItemAdditions) {
          for (const add of windowStates[wId].pendingItemAdditions) {
            updateComponent(wId, add.id, add.prop || '_addItem', add.item);
          }
          // İlk gösterimde aktarılan öğeler tekrar gönderilmesin.
          windowStates[wId].pendingItemAdditions = [];
        }
        if (windowStates[wId]?.stil) {
          updateComponent(wId, '', '_css', windowStates[wId].stil);
        }
        if (windowStates[wId]?.betik) {
          updateComponent(wId, '', '_betik', windowStates[wId].betik);
        }
        if (windowStates[wId]?.pendingUpdates) {
          for (const update of windowStates[wId].pendingUpdates) {
            updateComponent(wId, update.id, update.prop, update.value, true);
          }
          windowStates[wId].pendingUpdates = [];
        }
        if (arkaPlanProp.changed) {
          updateComponent(wId, '', '_bg', arkaPlanProp.value);
        }
        host.onTurkuiShowWindow?.(wId);
      }
      if (windowStates[wId]) windowStates[wId].shown = true;
      win._gosterildi = true;
    };

    win.gizle = () => {
      if (windowStates[wId]?.shown) updateComponent(wId, '', '_hide', true);
    };
    win.küçült = () => {
      if (windowStates[wId]?.shown) updateComponent(wId, '', '_minimize', true);
    };
    win.büyüt = () => {
      if (windowStates[wId]?.shown) updateComponent(wId, '', '_maximize', true);
    };
    win.normal = () => {
      if (windowStates[wId]?.shown) updateComponent(wId, '', '_restore', true);
    };
    win.kapat = () => {
      if (windowStates[wId]?.shown) updateComponent(wId, '', '_close', true);
      if (windowStates[wId]) windowStates[wId].shown = false;
      win._gosterildi = false;
    };

    return win;
  }

  const turkuiMembers: Record<string, any> = {
    pencere: (title: any) => {
      const t = typeof title === 'string' ? title : String(title);
      return buildPencere(t);
    },

    uyarı: async (mesaj: any) => {
      if (!host?.onTurkuiIleti) kopruYok('uyarı');
      await host.onTurkuiIleti('uyarı', metinArg(mesaj));
      return '';
    },
    bilgi: async (mesaj: any) => {
      if (!host?.onTurkuiIleti) kopruYok('bilgi');
      await host.onTurkuiIleti('bilgi', metinArg(mesaj));
      return '';
    },
    onay: async (soru: any) => {
      if (!host?.onTurkuiIleti) kopruYok('onay');
      return (await host.onTurkuiIleti('onay', metinArg(soru))) === true;
    },
    sor: async (soru: any, varsayilan?: any) => {
      if (!host?.onTurkuiSor) kopruYok('sor');
      const vars = varsayilan === undefined || varsayilan === null ? '' : String(varsayilan);
      const cevap = await host.onTurkuiSor(metinArg(soru), vars);
      return cevap === undefined || cevap === null ? '' : String(cevap);
    },

    dosyaSeç: (baslik?: any, uzantilar?: any) => dosyaDiyalogu('ac', baslik, '', uzantilar),
    dosyaKaydet: (varsayilanAd?: any, uzantilar?: any) => dosyaDiyalogu('kaydet', '', varsayilanAd, uzantilar),
    klasörSeç: (baslik?: any) => dosyaDiyalogu('klasor', baslik, '', undefined),

    bildirim: async (baslik: any, icerik?: any) => {
      if (!host?.onTurkuiBildirim) kopruYok('bildirim');
      await host.onTurkuiBildirim(metinArg(baslik) || 'TürkUI', metinArg(icerik));
      return '';
    },

    hepsiKapat: () => {
      if (host?.onTurkuiHepsiKapat) {
        host.onTurkuiHepsiKapat();
      } else {
        for (const [id, st] of Object.entries(windowStates)) {
          if (st.shown) updateComponent(id, '', '_close', true);
        }
      }
      for (const st of Object.values(windowStates)) st.shown = false;
      return '';
    },
  };

  Object.defineProperty(turkuiMembers, 'ekran', {
    get: () => {
      if (!host?.onTurkuiEkran) kopruYok('ekran');
      const bilgi = host.onTurkuiEkran?.();
      if (!bilgi) kopruYok('ekran');
      return bilgi;
    },
    enumerable: true,
    configurable: true,
  });

  Object.defineProperty(turkuiMembers, 'pencereSayısı', {
    get: () => {
      if (host?.onTurkuiPencereSayisi) return host.onTurkuiPencereSayisi();
      return Object.values(windowStates).filter((s) => s.shown).length;
    },
    enumerable: true,
    configurable: true,
  });

  const fare: Record<string, any> = {
    x: 0,
    y: 0,
    solTık: false,
    sağTık: false,
    ortaTık: false,
    tekerlek: 0,
  };
  const klavye: Record<string, any> = { tuş: '', basıldığında: '', bırakıldığında: '' };

  turkuiMembers.fare = fare;
  turkuiMembers.klavye = klavye;

  const renk = createRenkNesnesi();
  turkuiMembers.renk = renk;

  host?.onTurkuiDurum?.(fare, klavye, renk);

  return { uyeler: turkuiMembers, fare, klavye, renk };
}
