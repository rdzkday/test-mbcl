# Pomodoro Fokus

Pomodoro untuk deep work. HTML + CSS + JS murni (ES module), tanpa framework dan tanpa build.

## Jalankan
```
npm install
npm start        # http://localhost:4173
npm test         # tes otomatis (Playwright, Chromium)
```
Halaman tidak bisa dibuka dengan klik dua kali pada `index.html` (ES module butuh server). `npm start` cukup.

## Struktur
- `index.html`: kerangka halaman, PWA manifest.
- `css/style.css`: semua gaya, tema lewat variabel CSS.
- `js/`: `util` (format, ikon), `state` (data, simpan, reset 05.00), `timer` (timer, fase, Wake Lock), `audio` (alarm, lagu di IndexedDB), `views` (tampilan), `actions` (aksi tombol), `drag` (urutan), `main` (mulai).
- `sw.js`, `manifest.webmanifest`, `icons/`: PWA.
- `tests/`: tes otomatis. `docs/uji-hp.md`: uji manual di HP.
- `plan.md`: rencana kerja.

## Data
`localStorage` kunci `pomo.v1` (to-do, pengaturan, tema, log) dan IndexedDB `pomo-media` (lagu). Jangan ubah bentuk data tanpa migrasi di `load()` (`js/state.js`).
