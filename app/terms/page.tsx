import { Card } from '@/components/ui';

export const dynamic = 'force-static';
export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Card className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Terms & Conditions</h1>

        <h2 className="text-lg font-semibold">Acceptable use</h2>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li>Use MailWeaver only for lawful, permission‑based email communications.</li>
          <li>No unsolicited messages, spam, or harassment.</li>
          <li>Honor unsubscribe requests and applicable anti‑spam laws (e.g., CAN‑SPAM, GDPR, local equivalents).</li>
        </ul>

        <h2 className="text-lg font-semibold">Your responsibilities</h2>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li>You control the content of your messages and the recipient lists you upload.</li>
          <li>You must have a lawful basis and consent to contact recipients.</li>
          <li>You will comply with Gmail and Google API policies when using Google integrations.</li>
        </ul>

        <h2 className="text-lg font-semibold">Google policies</h2>
        <p className="text-gray-700">By connecting your Google account, you agree to the applicable Google terms and policies, including:</p>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li><a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline">Google Terms of Service</a></li>
          <li><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">Google Privacy Policy</a></li>
          <li><a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="underline">Google API Services User Data Policy</a></li>
        </ul>

        <h2 className="text-lg font-semibold">Service</h2>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li>We may modify features or discontinue the service with reasonable notice.</li>
          <li>We strive for high availability but provide the service on an “as‑is” basis without warranties.</li>
          <li>We may suspend accounts engaged in abuse, security risk, or policy violations.</li>
        </ul>

        <h2 className="text-lg font-semibold">Liability</h2>
        <p className="text-gray-700">To the maximum extent permitted by law, we are not liable for indirect or consequential damages, loss of profits, or data loss. Our aggregate liability is limited to fees paid for the service during the 3 months preceding the claim (if any).</p>

        <div className="text-xs text-gray-500">Last updated: Aug 2025</div>
      </Card>
    </div>
  );
}



