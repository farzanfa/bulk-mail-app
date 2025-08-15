import HomeClient from './home/HomeClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function RootHome() {
  const session = await getServerSession(authOptions);
  const needs = (session as any)?.user?.needsOnboarding;
  if (needs) redirect('/onboarding');
  return <HomeClient />;
}


