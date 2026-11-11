// HashCLASS service worker: lets the app install, and keeps the app shell available when the network is slow.
// Data (Supabase) is never cached.
const CACHE = 'hashclass-v2';
const OFFLINE_URLS = ['/index.html', '/welcome.html', '/theme.css', '/pwa/icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(OFFLINE_URLS).catch(() => {})).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;               // Supabase, CDNs: straight to the network
  const isPage = req.mode === 'navigate' || url.pathname.endsWith('.html');
  if (isPage) {                                              // pages: network first, cached copy if offline
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })
      .catch(() => caches.match(req).then(r => r || caches.match('/index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => {              // files: cached copy, refreshed in the background
    const net = fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; }).catch(() => hit);
    return hit || net;
  }));
});
