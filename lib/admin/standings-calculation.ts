import { createHash } from "node:crypto";
import { Prisma, type ConnectorReviewAction } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { publicResultWhere } from "@/lib/results/public-filters";
import {
  previewStandingsCalculation,
  type StandingsComparisonPreview,
} from "@/jobs/calculations/standings-engine";
import type { PointsSystemId } from "@/jobs/calculations/points-system";
import type { CalculationResultInput } from "@/jobs/calculations/validation";

export const standingsConnectorKey = "standings-calculation";
export const standingsSourceKey = "calculated-from-approved-results";
export const standingsCalculationVersion = "standings-calculation-v1";

export type StandingCalculationRunInput = {
  seasonId: string;
  pointsSystemId?: PointsSystemId;
};

export type StandingProposal = {
  action: ConnectorReviewAction;
  currentStandingId: string | null;
  eventName: string;
  currentValues: Record<string, unknown> | null;
  proposedValues: Record<string, unknown>;
  changedFields: string[];
  deduplicationKey: string;
  applyEligible: boolean;
};

export async function createStandingCalculationReviewRun({
  seasonId,
  pointsSystemId = "source-result-points",
}: StandingCalculationRunInput) {
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    include: {
      events: {
        orderBy: [{ startDate: "asc" }, { roundNumber: "asc" }],
        include: {
          results: {
            include: { rider: true },
            orderBy: [{ event: { startDate: "asc" } }, { overallPosition: "asc" }],
          },
        },
      },
      standings: {
        include: { rider: true },
      },
    },
  });
  if (!season) throw new Error("Season was not found.");

  const activeEventResults = season.events.flatMap((event) =>
    event.results
      .filter((result) => result.archivedAt === publicResultWhere.archivedAt)
      .map((result) => ({ event, result })),
  );
  const excludedResults = season.events.flatMap((event) =>
    event.results
      .filter((result) => result.archivedAt !== null)
      .map((result) => ({
        id: result.id,
        eventId: event.id,
        eventSlug: event.slug,
        riderId: result.riderId,
        className: result.className,
        reason: "archived-result",
      })),
  );

  const resultInputs: CalculationResultInput[] = activeEventResults.map(
    ({ event, result }) => ({
      id: result.id,
      seasonId: season.id,
      eventId: event.id,
      riderId: result.riderId,
      riderName: `${result.rider.firstName} ${result.rider.lastName}`,
      className: result.className,
      position: result.overallPosition,
      points: result.points,
      status: result.status,
    }),
  );
  const immutableInputResults = activeEventResults.map(({ event, result }) => ({
    id: result.id,
    eventId: event.id,
    eventSlug: event.slug,
    eventStartDate: event.startDate.toISOString(),
    riderId: result.riderId,
    riderName: `${result.rider.firstName} ${result.rider.lastName}`,
    className: result.className,
    overallPosition: result.overallPosition,
    classPosition: result.classPosition,
    points: result.points,
    status: result.status,
    archivedAt: result.archivedAt?.toISOString() ?? null,
    updatedAt: result.updatedAt.toISOString(),
  }));

  const currentStandings = season.standings.map((standing) => ({
    seasonId: season.id,
    riderId: standing.riderId,
    className: standing.className,
    currentPosition: standing.position,
    currentPoints: standing.points,
  }));
  const preview = previewStandingsCalculation({
    results: resultInputs,
    currentStandings,
    pointsSystemId,
  });
  const resolvedPointsSystemId = preview.pointsSystemId;
  const currentByRider = new Map(
    season.standings.map((standing) => [
      `${standing.riderId}:${standing.className ?? "__NULL__"}`,
      standing,
    ]),
  );
  const proposals = preview.standings.map((row) =>
    buildStandingProposal({
      row,
      current:
        currentByRider.get(`${row.riderId}:${row.className ?? "__NULL__"}`) ?? null,
      seasonName: season.name,
      pointsSystemId: resolvedPointsSystemId,
      resultIds: resultInputs
        .filter(
          (result) =>
            result.riderId === row.riderId && result.className === row.className,
        )
        .map((result) => result.id),
      hasValidationErrors: preview.validationIssues.some(
        (issue) => issue.severity === "error",
      ),
    }),
  );

  const normalizedPayload = {
    calculationVersion: standingsCalculationVersion,
    seasonId: season.id,
    seasonYear: season.year,
    pointsSystemId: resolvedPointsSystemId,
    pointsRule: {
      source: "Result.points",
      officialRegulationReference: null,
      positionToPointsTable: null,
      publishableWhenMissingSourcePoints: false,
    },
    inputResultIds: resultInputs.map((result) => result.id).sort(),
    inputResults: immutableInputResults.sort((a, b) => a.id.localeCompare(b.id)),
    excludedResults,
    validationIssues: preview.validationIssues,
    standings: proposals.map((proposal) => proposal.proposedValues),
  };
  const payloadChecksum = stableHash(normalizedPayload);
  const runTimestamp = new Date();

  return prisma.$transaction(async (tx) => {
    let snapshot = await tx.connectorSnapshot.findUnique({
      where: {
        connectorKey_season_payloadChecksum: {
          connectorKey: standingsConnectorKey,
          season: season.year,
          payloadChecksum,
        },
      },
    });
    let snapshotStatus: "created" | "reused" = "reused";
    if (!snapshot) {
      snapshot = await tx.connectorSnapshot.create({
        data: {
          connectorKey: standingsConnectorKey,
          sourceKey: standingsSourceKey,
          season: season.year,
          runTimestamp,
          coverageMode: "full-season",
          inputSourceType: "calculation",
          parserSelected: standingsCalculationVersion,
          rawRecordCount: resultInputs.length,
          usableEventCount: season.events.length,
          rejectedRecordCount: preview.validationIssues.filter(
            (issue) => issue.severity === "error",
          ).length,
          rejectionReasons: preview.validationIssues.map(
            (issue) => `${issue.severity}:${issue.code}`,
          ),
          fetchDurationMs: 0,
          executionDurationMs: 0,
          fallbackUsed: false,
          environment: process.env.NODE_ENV ?? "development",
          connectorVersion: standingsCalculationVersion,
          normalizedPayload: normalizedPayload as Prisma.InputJsonValue,
          matchingPayload: {
            proposals: proposals.map((proposal) => ({
              action: proposal.action,
              riderId: proposal.proposedValues.riderId,
              currentStandingId: proposal.currentStandingId,
              changedFields: proposal.changedFields,
            })),
          } as Prisma.InputJsonValue,
          diagnostics: {
            calculationTimestamp: runTimestamp.toISOString(),
            inputResultCount: resultInputs.length,
            inputResultIds: resultInputs.map((result) => result.id).sort(),
            proposalCount: proposals.length,
            validationIssues: preview.validationIssues,
          },
          payloadChecksum,
        },
      });
      snapshotStatus = "created";
    }

    let created = 0;
    let reused = 0;
    let superseded = 0;
    for (const proposal of proposals) {
      const existing = await tx.connectorReviewItem.findFirst({
        where: {
          deduplicationKey: proposal.deduplicationKey,
          reviewStatus: "PENDING",
        },
        select: { id: true },
      });
      if (existing) {
        reused += 1;
        continue;
      }
      const createdItem = await tx.connectorReviewItem.create({
        data: {
          snapshotId: snapshot.id,
          connectorKey: standingsConnectorKey,
          season: season.year,
          currentStandingId: proposal.currentStandingId,
          eventName: proposal.eventName,
          suggestedAction: proposal.action,
          reviewStatus: "PENDING",
          confidence: {
            score: proposal.applyEligible ? 1 : 0,
            source: "deterministic-calculation",
          },
          matchingStrategy: "season-rider-class",
          currentValues: proposal.currentValues as Prisma.InputJsonValue,
          proposedValues: proposal.proposedValues as Prisma.InputJsonValue,
          changedFields: proposal.changedFields,
          recommendation: proposal.applyEligible
            ? "Review calculated standing before approval."
            : "Calculation has validation errors and cannot be applied.",
          deduplicationKey: proposal.deduplicationKey,
        },
      });
      const obsoletePendingItems = await tx.connectorReviewItem.findMany({
        where: {
          connectorKey: standingsConnectorKey,
          season: season.year,
          reviewStatus: "PENDING",
          id: { not: createdItem.id },
        },
        select: {
          id: true,
          deduplicationKey: true,
          proposedValues: true,
        },
      });
      const obsoleteIds = obsoletePendingItems
        .filter((item) => item.deduplicationKey !== proposal.deduplicationKey)
        .filter((item) =>
          isSameStandingProposalIdentity(item.proposedValues, proposal.proposedValues),
        )
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
      seasonYear: season.year,
      inputResults: resultInputs.length,
      proposals: proposals.length,
      created,
      reused,
      superseded,
      validationIssues: preview.validationIssues,
    };
  });
}

function isSameStandingProposalIdentity(
  existing: Prisma.JsonValue,
  proposed: Record<string, unknown>,
) {
  if (!existing || typeof existing !== "object" || Array.isArray(existing)) {
    return false;
  }
  const current = existing as Record<string, unknown>;
  return (
    current.entityType === "Standing" &&
    current.seasonId === proposed.seasonId &&
    current.riderId === proposed.riderId &&
    (current.className ?? null) === (proposed.className ?? null)
  );
}

function buildStandingProposal({
  row,
  current,
  seasonName,
  pointsSystemId,
  resultIds,
  hasValidationErrors,
}: {
  row: StandingsComparisonPreview;
  current: {
    id: string;
    seasonId: string;
    riderId: string;
    className: string | null;
    position: number | null;
    points: number;
    wins: number;
    podiums: number;
    starts: number;
    dnfs: number;
  } | null;
  seasonName: string;
  pointsSystemId: PointsSystemId;
  resultIds: string[];
  hasValidationErrors: boolean;
}): StandingProposal {
  const proposed = {
    entityType: "Standing",
    seasonId: row.seasonId,
    riderId: row.riderId,
    riderName: row.riderName,
    className: row.className,
    position: row.proposedPosition,
    points: row.proposedPoints,
    wins: row.wins,
    podiums: row.podiums,
    starts: row.starts,
    dnfs: row.dnfs,
    pointsSystemId,
    calculationVersion: standingsCalculationVersion,
    inputResultIds: resultIds,
    applyEligible: !hasValidationErrors,
  };
  const currentValues = current
    ? {
        entityType: "Standing",
        standingId: current.id,
        seasonId: current.seasonId,
        riderId: current.riderId,
        className: current.className,
        position: current.position,
        points: current.points,
        wins: current.wins,
        podiums: current.podiums,
        starts: current.starts,
        dnfs: current.dnfs,
      }
    : null;
  const changedFields = currentValues
    ? diffStandingFields(currentValues, proposed)
    : [
        "standing",
        "seasonId",
        "riderId",
        "position",
        "points",
        "wins",
        "podiums",
        "starts",
        "dnfs",
      ];
  const action: ConnectorReviewAction = hasValidationErrors
    ? "STANDING_INVALID"
    : !current
      ? "NEW_STANDING"
      : changedFields.length === 0
        ? "UNCHANGED_STANDING"
        : "UPDATE_STANDING";
  const dedupePayload = {
    action,
    currentStandingId: current?.id ?? null,
    proposed,
    changedFields,
  };

  return {
    action,
    currentStandingId: current?.id ?? null,
    eventName: `${seasonName} standings · ${row.riderName}`,
    currentValues,
    proposedValues: proposed,
    changedFields,
    applyEligible: !hasValidationErrors && action !== "UNCHANGED_STANDING",
    deduplicationKey: `standing:${stableHash(dedupePayload)}`,
  };
}

function diffStandingFields(
  current: Record<string, unknown>,
  proposed: Record<string, unknown>,
) {
  return ["position", "points", "wins", "podiums", "starts", "dnfs"].filter(
    (field) => current[field] !== proposed[field],
  );
}

export function stableHash(value: unknown) {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map(
        (key) =>
          `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`,
      )
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
