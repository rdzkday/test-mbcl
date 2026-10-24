/* Service worker: aplikasi bisa dibuka tanpa internet.
   - Saat pasang: simpan halaman utama, manifest, dan ikon.
   - Saat dipakai: berkas same-origin (termasuk /_next/static/ yang namanya berhash) dibuka dari cache dulu,
     lalu diperbarui di belakang layar (versi baru muncul pada pembukaan berikutnya).
   - Halaman memberi tahu berkas apa saja yang sudah dimuat (pesan 'cache-loaded'), supaya kunjungan pertama
     sudah lengkap untuk offline. Berkas build lama yang tidak dipakai lagi dibuang saat itu.
   Naikkan VERSION kalau daftar SHELL berubah. */
const VERSION = 'v2';
const CACHE = 'pomo-shell-' + VERSION;
const SHELL = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/icon.svg'
];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('pomo-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  const d = e.data;
  if (!d || d.type !== 'cache-loaded' || !Array.isArray(d.urls)) return;
  e.waitUntil(caches.open(CACHE).then(async (cache) => {
    const keep = new Set(d.urls.map((u) => new URL(u).pathname));
    for (const u of d.urls) {
      const url = new URL(u);
      if (url.origin !== self.location.origin) continue;
      if (!(await cache.match(u))) await cache.add(u).catch(() => {});
    }
    // buang berkas build lama yang tidak dipakai halaman ini
    for (const req of await cache.keys()) {
      const p = new URL(req.url).pathname;
      if (p.startsWith('/_next/static/') && !keep.has(p)) await cache.delete(req);
    }
  }));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin && !FONT_HOSTS.includes(url.hostname)) return;
  if (sameOrigin && url.pathname.startsWith('/api/')) return;

  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(req, { ignoreSearch: sameOrigin });
      const fresh = fetch(req).then((res) => {
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      }).catch(() => null);
      if (hit) { e.waitUntil(fresh); return hit; }
      const res = await fresh;
      if (res) return res;
      // offline dan belum ada di cache: untuk halaman, tampilkan aplikasi
      if (req.mode === 'navigate') return (await cache.match('/')) || Response.error();
      return Response.error();
    })
  );
});
