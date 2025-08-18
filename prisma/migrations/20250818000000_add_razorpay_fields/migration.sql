-- AlterTable
ALTER TABLE "user_subscriptions" ADD COLUMN "razorpay_customer_id" TEXT,
ADD COLUMN "razorpay_subscription_id" TEXT,
ADD COLUMN "payment_gateway" TEXT DEFAULT 'stripe';

-- CreateIndex
CREATE UNIQUE INDEX "user_subscriptions_razorpay_customer_id_key" ON "user_subscriptions"("razorpay_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_subscriptions_razorpay_subscription_id_key" ON "user_subscriptions"("razorpay_subscription_id");