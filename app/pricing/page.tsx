import { Card } from '@/components/ui';

export default function PricingPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold">Pricing</h1>
        <p className="text-sm text-gray-600">Simple, transparent plans</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="text-sm font-medium mb-1">Free</div>
          <div className="text-3xl font-semibold mb-4">$0</div>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Create up to 2 templates</li>
            <li>• Upload up to 2 CSV files</li>
            <li>• 50 contacts</li>
            <li>• 100 mails</li>
          </ul>
        </Card>
        <Card className="p-5">
          <div className="text-sm font-medium mb-1">Pro (coming soon)</div>
          <div className="text-3xl font-semibold mb-4">$—</div>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Unlimited templates</li>
            <li>• Unlimited uploads</li>
            <li>• Unlimited contacts</li>
            <li>• Unlimited mails</li>
          </ul>
        </Card>
      </div>

      <Card className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-sm font-medium">Beta users</div>
          <div className="text-sm text-gray-600">Get early access and help shape MailWeaver.</div>
        </div>
        <a href="mailto:hello@farzanfa.com" className="px-3 py-2 border rounded text-sm">Contact hello@farzanfa.com</a>
      </Card>
    </div>
  );
}


