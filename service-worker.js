/* BTHX Travel — cache applicatif.
   ------------------------------------------------------------------
   Stratégie : réseau d'abord pour la page elle-même, cache d'abord pour
   le reste.

   Pourquoi cette distinction. Un cache systématique fait fonctionner
   l'app sans réseau — ce qu'on veut dans le Karoo — mais il fige aussi
   la version installée : une mise à jour publiée reste invisible tant
   que ce fichier-ci ne change pas. Piège rencontré le 20 septembre.
   Désormais, dès qu'il y a du réseau la page vient du serveur, et le
   cache ne prend le relais que s'il est injoignable.
*/

const CACHE = 'bthx-travel-v5';

// Ce qu'il faut avoir sous la main pour démarrer hors réseau.
const SHELL = [
  './', './index.html', './manifest.json',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// Jamais mis en cache : trop volumineux, et inutile au démarrage.
const NEVER_CACHE = [
  'tile.openstreetmap.org',   // fonds de carte
  'arcgisonline.com',         // imagerie satellite
  'router.project-osrm.org'   // calculs d'itinéraire (cache applicatif dédié)
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(SHELL.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = req.url;

  if (req.method !== 'GET') return;
  if (NEVER_CACHE.some(h => url.includes(h))) return;

  // La page : réseau d'abord, pour que toute mise à jour soit visible
  // immédiatement. Le cache ne sert que si le réseau ne répond pas.
  const isPage = req.mode === 'navigate'
              || url.endsWith('/')
              || url.includes('index.html');

  if (isPage) {
    e.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put('./index.html', copy));
          }
          return res;
        })
        .catch(() => caches.match('./index.html').then(hit => hit || caches.match('./')))
    );
    return;
  }

  // Le reste (bibliothèques, manifeste) : cache d'abord, c'est stable.
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && res.status === 200 &&
          (url.startsWith(self.location.origin) || url.includes('unpkg'))) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => new Response('', { status: 504, statusText: 'Hors ligne' })))
  );
});
