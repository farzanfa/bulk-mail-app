"use client";
import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="max-w-sm mx-auto mt-24 p-6 bg-white rounded shadow">
      <h1 className="text-xl font-semibold">Sign in</h1>
      <form className="mt-4" onSubmit={async (e) => {
        e.preventDefault();
        const res = await signIn('credentials', { email, password, redirect: false });
        if (res?.error) setError('Invalid credentials or unverified email');
        else window.location.href = '/dashboard';
      }}>
        <input className="border rounded w-full p-2 mb-3" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="border rounded w-full p-2 mb-3" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
        <button className="w-full bg-black text-white py-2 rounded">Sign in</button>
      </form>
      <button className="w-full border mt-3 py-2 rounded" onClick={() => signIn('google', { callbackUrl: '/dashboard' })}>Sign in with Google</button>
    </div>
  );
}


