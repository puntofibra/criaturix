const CACHE = 'criaturix-v27';
const ASSETS = ['./', 'index.html', 'style.css?v=13', 'js/fx.js?v=2', 'js/arena.js?v=1', 'game.js?v=10', 'combate.js?v=3', 'admin.js?v=1', 'js/datos.js?v=1', 'js/robot.js?v=18', 'js/fuego.js?v=2', 'js/qrcode.min.js?v=1',
  'manifest.json?v=2', 'img/logo.webp', 'img/icon-192.png?v=2', 'img/icon-512.png?v=2', 'img/icon-180.png?v=2', 'favicon.ico?v=2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (u.pathname.endsWith('version.json')) return;   // la versión siempre se pide a internet
  const pagina = e.request.mode === 'navigate' || u.pathname.endsWith('/') || u.pathname.endsWith('.html');
  if (pagina) {
    e.respondWith(fetch(e.request).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); } return r; })
      .catch(() => caches.match(e.request).then(h => h || caches.match('./'))));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request);
    const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
