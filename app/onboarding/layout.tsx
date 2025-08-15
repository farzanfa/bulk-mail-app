import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Complete Your Profile - MailWeaver',
  description: 'Tell us about yourself to personalize your MailWeaver experience',
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
