import './globals.css';
import type { ReactNode } from 'react';
import { Metadata, Viewport } from 'next';
import HeaderWrapper from '@/components/HeaderWrapper';
import Footer from '@/components/Footer';
import PWAInstaller from '@/components/PWAInstaller';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: {
    default: 'MailWeaver - Modern Bulk Email Marketing Platform',
    template: '%s | MailWeaver'
  },
  description: 'Powerful, user-friendly bulk email marketing platform. Send personalized campaigns, track engagement, and grow your audience with MailWeaver.',
  keywords: ['email marketing', 'bulk email', 'email campaigns', 'email automation', 'marketing platform', 'email templates'],
  authors: [{ name: 'MailWeaver Team' }],
  creator: 'MailWeaver',
  publisher: 'MailWeaver',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://mailweaver.farzanfa.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'MailWeaver - Modern Bulk Email Marketing Platform',
    description: 'Powerful, user-friendly bulk email marketing platform. Send personalized campaigns, track engagement, and grow your audience.',
    url: 'https://mailweaver.farzanfa.com',
    siteName: 'MailWeaver',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'MailWeaver - Email Marketing Platform',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MailWeaver - Modern Email Marketing Platform',
    description: 'Powerful, user-friendly bulk email marketing platform. Send personalized campaigns and grow your audience.',
    images: ['/og-image.svg'],
    creator: '@mailweaver',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#ffe01b',
      },
    ],
  },
  manifest: '/manifest.webmanifest',
  category: 'technology',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffe01b' },
    { media: '(prefers-color-scheme: dark)', color: '#ffe01b' }
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  colorScheme: 'light dark',
};
import { Toaster } from 'sonner';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MailWeaver" />
        <meta name="theme-color" content="#ffe01b" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=5" />
        <meta name="format-detection" content="telephone=no" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'MailWeaver',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              description: 'Powerful, user-friendly bulk email marketing platform. Send personalized campaigns, track engagement, and grow your audience.',
              url: 'https://mailweaver.farzanfa.com',
              creator: {
                '@type': 'Organization',
                name: 'MailWeaver',
                url: 'https://mailweaver.farzanfa.com',
              },
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
                availability: 'https://schema.org/InStock',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                ratingCount: '250',
              },
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 flex flex-col antialiased">
        <Providers>
          <HeaderWrapper />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <PWAInstaller />
          <Toaster 
            richColors 
            position="top-right" 
            toastOptions={{
              className: 'touch-target',
              duration: 4000,
            }}
          />
        </Providers>
      </body>
    </html>
  );
}


