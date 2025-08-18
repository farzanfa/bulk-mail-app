'use client';

import { useState } from 'react';
import { useRazorpay } from 'react-razorpay';
import { toast } from 'sonner';

interface RazorpayButtonProps {
  planId: string;
  planName: string;
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  onSuccess?: () => void;
  onError?: (error: any) => void;
  className?: string;
  children?: React.ReactNode;
}

export function RazorpayButton({
  planId,
  planName,
  billingCycle,
  amount,
  onSuccess,
  onError,
  className = '',
  children,
}: RazorpayButtonProps) {
  const { error, isLoading, Razorpay } = useRazorpay();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    try {
      setIsProcessing(true);

      // Create order
      const response = await fetch('/api/payment/razorpay/create-order', {
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
        throw new Error(error.error || 'Failed to create order');
      }

      const orderData = await response.json();

      // Initialize Razorpay
      const rzp = new Razorpay({
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: orderData.name,
        description: orderData.description,
        order_id: orderData.orderId,
        prefill: orderData.prefill,
        theme: orderData.theme,
        handler: async (response: any) => {
          // Verify payment
          try {
            const verifyResponse = await fetch('/api/payment/razorpay/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verifyResponse.ok) {
              const error = await verifyResponse.json();
              throw new Error(error.error || 'Payment verification failed');
            }

            const result = await verifyResponse.json();
            toast.success('Payment successful! Your subscription is now active.');
            onSuccess?.();
          } catch (error: any) {
            console.error('Payment verification error:', error);
            toast.error(error.message || 'Payment verification failed');
            onError?.(error);
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast.info('Payment cancelled');
          },
        },
      });

      rzp.open();
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to initiate payment');
      onError?.(error);
      setIsProcessing(false);
    }
  };

  if (error) {
    console.error('Razorpay error:', error);
    return (
      <div className="text-red-500 text-sm">
        Payment system unavailable. Please try again later.
      </div>
    );
  }

  return (
    <button
      onClick={handlePayment}
      disabled={isLoading || isProcessing}
      className={`${className} ${
        isLoading || isProcessing ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {isProcessing ? 'Processing...' : children || `Subscribe for ₹${amount}`}
    </button>
  );
}