import { Card } from '@/components/ui';

export const dynamic = 'force-static';
export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Card className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Privacy Policy</h1>
        <p className="text-gray-700">We respect your privacy. We store only what is needed to operate the app and send emails you authorize.</p>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li>Sign-in is via Google. The access you grant is limited to sending email on your behalf.</li>
          <li>Tokens and sensitive data are stored securely and never shared with third parties.</li>
          <li>You can revoke access anytime from your Google account settings.</li>
          <li>Uploaded CSV files and recipient data are under your control; you may delete them at any time.</li>
        </ul>
        <div className="text-xs text-gray-500">Last updated: Aug 2025</div>
      </Card>
    </div>
  );
}



