import { ClassifiableEntityType, DataOriginStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  classifiableEntityTypes,
  getOfficialWorkflowEligibility,
  isExplicitlyQuarantined,
  type ClassificationFilter,
} from "@/lib/data-quality/record-classification";
import {
  defaultAdminPageSize,
  getAdminPagination,
  getAdminTotalPages,
} from "@/lib/admin/platform";

export type ClassificationEvidenceFilter = "all" | "has-evidence" | "missing-evidence";
export type ClassificationHistoryFilter = "current" | "with-history" | "archived-history";
export type ClassificationEntityLifecycleFilter = "all" | "active";

export type AdminClassificationDashboardFilters = {
  entityType?: ClassifiableEntityType | "ALL";
  classification?: ClassificationFilter;
  entityLifecycle?: ClassificationEntityLifecycleFilter;
  history?: ClassificationHistoryFilter;
  evidence?: ClassificationEvidenceFilter;
  page?: number;
};

export type AdminClassificationDashboardRow = {
  entityType: ClassifiableEntityType;
  entityId: string;
  label: string;
  detail: string | null;
  href: string | null;
  archived: boolean;
  classification: {
    id: string;
    originStatus: DataOriginStatus;
    reason: string;
    createdAt: Date;
    updatedAt: Date;
    hasEvidence: boolean;
    officialWorkflowEligibility: ReturnType<typeof getOfficialWorkflowEligibility>;
    explicitlyQuarantined: boolean;
  } | null;
  historyCount: number;
};

export type AdminClassificationBreakdown = {
  entityType: ClassifiableEntityType;
  label: string;
  total: number;
  active: number;
  archived: number;
  classified: number;
  unclassified: number;
  verifiedOfficial: number;
  sourceManaged: number;
  auditedManual: number;
  manualPlaceholder: number;
  demo: number;
  seed: number;
  validation: number;
  unknown: number;
  conflicting: number;
  archivedHistory: number;
  hasEvidence: number;
  missingEvidence: number;
  quarantined: number;
};

export type AdminClassificationOverview = Omit<
  AdminClassificationBreakdown,
  "entityType" | "label"
>;

type EntityIdentity = {
  entityType: ClassifiableEntityType;
  entityId: string;
  label: string;
  detail: string | null;
  href: string | null;
  archived: boolean;
  seasonYear?: number | null;
};

type ActiveClassification = {
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

const emptyCounts = {
  total: 0,
  active: 0,
  archived: 0,
  classified: 0,
  unclassified: 0,
  verifiedOfficial: 0,
  sourceManaged: 0,
  auditedManual: 0,
  manualPlaceholder: 0,
  demo: 0,
  seed: 0,
  validation: 0,
  unknown: 0,
  conflicting: 0,
  archivedHistory: 0,
  hasEvidence: 0,
  missingEvidence: 0,
  quarantined: 0,
};

export async function getAdminClassificationDashboard(
  filters: AdminClassificationDashboardFilters,
) {
  const selectedEntityTypes =
    filters.entityType && filters.entityType !== "ALL"
      ? [filters.entityType]
      : [...classifiableEntityTypes];
  const entityLifecycle = filters.entityLifecycle ?? "all";
  const historyFilter = filters.history ?? "current";
  const evidenceFilter = filters.evidence ?? "all";
  const classificationFilter = filters.classification ?? "ALL";
  const pagination = getAdminPagination({
    page: filters.page,
    pageSize: defaultAdminPageSize,
  });

  const identitiesByType = await Promise.all(
    selectedEntityTypes.map((entityType) =>
      getEntityIdentities(entityType, entityLifecycle),
    ),
  );
  const identities = identitiesByType.flat();
  const entityIdsByType = new Map<ClassifiableEntityType, string[]>();
  for (const identity of identities) {
    const list = entityIdsByType.get(identity.entityType) ?? [];
    list.push(identity.entityId);
    entityIdsByType.set(identity.entityType, list);
  }

  const [activeClassifications, historicalClassifications] = await Promise.all([
    prisma.recordClassification.findMany({
      where: {
        entityType: { in: selectedEntityTypes },
        supersededAt: null,
      },
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
    }),
    prisma.recordClassification.findMany({
      where: {
        entityType: { in: selectedEntityTypes },
        supersededAt: { not: null },
      },
      select: {
        entityType: true,
        entityId: true,
      },
    }),
  ]);

  const activeByEntity = new Map<string, ActiveClassification>();
  for (const classification of activeClassifications) {
    const allowedIds = entityIdsByType.get(classification.entityType);
    if (!allowedIds?.includes(classification.entityId)) continue;
    const key = entityKey(classification.entityType, classification.entityId);
    if (!activeByEntity.has(key)) activeByEntity.set(key, classification);
  }

  const historyCountByEntity = new Map<string, number>();
  for (const classification of historicalClassifications) {
    const allowedIds = entityIdsByType.get(classification.entityType);
    if (!allowedIds?.includes(classification.entityId)) continue;
    const key = entityKey(classification.entityType, classification.entityId);
    historyCountByEntity.set(key, (historyCountByEntity.get(key) ?? 0) + 1);
  }

  const allRows = identities.map((identity) => {
    const key = entityKey(identity.entityType, identity.entityId);
    const classification = activeByEntity.get(key) ?? null;
    const hasEvidence = classification
      ? classificationHasEvidence(classification)
      : false;

    return {
      ...identity,
      classification: classification
        ? {
            id: classification.id,
            originStatus: classification.originStatus,
            reason: classification.reason,
            createdAt: classification.createdAt,
            updatedAt: classification.updatedAt,
            hasEvidence,
            officialWorkflowEligibility: getOfficialWorkflowEligibility(
              classification.originStatus,
            ),
            explicitlyQuarantined: isExplicitlyQuarantined(classification.originStatus),
          }
        : null,
      historyCount: historyCountByEntity.get(key) ?? 0,
    } satisfies AdminClassificationDashboardRow;
  });

  const breakdown: AdminClassificationBreakdown[] = selectedEntityTypes.map(
    (entityType) =>
      summarizeRows(
        entityType,
        allRows.filter((row) => row.entityType === entityType),
      ) as AdminClassificationBreakdown,
  );
  const overview = summarizeRows(null, allRows) as AdminClassificationOverview;

  const filteredRows = allRows
    .filter((row) => matchesClassificationFilter(row, classificationFilter))
    .filter((row) => matchesHistoryFilter(row, historyFilter))
    .filter((row) => matchesEvidenceFilter(row, evidenceFilter))
    .sort(compareDashboardRows);

  return {
    overview,
    breakdown,
    rows: filteredRows.slice(pagination.skip, pagination.skip + pagination.pageSize),
    total: filteredRows.length,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: getAdminTotalPages(filteredRows.length, pagination.pageSize),
  };
}

function summarizeRows(
  entityType: ClassifiableEntityType,
  rows: AdminClassificationDashboardRow[],
): AdminClassificationBreakdown;
function summarizeRows(
  entityType: null,
  rows: AdminClassificationDashboardRow[],
): AdminClassificationOverview;
function summarizeRows(
  entityType: ClassifiableEntityType | null,
  rows: AdminClassificationDashboardRow[],
): AdminClassificationBreakdown | AdminClassificationOverview {
  const summary = { ...emptyCounts };
  for (const row of rows) {
    summary.total += 1;
    if (row.archived) summary.archived += 1;
    else summary.active += 1;

    if (!row.classification) {
      summary.unclassified += 1;
      summary.missingEvidence += 1;
      continue;
    }

    summary.classified += 1;
    if (row.historyCount > 0 || row.classification.originStatus === "ARCHIVED_HISTORY") {
      summary.archivedHistory += 1;
    }
    if (row.classification.hasEvidence) summary.hasEvidence += 1;
    else summary.missingEvidence += 1;
    if (row.classification.explicitlyQuarantined) summary.quarantined += 1;

    switch (row.classification.originStatus) {
      case "VERIFIED_OFFICIAL":
        summary.verifiedOfficial += 1;
        break;
      case "SOURCE_MANAGED_UNVERIFIED":
        summary.sourceManaged += 1;
        break;
      case "AUDITED_MANUAL":
        summary.auditedManual += 1;
        break;
      case "MANUAL_PLACEHOLDER":
        summary.manualPlaceholder += 1;
        break;
      case "DEMO":
        summary.demo += 1;
        break;
      case "SEED":
        summary.seed += 1;
        break;
      case "VALIDATION":
        summary.validation += 1;
        break;
      case "UNKNOWN":
        summary.unknown += 1;
        break;
      case "CONFLICTING":
        summary.conflicting += 1;
        break;
      case "ARCHIVED_HISTORY":
        break;
      default: {
        const exhaustive: never = row.classification.originStatus;
        throw new Error(`Unsupported classification status: ${exhaustive}`);
      }
    }
  }

  if (!entityType) return summary;

  return {
    entityType,
    label: entityTypeLabel(entityType),
    ...summary,
  };
}

function matchesClassificationFilter(
  row: AdminClassificationDashboardRow,
  filter: ClassificationFilter,
) {
  if (filter === "ALL") return true;
  if (filter === "UNCLASSIFIED") return !row.classification;
  return row.classification?.originStatus === filter;
}

function matchesHistoryFilter(
  row: AdminClassificationDashboardRow,
  filter: ClassificationHistoryFilter,
) {
  if (filter === "current") return true;
  const hasHistory =
    row.historyCount > 0 || row.classification?.originStatus === "ARCHIVED_HISTORY";
  if (filter === "with-history") return hasHistory;
  return hasHistory;
}

function matchesEvidenceFilter(
  row: AdminClassificationDashboardRow,
  filter: ClassificationEvidenceFilter,
) {
  if (filter === "all") return true;
  if (filter === "has-evidence") return Boolean(row.classification?.hasEvidence);
  return !row.classification || !row.classification.hasEvidence;
}

function compareDashboardRows(
  left: AdminClassificationDashboardRow,
  right: AdminClassificationDashboardRow,
) {
  const typeCompare = entityTypeLabel(left.entityType).localeCompare(
    entityTypeLabel(right.entityType),
  );
  if (typeCompare !== 0) return typeCompare;
  return left.label.localeCompare(right.label);
}

function classificationHasEvidence(classification: ActiveClassification) {
  return Boolean(
    classification.evidence ||
    classification.sourceLinkId ||
    classification.sourceSnapshotId ||
    classification.connectorReviewItemId,
  );
}

function entityKey(entityType: ClassifiableEntityType, entityId: string) {
  return `${entityType}:${entityId}`;
}

export function entityTypeLabel(entityType: ClassifiableEntityType) {
  return entityType
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function existingDetailHref(entityType: ClassifiableEntityType, id: string) {
  switch (entityType) {
    case ClassifiableEntityType.EVENT:
      return `/admin/events/${id}`;
    case ClassifiableEntityType.RIDER:
      return `/admin/riders/${id}`;
    case ClassifiableEntityType.TEAM:
      return `/admin/teams/${id}`;
    case ClassifiableEntityType.MANUFACTURER:
      return `/admin/manufacturers/${id}`;
    case ClassifiableEntityType.MOTORCYCLE:
      return `/admin/motorcycles/${id}`;
    case ClassifiableEntityType.RESULT:
      return `/admin/results/${id}`;
    case ClassifiableEntityType.STAGE_RESULT:
      return `/admin/stage-results/${id}`;
    case ClassifiableEntityType.RESULT_POINT_COMPONENT:
      return `/admin/result-point-components/${id}`;
    case ClassifiableEntityType.CHAMPIONSHIP_REGULATION:
      return `/admin/regulations/${id}`;
    case ClassifiableEntityType.STANDING:
      return `/admin/standings/${id}`;
    case ClassifiableEntityType.SEASON:
    case ClassifiableEntityType.RACE_STAGE:
    case ClassifiableEntityType.STANDING_PUBLICATION:
      return null;
    default: {
      const exhaustive: never = entityType;
      throw new Error(`Unsupported classifiable entity type: ${exhaustive}`);
    }
  }
}

export async function getEntityIdentities(
  entityType: ClassifiableEntityType,
  lifecycle: ClassificationEntityLifecycleFilter,
): Promise<EntityIdentity[]> {
  const activeOnly = lifecycle === "active";

  switch (entityType) {
    case ClassifiableEntityType.SEASON: {
      const rows = await prisma.season.findMany({
        orderBy: { year: "desc" },
        select: { id: true, name: true, year: true, status: true },
      });
      return rows.map((row) => ({
        entityType,
        entityId: row.id,
        label: row.name,
        detail: `${row.year} · ${row.status}`,
        href: existingDetailHref(entityType, row.id),
        archived: false,
      }));
    }
    case ClassifiableEntityType.EVENT: {
      const rows = await prisma.event.findMany({
        where: activeOnly ? { archivedAt: null } : undefined,
        orderBy: [{ startDate: "desc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          archivedAt: true,
          season: { select: { year: true } },
        },
      });
      return rows.map((row) => ({
        entityType,
        entityId: row.id,
        label: row.name,
        detail: `${row.season.year} · ${row.status} · ${row.slug}`,
        href: existingDetailHref(entityType, row.id),
        archived: Boolean(row.archivedAt),
        seasonYear: row.season.year,
      }));
    }
    case ClassifiableEntityType.RACE_STAGE: {
      const rows = await prisma.raceStage.findMany({
        orderBy: [{ event: { startDate: "desc" } }, { stageOrder: "asc" }],
        select: {
          id: true,
          name: true,
          stageOrder: true,
          stageType: true,
          event: { select: { id: true, name: true, archivedAt: true } },
        },
      });
      return rows
        .filter((row) => !activeOnly || !row.event.archivedAt)
        .map((row) => ({
          entityType,
          entityId: row.id,
          label: row.name,
          detail: `${row.event.name} · Stage ${row.stageOrder} · ${row.stageType}`,
          href: existingDetailHref(ClassifiableEntityType.EVENT, row.event.id),
          archived: Boolean(row.event.archivedAt),
        }));
    }
    case ClassifiableEntityType.RIDER: {
      const rows = await prisma.rider.findMany({
        where: activeOnly ? { archivedAt: null } : undefined,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        select: {
          id: true,
          firstName: true,
          lastName: true,
          slug: true,
          archivedAt: true,
        },
      });
      return rows.map((row) => ({
        entityType,
        entityId: row.id,
        label: `${row.firstName} ${row.lastName}`,
        detail: row.slug,
        href: existingDetailHref(entityType, row.id),
        archived: Boolean(row.archivedAt),
      }));
    }
    case ClassifiableEntityType.TEAM: {
      const rows = await prisma.team.findMany({
        where: activeOnly ? { archivedAt: null } : undefined,
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true, status: true, archivedAt: true },
      });
      return rows.map((row) => ({
        entityType,
        entityId: row.id,
        label: row.name,
        detail: `${row.status} · ${row.slug}`,
        href: existingDetailHref(entityType, row.id),
        archived: Boolean(row.archivedAt),
      }));
    }
    case ClassifiableEntityType.MANUFACTURER: {
      const rows = await prisma.manufacturer.findMany({
        where: activeOnly ? { archivedAt: null } : undefined,
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true, status: true, archivedAt: true },
      });
      return rows.map((row) => ({
        entityType,
        entityId: row.id,
        label: row.name,
        detail: `${row.status} · ${row.slug}`,
        href: existingDetailHref(entityType, row.id),
        archived: Boolean(row.archivedAt),
      }));
    }
    case ClassifiableEntityType.MOTORCYCLE: {
      const rows = await prisma.motorcycle.findMany({
        where: activeOnly ? { archivedAt: null } : undefined,
        orderBy: [{ manufacturer: { name: "asc" } }, { model: "asc" }],
        select: {
          id: true,
          model: true,
          year: true,
          status: true,
          archivedAt: true,
          manufacturer: { select: { name: true } },
        },
      });
      return rows.map((row) => ({
        entityType,
        entityId: row.id,
        label: `${row.manufacturer.name} ${row.model}`,
        detail: [row.year, row.status].filter(Boolean).join(" · "),
        href: existingDetailHref(entityType, row.id),
        archived: Boolean(row.archivedAt),
      }));
    }
    case ClassifiableEntityType.RESULT: {
      const rows = await prisma.result.findMany({
        where: activeOnly ? { archivedAt: null } : undefined,
        orderBy: [{ event: { startDate: "desc" } }, { overallPosition: "asc" }],
        select: {
          id: true,
          className: true,
          overallPosition: true,
          status: true,
          archivedAt: true,
          event: { select: { name: true } },
          rider: { select: { firstName: true, lastName: true } },
        },
      });
      return rows.map((row) => ({
        entityType,
        entityId: row.id,
        label: `${row.event.name} · ${row.rider.firstName} ${row.rider.lastName}`,
        detail: [
          row.className ?? "Overall",
          row.overallPosition ? `P${row.overallPosition}` : null,
          row.status,
        ]
          .filter(Boolean)
          .join(" · "),
        href: existingDetailHref(entityType, row.id),
        archived: Boolean(row.archivedAt),
      }));
    }
    case ClassifiableEntityType.STAGE_RESULT: {
      const rows = await prisma.stageResult.findMany({
        where: activeOnly ? { archivedAt: null } : undefined,
        orderBy: [
          { stage: { event: { startDate: "desc" } } },
          { overallPosition: "asc" },
        ],
        select: {
          id: true,
          className: true,
          overallPosition: true,
          status: true,
          archivedAt: true,
          stage: { select: { name: true, event: { select: { name: true } } } },
          rider: { select: { firstName: true, lastName: true } },
        },
      });
      return rows.map((row) => ({
        entityType,
        entityId: row.id,
        label: `${row.stage.event.name} · ${row.stage.name}`,
        detail: [
          `${row.rider.firstName} ${row.rider.lastName}`,
          row.className ?? "Overall",
          row.overallPosition ? `P${row.overallPosition}` : null,
          row.status,
        ]
          .filter(Boolean)
          .join(" · "),
        href: existingDetailHref(entityType, row.id),
        archived: Boolean(row.archivedAt),
      }));
    }
    case ClassifiableEntityType.RESULT_POINT_COMPONENT: {
      const rows = await prisma.resultPointComponent.findMany({
        where: activeOnly ? { archivedAt: null } : undefined,
        orderBy: [{ createdAt: "desc" }],
        select: {
          id: true,
          componentType: true,
          classificationScope: true,
          className: true,
          points: true,
          archivedAt: true,
          event: { select: { name: true } },
          result: {
            select: { rider: { select: { firstName: true, lastName: true } } },
          },
        },
      });
      return rows.map((row) => ({
        entityType,
        entityId: row.id,
        label: `${row.event.name} · ${row.result.rider.firstName} ${row.result.rider.lastName}`,
        detail: [
          row.componentType,
          row.classificationScope,
          row.className,
          `${row.points} pts`,
        ]
          .filter(Boolean)
          .join(" · "),
        href: existingDetailHref(entityType, row.id),
        archived: Boolean(row.archivedAt),
      }));
    }
    case ClassifiableEntityType.CHAMPIONSHIP_REGULATION: {
      const rows = await prisma.championshipRegulation.findMany({
        where: activeOnly ? { archivedAt: null } : undefined,
        orderBy: [{ regulationYear: "desc" }, { title: "asc" }],
        select: {
          id: true,
          title: true,
          regulationYear: true,
          classificationScope: true,
          className: true,
          status: true,
          archivedAt: true,
        },
      });
      return rows.map((row) => ({
        entityType,
        entityId: row.id,
        label: row.title,
        detail: [row.regulationYear, row.classificationScope, row.className, row.status]
          .filter(Boolean)
          .join(" · "),
        href: existingDetailHref(entityType, row.id),
        archived: Boolean(row.archivedAt),
      }));
    }
    case ClassifiableEntityType.STANDING: {
      const rows = await prisma.standing.findMany({
        orderBy: [{ season: { year: "desc" } }, { position: "asc" }],
        select: {
          id: true,
          className: true,
          position: true,
          points: true,
          season: { select: { year: true } },
          rider: { select: { firstName: true, lastName: true } },
        },
      });
      return rows.map((row) => ({
        entityType,
        entityId: row.id,
        label: `${row.season.year} · ${row.rider.firstName} ${row.rider.lastName}`,
        detail: [
          row.className ?? "Overall",
          row.position ? `P${row.position}` : null,
          `${row.points} pts`,
        ]
          .filter(Boolean)
          .join(" · "),
        href: existingDetailHref(entityType, row.id),
        archived: false,
      }));
    }
    case ClassifiableEntityType.STANDING_PUBLICATION: {
      const rows = await prisma.standingPublication.findMany({
        orderBy: [{ createdAt: "desc" }],
        select: {
          id: true,
          versionKey: true,
          publicationVersion: true,
          status: true,
          supersededAt: true,
          className: true,
          classificationScope: true,
          season: { select: { year: true } },
        },
      });
      return rows
        .filter((row) => !activeOnly || !row.supersededAt)
        .map((row) => ({
          entityType,
          entityId: row.id,
          label: row.versionKey,
          detail: [
            row.season.year,
            row.classificationScope,
            row.className,
            `v${row.publicationVersion}`,
            row.status,
          ]
            .filter(Boolean)
            .join(" · "),
          href: existingDetailHref(entityType, row.id),
          archived: Boolean(row.supersededAt),
        }));
    }
    default: {
      const exhaustive: never = entityType;
      throw new Error(`Unsupported classifiable entity type: ${exhaustive}`);
    }
  }
}
