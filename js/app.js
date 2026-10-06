/* BTHX Travel — logique applicative
   Deux axes : Préparation (étapes du voyage) et Road book (journées reconstituées). */

'use strict';

/* ===================== État ===================== */
let trip = Store.current();     // le voyage ouvert ; les autres attendent dans le menu

let pane       = 'prep';
let kindFilter = 'all';
let dayIndex   = 0;          // -1 : « Tout le voyage »
let editingId  = null;
const maps     = { prep:null, book:null };
const layers   = { prep:{markers:[],route:null}, book:{markers:[],route:null} };
const routeOn  = { prep:false, book:true };   // le road book trace d'office
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
    return false;
  }
  return true;
}
function fmtDate(iso){
  if(!iso) return '';
  const d = new Date(iso + (iso.length===10 ? 'T12:00:00' : ''));
  if(isNaN(d)) return iso;
  return d.toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'});
}
/* Dans une légende, l'année compte : le road book se relit des années après. */
function fmtDateY(iso){
  if(!iso) return '';
  const d = new Date(iso + (iso.length===10 ? 'T12:00:00' : ''));
  if(isNaN(d)) return iso;
  return d.toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'});
}
/* Heure à la française : 15h00, et non 15:00. */
function fmtTime(ts){
  if(!ts) return '';
  return new Date(ts).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}).replace(':','h');
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
  table:{icon:'🍽️',label:'Table'}, site:{icon:'⭐',label:'À voir'},
  vin:{icon:'🍷',label:'Domaine'},  shop:{icon:'🛍️',label:'Shopping'},
  info:{icon:'ℹ️',label:'Information'}
};
/* Ordre chronologique : la date, puis l'heure. Sans heure, un hôtel se range
   en fin de journée (on y arrive le soir), le reste à midi. */
function siteKey(s){
  if(!s.date) return '9999';
  return s.date + ' ' + (s.time || (s.kind==='hotel' ? '18:00' : '12:00'));
}
const bySite = (a,b)=>siteKey(a).localeCompare(siteKey(b));
function fmtWhen(s){
  return s.date ? fmtDate(s.date) + (s.time ? ' - ' + s.time.replace(':','h') : '') : '';
}
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
  const d0 = haversine(a,b);
  // Deux étapes à deux pas l'une de l'autre : on marche, inutile d'interroger le routeur.
  if(d0 < 250) return { coords:[[a.lat,a.lon],[b.lat,b.lon]], distance:d0, duration:d0/1.3, real:true, walk:true };
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
    return { coords:[[a.lat,a.lon],[b.lat,b.lon]], distance:d0, duration:0, real:false };
  }
}
/* Ce qu'on sait d'un segment sans rien demander au réseau (exports, listes). */
function legStats(a,b){
  const d0 = haversine(a,b);
  if(d0 < 250) return { distance:d0, duration:d0/1.3, real:true, walk:true };
  return RouteCache.get(a,b) || { distance:d0, duration:0, real:false };
}
function fmtLeg(seg){
  if(seg.walk) return seg.distance < 60 ? 'sur place' : `${km(seg.distance)} à pied`;
  if(!seg.real) return `≈ ${km(seg.distance)} à vol d'oiseau`;
  return `${km(seg.distance)} · ${dur(seg.duration)}`;
}
function fmtTotal(t, long=false){
  if(!t.distance) return '';
  return `${km(t.distance)}${t.duration?' · '+dur(t.duration)+(long?' de route':''):''}${t.approx?' · partiel':''}`;
}
function sumLegs(pts){
  const t = {distance:0, duration:0, approx:false};
  for(let i=0;i<pts.length-1;i++){
    const g = legStats(pts[i],pts[i+1]);
    t.distance += g.distance; t.duration += g.duration; if(!g.real) t.approx = true;
  }
  return t;
}

/* Trace l'itinéraire et en rend compte segment par segment.
   N'immobilise pas l'écran : le calcul avance en fond, le cartouche de la
   carte indique la progression, et un nouveau tracé annule l'ancien. */
const routeGen = { prep:0, book:0 };
async function drawRoute(which, pts, infoEl, opts={}){
  const m = maps[which];
  const draw = opts.draw !== false && m;
  const gen = ++routeGen[which];
  if(m && layers[which].route){ m.removeLayer(layers[which].route); layers[which].route=null; }
  if(pts.length < 2){ infoEl.hidden = true; return null; }

  const group = draw ? L.layerGroup().addTo(m) : null;
  if(group) layers[which].route = group;
  infoEl.hidden = false;
  const tot = {distance:0, duration:0, approx:false};
  const segs = [];
  const n = pts.length-1;

  for(let i=0;i<n;i++){
    if(!RouteCache.get(pts[i],pts[i+1]) && haversine(pts[i],pts[i+1])>=250)
      infoEl.textContent = `Calcul de l'itinéraire… ${i+1} / ${n}`;
    const seg = await routeSegment(pts[i], pts[i+1]);
    if(gen !== routeGen[which]) return null;          // un autre tracé a pris la main
    segs.push(seg);
    tot.distance += seg.distance; tot.duration += seg.duration;
    if(!seg.real) tot.approx = true;
    if(group) L.polyline(seg.coords, {
      color: seg.real ? '#1d4e5f' : '#c2853a',
      weight: seg.walk ? 3 : 4, opacity: .8,
      dashArray: seg.real && !seg.walk ? null : (seg.walk ? '2,6' : '7,7')
    }).addTo(group);
    if(opts.onSeg) opts.onSeg(i, seg);
  }
  infoEl.textContent = fmtTotal(tot, true) || km(tot.distance);
  if(opts.onDone) opts.onDone(tot, segs);
  return tot;
}

/* ===================== AXE 1 — Préparation ===================== */
function renderPrep(){
  const m = initMap('prep','mapPrep');
  if(m) setTimeout(()=>m.invalidateSize(),60);
  clearLayers('prep');
  $('routeInfoPrep').hidden = true;

  const all = trip.sites.slice().sort(bySite);
  const shown = kindFilter==='all' ? all : all.filter(s=>s.kind===kindFilter);
  $('siteCount').textContent = all.length;

  // Marqueurs
  if(m) shown.forEach(s=>{
    if(s.lat==null || s.lon==null) return;
    const mk = L.marker([s.lat,s.lon],{icon:pinIcon(s.kind)}).addTo(m)
      .bindPopup(`<b>${escapeHtml(s.name)}</b><br><small>${fmtWhen(s)}</small>`);
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
          <div class="item-meta">${KIND[s.kind].label}${s.date?' · '+fmtWhen(s):''}${s.via?' · <span class="via">🛣️ sur la route</span>':''}</div>
          ${s.notes?`<div class="item-notes">${escapeHtml(s.notes)}</div>`:''}
        </div>
        <div class="item-actions">
          <button class="act" data-act="edit" data-id="${s.id}">✏️</button>
          <button class="act" data-act="go"   data-id="${s.id}">🔍</button>
          ${s.lat!=null?`<button class="act" data-act="nav" data-id="${s.id}">🧭</button>`:''}
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
  // L'itinéraire suit les étapes et les hôtels dans l'ordre des dates. Les
  // tables et les visites ne détournent pas le tracé — sauf celles cochées
  // « passage sur la route » : c'est ce qui permet d'imposer une belle route
  // plutôt que la plus rapide (col, route côtière, vallée viticole).
  return trip.sites
    .filter(s=>(s.kind==='etape' || s.kind==='hotel' || s.via) && s.lat!=null && s.lon!=null)
    .sort(bySite);
}

/* ---- Navigation : ouvrir un point dans l'app de navigation ----
   Une PWA installée ne peut pas ouvrir de fenêtre par script ; un lien
   posé dans la page et cliqué, si. maps.apple.com lance Plan sur iPhone. */
const NAV = {
  plan:   p => `https://maps.apple.com/?daddr=${p.lat},${p.lon}&dirflg=d`,
  waze:   p => `https://waze.com/ul?ll=${p.lat},${p.lon}&navigate=yes`,
  google: p => `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}&travelmode=driving`
};
function openNav(url){
  const a = document.createElement('a');
  a.href = url; a.target = '_blank'; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
}
/* Tout l'itinéraire d'un coup : Google Maps est le seul à accepter des
   étapes dans un lien (23 au maximum). */
function routeLink(pts){
  if(pts.length < 2) return null;
  const o = pts[0], d = pts[pts.length-1];
  const mid = pts.slice(1,-1).slice(0,23).map(p=>`${p.lat},${p.lon}`).join('|');
  return `https://www.google.com/maps/dir/?api=1&origin=${o.lat},${o.lon}`
       + `&destination=${d.lat},${d.lon}`
       + (mid ? `&waypoints=${encodeURIComponent(mid)}` : '')
       + `&travelmode=driving`;
}
async function askNav(pt, titre){
  const v = await ask({
    title: titre || 'Y aller',
    msg: 'Ouvrir dans quelle application ?',
    ok:'Plan', cancel:'Waze',
    fields: []
  });
  openNav(v !== null ? NAV.plan(pt) : NAV.waze(pt));
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
/* Nom d'une étape : celui donné par l'utilisateur, sinon le lieu préparé
   le plus proche (hôtel, table, site) — c'est ainsi que les adresses
   visitées apparaissent d'elles-mêmes dans le road book. */
function stepLabel(st, i){
  if(st.name) return st.name;
  const s = nearestSite(st);
  if(s) return s.name;
  return 'Étape ' + (i+1);
}
function countLabel(st){
  const v = (st.videos||[]).length, ph = st.photos.length - v;
  const parts = [];
  if(ph) parts.push(`${ph} photo${ph>1?'s':''}`);
  if(v)  parts.push(`${v} vidéo${v>1?'s':''}`);
  return parts.join(' · ') || '0 photo';
}
function stepIcon(st){
  const s = st.name ? null : nearestSite(st);
  if(st.kind && KIND[st.kind]) return KIND[st.kind].icon;
  return s ? KIND[s.kind].icon : '';
}
function allSteps(days){
  const out = [];
  days.forEach((d,di)=>(d.steps||[]).forEach((st,si)=>out.push(Object.assign({}, st, {_d:di, _s:si}))));
  return out;
}
function legRow(id, a, b, extra=''){
  return `<div class="leg" id="${id}"><span class="leg-line"></span>
    <span class="leg-txt">${extra}${fmtLeg(legStats(a,b))}</span></div>`;
}
function setLeg(id, seg, extra=''){
  const el = $(id); if(!el) return;
  el.querySelector('.leg-txt').textContent = extra + fmtLeg(seg);
  el.classList.toggle('approx', !seg.real);
}

let bookGen = 0;
async function renderBook(){
  const days = dayList();
  const gen = ++bookGen;
  const m = initMap('book','mapBook');
  if(m) setTimeout(()=>m.invalidateSize(),60);
  clearLayers('book');
  routeGen.book++;                                   // annule un tracé en cours
  $('routeInfoBook').hidden = true;
  $('btnRouteBook').classList.toggle('on', routeOn.book);

  if(!days.length){
    $('dayTitle').textContent = 'Aucune journée';
    $('daySub').textContent   = 'Importez vos photos pour commencer';
    $('stepCount').textContent = 0;
    $('dayNote').value = ''; $('dayNote').hidden = true;
    $('btnPrevDay').disabled = $('btnNextDay').disabled = $('btnAllDays').disabled = true;
    $('stepList').innerHTML = `<div class="empty"><div class="empty-icon">📖</div>
      <p>Le soir, importez les photos de la journée.<br>
      L'app lit leurs coordonnées et reconstitue le trajet.</p></div>`;
    return;
  }
  $('btnAllDays').disabled = false;
  if(dayIndex < 0) return renderTrip(days, m, gen);

  dayIndex = Math.max(0, Math.min(dayIndex, days.length-1));
  $('btnAllDays').classList.remove('on');
  $('bookHead').textContent = 'Journée';
  const day = days[dayIndex];
  $('btnPrevDay').disabled = dayIndex===0;
  $('btnNextDay').disabled = dayIndex===days.length-1;
  $('dayTitle').textContent = fmtDate(day.date);
  const steps = day.steps || [];
  const baseSub = `Jour ${dayIndex+1} / ${days.length} · ${day.photos.length} photo${day.photos.length>1?'s':''}`;
  const known = fmtTotal(sumLegs(steps));
  $('daySub').textContent = baseSub + (known && steps.length>1 ? ' · ' + known : '');
  $('dayNote').hidden = false;
  $('dayNote').value = day.note || '';
  $('stepCount').textContent = steps.length;

  if(m) steps.forEach((st,i)=>{
    const mk = L.marker([st.lat,st.lon],{icon:numIcon(i+1)}).addTo(m)
      .bindPopup(`<b>${escapeHtml(stepLabel(st,i))}</b><br><small>${fmtTime(st.t)}</small>`);
    layers.book.markers.push(mk);
  });
  // Les traces GPX : le chemin réellement parcouru, par-dessus la carte.
  const tracks = day.tracks || [];
  if(m) tracks.forEach(tr=>{
    const line = L.polyline(tr.pts, {color:'#b3261e', weight:4, opacity:.85}).addTo(m);
    line.bindPopup(`<b>${escapeHtml(tr.name)}</b><br><small>${trackStats(tr)}</small>`);
    layers.book.markers.push(line);
  });
  fitTo('book', steps.length ? steps : tracks.flatMap(t=>t.pts.map(p=>({lat:p[0], lon:p[1]}))));

  const list = $('stepList');
  const trackRows = tracks.map((tr,ti)=>`
      <div class="item track-item">
        <div class="item-badge">🥾</div>
        <div class="item-body">
          <div class="item-title">${escapeHtml(tr.name)}</div>
          <div class="item-meta">${trackStats(tr)}${tr.t0?' · '+fmtTime(tr.t0):''}</div>
        </div>
        <div class="item-actions">
          <button class="act" data-act="deltrack" data-track="${ti}">🗑️</button>
        </div>
      </div>`).join('');
  if(!steps.length && !tracks.length){
    list.innerHTML = `<div class="empty"><div class="empty-icon">📍</div>
      <p>Aucune photo géolocalisée pour ce jour.<br>
      Vérifiez : Réglages › Confidentialité › Service de localisation › Appareil photo.</p></div>`;
  } else {
    list.innerHTML = trackRows + steps.map((st,i)=>`
      ${i>0 ? legRow('leg-'+(i-1), steps[i-1], st) : ''}
      <div class="item" data-step="${i}">
        <div class="item-badge"><span class="seq">${i+1}</span></div>
        <div class="item-body">
          <div class="item-title">${stepIcon(st)} ${escapeHtml(stepLabel(st,i))}</div>
          <div class="item-meta">${fmtTime(st.t)}${st.tEnd&&st.tEnd!==st.t?' – '+fmtTime(st.tEnd):''} · ${countLabel(st)}${!st.name && nearestSite(st)?' · <span class="guess">lieu proposé — ✏️ pour valider</span>':''}</div>
          ${st.note?`<div class="item-notes">${escapeHtml(st.note)}</div>`:''}
          <div class="thumbs" id="th-${i}"></div>
        </div>
        <div class="item-actions">
          <button class="act" data-act="rename" data-step="${i}">✏️</button>
          <button class="act" data-act="nav" data-step="${i}">🧭</button>
        </div>
      </div>`).join('');
    steps.forEach((st,i)=>loadThumbs(i, st));
  }

  // Les distances et temps se calculent toujours ; le bouton 🛣️ ne fait
  // qu'afficher ou masquer le tracé sur la carte.
  if(steps.length > 1) drawRoute('book', steps, $('routeInfoBook'), {
    draw: routeOn.book,
    onSeg: (i,seg)=>{ if(gen===bookGen) setLeg('leg-'+i, seg); },
    onDone: tot=>{ if(gen===bookGen) $('daySub').textContent = baseSub + ' · ' + fmtTotal(tot); }
  });
}

/* Vue « Tout le voyage » : toutes les étapes, jour après jour, sur une carte. */
function renderTrip(days, m, gen){
  $('btnAllDays').classList.add('on');
  $('bookHead').textContent = 'Voyage';
  $('btnPrevDay').disabled = $('btnNextDay').disabled = false;
  $('dayTitle').textContent = 'Tout le voyage';
  $('dayNote').hidden = true;
  $('stepCount').textContent = days.length;

  const pts = allSteps(days);
  const nbSteps = pts.length;
  const subBase = `${days.length} jour${days.length>1?'s':''} · ${nbSteps} étape${nbSteps>1?'s':''}`;
  $('daySub').textContent = subBase + (nbSteps>1 ? ' · ' + fmtTotal(sumLegs(pts)) : '');

  if(m) pts.forEach(st=>{
    const mk = L.marker([st.lat,st.lon],{icon:numIcon(st._d+1)}).addTo(m)
      .bindPopup(`<b>${escapeHtml(stepLabel(st,st._s))}</b><br><small>Jour ${st._d+1} · ${fmtDate(days[st._d].date)} ${fmtTime(st.t)}</small>`);
    mk.on('click', ()=>{});
    layers.book.markers.push(mk);
  });
  fitTo('book', pts);

  // Totaux par jour : segments internes au jour ; les segments d'un jour
  // au suivant sont les transferts.
  const dayTot = days.map(d=>sumLegs(d.steps||[]));
  const lastIdx = {}; pts.forEach((p,k)=>{ lastIdx[p._d] = k; });

  $('stepList').innerHTML = days.map((d,di)=>{
    const st = d.steps||[];
    const names = st.map((x,i)=>stepLabel(x,i));
    const uniq = names.filter((x,i)=>names.indexOf(x)===i);
    const k = lastIdx[di];
    let next = (k!=null && k+1<pts.length) ? pts[k+1] : null;
    if(next && haversine(pts[k], next) < 250) next = null;   // nuit au même endroit : pas de transfert
    return `
      <div class="item day-item" data-day="${di}">
        <div class="item-badge"><span class="seq">${di+1}</span></div>
        <div class="item-body">
          <div class="item-title">${fmtDate(d.date)}</div>
          <div class="item-meta" id="dt-${di}">${st.length} étape${st.length>1?'s':''}${dayTot[di].distance?' · '+fmtTotal(dayTot[di]):''}</div>
          ${uniq.length?`<div class="item-notes">${escapeHtml(uniq.slice(0,6).join(' → '))}${uniq.length>6?' …':''}</div>`:''}
        </div>
        <div class="item-actions"><span class="act">›</span></div>
      </div>
      ${next ? legRow('leg-'+k, pts[k], next, 'Transfert · ') : ''}`;
  }).join('');

  if(nbSteps > 1) drawRoute('book', pts, $('routeInfoBook'), {
    draw: routeOn.book,
    onSeg: (i,seg)=>{
      if(gen!==bookGen) return;
      if(pts[i]._d !== pts[i+1]._d) setLeg('leg-'+i, seg, 'Transfert · ');
    },
    onDone: (tot, segs)=>{
      if(gen!==bookGen) return;
      $('daySub').textContent = subBase + ' · ' + fmtTotal(tot);
      days.forEach((d,di)=>{
        const t = {distance:0,duration:0,approx:false};
        segs.forEach((g,i)=>{ if(pts[i]._d===di && pts[i+1]._d===di){ t.distance+=g.distance; t.duration+=g.duration; if(!g.real) t.approx=true; } });
        const el = $('dt-'+di);
        const n = (d.steps||[]).length;
        if(el) el.textContent = `${n} étape${n>1?'s':''}${t.distance?' · '+fmtTotal(t):''}`;
      });
    }
  });
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
      const isVid = (step.videos || []).includes(pid);
      const img = document.createElement('img');
      img.src = url; img.loading='lazy';
      img.onclick = ()=>openViewer(url, `${step.name||''} · ${fmtTime(step.t)}${isVid?' · vidéo':''}`);
      if(isVid){
        const wrap = document.createElement('div');
        wrap.className = 'thumb-vid';
        wrap.appendChild(img);
        const play = document.createElement('span'); play.textContent = '▶';
        wrap.appendChild(play);
        box.appendChild(wrap);
      } else box.appendChild(img);
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

/* ===================== Traces GPX =====================
   Les parcours de l'app Exercice vivent dans HealthKit, inaccessible à une
   page web. Le détour : l'export GPX (app Santé, ou HealthFit / RunGap).
   Une trace est le vrai chemin parcouru — à pied, elle vaut mieux que
   l'itinéraire reconstitué par le calculateur de routes. */
function parseGpx(text, fallbackName){
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if(doc.querySelector('parsererror')) return null;
  const nodes = doc.getElementsByTagName('trkpt').length
              ? doc.getElementsByTagName('trkpt')
              : doc.getElementsByTagName('rtept');
  if(!nodes.length) return null;

  const raw = [];
  for(const n of nodes){
    const lat = parseFloat(n.getAttribute('lat')), lon = parseFloat(n.getAttribute('lon'));
    if(isNaN(lat) || isNaN(lon)) continue;
    const te = n.getElementsByTagName('time')[0];
    const ee = n.getElementsByTagName('ele')[0];
    raw.push({ lat, lon,
      t: te ? +new Date(te.textContent) : null,
      ele: ee ? parseFloat(ee.textContent) : null });
  }
  if(raw.length < 2) return null;

  // Distance et dénivelé sur TOUS les points : c'est la mesure juste.
  let dist = 0, up = 0, lastEle = raw[0].ele;
  for(let i=1;i<raw.length;i++){
    dist += haversine(raw[i-1], raw[i]);
    if(raw[i].ele != null && lastEle != null){
      const d = raw[i].ele - lastEle;
      if(Math.abs(d) >= 3){ if(d > 0) up += d; lastEle = raw[i].ele; }
    } else if(raw[i].ele != null) lastEle = raw[i].ele;
  }

  // On ne garde ensuite qu'un point tous les 15 m : invisible à l'écran,
  // et c'est ce qui permet de tenir dans la mémoire du navigateur.
  const pts = [[raw[0].lat, raw[0].lon]];
  let last = raw[0];
  raw.forEach((p,i)=>{
    if(i && (haversine(last,p) > 15 || i === raw.length-1)){
      pts.push([+p.lat.toFixed(5), +p.lon.toFixed(5)]); last = p;
    }
  });

  const times = raw.map(p=>p.t).filter(Boolean);
  const nameEl = doc.getElementsByTagName('name')[0];
  const t0 = times.length ? Math.min(...times) : null;
  return {
    id: uid(),
    name: (nameEl && nameEl.textContent.trim()) || fallbackName || 'Parcours',
    t0, t1: times.length ? Math.max(...times) : null,
    dist, up: Math.round(up), pts
  };
}

async function importTracks(files){
  if(!files || !files.length) return;
  let ok = 0, ko = 0, sansDate = 0;
  for(const f of files){
    busy(true, `Lecture de ${f.name}…`);
    let tr = null;
    try{ tr = parseGpx(await f.text(), f.name.replace(/\.gpx$/i,'')); }catch(e){ tr = null; }
    if(!tr){ ko++; continue; }

    // La trace rejoint la journée de son premier point ; sans horodatage,
    // la journée affichée.
    let date;
    if(tr.t0){
      const d = new Date(tr.t0);
      date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    } else {
      const days = dayList();
      date = (days[dayIndex] && days[dayIndex].date) || new Date().toISOString().slice(0,10);
      sansDate++;
    }
    let day = trip.days.find(x=>x.date===date);
    if(!day){ day = {date, photos:[], note:'', steps:[], raw:[], tracks:[]}; trip.days.push(day); }
    if(!day.tracks) day.tracks = [];
    if(!day.tracks.some(x=>x.name===tr.name && Math.abs(x.dist-tr.dist) < 50)) { day.tracks.push(tr); ok++; }
  }
  busy(false);
  if(!persist()) return;
  toast(`${ok} trace${ok>1?'s':''} ajoutée${ok>1?'s':''}${ko?` · ${ko} illisible${ko>1?'s':''}`:''}${sansDate?' · sans date, placée sur le jour affiché':''}`, 4200);
  if(ok) renderBook();
}

function trackStats(tr){
  const dur = tr.t0 && tr.t1 ? (tr.t1 - tr.t0)/1000 : 0;
  return `${km(tr.dist)}${dur?' · '+dur2(dur):''}${tr.up?' · +'+tr.up+' m':''}`;
}
function dur2(sec){ return dur(sec); }

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
    const video = Exif.isVideo(f);
    // Pour une vidéo on ne garde qu'une image extraite : le fichier lui-même
    // remplirait la mémoire du navigateur en quelques minutes de tournage.
    const thumb = video ? await makePoster(f) : await makeThumb(f);
    if(thumb) await Photos.put(id, thumb);
    fresh.push({ id, t:+new Date(when), lat:gps.lat, lon:gps.lon, name:f.name, video });
    ok++;
  }

  if(fresh.length) mergeIntoDays(fresh);
  busy(false);

  let msg = `${ok} élément${ok>1?'s':''} ajouté${ok>1?'s':''}`;
  if(noGeo) msg += ` · ${noGeo} sans position`;
  toast(msg, 3600);
  persist();
  if(pane==='book') renderBook();
}

/* Image extraite d'une vidéo : on saisit une frame au début du plan. */
function makePoster(file, max=1400, q=.78){
  return new Promise(res=>{
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata'; v.muted = true; v.playsInline = true;
    let done = false;
    const fin = blob => { if(done) return; done = true; URL.revokeObjectURL(url); res(blob); };
    v.onloadeddata = ()=>{ try{ v.currentTime = Math.min(0.5, (v.duration||1)/3); }catch(e){ grab(); } };
    v.onseeked = grab;
    v.onerror = ()=>fin(null);
    setTimeout(()=>fin(null), 12000);            // filet : certains codecs ne décodent pas
    function grab(){
      try{
        const sc = Math.min(1, max/Math.max(v.videoWidth||1, v.videoHeight||1));
        const c = document.createElement('canvas');
        c.width = Math.round((v.videoWidth||640)*sc);
        c.height = Math.round((v.videoHeight||360)*sc);
        c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
        c.toBlob(b=>fin(b), 'image/jpeg', q);
      }catch(e){ fin(null); }
    }
    v.src = url;
  });
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
      if(p.video) (last.videos = last.videos || []).push(p.id);
      last.tEnd = p.t;
      last.lat = (last.lat*(last.photos.length-1) + p.lat)/last.photos.length;
      last.lon = (last.lon*(last.photos.length-1) + p.lon)/last.photos.length;
    } else {
      out.push({ key:p.id, lat:p.lat, lon:p.lon, t:p.t, tEnd:p.t, photos:[p.id], videos:[], name:'', note:'' });
    }
  });
  raw.forEach(p=>{ if(p.video){ const st = out.find(s=>s.photos.includes(p.id)); if(st && !(st.videos||[]).includes(p.id)) (st.videos = st.videos || []).push(p.id); } });
  out.forEach(s=>{ if(named[s.key]){ s.name = named[s.key].name; s.note = named[s.key].note; } });
  return out;
}

/* Rapproche une étape du road book d'un lieu préparé (même nom proposé) */
function nearestSite(pt, maxM=800){
  let best=null, bd=maxM;
  trip.sites.forEach(s=>{
    // Une fiche « Information » est posée sur la carte pour s'y retrouver,
    // mais ce n'est pas un lieu où l'on va : elle ne doit jamais servir à
    // nommer une étape du road book.
    if(s.lat==null || s.kind==='info') return;
    const d = haversine(s,pt);
    if(d<bd){ bd=d; best=s; }
  });
  return best;
}

/* ===================== Exports ===================== */
function bookTitle(){ return trip.name || 'Road book'; }

const BOOK_CSS = `
body{font-family:-apple-system,BlinkMacSystemFont,Georgia,serif;max-width:800px;margin:0 auto;padding:28px 20px;color:#1b1b1b;background:#faf8f4;line-height:1.55}
.brand{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.brand img{width:40px;height:40px;border-radius:10px}
.brand span{font-size:13px;letter-spacing:1.6px;text-transform:uppercase;color:#1d4e5f;font-weight:700}
h1{color:#1d4e5f;font-size:30px;border-bottom:3px solid #c2853a;padding-bottom:10px;margin-bottom:4px}
.sub{color:#6b6b6b;font-size:14px;margin-bottom:28px}
h2{color:#1d4e5f;font-size:21px;margin:34px 0 12px;padding-top:18px;border-top:1px solid #e2ddd4}
h3{font-size:16px;margin:18px 0 4px;color:#143a47}
.n{display:inline-flex;width:22px;height:22px;background:#1d4e5f;color:#fff;border-radius:50%;align-items:center;justify-content:center;font-size:12px;margin-right:6px;vertical-align:2px}
.meta{font-size:12px;color:#6b6b6b;margin:0 0 6px}
.note,.daynote{font-size:14px;background:#fff;border-left:3px solid #c2853a;padding:9px 13px;border-radius:0 7px 7px 0;margin:8px 0}
.leg{font-size:12px;color:#c2853a;margin:6px 0 6px 8px;font-weight:600}
.gal{display:flex;flex-wrap:wrap;gap:12px;margin:10px 0}
.gal figure{margin:0;width:170px}
.gal img{width:170px;height:170px;object-fit:cover;border-radius:7px;display:block}
.gal figcaption{font-size:10.5px;color:#6b6b6b;margin-top:4px;line-height:1.35}
@media print{body{background:#fff;padding:0}.day{page-break-inside:avoid}}
`;

/* Compose le corps du road book. `embed` intègre les photos en base64 :
   indispensable pour un fichier autonome, coûteux pour l'aperçu. */
async function buildBookParts(embed = true){
  const days = dayList();
  let body = '';

  for(const [di,day] of days.entries()){
    body += `<section class="day"><h2>Jour ${di+1} — ${fmtDate(day.date)}</h2>`;
    const tDay = sumLegs(day.steps||[]);
    if(tDay.distance) body += `<p class="meta">🛣️ ${fmtTotal(tDay)}</p>`;
    (day.tracks||[]).forEach(tr=>{
      body += `<p class="meta">🥾 ${escapeHtml(tr.name)} — ${trackStats(tr)}</p>`;
    });
    if(day.note) body += `<p class="daynote">${escapeHtml(day.note).replace(/\n/g,'<br>')}</p>`;
    for(const [si,st] of (day.steps||[]).entries()){
      if(si>0) body += `<p class="leg">↓ ${fmtLeg(legStats(day.steps[si-1], st))}</p>`;
      body += `<div class="step"><h3><span class="n">${si+1}</span> ${escapeHtml(stepLabel(st,si))}</h3>`;
      body += `<p class="meta">${fmtTime(st.t)}${st.tEnd&&st.tEnd!==st.t?' – '+fmtTime(st.tEnd):''} · ${countLabel(st)} · ${st.lat.toFixed(5)}, ${st.lon.toFixed(5)}</p>`;
      if(st.note) body += `<p class="note">${escapeHtml(st.note).replace(/\n/g,'<br>')}</p>`;
      if(embed){
        body += `<div class="gal">`;
        for(const pid of st.photos.slice(0,8)){
          const blob = await Photos.get(pid);
          if(!blob) continue;
          // Légende de chaque photo : sa propre heure de prise de vue (elle est
          // dans `raw`), la date du jour et le lieu de l'étape.
          const raw = (day.raw||[]).find(x=>x.id===pid);
          const vid = (st.videos||[]).includes(pid);
          const cap = `${fmtDateY(day.date)}${raw?' - '+fmtTime(raw.t):''} · ${escapeHtml(stepLabel(st,si))}${vid?' · vidéo':''}`;
          body += `<figure><img src="${await blobToDataUrl(blob)}" alt="${cap}"><figcaption>${cap}</figcaption></figure>`;
        }
        body += `</div>`;
      }
      body += `</div>`;
    }
    body += `</section>`;
  }

  // Le carnet d'adresses en annexe : c'est ce qui sert à refaire le voyage.
  // Les fiches « Information » ont leur propre section : ce ne sont pas des
  // adresses mais ce qu'on a appris en chemin.
  const tous  = trip.sites.slice().sort(bySite);
  const sites = tous.filter(s=>s.kind!=='info');
  const infos = tous.filter(s=>s.kind==='info');
  if(sites.length){
    body += `<section class="day"><h2>Carnet d'adresses</h2>` + sites.map(s=>`
      <div class="step"><h3>${KIND[s.kind].icon} ${escapeHtml(s.name)}</h3>
      <p class="meta">${KIND[s.kind].label}${s.date?' · '+fmtWhen(s):''}${s.lat!=null?` · ${s.lat.toFixed(5)}, ${s.lon.toFixed(5)}`:''}</p>
      ${s.notes?`<p class="note">${escapeHtml(s.notes).replace(/\n/g,'<br>')}</p>`:''}</div>`).join('') + `</section>`;
  }

  if(infos.length){
    body += `<section class="day"><h2>Informations</h2>` + infos.map(s=>`
      <div class="step"><h3>ℹ️ ${escapeHtml(s.name)}</h3>
      ${s.notes?`<p class="note">${escapeHtml(s.notes).replace(/\n/g,'<br>')}</p>`:''}</div>`).join('') + `</section>`;
  }

  const icon = ($('appIcon') || {}).src || '';
  const header = `<div class="brand">${icon?`<img src="${icon}" alt="">`:''}<span>BTHX Travel</span></div>
<h1>${escapeHtml(bookTitle())}</h1>
<div class="sub">${trip.start?fmtDate(trip.start):''}${trip.end?' → '+fmtDate(trip.end):''} · ${days.length} journée${days.length>1?'s':''}${(()=>{ const t=sumLegs(allSteps(days)); return t.distance?' · '+fmtTotal(t):''; })()}</div>`;

  return { header, body };
}

async function buildBookHtml(embed=true){
  const { header, body } = await buildBookParts(embed);
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(bookTitle())}</title><style>${BOOK_CSS}</style></head><body>
${header}${body}
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
/* Sur iPhone, un téléchargement se perd dans Fichiers. La feuille de
   partage iOS — AirDrop, Messages, Mail, Enregistrer dans Fichiers,
   Imprimer — répond d'un seul geste à « enregistrer », « publier » et
   « partager ». On retombe sur le téléchargement là où elle n'existe pas. */
async function shareFile(filename, content, mime, title){
  const blob = content instanceof Blob ? content : new Blob([content], {type:mime});
  try{
    const file = new File([blob], filename, {type:mime});
    if(navigator.canShare && navigator.canShare({files:[file]})){
      await navigator.share({ files:[file], title: title || bookTitle() });
      return 'partagé';
    }
  }catch(e){
    if(e && e.name === 'AbortError') return 'annulé';   // l'utilisateur a fermé la feuille
  }
  download(filename, blob, mime);
  return 'téléchargé';
}

function buildMarkdown(){
  const days = dayList();
  let md = `*BTHX Travel*\n\n# ${bookTitle()}\n\n`;
  if(trip.start) md += `${fmtDate(trip.start)}${trip.end?' → '+fmtDate(trip.end):''}\n\n`;

  days.forEach((day,di)=>{
    md += `## Jour ${di+1} — ${fmtDate(day.date)}\n\n`;
    const tDay = sumLegs(day.steps||[]);
    if(tDay.distance) md += `🛣️ ${fmtTotal(tDay)}\n\n`;
    (day.tracks||[]).forEach(tr=>{ md += `🥾 **${tr.name}** — ${trackStats(tr)}\n\n`; });
    if(day.note) md += `${day.note}\n\n`;
    (day.steps||[]).forEach((st,si)=>{
      if(si>0) md += `↓ *${fmtLeg(legStats(day.steps[si-1], st))}*\n\n`;
      md += `### ${si+1}. ${stepLabel(st,si)}\n`;
      md += `*${fmtTime(st.t)}${st.tEnd&&st.tEnd!==st.t?' – '+fmtTime(st.tEnd):''} · [${st.lat.toFixed(5)}, ${st.lon.toFixed(5)}](https://maps.google.com/?q=${st.lat},${st.lon}) · ${countLabel(st)}*\n\n`;
      if(st.note) md += `${st.note}\n\n`;
      st.photos.forEach(pid=>{
        const raw = (day.raw||[]).find(x=>x.id===pid);
        const vid = (st.videos||[]).includes(pid);
        md += `- ${vid?'🎬':'📷'} ${fmtDateY(day.date)}${raw?' - '+fmtTime(raw.t):''} · ${stepLabel(st,si)}\n`;
      });
      if(st.photos.length) md += `\n`;
    });
  });

  const tous  = trip.sites.slice().sort(bySite);
  const sites = tous.filter(s=>s.kind!=='info');
  const infos = tous.filter(s=>s.kind==='info');
  if(sites.length){
    md += `\n## Carnet d'adresses\n\n`;
    sites.forEach(s=>{
      md += `### ${KIND[s.kind].icon} ${s.name}\n`;
      md += `*${KIND[s.kind].label}${s.date?' · '+fmtWhen(s):''}`;
      if(s.lat!=null) md += ` · [carte](https://maps.google.com/?q=${s.lat},${s.lon})`;
      md += `*\n\n`;
      if(s.notes) md += `${s.notes}\n\n`;
    });
  }
  if(infos.length){
    md += `\n## Informations\n\n`;
    infos.forEach(s=>{
      md += `### ℹ️ ${s.name}\n\n`;
      if(s.notes) md += `${s.notes}\n\n`;
    });
  }
  return md;
}
/* Une PWA installée ne peut pas ouvrir de fenêtre : window.open est
   bloqué. On imprime donc depuis la page elle-même, en masquant tout
   sauf le road book le temps de l'impression. */
async function exportPdf(){
  busy(true,'Préparation du document…');
  const { header, body } = await buildBookParts(true);
  const root = $('printRoot');
  root.innerHTML = `<style>${BOOK_CSS}</style>${header}${body}`;
  busy(false);

  document.body.classList.add('printing');
  const done = ()=>{
    document.body.classList.remove('printing');
    root.innerHTML = '';
    window.removeEventListener('afterprint', done);
  };
  window.addEventListener('afterprint', done);
  setTimeout(()=>{ window.print(); }, 300);
  setTimeout(done, 60000);          // filet de sécurité si afterprint ne vient pas
  toast('Choisissez « PDF » dans la fenêtre d\'impression', 4200);
}

/* ===================== Sauvegarde / restauration ===================== */
async function backup(){
  busy(true,'Constitution de la sauvegarde…');
  const imgs = {};
  for(const k of tripPhotoIds(trip)){               // les photos de CE voyage seulement
    const b = await Photos.get(k);
    if(b) imgs[k] = await blobToDataUrl(b);
  }
  busy(false);
  const payload = { version:2, savedAt:new Date().toISOString(), trip, images:imgs };
  const name = `bthx-${(trip.name||'voyage').replace(/[^a-z0-9]+/gi,'-').toLowerCase()}-${new Date().toISOString().slice(0,10)}.json`;
  const how = await shareFile(name, JSON.stringify(payload), 'application/json', 'Sauvegarde ' + bookTitle());
  if(how !== 'annulé') toast(`Sauvegarde ${how}`, 3200);
}
/* Une sauvegarde revient comme un voyage de la liste. Si ce voyage existe
   déjà, on propose de le remplacer ; sinon il s'ajoute à côté des autres. */
/* Une sauvegarde peut venir d'un autre appareil. On propose de la fusionner
   avec le voyage ouvert (le cas « transfert Mac → iPhone »), ou de l'ajouter
   comme un voyage distinct. */
async function restore(file){
  busy(true,'Lecture de la sauvegarde…');
  let data;
  try{
    data = JSON.parse(await file.text());
    if(!data.trip) throw new Error('format');
  }catch(e){ busy(false); toast('Fichier illisible', 3200); return; }
  busy(false);
  const t = data.trip;
  t.days = t.days||[]; t.sites = t.sites||[];

  const v = await ask({
    title:'Restaurer « ' + (t.name||'Voyage') + ' »',
    msg:`${t.sites.length} lieux · ${t.days.length} journées · ${Object.keys(data.images||{}).length} photos.\n\n`
       +`Fusionner : ajoute ce qui manque au voyage ouvert « ${trip.name} », sans rien effacer.\n`
       +`Ajouter à côté : en fait un voyage distinct dans la liste.`,
    ok:'Fusionner', cancel:'Ajouter à côté'
  });

  busy(true,'Restauration…');
  try{
    if(data.images){
      for(const [id,dataUrl] of Object.entries(data.images)){
        const blob = await (await fetch(dataUrl)).blob();
        await Photos.put(id, blob);
      }
    }
    if(v !== null){
      const n = mergeTrips(trip, t);
      persist(); busy(false);
      switchTrip(trip.id);
      toast(`Fusion : ${n.added} lieu${n.added>1?'x':''} ajouté${n.added>1?'s':''}, ${n.updated} mis à jour, ${n.days} journée${n.days>1?'s':''}`, 4200);
    } else {
      if(!t.id || Store.list().some(x=>x.id===t.id)) t.id = Store.blank().id;
      Store.save(t); busy(false);
      switchTrip(t.id);
      toast('Voyage ajouté à la liste', 3000);
    }
  }catch(e){
    busy(false);
    toast('Restauration interrompue', 3200);
  }
}

function topUpCape(t){
  const norm = x => (x||'').toLowerCase().replace(/\s+/g,' ').trim();
  const have = new Set(t.sites.map(x=>norm(x.name)));
  let added = 0, fixed = 0;
  CAPE_TRIP.sites.forEach(src=>{
    if(!have.has(norm(src.name))){ t.sites.push(Object.assign({id:uid()}, src)); added++; }
  });
  t.sites.forEach(x=>{
    const f = CAPE_FIXES[x.name];
    if(f && x.date === f.from){ x.date = f.to; fixed++; }
    const src = CAPE_TRIP.sites.find(c=>c.name===x.name);
    if(src && src.time && !x.time) x.time = src.time;
  });
  return {added, fixed};
}

/* ===================== Fusion de deux copies d'un voyage =====================
   Chaque appareil garde ses données (aucun serveur). Pour passer du Mac à
   l'iPhone : Sauvegarder → AirDrop → Restaurer → Fusionner. La fusion ajoute
   ce qui manque sans rien effacer : les mêmes lieux saisis sur deux appareils
   se reconnaissent à leur identifiant, ou à leur nom et leur date. */
function mergeTrips(into, from){
  const norm = x => (x||'').toLowerCase().replace(/\s+/g,' ').trim();
  const same = (a,b) => a.id===b.id || (norm(a.name)===norm(b.name) && (a.date||'')===(b.date||''));
  let added = 0, updated = 0;
  (from.sites||[]).forEach(fs=>{
    const cur = into.sites.find(x=>same(x,fs));
    if(!cur){ into.sites.push(Object.assign({}, fs)); added++; return; }
    // Même lieu : on garde la version modifiée le plus récemment, sinon on
    // complète seulement ce qui manque (notes plus longues, coordonnées, heure).
    if((fs.updated||0) > (cur.updated||0)){ Object.assign(cur, fs, {id:cur.id}); updated++; return; }
    let ch = false;
    if(cur.lat==null && fs.lat!=null){ cur.lat=fs.lat; cur.lon=fs.lon; ch=true; }
    if(!cur.time && fs.time){ cur.time=fs.time; ch=true; }
    if((fs.notes||'').length > (cur.notes||'').length && !(cur.notes||'').includes(fs.notes)){ cur.notes=fs.notes; ch=true; }
    if(ch) updated++;
  });
  let days = 0;
  (from.days||[]).forEach(fd=>{
    let d = into.days.find(x=>x.date===fd.date);
    if(!d){ into.days.push(JSON.parse(JSON.stringify(fd))); days++; return; }
    const raw = d.raw || (d.raw=[]);
    (fd.raw||[]).forEach(p=>{ if(!raw.some(x=>x.id===p.id)) raw.push(p); });
    (fd.photos||[]).forEach(p=>{ if(!d.photos.includes(p)) d.photos.push(p); });
    if(fd.note && !(d.note||'').includes(fd.note)) d.note = d.note ? d.note + '\n\n' + fd.note : fd.note;
    (fd.tracks||[]).forEach(tr=>{
      d.tracks = d.tracks || [];
      if(!d.tracks.some(x=>x.name===tr.name && Math.abs(x.dist-tr.dist) < 50)) d.tracks.push(tr);
    });
    raw.sort((a,b)=>a.t-b.t);
    d.steps = clusterSteps(raw, (d.steps||[]).concat(fd.steps||[]));
    days++;
  });
  if(!into.start && from.start) into.start = from.start;
  if(!into.end && from.end) into.end = from.end;
  return {added, updated, days};
}

/* ===================== Plusieurs voyages ===================== */
function fillTripMenu(){
  const sel = $('mTrip');
  sel.innerHTML = Store.list().map(t=>
    `<option value="${t.id}"${t.id===trip.id?' selected':''}>${escapeHtml(t.name)}${t.start?' — '+t.start.slice(0,4):''}</option>`).join('');
  $('mName').value = trip.name; $('mStart').value = trip.start||''; $('mEnd').value = trip.end||'';
}
function switchTrip(id){
  const t = Store.load(id); if(!t) return;
  trip = t; Store.setCurrent(id);
  dayIndex = 0; renderPrep._fitted = false;
  refreshHeader(); fillTripMenu();
  if(pane==='prep') renderPrep(); else renderBook();
}
async function newTrip(){
  const v = await ask({ title:'Nouveau voyage', fields:[{label:'Nom', placeholder:'ex. Namibie 2027'}], ok:'Créer' });
  if(v===null) return;
  const t = Store.create(v[0].trim() || 'Nouveau voyage');
  if(!t){ toast('⚠️ Mémoire pleine — faites une sauvegarde puis supprimez un ancien voyage.', 5000); return; }
  switchTrip(t.id);
  switchPane('prep');
  toast('Voyage créé — renseignez les dates ci-dessus', 3200);
}
async function deleteTrip(){
  if(!(await askYes('Supprimer ce voyage ?', `« ${trip.name} » — étapes, journées et photos.\nFaites une sauvegarde avant.`, 'Supprimer', true))) return;
  // On garde les photos qu'un autre voyage utiliserait encore (copie restaurée).
  const used = new Set();
  Store.list().filter(x=>x.id!==trip.id).forEach(x=>{ const o=Store.load(x.id); if(o) tripPhotoIds(o).forEach(p=>used.add(p)); });
  for(const pid of tripPhotoIds(trip)) if(!used.has(pid)){ await Photos.del(pid); urlCache.delete(pid); }
  Store.remove(trip.id);
  const next = Store.current();
  switchTrip(next.id);
  closeSheet('menu'); switchPane('prep');
  toast('Voyage supprimé');
}

/* ===================== Coller une confirmation ===================== */
let pasteProps = [];

function openPaste(){
  $('pasteText').value = '';
  pasteProps = [];
  renderProps();
  openSheet('paste');
}

function analysePaste(){
  const txt = $('pasteText').value;
  if(txt.trim().length < 20){ toast('Collez d\'abord le texte du mail'); return; }
  pasteProps = Confirm.analyse(txt).map(p => Object.assign({ keep:true }, p));
  if(!pasteProps.length){
    // Rien de reconnu : on propose quand même de garder le texte,
    // plutôt que de renvoyer l'utilisateur les mains vides.
    pasteProps = [{
      keep:true, kind:'etape', name:'Réservation', date:'', lat:null, lon:null,
      notes: txt.trim().slice(0, 1200)
    }];
    toast('Rien reconnu — le texte est gardé en note', 3600);
  }
  renderProps();
}

function renderProps(){
  const box = $('pasteResult');
  if(!pasteProps.length){ box.innerHTML = ''; return; }

  box.innerHTML = pasteProps.map((p,i)=>`
    <div class="prop ${p.keep?'on':'off'}" data-i="${i}">
      <div class="prop-check">${p.keep?'✓':''}</div>
      <div class="prop-body">
        <div class="prop-name">${KIND[p.kind].icon} ${escapeHtml(p.name)}</div>
        <div class="prop-meta">${KIND[p.kind].label}${p.date?' · '+fmtWhen(p):' · date à préciser'}${p.lat!=null?' · situé':''}</div>
        ${p.notes?`<div class="prop-note">${escapeHtml(p.notes.split('\n').slice(0,3).join('\n'))}</div>`:''}
      </div>
    </div>`).join('')
    + `<button class="menu-btn wide" id="btnPasteAdd"><span>➕</span>Ajouter au voyage</button>`;

  box.querySelectorAll('.prop').forEach(el=>{
    el.onclick = ()=>{
      const i = +el.dataset.i;
      pasteProps[i].keep = !pasteProps[i].keep;
      renderProps();
    };
  });
  $('btnPasteAdd').onclick = addProps;
}

function addProps(){
  const gardes = pasteProps.filter(p => p.keep);
  if(!gardes.length){ toast('Rien de sélectionné'); return; }
  gardes.forEach(p=>{
    trip.sites.push({
      id: uid(), name: p.name, kind: p.kind, date: p.date, time: p.time || '',
      lat: p.lat, lon: p.lon, notes: p.notes
    });
  });
  persist();
  closeSheet('paste');
  refreshHeader();
  renderPrep();
  switchPane('prep');
  toast(`${gardes.length} entrée${gardes.length>1?'s':''} ajoutée${gardes.length>1?'s':''}`, 3000);
}

/* ===================== Dialogue maison =====================
   ask({title, msg, fields:[{label,value,placeholder,multiline}], ok, cancel, danger})
   → Promise : tableau des valeurs saisies si OK, null si Annuler. */
let askResolve = null;
function ask(o){
  if(askResolve) askResolve(null);
  $('askTitle').textContent = o.title || '';
  $('askMsg').textContent   = o.msg || '';
  const fields = o.fields || [];
  $('askFields').innerHTML = fields.map((f,i)=>`<div class="ask-field">
      ${f.label?`<label for="askF${i}">${escapeHtml(f.label)}</label>`:''}
      ${f.multiline
        ? `<textarea id="askF${i}" placeholder="${escapeHtml(f.placeholder||'')}">${escapeHtml(f.value||'')}</textarea>`
        : `<input type="text" id="askF${i}" value="${escapeHtml(f.value||'')}" placeholder="${escapeHtml(f.placeholder||'')}" enterkeyhint="done">`}
    </div>`).join('');
  $('askOk').textContent = o.ok || 'OK';
  $('askCancel').textContent = o.cancel || 'Annuler';
  $('askOk').classList.toggle('danger', !!o.danger);
  openSheet('ask');
  if(fields.length) setTimeout(()=>{ const f=$('askF0'); if(f){ f.focus(); f.select && f.select(); } }, 80);
  return new Promise(res=>{ askResolve = res; });
}
function askClose(ok){
  const res = askResolve; askResolve = null;
  const vals = ok ? Array.from($('askFields').querySelectorAll('input,textarea')).map(e=>e.value) : null;
  closeSheet('ask');
  if(res) res(vals);
}
const askYes = (title, msg, ok='OK', danger=false) => ask({title, msg, ok, danger}).then(v=>v!==null);

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
  $('eTime').value  = s?(s.time||''):'';
  $('eVia').checked = s ? !!s.via : false;
  $('editNav').hidden = !(s && s.lat!=null);
  if(s && s.lat!=null){
    $('navPlan').href   = NAV.plan(s);
    $('navWaze').href   = NAV.waze(s);
    $('navGoogle').href = NAV.google(s);
  }
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
    time:  $('eTime').value || '',
    via:   $('eVia').checked,
    lat:   $('eLat').value===''?null:parseFloat($('eLat').value),
    lon:   $('eLon').value===''?null:parseFloat($('eLon').value),
    notes: $('eNotes').value
  };
  rec.updated = Date.now();
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
      if(btn.dataset.act==='nav' && s && s.lat!=null) askNav(s, s.name);
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
  $('btnNavPrep').onclick = ()=>{
    const pts = routePoints();
    const url = routeLink(pts);
    if(!url){ toast('Il faut au moins deux étapes situées'); return; }
    openNav(url);
    toast('Itinéraire complet ouvert dans Google Maps', 3200);
  };
  $('btnRoutePrep').onclick = e=>{
    if(!maps.prep){ toast('Carte indisponible hors ligne'); return; }
    routeOn.prep = !routeOn.prep;
    e.currentTarget.classList.toggle('on', routeOn.prep);
    if(routeOn.prep) drawRoute('prep', routePoints(), $('routeInfoPrep'));
    else { if(layers.prep.route){ maps.prep.removeLayer(layers.prep.route); layers.prep.route=null; } $('routeInfoPrep').hidden=true; }
  };

  // Road book
  let lastDay = 0;
  $('btnPrevDay').onclick = ()=>{ dayIndex = dayIndex<0 ? dayList().length-1 : dayIndex-1; renderBook(); };
  $('btnNextDay').onclick = ()=>{ dayIndex = dayIndex<0 ? 0 : dayIndex+1; renderBook(); };
  $('btnAllDays').onclick = ()=>{
    if(dayIndex<0) dayIndex = lastDay; else { lastDay = dayIndex; dayIndex = -1; }
    renderBook();
  };
  $('btnImport').onclick  = ()=>$('photoInput').click();
  $('photoInput').onchange = e=>{ importPhotos(Array.from(e.target.files)); e.target.value=''; };
  $('btnTrack').onclick = ()=>$('gpxInput').click();
  $('gpxInput').onchange = e=>{ importTracks(Array.from(e.target.files)); e.target.value=''; };

  $('dayNote').oninput = ()=>{
    const days = dayList(); if(!days.length || dayIndex<0) return;
    days[dayIndex].note = $('dayNote').value;
    clearTimeout(window._noteT);
    window._noteT = setTimeout(persist, 600);
  };

  $('stepList').onclick = e=>{
    const dayEl = e.target.closest('[data-day]');
    if(dayEl){ dayIndex = +dayEl.dataset.day; renderBook(); $('stepList').scrollTop = 0; return; }
    const del = e.target.closest('[data-act="deltrack"]');
    if(del){
      const days = dayList(); const day = days[dayIndex];
      askYes('Supprimer cette trace ?', day.tracks[+del.dataset.track].name, 'Supprimer', true).then(ok=>{
        if(!ok) return;
        day.tracks.splice(+del.dataset.track, 1);
        persist(); renderBook();
      });
      return;
    }
    const nav = e.target.closest('[data-act="nav"]');
    if(nav){
      const days = dayList(); const st = days[dayIndex].steps[+nav.dataset.step];
      askNav(st, stepLabel(st, +nav.dataset.step));
      return;
    }
    const btn = e.target.closest('[data-act="rename"]'); if(!btn) return;
    const days = dayList(); const st = days[dayIndex].steps[+btn.dataset.step];
    const suggestion = stepLabel(st, +btn.dataset.step);
    ask({ title:'Étape', ok:'Enregistrer', fields:[
      {label:'Nom', value:suggestion, placeholder:'Nom du lieu'},
      {label:'Note (facultatif)', value:st.note||'', multiline:true}
    ]}).then(v=>{
      if(v===null) return;
      st.name = v[0].trim(); st.note = v[1];
      persist(); renderBook();
    });
  };

  $('btnFitBook').onclick = ()=>{
    const days = dayList(); if(!days.length) return;
    fitTo('book', dayIndex<0 ? allSteps(days) : (days[dayIndex].steps||[]));
  };
  $('btnRouteBook').onclick = e=>{
    if(!maps.book){ toast('Carte indisponible hors ligne'); return; }
    routeOn.book = !routeOn.book;
    e.currentTarget.classList.toggle('on', routeOn.book);
    renderBook();          // les distances restent ; seul le tracé apparaît ou disparaît
  };

  $('viewerClose').onclick = ()=>{ $('viewer').hidden = true; };

  /* ---- Glisser-déposer et coller (Mac surtout) ----
     On accepte le dépôt n'importe où dans la page : viser une zone précise
     au trackpad avec une poignée de photos dans la main est pénible. */
  const drop = $('dropzone');
  let dragDepth = 0;
  const hasFiles = e => Array.from(e.dataTransfer.types||[]).includes('Files');
  document.addEventListener('dragenter', e=>{
    if(!hasFiles(e)) return;
    e.preventDefault(); dragDepth++; drop.hidden = false;
  });
  document.addEventListener('dragover', e=>{ if(hasFiles(e)) e.preventDefault(); });
  document.addEventListener('dragleave', e=>{
    if(!hasFiles(e)) return;
    if(--dragDepth <= 0){ dragDepth = 0; drop.hidden = true; }
  });
  document.addEventListener('drop', e=>{
    if(!hasFiles(e)) return;
    e.preventDefault(); dragDepth = 0; drop.hidden = true;
    const files = Array.from(e.dataTransfer.files || []);
    if(!files.length) return;
    switchPane('book');
    const gpx = files.filter(f=>/\.gpx$/i.test(f.name));
    const media = files.filter(f=>!/\.gpx$/i.test(f.name));
    if(gpx.length) importTracks(gpx);
    if(media.length) importPhotos(media);
  });
  document.addEventListener('paste', e=>{
    const items = Array.from((e.clipboardData||{}).files || []);
    if(!items.length) return;
    if(document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    switchPane('book');
    importPhotos(items);
  });

  // Menu
  $('btnMenu').onclick = ()=>{
    fillTripMenu(); showStorage(); openSheet('menu');
  };
  $('btnCloseMenu').onclick = $('menuBackdrop').onclick = ()=>closeSheet('menu');
  ['mName','mStart','mEnd'].forEach(id=>{
    $(id).onchange = ()=>{
      trip.name  = $('mName').value.trim() || 'Nouveau voyage';
      trip.start = $('mStart').value; trip.end = $('mEnd').value;
      persist(); refreshHeader(); fillTripMenu();
    };
  });
  $('mTrip').onchange = e=>{ switchTrip(e.target.value); toast('Voyage ouvert : ' + trip.name); };
  $('btnNewTrip').onclick = newTrip;
  $('btnDeleteTrip').onclick = deleteTrip;

  $('btnExpPdf').onclick  = ()=>{ closeSheet('menu'); exportPdf(); };
  $('btnExpHtml').onclick = async ()=>{
    closeSheet('menu');
    busy(true,'Construction de la page…');
    const html = await buildBookHtml(true);
    busy(false);
    const how = await shareFile(`${bookTitle()}.html`, html, 'text/html');
    if(how !== 'annulé') toast(`Road book ${how}`, 3000);
  };
  $('btnExpMd').onclick = async ()=>{
    closeSheet('menu');
    const md = buildMarkdown();
    // Le presse-papiers d'abord : c'est ce qui se colle directement dans Notion.
    let copied = false;
    try{ await navigator.clipboard.writeText(md); copied = true; }catch(e){}
    const how = await shareFile(`${bookTitle()}.md`, md, 'text/markdown');
    if(how !== 'annulé'){
      toast(copied ? 'Copié — collez dans Notion' : `Markdown ${how}`, 3600);
    }
  };

  $('btnBackup').onclick  = ()=>{ closeSheet('menu'); backup(); };
  $('btnRestore').onclick = ()=>$('restoreInput').click();
  $('restoreInput').onchange = e=>{ if(e.target.files[0]) restore(e.target.files[0]); e.target.value=''; };

  $('btnLoadCape').onclick = async ()=>{
    // Voyage du Cap déjà ouvert : on le complète (adresses ajoutées depuis,
    // dates corrigées) sans rien écraser de ce que l'utilisateur a saisi.
    if(trip.name === CAPE_TRIP.name && trip.sites.length){
      const n = topUpCape(trip);
      persist(); closeSheet('menu'); switchPane('prep');
      toast(n.added || n.fixed ? `${n.added} adresse${n.added>1?'s':''} ajoutée${n.added>1?'s':''} · ${n.fixed} date${n.fixed>1?'s':''} corrigée${n.fixed>1?'s':''}` : 'Itinéraire du Cap déjà à jour', 3600);
      return;
    }
    // Voyage vide : on le remplit. Sinon le Cap devient un voyage à part.
    if(trip.sites.length || trip.days.length){
      if(!(await askYes('Itinéraire du Cap', 'Créer un nouveau voyage avec l\'itinéraire du Cap ?\nLe voyage actuel reste intact dans la liste.', 'Créer'))) return;
      const t = Store.create(CAPE_TRIP.name);
      if(!t){ toast('⚠️ Mémoire pleine — impossible de créer le voyage.', 5000); return; }
      trip = t;
    }
    trip.name = CAPE_TRIP.name; trip.start = CAPE_TRIP.start; trip.end = CAPE_TRIP.end;
    trip.sites = CAPE_TRIP.sites.map(s=>Object.assign({id:uid()}, s));
    persist(); switchTrip(trip.id); closeSheet('menu'); switchPane('prep');
    setTimeout(()=>fitTo('prep', trip.sites.filter(s=>s.lat!=null)), 300);
    toast('Itinéraire du Cap chargé', 3000);
  };

  // Coller une confirmation
  $('btnPaste').onclick = ()=>{ closeSheet('menu'); openPaste(); };
  $('btnPasteAnalyse').onclick = analysePaste;
  $('btnPasteClose').onclick = $('pasteBackdrop').onclick = ()=>closeSheet('paste');

  // Dialogue maison
  $('askOk').onclick = ()=>askClose(true);
  $('askCancel').onclick = $('askBackdrop').onclick = ()=>askClose(false);
  $('askFields').addEventListener('keydown', e=>{
    if(e.key==='Enter' && e.target.tagName==='INPUT'){ e.preventDefault(); askClose(true); }
  });

  // Éditeur
  $('btnEditSave').onclick = saveEditor;
  $('btnEditCancel').onclick = $('editBackdrop').onclick = ()=>closeSheet('edit');
  $('btnEditDelete').onclick = async ()=>{
    if(!editingId || !(await askYes('Supprimer cette étape ?', '', 'Supprimer', true))) return;
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
        `Ce voyage : ${trip.sites.length} étapes · ${trip.days.length} journées · ${tripPhotoIds(trip).length} photos. `
        + `${Store.list().length} voyage${Store.list().length>1?'s':''} — ${(usage/1048576).toFixed(0)} Mo utilisés (${pct} %)`;
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
