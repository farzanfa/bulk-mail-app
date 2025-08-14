"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Card } from '@/components/ui';

export default function LoginClient() {
  const router = useRouter();

  // Strip callbackUrl from the address bar immediately
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('callbackUrl=')) {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="max-w-sm mx-auto mt-24">
      <Card className="p-6 text-center space-y-4">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="text-sm text-gray-600">Use your Google account to continue.</p>
        <button
          className="w-full border py-2 rounded"
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
        >
          Continue with Google
        </button>
        <div className="mt-4 flex items-center justify-center gap-4 text-sm">
          <a href="/about" className="text-gray-600 hover:text-black">About</a>
          <a href="/privacy" className="text-gray-600 hover:text-black">Privacy Policy</a>
          <a href="/terms" className="text-gray-600 hover:text-black">Terms & Conditions</a>
        </div>
      </Card>
    </div>
  );
}


