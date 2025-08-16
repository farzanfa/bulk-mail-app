import { Metadata } from 'next';
import PricingClient from './PricingClient';

export const metadata: Metadata = {
  title: 'Pricing Plans',
  description: 'Simple, transparent pricing for MailWeaver. Start free and scale as you grow. All plans include secure Gmail integration.',
  openGraph: {
    title: 'Pricing Plans - MailWeaver',
    description: 'Simple, transparent pricing. Start free and scale as you grow with our email marketing platform.',
  },
};

export default function PricingPage() {
  return <PricingClient />;
}