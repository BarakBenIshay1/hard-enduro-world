import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  EntityMatch,
  MatchedOverallResultProposal,
  NormalizedOverallResultProposal,
} from "./overall-types";

type PrismaTransaction = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;
type PrismaExecutor = PrismaClient | PrismaTransaction;

export async function matchOverallResultProposals(
  proposals: NormalizedOverallResultProposal[],
  client: PrismaExecutor = prisma,
): Promise<MatchedOverallResultProposal[]> {
  const matched: MatchedOverallResultProposal[] = [];
  for (const proposal of proposals) {
    matched.push(await matchOverallResultProposal(proposal, client));
  }
  return matched;
}

export async function matchOverallResultProposal(
  proposal: NormalizedOverallResultProposal,
  client: PrismaExecutor = prisma,
): Promise<MatchedOverallResultProposal> {
  const event = await resolveEvent(proposal, client);
  const rider = await resolveRider(proposal, client);
  const manufacturer = await resolveManufacturer(proposal, client);
  const motorcycle = await resolveMotorcycle(proposal, manufacturer.matchedId, client);
  const team = await resolveTeam(proposal, client);
  const currentResult =
    event.matchedId && rider.matchedId
      ? await client.result.findFirst({
          where: {
            eventId: event.matchedId,
            riderId: rider.matchedId,
            className: proposal.className,
          },
          include: {
            event: true,
            rider: true,
            manufacturer: true,
            motorcycle: true,
          },
        })
      : null;

  const entityMatches = [event, rider, manufacturer, motorcycle, team];
  const validationWarnings = validateProposal(proposal, entityMatches);
  const proposedValues = buildProposedValues(proposal, {
    eventId: event.matchedId,
    riderId: rider.matchedId,
    manufacturerId: manufacturer.matchedId,
    motorcycleId: motorcycle.matchedId,
    entityMatches,
    validationWarnings,
  });
  const currentValues = currentResult ? toResultState(currentResult) : null;
  const changedFields = currentValues
    ? diffResultFields(currentValues, proposedValues)
    : ["result"];
  const applyEligible =
    validationWarnings.length === 0 &&
    event.matchedId !== null &&
    rider.matchedId !== null &&
    (proposal.manufacturer === null || manufacturer.matchedId !== null) &&
    (proposal.motorcycle === null || motorcycle.matchedId !== null);
  const reviewAction = !applyEligible
    ? validationWarnings.some((warning) => warning.startsWith("Invalid"))
      ? "RESULT_INVALID"
      : "RESULT_UNRESOLVED"
    : currentResult
      ? changedFields.length
        ? "UPDATE_RESULT"
        : "UNCHANGED"
      : "NEW_RESULT";

  return {
    ...proposal,
    eventId: event.matchedId,
    riderId: rider.matchedId,
    manufacturerId: manufacturer.matchedId,
    motorcycleId: motorcycle.matchedId,
    currentResultId: currentResult?.id ?? null,
    currentValues,
    proposedValues,
    changedFields,
    entityMatches,
    validationWarnings,
    applyEligible,
    reviewAction,
    recommendation: recommendationFor(reviewAction, validationWarnings),
  };
}

function buildProposedValues(
  proposal: NormalizedOverallResultProposal,
  resolved: {
    eventId: string | null;
    riderId: string | null;
    manufacturerId: string | null;
    motorcycleId: string | null;
    entityMatches: EntityMatch[];
    validationWarnings: string[];
  },
) {
  return {
    entityType: "Result",
    sourceRowId: proposal.sourceRowId,
    sourceId: proposal.sourceId,
    eventId: resolved.eventId,
    riderId: resolved.riderId,
    manufacturerId: resolved.manufacturerId,
    motorcycleId: resolved.motorcycleId,
    className: proposal.className,
    overallPosition: proposal.position,
    status: proposal.status,
    totalTimeText: proposal.totalTimeText,
    gapToLeaderText: proposal.gapToLeaderText,
    gapToPreviousText: proposal.gapToPreviousText,
    officialRawRow: proposal.officialRawRow,
    officialSourceUrl: proposal.officialSourceUrl,
    eventSlug: proposal.eventSlug,
    eventName: proposal.eventName,
    riderSlug: proposal.riderSlug,
    riderName: proposal.riderName,
    manufacturer: proposal.manufacturer,
    motorcycle: proposal.motorcycle,
    team: proposal.team,
    entityMatches: resolved.entityMatches,
    validationWarnings: resolved.validationWarnings,
    applyEligible: resolved.validationWarnings.length === 0,
  };
}

function validateProposal(
  proposal: NormalizedOverallResultProposal,
  matches: EntityMatch[],
) {
  const warnings: string[] = [];
  for (const match of matches) {
    if (match.required && !match.matchedId) {
      warnings.push(`Unresolved required ${match.entityType}: ${match.sourceValue}`);
    }
  }
  if (!proposal.status) warnings.push("Invalid or missing result status.");
  if (proposal.status === "FINISHED" && (!proposal.position || proposal.position < 1)) {
    warnings.push("Invalid finished position.");
  }
  if (proposal.status === "DNS" && proposal.position !== null) {
    warnings.push("Invalid DNS row: DNS cannot receive a finished position.");
  }
  if (
    proposal.position !== null &&
    (!Number.isInteger(proposal.position) || proposal.position < 1)
  ) {
    warnings.push("Invalid position: positions must be positive integers.");
  }
  return warnings;
}

async function resolveEvent(
  proposal: NormalizedOverallResultProposal,
  client: PrismaExecutor,
): Promise<EntityMatch> {
  if (!proposal.eventSlug && !proposal.eventName) {
    return unresolved("Event", null, true, "No event identity supplied.");
  }
  if (proposal.eventSlug) {
    const event = await client.event.findUnique({ where: { slug: proposal.eventSlug } });
    if (event) return matched("Event", proposal.eventSlug, event.id, "slug");
  }
  if (proposal.eventName) {
    const event = await client.event.findFirst({
      where: {
        name: { equals: proposal.eventName, mode: "insensitive" },
        season: { year: proposal.seasonYear },
      },
    });
    if (event) return matched("Event", proposal.eventName, event.id, "exact-name");
  }
  return unresolved(
    "Event",
    proposal.eventSlug ?? proposal.eventName,
    true,
    "No existing Event matched the source event.",
  );
}

async function resolveRider(
  proposal: NormalizedOverallResultProposal,
  client: PrismaExecutor,
): Promise<EntityMatch> {
  if (!proposal.riderSlug && !proposal.riderName) {
    return unresolved("Rider", null, true, "No rider identity supplied.");
  }
  if (proposal.riderSlug) {
    const rider = await client.rider.findUnique({ where: { slug: proposal.riderSlug } });
    if (rider) return matched("Rider", proposal.riderSlug, rider.id, "slug");
  }
  if (proposal.riderName) {
    const [firstName, ...lastNameParts] = proposal.riderName.split(/\s+/);
    const lastName = lastNameParts.join(" ");
    const rider = await client.rider.findFirst({
      where: {
        firstName: { equals: firstName, mode: "insensitive" },
        lastName: { equals: lastName, mode: "insensitive" },
      },
    });
    if (rider) return matched("Rider", proposal.riderName, rider.id, "exact-name");
  }
  return unresolved(
    "Rider",
    proposal.riderSlug ?? proposal.riderName,
    true,
    "No existing Rider matched the source rider.",
  );
}

async function resolveManufacturer(
  proposal: NormalizedOverallResultProposal,
  client: PrismaExecutor,
): Promise<EntityMatch> {
  if (!proposal.manufacturer) {
    return notSupplied("Manufacturer", false);
  }
  const manufacturer = await client.manufacturer.findFirst({
    where: { name: { equals: proposal.manufacturer, mode: "insensitive" } },
  });
  if (manufacturer) {
    return matched("Manufacturer", proposal.manufacturer, manufacturer.id, "exact-name");
  }
  return unresolved(
    "Manufacturer",
    proposal.manufacturer,
    true,
    "Manufacturer was supplied but did not match a known Manufacturer.",
  );
}

async function resolveMotorcycle(
  proposal: NormalizedOverallResultProposal,
  manufacturerId: string | null,
  client: PrismaExecutor,
): Promise<EntityMatch> {
  if (!proposal.motorcycle) {
    return notSupplied("Motorcycle", false);
  }
  const motorcycle = await client.motorcycle.findFirst({
    where: {
      model: { equals: proposal.motorcycle, mode: "insensitive" },
      ...(manufacturerId ? { manufacturerId } : {}),
    },
  });
  if (motorcycle) {
    return matched(
      "Motorcycle",
      proposal.motorcycle,
      motorcycle.id,
      "manufacturer-model",
    );
  }
  return unresolved(
    "Motorcycle",
    proposal.motorcycle,
    true,
    "Motorcycle was supplied but did not match a known Motorcycle.",
  );
}

async function resolveTeam(
  proposal: NormalizedOverallResultProposal,
  client: PrismaExecutor,
): Promise<EntityMatch> {
  if (!proposal.team) {
    return notSupplied("Team", false);
  }
  const team = await client.team.findFirst({
    where: { name: { equals: proposal.team, mode: "insensitive" } },
  });
  if (team) return matched("Team", proposal.team, team.id, "exact-name");
  return unresolved(
    "Team",
    proposal.team,
    false,
    "Team was supplied but is informational for overall Result rows in this schema.",
  );
}

function toResultState(result: {
  id: string;
  eventId: string;
  riderId: string;
  motorcycleId: string | null;
  manufacturerId: string | null;
  className: string | null;
  overallPosition: number | null;
  status: string;
  totalTimeText: string | null;
  gapToLeaderText: string | null;
  gapToPreviousText: string | null;
}) {
  return {
    id: result.id,
    eventId: result.eventId,
    riderId: result.riderId,
    motorcycleId: result.motorcycleId,
    manufacturerId: result.manufacturerId,
    className: result.className,
    overallPosition: result.overallPosition,
    status: result.status,
    totalTimeText: result.totalTimeText,
    gapToLeaderText: result.gapToLeaderText,
    gapToPreviousText: result.gapToPreviousText,
  };
}

function diffResultFields(
  current: Record<string, unknown>,
  proposed: Record<string, unknown>,
) {
  return [
    "eventId",
    "riderId",
    "motorcycleId",
    "manufacturerId",
    "className",
    "overallPosition",
    "status",
    "totalTimeText",
    "gapToLeaderText",
    "gapToPreviousText",
  ].filter(
    (field) =>
      JSON.stringify(current[field] ?? null) !== JSON.stringify(proposed[field] ?? null),
  );
}

function matched(
  entityType: EntityMatch["entityType"],
  sourceValue: string,
  matchedId: string,
  method: EntityMatch["method"],
): EntityMatch {
  return {
    entityType,
    sourceValue,
    matchedId,
    method,
    confidence: 1,
    reason: `Matched by ${method}.`,
    required: entityType === "Event" || entityType === "Rider",
  };
}

function unresolved(
  entityType: EntityMatch["entityType"],
  sourceValue: string | null,
  required: boolean,
  reason: string,
): EntityMatch {
  return {
    entityType,
    sourceValue,
    matchedId: null,
    method: "unresolved",
    confidence: 0,
    reason,
    required,
  };
}

function notSupplied(
  entityType: EntityMatch["entityType"],
  required: boolean,
): EntityMatch {
  return {
    entityType,
    sourceValue: null,
    matchedId: null,
    method: "not-supplied",
    confidence: required ? 0 : 1,
    reason: "Source did not supply this optional entity.",
    required,
  };
}

function recommendationFor(action: string, warnings: string[]) {
  if (action === "NEW_RESULT") return "Approve only after confirming the official row.";
  if (action === "UPDATE_RESULT")
    return "Approve only after checking the field-level diff.";
  if (action === "UNCHANGED") return "No review item required.";
  return `Manual verification required before apply. ${warnings.join(" ")}`.trim();
}
