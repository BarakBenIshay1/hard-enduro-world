import { createHash } from "node:crypto";
import {
  ClassifiableEntityType,
  DataOriginStatus,
  Prisma,
  type ConnectorReviewAction,
  type RecordClassification,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { AuthUser } from "@/lib/auth";
import {
  assertClassifiableEntityExists,
  getActiveRecordClassification,
  normalizeLegacyEntityType,
} from "@/lib/data-quality/record-classification";

type PrismaTransaction = Prisma.TransactionClient;
type PrismaExecutor = typeof prisma | PrismaTransaction;

export const recordClassificationConnectorKey = "record-classification-workflow";
export const recordClassificationPayloadType = "record-classification";
export const recordClassificationPayloadVersion = "record-classification-v1";

export const recordClassificationApplyActions = new Set<string>([
  "NEW_RECORD_CLASSIFICATION",
  "UPDATE_RECORD_CLASSIFICATION",
]);

export const recordClassificationReviewActions = new Set<string>([
  ...recordClassificationApplyActions,
  "RECORD_CLASSIFICATION_INVALID",
  "RECORD_CLASSIFICATION_CONFLICT",
  "RECORD_CLASSIFICATION_MISSING_EVIDENCE",
]);

const supportedReviewEvidenceActions = new Set<string>([
  "NEW_EVENT",
  "UPDATE_EVENT",
  "NEW_RESULT",
  "UPDATE_RESULT",
  "NEW_STAGE_RESULT",
  "UPDATE_STAGE_RESULT",
  "NEW_RESULT_POINT_COMPONENT",
  "UPDATE_RESULT_POINT_COMPONENT",
  "NEW_STANDING",
  "UPDATE_STANDING",
]);

export type RecordClassificationProposalInput = {
  entityType: ClassifiableEntityType;
  entityId: string;
  originStatus: DataOriginStatus;
  reason: string;
  evidence?: unknown;
  sourceLinkId?: string | null;
  sourceSnapshotId?: string | null;
  connectorReviewItemId?: string | null;
  actor: Pick<AuthUser, "id" | "email" | "name">;
};

export type RecordClassificationProposalResult =
  | {
      ok: true;
      reviewItemId: string;
      status: "created" | "reused";
      action: ConnectorReviewAction;
      snapshotId: string;
    }
  | {
      ok: false;
      code: "invalid" | "unauthorized" | "not-found";
      message: string;
    };

export type RecordClassificationApplyContext = {
  review: {
    id: string;
    connectorKey: string;
    suggestedAction: string;
    reviewStatus: string;
    applicationStatus: string;
    currentValues: Prisma.JsonValue | null;
    proposedValues: Prisma.JsonValue | null;
    changedFields: string[];
    snapshot: { id: string; payloadChecksum: string; finalResponseUrl: string | null };
  };
  actor: Pick<AuthUser, "id" | "email" | "name">;
  note?: string | null;
  expectedApplicationStatus: string;
  expectedApplicationVersion: number;
  tx: PrismaTransaction;
};

export type RecordClassificationApplyResult = {
  classification: RecordClassification;
  previousClassification: RecordClassification | null;
  expectedChecksum: string;
  resultingChecksum: string;
  sourceUrl: string | null;
};

type ClassificationProposalPayload = {
  payloadType: typeof recordClassificationPayloadType;
  payloadVersion: typeof recordClassificationPayloadVersion;
  proposalVersion: 1;
  entityType: ClassifiableEntityType;
  entityId: string;
  currentState: "UNCLASSIFIED" | "CLASSIFIED";
  originStatus: DataOriginStatus;
  reason: string;
  evidence: unknown;
  sourceLinkId: string | null;
  sourceSnapshotId: string | null;
  connectorReviewItemId: string | null;
  currentClassificationId: string | null;
  currentClassificationChecksum: string;
  proposedClassificationChecksum: string;
  transitionType: ClassificationTransitionType;
  evidenceState: EvidenceState;
  evidenceStateChecksum: string;
  entityLifecycleState: EntityLifecycleState;
  entityLifecycleStateChecksum: string;
  proposedAt: string;
  applyEligible: boolean;
  validationIssues: string[];
};

export type ClassificationTransitionType =
  | "first-classification"
  | "promotion"
  | "re-quarantine"
  | "correction";

type EvidenceState = {
  sourceLink: {
    id: string;
    entityType: string;
    entityId: string;
    dataSourceId: string;
    url: string;
    note: string | null;
    dataSource: {
      id: string;
      type: string;
      reliability: string;
      baseUrl: string | null;
    };
    createdAt: string;
  } | null;
  sourceSnapshot: {
    id: string;
    dataSourceId: string;
    url: string;
    contentHash: string;
    statusCode: number | null;
    errorMessage: string | null;
    fetchedAt: string;
  } | null;
  connectorReviewItem: {
    id: string;
    connectorKey: string;
    suggestedAction: string;
    reviewStatus: string;
    applicationStatus: string;
    snapshotId: string;
    currentEventId: string | null;
    appliedEventId: string | null;
    currentResultId: string | null;
    appliedResultId: string | null;
    currentStageResultId: string | null;
    appliedStageResultId: string | null;
    currentStandingId: string | null;
    appliedStandingId: string | null;
    currentResultPointComponentId: string | null;
    appliedResultPointComponentId: string | null;
    proposedValues: unknown;
    snapshot: {
      id: string;
      connectorKey: string;
      sourceKey: string;
      payloadChecksum: string;
    } | null;
  } | null;
};

type EntityLifecycleState = {
  entityType: ClassifiableEntityType;
  entityId: string;
  exists: boolean;
  label: string | null;
  archivedAt?: string | null;
  status?: string | null;
  visibility?: string | null;
  updatedAt?: string | null;
};

export async function createRecordClassificationReviewProposal(
  input: RecordClassificationProposalInput,
): Promise<RecordClassificationProposalResult> {
  if (input.originStatus === DataOriginStatus.ARCHIVED_HISTORY) {
    return {
      ok: false,
      code: "invalid",
      message: "ARCHIVED_HISTORY is historical only and cannot be proposed as active.",
    };
  }
  if (!input.reason.trim()) {
    return {
      ok: false,
      code: "invalid",
      message: "A classification reason is required.",
    };
  }

  try {
    return await prisma.$transaction(
      async (tx) => {
        const identity = await assertClassifiableEntityExists(
          input.entityType,
          input.entityId,
          tx,
        );
        const current = await getActiveRecordClassification(
          input.entityType,
          input.entityId,
          tx,
        );
        const validationIssues = await validateClassificationEvidence(
          {
            entityType: input.entityType,
            entityId: input.entityId,
            originStatus: input.originStatus,
            sourceLinkId: input.sourceLinkId ?? null,
            sourceSnapshotId: input.sourceSnapshotId ?? null,
            connectorReviewItemId: input.connectorReviewItemId ?? null,
          },
          tx,
        );
        const evidenceState = await loadEvidenceState(
          {
            sourceLinkId: input.sourceLinkId ?? null,
            sourceSnapshotId: input.sourceSnapshotId ?? null,
            connectorReviewItemId: input.connectorReviewItemId ?? null,
          },
          tx,
        );
        validationIssues.push(
          ...validateEvidenceStateOwnership({
            entityType: input.entityType,
            entityId: input.entityId,
            originStatus: input.originStatus,
            evidenceState,
          }),
        );
        const entityLifecycleState = await loadEntityLifecycleState(
          input.entityType,
          input.entityId,
          tx,
        );
        validationIssues.push(...validateEntityLifecycleState(entityLifecycleState));
        const transitionType = getClassificationTransitionType(
          current,
          input.originStatus,
        );
        const currentClassificationChecksum = createStableChecksum(
          current
            ? toAuditedRecordClassificationState(current)
            : { state: "UNCLASSIFIED" },
        );
        const proposedClassificationChecksum = createStableChecksum({
          entityType: input.entityType,
          entityId: input.entityId,
          originStatus: input.originStatus,
          reason: input.reason.trim(),
          evidence: input.evidence ?? null,
          sourceLinkId: input.sourceLinkId ?? null,
          sourceSnapshotId: input.sourceSnapshotId ?? null,
          connectorReviewItemId: input.connectorReviewItemId ?? null,
        });
        if (
          current &&
          current.originStatus === input.originStatus &&
          createStableChecksum({
            originStatus: current.originStatus,
            reason: current.reason,
            evidence: current.evidence,
            sourceLinkId: current.sourceLinkId,
            sourceSnapshotId: current.sourceSnapshotId,
          }) ===
            createStableChecksum({
              originStatus: input.originStatus,
              reason: input.reason.trim(),
              evidence: input.evidence ?? null,
              sourceLinkId: input.sourceLinkId ?? null,
              sourceSnapshotId: input.sourceSnapshotId ?? null,
            })
        ) {
          validationIssues.push("Proposed classification is materially identical.");
        }
        const action = determineReviewAction({
          current,
          originStatus: input.originStatus,
          validationIssues,
        });
        const payload = buildProposalPayload({
          input,
          current,
          validationIssues,
          applyEligible: recordClassificationApplyActions.has(action),
          transitionType,
          evidenceState,
          entityLifecycleState,
          currentClassificationChecksum,
          proposedClassificationChecksum,
        });
        const payloadChecksum = createStableChecksum(payload);
        const season = await resolveClassificationSeason(
          input.entityType,
          input.entityId,
          tx,
        );
        const snapshot = await findOrCreateSnapshot({
          payload,
          payloadChecksum,
          season,
          identityLabel: identity.label,
          tx,
        });
        const deduplicationKey = createStableChecksum({
          connectorKey: recordClassificationConnectorKey,
          entityType: input.entityType,
          entityId: input.entityId,
          action,
          payloadChecksum,
        });
        const existing = await tx.connectorReviewItem.findFirst({
          where: {
            connectorKey: recordClassificationConnectorKey,
            deduplicationKey,
            reviewStatus: { in: ["PENDING", "APPROVED"] },
            applicationStatus: { not: "APPLIED" },
          },
        });
        if (existing) {
          return {
            ok: true,
            reviewItemId: existing.id,
            status: "reused",
            action,
            snapshotId: snapshot.id,
          };
        }

        const review = await tx.connectorReviewItem.create({
          data: {
            snapshotId: snapshot.id,
            connectorKey: recordClassificationConnectorKey,
            season,
            eventName: `Classification: ${identity.label ?? input.entityId}`,
            suggestedAction: action,
            confidence: {
              score: action === "RECORD_CLASSIFICATION_MISSING_EVIDENCE" ? 0.4 : 1,
              method: "explicit-admin-proposal",
            },
            matchingStrategy: "classifiable-entity-id",
            ambiguityReason:
              action === "RECORD_CLASSIFICATION_CONFLICT"
                ? "The proposed evidence does not match the classified entity."
                : null,
            currentValues: current
              ? (toAuditedRecordClassificationState(current) as Prisma.InputJsonValue)
              : Prisma.JsonNull,
            proposedValues: payload as Prisma.InputJsonValue,
            changedFields: ["classification"],
            recommendation: recommendationForAction(action, validationIssues),
            deduplicationKey,
            ...(input.entityType === ClassifiableEntityType.EVENT
              ? { currentEventId: input.entityId }
              : {}),
            ...(input.entityType === ClassifiableEntityType.RESULT
              ? { currentResultId: input.entityId }
              : {}),
            ...(input.entityType === ClassifiableEntityType.STAGE_RESULT
              ? { currentStageResultId: input.entityId }
              : {}),
            ...(input.entityType === ClassifiableEntityType.STANDING
              ? { currentStandingId: input.entityId }
              : {}),
            ...(input.entityType === ClassifiableEntityType.RESULT_POINT_COMPONENT
              ? { currentResultPointComponentId: input.entityId }
              : {}),
          },
        });

        await supersedeOlderClassificationProposals({
          entityType: input.entityType,
          entityId: input.entityId,
          newReviewItemId: review.id,
          newDeduplicationKey: deduplicationKey,
          tx,
        });

        await tx.dataVersion.create({
          data: {
            entityType: "ConnectorReviewItem",
            entityId: review.id,
            action: "CREATE",
            previous: Prisma.JsonNull,
            next: {
              connectorKey: recordClassificationConnectorKey,
              suggestedAction: action,
              entityType: input.entityType,
              entityId: input.entityId,
              payloadChecksum,
            },
            createdBy: input.actor.id,
          },
        });

        return {
          ok: true,
          reviewItemId: review.id,
          status: "created",
          action,
          snapshotId: snapshot.id,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    return {
      ok: false,
      code: "invalid",
      message: sanitizeError(error),
    };
  }
}

export async function applyRecordClassificationReviewItem({
  review,
  actor,
  note,
  expectedApplicationStatus,
  expectedApplicationVersion,
  tx,
}: RecordClassificationApplyContext): Promise<RecordClassificationApplyResult> {
  if (review.connectorKey !== recordClassificationConnectorKey) {
    throw new Error("Review item is not a RecordClassification proposal.");
  }
  if (!recordClassificationApplyActions.has(review.suggestedAction)) {
    throw new Error("This RecordClassification proposal is not applyable.");
  }
  const proposed = parseClassificationProposalPayload(review.proposedValues);
  if (!proposed.applyEligible) {
    throw new Error("Classification proposal is blocked by validation issues.");
  }

  await assertClassifiableEntityExists(proposed.entityType, proposed.entityId, tx);
  const entityLifecycleState = await loadEntityLifecycleState(
    proposed.entityType,
    proposed.entityId,
    tx,
  );
  const lifecycleIssues = validateEntityLifecycleState(entityLifecycleState);
  if (lifecycleIssues.length > 0) {
    throw new Error(lifecycleIssues.join(" "));
  }
  if (
    createStableChecksum(entityLifecycleState) !== proposed.entityLifecycleStateChecksum
  ) {
    throw new Error(
      "Classified entity lifecycle changed. Regenerate review before applying.",
    );
  }
  const validationIssues = await validateClassificationEvidence(proposed, tx);
  const evidenceState = await loadEvidenceState(proposed, tx);
  validationIssues.push(
    ...validateEvidenceStateOwnership({
      entityType: proposed.entityType,
      entityId: proposed.entityId,
      originStatus: proposed.originStatus,
      evidenceState,
    }),
  );
  if (validationIssues.length > 0) {
    throw new Error(validationIssues.join(" "));
  }
  if (createStableChecksum(evidenceState) !== proposed.evidenceStateChecksum) {
    throw new Error(
      "Classification evidence changed. Regenerate review before applying.",
    );
  }

  const current = await getActiveRecordClassification(
    proposed.entityType,
    proposed.entityId,
    tx,
  );
  const expectedCurrentId = proposed.currentClassificationId;
  if ((current?.id ?? null) !== expectedCurrentId) {
    throw new Error("Classification state changed. Regenerate review before applying.");
  }
  const currentChecksum = createStableChecksum(
    current ? toAuditedRecordClassificationState(current) : { state: "UNCLASSIFIED" },
  );
  if (currentChecksum !== proposed.currentClassificationChecksum) {
    throw new Error(
      "Classification checksum changed. Regenerate review before applying.",
    );
  }

  const previousState = current ? toAuditedRecordClassificationState(current) : null;
  const expectedChecksum = createStableChecksum(previousState);
  const appliedAt = new Date();

  if (current) {
    await tx.recordClassification.update({
      where: { id: current.id },
      data: {
        supersededAt: appliedAt,
      },
    });
  }

  const classification = await tx.recordClassification.create({
    data: {
      entityType: proposed.entityType,
      entityId: proposed.entityId,
      originStatus: proposed.originStatus,
      reason: proposed.reason,
      evidence: proposed.evidence as Prisma.InputJsonValue,
      sourceLinkId: proposed.sourceLinkId,
      sourceSnapshotId: proposed.sourceSnapshotId,
      connectorReviewItemId: review.id,
      classifiedByUserId: actor.id,
      classifiedByUserEmail: actor.email,
    },
  });
  const resultingState = toAuditedRecordClassificationState(classification);
  const resultingChecksum = createStableChecksum(resultingState);
  const sourceUrl = await getClassificationSourceUrl(proposed, tx);

  await tx.connectorReviewItem.update({
    where: { id: review.id },
    data: {
      applicationStatus: "APPLIED",
      appliedAt,
      appliedByUserId: actor.id,
      appliedByUserEmail: actor.email,
      applicationNote: note?.trim() || null,
      applicationError: null,
      expectedCurrentStateChecksum: expectedChecksum,
      resultingEventStateChecksum: resultingChecksum,
      applicationVersion: { increment: 1 },
    },
  });

  await tx.dataVersion.create({
    data: {
      entityType: "RecordClassification",
      entityId: classification.id,
      action:
        review.suggestedAction === "NEW_RECORD_CLASSIFICATION" ? "CREATE" : "UPDATE",
      previous: previousState as Prisma.InputJsonValue,
      next: resultingState as Prisma.InputJsonValue,
      sourceUrl,
      createdBy: actor.id,
    },
  });

  await tx.dataVersion.create({
    data: {
      entityType: "ConnectorReviewItem",
      entityId: review.id,
      action: "MANUAL_EDIT",
      previous: {
        applicationStatus: expectedApplicationStatus,
        applicationVersion: expectedApplicationVersion,
      },
      next: {
        applicationStatus: "APPLIED",
        appliedRecordClassificationId: classification.id,
        appliedByUserId: actor.id,
        appliedByUserEmail: actor.email,
        appliedAt: appliedAt.toISOString(),
        changedFields: review.changedFields,
        suggestedAction: review.suggestedAction,
      },
      sourceUrl,
      createdBy: actor.id,
    },
  });

  return {
    classification,
    previousClassification: current,
    expectedChecksum,
    resultingChecksum,
    sourceUrl,
  };
}

export function validateRecordClassificationApplicationPolicy(input: {
  reviewStatus: string;
  applicationStatus: string;
  suggestedAction: string;
  proposedValues: Record<string, unknown> | null;
  changedFields: string[];
}): { ok: true } | { ok: false; reason: string } {
  if (!recordClassificationReviewActions.has(input.suggestedAction)) {
    return { ok: false, reason: "Review item is not a classification proposal." };
  }
  if (!recordClassificationApplyActions.has(input.suggestedAction)) {
    return {
      ok: false,
      reason: "This classification proposal is informational and cannot be applied.",
    };
  }
  if (!input.proposedValues) {
    return { ok: false, reason: "Classification proposal payload is missing." };
  }
  if (input.proposedValues.payloadType !== recordClassificationPayloadType) {
    return { ok: false, reason: "Unsupported classification proposal payload." };
  }
  if (input.proposedValues.payloadVersion !== recordClassificationPayloadVersion) {
    return { ok: false, reason: "Unsupported classification proposal version." };
  }
  if (input.proposedValues.originStatus === DataOriginStatus.ARCHIVED_HISTORY) {
    return {
      ok: false,
      reason: "ARCHIVED_HISTORY cannot be applied as an active classification.",
    };
  }
  if (input.proposedValues.applyEligible !== true) {
    return { ok: false, reason: "Classification proposal is not applyable." };
  }
  for (const field of input.changedFields) {
    if (field !== "classification") {
      return { ok: false, reason: `Unsupported classification changed field: ${field}` };
    }
  }
  return { ok: true };
}

export function parseClassificationProposalPayload(
  value: Prisma.JsonValue | Record<string, unknown> | null,
): ClassificationProposalPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Classification proposal payload is missing.");
  }
  const record = value as Record<string, unknown>;
  if (record.payloadType !== recordClassificationPayloadType) {
    throw new Error("Unsupported classification proposal payload.");
  }
  if (record.payloadVersion !== recordClassificationPayloadVersion) {
    throw new Error("Unsupported classification proposal version.");
  }
  if (record.proposalVersion !== 1) {
    throw new Error("Unsupported classification proposal version.");
  }
  const entityType = parseEntityType(record.entityType);
  const originStatus = parseOriginStatus(record.originStatus);
  if (originStatus === DataOriginStatus.ARCHIVED_HISTORY) {
    throw new Error("ARCHIVED_HISTORY cannot be applied as an active classification.");
  }
  return {
    payloadType: recordClassificationPayloadType,
    payloadVersion: recordClassificationPayloadVersion,
    proposalVersion: 1,
    entityType,
    entityId: requiredString(record, "entityId"),
    currentState: record.currentState === "CLASSIFIED" ? "CLASSIFIED" : "UNCLASSIFIED",
    originStatus,
    reason: requiredString(record, "reason"),
    evidence: record.evidence ?? null,
    sourceLinkId: getString(record, "sourceLinkId"),
    sourceSnapshotId: getString(record, "sourceSnapshotId"),
    connectorReviewItemId: getString(record, "connectorReviewItemId"),
    currentClassificationId: getString(record, "currentClassificationId"),
    currentClassificationChecksum: requiredString(
      record,
      "currentClassificationChecksum",
    ),
    proposedClassificationChecksum: requiredString(
      record,
      "proposedClassificationChecksum",
    ),
    transitionType: parseTransitionType(record.transitionType),
    evidenceState: parseEvidenceState(record.evidenceState),
    evidenceStateChecksum: requiredString(record, "evidenceStateChecksum"),
    proposedAt: requiredString(record, "proposedAt"),
    entityLifecycleState: parseEntityLifecycleState(record.entityLifecycleState),
    entityLifecycleStateChecksum: requiredString(record, "entityLifecycleStateChecksum"),
    applyEligible: record.applyEligible === true,
    validationIssues: readStringArray(record.validationIssues),
  };
}

export function toAuditedRecordClassificationState(classification: {
  id: string;
  entityType: ClassifiableEntityType;
  entityId: string;
  originStatus: DataOriginStatus;
  reason: string;
  evidence: Prisma.JsonValue | null;
  sourceLinkId: string | null;
  sourceSnapshotId: string | null;
  connectorReviewItemId: string | null;
  classifiedByUserId: string | null;
  classifiedByUserEmail: string | null;
  supersededAt: Date | null;
}) {
  return {
    id: classification.id,
    entityType: classification.entityType,
    entityId: classification.entityId,
    originStatus: classification.originStatus,
    reason: classification.reason,
    evidence: classification.evidence,
    sourceLinkId: classification.sourceLinkId,
    sourceSnapshotId: classification.sourceSnapshotId,
    connectorReviewItemId: classification.connectorReviewItemId,
    classifiedByUserId: classification.classifiedByUserId,
    classifiedByUserEmail: classification.classifiedByUserEmail,
    supersededAt: classification.supersededAt?.toISOString() ?? null,
  };
}

async function validateClassificationEvidence(
  input: {
    entityType: ClassifiableEntityType;
    entityId: string;
    originStatus: DataOriginStatus;
    sourceLinkId?: string | null;
    sourceSnapshotId?: string | null;
    connectorReviewItemId?: string | null;
  },
  client: PrismaExecutor,
) {
  const issues: string[] = [];

  if (input.sourceLinkId) {
    const link = await client.sourceLink.findUnique({
      where: { id: input.sourceLinkId },
      include: { dataSource: true },
    });
    if (!link) {
      issues.push("SourceLink evidence was not found.");
    } else {
      const linkedType = normalizeLegacyEntityType(link.entityType);
      if (linkedType !== input.entityType || link.entityId !== input.entityId) {
        issues.push("SourceLink evidence belongs to another entity.");
      }
    }
  }

  if (input.sourceSnapshotId) {
    const snapshot = await client.sourceSnapshot.findUnique({
      where: { id: input.sourceSnapshotId },
    });
    if (!snapshot) {
      issues.push("SourceSnapshot evidence was not found.");
    } else if (!snapshot.contentHash) {
      issues.push("SourceSnapshot evidence is missing a checksum.");
    }
  }

  if (input.connectorReviewItemId) {
    const review = await client.connectorReviewItem.findUnique({
      where: { id: input.connectorReviewItemId },
    });
    if (!review) {
      issues.push("ConnectorReviewItem evidence was not found.");
    } else if (review.applicationStatus !== "APPLIED") {
      issues.push("ConnectorReviewItem evidence must be applied.");
    }
  }

  if (
    input.originStatus === DataOriginStatus.VERIFIED_OFFICIAL &&
    (!input.sourceLinkId || !input.sourceSnapshotId)
  ) {
    issues.push(
      "Verified official classification requires matching SourceLink and SourceSnapshot evidence.",
    );
  }
  if (
    input.originStatus === DataOriginStatus.SOURCE_MANAGED_UNVERIFIED &&
    !input.sourceSnapshotId &&
    !input.sourceLinkId &&
    !input.connectorReviewItemId
  ) {
    issues.push("Source-managed classification requires source or review evidence.");
  }
  if (input.originStatus === DataOriginStatus.ARCHIVED_HISTORY) {
    issues.push("ARCHIVED_HISTORY cannot be proposed as active.");
  }

  return issues;
}

async function loadEvidenceState(
  input: {
    sourceLinkId?: string | null;
    sourceSnapshotId?: string | null;
    connectorReviewItemId?: string | null;
  },
  client: PrismaExecutor,
): Promise<EvidenceState> {
  const [sourceLink, sourceSnapshot, connectorReviewItem] = await Promise.all([
    input.sourceLinkId
      ? client.sourceLink.findUnique({
          where: { id: input.sourceLinkId },
          select: {
            id: true,
            entityType: true,
            entityId: true,
            dataSourceId: true,
            url: true,
            note: true,
            createdAt: true,
            dataSource: {
              select: {
                id: true,
                type: true,
                reliability: true,
                baseUrl: true,
              },
            },
          },
        })
      : Promise.resolve(null),
    input.sourceSnapshotId
      ? client.sourceSnapshot.findUnique({
          where: { id: input.sourceSnapshotId },
          select: {
            id: true,
            dataSourceId: true,
            url: true,
            contentHash: true,
            statusCode: true,
            errorMessage: true,
            fetchedAt: true,
          },
        })
      : Promise.resolve(null),
    input.connectorReviewItemId
      ? client.connectorReviewItem.findUnique({
          where: { id: input.connectorReviewItemId },
          select: {
            id: true,
            connectorKey: true,
            suggestedAction: true,
            reviewStatus: true,
            applicationStatus: true,
            snapshotId: true,
            currentEventId: true,
            appliedEventId: true,
            currentResultId: true,
            appliedResultId: true,
            currentStageResultId: true,
            appliedStageResultId: true,
            currentStandingId: true,
            appliedStandingId: true,
            currentResultPointComponentId: true,
            appliedResultPointComponentId: true,
            proposedValues: true,
            snapshot: {
              select: {
                id: true,
                connectorKey: true,
                sourceKey: true,
                payloadChecksum: true,
              },
            },
          },
        })
      : Promise.resolve(null),
  ]);

  return {
    sourceLink: sourceLink
      ? {
          ...sourceLink,
          createdAt: sourceLink.createdAt.toISOString(),
        }
      : null,
    sourceSnapshot: sourceSnapshot
      ? {
          ...sourceSnapshot,
          fetchedAt: sourceSnapshot.fetchedAt.toISOString(),
        }
      : null,
    connectorReviewItem,
  };
}

function validateEvidenceStateOwnership({
  entityType,
  entityId,
  originStatus,
  evidenceState,
}: {
  entityType: ClassifiableEntityType;
  entityId: string;
  originStatus: DataOriginStatus;
  evidenceState: EvidenceState;
}) {
  const issues: string[] = [];
  const { sourceLink, sourceSnapshot, connectorReviewItem } = evidenceState;

  if (sourceLink) {
    const linkedType = normalizeLegacyEntityType(sourceLink.entityType);
    if (linkedType !== entityType || sourceLink.entityId !== entityId) {
      issues.push("SourceLink evidence belongs to another entity.");
    }
  }

  if (
    sourceLink &&
    sourceSnapshot &&
    sourceLink.dataSourceId !== sourceSnapshot.dataSourceId
  ) {
    issues.push("SourceLink and SourceSnapshot evidence use different DataSources.");
  }

  if (
    originStatus === DataOriginStatus.VERIFIED_OFFICIAL &&
    (!sourceLink || !sourceSnapshot || !sourceSnapshot.contentHash)
  ) {
    issues.push(
      "Verified official classification requires a matching SourceLink and checksummed SourceSnapshot.",
    );
  }

  if (originStatus === DataOriginStatus.VERIFIED_OFFICIAL && sourceLink) {
    if (sourceLink.dataSource.reliability !== "OFFICIAL") {
      issues.push("Verified official classification requires an official DataSource.");
    }
    if (!sourceUrlMatchesDataSource(sourceLink.url, sourceLink.dataSource.baseUrl)) {
      issues.push("SourceLink URL does not match the official DataSource base URL.");
    }
    if (
      sourceSnapshot &&
      !sourceUrlMatchesDataSource(sourceSnapshot.url, sourceLink.dataSource.baseUrl)
    ) {
      issues.push("SourceSnapshot URL does not match the official DataSource base URL.");
    }
  }

  if (
    originStatus === DataOriginStatus.SOURCE_MANAGED_UNVERIFIED &&
    !sourceLink &&
    !sourceSnapshot &&
    !connectorReviewItem
  ) {
    issues.push("Source-managed classification requires source or review evidence.");
  }

  if (connectorReviewItem && connectorReviewItem.applicationStatus !== "APPLIED") {
    issues.push("ConnectorReviewItem evidence must be applied.");
  }
  if (connectorReviewItem) {
    issues.push(
      ...validateConnectorReviewEvidenceOwnership({
        entityType,
        entityId,
        evidenceState,
      }),
    );
  }

  return Array.from(new Set(issues));
}

function sourceUrlMatchesDataSource(url: string, baseUrl: string | null) {
  if (!baseUrl) return true;
  try {
    return new URL(url).hostname === new URL(baseUrl).hostname;
  } catch {
    return false;
  }
}

function validateConnectorReviewEvidenceOwnership({
  entityType,
  entityId,
  evidenceState,
}: {
  entityType: ClassifiableEntityType;
  entityId: string;
  evidenceState: EvidenceState;
}) {
  const review = evidenceState.connectorReviewItem;
  if (!review) return [];

  const issues: string[] = [];
  if (review.connectorKey === recordClassificationConnectorKey) {
    issues.push(
      "RecordClassification review items cannot be used as classification evidence.",
    );
  }
  if (!supportedReviewEvidenceActions.has(review.suggestedAction)) {
    issues.push("Supporting review item action is not accepted classification evidence.");
  }
  if (review.reviewStatus === "REJECTED" || review.reviewStatus === "SUPERSEDED") {
    issues.push("Supporting review item is not current approved/applied evidence.");
  }
  if (
    review.suggestedAction.includes("INVALID") ||
    review.suggestedAction.includes("CONFLICT") ||
    review.suggestedAction.includes("MISSING_SOURCE") ||
    review.suggestedAction.includes("MISSING_EVIDENCE")
  ) {
    issues.push("Supporting review item is not positive source evidence.");
  }
  if (!review.snapshot) {
    issues.push("Supporting review item is missing its ConnectorSnapshot.");
  }

  const linkedIds = reviewLinkedEntityIds(review);
  const expected = `${entityType}:${entityId}`;
  if (!linkedIds.has(expected)) {
    issues.push("ConnectorReviewItem evidence is not tied to the classified entity.");
  }

  return issues;
}

function reviewLinkedEntityIds(
  review: NonNullable<EvidenceState["connectorReviewItem"]>,
) {
  const values = new Set<string>();
  const add = (type: ClassifiableEntityType, id: string | null) => {
    if (id) values.add(`${type}:${id}`);
  };
  add(ClassifiableEntityType.EVENT, review.currentEventId);
  add(ClassifiableEntityType.EVENT, review.appliedEventId);
  add(ClassifiableEntityType.RESULT, review.currentResultId);
  add(ClassifiableEntityType.RESULT, review.appliedResultId);
  add(ClassifiableEntityType.STAGE_RESULT, review.currentStageResultId);
  add(ClassifiableEntityType.STAGE_RESULT, review.appliedStageResultId);
  add(ClassifiableEntityType.STANDING, review.currentStandingId);
  add(ClassifiableEntityType.STANDING, review.appliedStandingId);
  add(
    ClassifiableEntityType.RESULT_POINT_COMPONENT,
    review.currentResultPointComponentId,
  );
  add(
    ClassifiableEntityType.RESULT_POINT_COMPONENT,
    review.appliedResultPointComponentId,
  );

  const proposed =
    review.proposedValues &&
    typeof review.proposedValues === "object" &&
    !Array.isArray(review.proposedValues)
      ? (review.proposedValues as Record<string, unknown>)
      : null;
  if (proposed) {
    const proposedType = normalizeLegacyEntityType(String(proposed.entityType ?? ""));
    if (proposedType) {
      for (const key of [
        "entityId",
        "eventId",
        "resultId",
        "stageResultId",
        "standingId",
        "resultPointComponentId",
      ]) {
        const value = proposed[key];
        if (typeof value === "string" && value) add(proposedType, value);
      }
    }
  }
  return values;
}

export function getClassificationTransitionType(
  current: Pick<RecordClassification, "originStatus"> | null,
  proposedStatus: DataOriginStatus,
): ClassificationTransitionType {
  if (!current) return "first-classification";
  if (current.originStatus === proposedStatus) return "correction";
  const auditedManualPromotionSources = new Set<DataOriginStatus>([
    DataOriginStatus.MANUAL_PLACEHOLDER,
    DataOriginStatus.SOURCE_MANAGED_UNVERIFIED,
  ]);
  if (
    proposedStatus === DataOriginStatus.VERIFIED_OFFICIAL ||
    (proposedStatus === DataOriginStatus.AUDITED_MANUAL &&
      auditedManualPromotionSources.has(current.originStatus))
  ) {
    return "promotion";
  }
  const quarantineTargets = new Set<DataOriginStatus>([
    DataOriginStatus.SOURCE_MANAGED_UNVERIFIED,
    DataOriginStatus.MANUAL_PLACEHOLDER,
    DataOriginStatus.DEMO,
    DataOriginStatus.SEED,
    DataOriginStatus.VALIDATION,
    DataOriginStatus.UNKNOWN,
    DataOriginStatus.CONFLICTING,
  ]);
  if (quarantineTargets.has(proposedStatus)) {
    return "re-quarantine";
  }
  return "correction";
}

function determineReviewAction({
  current,
  originStatus,
  validationIssues,
}: {
  current: RecordClassification | null;
  originStatus: DataOriginStatus;
  validationIssues: string[];
}): ConnectorReviewAction {
  if (originStatus === DataOriginStatus.ARCHIVED_HISTORY) {
    return "RECORD_CLASSIFICATION_INVALID";
  }
  if (
    validationIssues.some((issue) =>
      issue.includes("Proposed classification is materially identical"),
    )
  ) {
    return "RECORD_CLASSIFICATION_INVALID";
  }
  if (validationIssues.some((issue) => issue.includes("belongs to another entity"))) {
    return "RECORD_CLASSIFICATION_CONFLICT";
  }
  if (validationIssues.length > 0) {
    return "RECORD_CLASSIFICATION_MISSING_EVIDENCE";
  }
  return current ? "UPDATE_RECORD_CLASSIFICATION" : "NEW_RECORD_CLASSIFICATION";
}

function buildProposalPayload({
  input,
  current,
  validationIssues,
  applyEligible,
  transitionType,
  evidenceState,
  entityLifecycleState,
  currentClassificationChecksum,
  proposedClassificationChecksum,
}: {
  input: RecordClassificationProposalInput;
  current: RecordClassification | null;
  validationIssues: string[];
  applyEligible: boolean;
  transitionType: ClassificationTransitionType;
  evidenceState: EvidenceState;
  entityLifecycleState: EntityLifecycleState;
  currentClassificationChecksum: string;
  proposedClassificationChecksum: string;
}): ClassificationProposalPayload {
  return {
    payloadType: recordClassificationPayloadType,
    payloadVersion: recordClassificationPayloadVersion,
    proposalVersion: 1,
    entityType: input.entityType,
    entityId: input.entityId,
    currentState: current ? "CLASSIFIED" : "UNCLASSIFIED",
    originStatus: input.originStatus,
    reason: input.reason.trim(),
    evidence: input.evidence ?? null,
    sourceLinkId: input.sourceLinkId ?? null,
    sourceSnapshotId: input.sourceSnapshotId ?? null,
    connectorReviewItemId: input.connectorReviewItemId ?? null,
    currentClassificationId: current?.id ?? null,
    currentClassificationChecksum,
    proposedClassificationChecksum,
    transitionType,
    evidenceState,
    evidenceStateChecksum: createStableChecksum(evidenceState),
    entityLifecycleState,
    entityLifecycleStateChecksum: createStableChecksum(entityLifecycleState),
    proposedAt: new Date().toISOString(),
    applyEligible,
    validationIssues,
  };
}

async function loadEntityLifecycleState(
  entityType: ClassifiableEntityType,
  entityId: string,
  client: PrismaExecutor,
): Promise<EntityLifecycleState> {
  const base = { entityType, entityId };
  switch (entityType) {
    case ClassifiableEntityType.SEASON: {
      const row = await client.season.findUnique({
        where: { id: entityId },
        select: { name: true, year: true, status: true, updatedAt: true },
      });
      return row
        ? {
            ...base,
            exists: true,
            label: row.name ?? String(row.year),
            status: row.status,
            updatedAt: row.updatedAt.toISOString(),
          }
        : { ...base, exists: false, label: null };
    }
    case ClassifiableEntityType.EVENT: {
      const row = await client.event.findUnique({
        where: { id: entityId },
        select: {
          name: true,
          status: true,
          visibility: true,
          archivedAt: true,
          updatedAt: true,
        },
      });
      return row
        ? lifecycleFromRow(base, row.name, row)
        : { ...base, exists: false, label: null };
    }
    case ClassifiableEntityType.RACE_STAGE: {
      const row = await client.raceStage.findUnique({
        where: { id: entityId },
        select: { name: true, status: true, updatedAt: true },
      });
      return row
        ? {
            ...base,
            exists: true,
            label: row.name,
            status: row.status,
            updatedAt: row.updatedAt.toISOString(),
          }
        : { ...base, exists: false, label: null };
    }
    case ClassifiableEntityType.RIDER: {
      const row = await client.rider.findUnique({
        where: { id: entityId },
        select: {
          firstName: true,
          lastName: true,
          visibility: true,
          archivedAt: true,
          updatedAt: true,
        },
      });
      return row
        ? lifecycleFromRow(base, `${row.firstName} ${row.lastName}`, row)
        : { ...base, exists: false, label: null };
    }
    case ClassifiableEntityType.TEAM: {
      const row = await client.team.findUnique({
        where: { id: entityId },
        select: {
          name: true,
          status: true,
          visibility: true,
          archivedAt: true,
          updatedAt: true,
        },
      });
      return row
        ? lifecycleFromRow(base, row.name, row)
        : { ...base, exists: false, label: null };
    }
    case ClassifiableEntityType.MANUFACTURER: {
      const row = await client.manufacturer.findUnique({
        where: { id: entityId },
        select: {
          name: true,
          status: true,
          visibility: true,
          archivedAt: true,
          updatedAt: true,
        },
      });
      return row
        ? lifecycleFromRow(base, row.name, row)
        : { ...base, exists: false, label: null };
    }
    case ClassifiableEntityType.MOTORCYCLE: {
      const row = await client.motorcycle.findUnique({
        where: { id: entityId },
        select: {
          model: true,
          year: true,
          status: true,
          visibility: true,
          archivedAt: true,
          updatedAt: true,
        },
      });
      return row
        ? lifecycleFromRow(base, [row.year, row.model].filter(Boolean).join(" "), row)
        : { ...base, exists: false, label: null };
    }
    case ClassifiableEntityType.RESULT: {
      const row = await client.result.findUnique({
        where: { id: entityId },
        select: { id: true, status: true, archivedAt: true, updatedAt: true },
      });
      return row
        ? lifecycleFromRow(base, row.id, row)
        : { ...base, exists: false, label: null };
    }
    case ClassifiableEntityType.STAGE_RESULT: {
      const row = await client.stageResult.findUnique({
        where: { id: entityId },
        select: { id: true, status: true, archivedAt: true, updatedAt: true },
      });
      return row
        ? lifecycleFromRow(base, row.id, row)
        : { ...base, exists: false, label: null };
    }
    case ClassifiableEntityType.RESULT_POINT_COMPONENT: {
      const row = await client.resultPointComponent.findUnique({
        where: { id: entityId },
        select: { id: true, archivedAt: true, updatedAt: true },
      });
      return row
        ? lifecycleFromRow(base, row.id, row)
        : { ...base, exists: false, label: null };
    }
    case ClassifiableEntityType.CHAMPIONSHIP_REGULATION: {
      const row = await client.championshipRegulation.findUnique({
        where: { id: entityId },
        select: { title: true, status: true, archivedAt: true, updatedAt: true },
      });
      return row
        ? lifecycleFromRow(base, row.title, row)
        : { ...base, exists: false, label: null };
    }
    case ClassifiableEntityType.STANDING: {
      const row = await client.standing.findUnique({
        where: { id: entityId },
        select: { id: true, updatedAt: true },
      });
      return row
        ? { ...base, exists: true, label: row.id, updatedAt: row.updatedAt.toISOString() }
        : { ...base, exists: false, label: null };
    }
    case ClassifiableEntityType.STANDING_PUBLICATION: {
      const row = await client.standingPublication.findUnique({
        where: { id: entityId },
        select: { id: true, status: true, updatedAt: true, supersededAt: true },
      });
      return row
        ? {
            ...base,
            exists: true,
            label: row.id,
            status: row.status,
            archivedAt: row.supersededAt?.toISOString() ?? null,
            updatedAt: row.updatedAt.toISOString(),
          }
        : { ...base, exists: false, label: null };
    }
    default:
      return { ...base, exists: false, label: null };
  }
}

function lifecycleFromRow(
  base: Pick<EntityLifecycleState, "entityType" | "entityId">,
  label: string,
  row: {
    archivedAt?: Date | null;
    status?: string | null;
    visibility?: string | null;
    updatedAt: Date;
  },
): EntityLifecycleState {
  return {
    ...base,
    exists: true,
    label,
    archivedAt: row.archivedAt?.toISOString() ?? null,
    status: row.status ?? null,
    visibility: row.visibility ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function validateEntityLifecycleState(state: EntityLifecycleState) {
  const issues: string[] = [];
  if (!state.exists) {
    issues.push(
      `Classifiable entity ${state.entityType}:${state.entityId} does not exist.`,
    );
  }
  if (state.archivedAt) {
    issues.push("Classified entity is archived or superseded.");
  }
  return issues;
}

async function findOrCreateSnapshot({
  payload,
  payloadChecksum,
  season,
  identityLabel,
  tx,
}: {
  payload: ClassificationProposalPayload;
  payloadChecksum: string;
  season: number;
  identityLabel: string | null;
  tx: PrismaTransaction;
}) {
  const existing = await tx.connectorSnapshot.findFirst({
    where: {
      connectorKey: recordClassificationConnectorKey,
      season,
      payloadChecksum,
    },
  });
  if (existing) return existing;

  return tx.connectorSnapshot.create({
    data: {
      connectorKey: recordClassificationConnectorKey,
      sourceKey: recordClassificationConnectorKey,
      season,
      coverageMode: "single-entity",
      inputSourceType: "admin-review",
      parserSelected: recordClassificationPayloadVersion,
      rawRecordCount: 1,
      usableEventCount: payload.applyEligible ? 1 : 0,
      rejectedRecordCount: payload.validationIssues.length ? 1 : 0,
      rejectionReasons: payload.validationIssues,
      fallbackUsed: false,
      normalizedPayload: payload as Prisma.InputJsonValue,
      matchingPayload: {
        entityType: payload.entityType,
        entityId: payload.entityId,
        label: identityLabel,
        currentClassificationId: payload.currentClassificationId,
      },
      diagnostics: {
        payloadType: payload.payloadType,
        payloadVersion: payload.payloadVersion,
        validationIssues: payload.validationIssues,
        behavior: "proposal-only; no RecordClassification write during generation",
      },
      payloadChecksum,
    },
  });
}

async function supersedeOlderClassificationProposals({
  entityType,
  entityId,
  newReviewItemId,
  newDeduplicationKey,
  tx,
}: {
  entityType: ClassifiableEntityType;
  entityId: string;
  newReviewItemId: string;
  newDeduplicationKey: string;
  tx: PrismaTransaction;
}) {
  const older = await tx.connectorReviewItem.findMany({
    where: {
      connectorKey: recordClassificationConnectorKey,
      deduplicationKey: { not: newDeduplicationKey },
      reviewStatus: { in: ["PENDING", "APPROVED"] },
      applicationStatus: { not: "APPLIED" },
      proposedValues: {
        path: ["entityId"],
        equals: entityId,
      },
    },
    select: { id: true, proposedValues: true },
  });
  const matchingIds = older
    .filter((item) => {
      try {
        return (
          parseClassificationProposalPayload(item.proposedValues).entityType ===
          entityType
        );
      } catch {
        return false;
      }
    })
    .map((item) => item.id);

  if (matchingIds.length === 0) return;

  await tx.connectorReviewItem.updateMany({
    where: { id: { in: matchingIds } },
    data: {
      reviewStatus: "SUPERSEDED",
      supersededByReviewItemId: newReviewItemId,
      version: { increment: 1 },
    },
  });
}

async function resolveClassificationSeason(
  entityType: ClassifiableEntityType,
  entityId: string,
  client: PrismaExecutor,
) {
  switch (entityType) {
    case ClassifiableEntityType.SEASON: {
      const season = await client.season.findUnique({
        where: { id: entityId },
        select: { year: true },
      });
      return season?.year ?? 0;
    }
    case ClassifiableEntityType.EVENT: {
      const event = await client.event.findUnique({
        where: { id: entityId },
        select: { season: { select: { year: true } } },
      });
      return event?.season.year ?? 0;
    }
    case ClassifiableEntityType.RACE_STAGE: {
      const stage = await client.raceStage.findUnique({
        where: { id: entityId },
        select: { event: { select: { season: { select: { year: true } } } } },
      });
      return stage?.event.season.year ?? 0;
    }
    case ClassifiableEntityType.RESULT: {
      const result = await client.result.findUnique({
        where: { id: entityId },
        select: { event: { select: { season: { select: { year: true } } } } },
      });
      return result?.event.season.year ?? 0;
    }
    case ClassifiableEntityType.STAGE_RESULT: {
      const result = await client.stageResult.findUnique({
        where: { id: entityId },
        select: {
          stage: {
            select: { event: { select: { season: { select: { year: true } } } } },
          },
        },
      });
      return result?.stage.event.season.year ?? 0;
    }
    case ClassifiableEntityType.RESULT_POINT_COMPONENT: {
      const component = await client.resultPointComponent.findUnique({
        where: { id: entityId },
        select: { event: { select: { season: { select: { year: true } } } } },
      });
      return component?.event.season.year ?? 0;
    }
    case ClassifiableEntityType.CHAMPIONSHIP_REGULATION: {
      const regulation = await client.championshipRegulation.findUnique({
        where: { id: entityId },
        select: { season: { select: { year: true } } },
      });
      return regulation?.season.year ?? 0;
    }
    case ClassifiableEntityType.STANDING: {
      const standing = await client.standing.findUnique({
        where: { id: entityId },
        select: { season: { select: { year: true } } },
      });
      return standing?.season.year ?? 0;
    }
    case ClassifiableEntityType.STANDING_PUBLICATION: {
      const publication = await client.standingPublication.findUnique({
        where: { id: entityId },
        select: { season: { select: { year: true } } },
      });
      return publication?.season.year ?? 0;
    }
    default:
      return 0;
  }
}

async function getClassificationSourceUrl(
  proposed: ClassificationProposalPayload,
  client: PrismaExecutor,
) {
  if (proposed.sourceLinkId) {
    const link = await client.sourceLink.findUnique({
      where: { id: proposed.sourceLinkId },
      select: { url: true },
    });
    if (link?.url) return link.url;
  }
  if (proposed.sourceSnapshotId) {
    const snapshot = await client.sourceSnapshot.findUnique({
      where: { id: proposed.sourceSnapshotId },
      select: { url: true },
    });
    if (snapshot?.url) return snapshot.url;
  }
  return null;
}

function recommendationForAction(
  action: ConnectorReviewAction,
  validationIssues: string[],
) {
  if (action === "RECORD_CLASSIFICATION_MISSING_EVIDENCE") {
    return `Attach required evidence before applying: ${validationIssues.join(" ")}`;
  }
  if (action === "RECORD_CLASSIFICATION_CONFLICT") {
    return "Resolve the conflicting evidence before applying a classification.";
  }
  if (action === "RECORD_CLASSIFICATION_INVALID") {
    return "Invalid classification proposals are retained for review and cannot be applied.";
  }
  return "Review the proposed classification and approve only if the evidence is correct.";
}

function parseEntityType(value: unknown): ClassifiableEntityType {
  if (typeof value !== "string" || !(value in ClassifiableEntityType)) {
    throw new Error("Unsupported classifiable entity type.");
  }
  return value as ClassifiableEntityType;
}

function parseOriginStatus(value: unknown): DataOriginStatus {
  if (typeof value !== "string" || !(value in DataOriginStatus)) {
    throw new Error("Unsupported data origin status.");
  }
  return value as DataOriginStatus;
}

function parseTransitionType(value: unknown): ClassificationTransitionType {
  if (
    value === "first-classification" ||
    value === "promotion" ||
    value === "re-quarantine" ||
    value === "correction"
  ) {
    return value;
  }
  throw new Error("Unsupported classification transition type.");
}

function parseEvidenceState(value: unknown): EvidenceState {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Evidence state is missing.");
  }
  const record = value as Record<string, unknown>;
  return {
    sourceLink: parseEvidenceStateRecord(record.sourceLink, [
      "id",
      "entityType",
      "entityId",
      "dataSourceId",
      "url",
    ]) as EvidenceState["sourceLink"],
    sourceSnapshot: parseEvidenceStateRecord(record.sourceSnapshot, [
      "id",
      "dataSourceId",
      "url",
      "contentHash",
    ]) as EvidenceState["sourceSnapshot"],
    connectorReviewItem: parseEvidenceStateRecord(record.connectorReviewItem, [
      "id",
      "connectorKey",
      "suggestedAction",
      "reviewStatus",
      "applicationStatus",
      "snapshotId",
    ]) as EvidenceState["connectorReviewItem"],
  };
}

function parseEntityLifecycleState(value: unknown): EntityLifecycleState {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Entity lifecycle state is missing.");
  }
  const record = value as Record<string, unknown>;
  return {
    entityType: parseEntityType(record.entityType),
    entityId: requiredString(record, "entityId"),
    exists: record.exists === true,
    label: getString(record, "label"),
    archivedAt: getString(record, "archivedAt"),
    status: getString(record, "status"),
    visibility: getString(record, "visibility"),
    updatedAt: getString(record, "updatedAt"),
  };
}

function parseEvidenceStateRecord(value: unknown, requiredKeys: string[]) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Evidence state is invalid.");
  }
  const record = value as Record<string, unknown>;
  for (const key of requiredKeys) {
    if (typeof record[key] !== "string") {
      throw new Error("Evidence state is incomplete.");
    }
  }
  return record;
}

function requiredString(value: Record<string, unknown>, key: string) {
  const field = value[key];
  if (typeof field !== "string" || field.trim().length === 0) {
    throw new Error(`${key} is required.`);
  }
  return field.trim();
}

function getString(value: Record<string, unknown>, key: string) {
  const field = value[key];
  return typeof field === "string" && field.trim().length > 0 ? field.trim() : null;
}

function readStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function createStableChecksum(value: unknown) {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

function sanitizeError(error: unknown) {
  if (error instanceof Error) {
    if (
      "code" in error &&
      typeof error.code === "string" &&
      ["P2034", "P2002", "P2025"].includes(error.code)
    ) {
      return "Classification workflow state changed concurrently. Please retry.";
    }
    if (
      error.message.includes("Transaction failed due to a write conflict") ||
      error.message.includes("Invalid `")
    ) {
      return "Classification workflow state changed concurrently. Please retry.";
    }
    return error.message;
  }
  return "The classification workflow failed safely.";
}
