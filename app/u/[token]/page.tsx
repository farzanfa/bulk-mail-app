import { Card, PrimaryButton } from '@/components/ui';
import Link from 'next/link';

async function unsubscribe(token: string) {
  const res = await fetch(`/api/unsubscribe/${token}`, { method: 'POST' });
  return res.ok;
}

export default async function UnsubscribePage({ params }: { params: { token: string } }) {
  const ok = await unsubscribe(params.token);
  return (
    <div className="max-w-md mx-auto mt-24">
      <Card className="p-6 text-center">
        <h1 className="text-xl font-semibold">Unsubscribe</h1>
        <p className="mt-2">{ok ? 'You have been unsubscribed.' : 'Invalid or expired link.'}</p>
        <Link href="/" className="inline-block mt-4 text-sm text-blue-600">Return to site</Link>
      </Card>
    </div>
  );
}


