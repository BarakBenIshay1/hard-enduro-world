ALTER TABLE "Rider"
ADD COLUMN "visibility" "EventVisibility" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN "archivedAt" TIMESTAMP(3),
ADD COLUMN "archivedBy" TEXT;

CREATE INDEX "Rider_visibility_idx" ON "Rider"("visibility");
CREATE INDEX "Rider_archivedAt_idx" ON "Rider"("archivedAt");
