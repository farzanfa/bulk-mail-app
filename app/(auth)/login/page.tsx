"use client";
import { signIn } from 'next-auth/react';
import { Card } from '@/components/ui';

export default function LoginPage() {
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
      </Card>
    </div>
  );
}


