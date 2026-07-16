import { createHash } from "node:crypto";
import {
  applyConnectorReviewItem,
  validateConnectorReviewApplicationPolicy,
} from "@/lib/admin/connector-review-application";
import { decideConnectorReviewItem } from "@/lib/admin/connector-review-decisions";
import { createStandingCalculationReviewRun } from "@/lib/admin/standings-calculation";
import { hasPermission, rolePermissions } from "@/lib/auth";
import type { AuthSession } from "@/lib/auth/types";
import { prisma } from "@/lib/prisma";

type JsonRecord = Record<string, unknown>;

const validationRunId = `standings-validation-${Date.now()}`;
const validationYear = 2200 + Math.floor(Math.random() * 500);
const actor = {
  id: "standings-production-validation",
  email: "standings-validation@hard-enduro-world.local",
  name: "Standings Production Validation",
};

const report: JsonRecord = {
  validationRunId,
  validationYear,
  migration: {},
  currentState: {},
  failClosed: {},
  controlledProposal: {},
  approvalApply: {},
  idempotency: {},
  staleState: {},
  publicVisibility: {},
  permissions: {},
  cleanup: {},
};

async function main() {
  const selectedSeason = await selectSeasonForInspection();
  if (!selectedSeason) throw new Error("No Season exists for validation.");
  await inspectCurrentState(selectedSeason.id);
  await verifyFailClosedCalculation(selectedSeason.id);
  await runControlledValidation();
  verifyPermissions();
  await cleanupValidationRecords();
  console.log(JSON.stringify(report, null, 2));
}

async function selectSeasonForInspection() {
  return prisma.season.findFirst({
    orderBy: { year: "desc" },
    where: {
      events: {
        some: {
          results: { some: {} },
        },
      },
    },
    select: { id: true, name: true, year: true },
  });
}

async function inspectCurrentState(seasonId: string) {
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    select: { id: true, name: true, year: true },
  });
  if (!season) throw new Error("Selected season disappeared.");
  const eventIds = (
    await prisma.event.findMany({
      where: { seasonId },
      select: { id: true },
    })
  ).map((event) => event.id);
  const [
    standingCount,
    resultCount,
    eligibleResultCount,
    archivedResultCount,
    resultsWithPoints,
    resultsWithoutPoints,
    standingReviewCount,
    standingVersionCount,
  ] = await Promise.all([
    prisma.standing.count({ where: { seasonId } }),
    prisma.result.count({ where: { eventId: { in: eventIds } } }),
    prisma.result.count({ where: { eventId: { in: eventIds }, archivedAt: null } }),
    prisma.result.count({
      where: { eventId: { in: eventIds }, archivedAt: { not: null } },
    }),
    prisma.result.count({
      where: { eventId: { in: eventIds }, archivedAt: null, points: { not: null } },
    }),
    prisma.result.count({
      where: { eventId: { in: eventIds }, archivedAt: null, points: null },
    }),
    prisma.connectorReviewItem.count({
      where: {
        suggestedAction: {
          in: [
            "NEW_STANDING",
            "UPDATE_STANDING",
            "UNCHANGED_STANDING",
            "STANDING_INVALID",
          ],
        },
      },
    }),
    prisma.dataVersion.count({ where: { entityType: "Standing" } }),
  ]);

  report.currentState = {
    season,
    standingCount,
    resultCount,
    eligibleResultCount,
    archivedResultCount,
    resultsWithPoints,
    resultsWithoutPoints,
    standingReviewCount,
    standingVersionCount,
  };
}

async function verifyFailClosedCalculation(seasonId: string) {
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    include: {
      events: {
        include: {
          results: {
            where: { archivedAt: null },
            select: {
              id: true,
              className: true,
              points: true,
              riderId: true,
              eventId: true,
            },
          },
        },
      },
    },
  });
  if (!season) throw new Error("Selected season disappeared.");
  const beforeStandingCount = await prisma.standing.count({ where: { seasonId } });
  const resultRows = season.events.flatMap((event) => event.results);
  const resultIds = resultRows.map((result) => result.id).sort();
  const missingPoints = resultRows
    .filter((result) => result.points === null)
    .map((result) => result.id)
    .sort();

  const run = await createStandingCalculationReviewRun({ seasonId });
  const snapshot = await prisma.connectorSnapshot.findUniqueOrThrow({
    where: { id: run.snapshotId },
  });
  const reviewItems = await prisma.connectorReviewItem.findMany({
    where: { snapshotId: run.snapshotId },
    select: {
      id: true,
      suggestedAction: true,
      proposedValues: true,
      reviewStatus: true,
      applicationStatus: true,
    },
  });
  const afterStandingCount = await prisma.standing.count({ where: { seasonId } });
  const actionCounts = countActions(reviewItems);
  const applyableProposalCount = reviewItems.filter(
    (item) =>
      validateConnectorReviewApplicationPolicy({
        reviewStatus: "APPROVED",
        applicationStatus: "NOT_APPLIED",
        suggestedAction: item.suggestedAction,
        changedFields: [],
        proposedValues: item.proposedValues as JsonRecord | null,
      }).ok,
  ).length;

  report.failClosed = {
    resultIds,
    missingPoints,
    validationIssues: getRecordArray(snapshot.diagnostics, "validationIssues"),
    unresolvedTies: getRecordArray(snapshot.diagnostics, "validationIssues").filter(
      (issue) => issue.code === "unresolved-tie",
    ),
    actionCounts,
    applyableProposalCount,
    snapshotId: snapshot.id,
    snapshotChecksum: snapshot.payloadChecksum,
    standingRowsWritten: afterStandingCount - beforeStandingCount,
  };
}

async function runControlledValidation() {
  const beforeCounts = await countCoreRows();
  const setup = await createControlledSeason();
  const firstRun = await createStandingCalculationReviewRun({ seasonId: setup.seasonId });
  const secondRun = await createStandingCalculationReviewRun({
    seasonId: setup.seasonId,
  });
  const firstSnapshot = await prisma.connectorSnapshot.findUniqueOrThrow({
    where: { id: firstRun.snapshotId },
  });
  const applyableReview = await prisma.connectorReviewItem.findFirstOrThrow({
    where: {
      snapshotId: firstRun.snapshotId,
      suggestedAction: "NEW_STANDING",
      reviewStatus: "PENDING",
      proposedValues: { path: ["riderId"], equals: setup.riderAId },
    },
  });
  const beforeApproval = await getStandingApplyState(setup.seasonId, applyableReview.id);

  const approval = await decideConnectorReviewItem({
    reviewItemId: applyableReview.id,
    expectedStatus: "PENDING",
    expectedVersion: applyableReview.version,
    decision: "APPROVED",
    actor,
    note: "Controlled standings production validation approval.",
  });
  const afterApproval = await getStandingApplyState(setup.seasonId, applyableReview.id);
  const approvedReview = await prisma.connectorReviewItem.findUniqueOrThrow({
    where: { id: applyableReview.id },
  });
  const resultCountsBeforeApply = await countResultRows();
  const apply = await applyConnectorReviewItem({
    reviewItemId: approvedReview.id,
    expectedApplicationStatus: "NOT_APPLIED",
    expectedApplicationVersion: approvedReview.applicationVersion,
    actor,
    note: "Controlled standings production validation apply.",
  });
  const resultCountsAfterApply = await countResultRows();
  const afterApply = await getStandingApplyState(setup.seasonId, applyableReview.id);
  const appliedReview = await prisma.connectorReviewItem.findUniqueOrThrow({
    where: { id: applyableReview.id },
  });
  const appliedStanding = appliedReview.appliedStandingId
    ? await prisma.standing.findUnique({ where: { id: appliedReview.appliedStandingId } })
    : null;
  const standingVersion = appliedStanding
    ? await prisma.dataVersion.findFirst({
        where: { entityType: "Standing", entityId: appliedStanding.id },
        orderBy: { createdAt: "desc" },
      })
    : null;
  const reviewVersions = await prisma.dataVersion.findMany({
    where: { entityType: "ConnectorReviewItem", entityId: applyableReview.id },
    orderBy: { createdAt: "asc" },
  });
  const repeatedApplyBeforeVersions = await prisma.dataVersion.count({
    where: { entityType: "Standing", entityId: appliedStanding?.id ?? "" },
  });
  const repeatedApply = await applyConnectorReviewItem({
    reviewItemId: approvedReview.id,
    expectedApplicationStatus: "NOT_APPLIED",
    expectedApplicationVersion: approvedReview.applicationVersion,
    actor,
    note: "Repeated apply validation.",
  });
  const repeatedApplyAfterVersions = await prisma.dataVersion.count({
    where: { entityType: "Standing", entityId: appliedStanding?.id ?? "" },
  });
  const afterApplyRepeatRun = await createStandingCalculationReviewRun({
    seasonId: setup.seasonId,
  });

  report.controlledProposal = {
    resultIdsUsed: setup.resultIds,
    storedPointsUsed: setup.storedPoints,
    calculatedStandingFields: applyableReview.proposedValues,
    snapshotId: firstSnapshot.id,
    snapshotChecksum: firstSnapshot.payloadChecksum,
    reviewItemId: applyableReview.id,
    suggestedAction: applyableReview.suggestedAction,
    applyEligibility: (applyableReview.proposedValues as JsonRecord | null)
      ?.applyEligible,
    inputRowsRecoverableFromSnapshot:
      getRecordArray(firstSnapshot.normalizedPayload, "inputResults").length > 0,
  };
  report.approvalApply = {
    beforeApproval,
    approval,
    afterApproval,
    apply,
    afterApply,
    appliedStanding,
    appliedStandingId: appliedReview.appliedStandingId,
    resultCountsBeforeApply,
    resultCountsAfterApply,
    resultRowsModifiedByApply:
      resultCountsBeforeApply.resultCount !== resultCountsAfterApply.resultCount ||
      resultCountsBeforeApply.stageResultCount !==
        resultCountsAfterApply.stageResultCount,
  };
  report.dataVersionEvidence = standingVersion
    ? {
        id: standingVersion.id,
        entityType: standingVersion.entityType,
        entityId: standingVersion.entityId,
        operation: standingVersion.action,
        previous: standingVersion.previous,
        next: standingVersion.next,
        previousChecksum: stableHash(standingVersion.previous),
        resultingChecksum: stableHash(standingVersion.next),
        actor: standingVersion.createdBy,
        timestamp: standingVersion.createdAt,
        relatedReviewItemId: applyableReview.id,
        reviewDataVersionCount: reviewVersions.length,
      }
    : null;
  report.idempotency = {
    beforeApplyRepeat: {
      firstRun,
      secondRun,
      snapshotReused: firstRun.snapshotId === secondRun.snapshotId,
    },
    afterApplyRepeat: afterApplyRepeatRun,
    repeatedApply,
    standingVersionCountBeforeRepeatedApply: repeatedApplyBeforeVersions,
    standingVersionCountAfterRepeatedApply: repeatedApplyAfterVersions,
    duplicateStandingRowsCreated:
      (await prisma.standing.count({
        where: {
          seasonId: setup.seasonId,
          riderId: setup.riderAId,
          className: null,
        },
      })) - 1,
  };

  await runStaleStateValidation(setup);
  report.publicVisibility = {
    publicQuery:
      "prisma.season.findMany({ include: { standings: { orderBy: [{ position: 'asc' }, { points: 'desc' }], include: { rider: ... } } } })",
    calculationOnlyStandingCount: beforeApproval.standingCount,
    approvalOnlyStandingCount: afterApproval.standingCount,
    afterApplyStandingCount: afterApply.standingCount,
    explicitApplyChangesPublicStandings:
      afterApply.standingCount > afterApproval.standingCount,
    limitation:
      "Standing has no visibility or archive fields; persisted Standing rows are public through /standings.",
  };
  report.recordsRemainingBeforeCleanup = {
    beforeCounts,
    afterCounts: await countCoreRows(),
    validationRecordIds: setup,
  };
}

async function runStaleStateValidation(
  setup: Awaited<ReturnType<typeof createControlledSeason>>,
) {
  await prisma.result.update({
    where: { id: setup.resultAId },
    data: { points: 30 },
  });
  const updateRun = await createStandingCalculationReviewRun({
    seasonId: setup.seasonId,
  });
  const updateReview = await prisma.connectorReviewItem.findFirstOrThrow({
    where: {
      snapshotId: updateRun.snapshotId,
      suggestedAction: "UPDATE_STANDING",
      currentStandingId: { not: null },
      proposedValues: { path: ["riderId"], equals: setup.riderAId },
    },
  });
  const updateApproval = await decideConnectorReviewItem({
    reviewItemId: updateReview.id,
    expectedStatus: "PENDING",
    expectedVersion: updateReview.version,
    decision: "APPROVED",
    actor,
    note: "Controlled stale-state validation approval.",
  });
  const reviewedState = updateReview.currentValues;
  const standingBeforeMutation = await prisma.standing.findUniqueOrThrow({
    where: { id: updateReview.currentStandingId! },
  });
  await prisma.standing.update({
    where: { id: updateReview.currentStandingId! },
    data: { points: 999 },
  });
  const changedState = await prisma.standing.findUniqueOrThrow({
    where: { id: updateReview.currentStandingId! },
  });
  const approvedUpdateReview = await prisma.connectorReviewItem.findUniqueOrThrow({
    where: { id: updateReview.id },
  });
  const standingVersionBefore = await prisma.dataVersion.count({
    where: { entityType: "Standing", entityId: updateReview.currentStandingId! },
  });
  const staleApply = await applyConnectorReviewItem({
    reviewItemId: updateReview.id,
    expectedApplicationStatus: "NOT_APPLIED",
    expectedApplicationVersion: approvedUpdateReview.applicationVersion,
    actor,
    note: "Controlled stale-state validation apply.",
  });
  const standingAfterRejection = await prisma.standing.findUniqueOrThrow({
    where: { id: updateReview.currentStandingId! },
  });
  const reviewAfterRejection = await prisma.connectorReviewItem.findUniqueOrThrow({
    where: { id: updateReview.id },
  });
  const standingVersionAfter = await prisma.dataVersion.count({
    where: { entityType: "Standing", entityId: updateReview.currentStandingId! },
  });

  report.staleState = {
    updateRun,
    updateApproval,
    reviewItemId: updateReview.id,
    reviewedCurrentState: reviewedState,
    reviewedCurrentStateChecksum: stableHash(reviewedState),
    standingBeforeMutation,
    changedState,
    changedStateChecksum: stableHash(toStandingState(changedState)),
    staleApply,
    rejectionReason: reviewAfterRejection.applicationError,
    reviewApplicationStatus: reviewAfterRejection.applicationStatus,
    standingAfterRejection,
    partialWrites:
      standingAfterRejection.points !== changedState.points ||
      standingVersionAfter !== standingVersionBefore,
    standingVersionCountBefore: standingVersionBefore,
    standingVersionCountAfter: standingVersionAfter,
  };
}

async function createControlledSeason() {
  const season = await prisma.season.create({
    data: {
      year: validationYear,
      name: `Standings Validation ${validationYear}`,
      status: "ACTIVE",
    },
  });
  const event = await prisma.event.create({
    data: {
      seasonId: season.id,
      name: `Standings Validation Event ${validationRunId}`,
      slug: validationRunId,
      startDate: new Date("2099-01-01T00:00:00.000Z"),
      endDate: new Date("2099-01-02T00:00:00.000Z"),
      status: "COMPLETED",
      visibility: "DRAFT",
    },
  });
  const riderA = await prisma.rider.create({
    data: {
      firstName: "Standings",
      lastName: "Validation A",
      slug: `${validationRunId}-rider-a`,
      visibility: "PRIVATE",
    },
  });
  const riderB = await prisma.rider.create({
    data: {
      firstName: "Standings",
      lastName: "Validation B",
      slug: `${validationRunId}-rider-b`,
      visibility: "PRIVATE",
    },
  });
  const resultA = await prisma.result.create({
    data: {
      eventId: event.id,
      riderId: riderA.id,
      overallPosition: 1,
      className: null,
      points: 20,
      status: "FINISHED",
      notes: validationRunId,
    },
  });
  const resultB = await prisma.result.create({
    data: {
      eventId: event.id,
      riderId: riderB.id,
      overallPosition: 2,
      className: null,
      points: 17,
      status: "FINISHED",
      notes: validationRunId,
    },
  });

  return {
    seasonId: season.id,
    eventId: event.id,
    riderAId: riderA.id,
    riderBId: riderB.id,
    resultAId: resultA.id,
    resultBId: resultB.id,
    resultIds: [resultA.id, resultB.id],
    storedPoints: {
      [resultA.id]: resultA.points,
      [resultB.id]: resultB.points,
    },
  };
}

async function getStandingApplyState(seasonId: string, reviewItemId: string) {
  const [standingCount, publicRows, standingVersionCount, reviewVersionCount, review] =
    await Promise.all([
      prisma.standing.count({ where: { seasonId } }),
      prisma.standing.findMany({
        where: { seasonId },
        orderBy: [{ position: "asc" }, { points: "desc" }],
      }),
      prisma.dataVersion.count({ where: { entityType: "Standing" } }),
      prisma.dataVersion.count({
        where: { entityType: "ConnectorReviewItem", entityId: reviewItemId },
      }),
      prisma.connectorReviewItem.findUnique({ where: { id: reviewItemId } }),
    ]);
  return {
    reviewStatus: review?.reviewStatus,
    applicationStatus: review?.applicationStatus,
    appliedStandingId: review?.appliedStandingId,
    standingCount,
    publicRows,
    standingVersionCount,
    reviewVersionCount,
  };
}

async function countCoreRows() {
  const [
    seasonCount,
    eventCount,
    riderCount,
    resultCount,
    stageResultCount,
    standingCount,
    reviewCount,
    snapshotCount,
    standingVersionCount,
  ] = await Promise.all([
    prisma.season.count(),
    prisma.event.count(),
    prisma.rider.count(),
    prisma.result.count(),
    prisma.stageResult.count(),
    prisma.standing.count(),
    prisma.connectorReviewItem.count(),
    prisma.connectorSnapshot.count(),
    prisma.dataVersion.count({ where: { entityType: "Standing" } }),
  ]);
  return {
    seasonCount,
    eventCount,
    riderCount,
    resultCount,
    stageResultCount,
    standingCount,
    reviewCount,
    snapshotCount,
    standingVersionCount,
  };
}

async function countResultRows() {
  const [resultCount, stageResultCount] = await Promise.all([
    prisma.result.count(),
    prisma.stageResult.count(),
  ]);
  return { resultCount, stageResultCount };
}

function verifyPermissions() {
  const ownerSession = session("owner");
  const adminSession = session("admin");
  const reviewerSession = session("reviewer");
  const editorSession = session("editor");
  const viewerSession = session("viewer");
  report.permissions = {
    runCalculation: {
      owner: hasPermission(ownerSession, "calculations:review"),
      admin: hasPermission(adminSession, "calculations:review"),
      reviewer: hasPermission(reviewerSession, "calculations:review"),
      editor: hasPermission(editorSession, "calculations:review"),
      viewer: hasPermission(viewerSession, "calculations:review"),
      serverAction:
        "app/admin/standings/actions.ts checks getAuthSession() and hasPermission(session, 'calculations:review').",
    },
    approveRejectApply: {
      owner: hasPermission(ownerSession, "review:approve"),
      admin: hasPermission(adminSession, "review:approve"),
      reviewer: hasPermission(reviewerSession, "review:approve"),
      editor: hasPermission(editorSession, "review:approve"),
      viewer: hasPermission(viewerSession, "review:approve"),
      serverAction:
        "app/admin/review/actions.ts checks getAuthSession() and hasPermission(session, 'review:approve').",
    },
  };
}

function session(
  role: "owner" | "admin" | "reviewer" | "editor" | "viewer",
): AuthSession {
  return {
    isAuthenticated: true,
    user: {
      id: `${role}-id`,
      email: `${role}@example.com`,
      name: role,
      role,
      provider: "supabase",
      lastActiveAt: null,
    },
    role,
    permissions: rolePermissions[role],
    provider: "supabase" as const,
    authStatus: "configured" as const,
    roleSource: "supabase-user-profile" as const,
    expiresAt: null,
  };
}

async function cleanupValidationRecords() {
  const validationSnapshots = await prisma.connectorSnapshot.findMany({
    where: { season: validationYear },
    select: { id: true },
  });
  const snapshotIds = validationSnapshots.map((snapshot) => snapshot.id);
  const validationReviewItems = await prisma.connectorReviewItem.findMany({
    where: {
      OR: [
        { snapshotId: { in: snapshotIds } },
        { connectorKey: "standings-calculation", season: validationYear },
      ],
    },
    select: { id: true, appliedStandingId: true, currentStandingId: true },
  });
  const reviewItemIds = validationReviewItems.map((item) => item.id);
  const standingIds = Array.from(
    new Set(
      validationReviewItems
        .flatMap((item) => [item.appliedStandingId, item.currentStandingId])
        .filter(Boolean) as string[],
    ),
  );
  const seasons = await prisma.season.findMany({
    where: { year: validationYear },
    include: { events: true },
  });
  const eventIds = seasons.flatMap((season) => season.events.map((event) => event.id));
  const riderIds = (
    await prisma.rider.findMany({
      where: { slug: { startsWith: validationRunId } },
      select: { id: true },
    })
  ).map((rider) => rider.id);

  await prisma.dataVersion.deleteMany({
    where: {
      OR: [
        { entityType: "Standing", entityId: { in: standingIds } },
        { entityType: "ConnectorReviewItem", entityId: { in: reviewItemIds } },
      ],
    },
  });
  await prisma.connectorReviewItem.deleteMany({
    where: { id: { in: reviewItemIds } },
  });
  await prisma.connectorSnapshot.deleteMany({
    where: { id: { in: snapshotIds } },
  });
  await prisma.standing.deleteMany({
    where: {
      OR: [
        { id: { in: standingIds } },
        { seasonId: { in: seasons.map((season) => season.id) } },
      ],
    },
  });
  await prisma.result.deleteMany({ where: { eventId: { in: eventIds } } });
  await prisma.event.deleteMany({ where: { id: { in: eventIds } } });
  await prisma.rider.deleteMany({ where: { id: { in: riderIds } } });
  await prisma.season.deleteMany({ where: { year: validationYear } });

  report.cleanup = {
    snapshotIds,
    reviewItemIds,
    standingIds,
    eventIds,
    riderIds,
    seasonYear: validationYear,
    remainingValidationSeasons: await prisma.season.count({
      where: { year: validationYear },
    }),
    remainingValidationEvents: await prisma.event.count({
      where: { id: { in: eventIds } },
    }),
    remainingValidationRiders: await prisma.rider.count({
      where: { id: { in: riderIds } },
    }),
    remainingValidationResults: await prisma.result.count({
      where: { eventId: { in: eventIds } },
    }),
    remainingValidationStandings: await prisma.standing.count({
      where: { id: { in: standingIds } },
    }),
    remainingValidationReviews: await prisma.connectorReviewItem.count({
      where: { id: { in: reviewItemIds } },
    }),
    remainingValidationSnapshots: await prisma.connectorSnapshot.count({
      where: { id: { in: snapshotIds } },
    }),
  };
}

function countActions(items: Array<{ suggestedAction: string }>) {
  return items.reduce<Record<string, number>>((counts, item) => {
    counts[item.suggestedAction] = (counts[item.suggestedAction] ?? 0) + 1;
    return counts;
  }, {});
}

function getRecordArray(value: unknown, key: string): JsonRecord[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const raw = (value as JsonRecord)[key];
  return Array.isArray(raw) ? (raw as JsonRecord[]) : [];
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
  };
}

function stableHash(value: unknown) {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map(
        (key) => `${JSON.stringify(key)}:${stableStringify((value as JsonRecord)[key])}`,
      )
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
