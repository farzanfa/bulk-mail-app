import './globals.css';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="border-b bg-white">
          <div className="max-w-6xl mx-auto p-4 flex items-center gap-4 text-sm">
            <a href="/" className="font-semibold">MailApp</a>
            <a href="/dashboard" className="text-gray-600 hover:text-black">Dashboard</a>
            <a href="/templates" className="text-gray-600 hover:text-black">Templates</a>
            <a href="/uploads" className="text-gray-600 hover:text-black">Uploads</a>
            <a href="/contacts" className="text-gray-600 hover:text-black">Contacts</a>
            <a href="/campaigns" className="text-gray-600 hover:text-black">Campaigns</a>
          </div>
        </header>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}


