-- Add explicit classification scope and prevent multiple active regulation
-- versions from silently governing the same season/classification scope.

ALTER TABLE "ChampionshipRegulation"
  ADD COLUMN "classificationScope" TEXT NOT NULL DEFAULT 'OVERALL',
  ADD COLUMN "className" TEXT;

CREATE INDEX "ChampionshipRegulation_season_scope_class_idx"
  ON "ChampionshipRegulation"("seasonId", "classificationScope", "className");

CREATE UNIQUE INDEX "ChampionshipRegulation_active_scope_unique_idx"
  ON "ChampionshipRegulation"("seasonId", "classificationScope", COALESCE("className", ''))
  WHERE "status" = 'ACTIVE' AND "archivedAt" IS NULL;
