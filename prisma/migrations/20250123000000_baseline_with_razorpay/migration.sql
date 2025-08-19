-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."CampaignStatus" AS ENUM ('draft', 'running', 'paused', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "public"."RecipientStatus" AS ENUM ('pending', 'sent', 'failed', 'skipped');

-- CreateEnum
CREATE TYPE "public"."TeamRole" AS ENUM ('owner', 'admin', 'member');

-- CreateEnum
CREATE TYPE "public"."PlanType" AS ENUM ('free', 'starter', 'professional', 'enterprise');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('active', 'cancelled', 'expired', 'trialing');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "email_verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "company" TEXT,
    "full_name" TEXT,
    "onboarding_completed_at" TIMESTAMP(3),
    "phone" TEXT,
    "purpose" TEXT,
    "role" TEXT,
    "website" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."google_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "google_user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "refresh_token_encrypted" TEXT NOT NULL,
    "access_token" TEXT,
    "token_expiry" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."templates" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "variables" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."uploads" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "blob_key" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "columns" JSONB NOT NULL,
    "row_count" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contacts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "upload_id" TEXT,
    "email" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "unsubscribed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."campaigns" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "google_account_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "upload_id" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "status" "public"."CampaignStatus" NOT NULL,
    "batch_size" INTEGER NOT NULL DEFAULT 40,
    "per_minute_limit" INTEGER NOT NULL DEFAULT 80,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "name" TEXT NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."campaign_recipients" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "rendered_subject" TEXT,
    "rendered_html" TEXT,
    "rendered_text" TEXT,
    "status" "public"."RecipientStatus" NOT NULL DEFAULT 'pending',
    "gmail_message_id" TEXT,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_attempt_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_verifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_usage" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "emails_sent" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."api_keys" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."team_members" (
    "id" TEXT NOT NULL,
    "team_owner_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "public"."TeamRole" NOT NULL DEFAULT 'member',
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),
    "invite_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."PlanType" NOT NULL,
    "price_monthly" DOUBLE PRECISION NOT NULL,
    "price_yearly" DOUBLE PRECISION NOT NULL,
    "emails_per_month" INTEGER NOT NULL,
    "contacts_limit" INTEGER NOT NULL,
    "templates_limit" INTEGER NOT NULL,
    "campaigns_limit" INTEGER NOT NULL,
    "team_members" INTEGER NOT NULL,
    "custom_branding" BOOLEAN NOT NULL DEFAULT false,
    "priority_support" BOOLEAN NOT NULL DEFAULT false,
    "api_access" BOOLEAN NOT NULL DEFAULT false,
    "advanced_analytics" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" "public"."SubscriptionStatus" NOT NULL,
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "razorpay_customer_id" TEXT,
    "razorpay_subscription_id" TEXT,
    "payment_gateway" TEXT DEFAULT 'razorpay',

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "razorpay_order_id" TEXT,
    "razorpay_payment_id" TEXT,
    "razorpay_signature" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL,
    "payment_method" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "google_accounts_user_id_idx" ON "public"."google_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "google_accounts_user_id_google_user_id_key" ON "public"."google_accounts"("user_id", "google_user_id");

-- CreateIndex
CREATE INDEX "templates_user_id_idx" ON "public"."templates"("user_id");

-- CreateIndex
CREATE INDEX "uploads_user_id_idx" ON "public"."uploads"("user_id");

-- CreateIndex
CREATE INDEX "contacts_user_id_idx" ON "public"."contacts"("user_id");

-- CreateIndex
CREATE INDEX "contacts_upload_id_idx" ON "public"."contacts"("upload_id");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_user_id_email_key" ON "public"."contacts"("user_id", "email");

-- CreateIndex
CREATE INDEX "campaigns_user_id_idx" ON "public"."campaigns"("user_id");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "public"."campaigns"("status");

-- CreateIndex
CREATE INDEX "campaign_recipients_campaign_id_idx" ON "public"."campaign_recipients"("campaign_id");

-- CreateIndex
CREATE INDEX "campaign_recipients_contact_id_idx" ON "public"."campaign_recipients"("contact_id");

-- CreateIndex
CREATE INDEX "campaign_recipients_campaign_id_status_idx" ON "public"."campaign_recipients"("campaign_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_recipients_campaign_id_contact_id_key" ON "public"."campaign_recipients"("campaign_id", "contact_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "public"."audit_logs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_verifications_token_key" ON "public"."email_verifications"("token");

-- CreateIndex
CREATE INDEX "email_verifications_user_id_idx" ON "public"."email_verifications"("user_id");

-- CreateIndex
CREATE INDEX "email_usage_user_id_idx" ON "public"."email_usage"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_usage_user_id_year_month_key" ON "public"."email_usage"("user_id", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "public"."api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "api_keys_user_id_idx" ON "public"."api_keys"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_invite_token_key" ON "public"."team_members"("invite_token");

-- CreateIndex
CREATE INDEX "team_members_team_owner_id_idx" ON "public"."team_members"("team_owner_id");

-- CreateIndex
CREATE INDEX "team_members_user_id_idx" ON "public"."team_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_team_owner_id_user_id_key" ON "public"."team_members"("team_owner_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "plans_type_key" ON "public"."plans"("type");

-- CreateIndex
CREATE UNIQUE INDEX "user_subscriptions_user_id_key" ON "public"."user_subscriptions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_subscriptions_razorpay_subscription_id_key" ON "public"."user_subscriptions"("razorpay_subscription_id");

-- CreateIndex
CREATE INDEX "user_subscriptions_user_id_idx" ON "public"."user_subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "user_subscriptions_plan_id_idx" ON "public"."user_subscriptions"("plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_razorpay_order_id_key" ON "public"."payments"("razorpay_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_razorpay_payment_id_key" ON "public"."payments"("razorpay_payment_id");

-- CreateIndex
CREATE INDEX "payments_subscription_id_idx" ON "public"."payments"("subscription_id");

-- CreateIndex
CREATE INDEX "payments_razorpay_order_id_idx" ON "public"."payments"("razorpay_order_id");

-- AddForeignKey
ALTER TABLE "public"."google_accounts" ADD CONSTRAINT "google_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."templates" ADD CONSTRAINT "templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."uploads" ADD CONSTRAINT "uploads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contacts" ADD CONSTRAINT "contacts_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "public"."uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contacts" ADD CONSTRAINT "contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."campaigns" ADD CONSTRAINT "campaigns_google_account_id_fkey" FOREIGN KEY ("google_account_id") REFERENCES "public"."google_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."campaigns" ADD CONSTRAINT "campaigns_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."campaigns" ADD CONSTRAINT "campaigns_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "public"."uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."campaigns" ADD CONSTRAINT "campaigns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."campaign_recipients" ADD CONSTRAINT "campaign_recipients_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."campaign_recipients" ADD CONSTRAINT "campaign_recipients_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."email_verifications" ADD CONSTRAINT "email_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."email_usage" ADD CONSTRAINT "email_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."api_keys" ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."team_members" ADD CONSTRAINT "team_members_team_owner_id_fkey" FOREIGN KEY ("team_owner_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."team_members" ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

