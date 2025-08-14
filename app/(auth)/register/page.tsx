"use client";
import { useState } from 'react';
import { toast } from 'sonner';
import { Card, Input, PrimaryButton } from '@/components/ui';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="max-w-sm mx-auto mt-24">
      <Card className="p-6">
        <h1 className="text-xl font-semibold">Create account</h1>
        <form className="mt-4 space-y-3" onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        const res = await fetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password }), headers: { 'Content-Type': 'application/json' } });
        const json = await res.json();
        if (!res.ok) { setError(json.error || 'Failed'); toast.error('Registration failed'); }
        else { setToken(json.verify_token); toast.success('Account created. Verify your email.'); }
        }}>
          <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input placeholder="Password (min 8)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <PrimaryButton className="w-full">Register</PrimaryButton>
        </form>
        {token && (
          <div className="mt-4 text-sm text-green-700">
            Verification token generated. For local dev, POST to `/api/auth/verify` with token: <code className="bg-gray-100 px-1">{token}</code>
          </div>
        )}
      </Card>
    </div>
  );
}


