/* BTHX Travel — données de référence et stockage
   ------------------------------------------------------------------
   L'itinéraire Le Cap 2026 reprend la boucle arrêtée dans le road book :
   côte à l'aller (Garden Route), retour par la Route 62 / Klein Karoo.
   Les coordonnées sont un point de départ : chaque étape reste éditable.
*/

/* Corrections apportées après coup à l'itinéraire : appliquées aux voyages
   déjà chargés, tant que l'utilisateur n'a pas lui-même changé la date. */
const CAPE_FIXES = {
  "Bonne Esperance Guest House — Stellenbosch": { from:"2026-09-24", to:"2026-09-26" },
  "Tokara":                                     { from:"2026-09-24", to:"2026-09-26" },
  "Overture":                                   { from:"2026-09-25", to:"2026-09-27" },
  "Babylonstoren — Simondium":                  { from:"2026-09-25", to:"2026-09-26" },
  "Simon's Town Quayside Hotel":                { from:"2026-09-26", to:"2026-09-27" },
  "Harbour House — Kalk Bay":                   { from:"2026-09-26", to:"2026-09-27" }
};

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
    { name:"Bonne Esperance Guest House — Stellenbosch", kind:"hotel", lat:-33.93210, lon:18.86020, date:"2026-09-26", time:"15:00",
      notes:"+27 21 887 0225\nDorp Street à deux pas, Stellenbosch Tobacconist dans la rue." },
    { name:"Tokara", kind:"table", lat:-33.91790, lon:18.92030, date:"2026-09-26", time:"12:30",
      notes:"Winelands. Vue sur la vallée, cuisine sud-africaine. Réserver." },
    { name:"Overture", kind:"table", lat:-33.96860, lon:18.85240, date:"2026-09-27", time:"12:30",
      notes:"Hidden Valley. Table de référence des Winelands. Réserver largement à l'avance." },
    { name:"Babylonstoren — Simondium", kind:"site", lat:-33.82670, lon:18.92670, date:"2026-09-26", time:"10:00",
      notes:"Jardin potager historique, ferme et cave. Repéré via l'email Air France." },
    { name:"Simon's Town Quayside Hotel", kind:"hotel", lat:-34.19280, lon:18.43260, date:"2026-09-27", time:"17:00",
      notes:"+27 21 786 3838\nSur le port. Manchots de Boulders à côté, Cap de Bonne-Espérance au sud." },
    { name:"Harbour House — Kalk Bay", kind:"table", lat:-34.12760, lon:18.44850, date:"2026-09-27", time:"19:30",
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

    // ---- Cigares (conversation « Voyage personnel au Cap ») ----
    { name:"Sturk's Tobacconists", kind:"shop", lat:-33.92221, lon:18.42004, date:"2026-09-23",
      notes:"54 Shortmarket St, City Centre · +27 21 423 3928 · sturks.co.za\nLA référence historique (1793), Churchill y achetait son tabac. Cubains, pipes faites main.\n⚠️ Adresse incertaine depuis 2020 (Shortmarket St ou Garden Centre, Mill St) : appeler avant." },
    { name:"Cape Cigars & Tobacconist — Green Point", kind:"shop", lat:-33.90788, lon:18.40944, date:"2026-09-23",
      notes:"105 Main Rd, Green Point · +27 72 457 4189 · 9h–19h (dim. 9h–14h)\nPetite boutique, patron serviable, prix corrects, choix limité." },
    { name:"The Cock 'n Bull — V&A Waterfront", kind:"shop", lat:-33.90361, lon:18.42081, date:"2026-09-23",
      notes:"Shop 6192, 1 Breakwater Blvd · +27 21 421 1860 · 9h–21h · cocknbull.co.za\nHumidor correct, bon conseil. Le plus accessible depuis le Waterfront." },
    { name:"Smokers Deli Shop", kind:"shop", lat:-33.92553, lon:18.41529, date:"2026-09-23",
      notes:"City Centre · +27 65 839 5735 · ouvert jusqu'à 23h\nMontecristo frais, cubains et américains." },
    { name:"Bascule Bar — Cape Grace", kind:"shop", lat:-33.90823, lon:18.42017, date:"2026-09-24",
      notes:"V&A Waterfront · capegrace.com\nCarte de whiskies monumentale, terrasse sur la marina." },
    { name:"JJ Cale Premiere Tobacconist — Stellenbosch", kind:"shop", lat:-33.97840, lon:18.84200, date:"2026-09-26",
      notes:"Stellenbosch Square · jjcale.co.za\nChaîne nationale au fonds sérieux : Cohiba, Bolivar, Partagas, Behike, Padrón…" },
    { name:"Stellenbosch Tobacconist", kind:"shop", lat:-33.93927, lon:18.85933, date:"2026-09-26",
      notes:"Dorp St, plein centre — à deux pas de Bonne Esperance · 8h30–22h\ninstagram.com/stellenboschtobacconist" },
    { name:"Blix Tavern", kind:"shop", lat:-33.93934, lon:18.85694, date:"2026-09-26",
      notes:"Stellenbosch · blix.africa\nLe plus petit bar de Stellenbosch. Cigares à la carte, bières maison. Fermé le dimanche." },
    { name:"Balboa Balcony Bar", kind:"shop", lat:-33.93737, lon:18.86119, date:"2026-09-26",
      notes:"Stellenbosch · +27 21 886 7110\nOn peut y fumer. Interdit aux moins de 23 ans, alcools premium." },

    // ---- Domaines viticoles (conversation « Voyage personnel au Cap ») ----
    // Positions approximatives pour les domaines sans coordonnées dans la conversation : à vérifier.
    { name:"Klein Constantia", kind:"vin", lat:-34.03810, lon:18.41250, date:"2026-09-24",
      notes:"Vallée de Constantia, la plus ancienne. Le mythique Vin de Constance (celui de Napoléon à Sainte-Hélène).\n📍 Position approximative." },
    { name:"Groot Constantia", kind:"vin", lat:-34.02710, lon:18.42460, date:"2026-09-24",
      notes:"Le plus ancien domaine du pays (1685), manoir cape dutch.\n📍 Position approximative." },
    { name:"Delaire Graff", kind:"vin", lat:-33.92050, lon:18.92250, date:"2026-09-26",
      notes:"Col de Helshoogte, voisin de Tokara. Registre luxe ; resto japonais Hōseki.\n📍 Position approximative." },
    { name:"Hamilton Russell Vineyards", kind:"vin", lat:-34.38450, lon:19.25300, date:"2026-09-29",
      notes:"Hemel-en-Aarde. Pinot Noir et Chardonnay de climat frais, référence du pays.\n📍 Position approximative." },
    { name:"Bouchard Finlayson", kind:"vin", lat:-34.38100, lon:19.26100, date:"2026-09-29",
      notes:"Hemel-en-Aarde. Pinot Noir « Galpin Peak ».\n📍 Position approximative." },
    { name:"Newton Johnson", kind:"vin", lat:-34.36900, lon:19.26700, date:"2026-09-29",
      notes:"Upper Hemel-en-Aarde. Pinot Noir, belle vue sur la vallée.\n📍 Position approximative." },
    { name:"Strandveld Vineyards — Elim", kind:"vin", lat:-34.66300, lon:19.81000, date:"2026-10-01",
      notes:"Route des vins d'Elim, la plus australe d'Afrique. Gamme First Sighting, Sauvignon Blanc et Syrah.\n📍 Position approximative." },
    { name:"Black Oystercatcher — Elim", kind:"vin", lat:-34.62600, lon:19.81500, date:"2026-10-01",
      notes:"Elim. Sauvignon Blanc de climat venté, restaurant sur le domaine.\n📍 Position approximative." },
    { name:"Boplaas — Calitzdorp", kind:"vin", lat:-33.53300, lon:21.68700, date:"2026-10-09",
      notes:"Capitale sud-africaine du porto. Dégustation le matin du départ vers Montagu.\n📍 Position approximative." },
    { name:"Die Krans — Calitzdorp", kind:"vin", lat:-33.52500, lon:21.69200, date:"2026-10-09",
      notes:"Porto de Calitzdorp, voisin de Boplaas.\n📍 Position approximative." },
    { name:"Graham Beck — Robertson", kind:"vin", lat:-33.79900, lon:19.84600, date:"2026-10-10",
      notes:"Vallée de Robertson. Les bulles MCC de référence. Dernière dégustation avant Le Cap.\n📍 Position approximative." },
    { name:"Springfield Estate — Robertson", kind:"vin", lat:-33.83900, lon:19.91500, date:"2026-10-10",
      notes:"Vallée de Robertson.\n📍 Position approximative." },
    { name:"De Wetshof — Robertson", kind:"vin", lat:-33.87100, lon:20.00000, date:"2026-10-10",
      notes:"Vallée de Robertson, grande maison du Chardonnay.\n📍 Position approximative." },

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

/* Plusieurs voyages depuis le 21 sept. 2026.
   - `bthx.index.v2`       : { current, trips:[{id,name,start,end}] }
   - `bthx.trip.v2.<id>`   : un voyage complet
   L'ancien emplacement unique `bthx.trip.v1` est repris au premier
   lancement : le voyage déjà saisi devient le premier de la liste. */
const LS_OLD   = 'bthx.trip.v1';
const LS_INDEX = 'bthx.index.v2';
const LS_TRIP  = 'bthx.trip.v2.';

const Store = {
  _uid(){ return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2,6); },
  blank(name){
    return { id:this._uid(), name:name||'Nouveau voyage', start:'', end:'', sites:[], days:[] };
  },
  _read(k){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):null; }catch(e){ return null; } },
  /* Le voyage passe avant le cache des routes : si la mémoire est pleine,
     on vide les tracés (ils se recalculent) et on réessaie. */
  _write(k,v){
    const txt = JSON.stringify(v);
    try{ localStorage.setItem(k, txt); return true; }
    catch(e){
      RouteCache.purge();
      try{ localStorage.setItem(k, txt); return true; }
      catch(e2){ console.warn('save',e2); return false; }
    }
  },

  index(){
    let idx = this._read(LS_INDEX);
    if(idx && Array.isArray(idx.trips)) return idx;
    idx = { current:null, trips:[] };
    const old = this._read(LS_OLD);                    // migration v1 -> v2
    if(old){
      old.id = old.id || this._uid();
      if(this._write(LS_TRIP+old.id, old)){
        idx.trips.push(this._meta(old)); idx.current = old.id;
        try{ localStorage.removeItem(LS_OLD); }catch(e){}
      }
    }
    this._write(LS_INDEX, idx);
    return idx;
  },
  _meta(t){ return { id:t.id, name:t.name||'Nouveau voyage', start:t.start||'', end:t.end||'' }; },

  list(){ return this.index().trips; },
  load(id){
    const t = this._read(LS_TRIP+id);
    if(!t) return null;
    t.id = id; t.sites = t.sites||[]; t.days = t.days||[];
    return t;
  },
  /* Le voyage ouvert. Il y en a toujours un : on le crée au besoin. */
  current(){
    const idx = this.index();
    let t = idx.current ? this.load(idx.current) : null;
    if(!t && idx.trips.length) t = this.load(idx.trips[0].id);
    if(!t){ t = this.blank(); this.save(t); }
    this.setCurrent(t.id);
    return t;
  },
  setCurrent(id){ const idx=this.index(); idx.current=id; this._write(LS_INDEX, idx); },
  save(trip){
    if(!trip.id) trip.id = this._uid();
    if(!this._write(LS_TRIP+trip.id, trip)) return false; // quota — l'appelant prévient
    const idx = this.index();
    const i = idx.trips.findIndex(x=>x.id===trip.id);
    if(i<0) idx.trips.push(this._meta(trip)); else idx.trips[i] = this._meta(trip);
    return this._write(LS_INDEX, idx);
  },
  create(name){
    const t = this.blank(name);
    if(!this.save(t)) return null;          // mémoire pleine : l'appelant prévient
    this.setCurrent(t.id);
    return t;
  },
  remove(id){
    try{ localStorage.removeItem(LS_TRIP+id); }catch(e){}
    const idx = this.index();
    idx.trips = idx.trips.filter(x=>x.id!==id);
    if(idx.current===id) idx.current = idx.trips.length ? idx.trips[0].id : null;
    this._write(LS_INDEX, idx);
  }
};

/* Les photos d'un voyage : c'est ce qui borne une sauvegarde ou une suppression. */
function tripPhotoIds(t){
  const ids = new Set();
  (t.days||[]).forEach(d=>(d.photos||[]).forEach(p=>ids.add(p)));
  return [...ids];
}

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
  PREFIX: 'bthx.route.',
  key(a,b){ return `${a.lat.toFixed(4)},${a.lon.toFixed(4)}>${b.lat.toFixed(4)},${b.lon.toFixed(4)}`; },
  get(a,b){
    try{ const v = localStorage.getItem(this.PREFIX+this.key(a,b)); return v?JSON.parse(v):null; }
    catch(e){ return null; }
  },
  /* Un tracé OSRM complet compte des milliers de points : dix segments
     longs suffisaient à saturer les 5 Mo de l'iPhone. On arrondit au mètre
     et on ne garde qu'un point tous les 40 m environ — invisible à l'écran. */
  compact(val){
    const c = val.coords || [];
    const out = [];
    let last = null;
    c.forEach((p,i)=>{
      const q = [Math.round(p[0]*1e5)/1e5, Math.round(p[1]*1e5)/1e5];
      if(!last || i===c.length-1 || Math.abs(q[0]-last[0])+Math.abs(q[1]-last[1]) > 0.0004){ out.push(q); last = q; }
    });
    return Object.assign({}, val, {coords: out});
  },
  set(a,b,val){
    const txt = JSON.stringify(this.compact(val));
    try{ localStorage.setItem(this.PREFIX+this.key(a,b), txt); }
    catch(e){ this.purge(); try{ localStorage.setItem(this.PREFIX+this.key(a,b), txt); }catch(e2){} }
  },
  purge(){
    try{
      const ks = [];
      for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k && k.startsWith(this.PREFIX)) ks.push(k); }
      ks.forEach(k=>localStorage.removeItem(k));
      return ks.length;
    }catch(e){ return 0; }
  }
};
