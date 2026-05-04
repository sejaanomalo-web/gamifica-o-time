-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('COLABORADOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ATIVA', 'CONCLUIDA', 'NAO_BATIDA', 'AGUARDANDO_VALIDACAO', 'REJEITADA');

-- CreateEnum
CREATE TYPE "RedeemStatus" AS ENUM ('PENDENTE', 'APROVADO', 'ENTREGUE', 'REJEITADO');

-- CreateEnum
CREATE TYPE "DeliveryCategoryGroup" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('CALCULADO', 'PAGO');

-- CreateEnum
CREATE TYPE "CommissionTierReached" AS ENUM ('BASE', 'META_1', 'META_2', 'EXCELENCIA');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('NO_LOGIN', 'NO_GOAL', 'LOW_MOOD');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "area" TEXT,
    "role" "Role" NOT NULL DEFAULT 'COLABORADOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "kpi" TEXT NOT NULL,
    "target" DOUBLE PRECISION NOT NULL,
    "current" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "xpReward" INTEGER NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "GoalStatus" NOT NULL DEFAULT 'ATIVA',
    "needsEvidence" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "approved" BOOLEAN,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconUrl" TEXT NOT NULL,
    "criterion" TEXT NOT NULL,
    "isAuto" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "costXp" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT -1,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ShopItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Redeem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "status" "RedeemStatus" NOT NULL DEFAULT 'PENDENTE',
    "costXp" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Redeem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XpEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "refId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XpEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MuralEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MuralEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoodEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekISO" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MoodEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAlert" (
    "id" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'LOW',
    "status" "AlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "message" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,

    CONSTRAINT "AdminAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WrappedSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "goalsBeaten" INTEGER NOT NULL,
    "totalXp" INTEGER NOT NULL,
    "peakDay" TIMESTAMP(3),
    "peakDayXp" INTEGER NOT NULL DEFAULT 0,
    "rareBadgeId" TEXT,
    "rareBadgePercent" DOUBLE PRECISION,
    "comparisonXpDelta" DOUBLE PRECISION,
    "finalRank" INTEGER,
    "closingPhrase" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WrappedSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryWeight" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "group" "DeliveryCategoryGroup" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryWeight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionTier" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "baseSalary" INTEGER NOT NULL DEFAULT 0,
    "baseMin" INTEGER NOT NULL DEFAULT 0,
    "baseMax" INTEGER NOT NULL,
    "m1Min" INTEGER NOT NULL,
    "m1Max" INTEGER NOT NULL,
    "m2Min" INTEGER NOT NULL,
    "m2Max" INTEGER NOT NULL,
    "excellenceMin" INTEGER NOT NULL,
    "m1BonusPer20" INTEGER NOT NULL,
    "m2BonusPer20" INTEGER NOT NULL,
    "excellenceFixedBonus" INTEGER NOT NULL,
    "excellenceBonusPer10" INTEGER NOT NULL,
    "excellenceBonusStep" INTEGER NOT NULL DEFAULT 10,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Delivery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weightId" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "pointsApplied" DOUBLE PRECISION NOT NULL,
    "deliveredAt" TIMESTAMP(3) NOT NULL,
    "registeredById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Adjustment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deliveryId" TEXT,
    "pointsDeducted" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "reason" TEXT NOT NULL,
    "registeredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Adjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionMonth" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "monthISO" TEXT NOT NULL,
    "grossPoints" DOUBLE PRECISION NOT NULL,
    "adjustmentsTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netPoints" DOUBLE PRECISION NOT NULL,
    "tierReached" "CommissionTierReached" NOT NULL,
    "bonusValue" INTEGER NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'CALCULADO',
    "closedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "paidById" TEXT,
    "tierSnapshot" JSONB NOT NULL,
    "weightsSnapshot" JSONB NOT NULL,

    CONSTRAINT "CommissionMonth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Season_number_key" ON "Season"("number");

-- CreateIndex
CREATE INDEX "Goal_ownerId_status_idx" ON "Goal"("ownerId", "status");

-- CreateIndex
CREATE INDEX "Goal_seasonId_idx" ON "Goal"("seasonId");

-- CreateIndex
CREATE INDEX "Evidence_goalId_idx" ON "Evidence"("goalId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "UserBadge"("userId", "badgeId");

-- CreateIndex
CREATE INDEX "Redeem_userId_idx" ON "Redeem"("userId");

-- CreateIndex
CREATE INDEX "Redeem_status_idx" ON "Redeem"("status");

-- CreateIndex
CREATE INDEX "XpEvent_userId_seasonId_idx" ON "XpEvent"("userId", "seasonId");

-- CreateIndex
CREATE INDEX "MuralEvent_createdAt_idx" ON "MuralEvent"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE INDEX "MoodEntry_weekISO_idx" ON "MoodEntry"("weekISO");

-- CreateIndex
CREATE INDEX "MoodEntry_rating_idx" ON "MoodEntry"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "MoodEntry_userId_weekISO_key" ON "MoodEntry"("userId", "weekISO");

-- CreateIndex
CREATE INDEX "AdminAlert_targetUserId_idx" ON "AdminAlert"("targetUserId");

-- CreateIndex
CREATE INDEX "AdminAlert_status_idx" ON "AdminAlert"("status");

-- CreateIndex
CREATE INDEX "AdminAlert_type_idx" ON "AdminAlert"("type");

-- CreateIndex
CREATE INDEX "WrappedSnapshot_seasonId_idx" ON "WrappedSnapshot"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "WrappedSnapshot_userId_seasonId_key" ON "WrappedSnapshot"("userId", "seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryWeight_category_key" ON "DeliveryWeight"("category");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionTier_userId_key" ON "CommissionTier"("userId");

-- CreateIndex
CREATE INDEX "Delivery_userId_deliveredAt_idx" ON "Delivery"("userId", "deliveredAt");

-- CreateIndex
CREATE INDEX "Adjustment_userId_createdAt_idx" ON "Adjustment"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CommissionMonth_monthISO_idx" ON "CommissionMonth"("monthISO");

-- CreateIndex
CREATE INDEX "CommissionMonth_status_idx" ON "CommissionMonth"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionMonth_userId_monthISO_key" ON "CommissionMonth"("userId", "monthISO");

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redeem" ADD CONSTRAINT "Redeem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redeem" ADD CONSTRAINT "Redeem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ShopItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XpEvent" ADD CONSTRAINT "XpEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XpEvent" ADD CONSTRAINT "XpEvent_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MuralEvent" ADD CONSTRAINT "MuralEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoodEntry" ADD CONSTRAINT "MoodEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAlert" ADD CONSTRAINT "AdminAlert_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WrappedSnapshot" ADD CONSTRAINT "WrappedSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WrappedSnapshot" ADD CONSTRAINT "WrappedSnapshot_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionTier" ADD CONSTRAINT "CommissionTier_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_weightId_fkey" FOREIGN KEY ("weightId") REFERENCES "DeliveryWeight"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adjustment" ADD CONSTRAINT "Adjustment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adjustment" ADD CONSTRAINT "Adjustment_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionMonth" ADD CONSTRAINT "CommissionMonth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

