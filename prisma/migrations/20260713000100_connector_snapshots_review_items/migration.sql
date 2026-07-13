-- CreateEnum
CREATE TYPE "ConnectorReviewAction" AS ENUM ('NEW_EVENT', 'UPDATE_EVENT', 'SOURCE_REMOVED', 'MANUAL_REVIEW');

-- CreateEnum
CREATE TYPE "ConnectorReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUPERSEDED');

-- CreateTable
CREATE TABLE "ConnectorSnapshot" (
    "id" TEXT NOT NULL,
    "connectorKey" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "runTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "coverageMode" TEXT NOT NULL,
    "inputSourceType" TEXT NOT NULL,
    "requestedSourceUrl" TEXT,
    "finalResponseUrl" TEXT,
    "httpStatus" INTEGER,
    "contentType" TEXT,
    "parserSelected" TEXT NOT NULL,
    "rawRecordCount" INTEGER NOT NULL DEFAULT 0,
    "usableEventCount" INTEGER NOT NULL DEFAULT 0,
    "rejectedRecordCount" INTEGER NOT NULL DEFAULT 0,
    "rejectionReasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fetchDurationMs" INTEGER,
    "executionDurationMs" INTEGER,
    "fallbackUsed" BOOLEAN NOT NULL DEFAULT false,
    "environment" TEXT,
    "gitCommitSha" TEXT,
    "connectorVersion" TEXT,
    "normalizedPayload" JSONB NOT NULL,
    "matchingPayload" JSONB NOT NULL,
    "diagnostics" JSONB NOT NULL,
    "payloadChecksum" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConnectorSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectorReviewItem" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "connectorKey" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "sourceEventId" TEXT,
    "currentEventId" TEXT,
    "eventName" TEXT NOT NULL,
    "suggestedAction" "ConnectorReviewAction" NOT NULL,
    "reviewStatus" "ConnectorReviewStatus" NOT NULL DEFAULT 'PENDING',
    "confidence" JSONB NOT NULL,
    "matchingStrategy" TEXT,
    "ambiguityReason" TEXT,
    "currentValues" JSONB,
    "proposedValues" JSONB,
    "changedFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recommendation" TEXT,
    "deduplicationKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectorReviewItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConnectorSnapshot_connectorKey_season_createdAt_idx" ON "ConnectorSnapshot"("connectorKey", "season", "createdAt");

-- CreateIndex
CREATE INDEX "ConnectorSnapshot_sourceKey_idx" ON "ConnectorSnapshot"("sourceKey");

-- CreateIndex
CREATE INDEX "ConnectorSnapshot_payloadChecksum_idx" ON "ConnectorSnapshot"("payloadChecksum");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectorSnapshot_connectorKey_season_payloadChecksum_key" ON "ConnectorSnapshot"("connectorKey", "season", "payloadChecksum");

-- CreateIndex
CREATE INDEX "ConnectorReviewItem_snapshotId_idx" ON "ConnectorReviewItem"("snapshotId");

-- CreateIndex
CREATE INDEX "ConnectorReviewItem_connectorKey_season_idx" ON "ConnectorReviewItem"("connectorKey", "season");

-- CreateIndex
CREATE INDEX "ConnectorReviewItem_reviewStatus_idx" ON "ConnectorReviewItem"("reviewStatus");

-- CreateIndex
CREATE INDEX "ConnectorReviewItem_deduplicationKey_idx" ON "ConnectorReviewItem"("deduplicationKey");

-- AddForeignKey
ALTER TABLE "ConnectorReviewItem" ADD CONSTRAINT "ConnectorReviewItem_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "ConnectorSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
