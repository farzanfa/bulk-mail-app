-- DropIndex
DROP INDEX IF EXISTS "user_subscriptions_stripe_customer_id_key";
DROP INDEX IF EXISTS "user_subscriptions_stripe_subscription_id_key";

-- AlterTable
ALTER TABLE "user_subscriptions" DROP COLUMN IF EXISTS "stripe_customer_id";
ALTER TABLE "user_subscriptions" DROP COLUMN IF EXISTS "stripe_subscription_id";
ALTER TABLE "user_subscriptions" ADD COLUMN IF NOT EXISTS "razorpay_customer_id" TEXT;
ALTER TABLE "user_subscriptions" ADD COLUMN IF NOT EXISTS "razorpay_subscription_id" TEXT;
ALTER TABLE "user_subscriptions" ADD COLUMN IF NOT EXISTS "payment_gateway" TEXT DEFAULT 'razorpay';

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "user_subscriptions_razorpay_customer_id_key" ON "user_subscriptions"("razorpay_customer_id");
CREATE UNIQUE INDEX IF NOT EXISTS "user_subscriptions_razorpay_subscription_id_key" ON "user_subscriptions"("razorpay_subscription_id");

-- Note: The payments table will be created in a future migration with only Razorpay fields