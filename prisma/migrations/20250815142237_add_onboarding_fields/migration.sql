-- AlterTable
ALTER TABLE "users" ADD COLUMN     "company" TEXT,
ADD COLUMN     "full_name" TEXT,
ADD COLUMN     "onboarding_completed_at" TIMESTAMP(3),
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "purpose" TEXT,
ADD COLUMN     "role" TEXT,
ADD COLUMN     "website" TEXT;
