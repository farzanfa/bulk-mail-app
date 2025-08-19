"use client";
import { useEffect, useMemo, useState } from 'react';
import { Section, Input, Button, PrimaryButton, Card } from '@/components/ui';
import { sanitizeHtml } from '@/lib/sanitize';

export default function CampaignNewPage() {
  const [google, setGoogle] = useState<any[]>([]);
  // kept for future but not used in strict Google mode
  const [fromEmail, setFromEmail] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [uploads, setUploads] = useState<any[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [uploadId, setUploadId] = useState('');
  const [googleId, setGoogleId] = useState('');
  const [name, setName] = useState('');
  const [dry, setDry] = useState<any[]>([]);
  const [userPlan, setUserPlan] = useState<string>('free');
  const canDryRun = useMemo(() => Boolean(templateId && uploadId), [templateId, uploadId]);

  useEffect(() => {
    (async () => {
      const me = await fetch('/api/me', { cache: 'no-store', credentials: 'include' }).then(r => r.json());
      setGoogle(me.googleAccounts || []);
      setFromEmail(me.user?.email || '');
      if (me.googleAccounts && me.googleAccounts.length > 0) setGoogleId(me.googleAccounts[0].id);
      if (me.user?.plan) {
        setUserPlan(me.user.plan);
      }
      const t = await fetch('/api/templates', { cache: 'no-store' }).then(r => r.json());
      setTemplates(t.templates || []);
      const u = await fetch('/api/uploads', { cache: 'no-store' }).then(r => r.json());
      setUploads(u.uploads || []);
    })();
  }, []);

  const [loadingDryRun, setLoadingDryRun] = useState(false);
  const [loadingLaunch, setLoadingLaunch] = useState(false);

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <a
              href="/campaigns"
              className="inline-flex items-center gap-2 px-4 py-2 text-white/90 hover:text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Campaigns
            </a>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Create New Campaign</h1>
          <p className="text-purple-100 text-lg">Set up and launch your email marketing campaign</p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 -mt-6 pb-12">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
              <input 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors" 
                placeholder="e.g., Spring Sale 2024" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <span className="inline-flex items-center gap-2">
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-xs font-semibold">Step 1</span>
                  Google Account
                </span>
              </label>
              {google.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-.833-2.732-.833-3.732 0L3.34 16c-.77.833.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm text-yellow-800 font-medium">No Google account connected</p>
                      <a href="/api/google/oauth/url?redirect=1" className="text-sm text-purple-600 hover:text-purple-700 font-medium mt-1 inline-block">
                        Connect Google Account →
                      </a>
                    </div>
                  </div>
                </div>
              ) : google.length === 1 ? (
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-green-800 font-medium">Using: {google[0].email}</span>
                </div>
              ) : (
                <select 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors" 
                  value={googleId} 
                  onChange={(e) => setGoogleId(e.target.value)}
                >
                  {google.map((g: any) => (<option key={g.id} value={g.id}>{g.email}</option>))}
                </select>
              )}
              {google.length > 0 && userPlan === 'admin' && (
                <a href="/api/google/oauth/url?redirect=1" className="text-xs text-purple-600 hover:text-purple-700 font-medium inline-block mt-3">
                  + Connect another account
                </a>
              )}
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <span className="inline-flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-semibold">Step 2</span>
                  Email Template
                </span>
              </label>
              <select 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors" 
                value={templateId} 
                onChange={(e) => setTemplateId(e.target.value)}
              >
                <option value="">Select template</option>
                {templates.map((t: any) => (<option key={t.id} value={t.id}>{t.name} (v{t.version})</option>))}
              </select>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <span className="inline-flex items-center gap-2">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-semibold">Step 3</span>
                  Contact List
                </span>
              </label>
              <select 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors" 
                value={uploadId} 
                onChange={(e) => setUploadId(e.target.value)}
              >
                <option value="">Select contact list</option>
                {uploads.map((u: any) => (<option key={u.id} value={u.id}>{u.filename} ({u.row_count} contacts)</option>))}
              </select>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end gap-4">
            <Button 
              disabled={!canDryRun} 
              loading={loadingDryRun} 
              onClick={doDryRun} 
              className="disabled:opacity-50 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-6 py-3"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview Emails
              </span>
            </Button>
            <PrimaryButton 
              disabled={!canDryRun || !googleId || !name.trim()} 
              loading={loadingLaunch} 
              onClick={createAndLaunch} 
              className="disabled:opacity-50 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 font-medium px-8 py-3"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Launch Campaign
              </span>
            </PrimaryButton>
          </div>
        </div>
        
        {dry.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 mt-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              Email Preview
              <span className="text-sm text-gray-500 font-normal">First {dry.length} emails</span>
            </h2>
            <div className="space-y-6 max-h-[600px] overflow-y-auto">
              {dry.map((r: any) => (
                <div key={r.contact_id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-600">To:</span>
                        <span className="bg-white px-3 py-1 rounded-md text-sm text-gray-800 border border-gray-200">{r.email}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 mt-3">
                      <span className="text-sm font-medium text-gray-600">Subject:</span>
                      <span className="font-semibold text-gray-900">{r.subject}</span>
                    </div>
                  </div>
                  <div className="p-6 bg-white">
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(r.html) }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



