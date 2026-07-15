import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createStableChecksum } from "@/jobs/connectors/fim-calendar/persistence";
import {
  overallResultsConnectorKey,
  overallResultsConnectorVersion,
  type MatchedOverallResultProposal,
  type OverallResultsImportReport,
  type OverallResultsSourceConfig,
} from "./overall-types";

type PrismaTransaction = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;
type PrismaExecutor = PrismaClient | PrismaTransaction;

export async function persistOverallResultsReviewRun({
  config,
  rawContent,
  contentType,
  statusCode,
  finalUrl,
  fetchedAt,
  rows,
  client = prisma,
}: {
  config: OverallResultsSourceConfig;
  rawContent: string;
  contentType: string | null;
  statusCode: number | null;
  finalUrl: string | null;
  fetchedAt: Date;
  rows: MatchedOverallResultProposal[];
  client?: PrismaClient;
}): Promise<OverallResultsImportReport> {
  const normalizedPayload = rows
    .map((row) => ({
      sourceRowId: row.sourceRowId,
      eventSlug: row.eventSlug,
      riderSlug: row.riderSlug,
      riderName: row.riderName,
      position: row.position,
      status: row.status,
      manufacturer: row.manufacturer,
      motorcycle: row.motorcycle,
      className: row.className,
      eventId: row.eventId,
      riderId: row.riderId,
      manufacturerId: row.manufacturerId,
      motorcycleId: row.motorcycleId,
      currentResultId: row.currentResultId,
      reviewAction: row.reviewAction,
      changedFields: row.changedFields,
      validationWarnings: row.validationWarnings,
    }))
    .sort((left, right) => left.sourceRowId.localeCompare(right.sourceRowId));
  const checksum = createStableChecksum(normalizedPayload);

  return client.$transaction(
    async (tx) => {
      const dataSource = await findOrCreateDataSource(config, tx);
      const sourceSnapshot = await tx.sourceSnapshot.create({
        data: {
          dataSourceId: dataSource.id,
          url: config.sourceUrl,
          contentHash: checksum,
          rawContent,
          fetchedAt,
          statusCode,
          errorMessage: null,
        },
      });
      const importRun = await tx.importRun.create({
        data: {
          sourceSnapshotId: sourceSnapshot.id,
          jobName: overallResultsConnectorKey,
          status: "NEEDS_REVIEW",
          startedAt: fetchedAt,
          finishedAt: new Date(),
          recordsFound: rows.length,
          recordsCreated: rows.filter((row) => row.reviewAction === "NEW_RESULT").length,
          recordsUpdated: rows.filter((row) => row.reviewAction === "UPDATE_RESULT")
            .length,
          recordsSkipped: rows.filter((row) => row.reviewAction === "UNCHANGED").length,
          metadata: {
            connectorKey: overallResultsConnectorKey,
            connectorVersion: overallResultsConnectorVersion,
            sourceId: config.sourceId,
            inputType: config.inputType,
            contentType,
            finalUrl,
          },
        },
      });

      const existingSnapshot = await tx.connectorSnapshot.findFirst({
        where: {
          connectorKey: overallResultsConnectorKey,
          season: config.seasonYear,
          payloadChecksum: checksum,
        },
        orderBy: { createdAt: "desc" },
      });

      if (existingSnapshot) {
        return buildReport({
          config,
          rows,
          checksum,
          sourceSnapshotId: sourceSnapshot.id,
          importRunId: importRun.id,
          connectorSnapshotId: existingSnapshot.id,
          snapshotStatus: "reused",
          duplicateDetected: true,
          created: 0,
          reused: 0,
          superseded: 0,
          pendingTotal: await countPending(tx),
        });
      }

      const connectorSnapshot = await tx.connectorSnapshot.create({
        data: {
          connectorKey: overallResultsConnectorKey,
          sourceKey: config.sourceId,
          season: config.seasonYear,
          coverageMode: "single-event",
          inputSourceType: config.inputType,
          requestedSourceUrl: config.sourceUrl,
          finalResponseUrl: finalUrl,
          httpStatus: statusCode,
          contentType,
          parserSelected: "erzbergrodeo-overall-csv-v1",
          rawRecordCount: rows.length,
          usableEventCount: rows.length,
          rejectedRecordCount: rows.filter((row) => row.reviewAction === "RESULT_INVALID")
            .length,
          rejectionReasons: rows.flatMap((row) => row.validationWarnings),
          fetchDurationMs: null,
          executionDurationMs: null,
          fallbackUsed: config.inputType === "local-official-fixture",
          environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? null,
          gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
          connectorVersion: overallResultsConnectorVersion,
          normalizedPayload: normalizedPayload as Prisma.InputJsonValue,
          matchingPayload: rows as unknown as Prisma.InputJsonValue,
          diagnostics: {
            sourceSnapshotId: sourceSnapshot.id,
            importRunId: importRun.id,
            resultRowsWritten: 0,
            stageResultsWritten: 0,
          },
          payloadChecksum: checksum,
        },
      });

      let created = 0;
      let reused = 0;
      let superseded = 0;
      for (const row of rows) {
        if (row.reviewAction === "UNCHANGED") continue;
        const deduplicationKey = createReviewDeduplicationKey(row);
        const existingPending = await tx.connectorReviewItem.findFirst({
          where: { deduplicationKey, reviewStatus: "PENDING" },
        });
        if (existingPending) {
          await tx.connectorReviewItem.update({
            where: { id: existingPending.id },
            data: { snapshotId: connectorSnapshot.id },
          });
          reused += 1;
          continue;
        }

        const relatedPending = await tx.connectorReviewItem.findMany({
          where: {
            connectorKey: overallResultsConnectorKey,
            season: config.seasonYear,
            reviewStatus: "PENDING",
            suggestedAction: row.reviewAction,
            OR: [
              ...(row.currentResultId ? [{ currentResultId: row.currentResultId }] : []),
              { sourceEventId: row.sourceRowId },
            ],
          },
        });
        for (const item of relatedPending) {
          await tx.connectorReviewItem.update({
            where: { id: item.id },
            data: { reviewStatus: "SUPERSEDED" },
          });
          superseded += 1;
        }

        await tx.connectorReviewItem.create({
          data: {
            snapshotId: connectorSnapshot.id,
            connectorKey: overallResultsConnectorKey,
            season: config.seasonYear,
            sourceEventId: row.sourceRowId,
            currentEventId: row.eventId,
            currentResultId: row.currentResultId,
            eventName: row.eventName ?? config.eventSlug,
            suggestedAction: row.reviewAction,
            confidence: {
              score: row.applyEligible ? 1 : 0,
              entityMatches: row.entityMatches,
            },
            matchingStrategy: row.entityMatches
              .map((match) => `${match.entityType}:${match.method}`)
              .join(", "),
            ambiguityReason: row.validationWarnings.join(" ") || null,
            currentValues:
              row.currentValues === null
                ? Prisma.JsonNull
                : (row.currentValues as Prisma.InputJsonValue),
            proposedValues: row.proposedValues as Prisma.InputJsonValue,
            changedFields: row.changedFields,
            recommendation: row.recommendation,
            deduplicationKey,
          },
        });
        created += 1;
      }

      return buildReport({
        config,
        rows,
        checksum,
        sourceSnapshotId: sourceSnapshot.id,
        importRunId: importRun.id,
        connectorSnapshotId: connectorSnapshot.id,
        snapshotStatus: "created",
        duplicateDetected: false,
        created,
        reused,
        superseded,
        pendingTotal: await countPending(tx),
      });
    },
    { maxWait: 10_000, timeout: 60_000 },
  );
}

export function createReviewDeduplicationKey(row: MatchedOverallResultProposal) {
  return createStableChecksum({
    connectorKey: overallResultsConnectorKey,
    sourceRowId: row.sourceRowId,
    currentResultId: row.currentResultId,
    action: row.reviewAction,
    currentValues: row.currentValues,
    proposedValues: row.proposedValues,
    changedFields: row.changedFields,
  });
}

async function findOrCreateDataSource(
  config: OverallResultsSourceConfig,
  client: PrismaExecutor,
) {
  const existing = await client.dataSource.findFirst({
    where: { name: config.sourceName, baseUrl: config.sourceUrl },
  });
  if (existing) return existing;
  return client.dataSource.create({
    data: {
      name: config.sourceName,
      type: "TIMING_SYSTEM",
      baseUrl: config.sourceUrl,
      reliability: "OFFICIAL",
    },
  });
}

async function countPending(client: PrismaExecutor) {
  return client.connectorReviewItem.count({
    where: { connectorKey: overallResultsConnectorKey, reviewStatus: "PENDING" },
  });
}

function buildReport({
  config,
  rows,
  checksum,
  sourceSnapshotId,
  importRunId,
  connectorSnapshotId,
  snapshotStatus,
  duplicateDetected,
  created,
  reused,
  superseded,
  pendingTotal,
}: {
  config: OverallResultsSourceConfig;
  rows: MatchedOverallResultProposal[];
  checksum: string;
  sourceSnapshotId: string;
  importRunId: string;
  connectorSnapshotId: string;
  snapshotStatus: "created" | "reused";
  duplicateDetected: boolean;
  created: number;
  reused: number;
  superseded: number;
  pendingTotal: number;
}): OverallResultsImportReport {
  return {
    summary: {
      connectorKey: overallResultsConnectorKey,
      sourceId: config.sourceId,
      eventSlug: config.eventSlug,
      seasonYear: config.seasonYear,
      inputType: config.inputType,
      totalRows: rows.length,
      normalizedRows: rows.length,
      newResults: rows.filter((row) => row.reviewAction === "NEW_RESULT").length,
      changedResults: rows.filter((row) => row.reviewAction === "UPDATE_RESULT").length,
      unchangedResults: rows.filter((row) => row.reviewAction === "UNCHANGED").length,
      blockedRows: rows.filter((row) => !row.applyEligible).length,
      warnings: rows.reduce((total, row) => total + row.validationWarnings.length, 0),
      resultRowsWritten: 0,
    },
    snapshot: {
      connectorSnapshotId,
      sourceSnapshotId,
      importRunId,
      checksum,
      status: snapshotStatus,
      duplicateDetected,
    },
    review: {
      created,
      reused,
      superseded,
      pendingTotal,
    },
    rows,
  };
}
