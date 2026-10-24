# Pomodoro Fokus: brief untuk Claude Code

## 0. Cara kerja dengan Riki (baca dulu)
- Riki = UI/UX designer, bukan coder. Jelaskan hal teknis pakai bahasa bayi.
- Gaya: singkat, poin, gue/lo. Pakai data yang bisa dipercaya, jangan menebak.
- Sebelum keputusan jangka panjang (arsitektur, hosting, platform): kasih rekomendasi + alasan, lalu tunggu persetujuan.
- Pilih opsi yang paling efisien dan reliable. Jangan menambah fitur di luar brief ini tanpa tanya.

## 1. Tujuan
Aplikasi pomodoro untuk deep work. Pengguna menyusun to-do, memilih tugas untuk satu sesi, fokus, istirahat, lalu mengulang.

## 2. Status sekarang
- Prototipe asli: satu file `index.html` (ada di cabang `main`, commit `ab5c259`). Referensi perilaku.
- Sudah dipecah jadi proyek kecil: `index.html`, `css/`, `js/` (ES module, tanpa build). Perilaku sama dengan prototipe (tes yang sama lolos di keduanya).
- Tes otomatis Playwright (Chromium desktop): 29 tes hijau. Jalankan `npm test`.
- PWA: manifest, ikon, service worker. Lolos cek installable dan uji offline di Chromium.
- Belum diuji di HP asli (iPhone/Android). Panduan: `docs/uji-hp.md`.
- Belum ada hosting HTTPS.
- Prototipe juga terbit sebagai artifact Claude, hanya untuk pratinjau.

## 3. Alur produk (6 langkah, jangan diubah)
1. Pengguna menyusun to-do. Ada timer menyusun, bawaan 5 menit, bisa 1–15 (Pengaturan).
2. Pengguna memilih to-do untuk satu sesi.
3. Sebelum mulai, pilih durasi: 25/5 (bawaan), 50/10, atau Kustom (bawaan 15/3, bisa diubah di Pengaturan).
4. Timer baru jalan setelah tombol Mulai ditekan.
5. Waktu habis: musik bunyi, istirahat otomatis mulai. Istirahat habis: musik bunyi lagi.
6. Kembali ke daftar to-do untuk lanjut sesi sebelumnya atau pilih yang baru, lalu ulangi.

Fase di kode: `idle → plan → select → focus → break → select`.

## 4. Aturan produk (sudah disepakati)

### Halaman Fokus
- Reset tiap pukul 05.00 (zona waktu perangkat). Setelah reset, Fokus tidak menampilkan tugas lama.
- Tugas lama tetap ada di tab To-do. Tombol "Kerjakan hari ini" membawanya ke Fokus lagi.
- Kalau ada sesi yang sedang jalan saat 05.00, reset menunggu sesi selesai.
- Urutan tugas = urutan dibuat, tanpa pengelompokan prioritas. Bisa diubah dengan drag and drop (sentuh + mouse + keyboard panah).
- Saat timer jalan, lingkaran timer ada di tengah layar, dengan teks "Selesai pukul HH.mm" di bawahnya. Sebelum Mulai, tampil perkiraan jam selesai.
- Saat tugas dicentang selesai: tampil jam selesai + lama fokus pada tugas itu.

### Halaman To-do
- Semua tugas yang pernah dibuat. Tiap tugas menampilkan tanggal + jam dibuat. Filter: Semua / Aktif / Selesai.

### Pengaturan
- Tema Terang (bawaan) / Gelap.
- Durasi menyusun (1–15), Kustom fokus (1–120), Kustom istirahat (1–60).
- Lagu alarm dari file di perangkat (maks 30 MB), tombol coba putar, kembali ke nada bawaan. Musik berhenti sendiri setelah 30 detik.

### Definisi yang diasumsikan (belum dikonfirmasi Riki, tanyakan bila menyentuhnya)
- "Lama penyelesaian" = total detik timer fokus berjalan selama tugas itu ada di sesi dan belum selesai. Bukan selisih dari waktu dibuat.

## 5. Arsitektur
- HTML + CSS + JS murni (ES module). Tanpa framework, tanpa build. Perlu server statis (`npm start`) karena ES module.
- Data di browser: `localStorage` kunci `pomo.v1` (to-do, pengaturan, tema, log), `IndexedDB` db `pomo-media` (file lagu).
- Timer menyimpan `endAt` (jam asli), bukan hitungan mundur per detik. Sisa waktu selalu dihitung dari jam perangkat.
- Pengecekan tiap 250 ms + saat tab terlihat lagi. Layar diminta tetap menyala (Wake Lock) selama timer jalan.
- Musik: elemen audio dari file pilihan. Tanpa lagu, nada beep dibuat lewat Web Audio. Audio "dibuka kuncinya" saat pengguna menekan tombol.
- Tema lewat variabel CSS. Atribut `data-app-theme` di elemen root.
- Drag urutan memakai pointer events dengan field `ord` di tiap tugas.
- Modul: `util` (format, ikon), `state` (data, simpan, reset 05.00), `timer`, `audio`, `views`, `actions`, `drag`, `main`.

Model data tugas: `id, title, desc, pri(high|med|low), at, ord, done, doneAt, pomos, spent(detik), bring`.
Model state: `tasks, settings{plan,cf,cb}, theme, pre, phase, timer{kind,total,status,remaining,endAt,segStart,brkMin}, sel, session, last, log, dayStart`.
Jangan ubah bentuk data tanpa migrasi (lihat `load()` di `js/state.js`), supaya data pengguna lama tidak hilang.

## 6. Batasan yang sudah diketahui
- Layar mati atau pindah app: halaman dibekukan HP, alarm bisa telat atau tidak bunyi. Sisa waktu tetap benar saat kembali.
- Data terikat ke satu browser di satu perangkat. Ganti HP atau hapus data browser = data hilang. Lagu perlu dipilih lagi di perangkat lain.
- Tidak ada notifikasi push.

## 7. Keputusan terbuka (tanya Riki, jangan putuskan sendiri)
1. Platform. Opsi: (a) tetap web/PWA, (b) app native (Android/iOS), (c) bungkus web dengan Capacitor.
   - Rekomendasi awal: validasi pemakaian di web dulu. Pindah ke native/Capacitor hanya kalau alarm yang andal saat layar mati memang dibutuhkan.
   - Tanyakan dulu: HP utama Riki iPhone atau Android? Dan apakah sudah punya akun developer?
2. Sinkron antar perangkat. Opsi: tetap lokal, atau simpan to-do di akun (butuh login + backend). Rekomendasi: tunda sampai pemakaian membuktikan perlu.
3. Hosting HTTPS untuk PWA (belum dipilih).
4. Uji di HP asli dulu sebelum menambah fitur. Langkah uji: set Kustom 1 menit, mulai fokus, pindah app, cek apakah alarm bunyi.

## 8. Tugas yang disarankan (status)
1. [x] Rapikan prototipe jadi proyek kecil dengan git, tanpa mengubah perilaku.
2. [x] Tes otomatis untuk alur utama (checklist bagian 9).
3. [x] Jadikan PWA (manifest + service worker).
4. [x] Laporkan ke Riki.
5. [ ] Tunggu keputusan di bagian 7.

## 9. Checklist penerimaan
- [x] Alur 6 langkah berulang tanpa error.
- [x] Timer akurat setelah tab di background lalu dibuka lagi.
- [x] Reset 05.00: tugas lama hilang dari Fokus, tetap ada di To-do, "Kerjakan hari ini" memunculkannya lagi.
- [x] Drag mengubah urutan dan tetap setelah reload.
- [x] Pilih 50/10: timer 50:00, istirahat 10 menit. Ubah Kustom di Pengaturan: pilihan ketiga ikut berubah.
- [x] Centang selesai menampilkan jam selesai + lama fokus.
- [x] Terang dan gelap terbaca jelas (kontras cukup), tampil rapi di lebar 360–420 px, tanpa scroll ke samping. Kontras diperbaiki di commit `2585d26`.
- [x] Lagu dari perangkat tersimpan dan bunyi saat alarm. Tanpa lagu, beep bunyi.
- [x] Data lama (`pomo.v1`) tetap terbaca setelah perubahan.

Semua poin di atas lolos di Chromium desktop. Belum terbukti di HP asli.
