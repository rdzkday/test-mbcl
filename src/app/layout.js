import './globals.css';

export const metadata = {
  title: 'Pomodoro Fokus',
  description: 'Pomodoro untuk deep work: susun to-do, pilih tugas, fokus, istirahat, ulangi.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icons/icon.svg', apple: '/icons/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'Fokus', statusBarStyle: 'default' }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#4f5fe6'
};

/* Pasang tema dari data tersimpan sebelum halaman tampil, supaya pengguna tema Gelap tidak melihat kilatan terang. */
const THEME_BOOT = `try{var s=JSON.parse(localStorage.getItem('pomo.v1')||'null');document.documentElement.setAttribute('data-app-theme',s&&s.theme==='dark'?'dark':'light')}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
