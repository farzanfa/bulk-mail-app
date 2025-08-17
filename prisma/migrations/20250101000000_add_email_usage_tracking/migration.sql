-- CreateTable
CREATE TABLE "email_usage" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "emails_sent" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_usage_user_id_year_month_key" ON "email_usage"("user_id", "year", "month");

-- CreateIndex
CREATE INDEX "email_usage_user_id_idx" ON "email_usage"("user_id");

-- AddForeignKey
ALTER TABLE "email_usage" ADD CONSTRAINT "email_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;