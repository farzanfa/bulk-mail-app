-- Drop payment-related columns from user_subscriptions if they exist
ALTER TABLE "user_subscriptions" 
DROP COLUMN IF EXISTS "razorpay_customer_id",
DROP COLUMN IF EXISTS "razorpay_subscription_id",
DROP COLUMN IF EXISTS "stripe_customer_id",
DROP COLUMN IF EXISTS "stripe_subscription_id",
DROP COLUMN IF EXISTS "payment_gateway";

-- Drop the payments table if it exists
DROP TABLE IF EXISTS "payments";

-- Remove any payment-related indexes that might exist
DROP INDEX IF EXISTS "user_subscriptions_razorpay_customer_id_key";
DROP INDEX IF EXISTS "user_subscriptions_razorpay_subscription_id_key";
DROP INDEX IF EXISTS "user_subscriptions_stripe_customer_id_key";
DROP INDEX IF EXISTS "user_subscriptions_stripe_subscription_id_key";
DROP INDEX IF EXISTS "payments_razorpay_order_id_key";
DROP INDEX IF EXISTS "payments_razorpay_payment_id_key";
DROP INDEX IF EXISTS "payments_stripe_payment_intent_id_key";
DROP INDEX IF EXISTS "payments_razorpay_order_id_idx";
DROP INDEX IF EXISTS "payments_subscription_id_idx";