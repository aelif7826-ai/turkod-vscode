/**
 * Türkçe betik (`TürkUI.betik`) kaynağını JavaScript'e çevirir.
 *
 * Renderer (`media/turkui-window.html`) çalışma anında kendi kopyasını kullanır;
 * burası denetleyicinin (Sorunlar paneli) söz dizimi kontrolü içindir. Tablolar
 * `betikSozcukleri.ts` dosyasından gelir, `test/betik.cjs` iki tarafın
 * ayrışmadığını doğrular.
 */
import {
  betikAnahtarKelimeleri,
  betikGenelAdlari,
  betikOlayAdlari,
  betikUyeAdlari,
} from './betikSozcukleri';

const tablo = (
  sozcukler: ReadonlyArray<{ ad: string; karsilik: string }>
): Record<string, string> => {
  const sonuc: Record<string, string> = {};
  for (const sozcuk of sozcukler) sonuc[sozcuk.ad] = sozcuk.karsilik;
  return sonuc;
};

const ANAHTAR = tablo(betikAnahtarKelimeleri);
const GENEL = tablo(betikGenelAdlari);
const UYE = tablo(betikUyeAdlari);
const OLAY = tablo(betikOlayAdlari);

/** Metin olarak yazılan ama JavaScript'te sabit değer isteyen adlar. */
const METIN: Record<string, string> = {
  ikiBoyut: '2d',
  ikiBoyutlu: '2d',
  üçBoyut: 'webgl',
};

const BASLANGIC = /[A-Za-zÇĞİÖŞÜçğıöşü_$]/;
const KARAKTER = /[\wÇĞİÖŞÜçğıöşü$]/;

/** `${ ... }` ifadesinin kapandığı `}` konumunu bulur. */
function ifadeSonu(metin: string, baslangic: number): number {
  let derinlik = 1;
  for (let k = baslangic; k < metin.length; k++) {
    const c = metin[k];
    if (c === '\\') {
      k++;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      const kapanis = c;
      k++;
      while (k < metin.length) {
        if (metin[k] === '\\') {
          k += 2;
          continue;
        }
        if (metin[k] === kapanis) break;
        k++;
      }
      continue;
    }
    if (c === '{') derinlik++;
    else if (c === '}') {
      derinlik--;
      if (derinlik === 0) return k;
    }
  }
  return metin.length;
}

/** Bir tanımlayıcının Türkçe karşılığını seçer (üye, anahtar veya genel). */
function adiCevir(
  ad: string,
  onceki: string,
  onceki2: string,
  metin: string,
  konum: number
): string {
  // Üye erişimi: `nesne.içerik` (yayma `...` hariç).
  if (onceki === '.' && onceki2 !== '.') return UYE[ad] || ad;
  // Nesne anahtarı: `{ içerik: "x" }` — anahtar adları çevrilmez.
  let k = konum;
  while (k < metin.length && /\s/.test(metin[k])) k++;
  if (metin[k] === ':' && metin[k + 1] !== '=') {
    let g = konum - ad.length - 1;
    while (g >= 0 && /\s/.test(metin[g])) g--;
    if (g < 0 || metin[g] === '{' || metin[g] === ',') return ad;
  }
  return ANAHTAR[ad] || GENEL[ad] || ad;
}

/** Yalnızca olay dinleyicisinin ilk argümanındaki adı çevirir. */
function olaylariCevir(kod: string): string {
  const olayli = kod.replace(
    /(\.\s*(?:addEventListener|removeEventListener|olayDinle|olayKaldır)\s*\(\s*)(["'])([^"']*)\2/g,
    (_tam, onEk: string, tirnak: string, ad: string) =>
      onEk + tirnak + (OLAY[ad] || ad) + tirnak
  );
  return olayli
    .replace(/(\.\s*(?:addEventListener|olayDinle)\s*\(\s*["'][^"']+["']\s*,\s*)function\s*\(/g, '$1async function(')
    .replace(/\bturkuiZaman\s*\.\s*bekle\s*\(/g, 'await turkuiZaman.bekle(');
}

/** Türkçe JavaScript kaynağını gerçek JavaScript'e çevirir. */
export function turkceBetik(kaynak: string): string {
  const metin = String(kaynak || '');
  let sonuc = '';
  let i = 0;
  let onceki = '';
  let onceki2 = '';

  const yaz = (parca: string): void => {
    sonuc += parca;
    for (let k = parca.length - 1; k >= 0; k--) {
      if (/\s/.test(parca[k])) continue;
      onceki2 = onceki;
      onceki = parca[k];
      return;
    }
  };

  while (i < metin.length) {
    const c = metin[i];

    // Satır yorumu
    if (c === '/' && metin[i + 1] === '/') {
      const son = metin.indexOf('\n', i);
      const parca = son < 0 ? metin.slice(i) : metin.slice(i, son);
      yaz(parca);
      i += parca.length;
      continue;
    }
    // Blok yorumu
    if (c === '/' && metin[i + 1] === '*') {
      const son = metin.indexOf('*/', i + 2);
      const parca = son < 0 ? metin.slice(i) : metin.slice(i, son + 2);
      yaz(parca);
      i += parca.length;
      continue;
    }
    // Metinler olduğu gibi korunur (yalnızca bilinen Türkçe adlar çevrilir).
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < metin.length) {
        if (metin[j] === '\\') {
          j += 2;
          continue;
        }
        if (metin[j] === c) {
          j++;
          break;
        }
        j++;
      }
      const kapandi = j > i + 1 && metin[j - 1] === c;
      const icerik = kapandi ? metin.slice(i + 1, j - 1) : '';
      const cevrilmis = kapandi && METIN[icerik] !== undefined;
      yaz(cevrilmis ? '"' + METIN[icerik] + '"' : metin.slice(i, j));
      i = j;
      continue;
    }
    // Şablon metni: `${ ... }` içi çevrilir, düz metin korunur.
    if (c === '`') {
      let j = i + 1;
      let parca = '`';
      while (j < metin.length) {
        if (metin[j] === '\\') {
          parca += metin.slice(j, j + 2);
          j += 2;
          continue;
        }
        if (metin[j] === '`') {
          parca += '`';
          j++;
          break;
        }
        if (metin[j] === '$' && metin[j + 1] === '{') {
          const ic = ifadeSonu(metin, j + 2);
          parca += '${' + turkceBetik(metin.slice(j + 2, ic)) + '}';
          j = ic + 1;
          continue;
        }
        parca += metin[j];
        j++;
      }
      yaz(parca);
      i = j;
      continue;
    }
    // Sayılar
    if (/[0-9]/.test(c)) {
      let j = i + 1;
      while (j < metin.length && /[0-9a-fA-FxX._eE]/.test(metin[j])) j++;
      if (/[eE]/.test(metin[j - 1]) && (metin[j] === '+' || metin[j] === '-')) j++;
      while (j < metin.length && /[0-9]/.test(metin[j])) j++;
      yaz(metin.slice(i, j));
      i = j;
      continue;
    }
    // Tanımlayıcılar
    if (BASLANGIC.test(c)) {
      let j = i + 1;
      while (j < metin.length && KARAKTER.test(metin[j])) j++;
      const ad = metin.slice(i, j);
      yaz(adiCevir(ad, onceki, onceki2, metin, j));
      i = j;
      continue;
    }
    // `:=` ataması JavaScript'te `=` olur.
    if (c === ':' && metin[i + 1] === '=') {
      yaz('=');
      i += 2;
      continue;
    }
    yaz(c);
    i++;
  }
  return olaylariCevir(sonuc);
}

/**
 * `TürkUI.betik { pencere( ... ) }` gövdesinden grup sarmalayıcılarını ayıklar.
 *
 * Çalışma anında bu grupları yorumlayıcı çözer; burada yalnızca söz dizimi
 * kontrolü için içerik birleştirilir.
 */
export function betikGovdeAyikla(govde: string): string {
  const parcalar: string[] = [];
  let i = 0;
  let grupBulundu = false;
  while (i < govde.length) {
    while (i < govde.length && /[\s;,]/.test(govde[i])) i++;
    if (i >= govde.length) break;
    const hedef = /^[A-Za-zÇĞİÖŞÜçğıöşü_$][\wÇĞİÖŞÜçğıöşü$]*/.exec(govde.slice(i));
    if (!hedef) return govde;
    let p = i + hedef[0].length;
    while (p < govde.length && /\s/.test(govde[p])) p++;
    if (govde[p] !== '(') return grupBulundu ? parcalar.join('\n') : govde;
    // Eşleşen kapanışı tırnak ve yorum farkındalıklı bul.
    let derinlik = 1;
    let tirnak = '';
    let blokYorum = false;
    let k = p + 1;
    for (; k < govde.length; k++) {
      const c = govde[k];
      if (blokYorum) {
        if (c === '*' && govde[k + 1] === '/') {
          blokYorum = false;
          k++;
        }
        continue;
      }
      if (tirnak) {
        if (c === '\\') {
          k++;
          continue;
        }
        if (c === tirnak) tirnak = '';
        continue;
      }
      if (c === '/' && govde[k + 1] === '/') {
        const son = govde.indexOf('\n', k);
        if (son < 0) {
          k = govde.length;
          break;
        }
        k = son;
        continue;
      }
      if (c === '/' && govde[k + 1] === '*') {
        blokYorum = true;
        k++;
        continue;
      }
      if (c === '"' || c === "'" || c === '`') {
        tirnak = c;
        continue;
      }
      if (c === '(') derinlik++;
      else if (c === ')') {
        derinlik--;
        if (derinlik === 0) break;
      }
    }
    parcalar.push(govde.slice(p + 1, k));
    grupBulundu = true;
    i = k + 1;
  }
  return parcalar.length > 0 ? parcalar.join('\n') : govde;
}

/** Betik gövdesindeki söz dizimi hatası (dosya satırı 1'den başlar). */
export interface BetikSozdizimiHatasi {
  /** Gövde içindeki satır numarası (1'den başlar). */
  satir: number;
  mesaj: string;
}

/**
 * Betik gövdesini çevirip JavaScript olarak derler; hata varsa satırıyla verir.
 * Kod çalıştırılmaz, yalnızca derlenir.
 */
export function betikSozdizimiHatasi(govde: string): BetikSozdizimiHatasi | null {
  if (!govde.trim()) return null;
  let js: string;
  try {
    js = turkceBetik(betikGovdeAyikla(govde));
  } catch (e) {
    return { satir: 1, mesaj: e instanceof Error ? e.message : String(e) };
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const vm = require('vm') as typeof import('vm');
    new vm.Script(js, { filename: 'betik.js' });
    return null;
  } catch (e) {
    const hata = e as Error;
    const mesaj = hata.message || String(e);
    const eslesme = /betik\.js:(\d+)/.exec(String(hata.stack || ''));
    const satir = eslesme ? Number(eslesme[1]) : 1;
    return { satir: satir > 0 ? satir : 1, mesaj };
  }
}
