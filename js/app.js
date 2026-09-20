/* BTHX Travel — logique applicative
   Deux axes : Préparation (étapes du voyage) et Road book (journées reconstituées). */

'use strict';

/* ===================== État ===================== */
let trip = Store.load() || { name:"Nouveau voyage", start:"", end:"", sites:[], days:[] };
if(!trip.days) trip.days = [];
if(!trip.sites) trip.sites = [];

let pane       = 'prep';
let kindFilter = 'all';
let dayIndex   = 0;
let editingId  = null;
const maps     = { prep:null, book:null };
const layers   = { prep:{markers:[],route:null}, book:{markers:[],route:null} };
const routeOn  = { prep:false, book:false };
const urlCache = new Map();   // id photo -> objectURL

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const $   = id => document.getElementById(id);

/* ===================== Utilitaires ===================== */
function toast(msg, ms=2200){
  const t = $('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(()=>t.classList.remove('show'), ms);
}
function busy(on, text='Traitement…'){
  $('busyText').textContent = text;
  $('busy').hidden = !on;
}
function persist(){
  if(!Store.save(trip)){
    toast('⚠️ Sauvegarde impossible — mémoire pleine. Exportez puis effacez.', 5000);
  }
}
function fmtDate(iso){
  if(!iso) return '';
  const d = new Date(iso + (iso.length===10 ? 'T12:00:00' : ''));
  if(isNaN(d)) return iso;
  return d.toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'});
}
function fmtTime(ts){
  if(!ts) return '';
  return new Date(ts).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
}
function km(m){ return m>=1000 ? (m/1000).toFixed(m>=10000?0:1)+' km' : Math.round(m)+' m'; }
function dur(s){
  const h = Math.floor(s/3600), m = Math.round((s%3600)/60);
  return h ? `${h} h ${String(m).padStart(2,'0')}` : `${m} min`;
}
function haversine(a,b){
  const R=6371000, r=Math.PI/180;
  const dLat=(b.lat-a.lat)*r, dLon=(b.lon-a.lon)*r;
  const x = Math.sin(dLat/2)**2 + Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(x));
}
const KIND = {
  etape:{icon:'📍',label:'Étape'}, hotel:{icon:'🛏️',label:'Hôtel'},
  table:{icon:'🍽️',label:'Table'}, site:{icon:'⭐',label:'À voir'}
};
function escapeHtml(s){
  return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ===================== Cartes ===================== */
/* Deux fonds : le plan pour lire les routes et les noms de lieux,
   le satellite pour le road book. Le choix est mémorisé. */
const TILES = {
  plan: {
    url:'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attr:'© OpenStreetMap', max:19, label:'Plan'
  },
  sat: {
    url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr:'Esri, Maxar, Earthstar Geographics', max:19, label:'Satellite'
  }
};
let tileMode = localStorage.getItem('bthx.tiles') || 'plan';
const tileLayer = { prep:null, book:null };
const attrCtl   = { prep:null, book:null };

function applyTiles(which){
  const m = maps[which]; if(!m) return;
  const t = TILES[tileMode];
  if(tileLayer[which]) m.removeLayer(tileLayer[which]);
  tileLayer[which] = L.tileLayer(t.url, {maxZoom:t.max}).addTo(m);
  tileLayer[which].bringToBack();
  if(attrCtl[which]){
    attrCtl[which].addAttribution(t.attr);
    Object.values(TILES).forEach(o=>{ if(o.attr!==t.attr) attrCtl[which].removeAttribution(o.attr); });
  }
}
function toggleTiles(){
  tileMode = tileMode === 'plan' ? 'sat' : 'plan';
  try{ localStorage.setItem('bthx.tiles', tileMode); }catch(e){}
  ['prep','book'].forEach(applyTiles);
  syncTileButtons();
  toast(TILES[tileMode].label);
}
function syncTileButtons(){
  const sat = tileMode === 'sat';
  ['btnTilePrep','btnTileBook'].forEach(id=>{
    const b = $(id); if(!b) return;
    b.textContent = sat ? '🗺️' : '🛰️';
    b.classList.toggle('on', sat);
    b.title = sat ? 'Passer au plan' : 'Passer au satellite';
  });
}

function initMap(which, elId){
  if(maps[which]) return maps[which];
  // Leaflet vient d'un CDN. S'il n'a pas pu être mis en cache et qu'on est
  // hors réseau, l'app doit rester utilisable : listes, saisie, exports.
  // Seules les cartes manquent.
  if(typeof L === 'undefined'){
    const el = $(elId);
    if(el && !el.dataset.off){
      el.dataset.off = '1';
      el.innerHTML = '<div class="map-off">🗺️<span>Carte indisponible hors ligne</span>'
                   + '<small>Les positions sont bien enregistrées</small></div>';
    }
    return null;
  }
  const m = L.map(elId,{zoomControl:false,attributionControl:false}).setView([-33.92,18.42],9);
  L.control.zoom({position:'topleft'}).addTo(m);
  attrCtl[which] = L.control.attribution({position:'bottomright',prefix:false}).addTo(m);
  maps[which] = m;
  applyTiles(which);
  syncTileButtons();
  return m;
}
function pinIcon(kind){
  return L.divIcon({
    className:'', html:`<div class="pin pin-${kind}"><span>${KIND[kind]?KIND[kind].icon:'📍'}</span></div>`,
    iconSize:[28,28], iconAnchor:[14,28]
  });
}
function numIcon(n){
  return L.divIcon({
    className:'', html:`<div class="pin pin-photo"><span>${n}</span></div>`,
    iconSize:[28,28], iconAnchor:[14,14]
  });
}
function clearLayers(which){
  const m = maps[which]; if(!m) return;
  layers[which].markers.forEach(x=>m.removeLayer(x));
  layers[which].markers = [];
  if(layers[which].route){ m.removeLayer(layers[which].route); layers[which].route=null; }
}
function fitTo(which, pts){
  const m = maps[which]; if(!m || !pts.length) return;
  if(pts.length===1) m.setView([pts[0].lat,pts[0].lon],13);
  else m.fitBounds(L.latLngBounds(pts.map(p=>[p.lat,p.lon])),{padding:[36,36],maxZoom:14});
}

/* ---- Itinéraire routier via OSRM, segment par segment, avec cache ---- */
async function routeSegment(a,b){
  const hit = RouteCache.get(a,b);
  if(hit) return hit;
  const url = `https://router.project-osrm.org/route/v1/driving/`
            + `${a.lon},${a.lat};${b.lon},${b.lat}?overview=full&geometries=geojson`;
  try{
    const res = await fetch(url);
    if(!res.ok) throw new Error(res.status);
    const j = await res.json();
    if(!j.routes || !j.routes.length) throw new Error('no route');
    const r = j.routes[0];
    const out = {
      coords: r.geometry.coordinates.map(c=>[c[1],c[0]]),
      distance: r.distance, duration: r.duration, real: true
    };
    RouteCache.set(a,b,out);
    return out;
  }catch(e){
    // Hors ligne, ou pas de route (piste de réserve, traversée maritime) :
    // on relie en ligne droite plutôt que de ne rien montrer.
    return { coords:[[a.lat,a.lon],[b.lat,b.lon]], distance:haversine(a,b), duration:0, real:false };
  }
}
async function drawRoute(which, pts, infoEl){
  const m = maps[which]; if(!m) return;
  if(layers[which].route){ m.removeLayer(layers[which].route); layers[which].route=null; }
  if(pts.length < 2){ infoEl.hidden = true; return; }

  busy(true,'Calcul de l\'itinéraire…');
  const group = L.layerGroup().addTo(m);
  let totD=0, totT=0, approx=false;

  for(let i=0;i<pts.length-1;i++){
    const seg = await routeSegment(pts[i], pts[i+1]);
    totD += seg.distance; totT += seg.duration;
    if(!seg.real) approx = true;
    L.polyline(seg.coords, {
      color: seg.real ? '#1d4e5f' : '#c2853a',
      weight: 4, opacity: .8,
      dashArray: seg.real ? null : '7,7'
    }).addTo(group);
  }
  layers[which].route = group;
  busy(false);

  infoEl.hidden = false;
  infoEl.textContent = `${km(totD)}${totT?' · '+dur(totT):''}${approx?' · partiel':''}`;
}

/* ===================== AXE 1 — Préparation ===================== */
function renderPrep(){
  const m = initMap('prep','mapPrep');
  if(m) setTimeout(()=>m.invalidateSize(),60);
  clearLayers('prep');
  $('routeInfoPrep').hidden = true;

  const all = trip.sites.slice().sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999'));
  const shown = kindFilter==='all' ? all : all.filter(s=>s.kind===kindFilter);
  $('siteCount').textContent = all.length;

  // Marqueurs
  if(m) shown.forEach(s=>{
    if(s.lat==null || s.lon==null) return;
    const mk = L.marker([s.lat,s.lon],{icon:pinIcon(s.kind)}).addTo(m)
      .bindPopup(`<b>${escapeHtml(s.name)}</b><br><small>${fmtDate(s.date)}</small>`);
    mk.on('click', ()=>highlight(s.id));
    layers.prep.markers.push(mk);
  });

  // Liste
  const list = $('siteList');
  if(!shown.length){
    list.innerHTML = `<div class="empty"><div class="empty-icon">🗺️</div>
      <p>Aucune étape.<br>Ajoutez-en une, ou chargez l'itinéraire du Cap depuis le menu.</p></div>`;
  } else {
    let seq = 0;
    list.innerHTML = shown.map(s=>{
      const isStop = s.kind==='etape' || s.kind==='hotel';
      if(isStop) seq++;
      return `<div class="item" id="site-${s.id}" data-id="${s.id}">
        <div class="item-badge">${KIND[s.kind].icon}</div>
        <div class="item-body">
          <div class="item-title">
            ${isStop?`<span class="seq">${seq}</span>`:''}${escapeHtml(s.name)}
          </div>
          <div class="item-meta">${KIND[s.kind].label}${s.date?' · '+fmtDate(s.date):''}</div>
          ${s.notes?`<div class="item-notes">${escapeHtml(s.notes)}</div>`:''}
        </div>
        <div class="item-actions">
          <button class="act" data-act="edit" data-id="${s.id}">✏️</button>
          <button class="act" data-act="go"   data-id="${s.id}">🔍</button>
        </div>
      </div>`;
    }).join('');
  }

  // Au premier affichage, on cadre sur l'ensemble du voyage.
  if(!renderPrep._fitted && shown.some(s=>s.lat!=null)){
    renderPrep._fitted = true;
    setTimeout(()=>fitTo('prep', shown.filter(s=>s.lat!=null)), 180);
  }

  if(routeOn.prep) drawRoute('prep', routePoints(), $('routeInfoPrep'));
}
function routePoints(){
  // L'itinéraire suit les étapes et les hôtels dans l'ordre des dates :
  // les tables et les visites ne détournent pas le tracé.
  return trip.sites
    .filter(s=>(s.kind==='etape'||s.kind==='hotel') && s.lat!=null && s.lon!=null)
    .sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999'));
}
function highlight(id){
  document.querySelectorAll('.item.active').forEach(e=>e.classList.remove('active'));
  const el = $('site-'+id);
  if(el){ el.classList.add('active'); el.scrollIntoView({behavior:'smooth',block:'center'}); }
}

/* ===================== AXE 2 — Road book ===================== */
function dayList(){
  return trip.days.slice().sort((a,b)=>a.date.localeCompare(b.date));
}
async function renderBook(){
  const days = dayList();
  const m = initMap('book','mapBook');
  if(m) setTimeout(()=>m.invalidateSize(),60);
  clearLayers('book');
  $('routeInfoBook').hidden = true;

  if(!days.length){
    $('dayTitle').textContent = 'Aucune journée';
    $('daySub').textContent   = 'Importez vos photos pour commencer';
    $('stepCount').textContent = 0;
    $('dayNote').value = '';
    $('btnPrevDay').disabled = $('btnNextDay').disabled = true;
    $('stepList').innerHTML = `<div class="empty"><div class="empty-icon">📖</div>
      <p>Le soir, importez les photos de la journée.<br>
      L'app lit leurs coordonnées et reconstitue le trajet.</p></div>`;
    return;
  }

  dayIndex = Math.max(0, Math.min(dayIndex, days.length-1));
  const day = days[dayIndex];
  $('btnPrevDay').disabled = dayIndex===0;
  $('btnNextDay').disabled = dayIndex===days.length-1;
  $('dayTitle').textContent = fmtDate(day.date);
  $('daySub').textContent   = `Jour ${dayIndex+1} / ${days.length} · ${day.photos.length} photo${day.photos.length>1?'s':''}`;
  $('dayNote').value = day.note || '';

  const steps = day.steps || [];
  $('stepCount').textContent = steps.length;

  if(m) steps.forEach((st,i)=>{
    const mk = L.marker([st.lat,st.lon],{icon:numIcon(i+1)}).addTo(m)
      .bindPopup(`<b>${escapeHtml(st.name||('Étape '+(i+1)))}</b><br><small>${fmtTime(st.t)}</small>`);
    layers.book.markers.push(mk);
  });
  fitTo('book', steps);

  const list = $('stepList');
  if(!steps.length){
    list.innerHTML = `<div class="empty"><div class="empty-icon">📍</div>
      <p>Aucune photo géolocalisée pour ce jour.<br>
      Vérifiez : Réglages › Confidentialité › Service de localisation › Appareil photo.</p></div>`;
  } else {
    list.innerHTML = steps.map((st,i)=>`
      <div class="item" data-step="${i}">
        <div class="item-badge"><span class="seq">${i+1}</span></div>
        <div class="item-body">
          <div class="item-title">${escapeHtml(st.name || 'Étape '+(i+1))}</div>
          <div class="item-meta">${fmtTime(st.t)}${st.tEnd&&st.tEnd!==st.t?' – '+fmtTime(st.tEnd):''} · ${st.photos.length} photo${st.photos.length>1?'s':''}</div>
          ${st.note?`<div class="item-notes">${escapeHtml(st.note)}</div>`:''}
          <div class="thumbs" id="th-${i}"></div>
        </div>
        <div class="item-actions">
          <button class="act" data-act="rename" data-step="${i}">✏️</button>
        </div>
      </div>`).join('');
    steps.forEach((st,i)=>loadThumbs(i, st));
  }

  if(routeOn.book) drawRoute('book', steps, $('routeInfoBook'));
}
async function loadThumbs(i, step){
  const box = $('th-'+i); if(!box) return;
  for(const pid of step.photos.slice(0,12)){
    let url = urlCache.get(pid);
    if(!url){
      const blob = await Photos.get(pid);
      if(blob){ url = URL.createObjectURL(blob); urlCache.set(pid,url); }
    }
    if(url){
      const img = document.createElement('img');
      img.src = url; img.loading='lazy';
      img.onclick = ()=>openViewer(url, `${step.name||''} · ${fmtTime(step.t)}`);
      box.appendChild(img);
    } else {
      const d = document.createElement('div');
      d.className='thumb-missing'; d.textContent='📷';
      box.appendChild(d);
    }
  }
}
function openViewer(url, cap){
  $('viewerImg').src = url;
  $('viewerCap').textContent = cap || '';
  $('viewer').hidden = false;
}

/* ===================== Import des photos ===================== */
async function importPhotos(files){
  if(!files || !files.length) return;
  const total = files.length;
  let ok=0, noGeo=0;
  const fresh = [];

  for(let i=0;i<total;i++){
    busy(true, `Lecture ${i+1} / ${total}…`);
    const f = files[i];
    let gps=null, when=null;
    const ex = await Exif.parse(f);
    if(ex){
      if(ex.lat!=null && ex.lon!=null) gps = {lat:ex.lat, lon:ex.lon};
      when = ex.date;
    }

    if(!when) when = f.lastModified ? new Date(f.lastModified) : new Date();
    if(!gps){ noGeo++; continue; }   // sans coordonnées, la photo ne situe rien

    const id = uid();
    const thumb = await makeThumb(f);          // peut être null (HEIC non décodable ici)
    if(thumb) await Photos.put(id, thumb);
    fresh.push({ id, t:+new Date(when), lat:gps.lat, lon:gps.lon, name:f.name });
    ok++;
  }

  if(fresh.length) mergeIntoDays(fresh);
  busy(false);

  let msg = `${ok} photo${ok>1?'s':''} ajoutée${ok>1?'s':''}`;
  if(noGeo) msg += ` · ${noGeo} sans position`;
  toast(msg, 3600);
  persist();
  if(pane==='book') renderBook();
}

function makeThumb(file, max=1400, q=.78){
  return new Promise(res=>{
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = ()=>{
      const sc = Math.min(1, max/Math.max(img.width,img.height));
      const c = document.createElement('canvas');
      c.width  = Math.round(img.width*sc);
      c.height = Math.round(img.height*sc);
      c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      URL.revokeObjectURL(url);
      c.toBlob(b=>res(b), 'image/jpeg', q);
    };
    img.onerror = ()=>{ URL.revokeObjectURL(url); res(null); };
    img.src = url;
  });
}

/* Regroupe les photos en journées, puis en étapes.
   Nouvelle étape dès qu'on s'éloigne de 300 m, ou après une heure sur place. */
function mergeIntoDays(fresh){
  const byDay = {};
  fresh.forEach(p=>{
    const d = new Date(p.t);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    (byDay[key] = byDay[key] || []).push(p);
  });

  Object.keys(byDay).forEach(date=>{
    let day = trip.days.find(d=>d.date===date);
    if(!day){ day = {date, photos:[], note:'', steps:[], raw:[]}; trip.days.push(day); }
    if(!day.raw) day.raw = [];

    byDay[date].forEach(p=>{
      if(!day.raw.some(x=>x.id===p.id)) day.raw.push(p);
      if(!day.photos.includes(p.id)) day.photos.push(p.id);
    });
    day.raw.sort((a,b)=>a.t-b.t);
    day.steps = clusterSteps(day.raw, day.steps);
  });
}
function clusterSteps(raw, previous=[]){
  const named = {};
  previous.forEach(s=>{ if(s.name || s.note) named[s.key] = {name:s.name, note:s.note}; });

  const out = [];
  raw.forEach(p=>{
    const last = out[out.length-1];
    if(last && haversine(last, p) < 300 && (p.t - last.tEnd) < 3600000){
      last.photos.push(p.id);
      last.tEnd = p.t;
      last.lat = (last.lat*(last.photos.length-1) + p.lat)/last.photos.length;
      last.lon = (last.lon*(last.photos.length-1) + p.lon)/last.photos.length;
    } else {
      out.push({ key:p.id, lat:p.lat, lon:p.lon, t:p.t, tEnd:p.t, photos:[p.id], name:'', note:'' });
    }
  });
  out.forEach(s=>{ if(named[s.key]){ s.name = named[s.key].name; s.note = named[s.key].note; } });
  return out;
}

/* Rapproche une étape du road book d'un lieu préparé (même nom proposé) */
function nearestSite(pt, maxM=800){
  let best=null, bd=maxM;
  trip.sites.forEach(s=>{
    if(s.lat==null) return;
    const d = haversine(s,pt);
    if(d<bd){ bd=d; best=s; }
  });
  return best;
}

/* ===================== Exports ===================== */
function bookTitle(){ return trip.name || 'Road book'; }

async function buildBookHtml(embed=true){
  const days = dayList();
  let body = '';

  for(const [di,day] of days.entries()){
    body += `<section class="day"><h2>Jour ${di+1} — ${fmtDate(day.date)}</h2>`;
    if(day.note) body += `<p class="daynote">${escapeHtml(day.note).replace(/\n/g,'<br>')}</p>`;
    for(const [si,st] of (day.steps||[]).entries()){
      body += `<div class="step"><h3><span class="n">${si+1}</span> ${escapeHtml(st.name || 'Étape '+(si+1))}</h3>`;
      body += `<p class="meta">${fmtTime(st.t)}${st.tEnd&&st.tEnd!==st.t?' – '+fmtTime(st.tEnd):''} · ${st.lat.toFixed(5)}, ${st.lon.toFixed(5)}</p>`;
      if(st.note) body += `<p class="note">${escapeHtml(st.note).replace(/\n/g,'<br>')}</p>`;
      if(embed){
        body += `<div class="gal">`;
        for(const pid of st.photos.slice(0,8)){
          const blob = await Photos.get(pid);
          if(blob){ body += `<img src="${await blobToDataUrl(blob)}" alt="">`; }
        }
        body += `</div>`;
      }
      body += `</div>`;
    }
    body += `</section>`;
  }

  // Les étapes préparées en annexe : c'est la partie utile pour refaire le voyage.
  let prep = '';
  const sites = trip.sites.slice().sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999'));
  if(sites.length){
    prep = `<section class="day"><h2>Carnet d'adresses</h2>` + sites.map(s=>`
      <div class="step"><h3>${KIND[s.kind].icon} ${escapeHtml(s.name)}</h3>
      <p class="meta">${KIND[s.kind].label}${s.date?' · '+fmtDate(s.date):''}${s.lat!=null?` · ${s.lat.toFixed(5)}, ${s.lon.toFixed(5)}`:''}</p>
      ${s.notes?`<p class="note">${escapeHtml(s.notes).replace(/\n/g,'<br>')}</p>`:''}</div>`).join('') + `</section>`;
  }

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(bookTitle())}</title><style>
body{font-family:-apple-system,BlinkMacSystemFont,Georgia,serif;max-width:800px;margin:0 auto;padding:28px 20px;color:#1b1b1b;background:#faf8f4;line-height:1.55}
h1{color:#1d4e5f;font-size:30px;border-bottom:3px solid #c2853a;padding-bottom:10px;margin-bottom:4px}
.sub{color:#6b6b6b;font-size:14px;margin-bottom:28px}
h2{color:#1d4e5f;font-size:21px;margin:34px 0 12px;padding-top:18px;border-top:1px solid #e2ddd4}
h3{font-size:16px;margin:18px 0 4px;color:#143a47}
.n{display:inline-flex;width:22px;height:22px;background:#1d4e5f;color:#fff;border-radius:50%;align-items:center;justify-content:center;font-size:12px;margin-right:6px;vertical-align:2px}
.meta{font-size:12px;color:#6b6b6b;margin:0 0 6px}
.note,.daynote{font-size:14px;background:#fff;border-left:3px solid #c2853a;padding:9px 13px;border-radius:0 7px 7px 0;margin:8px 0}
.gal{display:flex;flex-wrap:wrap;gap:7px;margin:10px 0}
.gal img{width:150px;height:150px;object-fit:cover;border-radius:7px}
@media print{body{background:#fff}.day{page-break-inside:avoid}}
</style></head><body>
<h1>${escapeHtml(bookTitle())}</h1>
<div class="sub">${trip.start?fmtDate(trip.start):''}${trip.end?' → '+fmtDate(trip.end):''} · ${days.length} journée${days.length>1?'s':''}</div>
${body}${prep}
</body></html>`;
}
function blobToDataUrl(blob){
  return new Promise(res=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.readAsDataURL(blob); });
}
function download(name, content, type){
  const blob = content instanceof Blob ? content : new Blob([content],{type});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 4000);
}
function buildMarkdown(){
  const days = dayList();
  let md = `# ${bookTitle()}\n\n`;
  if(trip.start) md += `${fmtDate(trip.start)}${trip.end?' → '+fmtDate(trip.end):''}\n\n`;

  days.forEach((day,di)=>{
    md += `## Jour ${di+1} — ${fmtDate(day.date)}\n\n`;
    if(day.note) md += `${day.note}\n\n`;
    (day.steps||[]).forEach((st,si)=>{
      md += `### ${si+1}. ${st.name || 'Étape '+(si+1)}\n`;
      md += `*${fmtTime(st.t)}${st.tEnd&&st.tEnd!==st.t?' – '+fmtTime(st.tEnd):''} · [${st.lat.toFixed(5)}, ${st.lon.toFixed(5)}](https://maps.google.com/?q=${st.lat},${st.lon}) · ${st.photos.length} photo(s)*\n\n`;
      if(st.note) md += `${st.note}\n\n`;
    });
  });

  const sites = trip.sites.slice().sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999'));
  if(sites.length){
    md += `\n## Carnet d'adresses\n\n`;
    sites.forEach(s=>{
      md += `### ${KIND[s.kind].icon} ${s.name}\n`;
      md += `*${KIND[s.kind].label}${s.date?' · '+fmtDate(s.date):''}`;
      if(s.lat!=null) md += ` · [carte](https://maps.google.com/?q=${s.lat},${s.lon})`;
      md += `*\n\n`;
      if(s.notes) md += `${s.notes}\n\n`;
    });
  }
  return md;
}
async function exportPdf(){
  busy(true,'Préparation du document…');
  const html = await buildBookHtml(true);
  busy(false);
  const w = window.open('', '_blank');
  if(!w){
    // Safari bloque parfois l'ouverture : on retombe sur le téléchargement.
    download(`${bookTitle()}.html`, html, 'text/html');
    toast('Fichier téléchargé — ouvrez-le puis Partager › Imprimer', 4800);
    return;
  }
  w.document.write(html);
  w.document.close();
  setTimeout(()=>{ w.focus(); w.print(); }, 700);
  toast('Dans la fenêtre d\'impression : Enregistrer en PDF', 4200);
}

/* ===================== Sauvegarde / restauration ===================== */
async function backup(){
  busy(true,'Constitution de la sauvegarde…');
  const imgs = {};
  const keys = await Photos.keys();
  for(const k of keys){
    const b = await Photos.get(k);
    if(b) imgs[k] = await blobToDataUrl(b);
  }
  busy(false);
  const payload = { version:1, savedAt:new Date().toISOString(), trip, images:imgs };
  const name = `bthx-${(trip.name||'voyage').replace(/[^a-z0-9]+/gi,'-').toLowerCase()}-${new Date().toISOString().slice(0,10)}.json`;
  download(name, JSON.stringify(payload), 'application/json');
  toast('Sauvegarde téléchargée', 3000);
}
async function restore(file){
  busy(true,'Restauration…');
  try{
    const data = JSON.parse(await file.text());
    if(!data.trip) throw new Error('format');
    trip = data.trip;
    if(!trip.days) trip.days=[]; if(!trip.sites) trip.sites=[];
    await Photos.clear(); urlCache.clear();
    if(data.images){
      for(const [id,dataUrl] of Object.entries(data.images)){
        const blob = await (await fetch(dataUrl)).blob();
        await Photos.put(id, blob);
      }
    }
    persist();
    busy(false);
    refreshHeader(); renderPrep(); renderBook();
    toast('Sauvegarde restaurée', 3000);
  }catch(e){
    busy(false);
    toast('Fichier illisible', 3200);
  }
}

/* ===================== Interface ===================== */
function refreshHeader(){
  $('tripName').textContent = trip.name || 'BTHX Travel';
  const d = [trip.start?fmtDate(trip.start):'', trip.end?fmtDate(trip.end):''].filter(Boolean).join(' → ');
  $('tripDates').textContent = d || `${trip.sites.length} étape${trip.sites.length>1?'s':''} · ${trip.days.length} journée${trip.days.length>1?'s':''}`;
}
function switchPane(p){
  pane = p;
  $('pane-prep').hidden = p!=='prep';
  $('pane-book').hidden = p!=='book';
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active', t.dataset.pane===p));
  if(p==='prep') renderPrep(); else renderBook();
}
function openSheet(which){
  $(which+'Backdrop').hidden = false;
  $(which+'Sheet').hidden = false;
}
function closeSheet(which){
  $(which+'Backdrop').hidden = true;
  $(which+'Sheet').hidden = true;
}
function openEditor(id){
  editingId = id;
  const s = id ? trip.sites.find(x=>x.id===id) : null;
  $('editTitle').textContent = s ? 'Modifier l\'étape' : 'Nouvelle étape';
  $('eName').value  = s?s.name:'';
  $('eKind').value  = s?s.kind:'etape';
  $('eDate').value  = s?(s.date||''):'';
  $('eLat').value   = s&&s.lat!=null?s.lat:'';
  $('eLon').value   = s&&s.lon!=null?s.lon:'';
  $('eNotes').value = s?(s.notes||''):'';
  $('btnEditDelete').style.display = s ? '' : 'none';
  openSheet('edit');
}
function saveEditor(){
  const name = $('eName').value.trim();
  if(!name){ toast('Il faut un nom'); return; }
  const rec = {
    name,
    kind:  $('eKind').value,
    date:  $('eDate').value || '',
    lat:   $('eLat').value===''?null:parseFloat($('eLat').value),
    lon:   $('eLon').value===''?null:parseFloat($('eLon').value),
    notes: $('eNotes').value
  };
  if(editingId){
    const s = trip.sites.find(x=>x.id===editingId);
    Object.assign(s, rec);
  } else {
    trip.sites.push(Object.assign({id:uid()}, rec));
  }
  persist(); closeSheet('edit'); refreshHeader(); renderPrep();
  toast('Étape enregistrée');
}

/* ===================== Branchements ===================== */
function wire(){
  // Onglets
  document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>switchPane(t.dataset.pane));

  // Filtres
  $('siteFilters').onclick = e=>{
    const c = e.target.closest('.chip'); if(!c) return;
    document.querySelectorAll('#siteFilters .chip').forEach(x=>x.classList.remove('active'));
    c.classList.add('active'); kindFilter = c.dataset.kind; renderPrep();
  };

  // Liste des étapes
  $('siteList').onclick = e=>{
    const btn = e.target.closest('[data-act]');
    if(btn){
      const s = trip.sites.find(x=>x.id===btn.dataset.id);
      if(btn.dataset.act==='edit') openEditor(btn.dataset.id);
      if(btn.dataset.act==='go' && s && s.lat!=null && maps.prep){
        maps.prep.setView([s.lat,s.lon],14);
        maps.prep.closePopup();
        layers.prep.markers.forEach(m=>{
          if(Math.abs(m.getLatLng().lat-s.lat)<1e-6) m.openPopup();
        });
      }
      return;
    }
    const it = e.target.closest('.item');
    if(it) highlight(it.dataset.id);
  };

  $('btnAddSite').onclick = ()=>openEditor(null);
  $('btnHere').onclick = ()=>{
    if(!navigator.geolocation){ toast('Localisation indisponible'); return; }
    busy(true,'Localisation…');
    navigator.geolocation.getCurrentPosition(pos=>{
      busy(false);
      openEditor(null);
      $('eLat').value = pos.coords.latitude.toFixed(6);
      $('eLon').value = pos.coords.longitude.toFixed(6);
      $('eDate').value = new Date().toISOString().slice(0,10);
    }, err=>{ busy(false); toast('Position refusée'); }, {enableHighAccuracy:true, timeout:12000});
  };

  $('btnTilePrep').onclick = toggleTiles;
  $('btnTileBook').onclick = toggleTiles;
  $('btnFitPrep').onclick = ()=>fitTo('prep', trip.sites.filter(s=>s.lat!=null));
  $('btnRoutePrep').onclick = e=>{
    if(!maps.prep){ toast('Carte indisponible hors ligne'); return; }
    routeOn.prep = !routeOn.prep;
    e.currentTarget.classList.toggle('on', routeOn.prep);
    if(routeOn.prep) drawRoute('prep', routePoints(), $('routeInfoPrep'));
    else { if(layers.prep.route){ maps.prep.removeLayer(layers.prep.route); layers.prep.route=null; } $('routeInfoPrep').hidden=true; }
  };

  // Road book
  $('btnPrevDay').onclick = ()=>{ dayIndex--; renderBook(); };
  $('btnNextDay').onclick = ()=>{ dayIndex++; renderBook(); };
  $('btnImport').onclick  = ()=>$('photoInput').click();
  $('photoInput').onchange = e=>{ importPhotos(Array.from(e.target.files)); e.target.value=''; };

  $('dayNote').oninput = ()=>{
    const days = dayList(); if(!days.length) return;
    days[dayIndex].note = $('dayNote').value;
    clearTimeout(window._noteT);
    window._noteT = setTimeout(persist, 600);
  };

  $('stepList').onclick = e=>{
    const btn = e.target.closest('[data-act="rename"]'); if(!btn) return;
    const days = dayList(); const st = days[dayIndex].steps[+btn.dataset.step];
    const suggestion = st.name || (nearestSite(st)||{}).name || '';
    const v = prompt('Nom de l\'étape', suggestion);
    if(v===null) return;
    st.name = v.trim();
    const n = prompt('Note (facultatif)', st.note || '');
    if(n!==null) st.note = n;
    persist(); renderBook();
  };

  $('btnFitBook').onclick = ()=>{
    const days = dayList(); if(days.length) fitTo('book', days[dayIndex].steps||[]);
  };
  $('btnRouteBook').onclick = e=>{
    if(!maps.book){ toast('Carte indisponible hors ligne'); return; }
    routeOn.book = !routeOn.book;
    e.currentTarget.classList.toggle('on', routeOn.book);
    const days = dayList();
    if(routeOn.book && days.length) drawRoute('book', days[dayIndex].steps||[], $('routeInfoBook'));
    else { if(layers.book.route){ maps.book.removeLayer(layers.book.route); layers.book.route=null; } $('routeInfoBook').hidden=true; }
  };

  $('viewerClose').onclick = ()=>{ $('viewer').hidden = true; };

  // Menu
  $('btnMenu').onclick = ()=>{
    $('mName').value = trip.name; $('mStart').value = trip.start; $('mEnd').value = trip.end;
    showStorage(); openSheet('menu');
  };
  $('btnCloseMenu').onclick = $('menuBackdrop').onclick = ()=>closeSheet('menu');
  ['mName','mStart','mEnd'].forEach(id=>{
    $(id).onchange = ()=>{
      trip.name  = $('mName').value.trim() || 'Nouveau voyage';
      trip.start = $('mStart').value; trip.end = $('mEnd').value;
      persist(); refreshHeader();
    };
  });

  $('btnExpPdf').onclick  = exportPdf;
  $('btnExpHtml').onclick = async ()=>{
    busy(true,'Construction de la page…');
    const html = await buildBookHtml(true);
    busy(false);
    download(`${bookTitle()}.html`, html, 'text/html');
    toast('Page web téléchargée', 3000);
  };
  $('btnExpMd').onclick = async ()=>{
    const md = buildMarkdown();
    try{ await navigator.clipboard.writeText(md); toast('Copié — collez dans Notion', 3600); }
    catch(e){ toast('Fichier téléchargé pour Notion', 3200); }
    download(`${bookTitle()}.md`, md, 'text/markdown');
  };

  $('btnBackup').onclick  = backup;
  $('btnRestore').onclick = ()=>$('restoreInput').click();
  $('restoreInput').onchange = e=>{ if(e.target.files[0]) restore(e.target.files[0]); e.target.value=''; };

  $('btnLoadCape').onclick = ()=>{
    if(trip.sites.length && !confirm('Remplacer les étapes actuelles par l\'itinéraire du Cap ?')) return;
    trip.name = CAPE_TRIP.name; trip.start = CAPE_TRIP.start; trip.end = CAPE_TRIP.end;
    trip.sites = CAPE_TRIP.sites.map(s=>Object.assign({id:uid()}, s));
    persist(); refreshHeader(); closeSheet('menu'); switchPane('prep');
    setTimeout(()=>fitTo('prep', trip.sites.filter(s=>s.lat!=null)), 300);
    toast('Itinéraire du Cap chargé', 3000);
  };

  $('btnWipe').onclick = async ()=>{
    if(!confirm('Tout effacer — étapes, journées et photos ?\n\nFaites une sauvegarde avant.')) return;
    await Photos.clear(); Store.clear(); urlCache.clear();
    trip = { name:'Nouveau voyage', start:'', end:'', sites:[], days:[] };
    refreshHeader(); closeSheet('menu'); switchPane('prep');
    toast('Tout a été effacé');
  };

  // Éditeur
  $('btnEditSave').onclick = saveEditor;
  $('btnEditCancel').onclick = $('editBackdrop').onclick = ()=>closeSheet('edit');
  $('btnEditDelete').onclick = ()=>{
    if(!editingId || !confirm('Supprimer cette étape ?')) return;
    trip.sites = trip.sites.filter(s=>s.id!==editingId);
    persist(); closeSheet('edit'); refreshHeader(); renderPrep();
    toast('Étape supprimée');
  };
}

async function showStorage(){
  try{
    if(navigator.storage && navigator.storage.estimate){
      const {usage,quota} = await navigator.storage.estimate();
      const pct = quota ? Math.round(usage/quota*100) : 0;
      $('storageHint').textContent =
        `${trip.sites.length} étapes · ${trip.days.length} journées · ${(await Photos.keys()).length} photos — ${(usage/1048576).toFixed(0)} Mo utilisés (${pct} %)`;
    }
  }catch(e){}
}

/* ===================== Démarrage ===================== */
wire();
refreshHeader();
switchPane('prep');

if(!trip.sites.length && !trip.days.length){
  // Premier lancement : on propose l'itinéraire déjà préparé.
  setTimeout(()=>toast('Menu ☰ › Itinéraire Le Cap pour démarrer', 5000), 900);
}

if('serviceWorker' in navigator){
  navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
}
