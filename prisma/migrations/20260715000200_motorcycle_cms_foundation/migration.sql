CREATE TYPE "MotorcycleStatus" AS ENUM ('ACTIVE', 'HISTORIC', 'INACTIVE');

ALTER TABLE "Motorcycle"
ADD COLUMN "transmission" TEXT,
ADD COLUMN "heroImage" TEXT,
ADD COLUMN "status" "MotorcycleStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "visibility" "EventVisibility" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN "archivedAt" TIMESTAMP(3),
ADD COLUMN "archivedBy" TEXT;

CREATE INDEX "Motorcycle_visibility_idx" ON "Motorcycle"("visibility");
CREATE INDEX "Motorcycle_archivedAt_idx" ON "Motorcycle"("archivedAt");
