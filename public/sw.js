const CACHE = 'pea-tracker-v1';
const STATIC = ['/', '/dashboard', '/alerts'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  // Ne cache pas les appels API externes
  if (e.request.url.includes('finnhub.io') || e.request.url.includes('firestore')) return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res.ok && e.request.method === 'GET') {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => cached || new Response('Offline', { status: 503 })))
  );
});

// Notifications push (si FCM activé plus tard)
self.addEventListener('push', e => {
  if (!e.data) return;
  const data = e.data.json();
  e.waitUntil(self.registration.showNotification(data.title || '📈 PEA Tracker', {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
  }));
});
