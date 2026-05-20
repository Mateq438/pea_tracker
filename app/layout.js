import './globals.css';
import { AuthProvider } from '@/lib/AuthContext';

export const metadata = {
  title: 'Trackfolio',
  description: 'Suivez vos portefeuilles boursiers',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Trackfolio',   // ← corrigé
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0f172a',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        {/* Favicon — onglet navigateur */}
        <link rel="icon" href="/icons/logo.png" type="image/png" />

        {/* Icône iOS (écran d'accueil iPhone/iPad) */}
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />

        {/* PWA Android */}
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-slate-950 text-white min-h-screen font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');` }} />
      </body>
    </html>
  );
}