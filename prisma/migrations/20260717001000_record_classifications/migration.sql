-- Add central origin/quarantine classification infrastructure.
CREATE TYPE "DataOriginStatus" AS ENUM (
    'VERIFIED_OFFICIAL',
    'SOURCE_MANAGED_UNVERIFIED',
    'AUDITED_MANUAL',
    'MANUAL_PLACEHOLDER',
    'DEMO',
    'SEED',
    'VALIDATION',
    'UNKNOWN',
    'CONFLICTING',
    'ARCHIVED_HISTORY'
);

CREATE TYPE "ClassifiableEntityType" AS ENUM (
    'SEASON',
    'EVENT',
    'RACE_STAGE',
    'RIDER',
    'TEAM',
    'MANUFACTURER',
    'MOTORCYCLE',
    'RESULT',
    'STAGE_RESULT',
    'RESULT_POINT_COMPONENT',
    'CHAMPIONSHIP_REGULATION',
    'STANDING',
    'STANDING_PUBLICATION'
);

CREATE TABLE "RecordClassification" (
    "id" TEXT NOT NULL,
    "entityType" "ClassifiableEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "originStatus" "DataOriginStatus" NOT NULL,
    "reason" TEXT NOT NULL,
    "evidence" JSONB,
    "sourceLinkId" TEXT,
    "sourceSnapshotId" TEXT,
    "connectorReviewItemId" TEXT,
    "classifiedByUserId" TEXT,
    "classifiedByUserEmail" TEXT,
    "supersededAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecordClassification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RecordClassification_entityType_idx" ON "RecordClassification"("entityType");
CREATE INDEX "RecordClassification_entityId_idx" ON "RecordClassification"("entityId");
CREATE INDEX "RecordClassification_originStatus_idx" ON "RecordClassification"("originStatus");
CREATE INDEX "RecordClassification_supersededAt_idx" ON "RecordClassification"("supersededAt");
CREATE INDEX "RecordClassification_sourceLinkId_idx" ON "RecordClassification"("sourceLinkId");
CREATE INDEX "RecordClassification_sourceSnapshotId_idx" ON "RecordClassification"("sourceSnapshotId");
CREATE INDEX "RecordClassification_connectorReviewItemId_idx" ON "RecordClassification"("connectorReviewItemId");

CREATE UNIQUE INDEX "RecordClassification_active_entity_unique"
    ON "RecordClassification"("entityType", "entityId")
    WHERE "supersededAt" IS NULL;

ALTER TABLE "RecordClassification"
    ADD CONSTRAINT "RecordClassification_sourceLinkId_fkey"
    FOREIGN KEY ("sourceLinkId") REFERENCES "SourceLink"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RecordClassification"
    ADD CONSTRAINT "RecordClassification_sourceSnapshotId_fkey"
    FOREIGN KEY ("sourceSnapshotId") REFERENCES "SourceSnapshot"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RecordClassification"
    ADD CONSTRAINT "RecordClassification_connectorReviewItemId_fkey"
    FOREIGN KEY ("connectorReviewItemId") REFERENCES "ConnectorReviewItem"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
