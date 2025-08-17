"use client";
import type { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="system"
      enableSystem={true}
      disableTransitionOnChange={false}
      storageKey="mailweaver-theme"
    >
      <SessionProvider>{children}</SessionProvider>
    </ThemeProvider>
  );
}


