"use client";
import { useEffect, useState } from 'react';
import { Card, Input, Button, PrimaryButton } from '@/components/ui';

export default function OnboardingPage() {
  const [form, setForm] = useState({ full_name: '', company: '', website: '', role: '', purpose: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [skipLoading, setSkipLoading] = useState(false);
  
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

  async function skip() {
    setSkipLoading(true);
    try {
      const res = await fetch('/api/me', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ onboarding_completed: true }) });
      if (!res.ok) throw new Error('Skip failed');
      window.location.href = '/dashboard';
    } finally {
      setSkipLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to MailWeaver! 👋</h1>
          <p className="mt-2 text-gray-600">Help us personalize your experience</p>
        </div>
        
        <Card className="p-8 shadow-lg">
          <h2 className="text-xl font-semibold mb-6">Tell us about you</h2>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Full name</label>
                <Input 
                  value={form.full_name} 
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })} 
                  placeholder="John Doe"
                  className="w-full" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Company</label>
                <Input 
                  value={form.company} 
                  onChange={(e) => setForm({ ...form, company: e.target.value })} 
                  placeholder="Acme Inc"
                  className="w-full" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Website</label>
                <Input 
                  value={form.website} 
                  onChange={(e) => setForm({ ...form, website: e.target.value })} 
                  placeholder="example.com"
                  className="w-full" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Role</label>
                <Input 
                  value={form.role} 
                  onChange={(e) => setForm({ ...form, role: e.target.value })} 
                  placeholder="Marketing Manager"
                  className="w-full" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">How will you use MailWeaver?</label>
              <textarea
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                placeholder="e.g., Marketing campaigns, Customer newsletters, Product updates..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Phone (optional)</label>
              <Input 
                value={form.phone} 
                onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                placeholder="+1 (555) 123-4567"
                className="w-full" 
              />
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <Button onClick={skip} loading={skipLoading} className="text-gray-600">
              Skip for now
            </Button>
            <PrimaryButton onClick={submit} loading={loading}>
              Continue →
            </PrimaryButton>
          </div>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-8">
          You can always update this information later in your profile settings
        </p>
      </div>
    </div>
  );
}


