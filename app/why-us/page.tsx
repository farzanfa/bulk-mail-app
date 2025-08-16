import { Metadata } from 'next';
import WhyUsClient from './WhyUsClient';

export const metadata: Metadata = {
  title: 'Why Choose MailWeaver',
  description: 'Discover why thousands of marketers choose MailWeaver. Powerful features, seamless Gmail integration, and unbeatable ease of use.',
  openGraph: {
    title: 'Why Choose MailWeaver - Email Marketing Made Simple',
    description: 'Powerful features, seamless Gmail integration, and unbeatable ease of use. See why marketers love MailWeaver.',
  },
};

export default function WhyUsPage() {
  return <WhyUsClient />;
}