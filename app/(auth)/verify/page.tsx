"use client";
import { useState } from 'react';

export default function VerifyPage() {
  const [token, setToken] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="max-w-sm mx-auto mt-24 p-6 bg-white rounded shadow">
      <h1 className="text-xl font-semibold">Verify Email</h1>
      <form className="mt-4" onSubmit={async (e) => {
        e.preventDefault();
        setErr(null); setMsg(null);
        const res = await fetch('/api/auth/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
        const json = await res.json();
        if (!res.ok) setErr(json.error || 'Failed');
        else setMsg('Verified! You can now sign in.');
      }}>
        <input className="border rounded w-full p-2 mb-3" placeholder="Verification token" value={token} onChange={(e) => setToken(e.target.value)} />
        {err && <p className="text-sm text-red-600 mb-2">{err}</p>}
        {msg && <p className="text-sm text-green-600 mb-2">{msg}</p>}
        <button className="w-full bg-black text-white py-2 rounded">Verify</button>
      </form>
    </div>
  );
}


