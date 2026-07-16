-- Add verified official championship regulations as a first-class source-backed
-- configuration layer. Existing Result and Standing rows are not rewritten.

CREATE TABLE "ChampionshipRegulation" (
  "id" TEXT NOT NULL,
  "seasonId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "regulationYear" INTEGER NOT NULL,
  "section" TEXT NOT NULL,
  "effectiveFrom" TIMESTAMP(3),
  "effectiveTo" TIMESTAMP(3),
  "verificationDate" TIMESTAMP(3) NOT NULL,
  "sourceSnapshotId" TEXT,
  "contentChecksum" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "pointsMapping" JSONB NOT NULL,
  "tieBreakRules" JSONB,
  "notes" TEXT,
  "archivedAt" TIMESTAMP(3),
  "archivedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ChampionshipRegulation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ChampionshipRegulation_seasonId_idx"
  ON "ChampionshipRegulation"("seasonId");

CREATE INDEX "ChampionshipRegulation_status_idx"
  ON "ChampionshipRegulation"("status");

CREATE INDEX "ChampionshipRegulation_regulationYear_idx"
  ON "ChampionshipRegulation"("regulationYear");

CREATE INDEX "ChampionshipRegulation_sourceSnapshotId_idx"
  ON "ChampionshipRegulation"("sourceSnapshotId");

ALTER TABLE "ChampionshipRegulation"
  ADD CONSTRAINT "ChampionshipRegulation_seasonId_fkey"
  FOREIGN KEY ("seasonId") REFERENCES "Season"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ChampionshipRegulation"
  ADD CONSTRAINT "ChampionshipRegulation_sourceSnapshotId_fkey"
  FOREIGN KEY ("sourceSnapshotId") REFERENCES "SourceSnapshot"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
