-- Add lifecycle metadata for the Results and Stage Results admin CMS.
-- These fields are intentionally additive so imported source lineage remains intact.

ALTER TABLE "Result"
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ADD COLUMN "archivedBy" TEXT;

ALTER TABLE "StageResult"
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ADD COLUMN "archivedBy" TEXT;

CREATE INDEX "Result_archivedAt_idx" ON "Result"("archivedAt");
CREATE INDEX "StageResult_archivedAt_idx" ON "StageResult"("archivedAt");
