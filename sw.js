const CACHE_NAME = 'yd-alumni-v2';
const CORE_ASSETS = ['./manifest.json', './icon-192.png', './icon-512.png', './og-image.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(CORE_ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || e.request.method !== 'GET') return;
  const isPage = e.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/');
  if (isPage) {
    // 페이지는 항상 최신본 우선(GitHub에 올리면 바로 반영), 오프라인일 때만 캐시 사용
    e.respondWith(
      fetch(e.request).then((res) => {
        if (res && res.status === 200) { const c = res.clone(); caches.open(CACHE_NAME).then((ca) => ca.put(e.request, c)); }
        return res;
      }).catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const net = fetch(e.request).then((res) => {
        if (res && res.status === 200) { const c = res.clone(); caches.open(CACHE_NAME).then((ca) => ca.put(e.request, c)); }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
