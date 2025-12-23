// Service Worker pour GéoPoints PWA
const CACHE_NAME = 'geopoints-v1';
const ASSETS_TO_CACHE = [
  '/index.html',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.jsdelivr.net/npm/exif-js@2.3.0/exif.min.js',
  'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js'
];

// Installation - Mise en cache des ressources
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installation');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Mise en cache des ressources');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch((err) => {
        console.log('[ServiceWorker] Erreur de cache:', err);
      })
  );
  self.skipWaiting();
});

// Activation - Nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activation');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interception des requêtes - Stratégie Network First avec fallback sur Cache
self.addEventListener('fetch', (event) => {
  // Ne pas intercepter les requêtes de tiles de carte (OpenStreetMap)
  if (event.request.url.includes('tile.openstreetmap.org')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la requête réussit, mettre en cache et retourner
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Si échec réseau, chercher dans le cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Si rien dans le cache, retourner une page offline simple pour HTML
          if (event.request.headers.get('accept').includes('text/html')) {
            return new Response(
              `<!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Hors ligne - GéoPoints</title>
                <style>
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    background: #f5f5f5;
                    color: #333;
                  }
                  .offline-icon { font-size: 80px; margin-bottom: 20px; }
                  h1 { font-size: 24px; margin-bottom: 10px; }
                  p { color: #666; text-align: center; padding: 0 20px; }
                  button {
                    margin-top: 20px;
                    padding: 12px 24px;
                    background: #007AFF;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    cursor: pointer;
                  }
                </style>
              </head>
              <body>
                <div class="offline-icon">📡</div>
                <h1>Vous êtes hors ligne</h1>
                <p>L'application nécessite une connexion pour cette page.<br>Vérifiez votre connexion et réessayez.</p>
                <button onclick="window.location.reload()">Réessayer</button>
              </body>
              </html>`,
              { headers: { 'Content-Type': 'text/html' } }
            );
          }
        });
      })
  );
});
