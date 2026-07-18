import { createHash } from "node:crypto";
import {
  ClassifiableEntityType,
  DataOriginStatus,
  Prisma,
  type ConnectorReviewAction,
  type SourceReliability,
} from "@prisma/client";

import {
  entityTypeLabel,
  existingDetailHref,
  getEntityIdentities,
} from "@/db/admin-classifications";
import {
  classificationProposalEntityTypes,
  generateRecordClassificationCandidate,
  type ClassificationAdapterSupport,
  type ClassificationCandidate,
  type ClassificationCandidateRule,
  type ClassificationCandidateState,
} from "@/lib/data-quality/record-classification-candidates";
import { classifiableEntityTypes } from "@/lib/data-quality/record-classification";
import { prisma } from "@/lib/prisma";
import {
  canonicalSourceLinkEntityTypeForClassifiable,
  classifiableEntityTypeFromSourceLink,
  dedupeSourceLinksByLogicalEvidence,
  sourceLinkEntityTypeAliasesFor,
} from "@/lib/sources/source-link-entity-types";

export const classificationIntelligenceVersion = "classification-intelligence-v1";

export type ClassificationEntityAdapter = {
  entityType: ClassifiableEntityType;
  label: string;
  analysisSupport: ClassificationAdapterSupport;
  proposalSupport: ClassificationAdapterSupport;
  detailRouteSupport: ClassificationAdapterSupport;
  supportingReviewSupport: ClassificationAdapterSupport;
  getDetailHref(entityId: string): string | null;
};

export type ClassificationReadinessReport = {
  version: typeof classificationIntelligenceVersion;
  generatedAt: null;
  overview: ClassificationReadinessSummary;
  capabilityMatrix: ClassificationEntityAdapter[];
  rows: ClassificationCandidate[];
  byEntityType: Array<
    ClassificationReadinessSummary & {
      entityType: ClassifiableEntityType;
      label: string;
    }
  >;
  missingEvidence: Array<{ requirement: string; count: number }>;
  conflicts: ClassificationCandidate[];
  suspicious: ClassificationCandidate[];
  events2026: {
    summary: ClassificationReadinessSummary;
    rows: ClassificationCandidate[];
    erzbergrodeo: ClassificationCandidate | null;
  };
  performance: {
    strategy: string;
    queryPattern: string;
    currentScale: string;
    limitation: string;
  };
};

export type ClassificationReadinessSummary = {
  total: number;
  readyForProposal: number;
  reviewRequired: number;
  blocked: number;
  noCandidate: number;
  noChange: number;
  unsupportedEvidencePath: number;
  archivedEntity: number;
  verifiedOfficial: number;
  sourceManaged: number;
  auditedManual: number;
  manualPlaceholder: number;
  demo: number;
  seed: number;
  validation: number;
  unknown: number;
  conflicting: number;
};

type EntityIdentitySummary = Awaited<ReturnType<typeof getEntityIdentities>>[number] & {
  entityType: ClassifiableEntityType;
};

type ActiveClassificationSummary = {
  id: string;
  entityType: ClassifiableEntityType;
  entityId: string;
  originStatus: DataOriginStatus;
  reason: string;
  evidence: unknown;
  sourceLinkId: string | null;
  sourceSnapshotId: string | null;
  connectorReviewItemId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type SourceLinkSummary = {
  id: string;
  dataSourceId: string;
  url: string;
  entityType: string;
  entityId: string;
  dataSource: {
    id: string;
    name: string;
    baseUrl: string | null;
    reliability: SourceReliability;
  };
};

type SourceSnapshotSummary = {
  id: string;
  dataSourceId: string;
  url: string;
  contentHash: string;
  fetchedAt: Date;
};

type ReviewSummary = {
  id: string;
  suggestedAction: ConnectorReviewAction;
  reviewStatus: string;
  applicationStatus: string;
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
  updatedAt: Date;
};

type ClassificationReviewSummary = {
  id: string;
  reviewStatus: string;
  applicationStatus: string;
  proposedValues: unknown;
  updatedAt: Date;
};

type AuditSummary = {
  hasManualAudit: boolean;
  hasSeedAudit: boolean;
  hasValidationAudit: boolean;
};

type BatchEvidence = {
  activeClassifications: Map<string, ActiveClassificationSummary>;
  classificationReviews: Map<string, ClassificationReviewSummary[]>;
  sourceLinks: Map<string, SourceLinkSummary[]>;
  sourceSnapshotsByDataSource: Map<string, SourceSnapshotSummary[]>;
  supportingReviews: Map<string, ReviewSummary[]>;
  audit: Map<string, AuditSummary>;
};

const supportingReviewEntityTypes = new Set<ClassifiableEntityType>([
  ClassifiableEntityType.EVENT,
  ClassifiableEntityType.RESULT,
  ClassifiableEntityType.STAGE_RESULT,
  ClassifiableEntityType.RESULT_POINT_COMPONENT,
  ClassifiableEntityType.STANDING,
]);

export const classificationEntityAdapters: ClassificationEntityAdapter[] =
  classifiableEntityTypes.map((entityType) => ({
    entityType,
    label: entityTypeLabel(entityType),
    analysisSupport: "SUPPORTED_FOR_ANALYSIS",
    proposalSupport: classificationProposalEntityTypes.has(entityType)
      ? "SUPPORTED_FOR_PROPOSAL"
      : "READINESS_ONLY",
    detailRouteSupport: existingDetailHref(entityType, "__id__")
      ? "SUPPORTED_FOR_ANALYSIS"
      : "READINESS_ONLY",
    supportingReviewSupport: supportingReviewEntityTypes.has(entityType)
      ? "SUPPORTED_FOR_ANALYSIS"
      : "READINESS_ONLY",
    getDetailHref: (entityId) => existingDetailHref(entityType, entityId),
  }));

export async function generateClassificationCandidate({
  entityType,
  entityId,
}: {
  entityType: ClassifiableEntityType;
  entityId: string;
  mode?: "SUMMARY" | "DETAIL";
}) {
  return generateRecordClassificationCandidate(entityType, entityId);
}

export async function generateClassificationCandidates({
  entityType,
  entityIds,
}: {
  entityType: ClassifiableEntityType;
  entityIds: string[];
  mode?: "SUMMARY" | "DETAIL";
}) {
  const uniqueIds = Array.from(new Set(entityIds));
  const identities = await getEntityIdentities(entityType, "all");
  const requested = identities
    .filter((identity) => uniqueIds.includes(identity.entityId))
    .map((identity) => ({ ...identity, entityType }));
  return generateClassificationCandidatesForIdentities(requested);
}

export async function generateClassificationReadinessReport({
  entityTypes = [...classifiableEntityTypes],
  year,
}: {
  entityTypes?: ClassifiableEntityType[];
  year?: number;
  seasonId?: string;
  filters?: Record<string, string>;
} = {}): Promise<ClassificationReadinessReport> {
  const identityGroups: Array<{
    entityType: ClassifiableEntityType;
    identities: Awaited<ReturnType<typeof getEntityIdentities>>;
  }> = [];
  for (const entityType of entityTypes) {
    identityGroups.push({
      entityType,
      identities: await getEntityIdentities(entityType, "all"),
    });
  }
  const allIdentities = identityGroups.flatMap((group) =>
    group.identities.map((identity) => ({ ...identity, entityType: group.entityType })),
  );
  const rows = await generateClassificationCandidatesForIdentities(allIdentities);
  const filteredRows =
    typeof year === "number"
      ? rows.filter(
          (row) =>
            row.entityLabel?.includes(String(year)) ||
            row.entityType !== ClassifiableEntityType.EVENT,
        )
      : rows;
  const eventRows = rows.filter((row) => row.entityType === ClassifiableEntityType.EVENT);
  const eventSeasonYears = new Map(
    allIdentities
      .filter((identity) => identity.entityType === ClassifiableEntityType.EVENT)
      .map((identity) => [identity.entityId, identity.seasonYear ?? null]),
  );
  const events2026Rows = eventRows.filter(
    (row) => eventSeasonYears.get(row.entityId) === 2026,
  );
  const eventInventory = events2026Rows.length ? events2026Rows : eventRows;
  const erzbergrodeo =
    eventInventory.find((row) =>
      `${row.entityLabel ?? ""} ${row.evidence.sourceLinkLabel ?? ""}`
        .toLowerCase()
        .includes("erzberg"),
    ) ?? null;

  return {
    version: classificationIntelligenceVersion,
    generatedAt: null,
    overview: summarizeCandidates(filteredRows),
    capabilityMatrix: classificationEntityAdapters,
    rows: filteredRows,
    byEntityType: entityTypes.map((entityType) => ({
      entityType,
      label: entityTypeLabel(entityType),
      ...summarizeCandidates(filteredRows.filter((row) => row.entityType === entityType)),
    })),
    missingEvidence: summarizeMissingEvidence(filteredRows),
    conflicts: filteredRows.filter(
      (row) => row.suggestedStatus === DataOriginStatus.CONFLICTING,
    ),
    suspicious: filteredRows.filter((row) =>
      (
        [
          DataOriginStatus.DEMO,
          DataOriginStatus.SEED,
          DataOriginStatus.VALIDATION,
          DataOriginStatus.MANUAL_PLACEHOLDER,
          DataOriginStatus.CONFLICTING,
        ] as DataOriginStatus[]
      ).includes(row.suggestedStatus as DataOriginStatus),
    ),
    events2026: {
      summary: summarizeCandidates(eventInventory),
      rows: eventInventory,
      erzbergrodeo,
    },
    performance: {
      strategy:
        "List and readiness views batch identities, active classifications, SourceLinks, DataSources, SourceSnapshots, review summaries and DataVersion provenance.",
      queryPattern:
        "Summary mode uses bounded evidence-category reads plus bounded per-entity-type audit counts; detail mode performs richer per-entity reads on demand.",
      currentScale:
        "Designed for the current hundreds-of-records admin scale without one detailed Prisma read bundle per row.",
      limitation:
        "Future high-volume onboarding may add cursor pagination before calculating every classifiable type at once.",
    },
  };
}

async function generateClassificationCandidatesForIdentities(
  identities: EntityIdentitySummary[],
) {
  const evidence = await loadBatchEvidence(identities);
  return identities.map((identity) => buildSummaryCandidate(identity, evidence));
}

async function loadBatchEvidence(identities: EntityIdentitySummary[]) {
  const entityTypes = Array.from(
    new Set(identities.map((identity) => identity.entityType)),
  );
  const keys = new Set(
    identities.map((identity) => entityKey(identity.entityType, identity.entityId)),
  );
  const legacyGroups = new Map<string, string[]>();
  for (const identity of identities) {
    const legacyType = legacyEntityType(identity.entityType);
    if (!legacyType) continue;
    const ids = legacyGroups.get(legacyType) ?? [];
    ids.push(identity.entityId);
    legacyGroups.set(legacyType, ids);
  }

  const activeClassifications = await prisma.recordClassification.findMany({
    where: { entityType: { in: entityTypes }, supersededAt: null },
    select: {
      id: true,
      entityType: true,
      entityId: true,
      originStatus: true,
      reason: true,
      evidence: true,
      sourceLinkId: true,
      sourceSnapshotId: true,
      connectorReviewItemId: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
  });
  const classificationReviews = await prisma.connectorReviewItem.findMany({
    where: {
      connectorKey: "record-classification-workflow",
      OR: identities.map((identity) => ({
        proposedValues: {
          path: ["entityId"],
          equals: identity.entityId,
        },
      })),
    },
    select: {
      id: true,
      reviewStatus: true,
      applicationStatus: true,
      proposedValues: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });
  const sourceLinkGroups: Array<{
    legacyType: string;
    rows: SourceLinkSummary[];
  }> = [];
  const auditGroups: Array<{
    legacyType: string;
    rows: Array<{ entityId: string; createdBy: string | null; sourceUrl: string | null }>;
  }> = [];
  for (const [legacyType, ids] of legacyGroups.entries()) {
    sourceLinkGroups.push({
      legacyType,
      rows: dedupeSourceLinksByLogicalEvidence(
        await prisma.sourceLink.findMany({
          where: {
            entityType: { in: sourceLinkEntityTypeAliasesFor(legacyType) },
            entityId: { in: ids },
          },
          include: { dataSource: true },
          orderBy: { createdAt: "desc" },
        }),
      ),
    });
    auditGroups.push({
      legacyType,
      rows: await prisma.dataVersion.findMany({
        where: { entityType: legacyType, entityId: { in: ids } },
        select: { entityId: true, createdBy: true, sourceUrl: true },
      }),
    });
  }

  const sourceLinks = new Map<string, SourceLinkSummary[]>();
  const dataSourceIds = new Set<string>();
  for (const group of sourceLinkGroups) {
    const entityType = classifiableEntityTypeFromLegacy(group.legacyType);
    if (!entityType) continue;
    for (const row of group.rows) {
      const key = entityKey(entityType, row.entityId);
      if (!keys.has(key)) continue;
      const list = sourceLinks.get(key) ?? [];
      list.push(row);
      sourceLinks.set(key, list);
      dataSourceIds.add(row.dataSourceId);
    }
  }

  const sourceSnapshots = dataSourceIds.size
    ? await prisma.sourceSnapshot.findMany({
        where: {
          dataSourceId: { in: Array.from(dataSourceIds) },
          errorMessage: null,
        },
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

  const activeByEntity = new Map<string, ActiveClassificationSummary>();
  for (const classification of activeClassifications) {
    const key = entityKey(classification.entityType, classification.entityId);
    if (keys.has(key) && !activeByEntity.has(key)) {
      activeByEntity.set(key, classification);
    }
  }

  const classificationReviewsByEntity = new Map<string, ClassificationReviewSummary[]>();
  for (const review of classificationReviews) {
    const proposed = jsonObject(review.proposedValues);
    const entityType = proposed ? parseEntityType(proposed.entityType) : null;
    const entityId = proposed?.entityId;
    if (!entityType || typeof entityId !== "string") continue;
    const key = entityKey(entityType, entityId);
    if (!keys.has(key)) continue;
    const list = classificationReviewsByEntity.get(key) ?? [];
    list.push(review);
    classificationReviewsByEntity.set(key, list);
  }

  const audit = new Map<string, AuditSummary>();
  for (const group of auditGroups) {
    const entityType = classifiableEntityTypeFromLegacy(group.legacyType);
    if (!entityType) continue;
    for (const row of group.rows) {
      const key = entityKey(entityType, row.entityId);
      const current = audit.get(key) ?? {
        hasManualAudit: false,
        hasSeedAudit: false,
        hasValidationAudit: false,
      };
      const createdBy = row.createdBy?.toLowerCase() ?? "";
      const sourceUrl = row.sourceUrl?.toLowerCase() ?? "";
      current.hasManualAudit = true;
      current.hasSeedAudit = current.hasSeedAudit || createdBy.includes("seed");
      current.hasValidationAudit =
        current.hasValidationAudit ||
        createdBy.includes("validation") ||
        sourceUrl.includes("validation");
      audit.set(key, current);
    }
  }

  const sourceSnapshotsByDataSource = new Map<string, SourceSnapshotSummary[]>();
  for (const snapshot of sourceSnapshots) {
    const list = sourceSnapshotsByDataSource.get(snapshot.dataSourceId) ?? [];
    list.push(snapshot);
    sourceSnapshotsByDataSource.set(snapshot.dataSourceId, list);
  }

  const supportingReviews = await loadBatchSupportingReviews(identities, keys);

  return {
    activeClassifications: activeByEntity,
    classificationReviews: classificationReviewsByEntity,
    sourceLinks,
    sourceSnapshotsByDataSource,
    supportingReviews,
    audit,
  } satisfies BatchEvidence;
}

export function summarizeCandidates(rows: ClassificationCandidate[]) {
  const summary: ClassificationReadinessSummary = {
    total: rows.length,
    readyForProposal: 0,
    reviewRequired: 0,
    blocked: 0,
    noCandidate: 0,
    noChange: 0,
    unsupportedEvidencePath: 0,
    archivedEntity: 0,
    verifiedOfficial: 0,
    sourceManaged: 0,
    auditedManual: 0,
    manualPlaceholder: 0,
    demo: 0,
    seed: 0,
    validation: 0,
    unknown: 0,
    conflicting: 0,
  };
  for (const row of rows) {
    incrementState(summary, row.candidateState);
    switch (row.suggestedStatus) {
      case DataOriginStatus.VERIFIED_OFFICIAL:
        summary.verifiedOfficial += 1;
        break;
      case DataOriginStatus.SOURCE_MANAGED_UNVERIFIED:
        summary.sourceManaged += 1;
        break;
      case DataOriginStatus.AUDITED_MANUAL:
        summary.auditedManual += 1;
        break;
      case DataOriginStatus.MANUAL_PLACEHOLDER:
        summary.manualPlaceholder += 1;
        break;
      case DataOriginStatus.DEMO:
        summary.demo += 1;
        break;
      case DataOriginStatus.SEED:
        summary.seed += 1;
        break;
      case DataOriginStatus.VALIDATION:
        summary.validation += 1;
        break;
      case DataOriginStatus.UNKNOWN:
        summary.unknown += 1;
        break;
      case DataOriginStatus.CONFLICTING:
        summary.conflicting += 1;
        break;
    }
  }
  return summary;
}

function incrementState(
  summary: ClassificationReadinessSummary,
  state: ClassificationCandidateState,
) {
  switch (state) {
    case "READY_FOR_PROPOSAL":
      summary.readyForProposal += 1;
      break;
    case "REVIEW_REQUIRED":
      summary.reviewRequired += 1;
      break;
    case "BLOCKED":
      summary.blocked += 1;
      break;
    case "NO_CANDIDATE":
      summary.noCandidate += 1;
      break;
    case "NO_CHANGE":
      summary.noChange += 1;
      break;
    case "UNSUPPORTED_EVIDENCE_PATH":
      summary.unsupportedEvidencePath += 1;
      break;
    case "ARCHIVED_ENTITY":
      summary.archivedEntity += 1;
      break;
    case "STALE":
      summary.blocked += 1;
      break;
  }
}

function summarizeMissingEvidence(rows: ClassificationCandidate[]) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const item of row.missingEvidence) counts.set(item, (counts.get(item) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([requirement, count]) => ({ requirement, count }))
    .sort((a, b) => b.count - a.count || a.requirement.localeCompare(b.requirement));
}

async function loadBatchSupportingReviews(
  identities: EntityIdentitySummary[],
  keys: Set<string>,
) {
  const reviewable = identities.filter((identity) =>
    supportingReviewEntityTypes.has(identity.entityType),
  );
  if (!reviewable.length) return new Map<string, ReviewSummary[]>();

  const where: Prisma.ConnectorReviewItemWhereInput[] = reviewable.flatMap((identity) =>
    reviewWhereForEntity(identity.entityType, identity.entityId),
  );
  const rows = where.length
    ? await prisma.connectorReviewItem.findMany({
        where: {
          connectorKey: { not: "record-classification-workflow" },
          OR: where,
        },
        select: {
          id: true,
          suggestedAction: true,
          reviewStatus: true,
          applicationStatus: true,
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
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  const reviews = new Map<string, ReviewSummary[]>();
  for (const row of rows) {
    for (const key of reviewKeysForRow(row)) {
      if (!keys.has(key)) continue;
      const list = reviews.get(key) ?? [];
      list.push(row);
      reviews.set(key, list);
    }
  }
  return reviews;
}

function buildSummaryCandidate(
  identity: EntityIdentitySummary,
  evidence: BatchEvidence,
): ClassificationCandidate {
  const key = entityKey(identity.entityType, identity.entityId);
  const current = evidence.activeClassifications.get(key) ?? null;
  const sourceLinks = evidence.sourceLinks.get(key) ?? [];
  const reviews = evidence.supportingReviews.get(key) ?? [];
  const classificationReviews = evidence.classificationReviews.get(key) ?? [];
  const audit = evidence.audit.get(key) ?? {
    hasManualAudit: false,
    hasSeedAudit: false,
    hasValidationAudit: false,
  };
  const sourceLink =
    sourceLinks.find((link) => link.dataSource.reliability === "OFFICIAL") ??
    sourceLinks[0] ??
    null;
  const matchingSnapshot = sourceLink
    ? ((evidence.sourceSnapshotsByDataSource.get(sourceLink.dataSourceId) ?? []).find(
        (snapshot) =>
          snapshot.contentHash &&
          sourceUrlMatchesEvidence(
            snapshot.url,
            sourceLink.url,
            sourceLink.dataSource.baseUrl,
          ),
      ) ?? null)
    : null;
  const appliedReview =
    reviews.find(
      (review) =>
        review.applicationStatus === "APPLIED" &&
        review.reviewStatus === "APPROVED" &&
        positiveReviewActions.has(review.suggestedAction),
    ) ?? null;
  const pendingDuplicate =
    classificationReviews.find(
      (review) => review.reviewStatus === "PENDING" || review.reviewStatus === "APPROVED",
    ) ?? null;
  const sourceUrls = sourceLinks.map((link) => link.url.toLowerCase());
  const conflicts = collectConflicts(sourceLinks);
  const missingEvidence: string[] = [];
  const blockingIssues: string[] = [];
  const warnings: string[] = [];
  const parentChildWarnings = buildParentChildWarnings(identity, sourceLinks, reviews);
  const rules: ClassificationCandidateRule[] = [];

  addRule(rules, {
    ruleKey: "identity.exists",
    category: "IDENTITY",
    label: "Entity exists",
    matched: true,
    detail: identity.label,
    severity: "INFO",
    mandatoryFor: allActiveStatuses(),
  });
  addRule(rules, {
    ruleKey: "lifecycle.active",
    category: "LIFECYCLE",
    label: "Active lifecycle",
    matched: !identity.archived,
    detail: identity.archived
      ? "Entity is archived, superseded, or historical."
      : "Entity is active for candidate analysis.",
    severity: identity.archived ? "BLOCKING" : "INFO",
    mandatoryFor: allActiveStatuses(),
  });
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

  if (identity.archived) blockingIssues.push("Entity is archived or superseded.");
  if (conflicts.length > 0) {
    blockingIssues.push("Conflicting source evidence requires human resolution.");
  }
  if (pendingDuplicate) {
    blockingIssues.push("An active classification proposal already exists.");
  }

  const explicitValidation = hasValidationSignal({
    identityLabel: identity.label,
    sourceUrls,
    audit,
  });
  const explicitDemo = hasDemoSignal({ identityLabel: identity.label, sourceUrls });
  const explicitSeed = audit.hasSeedAudit;
  const placeholder = hasPlaceholderSignal({
    identityLabel: identity.label,
    detail: identity.detail,
    sourceUrls,
  });

  let suggestedStatus: DataOriginStatus | null = null;
  if (conflicts.length > 0) {
    suggestedStatus = DataOriginStatus.CONFLICTING;
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
  } else if (audit.hasManualAudit) {
    suggestedStatus = DataOriginStatus.AUDITED_MANUAL;
  } else if (current?.originStatus === DataOriginStatus.UNKNOWN) {
    suggestedStatus = DataOriginStatus.UNKNOWN;
  } else {
    warnings.push("No production provenance is attached.");
  }

  if (!sourceLink) missingEvidence.push("SourceLink");
  if (sourceLink && !matchingSnapshot) missingEvidence.push("SourceSnapshot");
  const sameStatusMaterialEvidence =
    current?.originStatus === suggestedStatus &&
    current.sourceLinkId === (sourceLink?.id ?? null) &&
    current.sourceSnapshotId === (matchingSnapshot?.id ?? null) &&
    current.connectorReviewItemId === (appliedReview?.id ?? null);

  if (sameStatusMaterialEvidence && suggestedStatus) {
    blockingIssues.push("Suggested classification is a no-op.");
  }
  if (!classificationProposalEntityTypes.has(identity.entityType)) {
    warnings.push(
      "Proposal generation is disabled for this entity type in this rollout.",
    );
  }

  const transitionType = sameStatusMaterialEvidence
    ? "no-change"
    : suggestedStatus
      ? transitionTypeFor(current?.originStatus ?? null, suggestedStatus)
      : "first-classification";
  const candidateState = getCandidateState({
    archived: identity.archived,
    pendingDuplicate: Boolean(pendingDuplicate),
    currentStatus: current?.originStatus ?? null,
    sameStatusMaterialEvidence,
    suggestedStatus,
    blockingIssues,
  });
  const proposalSupported = classificationProposalEntityTypes.has(identity.entityType);
  const eligible =
    candidateState === "READY_FOR_PROPOSAL" &&
    Boolean(suggestedStatus) &&
    proposalSupported &&
    !identity.archived &&
    !pendingDuplicate;
  const entityChecksum = createStableChecksum({
    entityType: identity.entityType,
    entityId: identity.entityId,
    label: identity.label,
    detail: identity.detail,
  });
  const lifecycleChecksum = createStableChecksum({
    archived: identity.archived,
    detail: identity.detail,
  });
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
  const evidenceChecksum = createStableChecksum({
    sourceLinkId: sourceLink?.id ?? null,
    sourceSnapshotId: matchingSnapshot?.id ?? null,
    connectorReviewItemId: appliedReview?.id ?? null,
    conflicts,
    missingEvidence,
  });
  const candidateChecksum = createStableChecksum({
    version: classificationIntelligenceVersion,
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
    parentChildWarnings,
  });

  return {
    version: classificationIntelligenceVersion,
    entityType: identity.entityType,
    entityId: identity.entityId,
    entityLabel: identity.label,
    supported: true,
    analysisSupport: "SUPPORTED_FOR_ANALYSIS",
    proposalSupport: proposalSupported ? "SUPPORTED_FOR_PROPOSAL" : "READINESS_ONLY",
    proposalDisabledReason: proposalSupported
      ? null
      : "Proposal generation is enabled for Event classifications only in this rollout.",
    candidateState,
    suggestedStatus,
    transitionType,
    reason: buildReason({
      suggestedStatus,
      sourceLinkReliability: sourceLink?.dataSource.reliability ?? null,
      hasSnapshot: Boolean(matchingSnapshot),
      hasAppliedReview: Boolean(appliedReview),
      hasManualAudit: audit.hasManualAudit,
    }),
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
              `${identity.entityType}:${identity.entityId} -> SourceLink:${sourceLink.id} -> SourceSnapshot:${matchingSnapshot.id}`,
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
  archived,
  pendingDuplicate,
  currentStatus,
  sameStatusMaterialEvidence,
  suggestedStatus,
  blockingIssues,
}: {
  archived: boolean;
  pendingDuplicate: boolean;
  currentStatus: DataOriginStatus | null;
  sameStatusMaterialEvidence: boolean;
  suggestedStatus: DataOriginStatus | null;
  blockingIssues: string[];
}): ClassificationCandidateState {
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

function reviewWhereForEntity(
  entityType: ClassifiableEntityType,
  entityId: string,
): Prisma.ConnectorReviewItemWhereInput[] {
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
      return [];
  }
}

function reviewKeysForRow(row: ReviewSummary) {
  return [
    row.currentEventId
      ? entityKey(ClassifiableEntityType.EVENT, row.currentEventId)
      : null,
    row.appliedEventId
      ? entityKey(ClassifiableEntityType.EVENT, row.appliedEventId)
      : null,
    row.currentResultId
      ? entityKey(ClassifiableEntityType.RESULT, row.currentResultId)
      : null,
    row.appliedResultId
      ? entityKey(ClassifiableEntityType.RESULT, row.appliedResultId)
      : null,
    row.currentStageResultId
      ? entityKey(ClassifiableEntityType.STAGE_RESULT, row.currentStageResultId)
      : null,
    row.appliedStageResultId
      ? entityKey(ClassifiableEntityType.STAGE_RESULT, row.appliedStageResultId)
      : null,
    row.currentStandingId
      ? entityKey(ClassifiableEntityType.STANDING, row.currentStandingId)
      : null,
    row.appliedStandingId
      ? entityKey(ClassifiableEntityType.STANDING, row.appliedStandingId)
      : null,
    row.currentResultPointComponentId
      ? entityKey(
          ClassifiableEntityType.RESULT_POINT_COMPONENT,
          row.currentResultPointComponentId,
        )
      : null,
    row.appliedResultPointComponentId
      ? entityKey(
          ClassifiableEntityType.RESULT_POINT_COMPONENT,
          row.appliedResultPointComponentId,
        )
      : null,
  ].filter(Boolean) as string[];
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

function allActiveStatuses() {
  return [
    DataOriginStatus.VERIFIED_OFFICIAL,
    DataOriginStatus.SOURCE_MANAGED_UNVERIFIED,
    DataOriginStatus.AUDITED_MANUAL,
    DataOriginStatus.MANUAL_PLACEHOLDER,
    DataOriginStatus.DEMO,
    DataOriginStatus.SEED,
    DataOriginStatus.VALIDATION,
    DataOriginStatus.UNKNOWN,
    DataOriginStatus.CONFLICTING,
  ];
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

function buildParentChildWarnings(
  identity: EntityIdentitySummary,
  sourceLinks: SourceLinkSummary[],
  reviews: ReviewSummary[],
) {
  const warnings: string[] = [];
  if (
    identity.entityType !== ClassifiableEntityType.EVENT &&
    sourceLinks.length === 0 &&
    reviews.length > 0
  ) {
    warnings.push(
      "DEPENDENCY_WARNING: supporting review lineage exists but direct SourceLink evidence is missing.",
    );
  }
  if (
    identity.entityType === ClassifiableEntityType.RACE_STAGE &&
    sourceLinks.length === 0
  ) {
    warnings.push(
      "PARENT_BLOCKER: RaceStage verification depends on an Event/stage source identity chain.",
    );
  }
  return warnings;
}

function transitionTypeFor(
  currentStatus: DataOriginStatus | null,
  nextStatus: DataOriginStatus,
) {
  if (!currentStatus) return "first-classification";
  if (currentStatus === nextStatus) return "no-change";
  if (
    nextStatus === DataOriginStatus.VERIFIED_OFFICIAL &&
    currentStatus !== DataOriginStatus.VERIFIED_OFFICIAL
  ) {
    return "promotion";
  }
  if (
    nextStatus === DataOriginStatus.DEMO ||
    nextStatus === DataOriginStatus.SEED ||
    nextStatus === DataOriginStatus.VALIDATION ||
    nextStatus === DataOriginStatus.MANUAL_PLACEHOLDER ||
    nextStatus === DataOriginStatus.UNKNOWN ||
    nextStatus === DataOriginStatus.CONFLICTING
  ) {
    return "re-quarantine";
  }
  return "correction";
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
  if (officialSourceIds.size > 1)
    conflicts.push("Multiple official DataSources are attached.");
  return conflicts;
}

function hasValidationSignal({
  identityLabel,
  sourceUrls,
  audit,
}: {
  identityLabel: string | null;
  sourceUrls: string[];
  audit: { hasValidationAudit: boolean };
}) {
  const label = identityLabel?.toLowerCase() ?? "";
  return (
    audit.hasValidationAudit ||
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
  detail,
  sourceUrls,
}: {
  identityLabel: string | null;
  detail: string | null;
  sourceUrls: string[];
}) {
  const text = `${identityLabel ?? ""} ${detail ?? ""}`.toLowerCase();
  return (
    text.includes("placeholder") ||
    text.includes("tbd") ||
    sourceUrls.some((url) => url.includes("placeholder"))
  );
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

function normalizeSourceUrl(url: string) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.searchParams.sort();
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return url.trim().toLowerCase();
  }
}

function entityKey(entityType: ClassifiableEntityType, entityId: string) {
  return `${entityType}:${entityId}`;
}

function jsonObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function parseEntityType(value: unknown) {
  return typeof value === "string" && value in ClassifiableEntityType
    ? (value as ClassifiableEntityType)
    : null;
}

function createStableChecksum(value: unknown) {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  return `{${entries
    .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`)
    .join(",")}}`;
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

function classifiableEntityTypeFromLegacy(value: string) {
  const sourceLinkType = classifiableEntityTypeFromSourceLink(value);
  if (sourceLinkType) return sourceLinkType;
  for (const entityType of classifiableEntityTypes) {
    if (legacyEntityType(entityType) === value) return entityType;
  }
  return null;
}
