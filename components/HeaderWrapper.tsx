import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import Header from './Header';

export default async function HeaderWrapper() {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  const isAdmin = userEmail ? isAdminEmail(userEmail) : false;
  
  return <Header isAdmin={isAdmin} />;
}
