const CACHE = 'ilustrador-v1';
const ASSETS = ['./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch', e => {
  if(e.request.url.includes('huggingface.co')||e.request.url.includes('googleapis.com')||e.request.url.includes('cdnjs')) { e.respondWith(fetch(e.request)); return; }
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
