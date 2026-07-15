import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createStableChecksum } from "@/jobs/connectors/fim-calendar/persistence";
import {
  stageResultsConnectorKey,
  stageResultsConnectorVersion,
  type MatchedStageResultProposal,
  type StageResultsImportReport,
  type StageResultsSourceConfig,
} from "./stage-types";

type PrismaTransaction = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;
type PrismaExecutor = PrismaClient | PrismaTransaction;

export async function persistStageResultsReviewRun({
  config,
  rawContent,
  contentType,
  statusCode,
  finalUrl,
  fetchedAt,
  rows,
  client = prisma,
}: {
  config: StageResultsSourceConfig;
  rawContent: string;
  contentType: string | null;
  statusCode: number | null;
  finalUrl: string | null;
  fetchedAt: Date;
  rows: MatchedStageResultProposal[];
  client?: PrismaClient;
}): Promise<StageResultsImportReport> {
  const normalizedPayload = rows
    .map((row) => ({
      sourceRowId: row.sourceRowId,
      sourceStageId: row.sourceStageId,
      stageId: row.stageId,
      riderId: row.riderId,
      position: row.position,
      status: row.status,
      totalTimeText: row.totalTimeText,
      className: row.className,
      currentStageResultId: row.currentStageResultId,
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
          jobName: stageResultsConnectorKey,
          status: "NEEDS_REVIEW",
          startedAt: fetchedAt,
          finishedAt: new Date(),
          recordsFound: rows.length,
          recordsCreated: rows.filter((row) => row.reviewAction === "NEW_STAGE_RESULT")
            .length,
          recordsUpdated: rows.filter((row) => row.reviewAction === "UPDATE_STAGE_RESULT")
            .length,
          recordsSkipped: rows.filter((row) => row.reviewAction === "UNCHANGED").length,
          metadata: {
            connectorKey: stageResultsConnectorKey,
            connectorVersion: stageResultsConnectorVersion,
            sourceId: config.sourceId,
            inputType: config.inputType,
            contentType,
            finalUrl,
          },
        },
      });

      const existingSnapshot = await tx.connectorSnapshot.findFirst({
        where: {
          connectorKey: stageResultsConnectorKey,
          season: config.seasonYear,
          payloadChecksum: checksum,
        },
        orderBy: { createdAt: "desc" },
      });

      let superseded = await supersedeReturnedMissingSourceWarnings({
        rows,
        seasonYear: config.seasonYear,
        client: tx,
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
          superseded,
          pendingTotal: await countPending(tx),
        });
      }

      const connectorSnapshot = await tx.connectorSnapshot.create({
        data: {
          connectorKey: stageResultsConnectorKey,
          sourceKey: config.sourceId,
          season: config.seasonYear,
          coverageMode: "single-event",
          inputSourceType: config.inputType,
          requestedSourceUrl: config.sourceUrl,
          finalResponseUrl: finalUrl,
          httpStatus: statusCode,
          contentType,
          parserSelected: "erzbergrodeo-stage-csv-v1",
          rawRecordCount: rows.length,
          usableEventCount: rows.length,
          rejectedRecordCount: rows.filter(
            (row) => row.reviewAction === "STAGE_RESULT_INVALID",
          ).length,
          rejectionReasons: rows.flatMap((row) => row.validationWarnings),
          fetchDurationMs: null,
          executionDurationMs: null,
          fallbackUsed: config.inputType === "local-official-fixture",
          environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? null,
          gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
          connectorVersion: stageResultsConnectorVersion,
          normalizedPayload: normalizedPayload as Prisma.InputJsonValue,
          matchingPayload: rows as unknown as Prisma.InputJsonValue,
          diagnostics: {
            sourceSnapshotId: sourceSnapshot.id,
            importRunId: importRun.id,
            stageResultRowsWritten: 0,
            overallResultRowsWritten: 0,
          },
          payloadChecksum: checksum,
        },
      });

      let created = 0;
      let reused = 0;

      for (const row of rows) {
        if (row.reviewAction === "UNCHANGED") continue;
        const deduplicationKey = createStageReviewDeduplicationKey(row);
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
            connectorKey: stageResultsConnectorKey,
            season: config.seasonYear,
            reviewStatus: "PENDING",
            suggestedAction: row.reviewAction,
            OR: [
              ...(row.currentStageResultId
                ? [{ currentStageResultId: row.currentStageResultId }]
                : []),
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
            connectorKey: stageResultsConnectorKey,
            season: config.seasonYear,
            sourceEventId: row.sourceRowId,
            currentEventId: row.eventId,
            currentStageResultId: row.currentStageResultId,
            eventName: `${row.eventName ?? config.eventSlug} / ${row.sourceStageName ?? row.stageSlug ?? "Stage"}`,
            suggestedAction: row.reviewAction,
            confidence: {
              score: row.applyEligible ? 1 : 0,
              stageMatch: row.stageMatch,
              entityMatches: row.entityMatches,
            },
            matchingStrategy: [
              `RaceStage:${row.stageMatch.method}`,
              ...row.entityMatches.map((match) => `${match.entityType}:${match.method}`),
            ].join(", "),
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

export function createStageReviewDeduplicationKey(row: MatchedStageResultProposal) {
  return createStableChecksum({
    connectorKey: stageResultsConnectorKey,
    sourceRowId: row.sourceRowId,
    sourceStageId: row.sourceStageId,
    currentStageResultId: row.currentStageResultId,
    action: row.reviewAction,
    currentValues: row.currentValues,
    proposedValues: row.proposedValues,
    changedFields: row.changedFields,
  });
}

async function supersedeReturnedMissingSourceWarnings({
  rows,
  seasonYear,
  client,
}: {
  rows: MatchedStageResultProposal[];
  seasonYear: number;
  client: PrismaExecutor;
}) {
  const returnedSourceManagedStageResultIds = rows
    .map((row) => row.currentStageResultId)
    .filter(
      (id, index, values): id is string => Boolean(id) && values.indexOf(id) === index,
    );
  if (returnedSourceManagedStageResultIds.length === 0) return 0;

  const obsoleteMissingWarnings = await client.connectorReviewItem.findMany({
    where: {
      connectorKey: stageResultsConnectorKey,
      season: seasonYear,
      reviewStatus: "PENDING",
      suggestedAction: "STAGE_RESULT_MISSING_SOURCE",
      currentStageResultId: { in: returnedSourceManagedStageResultIds },
    },
  });

  let superseded = 0;
  for (const item of obsoleteMissingWarnings) {
    await client.connectorReviewItem.update({
      where: { id: item.id },
      data: { reviewStatus: "SUPERSEDED" },
    });
    superseded += 1;
  }

  return superseded;
}

async function findOrCreateDataSource(
  config: StageResultsSourceConfig,
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
    where: { connectorKey: stageResultsConnectorKey, reviewStatus: "PENDING" },
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
  config: StageResultsSourceConfig;
  rows: MatchedStageResultProposal[];
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
}): StageResultsImportReport {
  return {
    summary: {
      connectorKey: stageResultsConnectorKey,
      sourceId: config.sourceId,
      eventSlug: config.eventSlug,
      seasonYear: config.seasonYear,
      inputType: config.inputType,
      totalRows: rows.length,
      normalizedRows: rows.length,
      newStageResults: rows.filter((row) => row.reviewAction === "NEW_STAGE_RESULT")
        .length,
      changedStageResults: rows.filter(
        (row) => row.reviewAction === "UPDATE_STAGE_RESULT",
      ).length,
      unchangedStageResults: rows.filter((row) => row.reviewAction === "UNCHANGED")
        .length,
      missingSourceWarnings: rows.filter(
        (row) => row.reviewAction === "STAGE_RESULT_MISSING_SOURCE",
      ).length,
      blockedRows: rows.filter((row) => !row.applyEligible).length,
      warnings: rows.reduce((total, row) => total + row.validationWarnings.length, 0),
      stageResultRowsWritten: 0,
      overallResultRowsWritten: 0,
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
