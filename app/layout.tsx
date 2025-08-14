import './globals.css';
import type { ReactNode } from 'react';
import Header from '@/components/Header';
export const metadata = {
  title: 'MailApp',
  description: 'Vercel-native bulk mailing platform',
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
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Header />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}


