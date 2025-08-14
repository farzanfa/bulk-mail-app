import { Card } from '@/components/ui';

export const dynamic = 'force-static';
export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Card className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Privacy Policy</h1>

        <p className="text-gray-700">This policy explains what information MailWeaver collects, how we use it, and your choices. We designed MailWeaver to access only the minimum data necessary to send campaigns you initiate.</p>

        <h2 className="text-lg font-semibold">Data we collect</h2>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li>Account information: your Google email and basic profile when you sign in.</li>
          <li>Google tokens: refresh/access tokens required to send email via Gmail on your behalf (stored encrypted at rest).</li>
          <li>Campaign and template content that you create.</li>
          <li>Recipient data that you upload (e.g., CSV columns such as <code>email</code>, <code>first_name</code>).</li>
          <li>Operational logs and metadata for reliability and security.</li>
        </ul>

        <h2 className="text-lg font-semibold">Google and Gmail access</h2>
        <p className="text-gray-700">We use Google OAuth solely to allow you to send email using your Gmail account. We request the following scopes:</p>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li><code>https://www.googleapis.com/auth/gmail.send</code> (send email)</li>
          <li><code>openid</code>, <code>email</code>, <code>profile</code> (sign-in)</li>
        </ul>
        <p className="text-gray-700">Use of Google user data adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="underline">Google API Services User Data Policy</a>, including the <a href="https://developers.google.com/terms/api-services-user-data-policy#limited-use" target="_blank" rel="noopener noreferrer" className="underline">Limited Use</a> requirements.</p>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li>No reading of message content from your mailbox; we only send messages you create.</li>
          <li>No selling or transferring Google user data to third parties, and no use for advertising.</li>
          <li>No human access to Google user data except as required for security, compliance, or to service a specific request.</li>
        </ul>

        <h2 className="text-lg font-semibold">How we use data</h2>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li>To authenticate your account and operate MailWeaver features.</li>
          <li>To render templates with your uploaded variables and send your campaigns via Gmail.</li>
          <li>To provide delivery status, logs, and basic analytics.</li>
        </ul>

        <h2 className="text-lg font-semibold">Retention and deletion</h2>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li>You can disconnect Google at any time in Google Account settings; we will no longer be able to send on your behalf.</li>
          <li>You may delete templates, uploads, contacts, and campaigns from within the app; associated data is removed from our primary systems.</li>
          <li>Backups and logs are retained for a limited period for reliability and security, after which they are purged.</li>
        </ul>

        <h2 className="text-lg font-semibold">Security</h2>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li>Google refresh tokens are encrypted using industry-standard encryption at rest.</li>
          <li>Transport security (HTTPS) is enforced for all network communication.</li>
          <li>Access is least-privilege and audited.</li>
        </ul>

        <h2 className="text-lg font-semibold">Data sharing</h2>
        <p className="text-gray-700">We do not sell your data. Limited sharing occurs with infrastructure providers strictly to operate the service:</p>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li>Hosting and build: Vercel</li>
          <li>Database: Neon (Postgres)</li>
          <li>Key-value store: Upstash</li>
          <li>Blob storage: Vercel Blob</li>
        </ul>
        <p className="text-gray-700">These subprocessors are bound by their own security and privacy commitments.</p>

        <h2 className="text-lg font-semibold">Your choices</h2>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li>Revoke Gmail access at any time from your Google Account permissions.</li>
          <li>Delete uploads, contacts, campaigns, and templates in the app.</li>
          <li>Contact us to request account deletion.</li>
        </ul>

        <div className="text-xs text-gray-500">Last updated: Aug 2025</div>
      </Card>
    </div>
  );
}



