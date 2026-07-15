-- Extend the generic connector review queue so it can safely carry StageResult proposals.
ALTER TYPE "ConnectorReviewAction" ADD VALUE IF NOT EXISTS 'NEW_STAGE_RESULT';
ALTER TYPE "ConnectorReviewAction" ADD VALUE IF NOT EXISTS 'UPDATE_STAGE_RESULT';
ALTER TYPE "ConnectorReviewAction" ADD VALUE IF NOT EXISTS 'STAGE_RESULT_CONFLICT';
ALTER TYPE "ConnectorReviewAction" ADD VALUE IF NOT EXISTS 'STAGE_RESULT_UNRESOLVED';
ALTER TYPE "ConnectorReviewAction" ADD VALUE IF NOT EXISTS 'STAGE_RESULT_INVALID';
ALTER TYPE "ConnectorReviewAction" ADD VALUE IF NOT EXISTS 'STAGE_RESULT_MISSING_SOURCE';

ALTER TABLE "ConnectorReviewItem"
  ADD COLUMN IF NOT EXISTS "currentStageResultId" TEXT,
  ADD COLUMN IF NOT EXISTS "appliedStageResultId" TEXT;

CREATE INDEX IF NOT EXISTS "ConnectorReviewItem_currentStageResultId_idx"
  ON "ConnectorReviewItem"("currentStageResultId");

CREATE INDEX IF NOT EXISTS "ConnectorReviewItem_appliedStageResultId_idx"
  ON "ConnectorReviewItem"("appliedStageResultId");
