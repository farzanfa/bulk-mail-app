-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('owner', 'admin', 'member');

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "team_owner_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL DEFAULT 'member',
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),
    "invite_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_members_team_owner_id_user_id_key" ON "team_members"("team_owner_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_invite_token_key" ON "team_members"("invite_token");

-- CreateIndex
CREATE INDEX "team_members_team_owner_id_idx" ON "team_members"("team_owner_id");

-- CreateIndex
CREATE INDEX "team_members_user_id_idx" ON "team_members"("user_id");

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_owner_id_fkey" FOREIGN KEY ("team_owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;