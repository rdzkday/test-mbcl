# Pomodoro Fokus

Pomodoro untuk deep work. Next.js (App Router), data tersimpan di browser, siap deploy ke Vercel.

## Jalankan
```
npm install
npm run dev      # pengembangan, http://localhost:3000
npm run build && npm start   # hasil produksi, http://localhost:4173
npm test         # tes otomatis (Playwright, Chromium); build + start jalan otomatis
```
Pertama kali tes: `npx playwright install chromium`.

## Struktur
- `src/app/`: `layout.js` (judul, tema awal, PWA meta), `page.js`, `globals.css` (semua gaya, tema lewat variabel CSS).
- `src/components/PomoApp.js`: kerangka halaman. Menjalankan kode di `src/pomo/` sekali di browser dan mendaftarkan service worker.
- `src/pomo/`: logika aplikasi, dipindah dari prototipe tanpa diubah. `util` (format, ikon), `state` (data, simpan, reset 05.00), `timer`, `audio` (alarm, lagu di IndexedDB), `views` (tampilan), `actions`, `drag`, `main`.
- `public/`: `sw.js` (offline), `manifest.webmanifest`, `icons/`.
- `tests/`: tes otomatis. `docs/uji-hp.md`: cara tes untuk Riki. `plan.md`, `brief.md`.

## Deploy ke Vercel
Import repo di Vercel. Tidak perlu pengaturan khusus (Next.js terbaca otomatis, tanpa environment variable). Halaman dibuat statis, jadi tidak memakai server/function.

## Data
`localStorage` kunci `pomo.v1` (to-do, pengaturan, tema, log) dan IndexedDB `pomo-media` (lagu). Jangan ubah bentuk data tanpa migrasi di `load()` (`src/pomo/state.js`).

## Catatan teknis
- Layar digambar oleh `src/pomo/views.js` (string HTML ke DOM), bukan komponen React. Itu sengaja: perilaku persis sama dengan prototipe dan 29 tes membuktikannya. Menulis ulang jadi komponen React adalah keputusan terpisah (lihat `plan.md`).
- Ikon PNG dibuat dari `public/icons/*.svg` lewat `npm run icons`.
