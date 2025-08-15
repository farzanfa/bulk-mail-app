"use client";
import { Card } from '@/components/ui';
import { signIn } from 'next-auth/react';

export default function PricingPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-black text-white">MailWeaver</div>
        <h1 className="text-2xl sm:text-3xl font-semibold">Pricing</h1>
        <p className="text-sm text-gray-600">Simple, transparent plans — cancel anytime</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Free plan */}
        <Card className="p-5 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-yellow-100 blur-2xl opacity-60" />
          <div className="text-sm font-medium mb-1">Free</div>
          <div className="text-3xl font-semibold">$0<span className="text-base font-normal text-gray-600">/mo</span></div>
          <div className="text-xs text-gray-500 mb-3">Billed monthly</div>
          <ul className="text-sm text-gray-700 space-y-1 mb-3">
            <li>✓ Create up to 2 templates</li>
            <li>✓ Upload up to 2 CSV files</li>
            <li>✓ 50 contacts</li>
            <li>✓ 100 mails</li>
          </ul>
          <button className="px-3 py-2 border rounded text-sm" onClick={() => signIn('google', { callbackUrl: '/dashboard' })}>Get started for free</button>
        </Card>

        {/* Pro plan */}
        <Card className="p-5 relative border-2 border-black">
          <div className="absolute top-3 right-3 text-[10px] rounded-full bg-black text-white px-2 py-0.5">Coming soon</div>
          <div className="text-sm font-medium mb-1">Pro</div>
          <div className="text-3xl font-semibold">$—<span className="text-base font-normal text-gray-600">/mo</span></div>
          <div className="text-xs text-gray-500 mb-3">Billed monthly</div>
          <ul className="text-sm text-gray-700 space-y-1 mb-3">
            <li>✓ Unlimited templates</li>
            <li>✓ Unlimited uploads</li>
            <li>✓ Unlimited contacts</li>
            <li>✓ Unlimited mails</li>
          </ul>
          <a href="mailto:hello@farzanfa.com?subject=Pro%20waitlist" className="px-3 py-2 border rounded text-sm">Join waitlist</a>
        </Card>
      </div>

      {/* Beta horizontal card */}
      <Card className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-sm font-medium">Beta users</div>
          <div className="text-sm text-gray-600">Get early access and help shape MailWeaver.</div>
        </div>
        <a href="mailto:hello@farzanfa.com" className="px-3 py-2 border rounded text-sm">Contact hello@farzanfa.com</a>
      </Card>

      {/* Small note */}
      <div className="text-xs text-gray-500 text-center">Subject to fair use to protect deliverability. See <a href="/terms" className="underline">Terms</a>.</div>
    </div>
  );
}


