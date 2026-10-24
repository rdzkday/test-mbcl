# Plan: Pomodoro Fokus

Status: menunggu `index.html` (Tahap 0).
Cara kerja: satu tahap per giliran. Selesai → lapor ke Riki → tunggu setuju → lanjut.

## Aturan main
- Tanpa fitur baru di luar brief.
- Alur 6 langkah tidak diubah: `idle → plan → select → focus → break → select`.
- Bentuk data tidak diubah tanpa migrasi (lihat `load()`). Kunci `pomo.v1` dan db `pomo-media` tetap.
- "Lama penyelesaian" = total detik timer fokus berjalan selama tugas ada di sesi dan belum selesai. Ini asumsi, belum dikonfirmasi Riki.
- Keputusan jangka panjang (platform, hosting, sinkron): rekomendasi + alasan, tunggu persetujuan Riki.

## Tahap 0: Siapkan bahan
- [ ] Riki kirim `index.html` (commit ke branch `claude/admiring-albattani-67trrg` atau tempel di chat).
- [ ] Alternatif: bangun ulang dari brief, lalu Riki cek hasilnya.
- Selesai kalau: file ada di repo.

## Tahap 1: Rapikan jadi proyek git
- [ ] Commit awal = `index.html` asli (bahan banding).
- [ ] Pecah jadi `index.html`, `css/`, `js/` (timer, state/storage, ui, audio, drag).
- [ ] Tetap tanpa framework dan tanpa build.
- [ ] Perilaku sama persis.
- Selesai kalau: prototipe lama dan hasil pecahan berperilaku sama.

## Tahap 2: Tes otomatis (Playwright, Chromium)
- [ ] Alur 6 langkah berulang tanpa error.
- [ ] Timer akurat setelah background (jam dimajukan).
- [ ] Reset 05.00: tugas lama hilang dari Fokus, tetap di To-do, "Kerjakan hari ini" memunculkannya lagi.
- [ ] Drag mengubah urutan dan tetap setelah reload.
- [ ] 50/10: timer 50:00, istirahat 10 menit. Ubah Kustom di Pengaturan: pilihan ketiga ikut berubah.
- [ ] Centang selesai menampilkan jam selesai + lama fokus.
- [ ] Terang dan gelap terbaca (kontras cukup), rapi di 360–420 px, tanpa scroll ke samping.
- [ ] Lagu dari perangkat tersimpan dan bunyi saat alarm. Tanpa lagu, beep bunyi.
- [ ] Data lama `pomo.v1` tetap terbaca.
- Selesai kalau: semua tes hijau.

## Tahap 3: Jadi PWA
- [ ] `manifest.json` + ikon.
- [ ] Service worker (cache offline).
- [ ] Uji pasang di layar utama dan jalan tanpa internet.
- Catatan: butuh HTTPS. Hosting menunggu keputusan Riki (Tahap 5).
- Selesai kalau: bisa dipasang dan jalan offline.

## Tahap 4: Laporan ke Riki
- [ ] Ringkas yang selesai, hasil tes, batasan.
- [ ] Panduan uji HP asli: Kustom 1 menit → Mulai → pindah app → cek alarm bunyi.

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
