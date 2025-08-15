"use client";
import { Card, Section } from '@/components/ui';
import { signIn } from 'next-auth/react';

export default function WhyUsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-black text-white">MailWeaver</div>
        <h1 className="text-2xl sm:text-3xl font-semibold">Why teams choose MailWeaver</h1>
        <p className="text-sm text-gray-600">Built for fast, reliable, personalized campaigns</p>
      </div>

      <Section title="How it works">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 hover:lift">
            <div className="text-sm font-medium mb-1">1. Upload your CSV</div>
            <p className="text-sm text-gray-600">Import contacts with automatic header detection and de-duplication.</p>
          </Card>
          <Card className="p-4 hover:lift">
            <div className="text-sm font-medium mb-1">2. Create a template</div>
            <p className="text-sm text-gray-600">Add personalized fields for subjects and bodies, then preview before sending.</p>
          </Card>
          <Card className="p-4 hover:lift">
            <div className="text-sm font-medium mb-1">3. Launch and monitor</div>
            <p className="text-sm text-gray-600">Send with built-in pacing and live progress.</p>
          </Card>
        </div>
      </Section>

      <Section title="Why teams choose MailWeaver">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-4 hover:lift">
            <div className="text-sm font-medium mb-1">Google sign-in</div>
            <p className="text-sm text-gray-600">Authenticate with Google and send from your account for reliable delivery.</p>
          </Card>
          <Card className="p-4 hover:lift">
            <div className="text-sm font-medium mb-1">Personalization at scale</div>
            <p className="text-sm text-gray-600">Flexible placeholders with previews help prevent mistakes.</p>
          </Card>
          <Card className="p-4 hover:lift">
            <div className="text-sm font-medium mb-1">Reliable CSV import</div>
            <p className="text-sm text-gray-600">Cleans your data and maps columns automatically.</p>
          </Card>
          <Card className="p-4 hover:lift">
            <div className="text-sm font-medium mb-1">Safe sending</div>
            <p className="text-sm text-gray-600">Smart pacing to respect provider limits.</p>
          </Card>
          <Card className="p-4 hover:lift">
            <div className="text-sm font-medium mb-1">Unsubscribe built-in</div>
            <p className="text-sm text-gray-600">Secure unsubscribe links keep you compliant with one click.</p>
          </Card>
          <Card className="p-4 hover:lift">
            <div className="text-sm font-medium mb-1">Modern UI</div>
            <p className="text-sm text-gray-600">Responsive, polished interface with fast modals and cards.</p>
          </Card>
        </div>
      </Section>

      <Section title="Use cases">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 hover:lift">
            <div className="text-sm font-medium mb-1">Product launches</div>
            <p className="text-sm text-gray-600">Announce new features to your entire customer base safely.</p>
          </Card>
          <Card className="p-4 hover:lift">
            <div className="text-sm font-medium mb-1">Newsletters</div>
            <p className="text-sm text-gray-600">Send personalized newsletters using CSV fields without code.</p>
          </Card>
          <Card className="p-4 hover:lift">
            <div className="text-sm font-medium mb-1">Event invites</div>
            <p className="text-sm text-gray-600">Invite segmented contacts and track sending progress.</p>
          </Card>
        </div>
      </Section>

      <Card className="p-6 text-center bg-gradient-to-r from-yellow-200 to-yellow-100">
        <h3 className="text-lg font-semibold">Ready to try MailWeaver?</h3>
        <p className="text-sm text-gray-700 mt-1">Sign in securely with Google and launch a test campaign in minutes.</p>
        <div className="mt-3 flex items-center justify-center gap-3">
          <button className="border px-4 py-2 rounded text-sm bg-white" onClick={() => signIn('google', { callbackUrl: '/dashboard' })}>Sign in with Google</button>
          <a href="/pricing" className="text-sm underline">See pricing</a>
        </div>
      </Card>
    </div>
  );
}


