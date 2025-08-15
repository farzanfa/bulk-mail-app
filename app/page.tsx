import HomeClient from './home/HomeClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';

export default async function RootHome() {
  const session = await getServerSession(authOptions);
  
  // Check if user needs onboarding
  if (session?.user) {
    const userId = (session as any).user.id;
    if (userId) {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { onboarding_completed_at: true }
      });
      
      if (!user?.onboarding_completed_at) {
        redirect('/onboarding');
      }
    }
  }
  
  return <HomeClient />;
}


