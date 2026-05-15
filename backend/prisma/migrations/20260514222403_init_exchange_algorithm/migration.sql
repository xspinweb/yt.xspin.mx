-- CreateEnum
CREATE TYPE "ExchangeTaskType" AS ENUM ('VIEW', 'SUBSCRIBE');

-- CreateEnum
CREATE TYPE "ExchangeTaskStatus" AS ENUM ('PENDING', 'ASSIGNED', 'COMPLETED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "UserActionType" AS ENUM ('VIEW', 'SUBSCRIBE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "language" TEXT DEFAULT 'es',
    "niche" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channels" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "youtubeChannelId" TEXT,
    "handle" TEXT,
    "title" TEXT NOT NULL,
    "niche" TEXT,
    "language" TEXT DEFAULT 'es',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "videos" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "youtubeVideoId" TEXT,
    "title" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "durationSec" INTEGER,
    "publishedAt" TIMESTAMP(3),
    "niche" TEXT,
    "language" TEXT DEFAULT 'es',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_actions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actionType" "UserActionType" NOT NULL,
    "targetVideoId" TEXT,
    "targetChannelId" TEXT,
    "isValid" BOOLEAN NOT NULL DEFAULT false,
    "validationData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_tasks" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "type" "ExchangeTaskType" NOT NULL,
    "targetVideoId" TEXT,
    "targetChannelId" TEXT,
    "assignedToUserId" TEXT,
    "status" "ExchangeTaskStatus" NOT NULL DEFAULT 'PENDING',
    "sourceActionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "exchange_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "channels_youtubeChannelId_key" ON "channels"("youtubeChannelId");

-- CreateIndex
CREATE INDEX "channels_ownerUserId_idx" ON "channels"("ownerUserId");

-- CreateIndex
CREATE INDEX "channels_niche_language_idx" ON "channels"("niche", "language");

-- CreateIndex
CREATE UNIQUE INDEX "videos_youtubeVideoId_key" ON "videos"("youtubeVideoId");

-- CreateIndex
CREATE INDEX "videos_channelId_idx" ON "videos"("channelId");

-- CreateIndex
CREATE INDEX "videos_isActive_publishedAt_idx" ON "videos"("isActive", "publishedAt");

-- CreateIndex
CREATE INDEX "videos_niche_language_idx" ON "videos"("niche", "language");

-- CreateIndex
CREATE INDEX "user_actions_userId_actionType_createdAt_idx" ON "user_actions"("userId", "actionType", "createdAt");

-- CreateIndex
CREATE INDEX "user_actions_targetVideoId_actionType_createdAt_idx" ON "user_actions"("targetVideoId", "actionType", "createdAt");

-- CreateIndex
CREATE INDEX "user_actions_targetChannelId_actionType_createdAt_idx" ON "user_actions"("targetChannelId", "actionType", "createdAt");

-- CreateIndex
CREATE INDEX "exchange_tasks_status_type_createdAt_idx" ON "exchange_tasks"("status", "type", "createdAt");

-- CreateIndex
CREATE INDEX "exchange_tasks_ownerUserId_status_idx" ON "exchange_tasks"("ownerUserId", "status");

-- CreateIndex
CREATE INDEX "exchange_tasks_assignedToUserId_status_idx" ON "exchange_tasks"("assignedToUserId", "status");

-- CreateIndex
CREATE INDEX "exchange_tasks_targetVideoId_idx" ON "exchange_tasks"("targetVideoId");

-- CreateIndex
CREATE INDEX "exchange_tasks_targetChannelId_idx" ON "exchange_tasks"("targetChannelId");

-- AddForeignKey
ALTER TABLE "channels" ADD CONSTRAINT "channels_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_actions" ADD CONSTRAINT "user_actions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_actions" ADD CONSTRAINT "user_actions_targetVideoId_fkey" FOREIGN KEY ("targetVideoId") REFERENCES "videos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_actions" ADD CONSTRAINT "user_actions_targetChannelId_fkey" FOREIGN KEY ("targetChannelId") REFERENCES "channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_tasks" ADD CONSTRAINT "exchange_tasks_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_tasks" ADD CONSTRAINT "exchange_tasks_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_tasks" ADD CONSTRAINT "exchange_tasks_targetVideoId_fkey" FOREIGN KEY ("targetVideoId") REFERENCES "videos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_tasks" ADD CONSTRAINT "exchange_tasks_targetChannelId_fkey" FOREIGN KEY ("targetChannelId") REFERENCES "channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_tasks" ADD CONSTRAINT "exchange_tasks_sourceActionId_fkey" FOREIGN KEY ("sourceActionId") REFERENCES "user_actions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
