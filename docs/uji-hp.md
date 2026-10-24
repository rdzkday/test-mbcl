# Cara tes aplikasi (untuk Riki)

Ada dua jenis tes. Yang otomatis dijalankan Claude. Yang di HP asli **harus lo yang jalankan**, karena layar mati dan pindah app tidak bisa diuji otomatis.

## A. Tes otomatis (Claude yang jalankan)
- 29 tes di Chromium desktop: alur, timer, reset 05.00, drag, 50/10, lagu, tema, lebar 360–420 px, PWA offline.
- Jalan terhadap hasil build produksi (sama dengan yang dipakai Vercel).
- Perintah (kalau lo mau jalankan sendiri di laptop): `npm install`, `npx playwright install chromium`, lalu `npm test`.

## B. Tes di HP lewat Vercel (cara termudah)
Satu kali, setup proyek:
1. Buka vercel.com, login, lalu Add New → Project.
2. Import repo `rdzkday/test-mbcl`. (Kalau repo tidak muncul, beri akses lewat tombol Adjust GitHub App Permissions.)
3. Framework otomatis terbaca Next.js. Biarkan semua bawaan, klik Deploy.
4. Setiap Claude push ke branch, Vercel membuat alamat Preview baru. Cari di tab Deployments, atau di komentar PR.

Catatan proteksi:
- Preview Vercel bisa meminta login Vercel di HP. Itu proteksi bawaan, bukan error aplikasi. Matikan di Settings → Deployment Protection untuk proyek ini kalau mengganggu.
- Layar login juga bisa menghalangi tes pasang ke layar utama (manifest ikut terblokir). Untuk tes pasang, pakai alamat produksi (`namaproyek.vercel.app`) setelah branch digabung ke `main`.

Atau minta Claude yang membuatkan proyek lewat konektor Vercel (butuh lo setuju dulu).

## C. Uji di HP asli
Buka alamat Vercel (HTTPS) di HP. Android: Chrome. iPhone: Safari.

### Pasang ke layar utama
- Android: menu Chrome → Pasang aplikasi.
- iPhone: Bagikan → Tambah ke Layar Utama.

### Uji alarm (inti)
1. Pengaturan → Kustom fokus 1, Kustom istirahat 1.
2. Fokus → Mulai sesi baru → tambah 1 tugas → Selesai, pilih tugas → pilih tugasnya → Siapkan Pomodoro → pilih Kustom → Mulai fokus.
3. Pindah ke app lain, atau matikan layar. Tunggu 1 menit.
4. Catat: alarm bunyi? Tepat waktu atau telat? Sisa waktu benar saat app dibuka lagi?
5. Ulangi dua kali: (a) layar mati, (b) pindah app tapi layar tetap menyala.

### Uji lain
- Pilih lagu dari HP, tutup app, buka lagi: lagu masih ada? Alarm memakai lagu itu?
- Tema Terang dan Gelap terbaca di bawah sinar matahari dan di ruang gelap?
- Tarik ikon titik di kiri tugas dengan jari: urutan berubah dan halaman tidak ikut menggulir?
- Mode pesawat: app tetap terbuka dan data ada? (Buka online sekali dulu.)
- Setelah Claude push versi baru: buka app dua kali. Pembukaan pertama menampilkan versi lama, kedua yang baru (itu cara kerja cache offline).

### Kirim hasil ke Claude
Model HP, iOS/Android + versi, browser, hasil tiap uji, dan foto kalau ada yang aneh.
