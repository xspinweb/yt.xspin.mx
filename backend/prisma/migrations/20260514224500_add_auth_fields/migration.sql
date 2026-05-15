-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE', 'EMAIL');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "users"
  ADD COLUMN "name" TEXT,
  ADD COLUMN "passwordHash" TEXT,
  ADD COLUMN "googleId" TEXT,
  ADD COLUMN "avatarUrl" TEXT,
  ADD COLUMN "provider" "AuthProvider" NOT NULL DEFAULT 'EMAIL',
  ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER',
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

UPDATE "users"
SET "name" = "displayName"
WHERE "name" IS NULL;

ALTER TABLE "users"
  ALTER COLUMN "name" SET NOT NULL,
  ALTER COLUMN "displayName" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
