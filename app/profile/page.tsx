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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Section with consistent styling */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 animate-fadeInUp">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                My Profile
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your account settings and subscription
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Details - Takes 2 columns on large screens */}
          <div className="lg:col-span-2 animate-fadeInUp" style={{ animationDelay: '50ms' }}>
            <ProfileDetails userEmail={session.user.email} />
          </div>

          {/* Plan Details - Takes 1 column on large screens */}
          <div className="lg:col-span-1 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
            <PlanDetails userEmail={session.user.email} />
          </div>

          {/* Upgrade Section - Full width */}
          <div className="lg:col-span-3 animate-fadeInUp" style={{ animationDelay: '150ms' }}>
            <UpgradeSection userEmail={session.user.email} />
          </div>
        </div>
      </div>
    </div>
  );
}