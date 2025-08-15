import { Card } from '@/components/ui';

export const dynamic = 'force-static';
export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Card className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">About MailWeaver</h1>
        <p className="text-gray-700">
          MailWeaver is a modern bulk email platform designed to help you create, upload, and send campaigns reliably at
          scale. It focuses on clear workflows, responsive UI, and sensible defaults so you can move from idea to inbox
          quickly.
        </p>
        <div>
          <h2 className="text-lg font-semibold mb-2">What you can do</h2>
          <ul className="list-disc pl-5 space-y-1 text-gray-700">
            <li>Sign in with your Google account and send campaigns from your account.</li>
            <li>Create reusable templates with variables for personalized emails.</li>
            <li>Upload CSV files and manage recipients grouped by each upload.</li>
            <li>Run campaigns in the background with automatic pacing and retries.</li>
            <li>Track progress and delivery outcomes per campaign.</li>
            <li>Provide one‑click unsubscribe links for compliance and user control.</li>
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">Privacy & safety</h2>
          <p className="text-gray-700">
            We only store the minimum data required to operate the service and deliver your emails. Access to your Google
            account is limited to sending email you explicitly authorize. You can revoke access at any time from your
            Google account settings.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">About the developer</h2>
          <p className="text-gray-700">
            Built and maintained by Farzan Arshad. Learn more or get in touch at{' '}
            <a href="https://www.farzanfa.com" target="_blank" rel="noopener noreferrer" className="underline">www.farzanfa.com</a>.
          </p>
        </div>
        <div className="text-xs text-gray-500">Last updated: Aug 2025</div>
      </Card>
    </div>
  );
}



