import type {
  EventVisibility,
  MotorcycleStatus,
  Prisma,
  StrokeType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  defaultAdminPageSize,
  getAdminPagination,
  getAdminTotalPages,
} from "@/lib/admin/platform";

export type AdminMotorcycleListFilters = {
  search?: string;
  manufacturer?: string;
  year?: number;
  visibility?: EventVisibility;
  status?: MotorcycleStatus;
  lifecycle?: "active" | "draft" | "archived" | "all";
  page?: number;
  sort?: string;
};

export async function getAdminMotorcycleOptions() {
  const manufacturers = await prisma.manufacturer.findMany({
    where: { archivedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const years = await prisma.motorcycle.findMany({
    where: { year: { not: null } },
    distinct: ["year"],
    orderBy: { year: "desc" },
    select: { year: true },
  });

  return {
    manufacturers,
    years: years.map((item) => item.year).filter((year): year is number => year !== null),
    visibility: ["PUBLIC", "DRAFT", "PRIVATE"] satisfies EventVisibility[],
    status: ["ACTIVE", "HISTORIC", "INACTIVE"] satisfies MotorcycleStatus[],
    strokeTypes: ["TWO_STROKE", "FOUR_STROKE"] satisfies StrokeType[],
  };
}

export async function getAdminMotorcycles(filters: AdminMotorcycleListFilters) {
  const pagination = getAdminPagination({
    page: filters.page,
    pageSize: defaultAdminPageSize,
  });
  const where = buildMotorcycleWhere(filters);
  const orderBy = buildMotorcycleOrder(filters.sort);

  const [motorcycles, total, manufacturers, years] = await prisma.$transaction([
    prisma.motorcycle.findMany({
      where,
      orderBy,
      skip: pagination.skip,
      take: pagination.pageSize,
      include: {
        manufacturer: true,
        _count: {
          select: {
            currentRiders: true,
            results: true,
            stageResults: true,
            riderCareerSeasons: true,
            seasonStats: true,
          },
        },
      },
    }),
    prisma.motorcycle.count({ where }),
    prisma.manufacturer.findMany({
      where: { archivedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.motorcycle.findMany({
      where: { year: { not: null } },
      distinct: ["year"],
      orderBy: { year: "desc" },
      select: { year: true },
    }),
  ]);

  return {
    motorcycles,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: getAdminTotalPages(total, pagination.pageSize),
    manufacturers,
    years: years.map((item) => item.year).filter((year): year is number => year !== null),
  };
}

export async function getAdminMotorcycleDetail(id: string) {
  return prisma.motorcycle.findUnique({
    where: { id },
    include: {
      manufacturer: true,
      currentRiders: { take: 8, orderBy: { lastName: "asc" } },
      results: { take: 5, orderBy: { createdAt: "desc" } },
      stageResults: { take: 5, orderBy: { createdAt: "desc" } },
      riderCareerSeasons: { take: 5, orderBy: { createdAt: "desc" } },
      seasonStats: { take: 5, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function getAdminMotorcycleAudit(id: string) {
  const audit = await prisma.dataVersion.findMany({
    where: { entityType: "Motorcycle", entityId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const userIds = Array.from(
    new Set(audit.map((item) => item.createdBy).filter(Boolean)),
  ) as string[];
  const users = userIds.length
    ? await prisma.userProfile.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, displayName: true },
      })
    : [];
  const userMap = new Map(users.map((user) => [user.id, user]));

  return audit.map((item) => ({
    ...item,
    actor: item.createdBy ? (userMap.get(item.createdBy) ?? null) : null,
  }));
}

export async function getAdminMotorcycleDeleteEligibility(id: string) {
  return getMotorcycleDeleteEligibility(id, prisma);
}

export async function getMotorcycleDeleteEligibility(
  id: string,
  client: Pick<
    typeof prisma,
    | "motorcycle"
    | "rider"
    | "result"
    | "stageResult"
    | "riderCareerSeason"
    | "motorcycleSeasonStat"
    | "sourceLink"
    | "dataVersion"
  >,
) {
  const motorcycle = await client.motorcycle.findUnique({
    where: { id },
    include: { manufacturer: true },
  });

  if (!motorcycle) {
    return {
      eligible: false,
      motorcycle: null,
      origin: "unknown",
      blockers: ["Motorcycle no longer exists."],
      dependencyCounts: {},
    };
  }

  const [
    currentRiders,
    results,
    stageResults,
    careerSeasons,
    seasonStats,
    sourceLinks,
    manualCreateAudit,
  ] = await Promise.all([
    client.rider.count({ where: { currentMotorcycleId: id } }),
    client.result.count({ where: { motorcycleId: id } }),
    client.stageResult.count({ where: { motorcycleId: id } }),
    client.riderCareerSeason.count({ where: { motorcycleId: id } }),
    client.motorcycleSeasonStat.count({ where: { motorcycleId: id } }),
    client.sourceLink.count({ where: { entityType: "Motorcycle", entityId: id } }),
    client.dataVersion.findFirst({
      where: {
        entityType: "Motorcycle",
        entityId: id,
        action: "CREATE",
        createdBy: { not: null },
      },
      select: { id: true },
    }),
  ]);

  const dependencyCounts = {
    currentRiders,
    results,
    stageResults,
    careerSeasons,
    seasonStats,
    sourceLinks,
  };
  const blockers: string[] = [];
  const origin = manualCreateAudit ? "manual" : "unverified";

  if (!motorcycle.archivedAt) blockers.push("Motorcycle must be archived first.");
  if (!manualCreateAudit) {
    blockers.push("Motorcycle does not have a verified manual CREATE audit.");
  }
  if (currentRiders > 0) blockers.push("Current rider references exist.");
  if (results > 0) blockers.push("Result rows exist.");
  if (stageResults > 0) blockers.push("Stage result rows exist.");
  if (careerSeasons > 0) blockers.push("Rider career season rows exist.");
  if (seasonStats > 0) blockers.push("Motorcycle season stat rows exist.");
  if (sourceLinks > 0) blockers.push("Source tracking links exist.");

  return {
    eligible: blockers.length === 0,
    motorcycle,
    origin,
    blockers,
    dependencyCounts,
  };
}

function buildMotorcycleWhere(
  filters: AdminMotorcycleListFilters,
): Prisma.MotorcycleWhereInput {
  return {
    ...(filters.search
      ? {
          OR: [
            { model: { contains: filters.search, mode: "insensitive" } },
            { slug: { contains: filters.search, mode: "insensitive" } },
            { description: { contains: filters.search, mode: "insensitive" } },
            {
              manufacturer: {
                name: { contains: filters.search, mode: "insensitive" },
              },
            },
          ],
        }
      : {}),
    ...(filters.manufacturer ? { manufacturerId: filters.manufacturer } : {}),
    ...(filters.year ? { year: filters.year } : {}),
    ...(filters.visibility ? { visibility: filters.visibility } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...buildLifecycleWhere(filters.lifecycle ?? "active"),
  };
}

function buildLifecycleWhere(
  lifecycle: NonNullable<AdminMotorcycleListFilters["lifecycle"]>,
): Prisma.MotorcycleWhereInput {
  if (lifecycle === "all") return {};
  if (lifecycle === "archived") return { archivedAt: { not: null } };
  if (lifecycle === "draft") return { archivedAt: null, visibility: "DRAFT" };
  return { archivedAt: null };
}

function buildMotorcycleOrder(
  sort?: string,
): Prisma.MotorcycleOrderByWithRelationInput[] {
  if (sort === "updated-desc") return [{ updatedAt: "desc" }];
  if (sort === "updated-asc") return [{ updatedAt: "asc" }];
  if (sort === "model-desc") return [{ model: "desc" }];
  if (sort === "year-desc") return [{ year: "desc" }, { model: "asc" }];
  if (sort === "year-asc") return [{ year: "asc" }, { model: "asc" }];
  return [{ manufacturer: { name: "asc" } }, { model: "asc" }, { year: "desc" }];
}
