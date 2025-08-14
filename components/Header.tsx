"use client";
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

export default function Header() {
  const pathname = usePathname();
  const isPublic = pathname === '/login' || pathname === '/about' || pathname === '/privacy' || pathname === '/terms';
  const [open, setOpen] = useState(false);
  const links = isPublic
    ? [
        { href: '/about', label: 'About' },
        { href: '/privacy', label: 'Privacy Policy' },
        { href: '/terms', label: 'Terms & Conditions' }
      ]
    : [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/templates', label: 'Templates' },
        { href: '/uploads', label: 'Uploads' },
        { href: '/campaigns', label: 'Campaigns' }
      ];
  return (
    <header className="border-b bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <a href="/" className="font-semibold inline-flex items-center gap-2">
          <img src="/icon.svg" alt="MailWeaver" className="h-6 w-6"/>
          <span className="hidden sm:inline">MailWeaver</span>
        </a>
        <nav className="hidden md:flex items-center gap-4 text-sm">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-gray-600 hover:text-black">{l.label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {!isPublic && (
            <a href="/campaigns/new" className="hidden sm:inline-flex items-center gap-2 bg-brand px-3 py-2 rounded text-sm hover:bg-brand-dark">New Campaign</a>
          )}
          {!isPublic && (
            <button onClick={() => signOut({ callbackUrl: '/login' })} className="hidden sm:inline-flex items-center gap-2 border px-3 py-2 rounded text-sm">Logout</button>
          )}
          <button aria-label="Open menu" className="md:hidden inline-flex items-center justify-center p-2 rounded border" onClick={() => setOpen(true)}>
            <span className="sr-only">Open menu</span>
            ☰
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)}>
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85%] bg-white p-4 shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold">Menu</div>
              <button aria-label="Close menu" className="p-2" onClick={() => setOpen(false)}>✕</button>
            </div>
            <nav className="flex flex-col gap-3 text-sm">
              {links.map((l) => (
                <a key={l.href} href={l.href} className="text-gray-700 hover:text-black" onClick={() => setOpen(false)}>{l.label}</a>
              ))}
              {!isPublic && (
                <a href="/campaigns/new" className="mt-2 inline-flex items-center gap-2 bg-brand px-3 py-2 rounded text-sm hover:bg-brand-dark" onClick={() => setOpen(false)}>New Campaign</a>
              )}
              {!isPublic && (
                <button onClick={() => { setOpen(false); signOut({ callbackUrl: '/login' }); }} className="inline-flex items-center gap-2 border px-3 py-2 rounded text-sm mt-2">Logout</button>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}


