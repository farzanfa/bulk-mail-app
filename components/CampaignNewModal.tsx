"use client";
import { useEffect, useMemo, useState } from 'react';
import { Section, Input, Button, PrimaryButton, Card } from '@/components/ui';
import { sanitizeHtml } from '@/lib/sanitize';

export function CampaignNewModal({ onClose }: { onClose: () => void }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-card w-full max-w-3xl">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-semibold">New Campaign</div>
          <button aria-label="Close" className="p-2" onClick={onClose}>✕</button>
        </div>
        <div className="p-4 space-y-4 max-h-[80vh] overflow-auto">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="text-sm text-gray-500 mb-1">Campaign name</div>
              <input className="border rounded w-full p-2" placeholder="Spring promo" value={name} onChange={(e)=>setName(e.target.value)} />
            </Card>
            <Card className="p-4">
              <div className="text-sm text-gray-500 mb-1">1) Google Account</div>
              {google.length === 0 ? (
                <div className="text-sm text-gray-600">
                  No Google account connected.{" "}
                  <a href="/api/google/oauth/url?redirect=1" className="text-blue-600">Connect Google</a>
                  {" "}then return here.
                </div>
              ) : google.length === 1 ? (
                <div className="text-sm text-gray-700">Using: {google[0].email}</div>
              ) : (
                <select className="border rounded w-full p-2" value={googleId} onChange={(e) => setGoogleId(e.target.value)}>
                  {google.map((g: any) => (<option key={g.id} value={g.id}>{g.email}</option>))}
                </select>
              )}
              {google.length > 0 && (
                <a href="/api/google/oauth/url?redirect=1" className="text-xs text-blue-600 inline-block mt-2">Connect another</a>
              )}
            </Card>
            <Card className="p-4">
              <div className="text-sm text-gray-500 mb-1">2) Template</div>
              <select className="border rounded w-full p-2" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                <option value="">Select</option>
                {templates.map((t: any) => (<option key={t.id} value={t.id}>{t.name} (v{t.version})</option>))}
              </select>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-gray-500 mb-1">3) Upload</div>
              <select className="border rounded w-full p-2" value={uploadId} onChange={(e) => setUploadId(e.target.value)}>
                <option value="">Select</option>
                {uploads.map((u: any) => (<option key={u.id} value={u.id}>{u.filename} ({u.row_count})</option>))}
              </select>
            </Card>
          </div>
          <div className="flex gap-2">
            <Button disabled={!canDryRun} loading={loadingDryRun} onClick={doDryRun} className="disabled:opacity-50">Dry run</Button>
            <PrimaryButton disabled={!canDryRun || !googleId || !name.trim()} loading={loadingLaunch} onClick={createAndLaunch} className="disabled:opacity-50">Launch</PrimaryButton>
          </div>
          {dry.length > 0 && (
            <Section title="Dry run preview">
              <div className="font-medium mb-2">Dry run preview (first {dry.length})</div>
              <div className="divide-y">
                {dry.map((r: any) => (
                  <div key={r.contact_id} className="py-2">
                    <div className="text-sm text-gray-500">{r.email}</div>
                    <div className="font-medium">{r.subject}</div>
                    <div className="prose" dangerouslySetInnerHTML={{ __html: sanitizeHtml(r.html) }} />
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


