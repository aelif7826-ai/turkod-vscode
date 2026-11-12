/** Türkod'un temel 3D sahnesini Ursina programına dönüştürür. */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { spawn } from 'node:child_process';
import { oyunModulPythonYolu } from './oyunIndirici';

interface OyunKupBilgisi {
  renk: string;
  konum: [number, number, number];
  boyut: [number, number, number];
}

interface OyunGrubu {
  tur: 'küp' | 'küre' | 'duvar' | 'zemin' | 'oyuncu' | 'ışık' | 'gökyüzü';
  kaynak: string;
  baslangic: number;
}

interface OyunNesnesi {
  renk: string;
  konum: [number, number, number];
  boyut: [number, number, number];
  hiz: number;
  sicrama: number;
  model: string;
  donus: [number, number, number];
  doku: string | undefined;
  carpismasi: string;
}

const RENKLER: Record<string, string> = {
  turuncu: 'orange',
  kırmızı: 'red',
  yeşil: 'green',
  mavi: 'azure',
  sarı: 'yellow',
  mor: 'violet',
  beyaz: 'white',
  siyah: 'black',
  turkuaz: 'cyan',
  pembe: 'pink',
  kahverengi: 'brown',
  gri: 'gray',
  // Ursina'nın renk paletinde navy/lime adları bulunmuyor.
  // Yakın ve desteklenen renkleri kullan; üretilen Python'da AttributeError oluşmasın.
  lacivert: 'blue',
  lime: 'green',
};

function vektorOku(deger: string, alan: string, satir: number): [number, number, number] {
  const eslesme = /^\(\s*(-?\d+(?:[.,]\d+)?)\s*,\s*(-?\d+(?:[.,]\d+)?)\s*,\s*(-?\d+(?:[.,]\d+)?)\s*\)$/.exec(deger.trim());
  if (!eslesme) throw new Error(`Oyun.sahne (${satir}. satır): "${alan}" üç sayı içeren (x, y, z) vektörü olmalı.`);
  return [Number(eslesme[1].replace(',', '.')), Number(eslesme[2].replace(',', '.')), Number(eslesme[3].replace(',', '.'))];
}

function oyunGruplari(kaynak: string): OyunGrubu[] {
  const gruplar: OyunGrubu[] = [];
  const baslik = /(küp|küre|duvar|zemin|oyuncu|ışık|gökyüzü)\s*\(/g;
  let m: RegExpExecArray | null;
  while ((m = baslik.exec(kaynak)) !== null) {
    let derinlik = 1;
    let tirnak = '';
    let son = baslik.lastIndex;
    for (; son < kaynak.length; son++) {
      const c = kaynak[son];
      if (tirnak) {
        if (c === '\\') son++;
        else if (c === tirnak) tirnak = '';
        continue;
      }
      if (c === '"' || c === "'") tirnak = c;
      else if (c === '(') derinlik++;
      else if (c === ')' && --derinlik === 0) break;
    }
    if (derinlik !== 0) throw new Error('Oyun.sahne: `küp(` çağrısının `)` kapanışı eksik.');
    gruplar.push({ tur: m[1] as OyunGrubu['tur'], kaynak: kaynak.slice(baslik.lastIndex, son), baslangic: m.index });
    baslik.lastIndex = son + 1;
  }
  return gruplar;
}

function oyunNesnesiCoz(grup: OyunGrubu, temelSatir: number): OyunNesnesi {
  const nesne: OyunNesnesi = {
    renk: grup.tur === 'zemin' ? 'green' : grup.tur === 'ışık' ? 'white' : grup.tur === 'gökyüzü' ? 'azure' : 'orange',
    konum: grup.tur === 'zemin' ? [0, -0.5, 0] : grup.tur === 'oyuncu' ? [0, 1, 0] : [0, 0, 0],
    boyut: grup.tur === 'zemin' ? [30, 1, 30] : [1, 1, 1],
    hiz: 6,
    sicrama: 7,
    model: grup.tur === 'küre' ? 'sphere' : grup.tur === 'duvar' ? 'cube' : grup.tur === 'gökyüzü' ? 'sky' : 'cube',
    donus: [0, 0, 0],
    doku: undefined,
    carpismasi: grup.tur === 'ışık' || grup.tur === 'gökyüzü' ? 'yok' : grup.tur === 'küre' ? 'küre' : 'kutu',
  };
  const alanlar = new Set<string>();
  const satirlar = grup.kaynak.split(/\r?\n/);
  for (let i = 0; i < satirlar.length; i++) {
    const satir = satirlar[i].trim().replace(/[;,]$/, '');
    if (!satir) continue;
    const m = /^(renk|konum|boyut|hız|sıçrama|model|dönüş|doku|çarpışma)\s*:\s*(.+)$/.exec(satir);
    if (!m) throw new Error(`Oyun.sahne (${temelSatir + i}. satır): "${satir}" tanınmadı.`);
    if ((grup.tur === 'ışık' || grup.tur === 'gökyüzü') && !['renk', 'konum', 'boyut'].includes(m[1])) {
      throw new Error(`Oyun.sahne (${temelSatir + i}. satır): ${grup.tur} için bu alan kullanılamaz.`);
    }
    if (alanlar.has(m[1])) throw new Error(`Oyun.sahne (${temelSatir + i}. satır): "${m[1]}" alanı küpte bir kez yazılabilir.`);
    alanlar.add(m[1]);
    if (m[1] === 'renk') {
      const ad = m[2].replace(/^['"]|['"]$/g, '').toLocaleLowerCase('tr-TR');
      const renk = RENKLER[ad];
      if (!renk) throw new Error(`Oyun.sahne (${temelSatir + i}. satır): bilinmeyen renk "${m[2]}".`);
      nesne.renk = renk;
    } else if (m[1] === 'konum') nesne.konum = vektorOku(m[2], m[1], temelSatir + i);
    else if (m[1] === 'boyut') nesne.boyut = vektorOku(m[2], m[1], temelSatir + i);
    else if (m[1] === 'hız' || m[1] === 'sıçrama') {
      const sayi = Number(m[2]);
      if (!Number.isFinite(sayi) || sayi < 0 || sayi > 100) throw new Error(`Oyun.sahne (${temelSatir + i}. satır): ${m[1]} 0 ile 100 arasında olmalı.`);
      if (m[1] === 'hız') nesne.hiz = sayi; else nesne.sicrama = sayi;
    } else if (m[1] === 'dönüş') {
      nesne.donus = vektorOku(m[2], m[1], temelSatir + i);
    } else if (m[1] === 'doku') {
      const doku = m[2].replace(/^['"]|['"]$/g, '').trim();
      if (!doku || /[\r\n]/.test(doku)) throw new Error(`Oyun.sahne (${temelSatir + i}. satır): doku adı boş olamaz.`);
      nesne.doku = doku;
    } else if (m[1] === 'çarpışma') {
      const carpismasi = m[2].replace(/^['"]|['"]$/g, '').toLocaleLowerCase('tr-TR');
      if (!['kutu', 'küre', 'yok'].includes(carpismasi)) throw new Error(`Oyun.sahne (${temelSatir + i}. satır): çarpışma kutu, küre veya yok olmalı.`);
      nesne.carpismasi = carpismasi;
    } else {
      const model = m[2].replace(/^['"]|['"]$/g, '').toLocaleLowerCase('tr-TR');
      if (!['küp', 'küre', 'silindir', 'kapsül', 'düzlem'].includes(model)) throw new Error(`Oyun.sahne (${temelSatir + i}. satır): bilinmeyen model "${model}".`);
      nesne.model = ({ küp: 'cube', küre: 'sphere', silindir: 'cylinder', kapsül: 'capsule', düzlem: 'plane' } as Record<string, string>)[model];
    }
  }
  return nesne;
}

/** Basit sahne tanımını bağımsız bir Ursina Python programına dönüştürür. */
export function oyunSahnesiniPythonaCevir(kaynak: string, satir = 1): string {
  const gruplar = oyunGruplari(kaynak);
  if (gruplar.length === 0) throw new Error('Oyun.sahne bloğuna `küp(...)`, `zemin(...)` veya `oyuncu(...)` ekleyin.');
  const nesneler = gruplar.map((grup) => {
    const grupSatiri = satir + kaynak.slice(0, grup.baslangic).split(/\r?\n/).length - 1;
    return { ...grup, nesne: oyunNesnesiCoz(grup, grupSatiri) };
  });
  const oyuncu = nesneler.find((grup) => grup.tur === 'oyuncu');
  const zeminler = nesneler.filter((grup) => grup.tur === 'zemin');
  const nesneSatirlari = nesneler.filter((grup) => ['küp', 'küre', 'duvar'].includes(grup.tur)).map(({ nesne, tur }) =>
    `Entity(model=${JSON.stringify(tur === 'duvar' ? 'cube' : nesne.model)}, color=color.${nesne.renk}, position=${JSON.stringify(nesne.konum)}, scale=${JSON.stringify(nesne.boyut)}, rotation=${JSON.stringify(nesne.donus)}, texture=${nesne.doku === undefined ? 'None' : JSON.stringify(nesne.doku)}, collider=${nesne.carpismasi === 'yok' ? 'None' : JSON.stringify(nesne.carpismasi === 'küre' ? 'sphere' : 'box')})`
  );
  const zeminSatirlari = zeminler.map(({ nesne }) =>
    `Entity(model='plane', color=color.${nesne.renk}, position=${JSON.stringify(nesne.konum)}, scale=${JSON.stringify(nesne.boyut)}, collider='box')`
  );
  const ortamSatirlari = nesneler.filter(({ tur }) => tur === 'ışık' || tur === 'gökyüzü').map(({ tur, nesne }) =>
    tur === 'ışık' ? `DirectionalLight(color=color.${nesne.renk}, position=${JSON.stringify(nesne.konum)})` : `Sky(color=color.${nesne.renk})`
  );
  const oyuncuSatiri = oyuncu
    ? [
        `oyuncu = Entity(position=${JSON.stringify(oyuncu.nesne.konum)})`,
        'kamera.parent = oyuncu',
        'kamera.position = (0, 1.6, 0)',
        `oyuncuHizi = ${oyuncu.nesne.hiz}`,
        'fareHizi = 40',
        'oyuncuDikeyHiz = 0',
        'oyuncuYerde = False',
        'fare.locked = True',
        'fare.visible = False',
        '',
        'def update():',
        '    global oyuncuDikeyHiz, oyuncuYerde',
        '    oyuncu.rotation_y += fare.velocity.x * fareHizi',
        '    kamera.rotation_x = max(-85, min(85, kamera.rotation_x - fare.velocity.y * fareHizi))',
        "    yon = oyuncu.forward * (tuslar['w'] - tuslar['s']) + oyuncu.right * (tuslar['d'] - tuslar['a'])",
        '    if yon.length() > 0:',
        '        oyuncu.position += yon.normalized() * oyuncuHizi * zaman.dt',
        '    oyuncuYerde = False',
        '    if oyuncuDikeyHiz <= 0:',
        "        zeminVurusu = raycast(oyuncu.position + Vec3(0, 0.2, 0), Vec3(0, -1, 0), distance=0.3, ignore=[oyuncu])",
        '        if zeminVurusu.hit:',
        '            oyuncu.y = zeminVurusu.world_point.y',
        '            oyuncuDikeyHiz = 0',
        '            oyuncuYerde = True',
        '    if not oyuncuYerde:',
        '        oyuncuDikeyHiz -= 20 * zaman.dt',
        '        oyuncu.y += oyuncuDikeyHiz * zaman.dt',
        '',
        'def input(tus):',
        '    global oyuncuDikeyHiz, oyuncuYerde',
        "    if tus == 'space' and oyuncuYerde:",
        `        oyuncuDikeyHiz = ${oyuncu.nesne.sicrama}`,
        '        oyuncuYerde = False',
        "    elif tus == 'escape':",
        '        fare.locked = False',
        '        fare.visible = True',
        "    elif tus == 'left mouse down':",
        '        fare.locked = True',
        '        fare.visible = False',
      ]
    : ['EditorCamera()'];
  return [
    'from ursina import Ursina, Entity, EditorCamera, DirectionalLight, Sky, color, camera as kamera, mouse as fare, held_keys as tuslar, time as zaman, Vec3, raycast',
    'app = Ursina()',
    ...(oyuncu && zeminler.length === 0
      ? ["Entity(model='plane', color=color.green, position=(0, -0.5, 0), scale=(30, 1, 30), collider='box')"]
      : zeminSatirlari),
    ...ortamSatirlari,
    ...nesneSatirlari,
    ...oyuncuSatiri,
    'app.run()',
    '',
  ].join('\n');
}

/** Python/Ursina sahnesini ayrı bir oyun penceresinde başlatır. */
export function ursinaSahnesiniBaslat(
  kaynak: string,
  calismaKlasoru: string,
  yaz: (metin: string) => void = (metin) => console.error(metin),
): void {
  const python = oyunModulPythonYolu();
  if (!python) throw new Error('Oyun modülü bulunamadı. `türkod yeni modül indir oyun` komutunu çalıştırın.');
  yaz(`Oyun sahnesi algılandı. Ursina başlatılıyor… (${python})`);
  const klasor = fs.mkdtempSync(path.join(os.tmpdir(), 'turkod-oyun-'));
  const betik = path.join(klasor, 'oyun.py');
  const hataDosyasi = path.join(klasor, 'hata.log');
  const girintiliKaynak = kaynak.split(/\r?\n/).map((satir) => `    ${satir}`).join('\n');
  const pythonKaynagi = [
    'try:',
    girintiliKaynak,
    // Ursina penceresi kapatılırken SystemExit kullanır; bu normal kapanıştır.
    'except Exception:',
    '    import traceback',
    '    hata = traceback.format_exc()',
    `    with open(${JSON.stringify(hataDosyasi)}, 'w', encoding='utf-8') as dosya: dosya.write(hata)`,
    '    try:',
    '        import ctypes',
    "        ctypes.windll.user32.MessageBoxW(0, hata, 'Türkod oyun hatası', 0x10)",
    '    except Exception:',
    '        pass',
    '    raise',
    'finally:',
    '    import os, shutil',
    '    shutil.rmtree(os.path.dirname(os.path.abspath(__file__)), ignore_errors=True)',
    '',
  ].join('\n');
  fs.writeFileSync(betik, pythonKaynagi, 'utf8');
  try {
    const surec = spawn(python, [betik], {
      cwd: calismaKlasoru,
      detached: true,
      stdio: 'ignore',
      windowsHide: false,
    });
    surec.once('error', (hata) => {
      try { fs.rmSync(klasor, { recursive: true, force: true }); } catch { /* geçici dosya temizliği */ }
      yaz(`Oyun penceresi başlatılamadı: ${hata.message}`);
    });
    surec.unref();
  } catch (hata) {
    try { fs.rmSync(klasor, { recursive: true, force: true }); } catch { /* geçici dosya temizliği */ }
    throw hata;
  }
}
