'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface RazorpaySubscriptionProps {
  planId: string;
  planName: string;
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  onSuccess?: () => void;
  onError?: (error: any) => void;
  className?: string;
  children?: React.ReactNode;
}

export function RazorpaySubscription({
  planId,
  planName,
  billingCycle,
  amount,
  onSuccess,
  onError,
  className = '',
  children,
}: RazorpaySubscriptionProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscription = async () => {
    try {
      setIsProcessing(true);

      // Create subscription
      const response = await fetch('/api/subscription/razorpay/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          billingCycle,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create subscription');
      }

      const data = await response.json();

      // Redirect to Razorpay subscription page
      if (data.shortUrl) {
        window.location.href = data.shortUrl;
      } else {
        throw new Error('No subscription URL received');
      }

      toast.success('Redirecting to payment page...');
      onSuccess?.();
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast.error(error.message || 'Failed to create subscription');
      onError?.(error);
      setIsProcessing(false);
    }
  };

  return (
    <button
      onClick={handleSubscription}
      disabled={isProcessing}
      className={`${className} ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isProcessing ? 'Processing...' : children || `Subscribe for ₹${amount}/${billingCycle}`}
    </button>
  );
}