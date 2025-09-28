"use client";
import { useEffect, useMemo, useRef, useState, memo, useCallback } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { Card } from '@/components/ui';

export default function HomeClient() {
  const { data: session, status } = useSession();
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
    const id = setInterval(() => setTaglineIndex((i) => (i + 1) % taglines.length), 3000);
    return () => clearInterval(id);
  }, [taglines.length]);

  const fetchStats = useCallback(async () => {
    try {
      const r = await fetch('/api/public/stats', { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) return;
      targets.current = { campaigns: Number(j.campaigns || 0), contacts: Number(j.contacts || 0), deliverability: Number(j.deliverability || 98) };
    } catch {}
  }, []);

  useEffect(() => {
    let active = true;
    let raf = 0;
    
    const animate = (start: number) => {
      const duration = 2000;
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
      const animateFrame = (t: number) => {
        if (!active) return;
        const p = Math.min(1, (t - start) / duration);
        const easedP = easeOut(p);
        setCounts({
          campaigns: Math.round(targets.current.campaigns * easedP),
          contacts: Math.round(targets.current.contacts * easedP),
          deliverability: Math.round(targets.current.deliverability * easedP),
        });
        if (p < 1) raf = requestAnimationFrame(animateFrame);
      };
      raf = requestAnimationFrame(animateFrame);
    };

    fetchStats().then(() => {
      if (active) {
        animate(performance.now());
      }
    });

    return () => { 
      active = false; 
      if (raf) cancelAnimationFrame(raf);
    };
  }, [fetchStats]);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-20">
      <section className="text-center space-y-6 animate-fadeIn">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium shadow-lg">
          ✨ MailWeaver
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
          Bulk email campaigns,<br />
          <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">simplified</span>
        </h1>
        <div className="relative h-8">
          <p className="absolute inset-0 text-gray-600 text-lg sm:text-xl transition-all duration-500 ease-in-out"
             style={{ 
               opacity: taglineIndex === 0 ? 1 : 0,
               transform: taglineIndex === 0 ? 'translateY(0)' : 'translateY(10px)'
             }}>
            {taglines[0]}
          </p>
          <p className="absolute inset-0 text-gray-600 text-lg sm:text-xl transition-all duration-500 ease-in-out"
             style={{ 
               opacity: taglineIndex === 1 ? 1 : 0,
               transform: taglineIndex === 1 ? 'translateY(0)' : 'translateY(10px)'
             }}>
            {taglines[1]}
          </p>
          <p className="absolute inset-0 text-gray-600 text-lg sm:text-xl transition-all duration-500 ease-in-out"
             style={{ 
               opacity: taglineIndex === 2 ? 1 : 0,
               transform: taglineIndex === 2 ? 'translateY(0)' : 'translateY(10px)'
             }}>
            {taglines[2]}
          </p>
          <p className="absolute inset-0 text-gray-600 text-lg sm:text-xl transition-all duration-500 ease-in-out"
             style={{ 
               opacity: taglineIndex === 3 ? 1 : 0,
               transform: taglineIndex === 3 ? 'translateY(0)' : 'translateY(10px)'
             }}>
            {taglines[3]}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          {status === 'loading' ? (
            <div className="px-6 py-3 rounded-lg bg-gray-100">
              <div className="h-5 w-5 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin"></div>
            </div>
          ) : session?.user ? (
            <a href="/dashboard" className="group px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
              Go to Dashboard 
              <span className="inline-block ml-1 transition-transform group-hover:translate-x-1">→</span>
            </a>
          ) : (
            <button 
              className="group px-6 py-3 rounded-lg bg-white border border-gray-300 hover:border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-3"
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                  <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                  <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                  <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                </g>
              </svg>
              Sign in with Google
            </button>
          )}
          <a href="/about" className="text-gray-600 hover:text-gray-900 underline underline-offset-4 transition-colors">
            Learn more
          </a>
        </div>
      </section>

      <section className="animate-fadeIn" style={{ animationDelay: '0.2s' }}>
        <div className="text-center text-sm font-medium text-gray-500 mb-6">Trusted by teams using</div>
        <div className="overflow-hidden marquee marquee-mask">
          <div className="marquee-track">
            {['Notion','Figma','Linear','Vercel','Netlify','Next.js','Zapier','Framer','Supabase'].map((b) => (
              <span key={b} className="inline-flex items-center px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-700 bg-white shadow-sm hover:shadow-md transition-shadow mx-2">{b}</span>
            ))}
            {['Notion','Figma','Linear','Vercel','Netlify','Next.js','Zapier','Framer','Supabase'].map((b) => (
              <span key={`${b}-dup`} className="inline-flex items-center px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-700 bg-white shadow-sm hover:shadow-md transition-shadow mx-2">{b}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
        <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 group hover:scale-105 bg-gradient-to-br from-white to-purple-50 border-purple-200">
          <div className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent tabular-nums">
            {counts.campaigns.toLocaleString()}
          </div>
          <div className="text-sm font-medium text-gray-600 mt-2">Campaigns sent</div>
          <div className="h-1 w-16 bg-gradient-to-r from-purple-600 to-blue-600 mx-auto mt-4 rounded-full group-hover:w-24 transition-all duration-300"></div>
        </Card>
        <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 group hover:scale-105 bg-gradient-to-br from-white to-blue-50 border-blue-200">
          <div className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent tabular-nums">
            {counts.contacts.toLocaleString()}
          </div>
          <div className="text-sm font-medium text-gray-600 mt-2">Contacts managed</div>
          <div className="h-1 w-16 bg-gradient-to-r from-blue-600 to-cyan-600 mx-auto mt-4 rounded-full group-hover:w-24 transition-all duration-300"></div>
        </Card>
        <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 group hover:scale-105 bg-gradient-to-br from-white to-green-50 border-green-200">
          <div className="text-6xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent tabular-nums">
            {counts.deliverability}%
          </div>
          <div className="text-sm font-medium text-gray-600 mt-2">Avg. deliverability</div>
          <div className="h-1 w-16 bg-gradient-to-r from-green-600 to-emerald-600 mx-auto mt-4 rounded-full group-hover:w-24 transition-all duration-300"></div>
        </Card>
      </section>

      <section className="animate-fadeIn" style={{ animationDelay: '0.6s' }}>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">What our users say</h2>
          <p className="text-gray-600 mt-2">Real feedback from real teams</p>
        </div>
        <Card className="p-8 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
          <div className="relative">
            <svg className="absolute -top-2 -left-2 w-8 h-8 text-purple-400 opacity-20" fill="currentColor" viewBox="0 0 32 32">
              <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z"/>
            </svg>
            <div className="relative z-10">
              <div className="text-xl text-gray-700 leading-relaxed italic">
                {testimonials[ti].quote}
              </div>
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm font-medium text-gray-900">
                  — {testimonials[ti].name}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    aria-label="Previous testimonial" 
                    className="p-2 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                    onClick={() => setTi((ti - 1 + testimonials.length) % testimonials.length)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="flex gap-1">
                    {testimonials.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          i === ti ? 'w-6 bg-purple-600' : 'w-1.5 bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <button 
                    aria-label="Next testimonial" 
                    className="p-2 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                    onClick={() => setTi((ti + 1) % testimonials.length)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="animate-fadeIn" style={{ animationDelay: '0.8s' }}>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Frequently asked questions</h2>
          <p className="text-gray-600 mt-2">Everything you need to know to get started</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 hover:shadow-lg transition-all duration-300">
            <details className="group">
              <summary className="cursor-pointer font-medium text-gray-900 flex items-center justify-between">
                Do I need a Google account?
                <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="text-gray-600 mt-3 leading-relaxed">
                Yes. MailWeaver uses Google OAuth to send campaigns from your own account, ensuring better deliverability and compliance.
              </p>
            </details>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-all duration-300">
            <details className="group">
              <summary className="cursor-pointer font-medium text-gray-900 flex items-center justify-between">
                What permissions do you request?
                <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="text-gray-600 mt-3 leading-relaxed">
                Only the minimum required: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">openid</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">email</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">profile</code>, and <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">gmail.send</code>.
              </p>
            </details>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-all duration-300">
            <details className="group">
              <summary className="cursor-pointer font-medium text-gray-900 flex items-center justify-between">
                Can I personalize emails?
                <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="text-gray-600 mt-3 leading-relaxed">
                Yes! Use variables like <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">{`{{ first_name }}`}</code> in your templates. They'll be automatically populated from your CSV data.
              </p>
            </details>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-all duration-300">
            <details className="group">
              <summary className="cursor-pointer font-medium text-gray-900 flex items-center justify-between">
                How do unsubscribes work?
                <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="text-gray-600 mt-3 leading-relaxed">
                Every campaign includes a secure unsubscribe link. When clicked, contacts are automatically removed from future sends.
              </p>
            </details>
          </Card>
        </div>
      </section>


    </div>
  );
}


