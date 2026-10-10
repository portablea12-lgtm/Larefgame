// GamerLink service worker : installation, affichage de secours hors-ligne et notifications push.
// Les données (Supabase) ne sont jamais mises en cache.
const CACHE = 'gamerlink-v2';
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

// --- Notifications push ---
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { title: 'GamerLink', body: e.data ? e.data.text() : '' }; }
  e.waitUntil((async () => {
    // si l'appli est déjà ouverte à l'écran, elle affiche déjà ses propres alertes
    const cs = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (cs.some(c => c.visibilityState === 'visible')) return;
    await self.registration.showNotification(d.title || 'GamerLink', {
      body: d.body || '', icon: 'icon-192.png', badge: 'icon-192.png',
      tag: d.tag || 'gl', data: { url: d.url || './' }
    });
  })());
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) { if ('focus' in c) return c.focus(); }
    return clients.openWindow(url);
  }));
});
