'use client';

import { RazorpayProvider as ReactRazorpayProvider } from 'react-razorpay';

interface RazorpayProviderProps {
  children: React.ReactNode;
}

export function RazorpayProvider({ children }: RazorpayProviderProps) {
  return (
    <ReactRazorpayProvider>
      {children}
    </ReactRazorpayProvider>
  );
}