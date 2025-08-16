"use client";
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';

interface HeaderProps {
  isAdmin: boolean;
}

export default function Header({ isAdmin }: HeaderProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isMarketing = pathname === '/' || pathname === '/home' || pathname === '/login' || pathname === '/about' || pathname === '/privacy' || pathname === '/terms' || pathname === '/why-us' || pathname === '/pricing';
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);
  
  
  const links = isMarketing
    ? [
        { href: '/', label: 'Home' },
        { href: '/why-us', label: 'Why us?' },
        { href: '/pricing', label: 'Pricing' },
        { href: '/about', label: 'About' },
        { href: '/privacy', label: 'Privacy Policy' },
        { href: '/terms', label: 'Terms & Conditions' }
      ]
    : [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/templates', label: 'Templates' },
        { href: '/uploads', label: 'Uploads' },
        { href: '/campaigns', label: 'Campaigns' },
        ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : [])
      ];
  
  return (
    <header className={`sticky top-0 z-40 border-b bg-white/95 backdrop-blur-sm transition-all duration-300 ${scrolled ? 'shadow-sm' : ''}`}>
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
        <a href="/" className="font-semibold inline-flex items-center gap-2 group">
          <img src="/icon.svg?v=2" alt="MailWeaver" className="h-6 w-6 transition-transform group-hover:scale-110"/>
          <span className="hidden sm:inline bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">MailWeaver</span>
        </a>
        <nav className="hidden md:flex items-center gap-1 text-sm">
          {links.map((l) => (
            <a 
              key={l.href} 
              href={l.href} 
              className={`px-3 py-2 rounded-lg transition-all duration-200 ${
                pathname === l.href 
                  ? 'bg-gray-100 text-gray-900 font-medium' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {isMarketing && (
            <>
              <a
                href="https://github.com/farzanfa"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-2 rounded-lg text-sm px-3 py-2 bg-[#24292f] text-white hover:bg-[#1c2128] transition-colors duration-200"
              >
                <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.01.08-2.1 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.09.16 1.9.08 2.1.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
                GitHub
              </a>
              {status === 'loading' ? (
                <div className="hidden sm:inline-flex items-center gap-2 border border-gray-200 px-3 py-2 rounded-lg text-sm">
                  <div className="h-4 w-4 border-2 border-gray-300 border-t-brand rounded-full animate-spin"></div>
                </div>
              ) : session?.user ? (
                <a href="/dashboard" className="hidden sm:inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow">
                  Go to Dashboard →
                </a>
              ) : (
                <button 
                  onClick={() => signIn('google', { callbackUrl: '/dashboard' })} 
                  className="hidden sm:inline-flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                      <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                      <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                      <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                      <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                    </g>
                  </svg>
                  Sign in with Google
                </button>
              )}
            </>
          )}
          {!isMarketing && (
            <>
              <a href="/campaigns/new" className="hidden sm:inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow">
                + New Campaign
              </a>
              <a href="/onboarding" className="hidden sm:inline-flex items-center gap-2 border border-gray-200 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 hover:border-gray-300 transition-all duration-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="hidden lg:inline">Profile</span>
              </a>
              <button onClick={() => signOut({ callbackUrl: '/' })} className="hidden sm:inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition-all duration-200">
                Logout
              </button>
            </>
          )}
          <button aria-label="Open menu" className="md:hidden inline-flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 touch-target" onClick={() => setOpen(true)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fadeIn" onClick={() => setOpen(false)}>
          <div 
            className="absolute left-0 top-0 h-full w-80 max-w-[85%] bg-white shadow-xl transform transition-transform duration-300 safe-padding" 
            style={{ transform: open ? 'translateX(0)' : 'translateX(-100%)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-full flex flex-col">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <a href="/" className="font-semibold inline-flex items-center gap-2">
                    <img src="/icon.svg?v=2" alt="MailWeaver" className="h-6 w-6"/>
                    <span className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">MailWeaver</span>
                  </a>
                  <button aria-label="Close menu" className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 touch-target" onClick={() => setOpen(false)}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <nav className="flex-1 overflow-y-auto py-4">
                <div className="px-4 space-y-1">
                  {links.map((l) => (
                    <a 
                      key={l.href} 
                      href={l.href} 
                      className={`block px-3 py-2 rounded-lg transition-all duration-200 ${
                        pathname === l.href 
                          ? 'bg-gray-100 text-gray-900 font-medium' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`} 
                      onClick={() => setOpen(false)}
                    >
                      {l.label}
                    </a>
                  ))}
                </div>
              </nav>
              <div className="p-4 border-t border-gray-200 space-y-3 safe-padding-bottom">
                {isMarketing && (
                  <>
                    <a href="https://github.com/farzanfa" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg text-sm px-3 py-2 bg-[#24292f] text-white" onClick={() => setOpen(false)}>
                      <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.01.08-2.1 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.09.16 1.9.08 2.1.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
                      GitHub
                    </a>
                    {status === 'loading' ? (
                      <div className="flex items-center gap-2 border border-gray-200 px-3 py-2 rounded-lg text-sm">
                        <div className="h-4 w-4 border-2 border-gray-300 border-t-brand rounded-full animate-spin"></div>
                      </div>
                    ) : session?.user ? (
                      <a href="/dashboard" className="block w-full text-center bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg text-sm" onClick={() => setOpen(false)}>
                        Go to Dashboard →
                      </a>
                    ) : (
                      <button onClick={() => { setOpen(false); signIn('google', { callbackUrl: '/dashboard' }); }} className="w-full flex items-center justify-center gap-2 border border-gray-200 px-4 py-2 rounded-lg text-sm">
                        <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                          <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                            <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                            <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                            <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                            <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                          </g>
                        </svg>
                        Sign in with Google
                      </button>
                    )}
                  </>
                )}
                {!isMarketing && (
                  <>
                    <a href="/campaigns/new" className="block w-full text-center bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg text-sm" onClick={() => setOpen(false)}>
                      + New Campaign
                    </a>
                    <a href="/onboarding" className="flex items-center gap-2 border border-gray-200 px-3 py-2 rounded-lg text-sm" onClick={() => setOpen(false)}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile
                    </a>
                    <button onClick={() => { setOpen(false); signOut({ callbackUrl: '/' }); }} className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg text-sm">
                      Logout
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}


