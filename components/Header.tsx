"use client";
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import { IconButton } from './ui';

interface HeaderProps {
  isAdmin: boolean;
}

export default function Header({ isAdmin }: HeaderProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isMarketing = pathname === '/' || pathname === '/home' || pathname === '/login' || pathname === '/about' || pathname === '/privacy' || pathname === '/terms' || pathname === '/why-us' || pathname === '/pricing';
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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

  // Handle Escape key to close menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (open) {
      // Store the current scroll position
      const scrollY = window.scrollY;
      
      // Apply styles to prevent scrolling
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.classList.add('menu-open');
      
      // Focus the close button when menu opens
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
      
      return () => {
        // Remove the styles and restore scroll position
        const storedScrollY = parseInt(document.body.style.top || '0') * -1;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.classList.remove('menu-open');
        window.scrollTo(0, storedScrollY);
        
        // Return focus to menu button when menu closes
        menuButtonRef.current?.focus();
      };
    }
  }, [open]);
  
  
  const links = isMarketing
    ? [
        { href: '/', label: 'Home', icon: '🏠' },
        { href: '/why-us', label: 'Why us?', icon: '✨' },
        { href: '/pricing', label: 'Pricing', icon: '💎' },
        { href: '/about', label: 'About', icon: '👋' },
        { href: '/privacy', label: 'Privacy Policy', icon: '🔒' },
        { href: '/terms', label: 'Terms & Conditions', icon: '📄' }
      ]
    : [
        { href: '/dashboard', label: 'Dashboard', icon: '📊' },
        { href: '/templates', label: 'Templates', icon: '📧' },
        { href: '/uploads', label: 'Uploads', icon: '📤' },
        { href: '/campaigns', label: 'Campaigns', icon: '🚀' },
        ...(isAdmin ? [{ href: '/admin', label: 'Admin', icon: '⚙️' }] : [])
      ];
  
  return (
    <header className={`sticky top-0 z-40 glass border-b border-gray-100 transition-all duration-300 ${scrolled ? 'shadow-lg' : ''}`}>
      <div className="w-full px-3 sm:px-4 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            {/* Logo */}
            <a href="/" aria-label="MailWeaver home" className="font-bold inline-flex items-center gap-2 group flex-shrink-0">
              <div className="relative">
                <img src="/icon.svg?v=2" alt="MailWeaver" className="h-6 w-6 sm:h-7 sm:w-7 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12"/>
                <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <span className="hidden sm:inline text-lg font-display text-gradient">MailWeaver</span>
            </a>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 text-sm flex-1 justify-center">
              {links.map((l) => (
                <a 
                  key={l.href} 
                  href={l.href} 
                  className={`px-4 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap font-medium ${
                    pathname === l.href 
                      ? 'bg-primary/10 text-primary shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                  }`}
                >
                  {l.label}
                </a>
              ))}
            </nav>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {isMarketing ? (
                <>
                  {/* GitHub Button - Hidden on mobile */}
                  <a
                    href="https://github.com/farzanfa"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden lg:inline-flex items-center gap-2 rounded-lg text-sm px-4 py-2.5 bg-gray-900 text-white hover:bg-gray-800 transition-all duration-200 font-medium shadow-button hover:shadow-button-hover hover:-translate-y-0.5"
                  >
                    <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.01.08-2.1 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.09.16 1.9.08 2.1.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
                    GitHub
                  </a>
                  
                  {/* Auth Buttons */}
                  {status === 'loading' ? (
                    <div className="hidden sm:inline-flex items-center gap-2 border border-gray-200 px-4 py-2.5 rounded-lg text-sm">
                      <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    </div>
                  ) : session?.user ? (
                    <a href="/dashboard" className="hidden sm:inline-flex items-center gap-2 gradient-primary text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-sm font-semibold hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 shadow-lg whitespace-nowrap">
                      <span className="hidden lg:inline">Go to</span> Dashboard
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </a>
                  ) : (
                    <button 
                      onClick={() => signIn('google', { callbackUrl: '/dashboard' })} 
                      className="hidden sm:inline-flex items-center gap-2 bg-white border border-gray-200 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 shadow-button whitespace-nowrap"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                        <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                          <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                          <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                          <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                          <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                        </g>
                      </svg>
                      <span className="hidden lg:inline">Sign in with</span> Google
                    </button>
                  )}
                  
                  {/* Mobile CTA Button */}
                  {session?.user ? (
                    <a href="/dashboard" className="inline-flex sm:hidden items-center justify-center gradient-primary text-white px-3 py-2 rounded-lg text-xs font-semibold hover:shadow-lg transition-all duration-200">
                      Dashboard
                    </a>
                  ) : (
                    <button 
                      onClick={() => signIn('google', { callbackUrl: '/dashboard' })} 
                      className="inline-flex sm:hidden items-center justify-center border border-gray-200 px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-50 transition-all duration-200"
                    >
                      Sign in
                    </button>
                  )}
                </>
              ) : (
                <>
                  {/* User Profile Button - Only visible when logged in */}
                  {session?.user && (
                    <div className="relative group">
                      <button className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-100/80 transition-all duration-200">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                          {(session.user.name?.[0] || session.user.email?.[0] || '?').toUpperCase()}
                        </div>
                        <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {/* Dropdown Menu */}
                      <div className="absolute right-0 mt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right scale-95 group-hover:scale-100">
                        <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-fadeIn">
                          <div className="p-4 border-b border-gray-100">
                            <p className="text-sm font-semibold text-gray-900 truncate">{session.user.name || 'User'}</p>
                            <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
                          </div>
                          <div className="py-2">
                            <a href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              Profile
                            </a>
                            <a href="/pricing" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Subscription
                            </a>
                            <div className="border-t border-gray-100 mt-2 pt-2">
                              <button onClick={() => signOut({ callbackUrl: '/' })} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Sign out
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setOpen(!open)}
                className="inline-flex md:hidden items-center justify-center p-2.5 rounded-lg text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-200 touch-manipulation"
                aria-expanded={open}
                aria-label="Toggle navigation menu"
                ref={menuButtonRef}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <div 
        className={`md:hidden fixed inset-0 z-50 ${
          open ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        aria-hidden={!open}
      >
        {/* Overlay */}
        <div 
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-all duration-300 ${
            open ? 'opacity-100' : 'opacity-0'
          }`} 
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        />
        
        {/* Menu Panel */}
        <nav 
          className={`absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl transition-all duration-300 ease-out overflow-hidden ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}
          role="navigation"
          aria-label="Mobile navigation"
        >
          <div className="flex flex-col h-full relative">
            {/* Menu Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 mobile-menu-header">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                  aria-label="Close menu"
                  ref={closeButtonRef}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Menu Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="py-4">
                <div className="space-y-1 px-3">
                  {links.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 touch-manipulation ${
                        pathname === l.href
                          ? 'bg-primary/10 text-primary'
                          : 'text-gray-700 hover:bg-gray-100 active:bg-gray-100'
                      }`}
                      onClick={() => setOpen(false)}
                    >
                      <span className="text-xl flex-shrink-0">{l.icon}</span>
                      <span>{l.label}</span>
                    </a>
                  ))}
                </div>
                
                {!isMarketing && session?.user && (
                  <>
                    <div className="my-4 px-6">
                      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                    </div>
                    
                    <div className="space-y-1 px-3">
                      <a href="/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:bg-gray-100 active:bg-gray-100 transition-all duration-200 touch-manipulation" onClick={() => setOpen(false)}>
                        <span className="text-xl flex-shrink-0">👤</span>
                        <span>Profile</span>
                      </a>
                      <a href="/pricing" className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:bg-gray-100 active:bg-gray-100 transition-all duration-200 touch-manipulation" onClick={() => setOpen(false)}>
                        <span className="text-xl flex-shrink-0">💎</span>
                        <span>Subscription</span>
                      </a>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Mobile Menu Footer */}
            <div className="border-t border-gray-100 p-4 space-y-3 mobile-menu-footer">
              {isMarketing ? (
                <>
                  {session?.user ? (
                    <a href="/dashboard" className="block w-full text-center gradient-primary text-white px-4 py-3 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
                      Go to Dashboard
                    </a>
                  ) : (
                    <button 
                      onClick={() => signIn('google', { callbackUrl: '/dashboard' })} 
                      className="flex items-center justify-center gap-2 w-full bg-white border border-gray-200 px-4 py-3 rounded-xl text-base font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
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
              ) : (
                <button 
                  onClick={() => signOut({ callbackUrl: '/' })} 
                  className="flex items-center justify-center gap-2 w-full bg-red-50 text-red-600 px-4 py-3 rounded-xl text-base font-medium hover:bg-red-100 transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              )}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}


