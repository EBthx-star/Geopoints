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

await p.goto('http://localhost:8777/test-harness.html', { waitUntil:'networkidle' });
await p.waitForTimeout(600);

const r = {};
// 1 — chargement sans erreur
r['app chargée'] = await p.evaluate(()=> typeof trip === 'object' && typeof renderPrep === 'function');

// 2 — itinéraire du Cap
await p.click('#btnMenu'); await p.waitForTimeout(200);
p.once('dialog', d=>d.accept());
await p.click('#btnLoadCape'); await p.waitForTimeout(500);
r['itinéraire Cap chargé'] = await p.evaluate(()=> trip.sites.length);
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
  const t = JSON.parse(localStorage.getItem('bthx.trip.v1'));
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

// 8 — note de journée
await p.fill('#dayNote','Première journée : arrivée et Table Mountain.');
await p.waitForTimeout(900);
r['note enregistrée'] = await p.evaluate(()=> {
  const t = JSON.parse(localStorage.getItem('bthx.trip.v1'));
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

await b.close();
console.log(JSON.stringify(r,null,2));
console.log(errs.length ? '\n⚠️ ERREURS CONSOLE:\n'+errs.join('\n') : '\n✅ Aucune erreur console');
