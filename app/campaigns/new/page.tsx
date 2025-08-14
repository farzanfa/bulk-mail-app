"use client";
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Section, Input, Button, PrimaryButton, Card } from '@/components/ui';

export default function CampaignNewPage() {
  const [google, setGoogle] = useState<any[]>([]);
  // kept for future but not used in strict Google mode
  const [fromEmail, setFromEmail] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [uploads, setUploads] = useState<any[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [uploadId, setUploadId] = useState('');
  const [googleId, setGoogleId] = useState('');
  const [batchSize, setBatchSize] = useState(40);
  const [perMinute, setPerMinute] = useState(80);
  const [dry, setDry] = useState<any[]>([]);
  const canDryRun = useMemo(() => templateId && uploadId, [templateId, uploadId]);

  useEffect(() => {
    (async () => {
      const me = await fetch('/api/me', { cache: 'no-store' }).then(r => r.json());
      setGoogle(me.googleAccounts || []);
      setFromEmail(me.user?.email || '');
      if (me.googleAccounts && me.googleAccounts.length > 0) setGoogleId(me.googleAccounts[0].id);
      const t = await fetch('/api/templates', { cache: 'no-store' }).then(r => r.json());
      setTemplates(t.templates || []);
      const u = await fetch('/api/uploads', { cache: 'no-store' }).then(r => r.json());
      setUploads(u.uploads || []);
    })();
  }, []);

  async function doDryRun() {
    const res = await fetch('/api/campaigns/dry-run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ template_id: templateId, upload_id: uploadId, limit: 10 }) });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error || 'Dry run failed');
    setDry(json.renders || []);
  }

  async function createAndLaunch() {
    const res = await fetch('/api/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ google_account_id: googleId, template_id: templateId, upload_id: uploadId, filters: {}, batch_size: batchSize, per_minute_limit: perMinute }) });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error || 'Failed');
    const id = json.campaign.id;
    const r = await fetch(`/api/campaigns/${id}/launch`, { method: 'POST' });
    if (!r.ok) return toast.error('Launch failed');
    window.location.href = `/campaigns/${id}`;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold mb-4">New Campaign</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-500 mb-1">1) Google Account</div>
          {google.length === 0 ? (
            <div className="text-sm text-gray-600">
              No Google account connected.{' '}
              <a href="/api/google/oauth/url?redirect=1" className="text-blue-600">Connect Google</a>
              {' '}then return here.
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
        <Card className="p-4">
          <div className="text-sm text-gray-500 mb-1">4) Limits</div>
          <div className="flex gap-2">
            <input type="number" min={1} className="border rounded p-2 w-1/2" value={batchSize} onChange={(e) => setBatchSize(parseInt(e.target.value || '0'))} />
            <input type="number" min={1} className="border rounded p-2 w-1/2" value={perMinute} onChange={(e) => setPerMinute(parseInt(e.target.value || '0'))} />
          </div>
        </Card>
      </div>
      <div className="mt-4 flex gap-2">
        <Button disabled={!canDryRun} onClick={doDryRun} className="disabled:opacity-50">Dry run</Button>
        <PrimaryButton disabled={!canDryRun || !googleId} onClick={createAndLaunch} className="disabled:opacity-50">Launch</PrimaryButton>
      </div>
      {dry.length > 0 && (
        <Section title="Dry run preview">
          <div className="font-medium mb-2">Dry run preview (first {dry.length})</div>
          <div className="divide-y">
            {dry.map((r: any) => (
              <div key={r.contact_id} className="py-2">
                <div className="text-sm text-gray-500">{r.email}</div>
                <div className="font-medium">{r.subject}</div>
                <div className="prose" dangerouslySetInnerHTML={{ __html: r.html }} />
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}



