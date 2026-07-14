CREATE TYPE "EventVisibility" AS ENUM ('PUBLIC', 'DRAFT', 'PRIVATE');

ALTER TABLE "Event"
ADD COLUMN "visibility" "EventVisibility" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN "organizer" TEXT,
ADD COLUMN "heroImage" TEXT,
ADD COLUMN "galleryImages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "archivedAt" TIMESTAMP(3),
ADD COLUMN "archivedBy" TEXT;

CREATE INDEX "Event_visibility_idx" ON "Event"("visibility");
CREATE INDEX "Event_archivedAt_idx" ON "Event"("archivedAt");
