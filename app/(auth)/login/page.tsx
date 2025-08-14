"use client";
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Card, Input, PrimaryButton } from '@/components/ui';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="max-w-sm mx-auto mt-24">
      <Card className="p-6">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <form className="mt-4 space-y-3" onSubmit={async (e) => {
        e.preventDefault();
        const res = await signIn('credentials', { email, password, redirect: false });
        if (res?.error) { setError('Invalid credentials or unverified email'); toast.error('Sign in failed'); }
        else { toast.success('Signed in'); window.location.href = '/dashboard'; }
        }}>
          <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <PrimaryButton className="w-full">Sign in</PrimaryButton>
        </form>
        <button className="w-full border mt-3 py-2 rounded" onClick={() => signIn('google', { callbackUrl: '/dashboard' })}>Sign in with Google</button>
      </Card>
    </div>
  );
}


