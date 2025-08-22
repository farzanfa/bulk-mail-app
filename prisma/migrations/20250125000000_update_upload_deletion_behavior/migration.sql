-- Update campaigns foreign key to SET NULL instead of CASCADE
ALTER TABLE "campaigns" DROP CONSTRAINT IF EXISTS "campaigns_upload_id_fkey";
ALTER TABLE "campaigns" ALTER COLUMN "upload_id" DROP NOT NULL;
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "uploads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Ensure contacts foreign key is CASCADE (should already be, but making sure)
ALTER TABLE "contacts" DROP CONSTRAINT IF EXISTS "contacts_upload_id_fkey";
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;