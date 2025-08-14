"use client";
import { useState } from 'react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="max-w-sm mx-auto mt-24 p-6 bg-white rounded shadow">
      <h1 className="text-xl font-semibold">Create account</h1>
      <form className="mt-4" onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        const res = await fetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password }), headers: { 'Content-Type': 'application/json' } });
        const json = await res.json();
        if (!res.ok) { setError(json.error || 'Failed'); toast.error('Registration failed'); }
        else { setToken(json.verify_token); toast.success('Account created. Verify your email.'); }
      }}>
        <input className="border rounded w-full p-2 mb-3" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="border rounded w-full p-2 mb-3" placeholder="Password (min 8)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
        <button className="w-full bg-black text-white py-2 rounded">Register</button>
      </form>
      {token && (
        <div className="mt-4 text-sm text-green-700">
          Verification token generated. For local dev, POST to `/api/auth/verify` with token: <code className="bg-gray-100 px-1">{token}</code>
        </div>
      )}
    </div>
  );
}


