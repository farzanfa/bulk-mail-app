import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import SubscriptionClient from './SubscriptionClient';

export const metadata: Metadata = {
  title: 'Manage Subscription | Email Campaign Manager',
  description: 'Manage your subscription, billing, and payment methods',
};

export default async function SubscriptionPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/login');
  }

  return <SubscriptionClient userEmail={session.user.email} />;
}