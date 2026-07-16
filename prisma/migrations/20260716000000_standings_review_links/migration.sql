-- Extend the existing connector review model so calculated Standing proposals
-- follow the same review/apply lifecycle as Events, Results, and Stage Results.

ALTER TYPE "ConnectorReviewAction"
  ADD VALUE IF NOT EXISTS 'NEW_STANDING';

ALTER TYPE "ConnectorReviewAction"
  ADD VALUE IF NOT EXISTS 'UPDATE_STANDING';

ALTER TYPE "ConnectorReviewAction"
  ADD VALUE IF NOT EXISTS 'UNCHANGED_STANDING';

ALTER TYPE "ConnectorReviewAction"
  ADD VALUE IF NOT EXISTS 'STANDING_INVALID';

ALTER TABLE "ConnectorReviewItem"
  ADD COLUMN "currentStandingId" TEXT,
  ADD COLUMN "appliedStandingId" TEXT;

CREATE INDEX "ConnectorReviewItem_currentStandingId_idx"
  ON "ConnectorReviewItem"("currentStandingId");

CREATE INDEX "ConnectorReviewItem_appliedStandingId_idx"
  ON "ConnectorReviewItem"("appliedStandingId");
