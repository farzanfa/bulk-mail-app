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
      const me = await fetch('/api/me', { cache: 'no-store', credentials: 'include' }).then(r => r.json());
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 mx-auto">
        <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-blue-600 p-6 flex items-center justify-between rounded-t-2xl text-white">
          <div>
            <h2 className="text-2xl font-bold">Create New Campaign</h2>
            <p className="text-purple-100 mt-1">Set up your email marketing campaign</p>
          </div>
          <button 
            aria-label="Close" 
            className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200" 
            onClick={onClose}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-6 modal-content">
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
                <Input 
                  placeholder="e.g., Spring Sale 2024" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <span className="inline-flex items-center gap-2">
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-xs font-semibold">Step 1</span>
                    Google Account
                  </span>
                </label>
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
                <a href="/api/google/oauth/url?redirect=1" className="text-xs text-purple-600 hover:text-purple-700 font-medium inline-block mt-2">+ Connect another account</a>
              )}
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <span className="inline-flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-semibold">Step 2</span>
                  Email Template
                </span>
              </label>
              <Select 
                value={templateId} 
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full border-gray-300 focus:border-purple-500 focus:ring-purple-500"
              >
                <option value="">Select template</option>
                {templates.map((t: any) => (<option key={t.id} value={t.id}>{t.name} (v{t.version})</option>))}
              </Select>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <span className="inline-flex items-center gap-2">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-semibold">Step 3</span>
                  Contact List
                </span>
              </label>
              <Select 
                value={uploadId} 
                onChange={(e) => setUploadId(e.target.value)}
                className="w-full border-gray-300 focus:border-purple-500 focus:ring-purple-500"
              >
                <option value="">Select contact list</option>
                {uploads.map((u: any) => (<option key={u.id} value={u.id}>{u.filename} ({u.row_count} contacts)</option>))}
              </Select>
            </div>
          </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button 
              disabled={!canDryRun} 
              loading={loadingDryRun} 
              onClick={doDryRun} 
              className="disabled:opacity-50 w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-6"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview Emails
            </Button>
            <PrimaryButton 
              disabled={!canDryRun || !googleId || !name.trim()} 
              loading={loadingLaunch} 
              onClick={createAndLaunch} 
              className="disabled:opacity-50 w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 font-medium px-8"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Launch Campaign
            </PrimaryButton>
          </div>
          {dry.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Preview - First {dry.length} emails
              </h3>
              <div className="space-y-4 max-h-96 overflow-y-auto bg-white rounded-lg p-4 border border-gray-200">
                {dry.map((r: any) => (
                  <div key={r.contact_id} className="border-b border-gray-100 pb-4 last:border-b-0">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <span className="font-medium">To:</span>
                      <span className="bg-gray-100 px-2 py-1 rounded">{r.email}</span>
                    </div>
                    <div className="flex items-start gap-2 mb-3">
                      <span className="text-sm font-medium text-gray-600">Subject:</span>
                      <span className="font-semibold text-gray-900">{r.subject}</span>
                    </div>
                    <div className="prose prose-sm max-w-none bg-gray-50 rounded-lg p-4" dangerouslySetInnerHTML={{ __html: sanitizeHtml(r.html) }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


