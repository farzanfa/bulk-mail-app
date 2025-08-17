export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = {
    product: [
      { href: '/why-us', label: 'Why MailWeaver' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/templates', label: 'Templates' },
      { href: '/dashboard', label: 'Dashboard' }
    ],
    company: [
      { href: '/about', label: 'About Us' },
      { href: 'https://github.com/farzanfa', label: 'GitHub', external: true },
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/terms', label: 'Terms of Service' }
    ],
    resources: [
      { href: '/campaigns', label: 'Campaigns' },
      { href: '/uploads', label: 'CSV Uploads' },
      { href: '/profile', label: 'Profile' },
      { href: '/admin', label: 'Admin Panel' }
    ]
  };

  return (
    <footer className="relative bg-gradient-to-b from-gray-50 to-white border-t border-gray-100">
      {/* Decorative gradient */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <a href="/" className="inline-flex items-center gap-2 group mb-4">
              <div className="relative">
                <img src="/icon.svg?v=2" alt="MailWeaver" className="h-8 w-8 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12"/>
                <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <span className="text-xl font-bold text-gradient">MailWeaver</span>
            </a>
            <p className="text-gray-600 max-w-md mb-6">
              Streamline your email campaigns with our powerful, user-friendly platform. 
              Send personalized emails at scale with ease.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/farzanfa"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group"
                aria-label="GitHub"
              >
                <svg className="w-5 h-5 text-gray-700 group-hover:text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5 text-gray-700 group-hover:text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group"
                aria-label="LinkedIn"
              >
                <svg className="w-5 h-5 text-gray-700 group-hover:text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>
          
          {/* Links Columns */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-gray-600 hover:text-primary transition-colors duration-200 text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className="text-gray-600 hover:text-primary transition-colors duration-200 text-sm inline-flex items-center gap-1"
                  >
                    {link.label}
                    {link.external && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Resources
            </h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-gray-600 hover:text-primary transition-colors duration-200 text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>© {currentYear} MailWeaver.</span>
              <span>All rights reserved.</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <a href="/privacy" className="text-gray-600 hover:text-primary transition-colors duration-200">
                Privacy
              </a>
              <a href="/terms" className="text-gray-600 hover:text-primary transition-colors duration-200">
                Terms
              </a>
              <a href="/about" className="text-gray-600 hover:text-primary transition-colors duration-200">
                Contact
              </a>
            </div>
          </div>
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
    </footer>
  );
}


