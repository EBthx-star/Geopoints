/* BTHX Travel — cache applicatif (version mono-fichier).
   L'app doit s'ouvrir et fonctionner sans réseau. Les tuiles de carte
   ne sont pas mises en cache : hors ligne, les fonds manquent mais
   les données restent intactes. */

const CACHE = 'bthx-travel-v2';
const SHELL = [
  './', './index.html', './manifest.json',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
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
  const url = e.request.url;
  if (e.request.method !== 'GET') return;
  if (url.includes('tile.openstreetmap.org') || url.includes('router.project-osrm.org')) return;

  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res && res.status === 200 &&
          (url.startsWith(self.location.origin) || url.includes('unpkg'))) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
