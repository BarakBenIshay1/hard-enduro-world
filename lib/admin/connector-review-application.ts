import { createHash } from "node:crypto";
import {
  Prisma,
  type ConnectorReviewApplicationStatus,
  type EventStatus,
  type ResultStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AuthUser } from "@/lib/auth";
import {
  parseComponentPointsTables,
  parseComponentEventFormats,
  parsePointsMapping,
  pointsForPosition,
  validateOfficialRegulation,
} from "@/lib/regulations/championship-regulations";
import { componentPointsRollupConnectorKey } from "@/lib/admin/component-points-rollup";
import { regulationComponentPointsConnectorKey } from "@/lib/admin/regulation-component-points";
import { regulationPointsConnectorKey } from "@/lib/admin/regulation-points";

type PrismaTransaction = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;
type PrismaExecutor = typeof prisma | PrismaTransaction;

export type ConnectorReviewApplyInput = {
  reviewItemId: string;
  expectedApplicationStatus: ConnectorReviewApplicationStatus;
  expectedApplicationVersion: number;
  actor: Pick<AuthUser, "id" | "email" | "name">;
  note?: string | null;
};

export type ConnectorReviewApplyResult =
  | {
      ok: true;
      reviewItemId: string;
      eventId: string;
      status: "APPLIED";
      message: string;
    }
  | {
      ok: false;
      code: "already-applied" | "conflict" | "invalid" | "not-found" | "unsupported";
      message: string;
    };

type ReviewForApplication = NonNullable<
  Awaited<ReturnType<typeof loadReviewForApplication>>
>;

type ApplicationContext = {
  review: ReviewForApplication;
  changedFields: string[];
  proposed: Record<string, unknown>;
  current: Record<string, unknown> | null;
};

export type ConnectorReviewApplicationPolicyInput = {
  reviewStatus: string;
  applicationStatus: string;
  suggestedAction: string;
  changedFields: string[];
  proposedValues: Record<string, unknown> | null;
};

export type ConnectorReviewApplicationPolicyResult =
  | { ok: true; eventStatus?: EventStatus }
  | { ok: false; reason: string };

const allowedProposalFields = new Set([
  "sourceEventId",
  "seasonYear",
  "eventName",
  "slugCandidate",
  "country",
  "countryCode",
  "location",
  "venue",
  "startDate",
  "endDate",
  "startDatePrecision",
  "endDatePrecision",
  "officialUrl",
  "raceStatusCandidate",
]);

const allowedChangedFields = new Set([
  "event",
  "name",
  "slug",
  "country",
  "countryCode",
  "location",
  "venue",
  "startDate",
  "endDate",
  "officialUrl",
  "status",
]);

const resultReviewActions = new Set(["NEW_RESULT", "UPDATE_RESULT"]);
const resultPointComponentReviewActions = new Set([
  "NEW_RESULT_POINT_COMPONENT",
  "UPDATE_RESULT_POINT_COMPONENT",
]);
const stageResultReviewActions = new Set(["NEW_STAGE_RESULT", "UPDATE_STAGE_RESULT"]);
const standingReviewActions = new Set(["NEW_STANDING", "UPDATE_STANDING"]);

const allowedResultProposalFields = new Set([
  "entityType",
  "sourceRowId",
  "sourceId",
  "resultId",
  "eventId",
  "riderId",
  "manufacturerId",
  "motorcycleId",
  "classificationScope",
  "className",
  "overallPosition",
  "points",
  "status",
  "totalTimeText",
  "gapToLeaderText",
  "gapToPreviousText",
  "officialRawRow",
  "officialSourceUrl",
  "eventSlug",
  "eventName",
  "riderSlug",
  "riderName",
  "manufacturer",
  "motorcycle",
  "team",
  "entityMatches",
  "validationWarnings",
  "applyEligible",
  "payloadType",
  "seasonId",
  "currentPoints",
  "manualCurrentValue",
  "eventFormatKey",
  "eventFormatMatchingMethod",
  "requiredComponentTables",
  "optionalComponentTables",
  "oneOfComponentTables",
  "maximumEventPoints",
  "componentIds",
  "components",
  "componentStates",
  "componentChecksums",
  "componentReviewItemIds",
  "componentSourceLinkIds",
  "componentDataVersionIds",
  "calculationVersion",
  "calculationTimestamp",
  "currentEntityState",
  "proposedEntityState",
  "exactInputState",
  "regulationId",
  "regulationVersion",
  "regulationChecksum",
  "regulationSourceSnapshotId",
  "regulationMappingEntry",
  "regulationSource",
  "regulationSection",
]);

const allowedResultChangedFields = new Set([
  "result",
  "eventId",
  "riderId",
  "motorcycleId",
  "manufacturerId",
  "className",
  "overallPosition",
  "points",
  "status",
  "totalTimeText",
  "gapToLeaderText",
  "gapToPreviousText",
]);

const allowedResultPointComponentProposalFields = new Set([
  "entityType",
  "resultPointComponentId",
  "resultId",
  "eventId",
  "riderId",
  "stageResultId",
  "raceStageId",
  "componentType",
  "classificationScope",
  "className",
  "inputAuthorityType",
  "position",
  "points",
  "inputStatus",
  "currentComponentPoints",
  "proposedComponentPoints",
  "regulationId",
  "regulationVersion",
  "regulationChecksum",
  "regulationTableKey",
  "regulationMappingEntry",
  "regulationSource",
  "regulationSourceSnapshotId",
  "inputResultSourceSnapshotId",
  "inputDataVersionId",
  "inputAudit",
  "sourceRowIdentifier",
  "matchingMethod",
  "stageAliasOrFallback",
  "validationWarnings",
  "currentEntityState",
  "proposedEntityState",
  "applyEligible",
  "calculationTimestamp",
  "connectorVersion",
  "componentWithoutStageResultRationale",
  "exactInputState",
  "unchanged",
]);

const allowedResultPointComponentChangedFields = new Set([
  "resultPointComponent",
  "position",
  "points",
  "regulation",
  "sourceLineage",
  "regulationVersion",
  "regulationChecksum",
  "sourceSnapshotId",
]);

const allowedStageResultProposalFields = new Set([
  "entityType",
  "sourceRowId",
  "sourceStageId",
  "sourceStageName",
  "sourceId",
  "eventId",
  "stageId",
  "riderId",
  "manufacturerId",
  "motorcycleId",
  "className",
  "overallPosition",
  "status",
  "totalTimeMs",
  "totalTimeText",
  "gapToLeaderText",
  "gapToPreviousText",
  "officialRawRow",
  "officialSourceUrl",
  "eventSlug",
  "eventName",
  "stageSlug",
  "stageOrder",
  "riderSlug",
  "riderName",
  "manufacturer",
  "motorcycle",
  "team",
  "stageMatch",
  "entityMatches",
  "validationWarnings",
  "applyEligible",
]);

const allowedStageResultChangedFields = new Set([
  "stageResult",
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
]);

const allowedStandingProposalFields = new Set([
  "entityType",
  "seasonId",
  "riderId",
  "riderName",
  "className",
  "position",
  "points",
  "wins",
  "podiums",
  "starts",
  "dnfs",
  "pointsSystemId",
  "calculationVersion",
  "inputResultIds",
  "applyEligible",
]);

const allowedStandingChangedFields = new Set([
  "standing",
  "seasonId",
  "riderId",
  "position",
  "points",
  "wins",
  "podiums",
  "starts",
  "dnfs",
]);

const countryCodeAliases: Record<string, string> = {
  FRA: "FR",
  PRT: "PT",
  USA: "US",
  TUR: "TR",
  LSO: "LS",
  ITA: "IT",
  ESP: "ES",
  SWE: "SE",
};

export async function applyConnectorReviewItem(
  input: ConnectorReviewApplyInput,
): Promise<ConnectorReviewApplyResult> {
  try {
    return await applyConnectorReviewItemTransaction(input);
  } catch (error) {
    await markApplicationFailed(input, sanitizeError(error));
    return {
      ok: false,
      code: "invalid",
      message: sanitizeError(error),
    };
  }
}

export function validateConnectorReviewApplicationPolicy(
  input: ConnectorReviewApplicationPolicyInput,
): ConnectorReviewApplicationPolicyResult {
  if (input.reviewStatus !== "APPROVED") {
    return { ok: false, reason: "Only APPROVED review items can be applied." };
  }
  if (!["NOT_APPLIED", "APPLY_FAILED"].includes(input.applicationStatus)) {
    return { ok: false, reason: "Review item is not in an applyable state." };
  }
  if (input.suggestedAction === "SOURCE_REMOVED") {
    return { ok: false, reason: "SOURCE_REMOVED cannot be applied." };
  }
  if (input.suggestedAction === "MANUAL_REVIEW") {
    return { ok: false, reason: "MANUAL_REVIEW cannot be directly applied." };
  }
  if (!input.proposedValues) {
    return { ok: false, reason: "Proposal payload is missing." };
  }
  if (resultReviewActions.has(input.suggestedAction)) {
    return validateResultApplicationPolicy(input);
  }
  if (resultPointComponentReviewActions.has(input.suggestedAction)) {
    return validateResultPointComponentApplicationPolicy(input);
  }
  if (stageResultReviewActions.has(input.suggestedAction)) {
    return validateStageResultApplicationPolicy(input);
  }
  if (standingReviewActions.has(input.suggestedAction)) {
    return validateStandingApplicationPolicy(input);
  }
  for (const field of Object.keys(input.proposedValues)) {
    if (!allowedProposalFields.has(field)) {
      return { ok: false, reason: `Unsupported proposal field: ${field}` };
    }
  }
  for (const field of input.changedFields) {
    if (!allowedChangedFields.has(field)) {
      return { ok: false, reason: `Unsupported changed field: ${field}` };
    }
  }

  try {
    const status = getString(input.proposedValues, "raceStatusCandidate");
    return { ok: true, eventStatus: status ? mapEventStatus(status) : undefined };
  } catch (error) {
    return { ok: false, reason: sanitizeError(error) };
  }
}

async function applyConnectorReviewItemTransaction(
  input: ConnectorReviewApplyInput,
): Promise<ConnectorReviewApplyResult> {
  return prisma.$transaction(
    async (tx) => {
      const review = await loadReviewForApplication(input.reviewItemId, tx);
      if (!review) return failure("not-found", "Review item was not found.");

      if (review.reviewStatus !== "APPROVED") {
        return failure("invalid", "Only APPROVED review items can be applied.");
      }

      if (review.applicationStatus === "APPLIED") {
        return failure("already-applied", "This review item has already been applied.");
      }

      if (
        !["NOT_APPLIED", "APPLY_FAILED"].includes(review.applicationStatus) ||
        review.applicationStatus !== input.expectedApplicationStatus ||
        review.applicationVersion !== input.expectedApplicationVersion
      ) {
        return failure("conflict", "Application state changed. Reload before applying.");
      }

      const locked = await tx.connectorReviewItem.updateMany({
        where: {
          id: review.id,
          reviewStatus: "APPROVED",
          applicationStatus: input.expectedApplicationStatus,
          applicationVersion: input.expectedApplicationVersion,
        },
        data: {
          applicationStatus: "APPLYING",
          applicationAttemptCount: { increment: 1 },
          applicationError: null,
          applicationVersion: { increment: 1 },
        },
      });

      if (locked.count !== 1) {
        return failure("conflict", "Application state changed. Reload before applying.");
      }

      const context = buildApplicationContext(review);
      if (resultReviewActions.has(review.suggestedAction)) {
        return applyResultReviewItem({
          context,
          input,
          tx,
        });
      }
      if (resultPointComponentReviewActions.has(review.suggestedAction)) {
        return applyResultPointComponentReviewItem({
          context,
          input,
          tx,
        });
      }
      if (stageResultReviewActions.has(review.suggestedAction)) {
        return applyStageResultReviewItem({
          context,
          input,
          tx,
        });
      }
      if (standingReviewActions.has(review.suggestedAction)) {
        return applyStandingReviewItem({
          context,
          input,
          tx,
        });
      }

      validateApplicationContext(context);

      if (review.suggestedAction === "SOURCE_REMOVED") {
        throw new Error(
          "SOURCE_REMOVED cannot be applied until a safe removal policy exists.",
        );
      }
      if (review.suggestedAction === "MANUAL_REVIEW") {
        throw new Error("MANUAL_REVIEW cannot be directly applied.");
      }

      const previousEventState =
        review.suggestedAction === "UPDATE_EVENT"
          ? await loadCurrentEventForUpdate(context, tx)
          : null;
      const expectedChecksum = createStableChecksum(previousEventState ?? null);

      let event;
      if (review.suggestedAction === "NEW_EVENT") {
        event = await createEventFromReview(context, tx);
      } else if (review.suggestedAction === "UPDATE_EVENT") {
        event = await updateEventFromReview(context, previousEventState, tx);
      } else {
        throw new Error(`Unsupported review action: ${review.suggestedAction}`);
      }

      const resultingEventState = toAuditedEventState(event);
      const resultingChecksum = createStableChecksum(resultingEventState);
      const appliedAt = new Date();

      await tx.connectorReviewItem.update({
        where: { id: review.id },
        data: {
          applicationStatus: "APPLIED",
          appliedAt,
          appliedByUserId: input.actor.id,
          appliedByUserEmail: input.actor.email,
          applicationNote: input.note?.trim() || null,
          applicationError: null,
          appliedEventId: event.id,
          expectedCurrentStateChecksum: expectedChecksum,
          resultingEventStateChecksum: resultingChecksum,
          applicationVersion: { increment: 1 },
        },
      });

      await tx.dataVersion.create({
        data: {
          entityType: "Event",
          entityId: event.id,
          action: review.suggestedAction === "NEW_EVENT" ? "CREATE" : "UPDATE",
          previous: (previousEventState ?? null) as Prisma.InputJsonValue,
          next: resultingEventState as Prisma.InputJsonValue,
          sourceUrl: getString(context.proposed, "officialUrl"),
          createdBy: input.actor.id,
        },
      });

      await tx.dataVersion.create({
        data: {
          entityType: "ConnectorReviewItem",
          entityId: review.id,
          action: "MANUAL_EDIT",
          previous: {
            applicationStatus: input.expectedApplicationStatus,
            applicationVersion: input.expectedApplicationVersion,
          },
          next: {
            applicationStatus: "APPLIED",
            appliedEventId: event.id,
            appliedByUserId: input.actor.id,
            appliedByUserEmail: input.actor.email,
            appliedAt: appliedAt.toISOString(),
            changedFields: context.changedFields,
            suggestedAction: review.suggestedAction,
          },
          sourceUrl: getString(context.proposed, "officialUrl"),
          createdBy: input.actor.id,
        },
      });

      return {
        ok: true,
        reviewItemId: review.id,
        eventId: event.id,
        status: "APPLIED",
        message: "Approved review item was applied to one Event record.",
      };
    },
    { maxWait: 10_000, timeout: 60_000 },
  );
}

async function markApplicationFailed(input: ConnectorReviewApplyInput, message: string) {
  await prisma.$transaction(async (tx) => {
    await tx.connectorReviewItem.updateMany({
      where: {
        id: input.reviewItemId,
        reviewStatus: "APPROVED",
      },
      data: {
        applicationStatus: "APPLY_FAILED",
        applicationError: message,
        applicationAttemptCount: { increment: 1 },
        applicationVersion: { increment: 1 },
      },
    });

    await tx.dataVersion.create({
      data: {
        entityType: "ConnectorReviewItem",
        entityId: input.reviewItemId,
        action: "MANUAL_EDIT",
        previous: {
          applicationStatus: input.expectedApplicationStatus,
        },
        next: {
          applicationStatus: "APPLY_FAILED",
          failureReason: message,
        },
        createdBy: input.actor.id,
      },
    });
  });
}

function validateResultApplicationPolicy(
  input: ConnectorReviewApplicationPolicyInput,
): ConnectorReviewApplicationPolicyResult {
  if (!input.proposedValues) {
    return { ok: false, reason: "Proposal payload is missing." };
  }
  for (const field of Object.keys(input.proposedValues)) {
    if (!allowedResultProposalFields.has(field)) {
      return { ok: false, reason: `Unsupported Result proposal field: ${field}` };
    }
  }
  for (const field of input.changedFields) {
    if (!allowedResultChangedFields.has(field)) {
      return { ok: false, reason: `Unsupported Result changed field: ${field}` };
    }
  }
  if (input.proposedValues.entityType !== "Result") {
    return { ok: false, reason: "Proposal is not a Result proposal." };
  }
  if (input.proposedValues.applyEligible !== true) {
    return { ok: false, reason: "Proposal is blocked by validation warnings." };
  }
  if (
    input.changedFields.includes("points") &&
    !hasRegulationPointsLineage(input.proposedValues)
  ) {
    return {
      ok: false,
      reason: "Result points updates require verified regulation lineage.",
    };
  }
  try {
    mapResultStatus(getString(input.proposedValues, "status"));
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: sanitizeError(error) };
  }
}

function hasRegulationPointsLineage(proposedValues: Record<string, unknown>) {
  try {
    return Boolean(
      getString(proposedValues, "regulationId") &&
      typeof proposedValues.regulationVersion === "number" &&
      getString(proposedValues, "regulationChecksum") &&
      getString(proposedValues, "regulationSourceSnapshotId") &&
      toNullableRecord(proposedValues.regulationMappingEntry) &&
      toNullableRecord(proposedValues.regulationSource),
    );
  } catch {
    return false;
  }
}

function validateResultPointComponentApplicationPolicy(
  input: ConnectorReviewApplicationPolicyInput,
): ConnectorReviewApplicationPolicyResult {
  if (!input.proposedValues) {
    return { ok: false, reason: "Proposal payload is missing." };
  }
  for (const field of Object.keys(input.proposedValues)) {
    if (!allowedResultPointComponentProposalFields.has(field)) {
      return {
        ok: false,
        reason: `Unsupported ResultPointComponent proposal field: ${field}`,
      };
    }
  }
  for (const field of input.changedFields) {
    if (!allowedResultPointComponentChangedFields.has(field)) {
      return {
        ok: false,
        reason: `Unsupported ResultPointComponent changed field: ${field}`,
      };
    }
  }
  if (input.proposedValues.entityType !== "ResultPointComponent") {
    return { ok: false, reason: "Proposal is not a ResultPointComponent proposal." };
  }
  if (input.proposedValues.applyEligible !== true) {
    return { ok: false, reason: "Component proposal is blocked by validation warnings." };
  }
  if (!hasComponentRegulationLineage(input.proposedValues)) {
    return {
      ok: false,
      reason: "Component proposals require verified regulation lineage.",
    };
  }
  return { ok: true };
}

function hasComponentRegulationLineage(proposedValues: Record<string, unknown>) {
  try {
    return Boolean(
      getString(proposedValues, "regulationId") &&
      typeof proposedValues.regulationVersion === "number" &&
      getString(proposedValues, "regulationChecksum") &&
      getString(proposedValues, "regulationSourceSnapshotId") &&
      getString(proposedValues, "regulationTableKey") &&
      toNullableRecord(proposedValues.regulationMappingEntry) &&
      toNullableRecord(proposedValues.regulationSource),
    );
  } catch {
    return false;
  }
}

async function applyResultPointComponentReviewItem({
  context,
  input,
  tx,
}: {
  context: ApplicationContext;
  input: ConnectorReviewApplyInput;
  tx: PrismaTransaction;
}): Promise<ConnectorReviewApplyResult> {
  validateResultPointComponentApplicationContext(context);
  const previousState =
    context.review.suggestedAction === "UPDATE_RESULT_POINT_COMPONENT"
      ? await loadCurrentResultPointComponentForUpdate(context, tx)
      : null;
  const expectedChecksum = createStableChecksum(previousState ?? null);

  await validateResultPointComponentApplyContext(context, previousState, tx);

  const component =
    context.review.suggestedAction === "NEW_RESULT_POINT_COMPONENT"
      ? await createResultPointComponentFromReview(context, tx)
      : await updateResultPointComponentFromReview(context, previousState, tx);

  const resultingState = toAuditedResultPointComponentState(component);
  const resultingChecksum = createStableChecksum(resultingState);
  const appliedAt = new Date();
  const sourceUrl = getComponentSourceUrl(context);

  await createResultPointComponentSourceLink({
    context,
    componentId: component.id,
    sourceUrl,
    tx,
  });

  await tx.connectorReviewItem.update({
    where: { id: context.review.id },
    data: {
      applicationStatus: "APPLIED",
      appliedAt,
      appliedByUserId: input.actor.id,
      appliedByUserEmail: input.actor.email,
      applicationNote: input.note?.trim() || null,
      applicationError: null,
      appliedResultPointComponentId: component.id,
      expectedCurrentStateChecksum: expectedChecksum,
      resultingEventStateChecksum: resultingChecksum,
      applicationVersion: { increment: 1 },
    },
  });

  await tx.dataVersion.create({
    data: {
      entityType: "ResultPointComponent",
      entityId: component.id,
      action:
        context.review.suggestedAction === "NEW_RESULT_POINT_COMPONENT"
          ? "CREATE"
          : "UPDATE",
      previous: (previousState ?? null) as Prisma.InputJsonValue,
      next: resultingState as Prisma.InputJsonValue,
      sourceUrl,
      createdBy: input.actor.id,
    },
  });

  await tx.dataVersion.create({
    data: {
      entityType: "ConnectorReviewItem",
      entityId: context.review.id,
      action: "MANUAL_EDIT",
      previous: {
        applicationStatus: input.expectedApplicationStatus,
        applicationVersion: input.expectedApplicationVersion,
      },
      next: {
        applicationStatus: "APPLIED",
        appliedResultPointComponentId: component.id,
        appliedByUserId: input.actor.id,
        appliedByUserEmail: input.actor.email,
        appliedAt: appliedAt.toISOString(),
        changedFields: context.changedFields,
        suggestedAction: context.review.suggestedAction,
      },
      sourceUrl,
      createdBy: input.actor.id,
    },
  });

  return {
    ok: true,
    reviewItemId: context.review.id,
    eventId: component.id,
    status: "APPLIED",
    message: "Approved review item was applied to one scoring component.",
  };
}

function validateResultPointComponentApplicationContext(context: ApplicationContext) {
  if (!context.review.snapshot)
    throw new Error("Component proposal snapshot is missing.");
  if (!context.proposed) throw new Error("Proposal payload is missing.");
  const policy = validateResultPointComponentApplicationPolicy({
    reviewStatus: context.review.reviewStatus,
    applicationStatus: context.review.applicationStatus,
    suggestedAction: context.review.suggestedAction,
    changedFields: context.changedFields,
    proposedValues: context.proposed,
  });
  if (!policy.ok) throw new Error(policy.reason);
  if (
    context.review.suggestedAction === "UPDATE_RESULT_POINT_COMPONENT" &&
    !context.review.currentResultPointComponentId
  ) {
    throw new Error(
      "UPDATE_RESULT_POINT_COMPONENT requires a matched current component id.",
    );
  }
}

async function loadCurrentResultPointComponentForUpdate(
  context: ApplicationContext,
  client: PrismaExecutor,
) {
  const component = await client.resultPointComponent.findUnique({
    where: { id: context.review.currentResultPointComponentId ?? "" },
  });
  if (!component) throw new Error("Matched scoring component no longer exists.");
  if (component.archivedAt)
    throw new Error("Archived scoring components cannot be updated.");
  return toAuditedResultPointComponentState(component);
}

async function createResultPointComponentFromReview(
  context: ApplicationContext,
  client: PrismaExecutor,
) {
  const duplicate = await client.resultPointComponent.findFirst({
    where: buildResultPointComponentUniqueWhere(context),
  });
  if (duplicate) {
    throw new Error("An active scoring component already exists for this scope.");
  }
  return client.resultPointComponent.create({
    data: buildResultPointComponentCreateData(context),
  });
}

async function updateResultPointComponentFromReview(
  context: ApplicationContext,
  previousState: Record<string, unknown> | null,
  client: PrismaExecutor,
) {
  if (!previousState) throw new Error("Current scoring component state is missing.");
  const expected = context.current;
  if (!expected) throw new Error("Approved expected current values are missing.");
  assertNoStaleChangedFields({
    entityLabel: "ResultPointComponent",
    changedFields: context.changedFields,
    aggregateField: "resultPointComponent",
    previousState,
    expectedState: expected,
  });
  return client.resultPointComponent.update({
    where: { id: context.review.currentResultPointComponentId! },
    data: buildResultPointComponentUpdateData(context),
  });
}

function buildResultPointComponentCreateData(
  context: ApplicationContext,
): Prisma.ResultPointComponentUncheckedCreateInput {
  return {
    resultId: requiredString(context.proposed, "resultId"),
    eventId: requiredString(context.proposed, "eventId"),
    stageResultId: getString(context.proposed, "stageResultId"),
    raceStageId: getString(context.proposed, "raceStageId"),
    componentType: requiredComponentType(context.proposed),
    classificationScope: requiredString(context.proposed, "classificationScope"),
    className: getString(context.proposed, "className"),
    position: getNumber(context.proposed, "position"),
    points: requiredNumber(context.proposed, "points"),
    regulationId: requiredString(context.proposed, "regulationId"),
    regulationVersion: requiredNumber(context.proposed, "regulationVersion"),
    regulationChecksum: requiredString(context.proposed, "regulationChecksum"),
    regulationTableKey: requiredString(context.proposed, "regulationTableKey"),
    sourceSnapshotId: requiredString(context.proposed, "regulationSourceSnapshotId"),
    connectorReviewItemId: context.review.id,
    officialRawPayload: {
      inputAuthorityType: context.proposed.inputAuthorityType,
      inputResultSourceSnapshotId: context.proposed.inputResultSourceSnapshotId,
      inputDataVersionId: context.proposed.inputDataVersionId,
      sourceRowIdentifier: context.proposed.sourceRowIdentifier,
      regulationMappingEntry: context.proposed.regulationMappingEntry,
      exactInputState: context.proposed.exactInputState,
    } as Prisma.InputJsonValue,
  };
}

function buildResultPointComponentUpdateData(
  context: ApplicationContext,
): Prisma.ResultPointComponentUpdateInput {
  const data: Prisma.ResultPointComponentUpdateInput = {};
  const fields = new Set(
    context.changedFields.filter((field) => field !== "resultPointComponent"),
  );
  for (const field of fields) {
    if (field === "position") data.position = getNumber(context.proposed, "position");
    if (field === "points") data.points = requiredNumber(context.proposed, "points");
    if (field === "regulation" || field === "regulationVersion") {
      data.regulationVersion = requiredNumber(context.proposed, "regulationVersion");
    }
    if (field === "regulation" || field === "regulationChecksum") {
      data.regulationChecksum = requiredString(context.proposed, "regulationChecksum");
    }
    if (field === "sourceLineage" || field === "sourceSnapshotId") {
      data.sourceSnapshot = {
        connect: { id: requiredString(context.proposed, "regulationSourceSnapshotId") },
      };
    }
  }
  data.connectorReviewItem = { connect: { id: context.review.id } };
  data.officialRawPayload = {
    inputAuthorityType: context.proposed.inputAuthorityType,
    inputResultSourceSnapshotId: context.proposed.inputResultSourceSnapshotId,
    inputDataVersionId: context.proposed.inputDataVersionId,
    sourceRowIdentifier: context.proposed.sourceRowIdentifier,
    regulationMappingEntry: context.proposed.regulationMappingEntry,
    exactInputState: context.proposed.exactInputState,
  } as Prisma.InputJsonValue;
  if (Object.keys(data).length === 0) {
    throw new Error("No supported scoring component fields were approved.");
  }
  return data;
}

async function validateResultPointComponentApplyContext(
  context: ApplicationContext,
  previousState: Record<string, unknown> | null,
  client: PrismaExecutor,
) {
  if (context.review.connectorKey !== regulationComponentPointsConnectorKey) {
    throw new Error(
      "Scoring component proposals must come from the official component points connector.",
    );
  }
  const result = await client.result.findUnique({
    where: { id: requiredString(context.proposed, "resultId") },
    include: { event: true },
  });
  if (!result || result.archivedAt) throw new Error("Matched Result is unavailable.");
  if (result.eventId !== requiredString(context.proposed, "eventId")) {
    throw new Error("Matched Result does not belong to the proposed Event.");
  }
  if (result.riderId !== requiredString(context.proposed, "riderId")) {
    throw new Error("Matched Result rider changed.");
  }
  if (result.className !== getString(context.proposed, "className")) {
    throw new Error("Matched Result class changed.");
  }
  if (result.status !== "FINISHED") {
    throw new Error("Only FINISHED Results can support component points.");
  }
  validateComponentInputAuthority(context);

  const stageResultId = getString(context.proposed, "stageResultId");
  const raceStageId = getString(context.proposed, "raceStageId");
  const expectedInputState = toNullableRecord(context.proposed.exactInputState);
  if (stageResultId || raceStageId) {
    if (!stageResultId || !raceStageId) {
      throw new Error("Stage components require both StageResult and RaceStage links.");
    }
    const stageResult = await client.stageResult.findUnique({
      where: { id: stageResultId },
      include: { stage: true },
    });
    if (!stageResult || stageResult.archivedAt) {
      throw new Error("Matched StageResult is unavailable.");
    }
    if (stageResult.stageId !== raceStageId) {
      throw new Error("StageResult does not belong to the matched RaceStage.");
    }
    if (stageResult.stage.eventId !== result.eventId) {
      throw new Error("RaceStage does not belong to the Result event.");
    }
    if (stageResult.riderId !== result.riderId) {
      throw new Error("StageResult rider does not match Result rider.");
    }
    if (stageResult.status !== "FINISHED") {
      throw new Error("Only FINISHED StageResults can support component points.");
    }
    if (stageResult.stage.stageType !== requiredComponentType(context.proposed)) {
      throw new Error("RaceStage type no longer matches component type.");
    }
    if (expectedInputState) {
      const expectedStageResult = toNullableRecord(expectedInputState.stageResult);
      if (expectedStageResult) {
        assertNoStaleChangedFields({
          entityLabel: "StageResult",
          changedFields: ["overallPosition", "status", "stageId", "riderId"],
          aggregateField: "stageResult",
          previousState: toAuditedStageResultState(stageResult),
          expectedState: expectedStageResult,
        });
      }
      const expectedRaceStage = toNullableRecord(expectedInputState.raceStage);
      if (expectedRaceStage) {
        assertNoStaleChangedFields({
          entityLabel: "RaceStage",
          changedFields: ["eventId", "stageType", "stageOrder"],
          aggregateField: "raceStage",
          previousState: toAuditedRaceStageState(stageResult.stage),
          expectedState: expectedRaceStage,
        });
      }
    }
  } else if (!getString(context.proposed, "componentWithoutStageResultRationale")) {
    throw new Error("Event-level component proposals require explicit rationale.");
  }

  const regulationId = requiredString(context.proposed, "regulationId");
  const regulationVersion = requiredNumber(context.proposed, "regulationVersion");
  const regulationChecksum = requiredString(context.proposed, "regulationChecksum");
  const regulationSourceSnapshotId = requiredString(
    context.proposed,
    "regulationSourceSnapshotId",
  );
  const tableKey = requiredString(context.proposed, "regulationTableKey");
  const mappingEntry = toRecord(context.proposed.regulationMappingEntry);
  const regulation = await client.championshipRegulation.findUnique({
    where: { id: regulationId },
  });
  if (!regulation) throw new Error("Regulation no longer exists.");
  if (regulation.status !== "ACTIVE" || regulation.archivedAt) {
    throw new Error("Regulation is no longer active.");
  }
  const now = Date.now();
  if (regulation.effectiveFrom && regulation.effectiveFrom.getTime() > now) {
    throw new Error("Regulation is not effective yet.");
  }
  if (regulation.effectiveTo && regulation.effectiveTo.getTime() < now) {
    throw new Error("Regulation is no longer effective.");
  }
  if (regulation.version !== regulationVersion) {
    throw new Error("Regulation version changed. Regenerate review before applying.");
  }
  if (regulation.contentChecksum !== regulationChecksum) {
    throw new Error("Regulation checksum changed. Regenerate review before applying.");
  }
  if (regulation.sourceSnapshotId !== regulationSourceSnapshotId) {
    throw new Error("Regulation source snapshot changed.");
  }
  if (regulation.seasonId !== result.event.seasonId) {
    throw new Error("Regulation season does not match Result event season.");
  }
  if (
    regulation.classificationScope !==
    requiredString(context.proposed, "classificationScope")
  ) {
    throw new Error("Regulation scope does not match proposal scope.");
  }
  if (regulation.className !== getString(context.proposed, "className")) {
    throw new Error("Regulation class does not match proposal class.");
  }
  const validationIssues = validateOfficialRegulation(regulation);
  if (validationIssues.some((issue) => issue.severity === "error")) {
    throw new Error("Regulation is no longer valid for component points.");
  }
  const table = parseComponentPointsTables(regulation.pointsMapping).find(
    (item) => item.key === tableKey,
  );
  if (!table) throw new Error("Regulation component table no longer exists.");
  if (table.componentType !== requiredComponentType(context.proposed)) {
    throw new Error("Regulation table component type changed.");
  }
  const position = requiredNumber(context.proposed, "position");
  const expectedPoints = pointsForPosition(position, table.positions);
  if (expectedPoints === null) {
    throw new Error("No official component points mapping exists for this position.");
  }
  if (requiredNumber(context.proposed, "points") !== expectedPoints) {
    throw new Error("Proposed component points no longer match the active regulation.");
  }
  if (
    requiredNumber(mappingEntry, "position") !== position ||
    requiredNumber(mappingEntry, "points") !== expectedPoints ||
    getString(mappingEntry, "tableKey") !== tableKey
  ) {
    throw new Error("Regulation mapping entry does not match the active table.");
  }

  if (expectedInputState) {
    const expectedResult = toNullableRecord(expectedInputState.result);
    if (expectedResult) {
      assertNoStaleChangedFields({
        entityLabel: "Result",
        changedFields: ["overallPosition", "status"],
        aggregateField: "result",
        previousState: toAuditedResultState(result),
        expectedState: expectedResult,
      });
    }
  }
  if (previousState && context.current) {
    assertNoStaleChangedFields({
      entityLabel: "ResultPointComponent",
      changedFields: context.changedFields,
      aggregateField: "resultPointComponent",
      previousState,
      expectedState: context.current,
    });
  }
}

function validateComponentInputAuthority(context: ApplicationContext) {
  const authority = requiredString(context.proposed, "inputAuthorityType");
  if (authority === "source-managed") {
    if (!getString(context.proposed, "inputResultSourceSnapshotId")) {
      throw new Error("Source-managed component input requires input source lineage.");
    }
    return;
  }
  if (authority === "manual") {
    if (!getString(context.proposed, "inputDataVersionId")) {
      throw new Error("Manual component input requires DataVersion lineage.");
    }
    return;
  }
  throw new Error("Unsupported component input authority.");
}

function buildResultPointComponentUniqueWhere(
  context: ApplicationContext,
): Prisma.ResultPointComponentWhereInput {
  return {
    resultId: requiredString(context.proposed, "resultId"),
    componentType: requiredComponentType(context.proposed),
    classificationScope: requiredString(context.proposed, "classificationScope"),
    className: getString(context.proposed, "className"),
    regulationId: requiredString(context.proposed, "regulationId"),
    regulationTableKey: requiredString(context.proposed, "regulationTableKey"),
    stageResultId: getString(context.proposed, "stageResultId"),
    raceStageId: getString(context.proposed, "raceStageId"),
    archivedAt: null,
  };
}

async function createResultPointComponentSourceLink({
  context,
  componentId,
  sourceUrl,
  tx,
}: {
  context: ApplicationContext;
  componentId: string;
  sourceUrl: string | null;
  tx: PrismaTransaction;
}) {
  const sourceSnapshotId = requiredString(context.proposed, "regulationSourceSnapshotId");
  const snapshot = await tx.sourceSnapshot.findUnique({
    where: { id: sourceSnapshotId },
  });
  if (!snapshot) throw new Error("Regulation source snapshot no longer exists.");
  const existing = await tx.sourceLink.findFirst({
    where: {
      entityType: "ResultPointComponent",
      entityId: componentId,
      dataSourceId: snapshot.dataSourceId,
      url: sourceUrl ?? snapshot.url,
    },
  });
  if (existing) return;
  await tx.sourceLink.create({
    data: {
      dataSourceId: snapshot.dataSourceId,
      url: sourceUrl ?? snapshot.url,
      entityType: "ResultPointComponent",
      entityId: componentId,
      note: `Applied from review item ${context.review.id}; regulationSnapshot=${sourceSnapshotId}; inputSnapshot=${getString(context.proposed, "inputResultSourceSnapshotId") ?? "manual"}`,
    },
  });
}

function getComponentSourceUrl(context: ApplicationContext) {
  const regulationSource = toNullableRecord(context.proposed.regulationSource);
  return regulationSource ? getString(regulationSource, "url") : null;
}

function requiredComponentType(
  proposed: Record<string, unknown>,
): Prisma.ResultPointComponentUncheckedCreateInput["componentType"] {
  const value = requiredString(proposed, "componentType");
  if (
    value === "PROLOGUE" ||
    value === "SPRINT" ||
    value === "MAIN_EVENT" ||
    value === "FINAL" ||
    value === "OTHER"
  ) {
    return value;
  }
  throw new Error(`Unsupported component type: ${value}`);
}

async function applyResultReviewItem({
  context,
  input,
  tx,
}: {
  context: ApplicationContext;
  input: ConnectorReviewApplyInput;
  tx: PrismaTransaction;
}): Promise<ConnectorReviewApplyResult> {
  validateResultApplicationContext(context);
  const previousResultState =
    context.review.suggestedAction === "UPDATE_RESULT"
      ? await loadCurrentResultForUpdate(context, tx)
      : null;
  const expectedChecksum = createStableChecksum(previousResultState ?? null);
  if (context.changedFields.includes("points")) {
    if (context.review.connectorKey === componentPointsRollupConnectorKey) {
      await validateComponentRollupApplyContext(context, previousResultState, tx);
    } else {
      await validateRegulationPointsApplyContext(context, previousResultState, tx);
    }
  }

  const result =
    context.review.suggestedAction === "NEW_RESULT"
      ? await createResultFromReview(context, tx)
      : await updateResultFromReview(context, previousResultState, tx);

  const resultingResultState = toAuditedResultState(result);
  const resultingChecksum = createStableChecksum(resultingResultState);
  const appliedAt = new Date();
  const sourceUrl = getString(context.proposed, "officialSourceUrl");

  await createResultSourceLink({
    context,
    resultId: result.id,
    sourceUrl,
    tx,
  });

  await tx.connectorReviewItem.update({
    where: { id: context.review.id },
    data: {
      applicationStatus: "APPLIED",
      appliedAt,
      appliedByUserId: input.actor.id,
      appliedByUserEmail: input.actor.email,
      applicationNote: input.note?.trim() || null,
      applicationError: null,
      appliedResultId: result.id,
      expectedCurrentStateChecksum: expectedChecksum,
      resultingEventStateChecksum: resultingChecksum,
      applicationVersion: { increment: 1 },
    },
  });

  await tx.dataVersion.create({
    data: {
      entityType: "Result",
      entityId: result.id,
      action: context.review.suggestedAction === "NEW_RESULT" ? "CREATE" : "UPDATE",
      previous: (previousResultState ?? null) as Prisma.InputJsonValue,
      next: resultingResultState as Prisma.InputJsonValue,
      sourceUrl,
      createdBy: input.actor.id,
    },
  });

  await tx.dataVersion.create({
    data: {
      entityType: "ConnectorReviewItem",
      entityId: context.review.id,
      action: "MANUAL_EDIT",
      previous: {
        applicationStatus: input.expectedApplicationStatus,
        applicationVersion: input.expectedApplicationVersion,
      },
      next: {
        applicationStatus: "APPLIED",
        appliedResultId: result.id,
        appliedByUserId: input.actor.id,
        appliedByUserEmail: input.actor.email,
        appliedAt: appliedAt.toISOString(),
        changedFields: context.changedFields,
        suggestedAction: context.review.suggestedAction,
      },
      sourceUrl,
      createdBy: input.actor.id,
    },
  });

  return {
    ok: true,
    reviewItemId: context.review.id,
    eventId: result.id,
    status: "APPLIED",
    message: "Approved review item was applied to one Result record.",
  };
}

function validateResultApplicationContext(context: ApplicationContext) {
  if (!context.review.snapshot) throw new Error("Source snapshot is missing.");
  if (!context.proposed) throw new Error("Proposal payload is missing.");
  const policy = validateResultApplicationPolicy({
    reviewStatus: context.review.reviewStatus,
    applicationStatus: context.review.applicationStatus,
    suggestedAction: context.review.suggestedAction,
    changedFields: context.changedFields,
    proposedValues: context.proposed,
  });
  if (!policy.ok) throw new Error(policy.reason);
  if (
    context.review.suggestedAction === "UPDATE_RESULT" &&
    !context.review.currentResultId
  ) {
    throw new Error("UPDATE_RESULT requires a matched current Result id.");
  }
}

async function createResultFromReview(
  context: ApplicationContext,
  client: PrismaExecutor,
) {
  const eventId = requiredString(context.proposed, "eventId");
  const riderId = requiredString(context.proposed, "riderId");
  const className = getString(context.proposed, "className");
  const [event, rider, duplicate] = await Promise.all([
    client.event.findUnique({ where: { id: eventId } }),
    client.rider.findUnique({ where: { id: riderId } }),
    client.result.findFirst({ where: { eventId, riderId, className } }),
  ]);
  if (!event) throw new Error("Matched Event no longer exists.");
  if (!rider) throw new Error("Matched Rider no longer exists.");
  if (duplicate) throw new Error("A Result already exists for this rider and event.");
  await validateOptionalResultRelations(context, client);

  return client.result.create({
    data: buildResultCreateData(context),
  });
}

async function updateResultFromReview(
  context: ApplicationContext,
  previousResultState: Record<string, unknown> | null,
  client: PrismaExecutor,
) {
  if (!previousResultState) throw new Error("Current Result state is missing.");
  const expected = context.current;
  if (!expected) throw new Error("Approved expected current values are missing.");
  assertNoStaleChangedFields({
    entityLabel: "Result",
    changedFields: context.changedFields,
    aggregateField: "result",
    previousState: previousResultState,
    expectedState: expected,
  });
  await validateOptionalResultRelations(context, client);

  return client.result.update({
    where: { id: context.review.currentResultId! },
    data: buildResultUpdateData(context),
  });
}

async function loadCurrentResultForUpdate(
  context: ApplicationContext,
  client: PrismaExecutor,
) {
  const result = await client.result.findUnique({
    where: { id: context.review.currentResultId ?? "" },
  });
  if (!result) throw new Error("Matched Result no longer exists.");
  return toAuditedResultState(result);
}

function buildResultCreateData(
  context: ApplicationContext,
): Prisma.ResultUncheckedCreateInput {
  return {
    eventId: requiredString(context.proposed, "eventId"),
    riderId: requiredString(context.proposed, "riderId"),
    manufacturerId: getString(context.proposed, "manufacturerId"),
    motorcycleId: getString(context.proposed, "motorcycleId"),
    className: getString(context.proposed, "className"),
    overallPosition: getNumber(context.proposed, "overallPosition"),
    status: mapResultStatus(getString(context.proposed, "status")),
    totalTimeText: getString(context.proposed, "totalTimeText"),
    gapToLeaderText: getString(context.proposed, "gapToLeaderText"),
    gapToPreviousText: getString(context.proposed, "gapToPreviousText"),
    officialRawRow: context.proposed.officialRawRow as Prisma.InputJsonValue,
  };
}

function buildResultUpdateData(context: ApplicationContext): Prisma.ResultUpdateInput {
  const data: Prisma.ResultUpdateInput = {};
  const uniqueFields = new Set(
    context.changedFields.filter((field) => field !== "result"),
  );
  for (const field of uniqueFields) {
    if (field === "manufacturerId") {
      const id = getString(context.proposed, "manufacturerId");
      data.manufacturer = id ? { connect: { id } } : { disconnect: true };
    }
    if (field === "motorcycleId") {
      const id = getString(context.proposed, "motorcycleId");
      data.motorcycle = id ? { connect: { id } } : { disconnect: true };
    }
    if (field === "className") data.className = getString(context.proposed, "className");
    if (field === "overallPosition") {
      data.overallPosition = getNumber(context.proposed, "overallPosition");
    }
    if (field === "points") data.points = getNumber(context.proposed, "points");
    if (field === "status")
      data.status = mapResultStatus(getString(context.proposed, "status"));
    if (field === "totalTimeText")
      data.totalTimeText = getString(context.proposed, "totalTimeText");
    if (field === "gapToLeaderText") {
      data.gapToLeaderText = getString(context.proposed, "gapToLeaderText");
    }
    if (field === "gapToPreviousText") {
      data.gapToPreviousText = getString(context.proposed, "gapToPreviousText");
    }
  }
  if (Object.keys(data).length === 0) {
    throw new Error("No supported Result fields were approved for application.");
  }
  return data;
}

async function validateOptionalResultRelations(
  context: ApplicationContext,
  client: PrismaExecutor,
) {
  const manufacturerId = getString(context.proposed, "manufacturerId");
  const motorcycleId = getString(context.proposed, "motorcycleId");
  const [manufacturer, motorcycle] = await Promise.all([
    manufacturerId
      ? client.manufacturer.findUnique({ where: { id: manufacturerId } })
      : Promise.resolve(null),
    motorcycleId
      ? client.motorcycle.findUnique({ where: { id: motorcycleId } })
      : Promise.resolve(null),
  ]);
  if (manufacturerId && !manufacturer)
    throw new Error("Matched Manufacturer no longer exists.");
  if (motorcycleId && !motorcycle)
    throw new Error("Matched Motorcycle no longer exists.");
}

async function validateRegulationPointsApplyContext(
  context: ApplicationContext,
  previousResultState: Record<string, unknown> | null,
  client: PrismaExecutor,
) {
  if (context.review.connectorKey !== regulationPointsConnectorKey) {
    throw new Error(
      "Result points updates must come from the official regulation points connector.",
    );
  }
  if (!previousResultState) {
    throw new Error("Current Result state is required for regulation points apply.");
  }

  const regulationId = requiredString(context.proposed, "regulationId");
  const regulationVersion = requiredNumber(context.proposed, "regulationVersion");
  const regulationChecksum = requiredString(context.proposed, "regulationChecksum");
  const regulationSourceSnapshotId = requiredString(
    context.proposed,
    "regulationSourceSnapshotId",
  );
  const mappingEntry = toRecord(context.proposed.regulationMappingEntry);

  const regulation = await client.championshipRegulation.findUnique({
    where: { id: regulationId },
  });
  if (!regulation) throw new Error("Regulation no longer exists.");
  if (regulation.status !== "ACTIVE" || regulation.archivedAt) {
    throw new Error("Regulation is no longer active.");
  }
  if (regulation.version !== regulationVersion) {
    throw new Error("Regulation version changed. Regenerate review before applying.");
  }
  if (regulation.contentChecksum !== regulationChecksum) {
    throw new Error("Regulation checksum changed. Regenerate review before applying.");
  }
  if (regulation.sourceSnapshotId !== regulationSourceSnapshotId) {
    throw new Error(
      "Regulation source snapshot changed. Regenerate review before applying.",
    );
  }
  const validationIssues = validateOfficialRegulation(regulation);
  if (validationIssues.some((issue) => issue.severity === "error")) {
    throw new Error("Regulation is no longer valid for points application.");
  }

  const event = await client.event.findUnique({
    where: { id: requiredString(context.proposed, "eventId") },
    select: { seasonId: true },
  });
  if (!event) throw new Error("Matched Event no longer exists.");
  if (event.seasonId !== regulation.seasonId) {
    throw new Error("Regulation season does not match the Result event season.");
  }

  const currentClassName = getString(previousResultState, "className");
  if (currentClassName !== regulation.className) {
    throw new Error("Regulation class scope does not match the Result class.");
  }

  const currentStatus = getString(previousResultState, "status");
  if (currentStatus !== "FINISHED") {
    throw new Error("Only FINISHED Results can receive regulation points.");
  }

  const currentPosition = getNumber(previousResultState, "overallPosition");
  const expectedPoints = pointsForPosition(
    currentPosition,
    parsePointsMapping(regulation.pointsMapping),
  );
  if (expectedPoints === null) {
    throw new Error("No official points mapping exists for the current Result position.");
  }
  if (getNumber(context.proposed, "points") !== expectedPoints) {
    throw new Error("Proposed points no longer match the active regulation mapping.");
  }
  if (
    getNumber(mappingEntry, "position") !== currentPosition ||
    getNumber(mappingEntry, "points") !== expectedPoints
  ) {
    throw new Error("Regulation mapping entry does not match the active regulation.");
  }
}

async function validateComponentRollupApplyContext(
  context: ApplicationContext,
  previousResultState: Record<string, unknown> | null,
  client: PrismaExecutor,
) {
  if (context.review.connectorKey !== componentPointsRollupConnectorKey) {
    throw new Error(
      "Component rollup updates must come from the official component rollup connector.",
    );
  }
  if (context.proposed.payloadType !== "component-points-rollup") {
    throw new Error("Result points proposal is not a component rollup payload.");
  }
  if (!previousResultState) {
    throw new Error("Current Result state is required for component rollup apply.");
  }
  if (context.changedFields.length !== 1 || context.changedFields[0] !== "points") {
    throw new Error("Component rollup may update only Result.points.");
  }

  const resultId = requiredString(context.proposed, "resultId");
  const result = await client.result.findUnique({
    where: { id: resultId },
    include: { event: true },
  });
  if (!result || result.archivedAt) throw new Error("Matched Result is unavailable.");
  if (result.eventId !== requiredString(context.proposed, "eventId")) {
    throw new Error("Rollup Result event changed.");
  }
  if (result.event.seasonId !== requiredString(context.proposed, "seasonId")) {
    throw new Error("Rollup Result season changed.");
  }
  if (result.riderId !== requiredString(context.proposed, "riderId")) {
    throw new Error("Rollup Result rider changed.");
  }
  if (result.className !== getString(context.proposed, "className")) {
    throw new Error("Rollup Result class changed.");
  }
  if (result.status !== "FINISHED") {
    throw new Error("Only FINISHED Results can receive component rollup points.");
  }
  assertNoStaleChangedFields({
    entityLabel: "Result",
    changedFields: ["points", "overallPosition", "status"],
    aggregateField: "result",
    previousState: toAuditedResultState(result),
    expectedState: toRecord(context.proposed.currentEntityState),
  });

  const regulationId = requiredString(context.proposed, "regulationId");
  const regulationVersion = requiredNumber(context.proposed, "regulationVersion");
  const regulationContentChecksum = requiredString(
    context.proposed,
    "regulationChecksum",
  );
  const regulationSourceSnapshotId = requiredString(
    context.proposed,
    "regulationSourceSnapshotId",
  );
  const regulation = await client.championshipRegulation.findUnique({
    where: { id: regulationId },
  });
  if (!regulation) throw new Error("Regulation no longer exists.");
  if (regulation.status !== "ACTIVE" || regulation.archivedAt) {
    throw new Error("Regulation is no longer active.");
  }
  const now = Date.now();
  if (regulation.effectiveFrom && regulation.effectiveFrom.getTime() > now) {
    throw new Error("Regulation is not effective yet.");
  }
  if (regulation.effectiveTo && regulation.effectiveTo.getTime() < now) {
    throw new Error("Regulation is no longer effective.");
  }
  if (regulation.version !== regulationVersion) {
    throw new Error("Regulation version changed. Regenerate rollup review.");
  }
  if (regulation.contentChecksum !== regulationContentChecksum) {
    throw new Error("Regulation checksum changed. Regenerate rollup review.");
  }
  if (regulation.sourceSnapshotId !== regulationSourceSnapshotId) {
    throw new Error("Regulation source snapshot changed. Regenerate rollup review.");
  }
  if (regulation.seasonId !== result.event.seasonId) {
    throw new Error("Regulation season does not match the Result event season.");
  }
  if (
    regulation.classificationScope !==
    requiredString(context.proposed, "classificationScope")
  ) {
    throw new Error("Regulation scope does not match rollup proposal.");
  }
  if (regulation.className !== result.className) {
    throw new Error("Regulation class scope does not match the Result class.");
  }
  const validationIssues = validateOfficialRegulation(regulation);
  if (validationIssues.some((issue) => issue.severity === "error")) {
    throw new Error("Regulation is no longer valid for component rollup.");
  }

  const formatKey = requiredString(context.proposed, "eventFormatKey");
  const formats = parseComponentEventFormats(regulation.pointsMapping);
  const format = formats.find((item) => item.key === formatKey);
  if (!format) throw new Error("Rollup event format no longer exists.");
  assertSameStringArray(
    "required component tables",
    format.requiredTables,
    readStringArray(context.proposed.requiredComponentTables),
  );
  assertSameStringArray(
    "optional component tables",
    format.optionalTables,
    readStringArray(context.proposed.optionalComponentTables),
  );
  assertSameOneOfGroups(
    format.oneOf,
    readOneOfGroups(context.proposed.oneOfComponentTables),
  );
  const maximumEventPoints = getNumber(context.proposed, "maximumEventPoints");
  if ((format.maximumPoints ?? null) !== maximumEventPoints) {
    throw new Error("Rollup event format maximum points changed.");
  }

  const componentIds = readStringArray(context.proposed.componentIds);
  if (componentIds.length === 0) throw new Error("Rollup requires component inputs.");
  if (new Set(componentIds).size !== componentIds.length) {
    throw new Error("Rollup component list contains duplicates.");
  }
  const components = await client.resultPointComponent.findMany({
    where: { id: { in: componentIds } },
    include: {
      connectorReviewItem: true,
      stageResult: true,
      raceStage: true,
    },
  });
  if (components.length !== componentIds.length) {
    throw new Error("One or more rollup components no longer exist.");
  }
  const sourceLinks = await client.sourceLink.findMany({
    where: {
      entityType: "ResultPointComponent",
      entityId: { in: componentIds },
    },
  });
  const dataVersions = await client.dataVersion.findMany({
    where: {
      entityType: "ResultPointComponent",
      entityId: { in: componentIds },
    },
  });
  const sourceLinkedComponentIds = new Set(sourceLinks.map((link) => link.entityId));
  const versionedComponentIds = new Set(dataVersions.map((version) => version.entityId));
  const proposedComponents = readRecordArray(context.proposed.components);
  const proposedComponentChecksums = new Map(
    readRecordArray(context.proposed.componentChecksums).map((item) => [
      requiredString(item, "id"),
      requiredString(item, "checksum"),
    ]),
  );
  const tableCounts = new Map<string, number>();
  let totalPoints = 0;
  for (const component of components) {
    validateRollupComponentAuthority({
      component,
      result,
      regulation,
      sourceLinkedComponentIds,
      versionedComponentIds,
    });
    const proposedChecksum = proposedComponentChecksums.get(component.id);
    if (!proposedChecksum) {
      throw new Error("Rollup component checksum is missing.");
    }
    if (
      createStableChecksum(toAuditedResultPointComponentState(component)) !==
      proposedChecksum
    ) {
      throw new Error("Rollup component state changed. Regenerate review.");
    }
    if (
      !proposedComponents.some(
        (item) =>
          getString(item, "id") === component.id &&
          getString(item, "regulationTableKey") === component.regulationTableKey,
      )
    ) {
      throw new Error("Rollup component proposal list no longer matches inputs.");
    }
    if (component.points < 0 || !Number.isInteger(component.points)) {
      throw new Error("Rollup component points are invalid.");
    }
    tableCounts.set(
      component.regulationTableKey,
      (tableCounts.get(component.regulationTableKey) ?? 0) + 1,
    );
    totalPoints += component.points;
  }
  validateRollupComponentSet(format, tableCounts, totalPoints);
  if (requiredNumber(context.proposed, "points") !== totalPoints) {
    throw new Error("Proposed Result.points no longer matches component rollup.");
  }
  const mappingEntry = toRecord(context.proposed.regulationMappingEntry);
  if (
    getString(mappingEntry, "eventFormatKey") !== format.key ||
    requiredNumber(mappingEntry, "totalPoints") !== totalPoints
  ) {
    throw new Error("Rollup mapping entry no longer matches the active calculation.");
  }
}

function validateRollupComponentAuthority({
  component,
  result,
  regulation,
  sourceLinkedComponentIds,
  versionedComponentIds,
}: {
  component: {
    id: string;
    resultId: string;
    eventId: string;
    regulationId: string;
    regulationVersion: number;
    regulationChecksum: string;
    classificationScope: string;
    className: string | null;
    componentType: string;
    archivedAt: Date | null;
    connectorReviewItem: {
      suggestedAction: string;
      reviewStatus: string;
      applicationStatus: string;
      appliedResultPointComponentId: string | null;
    } | null;
    stageResult: {
      stageId: string;
      riderId: string;
    } | null;
    raceStage: {
      id: string;
      eventId: string;
      stageType: string;
    } | null;
  };
  result: {
    id: string;
    eventId: string;
    riderId: string;
    className: string | null;
  };
  regulation: {
    id: string;
    version: number;
    contentChecksum: string | null;
    classificationScope: string;
    className: string | null;
  };
  sourceLinkedComponentIds: Set<string>;
  versionedComponentIds: Set<string>;
}) {
  if (component.archivedAt) throw new Error("Archived component cannot be rolled up.");
  if (component.resultId !== result.id) {
    throw new Error("Rollup component belongs to another Result.");
  }
  if (component.eventId !== result.eventId) {
    throw new Error("Rollup component belongs to another Event.");
  }
  if (component.regulationId !== regulation?.id) {
    throw new Error("Rollup component belongs to another Regulation.");
  }
  if (component.regulationVersion !== regulation.version) {
    throw new Error("Rollup component Regulation version changed.");
  }
  if (component.regulationChecksum !== regulation.contentChecksum) {
    throw new Error("Rollup component Regulation checksum changed.");
  }
  if (component.classificationScope !== regulation.classificationScope) {
    throw new Error("Rollup component scope does not match Regulation.");
  }
  if (
    component.className !== regulation.className ||
    component.className !== result.className
  ) {
    throw new Error("Rollup component class does not match Result or Regulation.");
  }
  const review = component.connectorReviewItem;
  if (!review) throw new Error("Rollup component is missing applied review lineage.");
  if (!resultPointComponentReviewActions.has(review.suggestedAction)) {
    throw new Error("Rollup component review action is not applyable.");
  }
  if (review.reviewStatus !== "APPROVED" || review.applicationStatus !== "APPLIED") {
    throw new Error("Rollup component review was not approved and applied.");
  }
  if (review.appliedResultPointComponentId !== component.id) {
    throw new Error("Rollup component review does not apply this component.");
  }
  if (!sourceLinkedComponentIds.has(component.id)) {
    throw new Error("Rollup component SourceLink lineage is missing.");
  }
  if (!versionedComponentIds.has(component.id)) {
    throw new Error("Rollup component DataVersion lineage is missing.");
  }
  if (component.stageResult || component.raceStage) {
    if (!component.stageResult || !component.raceStage) {
      throw new Error("Stage rollup component requires both StageResult and RaceStage.");
    }
    if (component.stageResult.stageId !== component.raceStage.id) {
      throw new Error("Rollup StageResult does not belong to RaceStage.");
    }
    if (component.raceStage.eventId !== result.eventId) {
      throw new Error("Rollup RaceStage belongs to another Event.");
    }
    if (component.stageResult.riderId !== result.riderId) {
      throw new Error("Rollup StageResult rider differs from Result rider.");
    }
    if (component.raceStage.stageType !== component.componentType) {
      throw new Error("Rollup RaceStage type differs from component type.");
    }
  }
}

function validateRollupComponentSet(
  format: {
    key: string;
    requiredTables: string[];
    optionalTables: string[];
    oneOf: string[][];
    maximumPoints: number | null;
  },
  tableCounts: Map<string, number>,
  totalPoints: number,
) {
  for (const key of format.requiredTables) {
    if ((tableCounts.get(key) ?? 0) !== 1) {
      throw new Error(`Rollup requires exactly one ${key} component.`);
    }
  }
  for (const group of format.oneOf) {
    const count = group.reduce((sum, key) => sum + (tableCounts.get(key) ?? 0), 0);
    if (count !== 1) {
      throw new Error(`Rollup requires exactly one component from ${group.join(", ")}.`);
    }
  }
  const allowed = new Set([
    ...format.requiredTables,
    ...format.optionalTables,
    ...format.oneOf.flatMap((group) => group),
  ]);
  for (const [key, count] of tableCounts) {
    if (!allowed.has(key)) {
      throw new Error(`Rollup component table ${key} is not allowed.`);
    }
    if (count > 1) throw new Error(`Rollup component table ${key} is duplicated.`);
  }
  if (!Number.isSafeInteger(totalPoints) || totalPoints > 2_147_483_647) {
    throw new Error("Rollup total exceeds the supported integer range.");
  }
  if (format.maximumPoints !== null && totalPoints > format.maximumPoints) {
    throw new Error("Rollup total exceeds maximum event points.");
  }
}

async function createResultSourceLink({
  context,
  resultId,
  sourceUrl,
  tx,
}: {
  context: ApplicationContext;
  resultId: string;
  sourceUrl: string | null;
  tx: PrismaTransaction;
}) {
  const diagnostics = toNullableRecord(context.review.snapshot.diagnostics);
  const sourceSnapshotId = diagnostics
    ? getString(diagnostics, "sourceSnapshotId")
    : null;
  const snapshot = sourceSnapshotId
    ? await tx.sourceSnapshot.findUnique({ where: { id: sourceSnapshotId } })
    : null;
  if (!snapshot) return;
  const note =
    context.review.connectorKey === componentPointsRollupConnectorKey
      ? `Component points rollup scoring derivation from review item ${context.review.id}`
      : `Applied from review item ${context.review.id}`;
  const existing = await tx.sourceLink.findFirst({
    where: {
      entityType: "Result",
      entityId: resultId,
      dataSourceId: snapshot.dataSourceId,
      url: sourceUrl ?? snapshot.url,
      note,
    },
    select: { id: true },
  });
  if (existing) return;
  await tx.sourceLink.create({
    data: {
      dataSourceId: snapshot.dataSourceId,
      url: sourceUrl ?? snapshot.url,
      entityType: "Result",
      entityId: resultId,
      note,
    },
  });
}

function validateStageResultApplicationPolicy(
  input: ConnectorReviewApplicationPolicyInput,
): ConnectorReviewApplicationPolicyResult {
  if (!input.proposedValues) {
    return { ok: false, reason: "Proposal payload is missing." };
  }
  for (const field of Object.keys(input.proposedValues)) {
    if (!allowedStageResultProposalFields.has(field)) {
      return { ok: false, reason: `Unsupported StageResult proposal field: ${field}` };
    }
  }
  for (const field of input.changedFields) {
    if (!allowedStageResultChangedFields.has(field)) {
      return { ok: false, reason: `Unsupported StageResult changed field: ${field}` };
    }
  }
  if (input.proposedValues.entityType !== "StageResult") {
    return { ok: false, reason: "Proposal is not a StageResult proposal." };
  }
  if (input.proposedValues.applyEligible !== true) {
    return { ok: false, reason: "Proposal is blocked by validation warnings." };
  }
  try {
    mapResultStatus(getString(input.proposedValues, "status"));
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: sanitizeError(error) };
  }
}

function validateStandingApplicationPolicy(
  input: ConnectorReviewApplicationPolicyInput,
): ConnectorReviewApplicationPolicyResult {
  if (!input.proposedValues) {
    return { ok: false, reason: "Proposal payload is missing." };
  }
  for (const field of Object.keys(input.proposedValues)) {
    if (!allowedStandingProposalFields.has(field)) {
      return { ok: false, reason: `Unsupported Standing proposal field: ${field}` };
    }
  }
  for (const field of input.changedFields) {
    if (!allowedStandingChangedFields.has(field)) {
      return { ok: false, reason: `Unsupported Standing changed field: ${field}` };
    }
  }
  if (input.proposedValues.entityType !== "Standing") {
    return { ok: false, reason: "Proposal is not a Standing proposal." };
  }
  if (input.proposedValues.pointsSystemId !== "source-result-points") {
    return { ok: false, reason: "Unsupported Standing points source." };
  }
  if (input.proposedValues.applyEligible !== true) {
    return { ok: false, reason: "Standing proposal is blocked by validation warnings." };
  }
  return { ok: true };
}

async function applyStandingReviewItem({
  context,
  input,
  tx,
}: {
  context: ApplicationContext;
  input: ConnectorReviewApplyInput;
  tx: PrismaTransaction;
}): Promise<ConnectorReviewApplyResult> {
  validateStandingApplicationContext(context);
  const previousStandingState =
    context.review.suggestedAction === "UPDATE_STANDING"
      ? await loadCurrentStandingForUpdate(context, tx)
      : null;
  const expectedChecksum = createStableChecksum(previousStandingState ?? null);

  const standing =
    context.review.suggestedAction === "NEW_STANDING"
      ? await createStandingFromReview(context, tx)
      : await updateStandingFromReview(context, previousStandingState, tx);

  const resultingState = toAuditedStandingState(standing);
  const resultingChecksum = createStableChecksum(resultingState);
  const appliedAt = new Date();

  await tx.connectorReviewItem.update({
    where: { id: context.review.id },
    data: {
      applicationStatus: "APPLIED",
      appliedAt,
      appliedByUserId: input.actor.id,
      appliedByUserEmail: input.actor.email,
      applicationNote: input.note?.trim() || null,
      applicationError: null,
      appliedStandingId: standing.id,
      expectedCurrentStateChecksum: expectedChecksum,
      resultingEventStateChecksum: resultingChecksum,
      applicationVersion: { increment: 1 },
    },
  });

  await tx.dataVersion.create({
    data: {
      entityType: "Standing",
      entityId: standing.id,
      action: context.review.suggestedAction === "NEW_STANDING" ? "CREATE" : "UPDATE",
      previous: (previousStandingState ?? null) as Prisma.InputJsonValue,
      next: resultingState as Prisma.InputJsonValue,
      createdBy: input.actor.id,
    },
  });

  await tx.dataVersion.create({
    data: {
      entityType: "ConnectorReviewItem",
      entityId: context.review.id,
      action: "MANUAL_EDIT",
      previous: {
        applicationStatus: input.expectedApplicationStatus,
        applicationVersion: input.expectedApplicationVersion,
      },
      next: {
        applicationStatus: "APPLIED",
        appliedStandingId: standing.id,
        appliedByUserId: input.actor.id,
        appliedByUserEmail: input.actor.email,
        appliedAt: appliedAt.toISOString(),
        changedFields: context.changedFields,
        suggestedAction: context.review.suggestedAction,
      },
      createdBy: input.actor.id,
    },
  });

  return {
    ok: true,
    reviewItemId: context.review.id,
    eventId: standing.id,
    status: "APPLIED",
    message: "Approved review item was applied to one Standing record.",
  };
}

function validateStandingApplicationContext(context: ApplicationContext) {
  if (!context.review.snapshot) throw new Error("Calculation snapshot is missing.");
  if (!context.proposed) throw new Error("Proposal payload is missing.");
  const policy = validateStandingApplicationPolicy({
    reviewStatus: context.review.reviewStatus,
    applicationStatus: context.review.applicationStatus,
    suggestedAction: context.review.suggestedAction,
    changedFields: context.changedFields,
    proposedValues: context.proposed,
  });
  if (!policy.ok) throw new Error(policy.reason);
  if (
    context.review.suggestedAction === "UPDATE_STANDING" &&
    !context.review.currentStandingId
  ) {
    throw new Error("UPDATE_STANDING requires a matched current Standing id.");
  }
}

async function createStandingFromReview(
  context: ApplicationContext,
  client: PrismaExecutor,
) {
  const seasonId = requiredString(context.proposed, "seasonId");
  const riderId = requiredString(context.proposed, "riderId");
  const className = getString(context.proposed, "className");
  const [season, rider, duplicate] = await Promise.all([
    client.season.findUnique({ where: { id: seasonId } }),
    client.rider.findUnique({ where: { id: riderId } }),
    client.standing.findFirst({ where: { seasonId, riderId, className } }),
  ]);
  if (!season) throw new Error("Matched Season no longer exists.");
  if (!rider) throw new Error("Matched Rider no longer exists.");
  if (duplicate) throw new Error("A Standing already exists for this rider and season.");

  return client.standing.create({
    data: buildStandingCreateData(context),
  });
}

async function updateStandingFromReview(
  context: ApplicationContext,
  previousStandingState: Record<string, unknown> | null,
  client: PrismaExecutor,
) {
  if (!previousStandingState) throw new Error("Current Standing state is missing.");
  const expected = context.current;
  if (!expected) throw new Error("Approved expected current values are missing.");
  assertNoStaleChangedFields({
    entityLabel: "Standing",
    changedFields: context.changedFields,
    aggregateField: "standing",
    previousState: previousStandingState,
    expectedState: expected,
  });

  return client.standing.update({
    where: { id: context.review.currentStandingId! },
    data: buildStandingUpdateData(context),
  });
}

async function loadCurrentStandingForUpdate(
  context: ApplicationContext,
  client: PrismaExecutor,
) {
  const standing = await client.standing.findUnique({
    where: { id: context.review.currentStandingId ?? "" },
  });
  if (!standing) throw new Error("Matched Standing no longer exists.");
  return toAuditedStandingState(standing);
}

function buildStandingCreateData(
  context: ApplicationContext,
): Prisma.StandingUncheckedCreateInput {
  return {
    seasonId: requiredString(context.proposed, "seasonId"),
    riderId: requiredString(context.proposed, "riderId"),
    className: getString(context.proposed, "className"),
    position: requiredNumber(context.proposed, "position"),
    points: requiredNumber(context.proposed, "points"),
    wins: requiredNumber(context.proposed, "wins"),
    podiums: requiredNumber(context.proposed, "podiums"),
    starts: requiredNumber(context.proposed, "starts"),
    dnfs: requiredNumber(context.proposed, "dnfs"),
  };
}

function buildStandingUpdateData(
  context: ApplicationContext,
): Prisma.StandingUpdateInput {
  const data: Prisma.StandingUpdateInput = {};
  const uniqueFields = new Set(
    context.changedFields.filter((field) => field !== "standing"),
  );
  for (const field of uniqueFields) {
    if (field === "position")
      data.position = requiredNumber(context.proposed, "position");
    if (field === "points") data.points = requiredNumber(context.proposed, "points");
    if (field === "wins") data.wins = requiredNumber(context.proposed, "wins");
    if (field === "podiums") data.podiums = requiredNumber(context.proposed, "podiums");
    if (field === "starts") data.starts = requiredNumber(context.proposed, "starts");
    if (field === "dnfs") data.dnfs = requiredNumber(context.proposed, "dnfs");
  }
  if (Object.keys(data).length === 0) {
    throw new Error("No supported Standing fields were approved for application.");
  }
  return data;
}

async function applyStageResultReviewItem({
  context,
  input,
  tx,
}: {
  context: ApplicationContext;
  input: ConnectorReviewApplyInput;
  tx: PrismaTransaction;
}): Promise<ConnectorReviewApplyResult> {
  validateStageResultApplicationContext(context);
  const previousStageResultState =
    context.review.suggestedAction === "UPDATE_STAGE_RESULT"
      ? await loadCurrentStageResultForUpdate(context, tx)
      : null;
  const expectedChecksum = createStableChecksum(previousStageResultState ?? null);

  const stageResult =
    context.review.suggestedAction === "NEW_STAGE_RESULT"
      ? await createStageResultFromReview(context, tx)
      : await updateStageResultFromReview(context, previousStageResultState, tx);

  const resultingState = toAuditedStageResultState(stageResult);
  const resultingChecksum = createStableChecksum(resultingState);
  const appliedAt = new Date();
  const sourceUrl = getString(context.proposed, "officialSourceUrl");

  await createStageResultSourceLink({
    context,
    stageResultId: stageResult.id,
    sourceUrl,
    tx,
  });

  await tx.connectorReviewItem.update({
    where: { id: context.review.id },
    data: {
      applicationStatus: "APPLIED",
      appliedAt,
      appliedByUserId: input.actor.id,
      appliedByUserEmail: input.actor.email,
      applicationNote: input.note?.trim() || null,
      applicationError: null,
      appliedStageResultId: stageResult.id,
      expectedCurrentStateChecksum: expectedChecksum,
      resultingEventStateChecksum: resultingChecksum,
      applicationVersion: { increment: 1 },
    },
  });

  await tx.dataVersion.create({
    data: {
      entityType: "StageResult",
      entityId: stageResult.id,
      action: context.review.suggestedAction === "NEW_STAGE_RESULT" ? "CREATE" : "UPDATE",
      previous: (previousStageResultState ?? null) as Prisma.InputJsonValue,
      next: resultingState as Prisma.InputJsonValue,
      sourceUrl,
      createdBy: input.actor.id,
    },
  });

  await tx.dataVersion.create({
    data: {
      entityType: "ConnectorReviewItem",
      entityId: context.review.id,
      action: "MANUAL_EDIT",
      previous: {
        applicationStatus: input.expectedApplicationStatus,
        applicationVersion: input.expectedApplicationVersion,
      },
      next: {
        applicationStatus: "APPLIED",
        appliedStageResultId: stageResult.id,
        appliedByUserId: input.actor.id,
        appliedByUserEmail: input.actor.email,
        appliedAt: appliedAt.toISOString(),
        changedFields: context.changedFields,
        suggestedAction: context.review.suggestedAction,
      },
      sourceUrl,
      createdBy: input.actor.id,
    },
  });

  return {
    ok: true,
    reviewItemId: context.review.id,
    eventId: stageResult.id,
    status: "APPLIED",
    message: "Approved review item was applied to one StageResult record.",
  };
}

function validateStageResultApplicationContext(context: ApplicationContext) {
  if (!context.review.snapshot) throw new Error("Source snapshot is missing.");
  if (!context.proposed) throw new Error("Proposal payload is missing.");
  const policy = validateStageResultApplicationPolicy({
    reviewStatus: context.review.reviewStatus,
    applicationStatus: context.review.applicationStatus,
    suggestedAction: context.review.suggestedAction,
    changedFields: context.changedFields,
    proposedValues: context.proposed,
  });
  if (!policy.ok) throw new Error(policy.reason);
  if (
    context.review.suggestedAction === "UPDATE_STAGE_RESULT" &&
    !context.review.currentStageResultId
  ) {
    throw new Error("UPDATE_STAGE_RESULT requires a matched current StageResult id.");
  }
}

async function createStageResultFromReview(
  context: ApplicationContext,
  client: PrismaExecutor,
) {
  const stageId = requiredString(context.proposed, "stageId");
  const riderId = requiredString(context.proposed, "riderId");
  const className = getString(context.proposed, "className");
  const [stage, rider, duplicate] = await Promise.all([
    client.raceStage.findUnique({ where: { id: stageId } }),
    client.rider.findUnique({ where: { id: riderId } }),
    client.stageResult.findFirst({ where: { stageId, riderId, className } }),
  ]);
  if (!stage) throw new Error("Matched RaceStage no longer exists.");
  if (!rider) throw new Error("Matched Rider no longer exists.");
  if (stage.eventId !== requiredString(context.proposed, "eventId")) {
    throw new Error("Matched RaceStage does not belong to the matched Event.");
  }
  if (duplicate) {
    throw new Error("A StageResult already exists for this rider and stage.");
  }
  await validateOptionalResultRelations(context, client);

  return client.stageResult.create({
    data: buildStageResultCreateData(context),
  });
}

async function updateStageResultFromReview(
  context: ApplicationContext,
  previousStageResultState: Record<string, unknown> | null,
  client: PrismaExecutor,
) {
  if (!previousStageResultState) throw new Error("Current StageResult state is missing.");
  const expected = context.current;
  if (!expected) throw new Error("Approved expected current values are missing.");
  assertNoStaleChangedFields({
    entityLabel: "StageResult",
    changedFields: context.changedFields,
    aggregateField: "stageResult",
    previousState: previousStageResultState,
    expectedState: expected,
  });
  const stage = await client.raceStage.findUnique({
    where: { id: requiredString(context.proposed, "stageId") },
  });
  if (!stage) throw new Error("Matched RaceStage no longer exists.");
  if (stage.eventId !== requiredString(context.proposed, "eventId")) {
    throw new Error("Matched RaceStage does not belong to the matched Event.");
  }
  await validateOptionalResultRelations(context, client);

  return client.stageResult.update({
    where: { id: context.review.currentStageResultId! },
    data: buildStageResultUpdateData(context),
  });
}

async function loadCurrentStageResultForUpdate(
  context: ApplicationContext,
  client: PrismaExecutor,
) {
  const result = await client.stageResult.findUnique({
    where: { id: context.review.currentStageResultId ?? "" },
  });
  if (!result) throw new Error("Matched StageResult no longer exists.");
  return toAuditedStageResultState(result);
}

function buildStageResultCreateData(
  context: ApplicationContext,
): Prisma.StageResultUncheckedCreateInput {
  return {
    stageId: requiredString(context.proposed, "stageId"),
    riderId: requiredString(context.proposed, "riderId"),
    manufacturerId: getString(context.proposed, "manufacturerId"),
    motorcycleId: getString(context.proposed, "motorcycleId"),
    className: getString(context.proposed, "className"),
    overallPosition: getNumber(context.proposed, "overallPosition"),
    status: mapResultStatus(getString(context.proposed, "status")),
    totalTimeMs: getNumber(context.proposed, "totalTimeMs"),
    totalTimeText: getString(context.proposed, "totalTimeText"),
    gapToLeaderText: getString(context.proposed, "gapToLeaderText"),
    gapToPreviousText: getString(context.proposed, "gapToPreviousText"),
    officialRawRow: context.proposed.officialRawRow as Prisma.InputJsonValue,
  };
}

function buildStageResultUpdateData(
  context: ApplicationContext,
): Prisma.StageResultUpdateInput {
  const data: Prisma.StageResultUpdateInput = {};
  const uniqueFields = new Set(
    context.changedFields.filter((field) => field !== "stageResult"),
  );
  for (const field of uniqueFields) {
    if (field === "manufacturerId") {
      const id = getString(context.proposed, "manufacturerId");
      data.manufacturer = id ? { connect: { id } } : { disconnect: true };
    }
    if (field === "motorcycleId") {
      const id = getString(context.proposed, "motorcycleId");
      data.motorcycle = id ? { connect: { id } } : { disconnect: true };
    }
    if (field === "className") data.className = getString(context.proposed, "className");
    if (field === "overallPosition") {
      data.overallPosition = getNumber(context.proposed, "overallPosition");
    }
    if (field === "status")
      data.status = mapResultStatus(getString(context.proposed, "status"));
    if (field === "totalTimeMs")
      data.totalTimeMs = getNumber(context.proposed, "totalTimeMs");
    if (field === "totalTimeText")
      data.totalTimeText = getString(context.proposed, "totalTimeText");
    if (field === "gapToLeaderText") {
      data.gapToLeaderText = getString(context.proposed, "gapToLeaderText");
    }
    if (field === "gapToPreviousText") {
      data.gapToPreviousText = getString(context.proposed, "gapToPreviousText");
    }
  }
  if (Object.keys(data).length === 0) {
    throw new Error("No supported StageResult fields were approved for application.");
  }
  return data;
}

async function createStageResultSourceLink({
  context,
  stageResultId,
  sourceUrl,
  tx,
}: {
  context: ApplicationContext;
  stageResultId: string;
  sourceUrl: string | null;
  tx: PrismaTransaction;
}) {
  const diagnostics = toNullableRecord(context.review.snapshot.diagnostics);
  const sourceSnapshotId = diagnostics
    ? getString(diagnostics, "sourceSnapshotId")
    : null;
  const snapshot = sourceSnapshotId
    ? await tx.sourceSnapshot.findUnique({ where: { id: sourceSnapshotId } })
    : null;
  if (!snapshot) return;
  await tx.sourceLink.create({
    data: {
      dataSourceId: snapshot.dataSourceId,
      url: sourceUrl ?? snapshot.url,
      entityType: "StageResult",
      entityId: stageResultId,
      note: `Applied from review item ${context.review.id}`,
    },
  });
}

async function loadReviewForApplication(id: string, client: PrismaExecutor) {
  return client.connectorReviewItem.findUnique({
    where: { id },
    include: {
      snapshot: true,
    },
  });
}

function buildApplicationContext(review: ReviewForApplication): ApplicationContext {
  const proposed = toRecord(review.proposedValues);
  return {
    review,
    changedFields: review.changedFields,
    proposed,
    current: toNullableRecord(review.currentValues),
  };
}

function validateApplicationContext(context: ApplicationContext) {
  if (!context.review.snapshot) throw new Error("Source snapshot is missing.");
  if (!context.proposed) throw new Error("Proposal payload is missing.");

  for (const field of Object.keys(context.proposed)) {
    if (!allowedProposalFields.has(field)) {
      throw new Error(`Unsupported proposal field: ${field}`);
    }
  }

  for (const field of context.changedFields) {
    if (!allowedChangedFields.has(field)) {
      throw new Error(`Unsupported changed field: ${field}`);
    }
  }

  if (
    context.review.suggestedAction === "UPDATE_EVENT" &&
    !context.review.currentEventId
  ) {
    throw new Error("UPDATE_EVENT requires a matched current Event id.");
  }
}

async function createEventFromReview(
  context: ApplicationContext,
  client: PrismaExecutor,
) {
  const slug = requiredString(context.proposed, "slugCandidate");
  const sourceEventId = getString(context.proposed, "sourceEventId");
  const seasonYear = requiredNumber(context.proposed, "seasonYear");
  const [season, country, duplicateSlug, duplicateSourceEvent] = await Promise.all([
    client.season.findUnique({ where: { year: seasonYear } }),
    resolveCountry(context.proposed, client),
    client.event.findUnique({ where: { slug } }),
    sourceEventId
      ? client.connectorReviewItem.findFirst({
          where: {
            sourceEventId,
            applicationStatus: "APPLIED",
            appliedEventId: { not: null },
          },
        })
      : Promise.resolve(null),
  ]);

  if (!season) throw new Error(`Season ${seasonYear} does not exist.`);
  if (!country) throw new Error("Country could not be resolved safely.");
  if (duplicateSlug) throw new Error(`Event slug already exists: ${slug}`);
  if (duplicateSourceEvent?.appliedEventId) {
    throw new Error("This source event was already applied to an Event.");
  }

  return client.event.create({
    data: {
      seasonId: season.id,
      countryId: country.id,
      name: requiredString(context.proposed, "eventName"),
      slug,
      city: getString(context.proposed, "location"),
      venue: getString(context.proposed, "venue"),
      startDate: requiredDate(context.proposed, "startDate"),
      endDate: optionalDate(context.proposed, "endDate"),
      status: mapEventStatus(getString(context.proposed, "raceStatusCandidate")),
      officialUrl: validateUrl(getString(context.proposed, "officialUrl")),
    },
  });
}

async function updateEventFromReview(
  context: ApplicationContext,
  previousEventState: Record<string, unknown> | null,
  client: PrismaExecutor,
) {
  if (!previousEventState) throw new Error("Current Event state is missing.");

  const expected = context.current;
  if (!expected) throw new Error("Approved expected current values are missing.");

  for (const field of context.changedFields) {
    const eventField = toEventField(field);
    if (
      eventField &&
      !valuesEqual(
        previousEventState[eventField],
        getExpectedCurrentValue(expected, eventField),
      )
    ) {
      throw new Error(
        `Stale Event state for ${eventField}. Regenerate review before applying.`,
      );
    }
  }

  const data = await buildEventUpdateData(context, client);

  return client.event.update({
    where: { id: context.review.currentEventId! },
    data,
  });
}

async function loadCurrentEventForUpdate(
  context: ApplicationContext,
  client: PrismaExecutor,
) {
  const event = await client.event.findUnique({
    where: { id: context.review.currentEventId ?? "" },
    include: {
      country: true,
      season: true,
    },
  });

  if (!event) throw new Error("Matched Event no longer exists.");
  return toAuditedEventState(event);
}

async function buildEventUpdateData(context: ApplicationContext, client: PrismaExecutor) {
  const data: Prisma.EventUpdateInput = {};
  const uniqueFields = new Set(context.changedFields.map(toEventField).filter(Boolean));

  for (const field of uniqueFields) {
    if (field === "name") data.name = requiredString(context.proposed, "eventName");
    if (field === "slug") {
      const slug = requiredString(context.proposed, "slugCandidate");
      const existing = await client.event.findUnique({ where: { slug } });
      if (existing && existing.id !== context.review.currentEventId) {
        throw new Error(`Event slug already exists: ${slug}`);
      }
      data.slug = slug;
    }
    if (field === "city") data.city = getString(context.proposed, "location");
    if (field === "venue") data.venue = getString(context.proposed, "venue");
    if (field === "startDate")
      data.startDate = requiredDate(context.proposed, "startDate");
    if (field === "endDate") data.endDate = optionalDate(context.proposed, "endDate");
    if (field === "officialUrl") {
      data.officialUrl = validateUrl(getString(context.proposed, "officialUrl"));
    }
    if (field === "status") {
      data.status = mapEventStatus(getString(context.proposed, "raceStatusCandidate"));
    }
    if (field === "country") {
      const country = await resolveCountry(context.proposed, client);
      if (!country) throw new Error("Country could not be resolved safely.");
      data.country = { connect: { id: country.id } };
    }
  }

  if (Object.keys(data).length === 0) {
    throw new Error("No supported Event fields were approved for application.");
  }

  return data;
}

function toEventField(field: string) {
  const map: Record<string, string> = {
    event: "",
    name: "name",
    eventName: "name",
    slug: "slug",
    slugCandidate: "slug",
    location: "city",
    venue: "venue",
    startDate: "startDate",
    endDate: "endDate",
    officialUrl: "officialUrl",
    status: "status",
    raceStatusCandidate: "status",
    country: "country",
    countryCode: "country",
  };
  return map[field] ?? null;
}

function getExpectedCurrentValue(expected: Record<string, unknown>, eventField: string) {
  const map: Record<string, string[]> = {
    name: ["name", "eventName"],
    slug: ["slug", "slugCandidate"],
    city: ["city", "location"],
    venue: ["venue"],
    startDate: ["startDate"],
    endDate: ["endDate"],
    officialUrl: ["officialUrl"],
    status: ["status", "raceStatusCandidate"],
    country: ["country"],
  };
  for (const key of map[eventField] ?? [eventField]) {
    if (key in expected) return expected[key];
  }
  return undefined;
}

async function resolveCountry(proposed: Record<string, unknown>, client: PrismaExecutor) {
  const rawCode = getString(proposed, "countryCode");
  const rawName = getString(proposed, "country");
  const code = rawCode ? (countryCodeAliases[rawCode] ?? rawCode).toUpperCase() : null;

  if (code) {
    const country = await client.country.findUnique({ where: { isoCode: code } });
    if (country) return country;
  }

  if (!rawName) return null;
  const countries = await client.country.findMany({
    where: {
      name: {
        equals: normalizeCountryName(rawName),
        mode: "insensitive",
      },
    },
  });

  return countries.length === 1 ? countries[0] : null;
}

function normalizeCountryName(name: string) {
  if (name.toLowerCase() === "türkiye") return "Turkey";
  if (name.toLowerCase() === "united states") return "United States";
  return name;
}

function mapEventStatus(status: string | null): EventStatus {
  if (status === "Race Completed") return "COMPLETED";
  if (status === "Coming Soon") return "SCHEDULED";
  if (status === "Live Now") return "LIVE";
  if (status === "Cancelled" || status === "Canceled") return "CANCELLED";
  throw new Error(`Unsupported event status: ${status ?? "missing"}`);
}

function mapResultStatus(status: string | null): ResultStatus {
  if (
    status === "FINISHED" ||
    status === "DNF" ||
    status === "DNS" ||
    status === "DSQ" ||
    status === "UNKNOWN"
  ) {
    return status;
  }
  throw new Error(`Unsupported result status: ${status ?? "missing"}`);
}

function toAuditedEventState(event: {
  id: string;
  name: string;
  slug: string;
  season?: { year: number } | null;
  country?: { id: string; name: string; isoCode: string } | null;
  countryId?: string | null;
  city: string | null;
  venue: string | null;
  startDate: Date;
  endDate: Date | null;
  status: EventStatus;
  officialUrl: string | null;
}) {
  return {
    id: event.id,
    name: event.name,
    slug: event.slug,
    seasonYear: event.season?.year,
    countryId: event.countryId ?? event.country?.id ?? null,
    country: event.country?.name ?? null,
    countryCode: event.country?.isoCode ?? null,
    city: event.city,
    venue: event.venue,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate?.toISOString() ?? null,
    status: event.status,
    officialUrl: event.officialUrl,
  };
}

function toAuditedResultState(result: {
  id: string;
  eventId: string;
  riderId: string;
  motorcycleId: string | null;
  manufacturerId: string | null;
  className: string | null;
  overallPosition: number | null;
  points?: number | null;
  status: ResultStatus;
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
    points: result.points ?? null,
    status: result.status,
    totalTimeText: result.totalTimeText,
    gapToLeaderText: result.gapToLeaderText,
    gapToPreviousText: result.gapToPreviousText,
  };
}

function toAuditedStageResultState(result: {
  id: string;
  stageId: string;
  riderId: string;
  motorcycleId: string | null;
  manufacturerId: string | null;
  className: string | null;
  overallPosition: number | null;
  status: ResultStatus;
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

function toAuditedRaceStageState(stage: {
  id: string;
  eventId: string;
  stageType: string;
  stageOrder: number;
}) {
  return {
    id: stage.id,
    eventId: stage.eventId,
    stageType: stage.stageType,
    stageOrder: stage.stageOrder,
  };
}

function toAuditedStandingState(standing: {
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

function toAuditedResultPointComponentState(component: {
  id: string;
  resultId: string;
  stageResultId: string | null;
  raceStageId: string | null;
  eventId: string;
  componentType: string;
  classificationScope: string;
  className: string | null;
  position: number | null;
  points: number;
  regulationId: string;
  regulationVersion: number;
  regulationChecksum: string;
  regulationTableKey: string;
  sourceSnapshotId: string | null;
  connectorReviewItemId: string | null;
  archivedAt: Date | null;
  updatedAt: Date;
}) {
  return {
    id: component.id,
    resultId: component.resultId,
    stageResultId: component.stageResultId,
    raceStageId: component.raceStageId,
    eventId: component.eventId,
    componentType: component.componentType,
    classificationScope: component.classificationScope,
    className: component.className,
    position: component.position,
    points: component.points,
    regulationId: component.regulationId,
    regulationVersion: component.regulationVersion,
    regulationChecksum: component.regulationChecksum,
    regulationTableKey: component.regulationTableKey,
    sourceSnapshotId: component.sourceSnapshotId,
    connectorReviewItemId: component.connectorReviewItemId,
    archivedAt: component.archivedAt?.toISOString() ?? null,
    updatedAt: component.updatedAt.toISOString(),
  };
}

function toRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected object payload.");
  }
  return value as Record<string, unknown>;
}

function toNullableRecord(value: unknown) {
  if (!value) return null;
  return toRecord(value);
}

function requiredString(value: Record<string, unknown>, key: string) {
  const field = getString(value, key);
  if (!field) throw new Error(`Missing required field: ${key}`);
  return field;
}

function requiredNumber(value: Record<string, unknown>, key: string) {
  const field = value[key];
  if (typeof field !== "number") throw new Error(`Missing required field: ${key}`);
  return field;
}

function getNumber(value: Record<string, unknown>, key: string) {
  const field = value[key];
  return typeof field === "number" && Number.isFinite(field) ? field : null;
}

function getString(value: Record<string, unknown>, key: string) {
  const field = value[key];
  return typeof field === "string" && field.trim() ? field.trim() : null;
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function readRecordArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
}

function readOneOfGroups(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map(readStringArray);
}

function assertSameStringArray(label: string, left: string[], right: string[]) {
  if (!valuesEqual([...left].sort(), [...right].sort())) {
    throw new Error(`Rollup ${label} changed.`);
  }
}

function assertSameOneOfGroups(left: string[][], right: string[][]) {
  const normalize = (groups: string[][]) =>
    groups
      .map((group) => [...group].sort())
      .sort((a, b) => a.join(",").localeCompare(b.join(",")));
  if (!valuesEqual(normalize(left), normalize(right))) {
    throw new Error("Rollup one-of component groups changed.");
  }
}

function requiredDate(value: Record<string, unknown>, key: string) {
  const field = requiredString(value, key);
  const date = new Date(field);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date field: ${key}`);
  return date;
}

function optionalDate(value: Record<string, unknown>, key: string) {
  const field = getString(value, key);
  if (!field) return null;
  const date = new Date(field);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date field: ${key}`);
  return date;
}

function validateUrl(value: string | null) {
  if (!value) return null;
  try {
    return new URL(value).toString();
  } catch {
    throw new Error("Invalid official URL.");
  }
}

function valuesEqual(left: unknown, right: unknown) {
  return createStableChecksum(left ?? null) === createStableChecksum(right ?? null);
}

function createStableChecksum(value: unknown) {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

function sanitizeError(error: unknown) {
  const message = error instanceof Error ? error.message : "Application failed.";
  return message.replace(/postgresql:\/\/\S+/gi, "[redacted-database-url]");
}

function failure(
  code: Exclude<ConnectorReviewApplyResult, { ok: true }>["code"],
  message: string,
): ConnectorReviewApplyResult {
  return { ok: false, code, message };
}

export function assertNoStaleChangedFields({
  entityLabel,
  changedFields,
  aggregateField,
  previousState,
  expectedState,
}: {
  entityLabel: string;
  changedFields: string[];
  aggregateField: string;
  previousState: Record<string, unknown>;
  expectedState: Record<string, unknown>;
}) {
  for (const field of changedFields) {
    if (field === aggregateField) continue;
    if (!valuesEqual(previousState[field], expectedState[field])) {
      throw new Error(
        `Stale ${entityLabel} state for ${field}. Regenerate review before applying.`,
      );
    }
  }
}
