-- Add missing columns to users table if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS purpose TEXT,
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS website TEXT;

-- Create plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL UNIQUE,
    price_monthly DOUBLE PRECISION NOT NULL,
    price_yearly DOUBLE PRECISION NOT NULL,
    emails_per_month INTEGER NOT NULL,
    contacts_limit INTEGER NOT NULL,
    templates_limit INTEGER NOT NULL,
    campaigns_limit INTEGER NOT NULL,
    team_members INTEGER NOT NULL,
    custom_branding BOOLEAN NOT NULL DEFAULT false,
    priority_support BOOLEAN NOT NULL DEFAULT false,
    api_access BOOLEAN NOT NULL DEFAULT false,
    advanced_analytics BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create user_subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    plan_id TEXT NOT NULL,
    status TEXT NOT NULL,
    current_period_start TIMESTAMP(3) NOT NULL,
    current_period_end TIMESTAMP(3) NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    razorpay_customer_id TEXT,
    razorpay_subscription_id TEXT UNIQUE,
    payment_gateway TEXT DEFAULT 'razorpay',
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_plan FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- Create indexes for user_subscriptions
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);

-- Create payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    subscription_id TEXT NOT NULL,
    razorpay_order_id TEXT UNIQUE,
    razorpay_payment_id TEXT UNIQUE,
    razorpay_signature TEXT,
    amount DOUBLE PRECISION NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL,
    payment_method TEXT,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_subscription FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id) ON DELETE CASCADE
);

-- Create indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON payments(razorpay_order_id);

-- Create PlanType enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "PlanType" AS ENUM ('free', 'starter', 'professional', 'enterprise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create SubscriptionStatus enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'cancelled', 'expired', 'trialing');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Insert default plans if they don't exist
INSERT INTO plans (id, name, type, price_monthly, price_yearly, emails_per_month, contacts_limit, templates_limit, campaigns_limit, team_members, custom_branding, priority_support, api_access, advanced_analytics)
VALUES 
    ('free_plan_id', 'Free Plan', 'free', 0, 0, 100, 100, 5, 5, 1, false, false, false, false),
    ('starter_plan_id', 'Starter Plan', 'starter', 29, 290, 5000, 2500, 10, 20, 3, false, false, false, false),
    ('professional_plan_id', 'Professional Plan', 'professional', 75, 750, 25000, 10000, 50, 100, 10, true, true, false, false),
    ('enterprise_plan_id', 'Enterprise Plan', 'enterprise', 100, 1000, 100000, 50000, -1, -1, 50, true, true, true, true)
ON CONFLICT (type) DO NOTHING;