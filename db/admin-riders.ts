import type { EventVisibility, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  defaultAdminPageSize,
  getAdminPagination,
  getAdminTotalPages,
} from "@/lib/admin/platform";

export type AdminRiderListFilters = {
  search?: string;
  country?: string;
  motorcycle?: string;
  visibility?: EventVisibility;
  lifecycle?: "active" | "draft" | "archived" | "all";
  page?: number;
  sort?: string;
};

export async function getAdminRiderOptions() {
  const [countries, motorcycles] = await Promise.all([
    prisma.country.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, isoCode: true },
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

  return {
    countries,
    motorcycles,
    visibility: ["PUBLIC", "DRAFT", "PRIVATE"] satisfies EventVisibility[],
  };
}

export async function getAdminRiders(filters: AdminRiderListFilters) {
  const pagination = getAdminPagination({
    page: filters.page,
    pageSize: defaultAdminPageSize,
  });
  const where = buildRiderWhere(filters);
  const orderBy = buildRiderOrder(filters.sort);

  const [riders, total, countries] = await prisma.$transaction([
    prisma.rider.findMany({
      where,
      orderBy,
      skip: pagination.skip,
      take: pagination.pageSize,
      include: {
        country: true,
        currentMotorcycle: {
          include: { manufacturer: true },
        },
        _count: {
          select: {
            results: true,
            stageResults: true,
            standings: true,
            careerSeasons: true,
            teamMemberships: true,
          },
        },
      },
    }),
    prisma.rider.count({ where }),
    prisma.country.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, isoCode: true },
    }),
  ]);

  return {
    riders,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: getAdminTotalPages(total, pagination.pageSize),
    countries,
  };
}

export async function getAdminRiderDetail(id: string) {
  return prisma.rider.findUnique({
    where: { id },
    include: {
      country: true,
      currentMotorcycle: { include: { manufacturer: true } },
      results: { take: 5, orderBy: { createdAt: "desc" } },
      stageResults: { take: 5, orderBy: { createdAt: "desc" } },
      standings: { take: 5, orderBy: { createdAt: "desc" } },
      careerSeasons: { take: 5, orderBy: { createdAt: "desc" } },
      teamMemberships: { take: 5 },
    },
  });
}

export async function getAdminRiderAudit(id: string) {
  const audit = await prisma.dataVersion.findMany({
    where: { entityType: "Rider", entityId: id },
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

export async function getAdminRiderDeleteEligibility(id: string) {
  return getRiderDeleteEligibility(id, prisma);
}

export async function getRiderDeleteEligibility(
  id: string,
  client: Pick<
    typeof prisma,
    | "rider"
    | "result"
    | "stageResult"
    | "standing"
    | "riderCareerSeason"
    | "teamMembership"
    | "sourceLink"
    | "dataVersion"
  >,
) {
  const rider = await client.rider.findUnique({
    where: { id },
    include: { country: true, currentMotorcycle: true },
  });

  if (!rider) {
    return {
      eligible: false,
      rider: null,
      origin: "unknown",
      blockers: ["Rider no longer exists."],
      dependencyCounts: {},
    };
  }

  const [
    results,
    stageResults,
    standings,
    careerSeasons,
    teamMemberships,
    sourceLinks,
    manualCreateAudit,
  ] = await Promise.all([
    client.result.count({ where: { riderId: id } }),
    client.stageResult.count({ where: { riderId: id } }),
    client.standing.count({ where: { riderId: id } }),
    client.riderCareerSeason.count({ where: { riderId: id } }),
    client.teamMembership.count({ where: { riderId: id } }),
    client.sourceLink.count({ where: { entityType: "Rider", entityId: id } }),
    client.dataVersion.findFirst({
      where: {
        entityType: "Rider",
        entityId: id,
        action: "CREATE",
        createdBy: { not: null },
      },
      select: { id: true },
    }),
  ]);

  const dependencyCounts = {
    results,
    stageResults,
    standings,
    careerSeasons,
    teamMemberships,
    sourceLinks,
  };
  const blockers: string[] = [];
  const origin = manualCreateAudit ? "manual" : "unverified";

  if (!rider.archivedAt) blockers.push("Rider must be archived first.");
  if (!manualCreateAudit) {
    blockers.push("Rider does not have a verified manual CREATE audit.");
  }
  if (results > 0) blockers.push("Result rows exist.");
  if (stageResults > 0) blockers.push("Stage result rows exist.");
  if (standings > 0) blockers.push("Standing rows exist.");
  if (careerSeasons > 0) blockers.push("Career season rows exist.");
  if (teamMemberships > 0) blockers.push("Team membership rows exist.");
  if (sourceLinks > 0) blockers.push("Source tracking links exist.");

  return {
    eligible: blockers.length === 0,
    rider,
    origin,
    blockers,
    dependencyCounts,
  };
}

function buildRiderWhere(filters: AdminRiderListFilters): Prisma.RiderWhereInput {
  return {
    ...(filters.search
      ? {
          OR: [
            { firstName: { contains: filters.search, mode: "insensitive" } },
            { lastName: { contains: filters.search, mode: "insensitive" } },
            { slug: { contains: filters.search, mode: "insensitive" } },
            { officialUrl: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filters.country ? { countryId: filters.country } : {}),
    ...(filters.motorcycle ? { currentMotorcycleId: filters.motorcycle } : {}),
    ...(filters.visibility ? { visibility: filters.visibility } : {}),
    ...buildLifecycleWhere(filters.lifecycle ?? "active"),
  };
}

function buildLifecycleWhere(
  lifecycle: NonNullable<AdminRiderListFilters["lifecycle"]>,
): Prisma.RiderWhereInput {
  if (lifecycle === "all") return {};
  if (lifecycle === "archived") return { archivedAt: { not: null } };
  if (lifecycle === "draft") return { archivedAt: null, visibility: "DRAFT" };
  return { archivedAt: null };
}

function buildRiderOrder(sort?: string): Prisma.RiderOrderByWithRelationInput[] {
  if (sort === "updated-desc") return [{ updatedAt: "desc" }];
  if (sort === "updated-asc") return [{ updatedAt: "asc" }];
  if (sort === "first-asc") return [{ firstName: "asc" }, { lastName: "asc" }];
  if (sort === "last-desc") return [{ lastName: "desc" }, { firstName: "desc" }];
  return [{ lastName: "asc" }, { firstName: "asc" }];
}
