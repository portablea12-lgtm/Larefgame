// GamerLink service worker : permet l'installation et un affichage de secours hors-ligne.
// Les données (Supabase) ne sont jamais mises en cache.
const CACHE = 'gamerlink-v1';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', 'icon-192.png'])).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  // réseau d'abord (toujours la dernière version), cache en secours
  e.respondWith(fetch(r).then(res => {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(r, copy)).catch(() => {});
    return res;
  }).catch(() => caches.match(r).then(m => m || caches.match('./'))));
});
