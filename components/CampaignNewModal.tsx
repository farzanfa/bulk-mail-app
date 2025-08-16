"use client";
import { useEffect, useMemo, useState } from 'react';
import { Section, Input, Button, PrimaryButton, Card, Select } from '@/components/ui';
import { sanitizeHtml } from '@/lib/sanitize';

export function CampaignNewModal({ onClose, userPlan }: { onClose: () => void; userPlan?: string }) {
  const [google, setGoogle] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [uploads, setUploads] = useState<any[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [uploadId, setUploadId] = useState('');
  const [googleId, setGoogleId] = useState('');
  const [name, setName] = useState('');
  const [dry, setDry] = useState<any[]>([]);
  const [loadingDryRun, setLoadingDryRun] = useState(false);
  const [loadingLaunch, setLoadingLaunch] = useState(false);
  const canDryRun = useMemo(() => Boolean(templateId && uploadId), [templateId, uploadId]);

  useEffect(() => {
    (async () => {
      const me = await fetch('/api/me', { cache: 'no-store' }).then(r => r.json());
      setGoogle(me.googleAccounts || []);
      if (me.googleAccounts && me.googleAccounts.length > 0) setGoogleId(me.googleAccounts[0].id);
      const t = await fetch('/api/templates', { cache: 'no-store' }).then(r => r.json());
      setTemplates(t.templates || []);
      const u = await fetch('/api/uploads', { cache: 'no-store' }).then(r => r.json());
      setUploads(u.uploads || []);
    })();
  }, []);

  async function doDryRun() {
    if (!templateId) { alert('Select a template'); return; }
    if (!uploadId) { alert('Select an upload'); return; }
    setLoadingDryRun(true);
    try {
      const res = await fetch('/api/campaigns/dry-run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ template_id: templateId, upload_id: uploadId, limit: 10 }) });
      const json = await res.json();
      if (!res.ok) { alert(json.error || 'Dry run failed'); return; }
      setDry(json.renders || []);
    } finally {
      setLoadingDryRun(false);
    }
  }

  async function createAndLaunch() {
    if (!name.trim()) { alert('Please enter a campaign name'); return; }
    if (!templateId) { alert('Select a template'); return; }
    if (!uploadId) { alert('Select an upload'); return; }
    if (!googleId) { alert('Connect/select a Google account'); return; }
    setLoadingLaunch(true);
    try {
      const res = await fetch('/api/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, google_account_id: googleId, template_id: templateId, upload_id: uploadId, filters: {} }) });
      const json = await res.json();
      if (!res.ok) { alert(json.error || 'Failed'); return; }
      const id = json.campaign.id;
      const r = await fetch(`/api/campaigns/${id}/launch`, { method: 'POST' });
      if (!r.ok) { alert('Launch failed'); return; }
      window.location.href = `/campaigns/${id}`;
    } finally {
      setLoadingLaunch(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl my-8 mx-auto">
        <div className="sticky top-0 z-10 bg-white p-4 border-b flex items-center justify-between rounded-t-lg">
          <h2 className="text-lg font-semibold">New Campaign</h2>
          <button 
            aria-label="Close" 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-target flex items-center justify-center" 
            onClick={onClose}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 space-y-4 modal-content">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 col-span-1 md:col-span-2">
              <label className="block text-sm text-gray-500 mb-2">Campaign name</label>
              <Input 
                placeholder="Spring promo" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
            </Card>
            <Card className="p-4">
              <label className="block text-sm text-gray-500 mb-2">1) Google Account</label>
              {google.length === 0 ? (
                <div className="text-sm text-gray-600">
                  No Google account connected.{" "}
                  <a href="/api/google/oauth/url?redirect=1" className="text-blue-600 hover:underline">Connect Google</a>
                  {" "}then return here.
                </div>
              ) : google.length === 1 ? (
                <div className="text-sm text-gray-700">Using: {google[0].email}</div>
              ) : (
                <Select 
                  value={googleId} 
                  onChange={(e) => setGoogleId(e.target.value)}
                >
                  {google.map((g: any) => (<option key={g.id} value={g.id}>{g.email}</option>))}
                </Select>
              )}
              {google.length > 0 && userPlan === 'admin' && (
                <a href="/api/google/oauth/url?redirect=1" className="text-xs text-blue-600 hover:underline inline-block mt-2">Connect another</a>
              )}
            </Card>
            <Card className="p-4">
              <label className="block text-sm text-gray-500 mb-2">2) Template</label>
              <Select 
                value={templateId} 
                onChange={(e) => setTemplateId(e.target.value)}
              >
                <option value="">Select template</option>
                {templates.map((t: any) => (<option key={t.id} value={t.id}>{t.name} (v{t.version})</option>))}
              </Select>
            </Card>
            <Card className="p-4">
              <label className="block text-sm text-gray-500 mb-2">3) Upload</label>
              <Select 
                value={uploadId} 
                onChange={(e) => setUploadId(e.target.value)}
              >
                <option value="">Select contact list</option>
                {uploads.map((u: any) => (<option key={u.id} value={u.id}>{u.filename} ({u.row_count} contacts)</option>))}
              </Select>
            </Card>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button 
              disabled={!canDryRun} 
              loading={loadingDryRun} 
              onClick={doDryRun} 
              className="disabled:opacity-50 w-full sm:w-auto"
            >
              Preview (Dry Run)
            </Button>
            <PrimaryButton 
              disabled={!canDryRun || !googleId || !name.trim()} 
              loading={loadingLaunch} 
              onClick={createAndLaunch} 
              className="disabled:opacity-50 w-full sm:w-auto"
            >
              Launch Campaign
            </PrimaryButton>
          </div>
          {dry.length > 0 && (
            <Section title={`Preview - First ${dry.length} emails`}>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {dry.map((r: any) => (
                  <div key={r.contact_id} className="border-b pb-3 last:border-b-0">
                    <div className="text-sm text-gray-500 mb-1">To: {r.email}</div>
                    <div className="font-medium mb-2">Subject: {r.subject}</div>
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(r.html) }} />
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}


