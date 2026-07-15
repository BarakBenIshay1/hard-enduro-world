-- Extend the generic connector review queue so it can safely carry Result proposals.
ALTER TYPE "ConnectorReviewAction" ADD VALUE IF NOT EXISTS 'NEW_RESULT';
ALTER TYPE "ConnectorReviewAction" ADD VALUE IF NOT EXISTS 'UPDATE_RESULT';
ALTER TYPE "ConnectorReviewAction" ADD VALUE IF NOT EXISTS 'RESULT_CONFLICT';
ALTER TYPE "ConnectorReviewAction" ADD VALUE IF NOT EXISTS 'RESULT_UNRESOLVED';
ALTER TYPE "ConnectorReviewAction" ADD VALUE IF NOT EXISTS 'RESULT_INVALID';
ALTER TYPE "ConnectorReviewAction" ADD VALUE IF NOT EXISTS 'RESULT_MISSING_SOURCE';

ALTER TABLE "ConnectorReviewItem"
  ADD COLUMN IF NOT EXISTS "currentResultId" TEXT,
  ADD COLUMN IF NOT EXISTS "appliedResultId" TEXT;

CREATE INDEX IF NOT EXISTS "ConnectorReviewItem_currentResultId_idx"
  ON "ConnectorReviewItem"("currentResultId");

CREATE INDEX IF NOT EXISTS "ConnectorReviewItem_appliedResultId_idx"
  ON "ConnectorReviewItem"("appliedResultId");
