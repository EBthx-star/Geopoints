import { chromium } from 'playwright';
import fs from 'fs';

/* Le banc rejoue index.html en remplaçant Leaflet par un stub local,
   afin de tourner sans accès réseau. */
const root = new URL('..', import.meta.url).pathname;
const html = fs.readFileSync(root + 'index.html', 'utf8')
  .replace(/<script src="https:\/\/unpkg[^"]*"><\/script>/, '<script src="./test/leaflet-stub.js"></script>')
  .replace(/<link rel="stylesheet" href="https:\/\/unpkg[^"]*">/, '');
fs.writeFileSync(root + 'test-harness.html', html);

const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const p = await b.newPage();
const errs = [];
p.on('console', m => { if(m.type()==='error') errs.push(m.text()); });
p.on('pageerror', e => errs.push('PAGEERROR: '+e.message));

// OSRM simulé : 1 km de route = 1 min, avec un détour de 30 %.
await p.route('**/router.project-osrm.org/**', route=>{
  const m = route.request().url().match(/driving\/([-\d.]+),([-\d.]+);([-\d.]+),([-\d.]+)/);
  const [lo1,la1,lo2,la2] = m.slice(1).map(Number);
  const d = Math.hypot((la2-la1)*111000, (lo2-lo1)*92000) * 1.3;
  route.fulfill({ contentType:'application/json', body: JSON.stringify({ routes:[{
    distance:d, duration:d/1000*60, geometry:{coordinates:[[lo1,la1],[lo2,la2]]} }] }) });
});
// Un voyage saisi avant la version multi-voyages doit être repris.
// Comme dans l'app installée sur iPhone : les dialogues système ne s'affichent pas.
await p.addInitScript(()=>{ window.prompt=()=>null; window.confirm=()=>false; window.alert=()=>{}; });
await p.addInitScript(()=>{
  if(!sessionStorage.getItem('seeded')){
    sessionStorage.setItem('seeded','1');
    localStorage.clear();
    localStorage.setItem('bthx.trip.v1', JSON.stringify({name:'Ancien voyage',start:'2025-10-01',end:'',sites:[{id:'x',name:'Vieux site',kind:'site',lat:-33.9,lon:18.4,date:'',notes:''}],days:[]}));
  }
});
await p.goto('http://localhost:8777/test-harness.html', { waitUntil:'networkidle' });
await p.waitForTimeout(600);

const r = {};
// 1 — chargement sans erreur
r['app chargée'] = await p.evaluate(()=> typeof trip === 'object' && typeof renderPrep === 'function');
r['migration v1'] = await p.evaluate(()=> trip.name==='Ancien voyage' && trip.sites.length===1 && !localStorage.getItem('bthx.trip.v1'));
r['carte isolée (bug OSM)'] = await p.evaluate(()=> getComputedStyle(document.querySelector('.map-wrap')).isolation);

// 2 — itinéraire du Cap
await p.click('#btnMenu'); await p.waitForTimeout(200);
await p.click('#btnLoadCape'); await p.waitForTimeout(300);
await p.click('#askOk'); await p.waitForTimeout(500);
r['itinéraire Cap chargé'] = await p.evaluate(()=> trip.sites.length);
r['Cap = nouveau voyage, ancien intact'] = await p.evaluate(()=> Store.list().map(t=>t.name));
r['nom du voyage'] = await p.textContent('#tripName');
r['étapes affichées'] = await p.evaluate(()=> document.querySelectorAll('#siteList .item').length);

// 3 — filtres
await p.click('#siteFilters .chip[data-kind="hotel"]'); await p.waitForTimeout(200);
r['filtre hôtels'] = await p.evaluate(()=> document.querySelectorAll('#siteList .item').length);
await p.click('#siteFilters .chip[data-kind="all"]'); await p.waitForTimeout(200);

// 4 — ajout d'une étape
await p.click('#btnAddSite'); await p.waitForTimeout(200);
await p.fill('#eName','Test Kirstenbosch'); await p.fill('#eLat','-33.9880'); await p.fill('#eLon','18.4326');
await p.selectOption('#eKind','site'); await p.fill('#eDate','2026-09-23');
await p.click('#btnEditSave'); await p.waitForTimeout(300);
r['étape ajoutée'] = await p.evaluate(()=> trip.sites.some(s=>s.name==='Test Kirstenbosch'));

// 5 — persistance
r['persistance localStorage'] = await p.evaluate(()=>{
  const t = Store.load(trip.id);
  return t && t.sites.length === trip.sites.length;
});

// 6 — clustering du road book (simulation de 3 lieux sur une journée)
r['clustering'] = await p.evaluate(()=>{
  const base = new Date(2026,8,22,9,0,0).getTime();
  const pts = [
    {id:'a1', t:base,            lat:-33.9249, lon:18.4241},   // Le Cap
    {id:'a2', t:base+5*60000,    lat:-33.9250, lon:18.4243},   // même lieu
    {id:'b1', t:base+90*60000,   lat:-33.9321, lon:18.8602},   // Stellenbosch
    {id:'c1', t:base+300*60000,  lat:-34.1928, lon:18.4326}    // Simon's Town
  ];
  mergeIntoDays(pts);
  const day = trip.days.find(d=>d.date==='2026-09-22');
  return day ? day.steps.length : -1;
});
r['photos de la journée'] = await p.evaluate(()=> (trip.days.find(d=>d.date==='2026-09-22')||{}).photos.length);

// 7 — rendu du road book
await p.click('.tab[data-pane="book"]'); await p.waitForTimeout(500);
r['titre du jour'] = await p.textContent('#dayTitle');
r['étapes du jour'] = await p.evaluate(()=> document.querySelectorAll('#stepList .item').length);
await p.waitForTimeout(800);
r['trajets entre étapes'] = await p.evaluate(()=> Array.from(document.querySelectorAll('#stepList .leg-txt')).map(e=>e.textContent));
r['total du jour'] = await p.textContent('#daySub');
r['cartouche carte'] = await p.textContent('#routeInfoBook');
r['étape nommée d après le lieu'] = await p.evaluate(()=> Array.from(document.querySelectorAll('#stepList .item-title')).map(e=>e.textContent.trim()));

// 7b — un second jour, puis la vue « Tout le voyage »
await p.evaluate(()=>{
  const base = new Date(2026,8,24,10,0,0).getTime();
  mergeIntoDays([{id:'d1',t:base,lat:-33.9321,lon:18.8602},{id:'d2',t:base+3*3600000,lat:-33.9179,lon:18.9203}]);
  persist(); renderBook();
});
await p.click('#btnAllDays'); await p.waitForTimeout(900);
r['vue voyage : titre'] = await p.textContent('#dayTitle');
r['vue voyage : sous-titre'] = await p.textContent('#daySub');
r['vue voyage : jours listés'] = await p.evaluate(()=> Array.from(document.querySelectorAll('.day-item .item-meta')).map(e=>e.textContent));
r['vue voyage : transfert'] = await p.evaluate(()=> Array.from(document.querySelectorAll('#stepList .leg-txt')).map(e=>e.textContent));
await p.click('.day-item[data-day="1"]'); await p.waitForTimeout(500);
r['clic sur un jour'] = await p.textContent('#dayTitle');
await p.click('#btnPrevDay'); await p.waitForTimeout(400);

// 8 — note de journée
await p.fill('#dayNote','Première journée : arrivée et Table Mountain.');
await p.waitForTimeout(900);
r['note enregistrée'] = await p.evaluate(()=> {
  const t = Store.load(trip.id);
  return (t.days.find(d=>d.date==='2026-09-22')||{}).note || '';
});

// 9 — exports
r['markdown'] = await p.evaluate(()=>{ const md = buildMarkdown(); return md.length>200 && md.includes('Carnet') && md.includes('Jour 1'); });
r['html'] = await p.evaluate(async()=>{ const h = await buildBookHtml(false); return h.length>500 && h.includes('<h1>'); });

// 10 — nommage d'une étape rapproché d'un lieu préparé
r['rapprochement lieu'] = await p.evaluate(()=>{
  const st = trip.days.find(d=>d.date==='2026-09-22').steps[1];
  const s = nearestSite(st);
  return s ? s.name : 'aucun';
});

// 11 — plusieurs voyages : créer, basculer, supprimer
await p.click('#btnMenu'); await p.waitForTimeout(200);
r['sélecteur de voyages'] = await p.evaluate(()=> document.querySelectorAll('#mTrip option').length);
await p.click('#btnNewTrip'); await p.waitForTimeout(300);
r['dialogue nouveau voyage visible'] = await p.evaluate(()=> !document.getElementById('askSheet').hidden && document.getElementById('askTitle').textContent);
await p.fill('#askF0','Namibie 2027');
await p.click('#askOk'); await p.waitForTimeout(400);
r['nouveau voyage ouvert'] = await p.evaluate(()=> ({nom:trip.name, étapes:trip.sites.length, voyages:Store.list().length}));
r['menu refermé ? (non : on renseigne les dates)'] = await p.evaluate(()=> !document.getElementById('menuSheet').hidden);
const capeId = await p.evaluate(()=> Store.list().find(t=>t.name.includes('Cap')).id);
await p.selectOption('#mTrip', capeId); await p.waitForTimeout(400);
r['retour au Cap'] = await p.evaluate(()=> ({nom:trip.name, étapes:trip.sites.length, jours:trip.days.length}));
await p.selectOption('#mTrip', await p.evaluate(()=> Store.list().find(t=>t.name==='Namibie 2027').id)); await p.waitForTimeout(300);
await p.click('#btnDeleteTrip'); await p.waitForTimeout(300);
await p.click('#askOk'); await p.waitForTimeout(500);
r['après suppression'] = await p.evaluate(()=> ({ouvert:trip.name, liste:Store.list().map(t=>t.name)}));
await p.reload(); await p.waitForTimeout(700);
r['rechargement : voyage courant conservé'] = await p.evaluate(()=> trip.name);

await b.close();
console.log(JSON.stringify(r,null,2));
console.log(errs.length ? '\n⚠️ ERREURS CONSOLE:\n'+errs.join('\n') : '\n✅ Aucune erreur console');
