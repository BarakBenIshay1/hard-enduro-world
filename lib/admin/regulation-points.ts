import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  parsePointsMapping,
  pointsForPosition,
  regulationChecksum,
  validateOfficialRegulation,
} from "@/lib/regulations/championship-regulations";

export const regulationPointsConnectorKey = "official-regulation-points";
export const regulationPointsConnectorVersion = "official-regulation-points-v1";

export async function createRegulationPointsReviewRun({
  regulationId,
}: {
  regulationId: string;
}) {
  const regulation = await prisma.championshipRegulation.findUnique({
    where: { id: regulationId },
    include: {
      season: {
        include: {
          events: {
            include: {
              results: {
                where: { archivedAt: null },
                include: { rider: true },
                orderBy: [{ overallPosition: "asc" }, { id: "asc" }],
              },
            },
            orderBy: [{ startDate: "asc" }, { id: "asc" }],
          },
        },
      },
      sourceSnapshot: true,
    },
  });
  if (!regulation) throw new Error("Regulation was not found.");
  if (regulation.status !== "ACTIVE") {
    throw new Error("Only ACTIVE verified regulations can generate point proposals.");
  }
  if (regulation.archivedAt) {
    throw new Error("Archived regulations cannot generate point proposals.");
  }

  const validationIssues = validateOfficialRegulation(regulation);
  if (validationIssues.some((issue) => issue.severity === "error")) {
    throw new Error("Regulation has validation errors and cannot be used.");
  }
  const duplicateActiveRegulation = await prisma.championshipRegulation.findFirst({
    where: {
      id: { not: regulation.id },
      seasonId: regulation.seasonId,
      classificationScope: regulation.classificationScope,
      className: regulation.className,
      status: "ACTIVE",
      archivedAt: null,
    },
    select: { id: true },
  });
  if (duplicateActiveRegulation) {
    throw new Error(
      "Another ACTIVE regulation already governs this season and classification scope.",
    );
  }

  const mapping = parsePointsMapping(regulation.pointsMapping);
  const sourceChecksum = regulation.contentChecksum;
  const sourcePayload = {
    regulationId: regulation.id,
    title: regulation.title,
    sourceUrl: regulation.sourceUrl,
    regulationYear: regulation.regulationYear,
    classificationScope: regulation.classificationScope,
    className: regulation.className,
    section: regulation.section,
    verificationDate: regulation.verificationDate.toISOString(),
    sourceSnapshotId: regulation.sourceSnapshotId,
    contentChecksum: sourceChecksum,
    version: regulation.version,
    pointsMapping: mapping,
    tieBreakRules: regulation.tieBreakRules,
  };
  const rows = regulation.season.events.flatMap((event) =>
    event.results
      .filter((result) => result.className === regulation.className)
      .map((result) => {
        const proposedPoints = pointsForPosition(result.overallPosition, mapping);
        const validationWarnings =
          result.status !== "FINISHED"
            ? [
                {
                  severity: "error",
                  code: "unsupported-result-status",
                  message: `Official regulation points are only proposed for FINISHED results. Current status is ${result.status}.`,
                },
              ]
            : proposedPoints === null
              ? [
                  {
                    severity: "error",
                    code: "missing-position-points-mapping",
                    message: `No official points mapping exists for position ${result.overallPosition ?? "unknown"}.`,
                  },
                ]
              : [];
        return {
          result,
          event,
          proposedPoints,
          validationWarnings,
        };
      }),
  );
  const normalizedPayload = {
    connectorVersion: regulationPointsConnectorVersion,
    regulation: sourcePayload,
    seasonId: regulation.seasonId,
    seasonYear: regulation.season.year,
    rows: rows.map(({ result, event, proposedPoints, validationWarnings }) => ({
      resultId: result.id,
      eventId: event.id,
      eventSlug: event.slug,
      riderId: result.riderId,
      riderName: `${result.rider.firstName} ${result.rider.lastName}`,
      className: result.className,
      overallPosition: result.overallPosition,
      currentPoints: result.points,
      proposedPoints,
      status: result.status,
      validationWarnings,
    })),
  };
  const payloadChecksum = regulationChecksum(normalizedPayload);
  const runTimestamp = new Date();

  return prisma.$transaction(async (tx) => {
    let snapshot = await tx.connectorSnapshot.findUnique({
      where: {
        connectorKey_season_payloadChecksum: {
          connectorKey: regulationPointsConnectorKey,
          season: regulation.season.year,
          payloadChecksum,
        },
      },
    });
    let snapshotStatus: "created" | "reused" = "reused";
    if (!snapshot) {
      snapshot = await tx.connectorSnapshot.create({
        data: {
          connectorKey: regulationPointsConnectorKey,
          sourceKey: regulation.sourceUrl,
          season: regulation.season.year,
          runTimestamp,
          coverageMode: "full-season",
          inputSourceType: "official-regulation",
          requestedSourceUrl: regulation.sourceUrl,
          finalResponseUrl: regulation.sourceUrl,
          parserSelected: regulationPointsConnectorVersion,
          rawRecordCount: rows.length,
          usableEventCount: regulation.season.events.length,
          rejectedRecordCount: rows.filter((row) => row.validationWarnings.length).length,
          rejectionReasons: rows.flatMap((row) =>
            row.validationWarnings.map((issue) => issue.code),
          ),
          fetchDurationMs: 0,
          executionDurationMs: 0,
          fallbackUsed: false,
          environment: process.env.NODE_ENV ?? "development",
          connectorVersion: regulationPointsConnectorVersion,
          normalizedPayload: normalizedPayload as Prisma.InputJsonValue,
          matchingPayload: {
            regulationId: regulation.id,
            rows: rows.map((row) => ({
              resultId: row.result.id,
              proposedPoints: row.proposedPoints,
              currentPoints: row.result.points,
            })),
          },
          diagnostics: {
            regulationValidationIssues: validationIssues,
            sourceSnapshotId: regulation.sourceSnapshotId,
          },
          payloadChecksum,
        },
      });
      snapshotStatus = "created";
    }

    let created = 0;
    let reused = 0;
    let superseded = 0;
    for (const row of rows) {
      const action =
        row.validationWarnings.length > 0 || row.proposedPoints === null
          ? "RESULT_INVALID"
          : row.result.points === row.proposedPoints
            ? null
            : "UPDATE_RESULT";
      if (!action) continue;

      const currentValues = {
        entityType: "Result",
        resultId: row.result.id,
        eventId: row.event.id,
        riderId: row.result.riderId,
        className: row.result.className,
        overallPosition: row.result.overallPosition,
        points: row.result.points,
        status: row.result.status,
      };
      const proposedValues = {
        entityType: "Result",
        eventId: row.event.id,
        riderId: row.result.riderId,
        className: row.result.className,
        overallPosition: row.result.overallPosition,
        points: row.proposedPoints,
        status: row.result.status,
        officialSourceUrl: regulation.sourceUrl,
        riderName: `${row.result.rider.firstName} ${row.result.rider.lastName}`,
        eventSlug: row.event.slug,
        eventName: row.event.name,
        validationWarnings: row.validationWarnings,
        applyEligible: action === "UPDATE_RESULT",
        regulationId: regulation.id,
        regulationVersion: regulation.version,
        regulationChecksum: sourceChecksum,
        regulationSourceSnapshotId: regulation.sourceSnapshotId,
        regulationMappingEntry:
          row.proposedPoints === null
            ? null
            : {
                position: row.result.overallPosition,
                points: row.proposedPoints,
              },
        regulationSource: {
          title: regulation.title,
          url: regulation.sourceUrl,
          year: regulation.regulationYear,
          section: regulation.section,
          verificationDate: regulation.verificationDate.toISOString(),
          sourceSnapshotId: regulation.sourceSnapshotId,
          contentChecksum: sourceChecksum,
        },
        regulationSection: regulation.section,
      };
      const changedFields = action === "UPDATE_RESULT" ? ["points"] : [];
      const deduplicationKey = `regulation-points:${regulationChecksum({
        action,
        resultId: row.result.id,
        currentPoints: row.result.points,
        proposedPoints: row.proposedPoints,
        regulationId: regulation.id,
        regulationVersion: regulation.version,
        regulationChecksum: sourceChecksum,
      })}`;

      const existing = await tx.connectorReviewItem.findFirst({
        where: { deduplicationKey, reviewStatus: "PENDING" },
        select: { id: true },
      });
      if (existing) {
        reused += 1;
        continue;
      }

      const createdItem = await tx.connectorReviewItem.create({
        data: {
          snapshotId: snapshot.id,
          connectorKey: regulationPointsConnectorKey,
          season: regulation.season.year,
          currentResultId: row.result.id,
          eventName: `${row.event.name} · ${row.result.rider.firstName} ${row.result.rider.lastName}`,
          suggestedAction: action,
          reviewStatus: "PENDING",
          confidence: {
            score: action === "UPDATE_RESULT" ? 1 : 0,
            source: "official-regulation",
          },
          matchingStrategy: "result-id",
          currentValues: currentValues as Prisma.InputJsonValue,
          proposedValues: proposedValues as Prisma.InputJsonValue,
          changedFields,
          recommendation:
            action === "UPDATE_RESULT"
              ? "Review official regulation points before approval."
              : "Official regulation points cannot be applied until validation errors are resolved.",
          deduplicationKey,
        },
      });
      const obsolete = await tx.connectorReviewItem.findMany({
        where: {
          connectorKey: regulationPointsConnectorKey,
          currentResultId: row.result.id,
          reviewStatus: "PENDING",
          id: { not: createdItem.id },
        },
        select: { id: true, deduplicationKey: true },
      });
      const obsoleteIds = obsolete
        .filter((item) => item.deduplicationKey !== deduplicationKey)
        .map((item) => item.id);
      if (obsoleteIds.length) {
        await tx.connectorReviewItem.updateMany({
          where: { id: { in: obsoleteIds }, reviewStatus: "PENDING" },
          data: {
            reviewStatus: "SUPERSEDED",
            supersededByReviewItemId: createdItem.id,
          },
        });
        superseded += obsoleteIds.length;
      }
      created += 1;
    }

    return {
      snapshotId: snapshot.id,
      snapshotStatus,
      payloadChecksum,
      regulationId: regulation.id,
      seasonYear: regulation.season.year,
      rows: rows.length,
      created,
      reused,
      superseded,
      validationIssues,
    };
  });
}
