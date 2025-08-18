import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import BillingClient from './BillingClient';

export const metadata: Metadata = {
  title: 'Billing & Subscription - MailApp',
  description: 'Manage your subscription and billing information',
};

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/signin');
  }

  return <BillingClient userEmail={session.user.email || ''} />;
}