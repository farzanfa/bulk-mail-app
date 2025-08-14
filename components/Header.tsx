"use client";
import { useState } from 'react';

export default function Header() {
  const [open, setOpen] = useState(false);
  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/templates', label: 'Templates' },
    { href: '/uploads', label: 'Uploads' },
    { href: '/contacts', label: 'Contacts' },
    { href: '/campaigns', label: 'Campaigns' }
  ];
  return (
    <header className="border-b bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <a href="/" className="font-semibold inline-flex items-center gap-2">
          <img src="/icon.svg" alt="MailApp" className="h-6 w-6"/>
          <span className="hidden sm:inline">MailApp</span>
        </a>
        <nav className="hidden md:flex items-center gap-4 text-sm">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-gray-600 hover:text-black">{l.label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a href="/campaigns/new" className="hidden sm:inline-flex items-center gap-2 bg-brand px-3 py-2 rounded text-sm hover:bg-brand-dark">New Campaign</a>
          <button aria-label="Open menu" className="md:hidden inline-flex items-center justify-center p-2 rounded border" onClick={() => setOpen(true)}>
            <span className="sr-only">Open menu</span>
            ☰
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)}>
          <div className="absolute left-0 top-0 h-full w-72 max-w-[85%] bg-white p-4 shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold">Menu</div>
              <button aria-label="Close menu" className="p-2" onClick={() => setOpen(false)}>✕</button>
            </div>
            <nav className="flex flex-col gap-3 text-sm">
              {links.map((l) => (
                <a key={l.href} href={l.href} className="text-gray-700 hover:text-black" onClick={() => setOpen(false)}>{l.label}</a>
              ))}
              <a href="/campaigns/new" className="mt-2 inline-flex items-center gap-2 bg-brand px-3 py-2 rounded text-sm hover:bg-brand-dark" onClick={() => setOpen(false)}>New Campaign</a>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}


