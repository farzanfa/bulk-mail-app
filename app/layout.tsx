import './globals.css';
import type { ReactNode } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PWAInstaller from '@/components/PWAInstaller';
export const metadata = {
  title: 'MailWeaver',
  description: 'Modern bulk mailing platform',
  icons: { icon: '/icon.svg', shortcut: '/icon.svg', apple: '/icon.svg' },
  manifest: '/manifest.webmanifest'
};

export const viewport = {
  themeColor: '#ffe01b'
};
import { Toaster } from 'sonner';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Basic CSP to reduce XSS risk; adjust as needed for external resources */}
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https://www.googleapis.com https://accounts.google.com; frame-src 'self' https://accounts.google.com; object-src 'none'" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MailWeaver" />
        <meta name="theme-color" content="#ffe01b" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <PWAInstaller />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}


