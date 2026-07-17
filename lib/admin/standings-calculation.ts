import { createHash } from "node:crypto";
import { Prisma, type ConnectorReviewAction } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { publicResultWhere } from "@/lib/results/public-filters";
import {
  previewStandingsCalculation,
  type StandingsComparisonPreview,
} from "@/jobs/calculations/standings-engine";
import type { PointsSystemId } from "@/jobs/calculations/points-system";
import type {
  CalculationResultInput,
  CalculationValidationIssue,
} from "@/jobs/calculations/validation";
import {
  parseStandingsAggregationConfig,
  parseStandingsMetricScope,
  parseTieBreakRules,
  type StandingsAggregationConfig,
  type StandingsMetricScope,
  validateOfficialRegulation,
} from "@/lib/regulations/championship-regulations";

export const standingsConnectorKey = "standings-calculation";
export const standingsSourceKey = "calculated-from-approved-results";
export const standingsCalculationVersion = "standings-calculation-v1";

export type StandingCalculationRunInput = {
  seasonId: string;
  pointsSystemId?: PointsSystemId;
  cutoff?: StandingCalculationCutoff;
};

export type StandingCalculationCutoff =
  | { type: "FULL_SEASON" }
  | { type: "THROUGH_ROUND"; roundNumber: number }
  | { type: "THROUGH_EVENT"; eventId: string }
  | { type: "THROUGH_DATE"; date: string };

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

type EligibleEvent = {
  id: string;
  slug: string;
  name: string;
  status: string;
  roundNumber: number | null;
  startDate: string;
};

type RegulationConfig = {
  id: string;
  version: number;
  checksum: string | null;
  sourceUrl: string;
  sourceSnapshotId: string | null;
  classificationScope: string;
  className: string | null;
  aggregation: StandingsAggregationConfig | null;
  metricScope: StandingsMetricScope;
  tieBreakRules: ReturnType<typeof parseTieBreakRules>;
  validationIssues: ReturnType<typeof validateOfficialRegulation>;
};

export async function createStandingCalculationReviewRun({
  seasonId,
  pointsSystemId = "source-result-points",
  cutoff = { type: "FULL_SEASON" },
}: StandingCalculationRunInput) {
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    include: {
      events: {
        orderBy: [{ roundNumber: "asc" }, { startDate: "asc" }, { id: "asc" }],
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
      championshipRegulations: {
        where: { status: "ACTIVE", archivedAt: null },
        include: { sourceSnapshot: true },
      },
    },
  });
  if (!season) throw new Error("Season was not found.");

  const activeEventResults = season.events.flatMap((event) =>
    event.results
      .filter((result) => result.archivedAt === publicResultWhere.archivedAt)
      .map((result) => ({ event, result })),
  );
  const eligibleEvents = resolveEligibleEvents(
    season.events.map((event) => ({
      id: event.id,
      slug: event.slug,
      name: event.name,
      status: event.status,
      roundNumber: event.roundNumber,
      startDate: event.startDate.toISOString(),
    })),
    cutoff,
  );
  const eligibleEventIds = new Set(eligibleEvents.included.map((event) => event.id));
  const orderedEligibleEventIds = eligibleEvents.included.map((event) => event.id);
  const activeEventResultsInScope = activeEventResults.filter(({ event }) =>
    eligibleEventIds.has(event.id),
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

  const resultInputsBeforeAggregation: CalculationResultInput[] =
    activeEventResultsInScope.map(({ event, result }) => ({
      id: result.id,
      seasonId: season.id,
      eventId: event.id,
      eventRoundNumber: event.roundNumber,
      eventStartDate: event.startDate.toISOString(),
      riderId: result.riderId,
      riderName: `${result.rider.firstName} ${result.rider.lastName}`,
      className: result.className,
      position: result.overallPosition,
      points: result.points,
      status: result.status,
    }));
  const activeRegulations: RegulationConfig[] = season.championshipRegulations.map(
    (regulation) => {
      const validationIssues = validateOfficialRegulation(regulation);
      const aggregation = parseStandingsAggregationConfig(regulation.pointsMapping);
      if (!aggregation) {
        validationIssues.push({
          severity: "error",
          code: "invalid-points-mapping",
          message:
            "Standings calculation requires an official aggregation configuration.",
        });
      }
      return {
        id: regulation.id,
        version: regulation.version,
        checksum: regulation.contentChecksum,
        sourceUrl: regulation.sourceUrl,
        sourceSnapshotId: regulation.sourceSnapshotId,
        classificationScope: regulation.classificationScope,
        className: regulation.className,
        aggregation,
        metricScope: parseStandingsMetricScope(regulation.pointsMapping),
        tieBreakRules: parseTieBreakRules(regulation.tieBreakRules),
        validationIssues,
      };
    },
  );
  const aggregationIssues = validateAggregationCoverage({
    resultInputs: resultInputsBeforeAggregation,
    regulations: activeRegulations,
  });
  const scopedAggregation = selectResultsForAggregation({
    resultInputs: resultInputsBeforeAggregation,
    regulations: activeRegulations,
    orderedEligibleEventIds,
  });
  const resultInputs = scopedAggregation.selectedResults;
  const tieBreakRulesByScope = Object.fromEntries(
    activeRegulations
      .filter((regulation) => regulation.validationIssues.length === 0)
      .map((regulation) => [
        `${season.id}:${regulation.className ?? "__NULL__"}`,
        regulation.tieBreakRules,
      ]),
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
  const immutableEligibleInputResults = activeEventResultsInScope.map(
    ({ event, result }) => ({
      id: result.id,
      eventId: event.id,
      eventSlug: event.slug,
      eventStartDate: event.startDate.toISOString(),
      eventRoundNumber: event.roundNumber,
      riderId: result.riderId,
      riderName: `${result.rider.firstName} ${result.rider.lastName}`,
      className: result.className,
      overallPosition: result.overallPosition,
      classPosition: result.classPosition,
      points: result.points,
      status: result.status,
      archivedAt: result.archivedAt?.toISOString() ?? null,
      updatedAt: result.updatedAt.toISOString(),
    }),
  );

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
    tieBreakRulesByScope,
  });
  preview.validationIssues.push(
    ...activeRegulations.flatMap((regulation) =>
      regulation.validationIssues.map((issue) => ({
        severity: issue.severity,
        code: "invalid-regulation" as const,
        message: `Regulation ${regulation.id} cannot be used: ${issue.message}`,
      })),
    ),
  );
  preview.validationIssues.push(...eligibleEvents.validationIssues);
  preview.validationIssues.push(...aggregationIssues);
  const resolvedPointsSystemId = preview.pointsSystemId;
  const hasValidationErrors = preview.validationIssues.some(
    (issue) => issue.severity === "error",
  );
  const calculationSetGroupKey = stableHash({
    connectorKey: standingsConnectorKey,
    seasonId: season.id,
    cutoff,
    pointsSystemId: resolvedPointsSystemId,
    classes: Array.from(
      new Set([
        ...resultInputsBeforeAggregation.map((result) => result.className ?? "__NULL__"),
        ...season.standings.map((standing) => standing.className ?? "__NULL__"),
      ]),
    ).sort(),
  });
  const selectedInputResultIds = new Set(resultInputs.map((result) => result.id));
  const calculationSetId = `standing-set:${calculationSetGroupKey}:${stableHash({
    eventIds: eligibleEvents.included.map((event) => event.id),
    inputResults: immutableEligibleInputResults
      .filter((result) => selectedInputResultIds.has(result.id))
      .sort((left, right) => left.id.localeCompare(right.id)),
    regulations: activeRegulations.map((regulation) => ({
      id: regulation.id,
      version: regulation.version,
      checksum: regulation.checksum,
      className: regulation.className,
      aggregation: regulation.aggregation,
      metricScope: regulation.metricScope,
    })),
  }).slice(0, 24)}`;
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
      hasValidationErrors,
      calculationSet: {
        id: calculationSetId,
        groupKey: calculationSetGroupKey,
        expectedProposalCount: preview.standings.length,
        cutoff,
        orderedEventIds: orderedEligibleEventIds,
        includedResultIds: resultInputs.map((result) => result.id).sort(),
        selectedResultIdsByRider: scopedAggregation.selectedResultIdsByRider,
        droppedResultIdsByRider: scopedAggregation.droppedResultIdsByRider,
        regulationRefs: activeRegulations.map((regulation) => ({
          id: regulation.id,
          version: regulation.version,
          checksum: regulation.checksum,
          sourceUrl: regulation.sourceUrl,
          sourceSnapshotId: regulation.sourceSnapshotId,
          className: regulation.className,
          aggregation: regulation.aggregation,
          metricScope: regulation.metricScope,
        })),
      },
    }),
  );
  proposals.push(
    ...buildObsoleteStandingWarnings({
      standings: season.standings,
      previewRiderKeys: new Set(
        preview.standings.map((row) => `${row.riderId}:${row.className ?? "__NULL__"}`),
      ),
      seasonName: season.name,
      calculationSetId,
      calculationSetGroupKey,
      cutoff,
      hasValidationErrors: true,
    }),
  );
  for (const proposal of proposals) {
    if (proposal.proposedValues.calculationSetId === calculationSetId) {
      proposal.proposedValues.expectedProposalCount = proposals.length;
      proposal.applyEligible =
        proposal.applyEligible &&
        !hasValidationErrors &&
        proposal.action !== "STANDING_INVALID";
      proposal.proposedValues.applyEligible = proposal.applyEligible;
      proposal.deduplicationKey = `standing-set-row:${stableHash({
        action: proposal.action,
        currentStandingId: proposal.currentStandingId,
        proposed: proposal.proposedValues,
        changedFields: proposal.changedFields,
      })}`;
    }
  }

  const normalizedPayload = {
    calculationVersion: standingsCalculationVersion,
    seasonId: season.id,
    seasonYear: season.year,
    pointsSystemId: resolvedPointsSystemId,
    calculationSet: {
      id: calculationSetId,
      groupKey: calculationSetGroupKey,
      expectedProposalCount: proposals.length,
      cutoff,
      aggregationByClass: activeRegulations.map((regulation) => ({
        regulationId: regulation.id,
        className: regulation.className,
        aggregation: regulation.aggregation,
        metricScope: regulation.metricScope,
      })),
    },
    pointsRule: {
      source: "Result.points",
      officialRegulationReference: activeRegulations.map((regulation) => ({
        id: regulation.id,
        version: regulation.version,
        checksum: regulation.checksum,
        sourceUrl: regulation.sourceUrl,
        sourceSnapshotId: regulation.sourceSnapshotId,
        classificationScope: regulation.classificationScope,
        className: regulation.className,
      })),
      positionToPointsTable: null,
      publishableWhenMissingSourcePoints: false,
    },
    tieBreakRegulations: activeRegulations,
    eventOrdering: {
      priority: ["roundNumber", "startDate"],
      cutoff,
      eligibleEvents: eligibleEvents.included,
      excludedEvents: eligibleEvents.excluded,
      events: season.events.map((event) => ({
        id: event.id,
        slug: event.slug,
        roundNumber: event.roundNumber,
        startDate: event.startDate.toISOString(),
      })),
    },
    inputResultIds: resultInputs.map((result) => result.id).sort(),
    inputResults: immutableEligibleInputResults.sort((a, b) => a.id.localeCompare(b.id)),
    allActiveInputResults: immutableInputResults.sort((a, b) => a.id.localeCompare(b.id)),
    aggregation: scopedAggregation,
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
            ? "Review this calculated standing as part of the complete calculation set."
            : "Calculation set has validation errors and cannot be applied.",
          deduplicationKey: proposal.deduplicationKey,
        },
      });
      const obsoletePendingItems = await tx.connectorReviewItem.findMany({
        where: {
          connectorKey: standingsConnectorKey,
          season: season.year,
          reviewStatus: { in: ["PENDING", "APPROVED"] },
          applicationStatus: { not: "APPLIED" },
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
          where: {
            id: { in: obsoleteIds },
            reviewStatus: { in: ["PENDING", "APPROVED"] },
            applicationStatus: { not: "APPLIED" },
          },
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
    current.calculationSetGroupKey === proposed.calculationSetGroupKey &&
    current.calculationSetId !== proposed.calculationSetId
  );
}

function buildStandingProposal({
  row,
  current,
  seasonName,
  pointsSystemId,
  resultIds,
  hasValidationErrors,
  calculationSet,
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
  calculationSet: {
    id: string;
    groupKey: string;
    expectedProposalCount: number;
    cutoff: StandingCalculationCutoff;
    orderedEventIds: string[];
    includedResultIds: string[];
    selectedResultIdsByRider: Record<string, string[]>;
    droppedResultIdsByRider: Record<string, string[]>;
    regulationRefs: Array<Record<string, unknown>>;
  };
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
    calculationSetId: calculationSet.id,
    calculationSetGroupKey: calculationSet.groupKey,
    expectedProposalCount: calculationSet.expectedProposalCount,
    cutoff: calculationSet.cutoff,
    orderedEventIds: calculationSet.orderedEventIds,
    inputResultIds: resultIds,
    calculationInputResultIds: calculationSet.includedResultIds,
    selectedResultIds:
      calculationSet.selectedResultIdsByRider[
        `${row.riderId}:${row.className ?? "__NULL__"}`
      ] ?? resultIds,
    droppedResultIds:
      calculationSet.droppedResultIdsByRider[
        `${row.riderId}:${row.className ?? "__NULL__"}`
      ] ?? [],
    regulationReferences: calculationSet.regulationRefs,
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

function resolveEligibleEvents(
  events: EligibleEvent[],
  cutoff: StandingCalculationCutoff,
) {
  const sorted = [...events].sort(compareEventsForStandings);
  const validationIssues: CalculationValidationIssue[] = [];
  const seenRounds = new Set<number>();
  for (const event of sorted) {
    if (event.roundNumber !== null) {
      if (seenRounds.has(event.roundNumber)) {
        validationIssues.push({
          severity: "error",
          code: "invalid-regulation",
          message: `Round ${event.roundNumber} appears more than once in the season event order.`,
        });
      }
      seenRounds.add(event.roundNumber);
    }
  }
  const included = sorted.filter(
    (event) => event.status === "COMPLETED" && isEventWithinCutoff(event, cutoff, sorted),
  );
  return {
    included,
    excluded: sorted
      .filter((event) => !included.some((candidate) => candidate.id === event.id))
      .map((event) => ({
        ...event,
        reason:
          event.status !== "COMPLETED"
            ? "event-not-completed"
            : "outside-calculation-cutoff",
      })),
    validationIssues,
  };
}

function compareEventsForStandings(left: EligibleEvent, right: EligibleEvent) {
  if (left.roundNumber !== null && right.roundNumber !== null) {
    return left.roundNumber - right.roundNumber;
  }
  if (left.roundNumber !== null) return -1;
  if (right.roundNumber !== null) return 1;
  const dateCompare = left.startDate.localeCompare(right.startDate);
  return dateCompare || left.name.localeCompare(right.name);
}

function isEventWithinCutoff(
  event: EligibleEvent,
  cutoff: StandingCalculationCutoff,
  orderedEvents: EligibleEvent[],
) {
  if (cutoff.type === "FULL_SEASON") return true;
  if (cutoff.type === "THROUGH_ROUND") {
    return event.roundNumber !== null && event.roundNumber <= cutoff.roundNumber;
  }
  if (cutoff.type === "THROUGH_EVENT") {
    const eventIndex = orderedEvents.findIndex((candidate) => candidate.id === event.id);
    const cutoffIndex = orderedEvents.findIndex(
      (candidate) => candidate.id === cutoff.eventId,
    );
    return cutoffIndex >= 0 && eventIndex >= 0 && eventIndex <= cutoffIndex;
  }
  return event.startDate.slice(0, 10) <= cutoff.date.slice(0, 10);
}

function validateAggregationCoverage({
  resultInputs,
  regulations,
}: {
  resultInputs: CalculationResultInput[];
  regulations: RegulationConfig[];
}) {
  const issues: CalculationValidationIssue[] = [];
  const classNames = new Set(
    resultInputs.map((result) => result.className ?? "__NULL__"),
  );
  for (const className of classNames) {
    const regulation = regulationForClass(
      regulations,
      className === "__NULL__" ? null : className,
    );
    if (!regulation) {
      issues.push({
        severity: "error",
        code: "invalid-regulation",
        message: `No active official regulation is configured for class ${className}.`,
      });
    }
  }
  return issues;
}

function selectResultsForAggregation({
  resultInputs,
  regulations,
  orderedEligibleEventIds,
}: {
  resultInputs: CalculationResultInput[];
  regulations: RegulationConfig[];
  orderedEligibleEventIds: string[];
}) {
  const selectedResults: CalculationResultInput[] = [];
  const selectedResultIdsByRider: Record<string, string[]> = {};
  const droppedResultIdsByRider: Record<string, string[]> = {};
  const eventOrder = new Map(
    orderedEligibleEventIds.map((eventId, index) => [eventId, index]),
  );
  const byRider = new Map<string, CalculationResultInput[]>();
  for (const result of resultInputs) {
    const key = `${result.riderId ?? "__MISSING__"}:${result.className ?? "__NULL__"}`;
    const current = byRider.get(key) ?? [];
    current.push(result);
    byRider.set(key, current);
  }

  for (const [key, rows] of byRider) {
    const className = rows[0]?.className ?? null;
    const regulation = regulationForClass(regulations, className);
    const aggregation = regulation?.aggregation ?? {
      type: "ALL_ROUNDS" as const,
      duringSeasonBehavior: "USE_AVAILABLE_ROUNDS" as const,
    };
    const orderedRows = [...rows].sort((left, right) => {
      const pointsCompare = (right.points ?? -1) - (left.points ?? -1);
      if (pointsCompare !== 0) return pointsCompare;
      return (eventOrder.get(left.eventId) ?? 0) - (eventOrder.get(right.eventId) ?? 0);
    });
    const selected =
      aggregation.type === "BEST_N_ROUNDS"
        ? orderedRows.slice(0, aggregation.count)
        : orderedRows;
    const selectedIds = new Set(selected.map((result) => result.id));
    selectedResults.push(...selected);
    selectedResultIdsByRider[key] = selected.map((result) => result.id).sort();
    droppedResultIdsByRider[key] = rows
      .filter((result) => !selectedIds.has(result.id))
      .map((result) => result.id)
      .sort();
  }

  return {
    selectedResults,
    selectedResultIdsByRider,
    droppedResultIdsByRider,
  };
}

function regulationForClass(regulations: RegulationConfig[], className: string | null) {
  return (
    regulations.find((regulation) => regulation.className === className) ??
    regulations.find((regulation) => regulation.className === null)
  );
}

function buildObsoleteStandingWarnings({
  standings,
  previewRiderKeys,
  seasonName,
  calculationSetId,
  calculationSetGroupKey,
  cutoff,
}: {
  standings: Array<{
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
    rider: { firstName: string; lastName: string };
  }>;
  previewRiderKeys: Set<string>;
  seasonName: string;
  calculationSetId: string;
  calculationSetGroupKey: string;
  cutoff: StandingCalculationCutoff;
  hasValidationErrors: boolean;
}): StandingProposal[] {
  return standings
    .filter(
      (standing) =>
        !previewRiderKeys.has(`${standing.riderId}:${standing.className ?? "__NULL__"}`),
    )
    .map((standing) => {
      const currentValues = {
        entityType: "Standing",
        standingId: standing.id,
        seasonId: standing.seasonId,
        riderId: standing.riderId,
        className: standing.className,
        position: standing.position,
        points: standing.points,
        wins: standing.wins,
        podiums: standing.podiums,
        starts: standing.starts,
        dnfs: standing.dnfs,
      };
      const proposedValues = {
        entityType: "Standing",
        standingId: standing.id,
        seasonId: standing.seasonId,
        riderId: standing.riderId,
        riderName: `${standing.rider.firstName} ${standing.rider.lastName}`,
        className: standing.className,
        calculationSetId,
        calculationSetGroupKey,
        cutoff,
        applyEligible: false,
        warning: "Existing Standing is absent from the latest calculation scope.",
      };
      return {
        action: "STANDING_INVALID" as ConnectorReviewAction,
        currentStandingId: standing.id,
        eventName: `${seasonName} standings · ${standing.rider.firstName} ${standing.rider.lastName}`,
        currentValues,
        proposedValues,
        changedFields: [],
        applyEligible: false,
        deduplicationKey: `standing-obsolete:${stableHash(proposedValues)}`,
      };
    });
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
