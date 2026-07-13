-- AlterTable
ALTER TABLE "ConnectorReviewItem"
ADD COLUMN "decidedByUserId" TEXT,
ADD COLUMN "decidedByUserEmail" TEXT,
ADD COLUMN "decidedAt" TIMESTAMP(3),
ADD COLUMN "decisionNote" TEXT,
ADD COLUMN "supersededByReviewItemId" TEXT,
ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "ConnectorReviewItem_supersededByReviewItemId_idx" ON "ConnectorReviewItem"("supersededByReviewItemId");
