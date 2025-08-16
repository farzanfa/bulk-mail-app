import './globals.css';
import type { ReactNode } from 'react';
import HeaderWrapper from '@/components/HeaderWrapper';
import Footer from '@/components/Footer';
import PWAInstaller from '@/components/PWAInstaller';
import Providers from '@/components/Providers';
export const metadata = {
  title: 'MailWeaver',
  description: 'Modern bulk mailing platform',
  icons: { icon: '/icon.svg', shortcut: '/icon.svg', apple: '/icon.svg' },
  manifest: '/manifest.webmanifest',
  metadataBase: new URL('https://mailweaver.farzanfa.com'),
  openGraph: {
    title: 'MailWeaver',
    description: 'Modern bulk mailing platform',
    url: 'https://mailweaver.farzanfa.com/',
    siteName: 'MailWeaver',
    images: ['/icon.svg'],
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MailWeaver',
    description: 'Modern bulk mailing platform',
    images: ['/icon.svg']
  },
  robots: {
    index: true,
    follow: true
  }
};

export const viewport = {
  themeColor: '#ffe01b'
};
import { Toaster } from 'sonner';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MailWeaver" />
        <meta name="theme-color" content="#ffe01b" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
        <Providers>
          <HeaderWrapper />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <PWAInstaller />
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}


