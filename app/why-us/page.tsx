import { Card, Section } from '@/components/ui';

export default function WhyUsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold">Why teams choose MailWeaver</h1>
        <p className="text-sm text-gray-600">Built for fast, reliable, personalized campaigns</p>
      </div>

      <Section title="How it works">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-sm font-medium mb-1">1. Upload your CSV</div>
            <p className="text-sm text-gray-600">Import contacts with automatic header detection and de-duplication.</p>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-medium mb-1">2. Create a template</div>
            <p className="text-sm text-gray-600">Use variables like {`{{ first_name }}`} for personalized subjects and bodies.</p>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-medium mb-1">3. Launch and monitor</div>
            <p className="text-sm text-gray-600">Send via Gmail with built-in rate limiting and live progress.</p>
          </Card>
        </div>
      </Section>

      <Section title="Why teams choose MailWeaver">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-sm font-medium mb-1">Gmail-native sending</div>
            <p className="text-sm text-gray-600">Authenticate with Google and send via Gmail API for reliable deliverability.</p>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-medium mb-1">Personalization at scale</div>
            <p className="text-sm text-gray-600">Liquid-style variables and dry-run previews prevent merge mistakes.</p>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-medium mb-1">Robust CSV ingestion</div>
            <p className="text-sm text-gray-600">Header normalization, trimming, de-duplication, and safe upserts.</p>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-medium mb-1">Safe sending</div>
            <p className="text-sm text-gray-600">Token bucket rate limiting and backoff to respect provider limits.</p>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-medium mb-1">Unsubscribe built-in</div>
            <p className="text-sm text-gray-600">HMAC-protected links keep you compliant with one click.</p>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-medium mb-1">Modern UI</div>
            <p className="text-sm text-gray-600">Responsive, Mailchimp-inspired design with fast modals and cards.</p>
          </Card>
        </div>
      </Section>

      <Section title="Use cases">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-sm font-medium mb-1">Product launches</div>
            <p className="text-sm text-gray-600">Announce new features to your entire customer base safely.</p>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-medium mb-1">Newsletters</div>
            <p className="text-sm text-gray-600">Send personalized newsletters using CSV fields without code.</p>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-medium mb-1">Event invites</div>
            <p className="text-sm text-gray-600">Invite segmented contacts and track sending progress.</p>
          </Card>
        </div>
      </Section>
    </div>
  );
}


