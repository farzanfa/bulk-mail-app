"use client";
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isMarketing = pathname === '/' || pathname === '/home' || pathname === '/login' || pathname === '/about' || pathname === '/privacy' || pathname === '/terms';
  const [open, setOpen] = useState(false);
  const links = isMarketing
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
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
        <a href="/" className="font-semibold inline-flex items-center gap-2">
          <img src="/icon.svg?v=2" alt="MailWeaver" className="h-6 w-6"/>
          <span className="hidden sm:inline">MailWeaver</span>
        </a>
        <nav className="hidden md:flex items-center gap-4 text-sm">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-gray-600 hover:text-black">{l.label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {isMarketing && (
            <>
              <a
                href="https://github.com/farzanfa"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-2 rounded text-sm px-3 py-2 bg-[#24292f] text-white hover:opacity-90"
              >
                <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.01.08-2.1 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.09.16 1.9.08 2.1.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
                GitHub
              </a>
              {session?.user?.id ? (
                <a href="/dashboard" className="hidden sm:inline-flex items-center gap-2 border px-3 py-2 rounded text-sm hover:bg-gray-50">Go to Dashboard</a>
              ) : (
                <a href="/login" className="hidden sm:inline-flex items-center gap-2 border px-3 py-2 rounded text-sm hover:bg-gray-50">Login</a>
              )}
            </>
          )}
          {!isMarketing && (
            <a href="/campaigns/new" className="hidden sm:inline-flex items-center gap-2 bg-brand px-3 py-2 rounded text-sm hover:bg-brand-dark">New Campaign</a>
          )}
          {!isMarketing && (
            <button onClick={() => signOut({ callbackUrl: '/login' })} className="hidden sm:inline-flex items-center gap-2 bg-black text-white px-3 py-2 rounded text-sm hover:opacity-90">Logout</button>
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
              {isMarketing && (
                <>
                  <a href="https://github.com/farzanfa" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded text-sm mt-2 px-3 py-2 bg-[#24292f] text-white" onClick={() => setOpen(false)}>
                    <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.01.08-2.1 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.09.16 1.9.08 2.1.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
                    GitHub
                  </a>
                  {session?.user?.id ? (
                    <a href="/dashboard" className="inline-flex items-center gap-2 border px-3 py-2 rounded text-sm mt-2" onClick={() => setOpen(false)}>Go to Dashboard</a>
                  ) : (
                    <a href="/login" className="inline-flex items-center gap-2 border px-3 py-2 rounded text-sm mt-2" onClick={() => setOpen(false)}>Login</a>
                  )}
                </>
              )}
              {!isMarketing && (
                <a href="/campaigns/new" className="mt-2 inline-flex items-center gap-2 bg-brand px-3 py-2 rounded text-sm hover:bg-brand-dark" onClick={() => setOpen(false)}>New Campaign</a>
              )}
              {!isMarketing && (
                <button onClick={() => { setOpen(false); signOut({ callbackUrl: '/login' }); }} className="inline-flex items-center gap-2 bg-black text-white px-3 py-2 rounded text-sm mt-2">Logout</button>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}


