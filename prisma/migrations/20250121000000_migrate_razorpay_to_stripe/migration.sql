-- Step 1: Add new Stripe columns to user_subscriptions
ALTER TABLE "user_subscriptions" 
ADD COLUMN IF NOT EXISTS "stripe_customer_id" TEXT,
ADD COLUMN IF NOT EXISTS "stripe_subscription_id" TEXT;

-- Step 2: Add unique constraints for Stripe columns
CREATE UNIQUE INDEX IF NOT EXISTS "user_subscriptions_stripe_customer_id_key" ON "user_subscriptions"("stripe_customer_id");
CREATE UNIQUE INDEX IF NOT EXISTS "user_subscriptions_stripe_subscription_id_key" ON "user_subscriptions"("stripe_subscription_id");

-- Step 3: Update payment_gateway default value
ALTER TABLE "user_subscriptions" 
ALTER COLUMN "payment_gateway" SET DEFAULT 'stripe';

-- Step 4: Add new column to payments table
ALTER TABLE "payments" 
ADD COLUMN IF NOT EXISTS "stripe_payment_intent_id" TEXT;

-- Step 5: Create unique index for stripe_payment_intent_id
CREATE UNIQUE INDEX IF NOT EXISTS "payments_stripe_payment_intent_id_key" ON "payments"("stripe_payment_intent_id");

-- Step 6: Update currency default for payments
ALTER TABLE "payments" 
ALTER COLUMN "currency" SET DEFAULT 'USD';

-- Step 7: Remove Razorpay-specific indexes (keep the columns for data preservation)
DROP INDEX IF EXISTS "payments_razorpay_order_id_key";
DROP INDEX IF EXISTS "payments_razorpay_payment_id_key";
DROP INDEX IF EXISTS "payments_razorpay_order_id_idx";

-- Step 8: Remove Razorpay unique constraints from user_subscriptions (keep the columns for data preservation)
DROP INDEX IF EXISTS "user_subscriptions_razorpay_customer_id_key";
DROP INDEX IF EXISTS "user_subscriptions_razorpay_subscription_id_key";

-- Note: We're keeping the razorpay columns for now to preserve existing data
-- They can be dropped in a future migration after ensuring all data is migrated