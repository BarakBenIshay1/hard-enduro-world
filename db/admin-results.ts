import { ClassifiableEntityType } from "@prisma/client";
import type { Prisma, ResultStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  defaultAdminPageSize,
  getAdminPagination,
  getAdminTotalPages,
} from "@/lib/admin/platform";
import {
  getClassificationEntityIdFilter,
  resolveRecordClassifications,
  summarizeClassificationResolutions,
  type ClassificationFilter,
} from "@/lib/data-quality/record-classification";
import {
  dedupeSourceLinksByLogicalEvidence,
  sourceLinkEntityTypeAliasesFor,
} from "@/lib/sources/source-link-entity-types";

export type ResultLifecycleFilter = "active" | "archived" | "all";
export type SourceModeFilter = "all" | "source-managed" | "manual";

export type AdminResultListFilters = {
  search?: string;
  eventId?: string;
  riderId?: string;
  status?: ResultStatus;
  manufacturerId?: string;
  motorcycleId?: string;
  sourceMode?: SourceModeFilter;
  classification?: ClassificationFilter;
  lifecycle?: ResultLifecycleFilter;
  page?: number;
  sort?: string;
};

export type AdminStageResultListFilters = {
  search?: string;
  eventId?: string;
  stageId?: string;
  riderId?: string;
  status?: ResultStatus;
  position?: number;
  sourceMode?: SourceModeFilter;
  classification?: ClassificationFilter;
  lifecycle?: ResultLifecycleFilter;
  page?: number;
  sort?: string;
};

export async function getAdminResultOptions() {
  const [events, riders, manufacturers, motorcycles] = await prisma.$transaction([
    prisma.event.findMany({
      orderBy: [{ startDate: "desc" }, { name: "asc" }],
      select: { id: true, name: true, season: { select: { year: true } } },
    }),
    prisma.rider.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true },
    }),
    prisma.manufacturer.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.motorcycle.findMany({
      orderBy: [{ manufacturer: { name: "asc" } }, { model: "asc" }],
      select: {
        id: true,
        model: true,
        year: true,
        manufacturer: { select: { name: true } },
      },
    }),
  ]);

  return { events, riders, manufacturers, motorcycles };
}

export async function getAdminStageResultOptions() {
  const [events, stages, riders] = await prisma.$transaction([
    prisma.event.findMany({
      orderBy: [{ startDate: "desc" }, { name: "asc" }],
      select: { id: true, name: true, season: { select: { year: true } } },
    }),
    prisma.raceStage.findMany({
      orderBy: [{ event: { startDate: "desc" } }, { stageOrder: "asc" }],
      select: {
        id: true,
        name: true,
        stageOrder: true,
        eventId: true,
        event: { select: { name: true } },
      },
    }),
    prisma.rider.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true },
    }),
  ]);

  return { events, stages, riders };
}

export async function getAdminResults(filters: AdminResultListFilters) {
  const pagination = getAdminPagination({
    page: filters.page,
    pageSize: defaultAdminPageSize,
  });
  const sourceFilter = await getSourceFilter("Result", filters.sourceMode ?? "all");
  const classificationFilter = await getClassificationEntityIdFilter(
    ClassifiableEntityType.RESULT,
    filters.classification,
  );
  const where = buildResultWhere(filters, sourceFilter, classificationFilter);
  const orderBy = buildResultOrder(filters.sort);

  const [results, total, options] = await Promise.all([
    prisma.result.findMany({
      where,
      orderBy,
      skip: pagination.skip,
      take: pagination.pageSize,
      include: resultInclude,
    }),
    prisma.result.count({ where }),
    getAdminResultOptions(),
  ]);

  const sourceLinks = await getSourceLinksFor(
    "Result",
    results.map((result) => result.id),
  );
  const classifications = await resolveRecordClassifications(
    ClassifiableEntityType.RESULT,
    results.map((result) => result.id),
  );

  return {
    results: results.map((result) => ({
      ...result,
      sourceLinks: sourceLinks.get(result.id) ?? [],
      classification: classifications.get(result.id),
    })),
    classificationSummary: summarizeClassificationResolutions(classifications.values()),
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: getAdminTotalPages(total, pagination.pageSize),
    options,
  };
}

export async function getAdminStageResults(filters: AdminStageResultListFilters) {
  const pagination = getAdminPagination({
    page: filters.page,
    pageSize: defaultAdminPageSize,
  });
  const sourceFilter = await getSourceFilter("StageResult", filters.sourceMode ?? "all");
  const classificationFilter = await getClassificationEntityIdFilter(
    ClassifiableEntityType.STAGE_RESULT,
    filters.classification,
  );
  const where = buildStageResultWhere(filters, sourceFilter, classificationFilter);
  const orderBy = buildStageResultOrder(filters.sort);

  const [stageResults, total, options] = await Promise.all([
    prisma.stageResult.findMany({
      where,
      orderBy,
      skip: pagination.skip,
      take: pagination.pageSize,
      include: stageResultInclude,
    }),
    prisma.stageResult.count({ where }),
    getAdminStageResultOptions(),
  ]);

  const sourceLinks = await getSourceLinksFor(
    "StageResult",
    stageResults.map((result) => result.id),
  );
  const classifications = await resolveRecordClassifications(
    ClassifiableEntityType.STAGE_RESULT,
    stageResults.map((result) => result.id),
  );

  return {
    stageResults: stageResults.map((result) => ({
      ...result,
      sourceLinks: sourceLinks.get(result.id) ?? [],
      classification: classifications.get(result.id),
    })),
    classificationSummary: summarizeClassificationResolutions(classifications.values()),
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: getAdminTotalPages(total, pagination.pageSize),
    options,
  };
}

export async function getAdminResultDetail(id: string) {
  const result = await prisma.result.findUnique({
    where: { id },
    include: resultInclude,
  });
  if (!result) return null;

  const [sourceLinks, versions, reviewItems] = await Promise.all([
    getSourceLinks("Result", id),
    getVersions("Result", id),
    prisma.connectorReviewItem.findMany({
      where: {
        OR: [{ currentResultId: id }, { appliedResultId: id }],
      },
      orderBy: { updatedAt: "desc" },
      include: { snapshot: { select: { id: true, createdAt: true, sourceKey: true } } },
    }),
  ]);

  return { ...result, sourceLinks, versions, reviewItems };
}

export async function getAdminStageResultDetail(id: string) {
  const result = await prisma.stageResult.findUnique({
    where: { id },
    include: stageResultInclude,
  });
  if (!result) return null;

  const [sourceLinks, versions, reviewItems] = await Promise.all([
    getSourceLinks("StageResult", id),
    getVersions("StageResult", id),
    prisma.connectorReviewItem.findMany({
      where: {
        OR: [{ currentStageResultId: id }, { appliedStageResultId: id }],
      },
      orderBy: { updatedAt: "desc" },
      include: { snapshot: { select: { id: true, createdAt: true, sourceKey: true } } },
    }),
  ]);

  return { ...result, sourceLinks, versions, reviewItems };
}

const resultInclude = {
  event: {
    include: {
      season: true,
      country: true,
    },
  },
  rider: {
    include: {
      country: true,
    },
  },
  manufacturer: true,
  motorcycle: {
    include: {
      manufacturer: true,
    },
  },
} satisfies Prisma.ResultInclude;

const stageResultInclude = {
  stage: {
    include: {
      event: {
        include: {
          season: true,
          country: true,
        },
      },
    },
  },
  rider: {
    include: {
      country: true,
    },
  },
  manufacturer: true,
  motorcycle: {
    include: {
      manufacturer: true,
    },
  },
} satisfies Prisma.StageResultInclude;

function buildResultWhere(
  filters: AdminResultListFilters,
  sourceFilter: Prisma.ResultWhereInput,
  classificationFilter: Prisma.StringFilter | undefined,
): Prisma.ResultWhereInput {
  return {
    ...(filters.search
      ? {
          OR: [
            { className: { contains: filters.search, mode: "insensitive" } },
            { notes: { contains: filters.search, mode: "insensitive" } },
            { event: { name: { contains: filters.search, mode: "insensitive" } } },
            { rider: { firstName: { contains: filters.search, mode: "insensitive" } } },
            { rider: { lastName: { contains: filters.search, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(filters.eventId ? { eventId: filters.eventId } : {}),
    ...(filters.riderId ? { riderId: filters.riderId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.manufacturerId ? { manufacturerId: filters.manufacturerId } : {}),
    ...(filters.motorcycleId ? { motorcycleId: filters.motorcycleId } : {}),
    ...(classificationFilter ? { id: classificationFilter } : {}),
    ...buildLifecycleWhere(filters.lifecycle ?? "active"),
    ...sourceFilter,
  };
}

function buildStageResultWhere(
  filters: AdminStageResultListFilters,
  sourceFilter: Prisma.StageResultWhereInput,
  classificationFilter: Prisma.StringFilter | undefined,
): Prisma.StageResultWhereInput {
  return {
    ...(filters.search
      ? {
          OR: [
            { className: { contains: filters.search, mode: "insensitive" } },
            { notes: { contains: filters.search, mode: "insensitive" } },
            { stage: { name: { contains: filters.search, mode: "insensitive" } } },
            {
              stage: {
                event: { name: { contains: filters.search, mode: "insensitive" } },
              },
            },
            { rider: { firstName: { contains: filters.search, mode: "insensitive" } } },
            { rider: { lastName: { contains: filters.search, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(filters.eventId ? { stage: { eventId: filters.eventId } } : {}),
    ...(filters.stageId ? { stageId: filters.stageId } : {}),
    ...(filters.riderId ? { riderId: filters.riderId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.position ? { overallPosition: filters.position } : {}),
    ...(classificationFilter ? { id: classificationFilter } : {}),
    ...buildLifecycleWhere(filters.lifecycle ?? "active"),
    ...sourceFilter,
  };
}

function buildLifecycleWhere(lifecycle: ResultLifecycleFilter) {
  if (lifecycle === "all") return {};
  if (lifecycle === "archived") return { archivedAt: { not: null } };
  return { archivedAt: null };
}

function buildResultOrder(sort = "event-desc"): Prisma.ResultOrderByWithRelationInput[] {
  if (sort === "position-desc") return [{ overallPosition: "desc" }, { id: "asc" }];
  if (sort === "position-asc") return [{ overallPosition: "asc" }, { id: "asc" }];
  if (sort === "updated-asc") return [{ updatedAt: "asc" }, { id: "asc" }];
  if (sort === "updated-desc") return [{ updatedAt: "desc" }, { id: "asc" }];
  if (sort === "event-asc") {
    return [{ event: { startDate: "asc" } }, { overallPosition: "asc" }, { id: "asc" }];
  }
  return [{ event: { startDate: "desc" } }, { overallPosition: "asc" }, { id: "asc" }];
}

function buildStageResultOrder(
  sort = "stage-desc",
): Prisma.StageResultOrderByWithRelationInput[] {
  if (sort === "position-desc") return [{ overallPosition: "desc" }, { id: "asc" }];
  if (sort === "position-asc") return [{ overallPosition: "asc" }, { id: "asc" }];
  if (sort === "updated-asc") return [{ updatedAt: "asc" }, { id: "asc" }];
  if (sort === "updated-desc") return [{ updatedAt: "desc" }, { id: "asc" }];
  if (sort === "stage-asc") {
    return [
      { stage: { event: { startDate: "asc" } } },
      { stage: { stageOrder: "asc" } },
      { overallPosition: "asc" },
      { id: "asc" },
    ];
  }
  return [
    { stage: { event: { startDate: "desc" } } },
    { stage: { stageOrder: "asc" } },
    { overallPosition: "asc" },
    { id: "asc" },
  ];
}

async function getSourceFilter(
  entityType: "Result",
  mode: SourceModeFilter,
): Promise<Prisma.ResultWhereInput>;
async function getSourceFilter(
  entityType: "StageResult",
  mode: SourceModeFilter,
): Promise<Prisma.StageResultWhereInput>;
async function getSourceFilter(entityType: string, mode: SourceModeFilter) {
  if (mode === "all") return {};
  const rows = await prisma.sourceLink.findMany({
    where: { entityType: { in: sourceLinkEntityTypeAliasesFor(entityType) } },
    distinct: ["entityId"],
    select: { entityId: true },
  });
  const ids = rows.map((row) => row.entityId);
  if (mode === "source-managed") return { id: ids.length ? { in: ids } : "__none__" };
  return ids.length ? { id: { notIn: ids } } : {};
}

async function getSourceLinksFor(entityType: string, entityIds: string[]) {
  const links = dedupeSourceLinksByLogicalEvidence(
    await prisma.sourceLink.findMany({
      where: {
        entityType: { in: sourceLinkEntityTypeAliasesFor(entityType) },
        entityId: { in: entityIds },
      },
      include: { dataSource: true },
      orderBy: { createdAt: "desc" },
    }),
  );
  const map = new Map<string, typeof links>();
  for (const link of links) {
    map.set(link.entityId, [...(map.get(link.entityId) ?? []), link]);
  }
  return map;
}

async function getSourceLinks(entityType: string, entityId: string) {
  return dedupeSourceLinksByLogicalEvidence(
    await prisma.sourceLink.findMany({
      where: { entityType: { in: sourceLinkEntityTypeAliasesFor(entityType) }, entityId },
      include: { dataSource: true },
      orderBy: { createdAt: "desc" },
    }),
  );
}

async function getVersions(entityType: string, entityId: string) {
  const versions = await prisma.dataVersion.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  const userIds = Array.from(
    new Set(versions.map((item) => item.createdBy).filter(Boolean)),
  ) as string[];
  const users = userIds.length
    ? await prisma.userProfile.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, displayName: true },
      })
    : [];
  const userMap = new Map(users.map((user) => [user.id, user]));

  return versions.map((item) => ({
    ...item,
    actor: item.createdBy ? (userMap.get(item.createdBy) ?? null) : null,
  }));
}
