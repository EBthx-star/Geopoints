/* BTHX Travel — données de référence et stockage
   ------------------------------------------------------------------
   L'itinéraire Le Cap 2026 reprend la boucle arrêtée dans le road book :
   côte à l'aller (Garden Route), retour par la Route 62 / Klein Karoo.
   Les coordonnées sont un point de départ : chaque étape reste éditable.
*/

const CAPE_TRIP = {
  name: "Le Cap & Western Cape",
  start: "2026-09-22",
  end: "2026-10-10",
  sites: [
    // ---- Semaine 1 — réservée ----
    { name:"Blue Peter Hotel — Bloubergstrand", kind:"hotel", lat:-33.80670, lon:18.46940, date:"2026-09-22",
      notes:"+27 21 554 1956\nBase des premières nuits, vue sur Table Mountain depuis la plage.\nÀ proximité : Petiscos (peri-peri), Ons Huisie." },
    { name:"Le Cap — V&A / Oranjezicht Market", kind:"site", lat:-33.92490, lon:18.42410, date:"2026-09-23",
      notes:"Oranjezicht City Farm Market le samedi matin (V&A).\nSturk's Tobacconists — la référence historique en ville." },
    { name:"Bonne Esperance Guest House — Stellenbosch", kind:"hotel", lat:-33.93210, lon:18.86020, date:"2026-09-24",
      notes:"+27 21 887 0225\nDorp Street à deux pas, Stellenbosch Tobacconist dans la rue." },
    { name:"Tokara", kind:"table", lat:-33.91790, lon:18.92030, date:"2026-09-24",
      notes:"Winelands. Vue sur la vallée, cuisine sud-africaine. Réserver." },
    { name:"Overture", kind:"table", lat:-33.96860, lon:18.85240, date:"2026-09-25",
      notes:"Hidden Valley. Table de référence des Winelands. Réserver largement à l'avance." },
    { name:"Babylonstoren — Simondium", kind:"site", lat:-33.82670, lon:18.92670, date:"2026-09-25",
      notes:"Jardin potager historique, ferme et cave. Repéré via l'email Air France." },
    { name:"Simon's Town Quayside Hotel", kind:"hotel", lat:-34.19280, lon:18.43260, date:"2026-09-26",
      notes:"+27 21 786 3838\nSur le port. Manchots de Boulders à côté, Cap de Bonne-Espérance au sud." },
    { name:"Harbour House — Kalk Bay", kind:"table", lat:-34.12760, lon:18.44850, date:"2026-09-26",
      notes:"Poisson, les pieds au-dessus de l'eau. Bertha's juste à côté à Simon's Town." },
    { name:"11 Westcliff — Hermanus", kind:"hotel", lat:-34.41870, lon:19.23450, date:"2026-09-28",
      notes:"+27 82 758 6889\nSaison des baleines : observation depuis la falaise du Cliff Path." },
    { name:"Creation Wines — Hemel-en-Aarde", kind:"table", lat:-34.34280, lon:19.33360, date:"2026-09-28",
      notes:"Accords mets-vins dans la vallée Hemel-en-Aarde. Réserver." },
    { name:"Bientang's Cave — Hermanus", kind:"table", lat:-34.41940, lon:19.24040, date:"2026-09-29",
      notes:"Restaurant dans une grotte au ras des vagues. Baleines depuis la table en saison.\nAutres : Perlemoen Seafront, Fick's Pool, The Rock, La Pentola." },
    { name:"Oceans Guest House — Struisbaai", kind:"hotel", lat:-34.79750, lon:20.05220, date:"2026-09-30",
      notes:"+27 60 980 0664\nLe port aux raies. Cap Agulhas à 5 min : le vrai point le plus austral de l'Afrique." },
    { name:"Cap Agulhas", kind:"site", lat:-34.83330, lon:20.00000, date:"2026-10-01",
      notes:"Pointe sud de l'Afrique, séparation des deux océans. Phare de 1848." },

    // ---- Semaine 2 — à réserver ----
    { name:"Gondwana Game Reserve — safari", kind:"hotel", lat:-34.08042, lon:21.91110, date:"2026-10-02",
      notes:"+27 44 333 0200\nUNE nuit, pas plus. Réserve privée sans paludisme, Big Five dans le fynbos.\nDrive de l'après-midi + drive du matin.\n⚠️ À RÉSERVER" },
    { name:"Knysna", kind:"etape", lat:-34.07870, lon:23.06250, date:"2026-10-03",
      notes:"2 nuits. Lagune, les Heads, huîtres au port, Featherbed en bateau, forêt ancienne.\n⚠️ HÉBERGEMENT À RÉSERVER" },
    { name:"Plettenberg Bay", kind:"etape", lat:-34.05940, lon:23.37830, date:"2026-10-05",
      notes:"2 nuits. Point de demi-tour.\nRando de Robberg, plages, baleines et dauphins en bateau.\nTsitsikamma (pont de Storms River) en excursion.\n⚠️ HÉBERGEMENT À RÉSERVER" },
    { name:"Oudtshoorn — Klein Karoo", kind:"etape", lat:-33.59060, lon:22.20140, date:"2026-10-07",
      notes:"2 nuits. Retour par l'intérieur via l'Outeniqua Pass.\nAutruches, suricates à l'aube.\n⚠️ HÉBERGEMENT À RÉSERVER" },
    { name:"Grottes de Cango", kind:"site", lat:-33.39250, lon:22.21470, date:"2026-10-07",
      notes:"À 30 min d'Oudtshoorn. Réserver le créneau de visite." },
    { name:"Col du Swartberg", kind:"site", lat:-33.35000, lon:22.03330, date:"2026-10-08",
      notes:"Col de gravier de 1583 m, un des plus beaux du monde. Praticable en voiture de tourisme par temps sec.\nDescente sur Prince Albert de l'autre côté." },
    { name:"Prince Albert", kind:"site", lat:-33.22640, lon:22.02810, date:"2026-10-08",
      notes:"Village du Grand Karoo au pied du Swartberg. Architecture cape dutch, figues et olives." },
    { name:"Calitzdorp", kind:"site", lat:-33.52970, lon:21.68860, date:"2026-10-08",
      notes:"Capitale sud-africaine du porto. Dégustation sur la Route 62." },
    { name:"Montagu — Route 62", kind:"etape", lat:-33.78660, lon:20.12160, date:"2026-10-09",
      notes:"Dernière étape avant le retour au Cap. Sources chaudes, passe de Cogmanskloof.\n⚠️ HÉBERGEMENT À RÉSERVER" },
    { name:"Retour Le Cap", kind:"etape", lat:-33.92490, lon:18.42410, date:"2026-10-10",
      notes:"Retour obligatoire au Cap (pas d'open-jaw). Restitution du véhicule Hertz." }
  ]
};

/* ==================================================================
   Stockage
   - localStorage : le dossier de voyage (léger, texte)
   - IndexedDB    : les photos (vignettes JPEG), qui feraient exploser
                    le quota de localStorage
   ================================================================== */

const LS_KEY = 'bthx.trip.v1';

const Store = {
  load(){
    try{
      const raw = localStorage.getItem(LS_KEY);
      if(!raw) return null;
      return JSON.parse(raw);
    }catch(e){ console.warn('load', e); return null; }
  },
  save(trip){
    try{
      localStorage.setItem(LS_KEY, JSON.stringify(trip));
      return true;
    }catch(e){
      console.warn('save', e);
      return false; // quota — l'appelant prévient l'utilisateur
    }
  },
  clear(){ try{ localStorage.removeItem(LS_KEY); }catch(e){} }
};

/* ---- IndexedDB pour les images ---- */
const Photos = (() => {
  const DB='bthx-photos', STORE='img'; let dbp=null;

  function open(){
    if(dbp) return dbp;
    dbp = new Promise((res,rej)=>{
      const r = indexedDB.open(DB,1);
      r.onupgradeneeded = ()=>{
        const db = r.result;
        if(!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      r.onsuccess = ()=>res(r.result);
      r.onerror  = ()=>rej(r.error);
    });
    return dbp;
  }
  async function tx(mode){
    const db = await open();
    return db.transaction(STORE, mode).objectStore(STORE);
  }
  return {
    async put(id, blob){
      const s = await tx('readwrite');
      return new Promise((res,rej)=>{ const r=s.put(blob,id); r.onsuccess=()=>res(); r.onerror=()=>rej(r.error); });
    },
    async get(id){
      const s = await tx('readonly');
      return new Promise((res)=>{ const r=s.get(id); r.onsuccess=()=>res(r.result||null); r.onerror=()=>res(null); });
    },
    async del(id){
      const s = await tx('readwrite');
      return new Promise((res)=>{ const r=s.delete(id); r.onsuccess=()=>res(); r.onerror=()=>res(); });
    },
    async clear(){
      const s = await tx('readwrite');
      return new Promise((res)=>{ const r=s.clear(); r.onsuccess=()=>res(); r.onerror=()=>res(); });
    },
    async keys(){
      const s = await tx('readonly');
      return new Promise((res)=>{ const r=s.getAllKeys(); r.onsuccess=()=>res(r.result||[]); r.onerror=()=>res([]); });
    }
  };
})();

/* ---- Cache des itinéraires routiers (OSRM) ----
   Indispensable hors ligne : une fois un segment calculé, il ne
   redemande plus rien au réseau. */
const RouteCache = {
  key(a,b){ return `${a.lat.toFixed(4)},${a.lon.toFixed(4)}>${b.lat.toFixed(4)},${b.lon.toFixed(4)}`; },
  get(a,b){
    try{ const v = localStorage.getItem('bthx.route.'+this.key(a,b)); return v?JSON.parse(v):null; }
    catch(e){ return null; }
  },
  set(a,b,val){
    try{ localStorage.setItem('bthx.route.'+this.key(a,b), JSON.stringify(val)); }catch(e){}
  }
};
