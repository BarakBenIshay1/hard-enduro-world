-- CreateEnum
CREATE TYPE "ConnectorReviewApplicationStatus" AS ENUM ('NOT_APPLIED', 'APPLYING', 'APPLIED', 'APPLY_FAILED');

-- AlterTable
ALTER TABLE "ConnectorReviewItem"
ADD COLUMN "applicationStatus" "ConnectorReviewApplicationStatus" NOT NULL DEFAULT 'NOT_APPLIED',
ADD COLUMN "appliedAt" TIMESTAMP(3),
ADD COLUMN "appliedByUserId" TEXT,
ADD COLUMN "appliedByUserEmail" TEXT,
ADD COLUMN "applicationNote" TEXT,
ADD COLUMN "applicationError" TEXT,
ADD COLUMN "appliedEventId" TEXT,
ADD COLUMN "applicationAttemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "expectedCurrentStateChecksum" TEXT,
ADD COLUMN "resultingEventStateChecksum" TEXT,
ADD COLUMN "applicationVersion" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "ConnectorReviewItem_applicationStatus_idx" ON "ConnectorReviewItem"("applicationStatus");
