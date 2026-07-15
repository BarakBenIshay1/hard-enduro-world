import type { EventVisibility, ManufacturerStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  defaultAdminPageSize,
  getAdminPagination,
  getAdminTotalPages,
} from "@/lib/admin/platform";

export type AdminManufacturerListFilters = {
  search?: string;
  country?: string;
  visibility?: EventVisibility;
  status?: ManufacturerStatus;
  lifecycle?: "active" | "draft" | "archived" | "all";
  page?: number;
  sort?: string;
};

export async function getAdminManufacturerOptions() {
  const countries = await prisma.country.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, isoCode: true },
  });

  return {
    countries,
    visibility: ["PUBLIC", "DRAFT", "PRIVATE"] satisfies EventVisibility[],
    status: ["ACTIVE", "HISTORIC", "INACTIVE"] satisfies ManufacturerStatus[],
  };
}

export async function getAdminManufacturers(filters: AdminManufacturerListFilters) {
  const pagination = getAdminPagination({
    page: filters.page,
    pageSize: defaultAdminPageSize,
  });
  const where = buildManufacturerWhere(filters);
  const orderBy = buildManufacturerOrder(filters.sort);

  const [manufacturers, total, countries] = await prisma.$transaction([
    prisma.manufacturer.findMany({
      where,
      orderBy,
      skip: pagination.skip,
      take: pagination.pageSize,
      include: {
        country: true,
        _count: {
          select: {
            motorcycles: true,
            results: true,
            stageResults: true,
            riderCareerSeasons: true,
            seasonStats: true,
            teams: true,
          },
        },
      },
    }),
    prisma.manufacturer.count({ where }),
    prisma.country.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, isoCode: true },
    }),
  ]);

  return {
    manufacturers,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: getAdminTotalPages(total, pagination.pageSize),
    countries,
  };
}

export async function getAdminManufacturerDetail(id: string) {
  return prisma.manufacturer.findUnique({
    where: { id },
    include: {
      country: true,
      motorcycles: { take: 8, orderBy: { model: "asc" } },
      results: { take: 5, orderBy: { createdAt: "desc" } },
      stageResults: { take: 5, orderBy: { createdAt: "desc" } },
      riderCareerSeasons: { take: 5, orderBy: { createdAt: "desc" } },
      seasonStats: { take: 5, orderBy: { createdAt: "desc" } },
      teams: { take: 8, orderBy: { name: "asc" } },
    },
  });
}

export async function getAdminManufacturerAudit(id: string) {
  const audit = await prisma.dataVersion.findMany({
    where: { entityType: "Manufacturer", entityId: id },
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

export async function getAdminManufacturerDeleteEligibility(id: string) {
  return getManufacturerDeleteEligibility(id, prisma);
}

export async function getManufacturerDeleteEligibility(
  id: string,
  client: Pick<
    typeof prisma,
    | "manufacturer"
    | "motorcycle"
    | "result"
    | "stageResult"
    | "riderCareerSeason"
    | "manufacturerSeasonStat"
    | "team"
    | "sourceLink"
    | "dataVersion"
  >,
) {
  const manufacturer = await client.manufacturer.findUnique({
    where: { id },
    include: { country: true },
  });

  if (!manufacturer) {
    return {
      eligible: false,
      manufacturer: null,
      origin: "unknown",
      blockers: ["Manufacturer no longer exists."],
      dependencyCounts: {},
    };
  }

  const [
    motorcycles,
    results,
    stageResults,
    careerSeasons,
    seasonStats,
    teams,
    sourceLinks,
    manualCreateAudit,
  ] = await Promise.all([
    client.motorcycle.count({ where: { manufacturerId: id } }),
    client.result.count({ where: { manufacturerId: id } }),
    client.stageResult.count({ where: { manufacturerId: id } }),
    client.riderCareerSeason.count({ where: { manufacturerId: id } }),
    client.manufacturerSeasonStat.count({ where: { manufacturerId: id } }),
    client.team.count({ where: { manufacturerId: id } }),
    client.sourceLink.count({ where: { entityType: "Manufacturer", entityId: id } }),
    client.dataVersion.findFirst({
      where: {
        entityType: "Manufacturer",
        entityId: id,
        action: "CREATE",
        createdBy: { not: null },
      },
      select: { id: true },
    }),
  ]);

  const dependencyCounts = {
    motorcycles,
    results,
    stageResults,
    careerSeasons,
    seasonStats,
    teams,
    sourceLinks,
  };
  const blockers: string[] = [];
  const origin = manualCreateAudit ? "manual" : "unverified";

  if (!manufacturer.archivedAt) blockers.push("Manufacturer must be archived first.");
  if (!manualCreateAudit) {
    blockers.push("Manufacturer does not have a verified manual CREATE audit.");
  }
  if (motorcycles > 0) blockers.push("Motorcycle rows exist.");
  if (results > 0) blockers.push("Result rows exist.");
  if (stageResults > 0) blockers.push("Stage result rows exist.");
  if (careerSeasons > 0) blockers.push("Rider career season rows exist.");
  if (seasonStats > 0) blockers.push("Manufacturer season stat rows exist.");
  if (teams > 0) blockers.push("Team rows exist.");
  if (sourceLinks > 0) blockers.push("Source tracking links exist.");

  return {
    eligible: blockers.length === 0,
    manufacturer,
    origin,
    blockers,
    dependencyCounts,
  };
}

function buildManufacturerWhere(
  filters: AdminManufacturerListFilters,
): Prisma.ManufacturerWhereInput {
  return {
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" } },
            { slug: { contains: filters.search, mode: "insensitive" } },
            { websiteUrl: { contains: filters.search, mode: "insensitive" } },
            { description: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filters.country ? { countryId: filters.country } : {}),
    ...(filters.visibility ? { visibility: filters.visibility } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...buildLifecycleWhere(filters.lifecycle ?? "active"),
  };
}

function buildLifecycleWhere(
  lifecycle: NonNullable<AdminManufacturerListFilters["lifecycle"]>,
): Prisma.ManufacturerWhereInput {
  if (lifecycle === "all") return {};
  if (lifecycle === "archived") return { archivedAt: { not: null } };
  if (lifecycle === "draft") return { archivedAt: null, visibility: "DRAFT" };
  return { archivedAt: null };
}

function buildManufacturerOrder(
  sort?: string,
): Prisma.ManufacturerOrderByWithRelationInput[] {
  if (sort === "updated-desc") return [{ updatedAt: "desc" }];
  if (sort === "updated-asc") return [{ updatedAt: "asc" }];
  if (sort === "name-desc") return [{ name: "desc" }];
  if (sort === "founded-asc") return [{ foundedYear: "asc" }, { name: "asc" }];
  if (sort === "founded-desc") return [{ foundedYear: "desc" }, { name: "asc" }];
  return [{ name: "asc" }];
}
