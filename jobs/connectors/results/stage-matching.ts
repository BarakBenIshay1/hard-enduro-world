import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  resolveEvent,
  resolveManufacturer,
  resolveMotorcycle,
  resolveRider,
  resolveTeam,
} from "./overall-matching";
import type { EntityMatch } from "./overall-types";
import type {
  MatchedStageResultProposal,
  NormalizedStageResultProposal,
  StageResultsSourceConfig,
  StageMatch,
} from "./stage-types";

type PrismaTransaction = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;
type PrismaExecutor = PrismaClient | PrismaTransaction;

const sourceStageAliases: Record<string, { slug: string; stageOrder: number }> = {
  "erzbergrodeo-2026-main-race": { slug: "final", stageOrder: 4 },
};

export async function matchStageResultProposals(
  proposals: NormalizedStageResultProposal[],
  client: PrismaExecutor = prisma,
): Promise<MatchedStageResultProposal[]> {
  const matched: MatchedStageResultProposal[] = [];
  for (const proposal of proposals) {
    matched.push(await matchStageResultProposal(proposal, client));
  }
  return matched;
}

export async function appendMissingSourceStageResultWarnings({
  rows,
  config,
  client = prisma,
}: {
  rows: MatchedStageResultProposal[];
  config: StageResultsSourceConfig;
  client?: PrismaExecutor;
}) {
  const warnings = await findMissingSourceStageResultWarnings({ rows, config, client });
  return [...rows, ...warnings];
}

export async function matchStageResultProposal(
  proposal: NormalizedStageResultProposal,
  client: PrismaExecutor = prisma,
): Promise<MatchedStageResultProposal> {
  const event = await resolveEvent(proposal, client);
  const stage = await resolveStage(proposal, event.matchedId, client);
  const rider = await resolveRider(proposal, client);
  const manufacturer = await resolveManufacturer(proposal, client);
  const motorcycle = await resolveMotorcycle(proposal, manufacturer.matchedId, client);
  const team = await resolveTeam(proposal, client);
  const currentStageResult =
    stage.matchedId && rider.matchedId
      ? await client.stageResult.findFirst({
          where: {
            stageId: stage.matchedId,
            riderId: rider.matchedId,
            className: proposal.className,
          },
        })
      : null;

  const entityMatches = [event, rider, manufacturer, motorcycle, team];
  const validationWarnings = validateProposal(proposal, stage, entityMatches);
  const proposedValues = buildProposedValues(proposal, {
    eventId: event.matchedId,
    stage,
    riderId: rider.matchedId,
    manufacturerId: manufacturer.matchedId,
    motorcycleId: motorcycle.matchedId,
    entityMatches,
    validationWarnings,
  });
  const currentValues = currentStageResult
    ? toStageResultState(currentStageResult)
    : null;
  const changedFields = currentValues
    ? diffStageResultFields(currentValues, proposedValues)
    : ["stageResult"];
  const applyEligible =
    validationWarnings.length === 0 &&
    event.matchedId !== null &&
    stage.matchedId !== null &&
    rider.matchedId !== null &&
    (proposal.manufacturer === null || manufacturer.matchedId !== null) &&
    (proposal.motorcycle === null || motorcycle.matchedId !== null);
  const reviewAction = !applyEligible
    ? validationWarnings.some((warning) => warning.startsWith("Invalid"))
      ? "STAGE_RESULT_INVALID"
      : "STAGE_RESULT_UNRESOLVED"
    : currentStageResult
      ? changedFields.length
        ? "UPDATE_STAGE_RESULT"
        : "UNCHANGED"
      : "NEW_STAGE_RESULT";

  return {
    ...proposal,
    eventId: event.matchedId,
    stageId: stage.matchedId,
    riderId: rider.matchedId,
    manufacturerId: manufacturer.matchedId,
    motorcycleId: motorcycle.matchedId,
    currentStageResultId: currentStageResult?.id ?? null,
    currentValues,
    proposedValues,
    changedFields,
    stageMatch: stage,
    entityMatches,
    validationWarnings,
    applyEligible,
    reviewAction,
    recommendation: recommendationFor(reviewAction, validationWarnings),
  };
}

async function findMissingSourceStageResultWarnings({
  rows,
  config,
  client,
}: {
  rows: MatchedStageResultProposal[];
  config: StageResultsSourceConfig;
  client: PrismaExecutor;
}): Promise<MatchedStageResultProposal[]> {
  const scopedRows = rows.filter(
    (row) => row.eventId && row.stageId && row.riderId && row.applyEligible,
  );
  if (scopedRows.length === 0) return [];

  const dataSource = await client.dataSource.findFirst({
    where: {
      name: config.sourceName,
      baseUrl: config.sourceUrl,
    },
  });
  if (!dataSource) return [];

  const sourceLinks = await client.sourceLink.findMany({
    where: {
      dataSourceId: dataSource.id,
      entityType: "StageResult",
    },
  });
  const sourceManagedIds = sourceLinks.map((link) => link.entityId);
  if (sourceManagedIds.length === 0) return [];

  const stageIds = [...new Set(scopedRows.map((row) => row.stageId!))];
  const eventIds = [...new Set(scopedRows.map((row) => row.eventId!))];
  const classScopes = [...new Set(scopedRows.map((row) => row.className ?? "__NULL__"))];
  const currentKeys = new Set(
    scopedRows.map((row) =>
      stageResultScopeKey({
        stageId: row.stageId!,
        riderId: row.riderId!,
        className: row.className,
      }),
    ),
  );

  const existingRows = await client.stageResult.findMany({
    where: {
      id: { in: sourceManagedIds },
      stageId: { in: stageIds },
      stage: { eventId: { in: eventIds } },
      OR: classScopes.map((className) => ({
        className: className === "__NULL__" ? null : className,
      })),
    },
    include: {
      stage: {
        include: {
          event: true,
        },
      },
      rider: true,
      manufacturer: true,
      motorcycle: true,
    },
  });

  return existingRows
    .filter(
      (row) =>
        !currentKeys.has(
          stageResultScopeKey({
            stageId: row.stageId,
            riderId: row.riderId,
            className: row.className,
          }),
        ),
    )
    .map((row) => buildMissingSourceWarning(row, config));
}

function buildMissingSourceWarning(
  row: {
    id: string;
    stageId: string;
    riderId: string;
    motorcycleId: string | null;
    manufacturerId: string | null;
    className: string | null;
    overallPosition: number | null;
    status: string;
    totalTimeMs: number | null;
    totalTimeText: string | null;
    gapToLeaderText: string | null;
    gapToPreviousText: string | null;
    stage: {
      id: string;
      eventId: string;
      name: string;
      slug: string;
      stageOrder: number;
      stageType: string;
      event: { id: string; slug: string; name: string };
    };
    rider: { id: string; firstName: string; lastName: string; slug: string };
    manufacturer: { id: string; name: string } | null;
    motorcycle: { id: string; model: string } | null;
  },
  config: StageResultsSourceConfig,
): MatchedStageResultProposal {
  const currentValues = toStageResultState(row);
  const stageMatch: StageMatch = {
    entityType: "RaceStage",
    sourceStageId: null,
    sourceStageName: row.stage.name,
    sourceStageSlug: row.stage.slug,
    sourceStageOrder: row.stage.stageOrder,
    matchedId: row.stage.id,
    matchedEventId: row.stage.eventId,
    matchedStageName: row.stage.name,
    matchedStageOrder: row.stage.stageOrder,
    matchedStageType: row.stage.stageType,
    method: "exact-slug",
    confidence: 1,
    reason: "Existing source-managed StageResult is in the comparison scope.",
    ambiguityReason: null,
    required: true,
  };
  const entityMatches: EntityMatch[] = [
    {
      entityType: "Event",
      sourceValue: row.stage.event.slug,
      matchedId: row.stage.eventId,
      method: "slug",
      confidence: 1,
      reason: "Existing StageResult stage belongs to this Event.",
      required: true,
    },
    {
      entityType: "Rider",
      sourceValue: row.rider.slug,
      matchedId: row.riderId,
      method: "slug",
      confidence: 1,
      reason: "Existing source-managed StageResult rider.",
      required: true,
    },
    {
      entityType: "Manufacturer",
      sourceValue: row.manufacturer?.name ?? null,
      matchedId: row.manufacturerId,
      method: row.manufacturerId ? "exact-name" : "not-supplied",
      confidence: 1,
      reason: "Existing source-managed StageResult manufacturer.",
      required: false,
    },
    {
      entityType: "Motorcycle",
      sourceValue: row.motorcycle?.model ?? null,
      matchedId: row.motorcycleId,
      method: row.motorcycleId ? "manufacturer-model" : "not-supplied",
      confidence: 1,
      reason: "Existing source-managed StageResult motorcycle.",
      required: false,
    },
    {
      entityType: "Team",
      sourceValue: null,
      matchedId: null,
      method: "not-supplied",
      confidence: 1,
      reason: "Team is informational only for this comparison.",
      required: false,
    },
  ];
  const proposedValues = {
    entityType: "StageResult",
    sourceRowId: `missing-source:${row.id}`,
    sourceStageId: null,
    sourceStageName: row.stage.name,
    sourceId: config.sourceId,
    eventId: row.stage.eventId,
    stageId: row.stage.id,
    riderId: row.riderId,
    manufacturerId: row.manufacturerId,
    motorcycleId: row.motorcycleId,
    className: row.className,
    missingFromSource: true,
    comparisonScope: {
      eventId: row.stage.eventId,
      eventSlug: row.stage.event.slug,
      stageId: row.stage.id,
      stageSlug: row.stage.slug,
      className: row.className,
      sourceId: config.sourceId,
    },
    applyEligible: false,
    validationWarnings: [
      "Existing source-managed StageResult is absent from the newest source snapshot.",
    ],
    stageMatch,
    entityMatches,
  };

  return {
    sourceRowId: `missing-source:${row.id}`,
    sourceStageId: null,
    sourceStageName: row.stage.name,
    sourceId: config.sourceId,
    eventSlug: row.stage.event.slug,
    eventName: row.stage.event.name,
    seasonYear: config.seasonYear,
    stageSlug: row.stage.slug,
    stageOrder: row.stage.stageOrder,
    riderSlug: row.rider.slug,
    riderName: `${row.rider.firstName} ${row.rider.lastName}`,
    countryCode: null,
    position: row.overallPosition,
    status: null,
    manufacturer: row.manufacturer?.name ?? null,
    motorcycle: row.motorcycle?.model ?? null,
    team: null,
    totalTimeMs: null,
    totalTimeText: null,
    gapToLeaderText: null,
    gapToPreviousText: null,
    className: row.className,
    officialSourceUrl: config.sourceUrl,
    officialRawRow: {},
    eventId: row.stage.eventId,
    stageId: row.stage.id,
    riderId: row.riderId,
    manufacturerId: row.manufacturerId,
    motorcycleId: row.motorcycleId,
    currentStageResultId: row.id,
    currentValues,
    proposedValues,
    changedFields: ["stageResult"],
    stageMatch,
    entityMatches,
    validationWarnings: [
      "Existing source-managed StageResult is absent from the newest source snapshot.",
    ],
    applyEligible: false,
    reviewAction: "STAGE_RESULT_MISSING_SOURCE",
    recommendation:
      "Review only. Missing-source warnings never delete, archive, or modify StageResult rows.",
  };
}

export async function resolveStage(
  proposal: NormalizedStageResultProposal,
  eventId: string | null,
  client: PrismaExecutor,
): Promise<StageMatch> {
  if (!eventId) {
    return unresolvedStage(proposal, "Event must resolve before RaceStage matching.");
  }

  const alias = proposal.sourceStageId
    ? sourceStageAliases[proposal.sourceStageId]
    : null;
  if (alias) {
    const stage = await client.raceStage.findUnique({
      where: { eventId_slug: { eventId, slug: alias.slug } },
    });
    if (stage) {
      return matchedStage(
        proposal,
        stage,
        "explicit-alias",
        "Matched by source stage alias.",
      );
    }
  }

  if (proposal.stageSlug) {
    const stage = await client.raceStage.findUnique({
      where: { eventId_slug: { eventId, slug: proposal.stageSlug } },
    });
    if (stage) {
      return matchedStage(proposal, stage, "exact-slug", "Matched by stage slug.");
    }
  }

  if (proposal.sourceStageName) {
    const stages = await client.raceStage.findMany({
      where: {
        eventId,
        name: { equals: normalizeName(proposal.sourceStageName), mode: "insensitive" },
      },
    });
    if (stages.length === 1) {
      return matchedStage(
        proposal,
        stages[0]!,
        "exact-normalized-name",
        "Matched by exact stage name.",
      );
    }
    if (stages.length > 1) {
      return ambiguousStage(proposal, "Multiple stages matched the source stage name.");
    }
  }

  if (proposal.stageOrder !== null) {
    const stage = await client.raceStage.findUnique({
      where: { eventId_stageOrder: { eventId, stageOrder: proposal.stageOrder } },
    });
    if (stage) {
      return matchedStage(
        proposal,
        stage,
        "event-stage-order",
        "Matched by event and stage order.",
      );
    }
  }

  return unresolvedStage(proposal, "No existing RaceStage matched the source stage.");
}

function buildProposedValues(
  proposal: NormalizedStageResultProposal,
  resolved: {
    eventId: string | null;
    stage: StageMatch;
    riderId: string | null;
    manufacturerId: string | null;
    motorcycleId: string | null;
    entityMatches: EntityMatch[];
    validationWarnings: string[];
  },
) {
  return {
    entityType: "StageResult",
    sourceRowId: proposal.sourceRowId,
    sourceStageId: proposal.sourceStageId,
    sourceStageName: proposal.sourceStageName,
    sourceId: proposal.sourceId,
    eventId: resolved.eventId,
    stageId: resolved.stage.matchedId,
    riderId: resolved.riderId,
    manufacturerId: resolved.manufacturerId,
    motorcycleId: resolved.motorcycleId,
    className: proposal.className,
    overallPosition: proposal.position,
    status: proposal.status,
    totalTimeMs: Number.isNaN(proposal.totalTimeMs) ? null : proposal.totalTimeMs,
    totalTimeText: proposal.totalTimeText,
    gapToLeaderText: proposal.gapToLeaderText,
    gapToPreviousText: proposal.gapToPreviousText,
    officialRawRow: proposal.officialRawRow,
    officialSourceUrl: proposal.officialSourceUrl,
    eventSlug: proposal.eventSlug,
    eventName: proposal.eventName,
    stageSlug: proposal.stageSlug,
    stageOrder: proposal.stageOrder,
    riderSlug: proposal.riderSlug,
    riderName: proposal.riderName,
    manufacturer: proposal.manufacturer,
    motorcycle: proposal.motorcycle,
    team: proposal.team,
    stageMatch: resolved.stage,
    entityMatches: resolved.entityMatches,
    validationWarnings: resolved.validationWarnings,
    applyEligible: resolved.validationWarnings.length === 0,
  };
}

function validateProposal(
  proposal: NormalizedStageResultProposal,
  stage: StageMatch,
  matches: EntityMatch[],
) {
  const warnings: string[] = [];
  if (!stage.matchedId) warnings.push(`Unresolved required RaceStage: ${stage.reason}`);
  if (stage.method === "ambiguous") {
    warnings.push(`Invalid ambiguous RaceStage match: ${stage.ambiguityReason}`);
  }
  for (const match of matches) {
    if (match.required && !match.matchedId) {
      warnings.push(`Unresolved required ${match.entityType}: ${match.sourceValue}`);
    }
  }
  if (!proposal.status) warnings.push("Invalid or missing stage result status.");
  if (proposal.status === "FINISHED" && (!proposal.position || proposal.position < 1)) {
    warnings.push("Invalid finished stage position.");
  }
  if (proposal.status === "DNS" && proposal.position !== null) {
    warnings.push("Invalid DNS stage row: DNS cannot receive a finished position.");
  }
  if (proposal.status === "DNS" && proposal.totalTimeText !== null) {
    warnings.push("Invalid DNS stage row: DNS cannot receive a fabricated stage time.");
  }
  if (
    proposal.position !== null &&
    (!Number.isInteger(proposal.position) || proposal.position < 1)
  ) {
    warnings.push("Invalid stage position: positions must be positive integers.");
  }
  if (Number.isNaN(proposal.totalTimeMs)) {
    warnings.push("Invalid stage time format.");
  }
  return warnings;
}

function toStageResultState(result: {
  id: string;
  stageId: string;
  riderId: string;
  motorcycleId: string | null;
  manufacturerId: string | null;
  className: string | null;
  overallPosition: number | null;
  status: string;
  totalTimeMs: number | null;
  totalTimeText: string | null;
  gapToLeaderText: string | null;
  gapToPreviousText: string | null;
}) {
  return {
    id: result.id,
    stageId: result.stageId,
    riderId: result.riderId,
    motorcycleId: result.motorcycleId,
    manufacturerId: result.manufacturerId,
    className: result.className,
    overallPosition: result.overallPosition,
    status: result.status,
    totalTimeMs: result.totalTimeMs,
    totalTimeText: result.totalTimeText,
    gapToLeaderText: result.gapToLeaderText,
    gapToPreviousText: result.gapToPreviousText,
  };
}

function diffStageResultFields(
  current: Record<string, unknown>,
  proposed: Record<string, unknown>,
) {
  return [
    "stageId",
    "riderId",
    "motorcycleId",
    "manufacturerId",
    "className",
    "overallPosition",
    "status",
    "totalTimeMs",
    "totalTimeText",
    "gapToLeaderText",
    "gapToPreviousText",
  ].filter(
    (field) =>
      JSON.stringify(current[field] ?? null) !== JSON.stringify(proposed[field] ?? null),
  );
}

function stageResultScopeKey({
  stageId,
  riderId,
  className,
}: {
  stageId: string;
  riderId: string;
  className: string | null;
}) {
  return [stageId, riderId, className ?? "__NULL__"].join("|");
}

function matchedStage(
  proposal: NormalizedStageResultProposal,
  stage: {
    id: string;
    eventId: string;
    name: string;
    slug: string;
    stageOrder: number;
    stageType: string;
  },
  method: StageMatch["method"],
  reason: string,
): StageMatch {
  return {
    entityType: "RaceStage",
    sourceStageId: proposal.sourceStageId,
    sourceStageName: proposal.sourceStageName,
    sourceStageSlug: proposal.stageSlug,
    sourceStageOrder: proposal.stageOrder,
    matchedId: stage.id,
    matchedEventId: stage.eventId,
    matchedStageName: stage.name,
    matchedStageOrder: stage.stageOrder,
    matchedStageType: stage.stageType,
    method,
    confidence: 1,
    reason,
    ambiguityReason: null,
    required: true,
  };
}

function unresolvedStage(
  proposal: NormalizedStageResultProposal,
  reason: string,
): StageMatch {
  return {
    entityType: "RaceStage",
    sourceStageId: proposal.sourceStageId,
    sourceStageName: proposal.sourceStageName,
    sourceStageSlug: proposal.stageSlug,
    sourceStageOrder: proposal.stageOrder,
    matchedId: null,
    matchedEventId: null,
    matchedStageName: null,
    matchedStageOrder: null,
    matchedStageType: null,
    method: "unresolved",
    confidence: 0,
    reason,
    ambiguityReason: null,
    required: true,
  };
}

function ambiguousStage(
  proposal: NormalizedStageResultProposal,
  reason: string,
): StageMatch {
  return {
    ...unresolvedStage(proposal, reason),
    method: "ambiguous",
    ambiguityReason: reason,
  };
}

function normalizeName(value: string) {
  return value.trim();
}

function recommendationFor(action: string, warnings: string[]) {
  if (action === "NEW_STAGE_RESULT") {
    return "Approve only after confirming the official stage row.";
  }
  if (action === "UPDATE_STAGE_RESULT") {
    return "Approve only after checking the field-level stage result diff.";
  }
  if (action === "UNCHANGED") return "No review item required.";
  return `Manual verification required before apply. ${warnings.join(" ")}`.trim();
}
