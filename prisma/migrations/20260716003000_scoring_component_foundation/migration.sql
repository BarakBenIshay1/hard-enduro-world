-- Add official scoring component infrastructure without changing existing Result,
-- StageResult, or Standing behavior.

ALTER TYPE "StageType" ADD VALUE IF NOT EXISTS 'SPRINT';
ALTER TYPE "StageType" ADD VALUE IF NOT EXISTS 'MAIN_EVENT';

DO $$
BEGIN
  CREATE TYPE "ScoringComponentType" AS ENUM (
    'PROLOGUE',
    'SPRINT',
    'MAIN_EVENT',
    'FINAL',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ResultPointComponent" (
  "id" TEXT NOT NULL,
  "resultId" TEXT NOT NULL,
  "stageResultId" TEXT,
  "raceStageId" TEXT,
  "eventId" TEXT NOT NULL,
  "componentType" "ScoringComponentType" NOT NULL,
  "classificationScope" TEXT NOT NULL DEFAULT 'OVERALL',
  "className" TEXT,
  "position" INTEGER,
  "points" INTEGER NOT NULL,
  "regulationId" TEXT NOT NULL,
  "regulationVersion" INTEGER NOT NULL,
  "regulationChecksum" TEXT NOT NULL,
  "regulationTableKey" TEXT NOT NULL,
  "sourceSnapshotId" TEXT,
  "connectorReviewItemId" TEXT,
  "officialRawPayload" JSONB,
  "archivedAt" TIMESTAMP(3),
  "archivedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ResultPointComponent_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ConnectorReviewItem"
  ADD COLUMN IF NOT EXISTS "currentResultPointComponentId" TEXT,
  ADD COLUMN IF NOT EXISTS "appliedResultPointComponentId" TEXT;

CREATE INDEX IF NOT EXISTS "ResultPointComponent_resultId_idx"
  ON "ResultPointComponent"("resultId");

CREATE INDEX IF NOT EXISTS "ResultPointComponent_stageResultId_idx"
  ON "ResultPointComponent"("stageResultId");

CREATE INDEX IF NOT EXISTS "ResultPointComponent_raceStageId_idx"
  ON "ResultPointComponent"("raceStageId");

CREATE INDEX IF NOT EXISTS "ResultPointComponent_eventId_idx"
  ON "ResultPointComponent"("eventId");

CREATE INDEX IF NOT EXISTS "ResultPointComponent_regulationId_idx"
  ON "ResultPointComponent"("regulationId");

CREATE INDEX IF NOT EXISTS "ResultPointComponent_sourceSnapshotId_idx"
  ON "ResultPointComponent"("sourceSnapshotId");

CREATE INDEX IF NOT EXISTS "ResultPointComponent_connectorReviewItemId_idx"
  ON "ResultPointComponent"("connectorReviewItemId");

CREATE INDEX IF NOT EXISTS "ResultPointComponent_classificationScope_className_idx"
  ON "ResultPointComponent"("classificationScope", "className");

CREATE INDEX IF NOT EXISTS "ResultPointComponent_componentType_idx"
  ON "ResultPointComponent"("componentType");

CREATE INDEX IF NOT EXISTS "ResultPointComponent_archivedAt_idx"
  ON "ResultPointComponent"("archivedAt");

CREATE UNIQUE INDEX IF NOT EXISTS "ResultPointComponent_active_component_unique"
  ON "ResultPointComponent"(
    "resultId",
    "componentType",
    "classificationScope",
    COALESCE("className", ''),
    "regulationId",
    "regulationTableKey",
    COALESCE("stageResultId", ''),
    COALESCE("raceStageId", '')
  )
  WHERE "archivedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "ConnectorReviewItem_currentResultPointComponentId_idx"
  ON "ConnectorReviewItem"("currentResultPointComponentId");

CREATE INDEX IF NOT EXISTS "ConnectorReviewItem_appliedResultPointComponentId_idx"
  ON "ConnectorReviewItem"("appliedResultPointComponentId");

ALTER TABLE "ResultPointComponent"
  ADD CONSTRAINT "ResultPointComponent_resultId_fkey"
  FOREIGN KEY ("resultId") REFERENCES "Result"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ResultPointComponent"
  ADD CONSTRAINT "ResultPointComponent_stageResultId_fkey"
  FOREIGN KEY ("stageResultId") REFERENCES "StageResult"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ResultPointComponent"
  ADD CONSTRAINT "ResultPointComponent_raceStageId_fkey"
  FOREIGN KEY ("raceStageId") REFERENCES "RaceStage"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ResultPointComponent"
  ADD CONSTRAINT "ResultPointComponent_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "Event"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ResultPointComponent"
  ADD CONSTRAINT "ResultPointComponent_regulationId_fkey"
  FOREIGN KEY ("regulationId") REFERENCES "ChampionshipRegulation"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ResultPointComponent"
  ADD CONSTRAINT "ResultPointComponent_sourceSnapshotId_fkey"
  FOREIGN KEY ("sourceSnapshotId") REFERENCES "SourceSnapshot"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ResultPointComponent"
  ADD CONSTRAINT "ResultPointComponent_connectorReviewItemId_fkey"
  FOREIGN KEY ("connectorReviewItemId") REFERENCES "ConnectorReviewItem"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ConnectorReviewItem"
  ADD CONSTRAINT "ConnectorReviewItem_currentResultPointComponentId_fkey"
  FOREIGN KEY ("currentResultPointComponentId") REFERENCES "ResultPointComponent"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ConnectorReviewItem"
  ADD CONSTRAINT "ConnectorReviewItem_appliedResultPointComponentId_fkey"
  FOREIGN KEY ("appliedResultPointComponentId") REFERENCES "ResultPointComponent"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
