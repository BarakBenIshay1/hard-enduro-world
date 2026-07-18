import { createHash } from "node:crypto";
import {
  ClassifiableEntityType,
  DataOriginStatus,
  type ConnectorReviewAction,
  type SourceReliability,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  classifiableEntityExists,
  classifiableEntityTypes,
  getActiveRecordClassification,
} from "@/lib/data-quality/record-classification";
import {
  getClassificationTransitionType,
  recordClassificationConnectorKey,
} from "@/lib/data-quality/record-classification-workflow";
import {
  canonicalSourceLinkEntityTypeForClassifiable,
  dedupeSourceLinksByLogicalEvidence,
  sourceLinkEntityTypeAliasesFor,
} from "@/lib/sources/source-link-entity-types";

type RuleState = "matched" | "missing" | "blocked" | "info";

export type ClassificationCandidateState =
  | "READY_FOR_PROPOSAL"
  | "REVIEW_REQUIRED"
  | "BLOCKED"
  | "NO_CANDIDATE"
  | "NO_CHANGE"
  | "ARCHIVED_ENTITY"
  | "UNSUPPORTED_EVIDENCE_PATH"
  | "STALE";

export type ClassificationAdapterSupport =
  | "SUPPORTED_FOR_ANALYSIS"
  | "SUPPORTED_FOR_PROPOSAL"
  | "READINESS_ONLY"
  | "BLOCKED_NO_EVIDENCE_PATH";

export type ClassificationCandidateRule = {
  label: string;
  state: RuleState;
  detail: string;
  ruleKey: string;
  category:
    | "IDENTITY"
    | "LIFECYCLE"
    | "SOURCE"
    | "OWNERSHIP"
    | "AUDIT"
    | "CONFLICT"
    | "TRANSITION"
    | "PLACEHOLDER"
    | "DEMO_TEST";
  outcome: "MATCH" | "FAIL" | "WARNING" | "NOT_APPLICABLE";
  severity: "INFO" | "WARNING" | "BLOCKING";
  mandatoryFor: DataOriginStatus[];
};

export type ClassificationCandidateEvidence = {
  sourceLinkId: string | null;
  sourceSnapshotId: string | null;
  connectorReviewItemId: string | null;
  sourceLinkLabel: string | null;
  sourceSnapshotLabel: string | null;
  connectorReviewLabel: string | null;
  completeOwnershipChains: string[];
  incompleteChains: string[];
  conflicts: string[];
  missing: string[];
  checksum: string;
};

export type ClassificationCandidate = {
  version: "classification-intelligence-v1";
  entityType: ClassifiableEntityType;
  entityId: string;
  entityLabel: string | null;
  supported: boolean;
  analysisSupport: ClassificationAdapterSupport;
  proposalSupport: ClassificationAdapterSupport;
  proposalDisabledReason: string | null;
  candidateState: ClassificationCandidateState;
  suggestedStatus: DataOriginStatus | null;
  transitionType:
    | "first-classification"
    | "promotion"
    | "re-quarantine"
    | "correction"
    | "no-change";
  reason: string;
  evidence: ClassificationCandidateEvidence;
  rules: ClassificationCandidateRule[];
  missingEvidence: string[];
  blockingIssues: string[];
  warnings: string[];
  parentChildWarnings: string[];
  eligible: boolean;
  candidateChecksum: string;
  entityChecksum: string;
  lifecycleChecksum: string;
  currentClassificationChecksum: string;
  existingClassificationId: string | null;
  duplicateProposalId: string | null;
  staleProposalIds: string[];
};

export const classificationProposalEntityTypes = new Set<ClassifiableEntityType>([
  ClassifiableEntityType.EVENT,
]);

const supportedEntityTypes = new Set<ClassifiableEntityType>(classifiableEntityTypes);

const positiveReviewActions = new Set<ConnectorReviewAction>([
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

export async function generateRecordClassificationCandidate(
  entityType: ClassifiableEntityType,
  entityId: string,
): Promise<ClassificationCandidate> {
  const identity = await classifiableEntityExists(entityType, entityId);
  const current = await getActiveRecordClassification(entityType, entityId);
  const lineage = await loadSourceLineage(entityType, entityId);
  const reviews = await loadSupportingReviews(entityType, entityId);
  const classificationReviews = await loadExistingClassificationReviews(
    entityType,
    entityId,
  );
  const lifecycle = await loadCandidateLifecycle(entityType, entityId);

  const rules: ClassificationCandidateRule[] = [];
  const missingEvidence: string[] = [];
  const blockingIssues: string[] = [];
  const warnings: string[] = [];

  const supported = supportedEntityTypes.has(entityType);
  const proposalSupported = classificationProposalEntityTypes.has(entityType);

  addRule(rules, {
    ruleKey: "identity.exists",
    category: "IDENTITY",
    label: "Entity exists",
    matched: identity.exists,
    detail: identity.exists ? (identity.label ?? entityId) : "Entity does not exist.",
    severity: identity.exists ? "INFO" : "BLOCKING",
    mandatoryFor: allActiveStatuses(),
  });
  addRule(rules, {
    ruleKey: "lifecycle.active",
    category: "LIFECYCLE",
    label: "Active lifecycle",
    matched: !lifecycle.archived,
    detail: lifecycle.archived
      ? "Entity is archived, superseded, or historical."
      : "Entity is active for candidate analysis.",
    severity: lifecycle.archived ? "BLOCKING" : "INFO",
    mandatoryFor: allActiveStatuses(),
  });

  if (!supported) blockingIssues.push("This entity type is not registered.");
  if (!identity.exists) blockingIssues.push("Entity does not exist.");
  if (lifecycle.archived) blockingIssues.push("Entity is archived or superseded.");

  const officialLink = lineage.sourceLinks.find(
    (link) => link.dataSource.reliability === "OFFICIAL",
  );
  const sourceLink = officialLink ?? lineage.sourceLinks[0] ?? null;
  const matchingSnapshot = sourceLink
    ? lineage.sourceSnapshots.find(
        (snapshot) =>
          snapshot.dataSourceId === sourceLink.dataSourceId &&
          snapshot.contentHash &&
          sourceUrlMatchesEvidence(
            snapshot.url,
            sourceLink.url,
            sourceLink.dataSource.baseUrl,
          ),
      )
    : (lineage.sourceSnapshots[0] ?? null);
  const appliedReview =
    reviews.find(
      (review) =>
        review.applicationStatus === "APPLIED" &&
        review.reviewStatus === "APPROVED" &&
        positiveReviewActions.has(review.suggestedAction),
    ) ?? null;
  const parentChildWarnings = buildParentChildWarnings({
    entityType,
    sourceLink: Boolean(sourceLink),
    appliedReview: Boolean(appliedReview),
  });
  const pendingDuplicate =
    classificationReviews.find(
      (review) => review.reviewStatus === "PENDING" || review.reviewStatus === "APPROVED",
    ) ?? null;

  const sourceUrls = lineage.sourceLinks.map((link) => link.url.toLowerCase());
  const explicitValidation = hasValidationSignal({
    identityLabel: identity.label,
    sourceUrls,
    lifecycle,
  });
  const explicitDemo = hasDemoSignal({ identityLabel: identity.label, sourceUrls });
  const explicitSeed = lifecycle.hasSeedAudit;
  const placeholder = hasPlaceholderSignal({ identityLabel: identity.label, sourceUrls });
  const conflicts = collectConflicts(lineage.sourceLinks);

  addRule(rules, {
    ruleKey: "source.source-link",
    category: "SOURCE",
    label: "Matching SourceLink",
    matched: Boolean(sourceLink),
    detail: sourceLink
      ? `${sourceLink.dataSource.name} · ${sourceLink.url}`
      : "No SourceLink is attached to this entity.",
    severity: "WARNING",
    mandatoryFor: [
      DataOriginStatus.VERIFIED_OFFICIAL,
      DataOriginStatus.SOURCE_MANAGED_UNVERIFIED,
    ],
  });
  addRule(rules, {
    ruleKey: "source.official-reliability",
    category: "SOURCE",
    label: "Official source reliability",
    matched: Boolean(sourceLink && sourceLink.dataSource.reliability === "OFFICIAL"),
    detail: sourceLink
      ? `${sourceLink.dataSource.reliability} source`
      : "No source reliability is available.",
    severity: "WARNING",
    mandatoryFor: [DataOriginStatus.VERIFIED_OFFICIAL],
  });
  addRule(rules, {
    ruleKey: "source.snapshot",
    category: "SOURCE",
    label: "Matching SourceSnapshot",
    matched: Boolean(matchingSnapshot),
    detail: matchingSnapshot
      ? `${matchingSnapshot.id} · ${matchingSnapshot.contentHash}`
      : "No checksummed SourceSnapshot matches the selected SourceLink.",
    severity: "WARNING",
    mandatoryFor: [DataOriginStatus.VERIFIED_OFFICIAL],
  });
  addRule(rules, {
    ruleKey: "review.applied-lineage",
    category: "AUDIT",
    label: "Applied review lineage",
    matched: Boolean(appliedReview),
    detail: appliedReview
      ? `${appliedReview.suggestedAction} · ${appliedReview.id}`
      : "No applied source review is tied to this entity.",
    severity: "INFO",
    mandatoryFor: [],
  });
  addRule(rules, {
    ruleKey: "proposal.duplicate",
    category: "TRANSITION",
    label: "Duplicate proposal check",
    matched: !pendingDuplicate,
    detail: pendingDuplicate
      ? `Existing ${pendingDuplicate.reviewStatus.toLowerCase()} proposal ${pendingDuplicate.id}`
      : "No active classification proposal exists for this entity.",
    severity: pendingDuplicate ? "BLOCKING" : "INFO",
    mandatoryFor: allActiveStatuses(),
  });
  addRule(rules, {
    ruleKey: "classification.no-op",
    category: "TRANSITION",
    label: "No-op check",
    matched: !current,
    detail: current
      ? `Already classified as ${current.originStatus}.`
      : "No active classification exists.",
    severity: "INFO",
    mandatoryFor: [],
  });

  let suggestedStatus: DataOriginStatus | null = null;
  if (conflicts.length > 0) {
    suggestedStatus = DataOriginStatus.CONFLICTING;
    blockingIssues.push("Conflicting source evidence requires human resolution.");
  } else if (explicitValidation) {
    suggestedStatus = DataOriginStatus.VALIDATION;
  } else if (explicitSeed) {
    suggestedStatus = DataOriginStatus.SEED;
  } else if (explicitDemo) {
    suggestedStatus = DataOriginStatus.DEMO;
  } else if (placeholder) {
    suggestedStatus = DataOriginStatus.MANUAL_PLACEHOLDER;
  } else if (
    sourceLink &&
    sourceLink.dataSource.reliability === "OFFICIAL" &&
    matchingSnapshot
  ) {
    suggestedStatus = DataOriginStatus.VERIFIED_OFFICIAL;
  } else if (sourceLink || matchingSnapshot || appliedReview) {
    suggestedStatus = DataOriginStatus.SOURCE_MANAGED_UNVERIFIED;
  } else if (lifecycle.hasManualAudit) {
    suggestedStatus = DataOriginStatus.AUDITED_MANUAL;
  } else if (current?.originStatus === DataOriginStatus.UNKNOWN) {
    suggestedStatus = DataOriginStatus.UNKNOWN;
  } else {
    suggestedStatus = null;
    warnings.push("No production provenance is attached.");
  }

  if (!sourceLink) missingEvidence.push("SourceLink");
  if (sourceLink && !matchingSnapshot) missingEvidence.push("SourceSnapshot");
  if (suggestedStatus === DataOriginStatus.VERIFIED_OFFICIAL && !matchingSnapshot) {
    blockingIssues.push("Verified official classification requires a matching snapshot.");
  }
  if (pendingDuplicate)
    blockingIssues.push("An active classification proposal already exists.");
  const sameStatusMaterialEvidence =
    current?.originStatus === suggestedStatus &&
    current.sourceLinkId === (sourceLink?.id ?? null) &&
    current.sourceSnapshotId === (matchingSnapshot?.id ?? null) &&
    current.connectorReviewItemId === (appliedReview?.id ?? null);
  if (sameStatusMaterialEvidence) {
    blockingIssues.push("Suggested classification is a no-op.");
  }
  if (!proposalSupported) {
    warnings.push(
      "Proposal generation is disabled for this entity type in this rollout.",
    );
  }
  if (classificationReviews.some((review) => review.reviewStatus === "SUPERSEDED")) {
    rules.push({
      label: "Stale proposal history",
      state: "info",
      detail: "Superseded classification proposals exist and remain historical.",
      ruleKey: "proposal.stale-history",
      category: "TRANSITION",
      outcome: "WARNING",
      severity: "INFO",
      mandatoryFor: [],
    });
  }

  const transitionType = sameStatusMaterialEvidence
    ? "no-change"
    : suggestedStatus
      ? getClassificationTransitionType(current, suggestedStatus)
      : "first-classification";
  const candidateState = getCandidateState({
    supported,
    exists: identity.exists,
    archived: lifecycle.archived,
    pendingDuplicate: Boolean(pendingDuplicate),
    currentStatus: current?.originStatus ?? null,
    sameStatusMaterialEvidence,
    suggestedStatus,
    blockingIssues,
  });
  const eligible =
    candidateState === "READY_FOR_PROPOSAL" &&
    Boolean(suggestedStatus) &&
    proposalSupported &&
    identity.exists &&
    !lifecycle.archived &&
    !pendingDuplicate;
  const evidenceChecksum = createStableChecksum({
    sourceLinkId: sourceLink?.id ?? null,
    sourceSnapshotId: matchingSnapshot?.id ?? null,
    connectorReviewItemId: appliedReview?.id ?? null,
    conflicts,
    missingEvidence,
  });
  const entityChecksum = createStableChecksum({
    entityType,
    entityId,
    label: identity.label,
  });
  const lifecycleChecksum = createStableChecksum(lifecycle);
  const currentClassificationChecksum = createStableChecksum(
    current
      ? {
          id: current.id,
          originStatus: current.originStatus,
          reason: current.reason,
          sourceLinkId: current.sourceLinkId,
          sourceSnapshotId: current.sourceSnapshotId,
          connectorReviewItemId: current.connectorReviewItemId,
        }
      : { state: "UNCLASSIFIED" },
  );
  const candidateChecksum = createStableChecksum({
    version: "classification-intelligence-v1",
    entityChecksum,
    lifecycleChecksum,
    currentClassificationChecksum,
    evidenceChecksum,
    candidateState,
    suggestedStatus,
    transitionType,
    eligible,
    rules,
    warnings,
    blockingIssues,
  });
  const reason = buildReason({
    suggestedStatus,
    sourceLinkReliability: sourceLink?.dataSource.reliability ?? null,
    hasSnapshot: Boolean(matchingSnapshot),
    hasAppliedReview: Boolean(appliedReview),
    hasManualAudit: lifecycle.hasManualAudit,
  });

  return {
    version: "classification-intelligence-v1",
    entityType,
    entityId,
    entityLabel: identity.label,
    supported,
    analysisSupport: supported ? "SUPPORTED_FOR_ANALYSIS" : "BLOCKED_NO_EVIDENCE_PATH",
    proposalSupport: proposalSupported ? "SUPPORTED_FOR_PROPOSAL" : "READINESS_ONLY",
    proposalDisabledReason: proposalSupported
      ? null
      : "Proposal generation is enabled for Event classifications only in this rollout.",
    candidateState,
    suggestedStatus,
    transitionType,
    reason,
    evidence: {
      sourceLinkId: sourceLink?.id ?? null,
      sourceSnapshotId: matchingSnapshot?.id ?? null,
      connectorReviewItemId: appliedReview?.id ?? null,
      sourceLinkLabel: sourceLink
        ? `${sourceLink.dataSource.name} · ${sourceLink.url}`
        : null,
      sourceSnapshotLabel: matchingSnapshot
        ? `${matchingSnapshot.id} · ${matchingSnapshot.contentHash}`
        : null,
      connectorReviewLabel: appliedReview
        ? `${appliedReview.suggestedAction} · ${appliedReview.id}`
        : null,
      completeOwnershipChains:
        sourceLink && matchingSnapshot
          ? [
              `${entityType}:${entityId} -> SourceLink:${sourceLink.id} -> SourceSnapshot:${matchingSnapshot.id}`,
            ]
          : [],
      incompleteChains: [
        !sourceLink ? "Missing SourceLink" : null,
        sourceLink && !matchingSnapshot ? "Missing matching SourceSnapshot" : null,
      ].filter(Boolean) as string[],
      conflicts,
      missing: Array.from(new Set(missingEvidence)),
      checksum: evidenceChecksum,
    },
    rules,
    missingEvidence: Array.from(new Set(missingEvidence)),
    blockingIssues: Array.from(new Set(blockingIssues)),
    warnings: Array.from(new Set(warnings)),
    parentChildWarnings,
    eligible,
    candidateChecksum,
    entityChecksum,
    lifecycleChecksum,
    currentClassificationChecksum,
    existingClassificationId: current?.id ?? null,
    duplicateProposalId: pendingDuplicate?.id ?? null,
    staleProposalIds: classificationReviews
      .filter((review) => review.reviewStatus === "SUPERSEDED")
      .map((review) => review.id),
  };
}

function getCandidateState({
  supported,
  exists,
  archived,
  pendingDuplicate,
  currentStatus,
  sameStatusMaterialEvidence,
  suggestedStatus,
  blockingIssues,
}: {
  supported: boolean;
  exists: boolean;
  archived: boolean;
  pendingDuplicate: boolean;
  currentStatus: DataOriginStatus | null;
  sameStatusMaterialEvidence: boolean;
  suggestedStatus: DataOriginStatus | null;
  blockingIssues: string[];
}): ClassificationCandidateState {
  if (!supported) return "UNSUPPORTED_EVIDENCE_PATH";
  if (!exists) return "BLOCKED";
  if (archived) return "ARCHIVED_ENTITY";
  if (!suggestedStatus) return "NO_CANDIDATE";
  if (currentStatus === suggestedStatus && sameStatusMaterialEvidence) return "NO_CHANGE";
  if (pendingDuplicate || blockingIssues.length > 0) return "BLOCKED";
  if (
    suggestedStatus === DataOriginStatus.UNKNOWN ||
    suggestedStatus === DataOriginStatus.MANUAL_PLACEHOLDER ||
    suggestedStatus === DataOriginStatus.DEMO ||
    suggestedStatus === DataOriginStatus.SEED ||
    suggestedStatus === DataOriginStatus.VALIDATION ||
    suggestedStatus === DataOriginStatus.CONFLICTING
  ) {
    return "REVIEW_REQUIRED";
  }
  return "READY_FOR_PROPOSAL";
}

async function loadSourceLineage(entityType: ClassifiableEntityType, entityId: string) {
  const legacyType = legacyEntityType(entityType);
  if (!legacyType) return { sourceLinks: [], sourceSnapshots: [] };

  const sourceLinks = dedupeSourceLinksByLogicalEvidence(
    await prisma.sourceLink.findMany({
      where: { entityType: { in: sourceLinkEntityTypeAliasesFor(legacyType) }, entityId },
      include: { dataSource: true },
      orderBy: { createdAt: "desc" },
    }),
  );
  const dataSourceIds = Array.from(new Set(sourceLinks.map((link) => link.dataSourceId)));

  const directSnapshots =
    entityType === ClassifiableEntityType.CHAMPIONSHIP_REGULATION
      ? await prisma.championshipRegulation
          .findUnique({
            where: { id: entityId },
            select: {
              sourceSnapshot: {
                select: {
                  id: true,
                  dataSourceId: true,
                  url: true,
                  contentHash: true,
                  fetchedAt: true,
                },
              },
            },
          })
          .then((regulation) =>
            regulation?.sourceSnapshot ? [regulation.sourceSnapshot] : [],
          )
      : [];

  const sourceSnapshots = dataSourceIds.length
    ? await prisma.sourceSnapshot.findMany({
        where: { dataSourceId: { in: dataSourceIds }, errorMessage: null },
        orderBy: { fetchedAt: "desc" },
        select: {
          id: true,
          dataSourceId: true,
          url: true,
          contentHash: true,
          fetchedAt: true,
        },
      })
    : [];

  return { sourceLinks, sourceSnapshots: [...directSnapshots, ...sourceSnapshots] };
}

async function loadSupportingReviews(
  entityType: ClassifiableEntityType,
  entityId: string,
) {
  const whereByType = reviewWhereForEntity(entityType, entityId);
  if (!whereByType) return [];

  return prisma.connectorReviewItem.findMany({
    where: {
      connectorKey: { not: recordClassificationConnectorKey },
      OR: whereByType,
    },
    select: {
      id: true,
      suggestedAction: true,
      reviewStatus: true,
      applicationStatus: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

async function loadExistingClassificationReviews(
  entityType: ClassifiableEntityType,
  entityId: string,
) {
  return prisma.connectorReviewItem
    .findMany({
      where: {
        connectorKey: recordClassificationConnectorKey,
        proposedValues: {
          path: ["entityId"],
          equals: entityId,
        },
      },
      select: {
        id: true,
        reviewStatus: true,
        applicationStatus: true,
        proposedValues: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    })
    .then((items) =>
      items.filter((item) => {
        const proposed =
          item.proposedValues &&
          typeof item.proposedValues === "object" &&
          !Array.isArray(item.proposedValues)
            ? (item.proposedValues as Record<string, unknown>)
            : null;
        return proposed?.entityType === entityType;
      }),
    );
}

async function loadCandidateLifecycle(
  entityType: ClassifiableEntityType,
  entityId: string,
) {
  const legacyType = legacyEntityType(entityType) ?? entityType;
  const versions = await prisma.dataVersion.count({
    where: { entityType: legacyType, entityId },
  });
  const seedVersions = await prisma.dataVersion.count({
    where: { entityType: legacyType, entityId, createdBy: { contains: "seed" } },
  });
  const validationVersions = await prisma.dataVersion.count({
    where: {
      entityType: legacyType,
      entityId,
      OR: [
        { createdBy: { contains: "validation" } },
        { sourceUrl: { contains: "validation" } },
      ],
    },
  });
  const archived = await entityArchived(entityType, entityId);

  return {
    hasManualAudit: versions > 0,
    hasSeedAudit: seedVersions > 0,
    hasValidationAudit: validationVersions > 0,
    archived,
  };
}

async function entityArchived(entityType: ClassifiableEntityType, entityId: string) {
  switch (entityType) {
    case ClassifiableEntityType.EVENT:
      return Boolean(
        await prisma.event
          .findUnique({ where: { id: entityId }, select: { archivedAt: true } })
          .then((row) => row?.archivedAt),
      );
    case ClassifiableEntityType.RIDER:
      return Boolean(
        await prisma.rider
          .findUnique({ where: { id: entityId }, select: { archivedAt: true } })
          .then((row) => row?.archivedAt),
      );
    case ClassifiableEntityType.TEAM:
      return Boolean(
        await prisma.team
          .findUnique({ where: { id: entityId }, select: { archivedAt: true } })
          .then((row) => row?.archivedAt),
      );
    case ClassifiableEntityType.MANUFACTURER:
      return Boolean(
        await prisma.manufacturer
          .findUnique({ where: { id: entityId }, select: { archivedAt: true } })
          .then((row) => row?.archivedAt),
      );
    case ClassifiableEntityType.MOTORCYCLE:
      return Boolean(
        await prisma.motorcycle
          .findUnique({ where: { id: entityId }, select: { archivedAt: true } })
          .then((row) => row?.archivedAt),
      );
    case ClassifiableEntityType.RESULT:
      return Boolean(
        await prisma.result
          .findUnique({ where: { id: entityId }, select: { archivedAt: true } })
          .then((row) => row?.archivedAt),
      );
    case ClassifiableEntityType.STAGE_RESULT:
      return Boolean(
        await prisma.stageResult
          .findUnique({ where: { id: entityId }, select: { archivedAt: true } })
          .then((row) => row?.archivedAt),
      );
    case ClassifiableEntityType.RESULT_POINT_COMPONENT:
      return Boolean(
        await prisma.resultPointComponent
          .findUnique({ where: { id: entityId }, select: { archivedAt: true } })
          .then((row) => row?.archivedAt),
      );
    case ClassifiableEntityType.CHAMPIONSHIP_REGULATION:
      return Boolean(
        await prisma.championshipRegulation
          .findUnique({ where: { id: entityId }, select: { archivedAt: true } })
          .then((row) => row?.archivedAt),
      );
    case ClassifiableEntityType.STANDING_PUBLICATION:
      return Boolean(
        await prisma.standingPublication
          .findUnique({ where: { id: entityId }, select: { supersededAt: true } })
          .then((row) => row?.supersededAt),
      );
    default:
      return false;
  }
}

function reviewWhereForEntity(entityType: ClassifiableEntityType, entityId: string) {
  switch (entityType) {
    case ClassifiableEntityType.EVENT:
      return [{ currentEventId: entityId }, { appliedEventId: entityId }];
    case ClassifiableEntityType.RESULT:
      return [{ currentResultId: entityId }, { appliedResultId: entityId }];
    case ClassifiableEntityType.STAGE_RESULT:
      return [{ currentStageResultId: entityId }, { appliedStageResultId: entityId }];
    case ClassifiableEntityType.RESULT_POINT_COMPONENT:
      return [
        { currentResultPointComponentId: entityId },
        { appliedResultPointComponentId: entityId },
      ];
    case ClassifiableEntityType.STANDING:
      return [{ currentStandingId: entityId }, { appliedStandingId: entityId }];
    default:
      return null;
  }
}

function legacyEntityType(entityType: ClassifiableEntityType) {
  switch (entityType) {
    case ClassifiableEntityType.SEASON:
      return "Season";
    case ClassifiableEntityType.EVENT:
      return "Event";
    case ClassifiableEntityType.RACE_STAGE:
      return "RaceStage";
    case ClassifiableEntityType.RIDER:
      return "Rider";
    case ClassifiableEntityType.TEAM:
      return "Team";
    case ClassifiableEntityType.MANUFACTURER:
      return "Manufacturer";
    case ClassifiableEntityType.MOTORCYCLE:
      return "Motorcycle";
    case ClassifiableEntityType.RESULT:
      return canonicalSourceLinkEntityTypeForClassifiable(entityType);
    case ClassifiableEntityType.STAGE_RESULT:
      return canonicalSourceLinkEntityTypeForClassifiable(entityType);
    case ClassifiableEntityType.RESULT_POINT_COMPONENT:
      return "ResultPointComponent";
    case ClassifiableEntityType.CHAMPIONSHIP_REGULATION:
      return "ChampionshipRegulation";
    case ClassifiableEntityType.STANDING:
      return "Standing";
    case ClassifiableEntityType.STANDING_PUBLICATION:
      return "StandingPublication";
    default:
      return null;
  }
}

function addRule(
  rules: ClassificationCandidateRule[],
  input: {
    ruleKey: string;
    category: ClassificationCandidateRule["category"];
    label: string;
    matched: boolean;
    detail: string;
    severity: ClassificationCandidateRule["severity"];
    mandatoryFor: DataOriginStatus[];
  },
) {
  rules.push({
    ruleKey: input.ruleKey,
    category: input.category,
    label: input.label,
    state: input.matched
      ? "matched"
      : input.severity === "BLOCKING"
        ? "blocked"
        : "missing",
    outcome: input.matched ? "MATCH" : input.severity === "BLOCKING" ? "FAIL" : "WARNING",
    severity: input.severity,
    mandatoryFor: input.mandatoryFor,
    detail: input.detail,
  });
}

function buildReason({
  suggestedStatus,
  sourceLinkReliability,
  hasSnapshot,
  hasAppliedReview,
  hasManualAudit,
}: {
  suggestedStatus: DataOriginStatus | null;
  sourceLinkReliability: SourceReliability | null;
  hasSnapshot: boolean;
  hasAppliedReview: boolean;
  hasManualAudit: boolean;
}) {
  if (!suggestedStatus) {
    return "No deterministic classification candidate could be generated from the current evidence.";
  }
  if (suggestedStatus === DataOriginStatus.CONFLICTING) {
    return "Material evidence conflict detected. Human resolution is required.";
  }
  if (
    suggestedStatus === DataOriginStatus.DEMO ||
    suggestedStatus === DataOriginStatus.SEED ||
    suggestedStatus === DataOriginStatus.VALIDATION ||
    suggestedStatus === DataOriginStatus.MANUAL_PLACEHOLDER
  ) {
    return `Explicit ${suggestedStatus.toLowerCase()} signal detected in source, audit, or identity metadata.`;
  }
  if (suggestedStatus === DataOriginStatus.VERIFIED_OFFICIAL) {
    return "Official SourceLink and matching checksummed SourceSnapshot support verified official classification.";
  }
  if (suggestedStatus === DataOriginStatus.SOURCE_MANAGED_UNVERIFIED) {
    return [
      sourceLinkReliability ? `${sourceLinkReliability} source lineage exists` : null,
      hasSnapshot ? "snapshot lineage exists" : null,
      hasAppliedReview ? "applied review lineage exists" : null,
    ]
      .filter(Boolean)
      .join("; ");
  }
  if (suggestedStatus === DataOriginStatus.AUDITED_MANUAL && hasManualAudit) {
    return "Manual audit history exists, but official source evidence is not attached.";
  }
  return "Insufficient evidence for an official or audited classification.";
}

function sourceUrlMatchesEvidence(
  snapshotUrl: string,
  sourceLinkUrl: string,
  baseUrl: string | null,
) {
  if (normalizeSourceUrl(snapshotUrl) !== normalizeSourceUrl(sourceLinkUrl)) {
    return false;
  }
  if (!baseUrl) return true;
  try {
    return new URL(snapshotUrl).hostname === new URL(baseUrl).hostname;
  } catch {
    return false;
  }
}

function hasValidationSignal({
  identityLabel,
  sourceUrls,
  lifecycle,
}: {
  identityLabel: string | null;
  sourceUrls: string[];
  lifecycle: { hasValidationAudit: boolean };
}) {
  const label = identityLabel?.toLowerCase() ?? "";
  return (
    lifecycle.hasValidationAudit ||
    label.includes("validation") ||
    sourceUrls.some((url) => url.includes("validation"))
  );
}

function hasDemoSignal({
  identityLabel,
  sourceUrls,
}: {
  identityLabel: string | null;
  sourceUrls: string[];
}) {
  const label = identityLabel?.toLowerCase() ?? "";
  return (
    label.includes("demo") ||
    sourceUrls.some((url) => url.includes("example.com") || url.includes("demo"))
  );
}

function hasPlaceholderSignal({
  identityLabel,
  sourceUrls,
}: {
  identityLabel: string | null;
  sourceUrls: string[];
}) {
  const label = identityLabel?.toLowerCase() ?? "";
  return (
    label.includes("placeholder") ||
    label.includes("tbd") ||
    sourceUrls.some((url) => url.includes("placeholder"))
  );
}

function collectConflicts(
  sourceLinks: Array<{
    url: string;
    dataSourceId: string;
    dataSource: { reliability: SourceReliability };
  }>,
) {
  const officialLinks = sourceLinks.filter(
    (link) => link.dataSource.reliability === "OFFICIAL",
  );
  const officialUrls = new Set(officialLinks.map((link) => normalizeSourceUrl(link.url)));
  const officialSourceIds = new Set(officialLinks.map((link) => link.dataSourceId));
  const conflicts: string[] = [];
  if (officialUrls.size > 1)
    conflicts.push("Multiple official SourceLink URLs disagree.");
  if (officialSourceIds.size > 1) {
    conflicts.push("Multiple official DataSources are attached to one entity.");
  }
  return conflicts;
}

function buildParentChildWarnings({
  entityType,
  sourceLink,
  appliedReview,
}: {
  entityType: ClassifiableEntityType;
  sourceLink: boolean;
  appliedReview: boolean;
}) {
  const warnings: string[] = [];
  if (entityType !== ClassifiableEntityType.EVENT && !sourceLink && appliedReview) {
    warnings.push(
      "DEPENDENCY_WARNING: supporting review lineage exists but direct SourceLink evidence is missing.",
    );
  }
  if (entityType === ClassifiableEntityType.RACE_STAGE && !sourceLink) {
    warnings.push(
      "PARENT_BLOCKER: RaceStage verification depends on an Event/stage source identity chain.",
    );
  }
  return warnings;
}

function normalizeSourceUrl(url: string) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.search = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return url.trim().toLowerCase();
  }
}

function allActiveStatuses() {
  return Object.values(DataOriginStatus).filter(
    (status) => status !== DataOriginStatus.ARCHIVED_HISTORY,
  );
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
