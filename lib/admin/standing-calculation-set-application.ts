import { createHash } from "node:crypto";
import { Prisma, type ConnectorReviewApplicationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AuthUser } from "@/lib/auth";
import { standingsConnectorKey } from "@/lib/admin/standings-calculation";

type PrismaTransaction = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export type StandingCalculationSetApplyInput = {
  reviewItemId: string;
  expectedApplicationStatus: ConnectorReviewApplicationStatus;
  expectedApplicationVersion: number;
  actor: Pick<AuthUser, "id" | "email" | "name">;
  note?: string | null;
};

export type StandingCalculationSetApplyResult =
  | {
      ok: true;
      reviewItemId: string;
      eventId: string;
      status: "APPLIED";
      message: string;
      appliedCount: number;
      unchangedCount: number;
    }
  | {
      ok: false;
      code: "already-applied" | "conflict" | "invalid" | "not-found" | "unsupported";
      message: string;
    };

type ReviewForSetApply = Awaited<ReturnType<typeof loadReviewItem>>;

export async function applyStandingCalculationSet({
  reviewItemId,
  expectedApplicationStatus,
  expectedApplicationVersion,
  actor,
  note,
}: StandingCalculationSetApplyInput): Promise<StandingCalculationSetApplyResult> {
  const seed = await loadReviewItem(reviewItemId);
  if (!seed) {
    return { ok: false, code: "not-found", message: "Review item was not found." };
  }
  if (
    seed.applicationStatus !== expectedApplicationStatus ||
    seed.applicationVersion !== expectedApplicationVersion
  ) {
    return {
      ok: false,
      code: "conflict",
      message: "Review item changed before application.",
    };
  }
  const seedProposal = asRecord(seed.proposedValues);
  const calculationSetId = getString(seedProposal, "calculationSetId");
  const calculationSetGroupKey = getString(seedProposal, "calculationSetGroupKey");
  const expectedProposalCount = getNumber(seedProposal, "expectedProposalCount");
  if (!calculationSetId || !calculationSetGroupKey || !expectedProposalCount) {
    return {
      ok: false,
      code: "unsupported",
      message: "Review item is not part of a Standing calculation set.",
    };
  }
  if (seed.connectorKey !== standingsConnectorKey) {
    return {
      ok: false,
      code: "unsupported",
      message: "Review item is not a Standing calculation proposal.",
    };
  }

  const items = (
    await prisma.connectorReviewItem.findMany({
      where: {
        connectorKey: standingsConnectorKey,
        season: seed.season,
        snapshotId: seed.snapshotId,
      },
      include: { snapshot: true },
      orderBy: [{ eventName: "asc" }, { id: "asc" }],
    })
  ).filter(
    (item) =>
      getString(asRecord(item.proposedValues), "calculationSetId") === calculationSetId,
  );

  const readiness = await validateSetReadiness({
    seed,
    items,
    calculationSetId,
    calculationSetGroupKey,
    expectedProposalCount,
  });
  if (!readiness.ok) return readiness;

  try {
    return await prisma.$transaction(async (tx) => {
      const appliedAt = new Date();
      let appliedCount = 0;
      let unchangedCount = 0;
      let lastStandingId = "";

      for (const item of items) {
        const proposed = asRecord(item.proposedValues);
        const current = asRecord(item.currentValues);
        const changedFields = item.changedFields;
        const action = item.suggestedAction;
        if (action === "UNCHANGED_STANDING") {
          const standingId =
            item.currentStandingId ?? getString(current, "standingId") ?? "";
          await markSetItemApplied({
            item,
            tx,
            actor,
            note,
            appliedAt,
            standingId,
            previousState: current,
            resultingState: current,
          });
          unchangedCount += 1;
          if (standingId) lastStandingId = standingId;
          continue;
        }

        const previousState =
          action === "UPDATE_STANDING"
            ? await loadStandingStateForUpdate(item, tx)
            : null;
        const standing =
          action === "NEW_STANDING"
            ? await createStandingFromSetProposal(proposed, tx)
            : await updateStandingFromSetProposal({
                item,
                proposed,
                previousState,
                changedFields,
                tx,
              });
        const resultingState = toStandingState(standing);
        await markSetItemApplied({
          item,
          tx,
          actor,
          note,
          appliedAt,
          standingId: standing.id,
          previousState,
          resultingState,
        });
        await tx.dataVersion.create({
          data: {
            entityType: "Standing",
            entityId: standing.id,
            action: action === "NEW_STANDING" ? "CREATE" : "UPDATE",
            previous: (previousState ?? null) as Prisma.InputJsonValue,
            next: resultingState as Prisma.InputJsonValue,
            createdBy: actor.id,
          },
        });
        appliedCount += 1;
        lastStandingId = standing.id;
      }

      return {
        ok: true,
        reviewItemId,
        eventId: lastStandingId,
        status: "APPLIED",
        message: `Applied complete Standing calculation set (${appliedCount} changed, ${unchangedCount} unchanged).`,
        appliedCount,
        unchangedCount,
      };
    });
  } catch (error) {
    return {
      ok: false,
      code: "invalid",
      message: sanitizeError(error),
    };
  }
}

async function loadReviewItem(reviewItemId: string) {
  return prisma.connectorReviewItem.findUnique({
    where: { id: reviewItemId },
    include: { snapshot: true },
  });
}

async function validateSetReadiness({
  seed,
  items,
  calculationSetId,
  calculationSetGroupKey,
  expectedProposalCount,
}: {
  seed: NonNullable<ReviewForSetApply>;
  items: NonNullable<ReviewForSetApply>[];
  calculationSetId: string;
  calculationSetGroupKey: string;
  expectedProposalCount: number;
}): Promise<StandingCalculationSetApplyResult | { ok: true }> {
  if (!items.length || items.length !== expectedProposalCount) {
    return {
      ok: false,
      code: "conflict",
      message: "Calculation set is incomplete and cannot be applied.",
    };
  }
  if (items.some((item) => item.suggestedAction === "STANDING_INVALID")) {
    return {
      ok: false,
      code: "invalid",
      message: "Calculation set contains blocking validation proposals.",
    };
  }
  const newerItems = await prisma.connectorReviewItem.findMany({
    where: {
      connectorKey: standingsConnectorKey,
      season: seed.season,
      createdAt: { gte: seed.createdAt },
    },
    select: {
      proposedValues: true,
      reviewStatus: true,
      applicationStatus: true,
    },
  });
  const hasNewerCurrentSet = newerItems.some((item) => {
    const proposed = asRecord(item.proposedValues);
    return (
      getString(proposed, "calculationSetGroupKey") === calculationSetGroupKey &&
      getString(proposed, "calculationSetId") !== calculationSetId &&
      item.reviewStatus !== "REJECTED"
    );
  });
  if (hasNewerCurrentSet) {
    return {
      ok: false,
      code: "conflict",
      message: "A newer unapplied calculation set exists for this scope.",
    };
  }
  if (items.some((item) => item.reviewStatus !== "APPROVED")) {
    return {
      ok: false,
      code: "conflict",
      message: "Every proposal in the calculation set must be approved before apply.",
    };
  }
  const appliedItems = items.filter((item) => item.applicationStatus === "APPLIED");
  if (appliedItems.length === items.length) {
    return {
      ok: false,
      code: "already-applied",
      message: "Calculation set was already applied.",
    };
  }
  if (appliedItems.length > 0) {
    return {
      ok: false,
      code: "conflict",
      message: "Calculation set is partially applied and requires manual review.",
    };
  }
  if (
    items.some(
      (item) =>
        !["NOT_APPLIED", "APPLY_FAILED"].includes(item.applicationStatus) ||
        item.applicationVersion !== seed.applicationVersion,
    )
  ) {
    return {
      ok: false,
      code: "conflict",
      message: "One or more calculation set proposals changed before application.",
    };
  }
  return { ok: true };
}

async function createStandingFromSetProposal(
  proposed: Record<string, unknown>,
  tx: PrismaTransaction,
) {
  const seasonId = requiredString(proposed, "seasonId");
  const riderId = requiredString(proposed, "riderId");
  const className = getString(proposed, "className");
  const [season, rider, duplicate] = await Promise.all([
    tx.season.findUnique({ where: { id: seasonId } }),
    tx.rider.findUnique({ where: { id: riderId } }),
    tx.standing.findFirst({ where: { seasonId, riderId, className } }),
  ]);
  if (!season) throw new Error("Matched Season no longer exists.");
  if (!rider) throw new Error("Matched Rider no longer exists.");
  if (duplicate) throw new Error("A Standing already exists for this rider and season.");
  return tx.standing.create({
    data: {
      seasonId,
      riderId,
      className,
      position: requiredNumber(proposed, "position"),
      points: requiredNumber(proposed, "points"),
      wins: requiredNumber(proposed, "wins"),
      podiums: requiredNumber(proposed, "podiums"),
      starts: requiredNumber(proposed, "starts"),
      dnfs: requiredNumber(proposed, "dnfs"),
    },
  });
}

async function updateStandingFromSetProposal({
  item,
  proposed,
  previousState,
  changedFields,
  tx,
}: {
  item: NonNullable<ReviewForSetApply>;
  proposed: Record<string, unknown>;
  previousState: Record<string, unknown> | null;
  changedFields: string[];
  tx: PrismaTransaction;
}) {
  if (!item.currentStandingId) throw new Error("UPDATE_STANDING requires a Standing id.");
  if (!previousState) throw new Error("Current Standing state is missing.");
  const expected = asRecord(item.currentValues);
  assertNoStaleStandingFields({
    changedFields,
    previousState,
    expectedState: expected,
  });
  const data: Prisma.StandingUpdateInput = {};
  for (const field of new Set(changedFields.filter((field) => field !== "standing"))) {
    if (field === "position") data.position = requiredNumber(proposed, "position");
    if (field === "points") data.points = requiredNumber(proposed, "points");
    if (field === "wins") data.wins = requiredNumber(proposed, "wins");
    if (field === "podiums") data.podiums = requiredNumber(proposed, "podiums");
    if (field === "starts") data.starts = requiredNumber(proposed, "starts");
    if (field === "dnfs") data.dnfs = requiredNumber(proposed, "dnfs");
  }
  if (Object.keys(data).length === 0) {
    throw new Error("No supported Standing fields were approved for application.");
  }
  return tx.standing.update({ where: { id: item.currentStandingId }, data });
}

async function loadStandingStateForUpdate(
  item: NonNullable<ReviewForSetApply>,
  tx: PrismaTransaction,
) {
  const standing = await tx.standing.findUnique({
    where: { id: item.currentStandingId ?? "" },
  });
  if (!standing) throw new Error("Matched Standing no longer exists.");
  return toStandingState(standing);
}

async function markSetItemApplied({
  item,
  tx,
  actor,
  note,
  appliedAt,
  standingId,
  previousState,
  resultingState,
}: {
  item: NonNullable<ReviewForSetApply>;
  tx: PrismaTransaction;
  actor: Pick<AuthUser, "id" | "email" | "name">;
  note?: string | null;
  appliedAt: Date;
  standingId: string;
  previousState: Record<string, unknown> | null;
  resultingState: Record<string, unknown> | null;
}) {
  await tx.connectorReviewItem.update({
    where: { id: item.id },
    data: {
      applicationStatus: "APPLIED",
      appliedAt,
      appliedByUserId: actor.id,
      appliedByUserEmail: actor.email,
      applicationNote: note?.trim() || null,
      applicationError: null,
      appliedStandingId: standingId || null,
      expectedCurrentStateChecksum: createStableChecksum(previousState ?? null),
      resultingEventStateChecksum: createStableChecksum(resultingState ?? null),
      applicationVersion: { increment: 1 },
    },
  });
  await tx.dataVersion.create({
    data: {
      entityType: "ConnectorReviewItem",
      entityId: item.id,
      action: "MANUAL_EDIT",
      previous: {
        applicationStatus: item.applicationStatus,
        applicationVersion: item.applicationVersion,
      },
      next: {
        applicationStatus: "APPLIED",
        appliedStandingId: standingId || null,
        appliedByUserId: actor.id,
        appliedByUserEmail: actor.email,
        appliedAt: appliedAt.toISOString(),
        suggestedAction: item.suggestedAction,
        calculationSetId: getString(asRecord(item.proposedValues), "calculationSetId"),
      },
      createdBy: actor.id,
    },
  });
}

function assertNoStaleStandingFields({
  changedFields,
  previousState,
  expectedState,
}: {
  changedFields: string[];
  previousState: Record<string, unknown>;
  expectedState: Record<string, unknown>;
}) {
  for (const field of changedFields.filter((field) => field !== "standing")) {
    if (previousState[field] !== expectedState[field]) {
      throw new Error(`Standing changed after approval; ${field} is stale.`);
    }
  }
}

function toStandingState(standing: {
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
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: standing.id,
    seasonId: standing.seasonId,
    riderId: standing.riderId,
    className: standing.className,
    position: standing.position,
    points: standing.points,
    wins: standing.wins,
    podiums: standing.podiums,
    starts: standing.starts,
    dnfs: standing.dnfs,
    createdAt: standing.createdAt.toISOString(),
    updatedAt: standing.updatedAt.toISOString(),
  };
}

function asRecord(value: Prisma.JsonValue | null): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function getString(value: Record<string, unknown>, key: string) {
  const field = value[key];
  return typeof field === "string" && field.trim() ? field.trim() : null;
}

function requiredString(value: Record<string, unknown>, key: string) {
  const field = getString(value, key);
  if (!field) throw new Error(`${key} is required.`);
  return field;
}

function getNumber(value: Record<string, unknown>, key: string) {
  const field = value[key];
  return typeof field === "number" && Number.isFinite(field) ? field : null;
}

function requiredNumber(value: Record<string, unknown>, key: string) {
  const field = getNumber(value, key);
  if (field === null) throw new Error(`${key} is required.`);
  return field;
}

function createStableChecksum(value: unknown) {
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

function sanitizeError(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Standing calculation set apply failed.";
}
