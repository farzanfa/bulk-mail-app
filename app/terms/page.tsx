import { Card } from '@/components/ui';

export const dynamic = 'force-static';
export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Card className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Terms & Conditions</h1>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li>Use the service only for lawful, permission‑based email communication.</li>
          <li>You are responsible for the content you send and for honoring unsubscribe requests.</li>
          <li>Do not send spam or unsolicited messages.</li>
          <li>We may update these terms periodically to reflect improvements and legal requirements.</li>
        </ul>
        <div className="text-xs text-gray-500">Last updated: Aug 2025</div>
      </Card>
    </div>
  );
}



