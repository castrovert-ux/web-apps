const CACHE = 'castroverde-v1';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Dejar pasar sin interceptar las llamadas externas
  // (anthropic.com requiere cabeceras especiales que el SW no puede reenviar)
  if (e.request.url.includes('anthropic.com') ||
      e.request.url.includes('googleapis.com') ||
      e.request.url.includes('gstatic.com') ||
      e.request.url.includes('firestore.googleapis.com') ||
      e.request.url.includes('identitytoolkit.googleapis.com') ||
      e.request.url.includes('cdnjs.cloudflare.com')) {
    return; // Sin e.respondWith → el navegador gestiona la petición directamente
  }
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
