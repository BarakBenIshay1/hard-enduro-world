CREATE TYPE "ManufacturerStatus" AS ENUM ('ACTIVE', 'HISTORIC', 'INACTIVE');

ALTER TABLE "Manufacturer"
ADD COLUMN "foundedYear" INTEGER,
ADD COLUMN "websiteUrl" TEXT,
ADD COLUMN "description" TEXT,
ADD COLUMN "status" "ManufacturerStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "visibility" "EventVisibility" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN "logoUrl" TEXT,
ADD COLUMN "archivedAt" TIMESTAMP(3),
ADD COLUMN "archivedBy" TEXT;

CREATE INDEX "Manufacturer_visibility_idx" ON "Manufacturer"("visibility");
CREATE INDEX "Manufacturer_archivedAt_idx" ON "Manufacturer"("archivedAt");
