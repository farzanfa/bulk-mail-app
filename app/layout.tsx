import './globals.css';
import type { ReactNode } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
export const metadata = {
  title: 'MailApp',
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
      <body className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}


