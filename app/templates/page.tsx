import { Metadata } from 'next';
import TemplatesClient from './TemplatesClient';

export const metadata: Metadata = {
  title: 'Email Templates',
  description: 'Browse and customize professional email templates for your campaigns. Create beautiful, responsive emails with MailWeaver.',
  openGraph: {
    title: 'Email Templates - MailWeaver',
    description: 'Professional email templates for your marketing campaigns. Customize and send beautiful emails.',
  },
};

export default function TemplatesPage() {
  return <TemplatesClient />;
}