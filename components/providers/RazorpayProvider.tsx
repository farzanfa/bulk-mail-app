'use client';

import React from 'react';

interface RazorpayProviderProps {
  children: React.ReactNode;
}

export function RazorpayProvider({ children }: RazorpayProviderProps) {
  // react-razorpay doesn't require a provider wrapper
  // The useRazorpay hook can be used directly in components
  return <>{children}</>;
}