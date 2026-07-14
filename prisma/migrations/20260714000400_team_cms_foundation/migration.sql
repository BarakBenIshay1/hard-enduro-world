CREATE TYPE "TeamStatus" AS ENUM ('ACTIVE', 'HISTORIC', 'INACTIVE');

ALTER TABLE "Team"
ADD COLUMN "manufacturerId" TEXT,
ADD COLUMN "managerName" TEXT,
ADD COLUMN "description" TEXT,
ADD COLUMN "status" "TeamStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "visibility" "EventVisibility" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN "logoUrl" TEXT,
ADD COLUMN "galleryImages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "archivedAt" TIMESTAMP(3),
ADD COLUMN "archivedBy" TEXT;

ALTER TABLE "Team"
ADD CONSTRAINT "Team_manufacturerId_fkey"
FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Team_manufacturerId_idx" ON "Team"("manufacturerId");
CREATE INDEX "Team_visibility_idx" ON "Team"("visibility");
CREATE INDEX "Team_archivedAt_idx" ON "Team"("archivedAt");
