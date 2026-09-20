/* BTHX Travel — lecture des métadonnées photo, sans dépendance.
   ------------------------------------------------------------------
   Extrait la position GPS et la date de prise de vue depuis :
     • JPEG  — segment APP1 / Exif
     • HEIC  — item « Exif » du conteneur ISOBMFF (format natif iPhone)
   Aucune bibliothèque externe : l'app doit fonctionner sans réseau.
*/

const Exif = (() => {

  /* ---------- Lecture bas niveau ---------- */
  class Reader {
    constructor(buf, le = false){ this.v = new DataView(buf); this.le = le; }
    u8 (o){ return this.v.getUint8(o); }
    u16(o){ return this.v.getUint16(o, this.le); }
    u32(o){ return this.v.getUint32(o, this.le); }
    i32(o){ return this.v.getInt32(o, this.le); }
    str(o, n){
      let s = '';
      for(let i=0;i<n;i++){ const c = this.v.getUint8(o+i); if(c===0) break; s += String.fromCharCode(c); }
      return s;
    }
    get size(){ return this.v.byteLength; }
  }

  const TYPE_SIZE = {1:1, 2:1, 3:2, 4:4, 5:8, 6:1, 7:1, 8:2, 9:4, 10:8, 11:4, 12:8};

  /* ---------- Parcours d'un IFD TIFF ---------- */
  function readIFD(r, tiffStart, ifdOffset, wanted){
    const out = {};
    const base = tiffStart + ifdOffset;
    if(base + 2 > r.size) return out;

    const count = r.u16(base);
    for(let i=0;i<count;i++){
      const e = base + 2 + i*12;
      if(e + 12 > r.size) break;

      const tag  = r.u16(e);
      if(!wanted.includes(tag)) continue;

      const type = r.u16(e+2);
      const num  = r.u32(e+4);
      const sz   = (TYPE_SIZE[type] || 1) * num;
      const at   = sz > 4 ? tiffStart + r.u32(e+8) : e + 8;
      if(at + sz > r.size) continue;

      out[tag] = readValue(r, at, type, num);
    }
    return out;
  }

  function readValue(r, at, type, num){
    switch(type){
      case 2: return r.str(at, num);                               // ASCII
      case 3: return num === 1 ? r.u16(at)
                               : Array.from({length:num}, (_,k)=>r.u16(at+k*2));
      case 4: return num === 1 ? r.u32(at)
                               : Array.from({length:num}, (_,k)=>r.u32(at+k*4));
      case 5: {                                                    // RATIONAL
        const one = k => { const d = r.u32(at+k*8+4); return d ? r.u32(at+k*8)/d : 0; };
        return num === 1 ? one(0) : Array.from({length:num}, (_,k)=>one(k));
      }
      case 10: {                                                   // SRATIONAL
        const one = k => { const d = r.i32(at+k*8+4); return d ? r.i32(at+k*8)/d : 0; };
        return num === 1 ? one(0) : Array.from({length:num}, (_,k)=>one(k));
      }
      default: return r.u8(at);
    }
  }

  /* ---------- Bloc TIFF -> {lat, lon, date} ---------- */
  function parseTiff(buf, tiffStart){
    const head = new Reader(buf);
    if(tiffStart + 8 > head.size) return null;

    const order = head.u16(tiffStart);                 // 0x4949 = II, 0x4D4D = MM
    if(order !== 0x4949 && order !== 0x4D4D) return null;

    const r = new Reader(buf, order === 0x4949);
    if(r.u16(tiffStart + 2) !== 42) return null;

    const ifd0 = readIFD(r, tiffStart, r.u32(tiffStart + 4), [0x8769, 0x8825, 0x0132]);
    const res  = { lat:null, lon:null, date:null };

    // Date de prise de vue
    if(ifd0[0x8769]){
      const ex = readIFD(r, tiffStart, ifd0[0x8769], [0x9003, 0x9004]);
      const d  = ex[0x9003] || ex[0x9004];
      if(d) res.date = parseExifDate(d);
    }
    if(!res.date && ifd0[0x0132]) res.date = parseExifDate(ifd0[0x0132]);

    // Position
    if(ifd0[0x8825]){
      const g = readIFD(r, tiffStart, ifd0[0x8825], [0x0001, 0x0002, 0x0003, 0x0004]);
      const lat = dms(g[0x0002], g[0x0001]);
      const lon = dms(g[0x0004], g[0x0003]);
      if(lat !== null && lon !== null && (lat !== 0 || lon !== 0)){
        res.lat = lat; res.lon = lon;
      }
    }
    return res;
  }

  function dms(parts, ref){
    if(!Array.isArray(parts) || parts.length < 3) return null;
    const [d, m, s] = parts;
    let v = Math.abs(d) + (m || 0)/60 + (s || 0)/3600;
    if(ref === 'S' || ref === 'W') v = -v;
    return isFinite(v) ? v : null;
  }

  // "2026:09:22 14:03:51" — heure locale de la prise de vue
  function parseExifDate(s){
    const m = String(s).trim().match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
    if(!m) return null;
    const d = new Date(+m[1], +m[2]-1, +m[3], +m[4], +m[5], +m[6]);
    return isNaN(d) ? null : d;
  }

  /* ---------- JPEG : trouver le segment APP1 ---------- */
  function fromJpeg(buf){
    const r = new Reader(buf);
    if(r.size < 4 || r.u16(0) !== 0xFFD8) return null;       // pas un JPEG

    let o = 2;
    while(o + 4 < r.size){
      if(r.u8(o) !== 0xFF) { o++; continue; }                // resynchronisation
      const marker = r.u8(o + 1);
      if(marker === 0xD8 || marker === 0x01 || (marker >= 0xD0 && marker <= 0xD7)){ o += 2; continue; }
      if(marker === 0xDA || marker === 0xD9) break;          // début des données image

      const len = r.u16(o + 2);
      if(len < 2) break;

      if(marker === 0xE1 && r.str(o + 4, 4) === 'Exif'){
        return parseTiff(buf, o + 10);                        // "Exif\0\0" = 6 octets
      }
      o += 2 + len;
    }
    return null;
  }

  /* ---------- HEIC : item « Exif » du conteneur ISOBMFF ---------- */
  function fromHeic(buf){
    const r = new Reader(buf);                                // ISOBMFF = big endian
    const meta = findBox(r, 0, r.size, 'meta');
    if(!meta) return null;

    // 'meta' est une FullBox : 4 octets de version/flags avant ses enfants.
    const inner = meta.start + 4;
    const iinf  = findBox(r, inner, meta.end, 'iinf');
    const iloc  = findBox(r, inner, meta.end, 'iloc');
    if(!iinf || !iloc) return null;

    const exifId = findExifItemId(r, iinf);
    if(exifId === null) return null;

    const loc = findItemLocation(r, iloc, exifId);
    if(!loc || loc.offset + loc.length > r.size) return null;

    // L'item Exif commence par un offset 32 bits vers l'en-tête TIFF.
    const skip = r.u32(loc.offset);
    let tiff = loc.offset + 4 + skip;
    if(r.str(tiff, 4) === 'Exif') tiff += 6;                  // certains encodeurs gardent la signature
    return parseTiff(buf, tiff);
  }

  function findBox(r, from, to, name){
    let o = from;
    while(o + 8 <= to){
      let size = r.u32(o);
      const type = r.str(o + 4, 4);
      let head = 8;
      if(size === 1){                                          // taille 64 bits
        if(o + 16 > to) return null;
        const hi = r.u32(o + 8), lo = r.u32(o + 12);
        size = hi * 4294967296 + lo; head = 16;
      } else if(size === 0){
        size = to - o;
      }
      if(size < head) return null;
      if(type === name) return { start: o + head, end: Math.min(o + size, to) };
      o += size;
    }
    return null;
  }

  function findExifItemId(r, iinf){
    const ver = r.u8(iinf.start);
    let o = iinf.start + 4;
    let count;
    if(ver === 0){ count = r.u16(o); o += 2; }
    else         { count = r.u32(o); o += 4; }

    for(let i=0;i<count && o + 8 <= iinf.end;i++){
      const size = r.u32(o);
      if(size < 8) break;
      if(r.str(o + 4, 4) === 'infe'){
        const iv = r.u8(o + 8);
        let p = o + 12;                                        // après version/flags
        let id;
        if(iv >= 2){
          if(iv === 2){ id = r.u16(p); p += 2; } else { id = r.u32(p); p += 4; }
          p += 2;                                              // protection_index
          if(r.str(p, 4) === 'Exif') return id;
        }
      }
      o += size;
    }
    return null;
  }

  function findItemLocation(r, iloc, wantId){
    const ver = r.u8(iloc.start);
    let o = iloc.start + 4;

    const b1 = r.u8(o), b2 = r.u8(o + 1); o += 2;
    const offSize = b1 >> 4, lenSize = b1 & 15;
    const baseSize = b2 >> 4, idxSize = b2 & 15;

    let count;
    if(ver < 2){ count = r.u16(o); o += 2; }
    else       { count = r.u32(o); o += 4; }

    const readN = (at, n) => {
      if(n === 0) return 0;
      if(n === 4) return r.u32(at);
      if(n === 8) return r.u32(at) * 4294967296 + r.u32(at + 4);
      if(n === 2) return r.u16(at);
      return r.u8(at);
    };

    for(let i=0;i<count;i++){
      let id;
      if(ver < 2){ id = r.u16(o); o += 2; } else { id = r.u32(o); o += 4; }
      if(ver === 1 || ver === 2) o += 2;                        // construction_method
      o += 2;                                                   // data_reference_index

      const base = readN(o, baseSize); o += baseSize;
      const extents = r.u16(o); o += 2;

      for(let e=0;e<extents;e++){
        if((ver === 1 || ver === 2) && idxSize > 0) o += idxSize;
        const off = readN(o, offSize); o += offSize;
        const len = readN(o, lenSize); o += lenSize;
        if(id === wantId && e === 0) return { offset: base + off, length: len };
      }
    }
    return null;
  }

  /* ---------- API ---------- */
  // On ne lit que le début du fichier : l'Exif y est toujours, et cela
  // évite de charger 5 Mo par photo en mémoire.
  const HEAD_BYTES = 3 * 1024 * 1024;

  async function parse(file){
    try{
      const slice = file.slice(0, Math.min(file.size, HEAD_BYTES));
      const buf   = await slice.arrayBuffer();
      return fromJpeg(buf) || fromHeic(buf) || null;
    }catch(e){
      console.warn('Exif', file && file.name, e);
      return null;
    }
  }

  return { parse };
})();
