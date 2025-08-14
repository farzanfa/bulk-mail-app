import './globals.css';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="border-b bg-white">
          <div className="max-w-6xl mx-auto p-4 flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <a href="/" className="font-semibold">MailApp</a>
              <nav className="hidden md:flex items-center gap-3">
                <a href="/dashboard" className="text-gray-600 hover:text-black">Dashboard</a>
                <a href="/templates" className="text-gray-600 hover:text-black">Templates</a>
                <a href="/uploads" className="text-gray-600 hover:text-black">Uploads</a>
                <a href="/contacts" className="text-gray-600 hover:text-black">Contacts</a>
                <a href="/campaigns" className="text-gray-600 hover:text-black">Campaigns</a>
              </nav>
            </div>
            <a href="/campaigns/new" className="inline-flex items-center gap-2 bg-brand px-3 py-2 rounded text-sm hover:bg-brand-dark">New Campaign</a>
          </div>
        </header>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}


