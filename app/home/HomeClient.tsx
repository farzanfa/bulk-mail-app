"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import { signIn } from 'next-auth/react';
import { Card } from '@/components/ui';

export default function HomeClient() {
  const taglines = useMemo(() => [
    'Create beautiful email campaigns',
    'Personalize at scale with CSV variables',
    'Sign in securely with Google OAuth',
    'Track progress in real-time'
  ], []);
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [counts, setCounts] = useState({ campaigns: 0, contacts: 0, deliverability: 0 });
  const targets = useRef({ campaigns: 0, contacts: 0, deliverability: 98 });

  useEffect(() => {
    const id = setInterval(() => setTaglineIndex((i) => (i + 1) % taglines.length), 2200);
    return () => clearInterval(id);
  }, [taglines.length]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const r = await fetch('/api/public/stats', { cache: 'no-store' });
        const j = await r.json();
        if (!r.ok) return;
        targets.current = { campaigns: Number(j.campaigns || 0), contacts: Number(j.contacts || 0), deliverability: 98 };
      } catch {}
      let raf = 0;
      const start = performance.now();
      const duration = 1400;
      const animate = (t: number) => {
        if (!active) return;
        const p = Math.min(1, (t - start) / duration);
        setCounts({
          campaigns: Math.round(targets.current.campaigns * p),
          contacts: Math.round(targets.current.contacts * p),
          deliverability: Math.round(targets.current.deliverability * p),
        });
        if (p < 1) raf = requestAnimationFrame(animate);
      };
      raf = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(raf);
    })();
    return () => { active = false; };
  }, []);

  const testimonials = useMemo(() => [
    { name: 'Growth Lead, DTC brand', quote: 'We reached 25k subscribers in under an hour. Zero deliverability issues.' },
    { name: 'Founder, SaaS', quote: 'Setup took minutes. Dry‑run caught a bad merge field before we sent to 3,400 users.' },
    { name: 'Lifecycle Marketer', quote: 'Loved the CSV → variables workflow. Non-technical teammates ran campaigns without help.' },
    { name: 'Ops Manager, SMB', quote: 'Pause/Resume and exportable reports made our compliance review painless.' }
  ], []);
  const [ti, setTi] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTi((i) => (i + 1) % testimonials.length), 4000);
    return () => clearInterval(id);
  }, [testimonials.length]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      <section className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-black text-white">MailWeaver</div>
        <h1 className="text-2xl sm:text-3xl font-semibold">Bulk email campaigns, simplified</h1>
        <p className="text-gray-600 text-sm sm:text-base min-h-[1.5rem] transition-all">{taglines[taglineIndex]}</p>
        <div className="flex items-center justify-center gap-3 mt-4">
          <button className="border px-4 py-2 rounded text-sm" onClick={() => signIn('google', { callbackUrl: '/dashboard' })}>Sign in with Google</button>
          <a href="/about" className="text-sm underline">Learn more</a>
        </div>
      </section>

      <section>
        <div className="text-center text-xs text-gray-500 mb-3">Trusted by teams using</div>
        <div className="overflow-hidden marquee marquee-mask">
          <div className="marquee-track">
            {['Notion','Figma','Linear','Vercel','Netlify','Next.js','Zapier'].map((b) => (
              <span key={b} className="px-3 py-1.5 rounded-full border text-xs text-gray-700 bg-white hover:lift">{b}</span>
            ))}
            {['Notion','Figma','Linear','Vercel','Netlify','Next.js','Zapier'].map((b) => (
              <span key={`${b}-dup`} className="px-3 py-1.5 rounded-full border text-xs text-gray-700 bg-white hover:lift">{b}</span>
            ))}
          </div>
        </div>
      </section>

      

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 text-center hover:lift">
          <div className="text-sm text-gray-500">Campaigns sent</div>
          <div className="text-2xl tabular-nums">{counts.campaigns.toLocaleString()}</div>
        </Card>
        <Card className="p-4 text-center hover:lift">
          <div className="text-sm text-gray-500">Contacts managed</div>
          <div className="text-2xl tabular-nums">{counts.contacts.toLocaleString()}</div>
        </Card>
        <Card className="p-4 text-center hover:lift">
          <div className="text-sm text-gray-500">Avg. deliverability</div>
          <div className="text-2xl tabular-nums">{counts.deliverability}%</div>
        </Card>
      </section>

      

      

      <section>
        <Card className="p-5 hover:lift">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <div className="text-sm text-gray-500">What users say</div>
              <div className="text-lg font-medium max-w-xl">“{testimonials[ti].quote}”</div>
              <div className="text-xs text-gray-500 mt-1">— {testimonials[ti].name}</div>
            </div>
            <div className="flex items-center gap-2">
              <button aria-label="Prev" className="px-2 py-1 border rounded text-sm" onClick={() => setTi((ti - 1 + testimonials.length) % testimonials.length)}>Prev</button>
              <button aria-label="Next" className="px-2 py-1 border rounded text-sm" onClick={() => setTi((ti + 1) % testimonials.length)}>Next</button>
            </div>
          </div>
        </Card>
      </section>

      <section>
        <div className="text-center mb-4">
          <h2 className="text-xl font-semibold">FAQs</h2>
        </div>
        <div className="space-y-2">
          <Card className="p-4">
            <details>
              <summary className="cursor-pointer text-sm font-medium">Do I need a Google account?</summary>
              <p className="text-sm text-gray-600 mt-2">Yes. MailWeaver uses Google OAuth to send campaigns from your own account.</p>
            </details>
          </Card>
          <Card className="p-4">
            <details>
              <summary className="cursor-pointer text-sm font-medium">What scopes do you request?</summary>
              <p className="text-sm text-gray-600 mt-2">Only <code>openid</code>, <code>email</code>, <code>profile</code>, and <code>gmail.send</code>.</p>
            </details>
          </Card>
          <Card className="p-4">
            <details>
              <summary className="cursor-pointer text-sm font-medium">Can I personalize emails?</summary>
              <p className="text-sm text-gray-600 mt-2">Yes. Use variables like <code>{`{{ first_name }}`}</code> in subject and HTML; they are populated from your CSV headers.</p>
            </details>
          </Card>
          <Card className="p-4">
            <details>
              <summary className="cursor-pointer text-sm font-medium">Is there an unsubscribe link?</summary>
              <p className="text-sm text-gray-600 mt-2">Every campaign can include an unsubscribe URL with a secure token to respect user preferences.</p>
            </details>
          </Card>
        </div>
      </section>

      
    </div>
  );
}


