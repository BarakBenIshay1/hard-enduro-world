import { ClassifiableEntityType } from "@prisma/client";
import type { Prisma, ScoringComponentType } from "@prisma/client";
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

export type ResultPointComponentLifecycleFilter = "active" | "archived" | "all";

export type AdminResultPointComponentListFilters = {
  search?: string;
  eventId?: string;
  resultId?: string;
  componentType?: ScoringComponentType;
  regulationId?: string;
  classification?: ClassificationFilter;
  lifecycle?: ResultPointComponentLifecycleFilter;
  page?: number;
  sort?: string;
};

export async function getAdminResultPointComponentOptions() {
  const [events, regulations] = await prisma.$transaction([
    prisma.event.findMany({
      orderBy: [{ startDate: "desc" }, { name: "asc" }],
      select: { id: true, name: true, season: { select: { year: true } } },
    }),
    prisma.championshipRegulation.findMany({
      orderBy: [{ regulationYear: "desc" }, { updatedAt: "desc" }],
      select: { id: true, title: true, regulationYear: true, version: true },
    }),
  ]);

  return { events, regulations };
}

export async function getAdminResultPointComponents(
  filters: AdminResultPointComponentListFilters,
) {
  const pagination = getAdminPagination({
    page: filters.page,
    pageSize: defaultAdminPageSize,
  });
  const classificationFilter = await getClassificationEntityIdFilter(
    ClassifiableEntityType.RESULT_POINT_COMPONENT,
    filters.classification,
  );
  const where = buildComponentWhere(filters, classificationFilter);
  const orderBy = buildComponentOrder(filters.sort);

  const [components, total, options] = await Promise.all([
    prisma.resultPointComponent.findMany({
      where,
      orderBy,
      skip: pagination.skip,
      take: pagination.pageSize,
      include: resultPointComponentListInclude,
    }),
    prisma.resultPointComponent.count({ where }),
    getAdminResultPointComponentOptions(),
  ]);

  const sourceLinks = await getSourceLinksFor(
    components.map((component) => component.id),
  );
  const classifications = await resolveRecordClassifications(
    ClassifiableEntityType.RESULT_POINT_COMPONENT,
    components.map((component) => component.id),
  );

  return {
    components: components.map((component) => ({
      ...component,
      sourceLinks: sourceLinks.get(component.id) ?? [],
      classification: classifications.get(component.id),
    })),
    classificationSummary: summarizeClassificationResolutions(classifications.values()),
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: getAdminTotalPages(total, pagination.pageSize),
    options,
  };
}

export async function getAdminResultPointComponentDetail(id: string) {
  const component = await prisma.resultPointComponent.findUnique({
    where: { id },
    include: resultPointComponentDetailInclude,
  });
  if (!component) return null;

  const reviewWhere: Prisma.ConnectorReviewItemWhereInput = {
    OR: [
      { currentResultPointComponentId: id },
      { appliedResultPointComponentId: id },
      ...(component.connectorReviewItemId
        ? [{ id: component.connectorReviewItemId }]
        : []),
    ],
  };

  const [sourceLinks, versions, reviewItems] = await Promise.all([
    getSourceLinks(id),
    getVersions(id),
    prisma.connectorReviewItem.findMany({
      where: reviewWhere,
      orderBy: { updatedAt: "desc" },
      include: { snapshot: { select: { id: true, createdAt: true, sourceKey: true } } },
    }),
  ]);

  return { ...component, sourceLinks, versions, reviewItems };
}

const resultPointComponentListInclude = {
  result: {
    include: {
      event: { include: { season: true } },
      rider: true,
    },
  },
  raceStage: true,
  stageResult: {
    include: {
      rider: true,
      stage: true,
    },
  },
  regulation: true,
  sourceSnapshot: {
    include: {
      dataSource: true,
    },
  },
  connectorReviewItem: true,
} satisfies Prisma.ResultPointComponentInclude;

const resultPointComponentDetailInclude = {
  result: {
    include: {
      event: { include: { season: true, country: true } },
      rider: { include: { country: true } },
    },
  },
  raceStage: true,
  stageResult: {
    include: {
      rider: true,
      stage: { include: { event: true } },
    },
  },
  regulation: true,
  sourceSnapshot: {
    include: {
      dataSource: true,
    },
  },
  connectorReviewItem: {
    include: {
      snapshot: { select: { id: true, createdAt: true, sourceKey: true } },
    },
  },
} satisfies Prisma.ResultPointComponentInclude;

function buildComponentWhere(
  filters: AdminResultPointComponentListFilters,
  classificationFilter: Prisma.StringFilter | undefined,
): Prisma.ResultPointComponentWhereInput {
  return {
    ...(filters.search
      ? {
          OR: [
            { className: { contains: filters.search, mode: "insensitive" } },
            {
              regulationTableKey: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
            {
              result: {
                event: { name: { contains: filters.search, mode: "insensitive" } },
              },
            },
            {
              result: {
                rider: { firstName: { contains: filters.search, mode: "insensitive" } },
              },
            },
            {
              result: {
                rider: { lastName: { contains: filters.search, mode: "insensitive" } },
              },
            },
          ],
        }
      : {}),
    ...(filters.eventId ? { eventId: filters.eventId } : {}),
    ...(filters.resultId ? { resultId: filters.resultId } : {}),
    ...(filters.componentType ? { componentType: filters.componentType } : {}),
    ...(filters.regulationId ? { regulationId: filters.regulationId } : {}),
    ...(classificationFilter ? { id: classificationFilter } : {}),
    ...buildLifecycleWhere(filters.lifecycle ?? "active"),
  };
}

function buildLifecycleWhere(lifecycle: ResultPointComponentLifecycleFilter) {
  if (lifecycle === "all") return {};
  if (lifecycle === "archived") return { archivedAt: { not: null } };
  return { archivedAt: null };
}

function buildComponentOrder(
  sort = "event-desc",
): Prisma.ResultPointComponentOrderByWithRelationInput[] {
  if (sort === "points-desc") return [{ points: "desc" }, { id: "asc" }];
  if (sort === "points-asc") return [{ points: "asc" }, { id: "asc" }];
  if (sort === "updated-asc") return [{ updatedAt: "asc" }, { id: "asc" }];
  if (sort === "updated-desc") return [{ updatedAt: "desc" }, { id: "asc" }];
  if (sort === "event-asc") {
    return [{ result: { event: { startDate: "asc" } } }, { id: "asc" }];
  }
  return [{ result: { event: { startDate: "desc" } } }, { id: "asc" }];
}

async function getSourceLinksFor(entityIds: string[]) {
  const links = await prisma.sourceLink.findMany({
    where: {
      entityType: "ResultPointComponent",
      entityId: { in: entityIds },
    },
    include: { dataSource: true },
    orderBy: { createdAt: "desc" },
  });
  const map = new Map<string, typeof links>();
  for (const link of links) {
    map.set(link.entityId, [...(map.get(link.entityId) ?? []), link]);
  }
  return map;
}

async function getSourceLinks(entityId: string) {
  return prisma.sourceLink.findMany({
    where: { entityType: "ResultPointComponent", entityId },
    include: { dataSource: true },
    orderBy: { createdAt: "desc" },
  });
}

async function getVersions(entityId: string) {
  const versions = await prisma.dataVersion.findMany({
    where: { entityType: "ResultPointComponent", entityId },
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
