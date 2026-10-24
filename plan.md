# Plan: Pomodoro Fokus

Status: Tahap 0–3 selesai. Tahap 4 (laporan) selesai. Tahap 5 menunggu keputusan Riki.
Cara kerja: satu tahap per giliran. Selesai → lapor ke Riki → tunggu setuju → lanjut.

## Aturan main
- Tanpa fitur baru di luar brief.
- Alur 6 langkah tidak diubah: `idle → plan → select → focus → break → select`.
- Bentuk data tidak diubah tanpa migrasi (lihat `load()`). Kunci `pomo.v1` dan db `pomo-media` tetap.
- "Lama penyelesaian" = total detik timer fokus berjalan selama tugas ada di sesi dan belum selesai. Ini asumsi, belum dikonfirmasi Riki.
- Keputusan jangka panjang (platform, hosting, sinkron): rekomendasi + alasan, tunggu persetujuan Riki.

## Tahap 0: Siapkan bahan
- [x] Riki kirim `index.html` (commit ke branch `claude/admiring-albattani-67trrg` atau tempel di chat).
- [x] (tidak dipakai) Alternatif: bangun ulang dari brief.
- Selesai kalau: file ada di repo.

## Tahap 1: Rapikan jadi proyek git
- [x] Commit awal = `index.html` asli (bahan banding).
- [x] Pecah jadi `index.html`, `css/`, `js/` (timer, state/storage, ui, audio, drag).
- [x] Tetap tanpa framework dan tanpa build.
- [x] Perilaku sama persis.
- Selesai kalau: prototipe lama dan hasil pecahan berperilaku sama.
- Hasil: tes yang sama lolos 19/19 di prototipe lama dan di hasil pecahan. Beda satu hal: butuh server (`npm start`), tidak bisa klik dua kali.

## Tahap 2: Tes otomatis (Playwright, Chromium)
- [x] Alur 6 langkah berulang tanpa error.
- [x] Timer akurat setelah background (jam dimajukan).
- [x] Reset 05.00: tugas lama hilang dari Fokus, tetap di To-do, "Kerjakan hari ini" memunculkannya lagi.
- [x] Drag mengubah urutan dan tetap setelah reload.
- [x] 50/10: timer 50:00, istirahat 10 menit. Ubah Kustom di Pengaturan: pilihan ketiga ikut berubah.
- [x] Centang selesai menampilkan jam selesai + lama fokus.
- [x] Terang dan gelap terbaca (kontras cukup), rapi di 360–420 px, tanpa scroll ke samping.
- [x] Lagu dari perangkat tersimpan dan bunyi saat alarm. Tanpa lagu, beep bunyi.
- [x] Data lama `pomo.v1` tetap terbaca.
- Selesai kalau: semua tes hijau.
- Hasil: 29 tes hijau. Temuan kontras warna sudah diperbaiki di commit terpisah (bisa di-revert).

## Tahap 3: Jadi PWA
- [x] `manifest.webmanifest` + ikon.
- [x] Service worker (cache offline).
- [x] Uji pasang di layar utama dan jalan tanpa internet.
- Catatan: butuh HTTPS. Hosting menunggu keputusan Riki (Tahap 5).
- Selesai kalau: bisa dipasang dan jalan offline.
- Hasil: lolos cek installable Chromium dan uji offline. Belum diuji di HP asli.

## Tahap 4: Laporan ke Riki
- [x] Ringkas yang selesai, hasil tes, batasan.
- [x] Panduan uji HP asli: Kustom 1 menit → Mulai → pindah app → cek alarm bunyi.

## Tahap 5: Keputusan (tunggu Riki)
- [ ] Platform: web/PWA, native, atau Capacitor.
  - Tanya: HP utama iPhone atau Android?
  - Tanya: sudah punya akun developer?
  - Rekomendasi awal: validasi di web dulu. Native/Capacitor hanya kalau alarm andal saat layar mati memang dibutuhkan.
- [ ] Sinkron antar perangkat. Rekomendasi: tunda sampai pemakaian membuktikan perlu.
- [ ] Hosting PWA: rekomendasi + alasan, Riki setuju dulu.

## Batasan yang sudah diketahui
- Layar mati atau pindah app: alarm bisa telat atau tidak bunyi. Sisa waktu tetap benar saat kembali.
- Data terikat ke satu browser di satu perangkat. Lagu perlu dipilih ulang di perangkat lain.
- Tidak ada notifikasi push.
