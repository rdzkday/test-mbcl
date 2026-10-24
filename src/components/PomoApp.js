'use client';

import { memo, useEffect } from 'react';

/*
  Kerangka halaman. Isinya (daftar tugas, timer, dll.) digambar oleh kode di src/pomo/,
  yang mengisi #view, #nav, #alarm, #toast langsung ke DOM. React hanya menyediakan kerangka
  dan menjalankan kode itu sekali di browser (bukan di server, karena butuh localStorage dan audio).
  memo + tanpa props: React tidak pernah menggambar ulang kerangka ini, jadi tidak menimpa isi DOM.
*/
function PomoApp() {
  useEffect(() => {
    // import() dipanggil dua kali di mode dev (Strict Mode), tapi modulnya hanya dijalankan sekali.
    import('../pomo/main.js');
    registerServiceWorker();
  }, []);

  return (
    <div className="app" id="app" suppressHydrationWarning>
      <div className="alarm" id="alarm" role="alert" hidden suppressHydrationWarning />
      <main className="view" id="view" suppressHydrationWarning />
      <nav className="tabbar" id="nav" aria-label="Menu utama" suppressHydrationWarning />
      <div className="toast" id="toast" role="status" aria-live="polite" hidden suppressHydrationWarning />
      <input type="file" id="songfile" accept="audio/*,.mp3,.m4a,.wav,.ogg,.aac,.flac,.opus" hidden />
    </div>
  );
}

/* PWA: service worker hanya jalan di https atau localhost. */
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;
  navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready).then((reg) => {
    // Beri tahu service worker berkas apa saja yang sudah dimuat halaman ini, supaya bisa dibuka offline.
    const urls = performance.getEntriesByType('resource').map((r) => r.name)
      .concat(location.href)
      .filter((u) => u.startsWith(location.origin));
    (reg.active || navigator.serviceWorker.controller)?.postMessage({ type: 'cache-loaded', urls });
  }).catch(() => {});
}

export default memo(PomoApp);
