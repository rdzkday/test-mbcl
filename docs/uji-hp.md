# Uji di HP asli

Tes otomatis hanya jalan di Chromium desktop. Layar mati dan pindah app **tidak bisa** diuji otomatis, jadi uji manual ini wajib.

## Siapkan
1. Jalankan `npm start`, atau taruh folder ini di hosting HTTPS (service worker dan pasang ke layar utama butuh HTTPS; `localhost` hanya berlaku di laptop).
2. Buka alamatnya di HP. Android: menu Chrome → Pasang aplikasi. iPhone: Safari → Bagikan → Tambah ke Layar Utama.

## Uji alarm (inti)
1. Pengaturan → Kustom fokus 1, Kustom istirahat 1.
2. Fokus → Mulai sesi baru → tambah 1 tugas → pilih → Siapkan → pilih Kustom → Mulai fokus.
3. Pindah ke app lain, atau matikan layar. Tunggu 1 menit.
4. Catat: alarm bunyi? Tepat waktu atau telat? Sisa waktu benar saat app dibuka lagi?
5. Ulangi dua kali: (a) layar mati, (b) pindah app tapi layar tetap menyala.

## Uji lain
- Pilih lagu dari HP, tutup app, buka lagi: lagu masih ada? Alarm memakai lagu itu?
- Tema Terang dan Gelap terbaca di bawah sinar matahari dan di ruang gelap?
- Tarik ikon titik di sebelah kiri tugas dengan jari: urutan berubah dan tidak menggulir halaman?
- Buka tanpa internet (mode pesawat): app tetap terbuka dan data ada?

Kirim hasilnya ke Claude: model HP, iOS/Android + versi, browser, dan hasil tiap uji.
