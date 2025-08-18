'use client';
import dynamic from 'next/dynamic';

// Lazy load Toaster as it's not critical for initial render
const Toaster = dynamic(
  () => import('sonner').then(mod => ({ default: mod.Toaster })),
  { 
    ssr: false,
    loading: () => null,
  }
);

export default function ToasterWrapper() {
  return (
    <Toaster 
      richColors 
      position="top-right" 
      toastOptions={{
        className: 'touch-target',
        duration: 4000,
      }}
    />
  );
}