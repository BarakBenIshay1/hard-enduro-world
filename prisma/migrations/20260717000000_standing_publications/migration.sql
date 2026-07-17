-- Add immutable publication records for official public standings.
CREATE TABLE "StandingPublication" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "classificationScope" TEXT NOT NULL DEFAULT 'OVERALL',
    "className" TEXT,
    "calculationSetId" TEXT NOT NULL,
    "calculationSetGroupKey" TEXT NOT NULL,
    "regulationId" TEXT,
    "regulationVersion" INTEGER,
    "regulationChecksum" TEXT,
    "snapshotId" TEXT NOT NULL,
    "snapshotChecksum" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "activeKey" TEXT,
    "publicationVersion" INTEGER NOT NULL,
    "versionKey" TEXT NOT NULL,
    "rows" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "publishedByUserId" TEXT,
    "publishedByUserEmail" TEXT,
    "supersededAt" TIMESTAMP(3),
    "supersededById" TEXT,
    "rollbackOfId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StandingPublication_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StandingPublication_activeKey_key" ON "StandingPublication"("activeKey");
CREATE UNIQUE INDEX "StandingPublication_versionKey_key" ON "StandingPublication"("versionKey");
CREATE INDEX "StandingPublication_seasonId_idx" ON "StandingPublication"("seasonId");
CREATE INDEX "StandingPublication_seasonId_classificationScope_className_idx" ON "StandingPublication"("seasonId", "classificationScope", "className");
CREATE INDEX "StandingPublication_status_idx" ON "StandingPublication"("status");
CREATE INDEX "StandingPublication_snapshotId_idx" ON "StandingPublication"("snapshotId");
CREATE INDEX "StandingPublication_regulationId_idx" ON "StandingPublication"("regulationId");
CREATE INDEX "StandingPublication_calculationSetId_idx" ON "StandingPublication"("calculationSetId");
CREATE INDEX "StandingPublication_versionKey_idx" ON "StandingPublication"("versionKey");

ALTER TABLE "StandingPublication" ADD CONSTRAINT "StandingPublication_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StandingPublication" ADD CONSTRAINT "StandingPublication_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "ConnectorSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StandingPublication" ADD CONSTRAINT "StandingPublication_regulationId_fkey" FOREIGN KEY ("regulationId") REFERENCES "ChampionshipRegulation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StandingPublication" ADD CONSTRAINT "StandingPublication_supersededById_fkey" FOREIGN KEY ("supersededById") REFERENCES "StandingPublication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StandingPublication" ADD CONSTRAINT "StandingPublication_rollbackOfId_fkey" FOREIGN KEY ("rollbackOfId") REFERENCES "StandingPublication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
