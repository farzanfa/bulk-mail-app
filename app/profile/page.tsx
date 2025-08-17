import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import ProfileDetails from '@/components/profile/ProfileDetails';
import PlanDetails from '@/components/profile/PlanDetails';
import UpgradeSection from '@/components/profile/UpgradeSection';

export const metadata: Metadata = {
  title: 'Profile | Email Campaign Manager',
  description: 'Manage your profile, subscription, and account settings',
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-2 text-gray-600">Manage your account settings and subscription</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Details - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <ProfileDetails userEmail={session.user.email} />
          </div>

          {/* Plan Details - Takes 1 column on large screens */}
          <div className="lg:col-span-1">
            <PlanDetails userEmail={session.user.email} />
          </div>

          {/* Upgrade Section - Full width */}
          <div className="lg:col-span-3">
            <UpgradeSection userEmail={session.user.email} />
          </div>
        </div>
      </div>
    </div>
  );
}