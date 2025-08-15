"use client";
import { useEffect, useState } from 'react';
import { Card, Input, Button, PrimaryButton } from '@/components/ui';

export default function OnboardingPage() {
  const [form, setForm] = useState({ full_name: '', company: '', website: '', role: '', purpose: '', phone: '' });
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    (async () => {
      const res = await fetch('/api/me', { cache: 'no-store' });
      const j = await res.json();
      if (j?.user) {
        setForm({
          full_name: j.user.full_name || '',
          company: j.user.company || '',
          website: j.user.website || '',
          role: j.user.role || '',
          purpose: j.user.purpose || '',
          phone: j.user.phone || ''
        });
        if (j.user.onboarding_completed_at) window.location.href = '/dashboard';
      }
    })();
  }, []);

  async function submit() {
    setLoading(true);
    try {
      const res = await fetch('/api/me', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, onboarding_completed: true }) });
      if (!res.ok) throw new Error('Save failed');
      window.location.href = '/dashboard';
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Tell us about you</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-600">Full name</label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Company</label>
            <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Website</label>
            <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="w-full" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Role</label>
            <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm text-gray-600">Purpose</label>
            <Input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className="w-full" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm text-gray-600">Phone</label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button onClick={() => window.location.href = '/dashboard'}>Skip</Button>
          <PrimaryButton onClick={submit} loading={loading}>Continue</PrimaryButton>
        </div>
      </Card>
    </div>
  );
}


