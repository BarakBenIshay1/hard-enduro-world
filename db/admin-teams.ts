import type { EventVisibility, Prisma, TeamStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  defaultAdminPageSize,
  getAdminPagination,
  getAdminTotalPages,
} from "@/lib/admin/platform";

export type AdminTeamListFilters = {
  search?: string;
  country?: string;
  manufacturer?: string;
  visibility?: EventVisibility;
  status?: TeamStatus;
  lifecycle?: "active" | "draft" | "archived" | "all";
  page?: number;
  sort?: string;
};

export async function getAdminTeamOptions() {
  const [countries, manufacturers] = await Promise.all([
    prisma.country.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, isoCode: true },
    }),
    prisma.manufacturer.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return {
    countries,
    manufacturers,
    visibility: ["PUBLIC", "DRAFT", "PRIVATE"] satisfies EventVisibility[],
    status: ["ACTIVE", "HISTORIC", "INACTIVE"] satisfies TeamStatus[],
  };
}

export async function getAdminTeams(filters: AdminTeamListFilters) {
  const pagination = getAdminPagination({
    page: filters.page,
    pageSize: defaultAdminPageSize,
  });
  const where = buildTeamWhere(filters);
  const orderBy = buildTeamOrder(filters.sort);

  const [teams, total, countries, manufacturers] = await prisma.$transaction([
    prisma.team.findMany({
      where,
      orderBy,
      skip: pagination.skip,
      take: pagination.pageSize,
      include: {
        country: true,
        manufacturer: true,
        _count: {
          select: {
            memberships: true,
            careerSeasons: true,
          },
        },
      },
    }),
    prisma.team.count({ where }),
    prisma.country.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, isoCode: true },
    }),
    prisma.manufacturer.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return {
    teams,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: getAdminTotalPages(total, pagination.pageSize),
    countries,
    manufacturers,
  };
}

export async function getAdminTeamDetail(id: string) {
  return prisma.team.findUnique({
    where: { id },
    include: {
      country: true,
      manufacturer: true,
      memberships: {
        take: 8,
        include: { rider: true },
      },
      careerSeasons: {
        take: 8,
        include: {
          rider: true,
          season: true,
          manufacturer: true,
          motorcycle: { include: { manufacturer: true } },
        },
      },
    },
  });
}

export async function getAdminTeamAudit(id: string) {
  const audit = await prisma.dataVersion.findMany({
    where: { entityType: "Team", entityId: id },
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

export async function getAdminTeamDeleteEligibility(id: string) {
  return getTeamDeleteEligibility(id, prisma);
}

export async function getTeamDeleteEligibility(
  id: string,
  client: Pick<
    typeof prisma,
    "team" | "teamMembership" | "riderCareerSeason" | "sourceLink" | "dataVersion"
  >,
) {
  const team = await client.team.findUnique({
    where: { id },
    include: { country: true, manufacturer: true },
  });

  if (!team) {
    return {
      eligible: false,
      team: null,
      origin: "unknown",
      blockers: ["Team no longer exists."],
      dependencyCounts: {},
    };
  }

  const [memberships, careerSeasons, sourceLinks, manualCreateAudit] = await Promise.all([
    client.teamMembership.count({ where: { teamId: id } }),
    client.riderCareerSeason.count({ where: { teamId: id } }),
    client.sourceLink.count({ where: { entityType: "Team", entityId: id } }),
    client.dataVersion.findFirst({
      where: {
        entityType: "Team",
        entityId: id,
        action: "CREATE",
        createdBy: { not: null },
      },
      select: { id: true },
    }),
  ]);

  const dependencyCounts = { memberships, careerSeasons, sourceLinks };
  const blockers: string[] = [];
  const origin = manualCreateAudit ? "manual" : "unverified";

  if (!team.archivedAt) blockers.push("Team must be archived first.");
  if (!manualCreateAudit) {
    blockers.push("Team does not have a verified manual CREATE audit.");
  }
  if (memberships > 0) blockers.push("Team membership rows exist.");
  if (careerSeasons > 0) blockers.push("Rider career season rows exist.");
  if (sourceLinks > 0) blockers.push("Source tracking links exist.");

  return {
    eligible: blockers.length === 0,
    team,
    origin,
    blockers,
    dependencyCounts,
  };
}

function buildTeamWhere(filters: AdminTeamListFilters): Prisma.TeamWhereInput {
  return {
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" } },
            { slug: { contains: filters.search, mode: "insensitive" } },
            { officialUrl: { contains: filters.search, mode: "insensitive" } },
            { managerName: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filters.country ? { countryId: filters.country } : {}),
    ...(filters.manufacturer ? { manufacturerId: filters.manufacturer } : {}),
    ...(filters.visibility ? { visibility: filters.visibility } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...buildLifecycleWhere(filters.lifecycle ?? "active"),
  };
}

function buildLifecycleWhere(
  lifecycle: NonNullable<AdminTeamListFilters["lifecycle"]>,
): Prisma.TeamWhereInput {
  if (lifecycle === "all") return {};
  if (lifecycle === "archived") return { archivedAt: { not: null } };
  if (lifecycle === "draft") return { archivedAt: null, visibility: "DRAFT" };
  return { archivedAt: null };
}

function buildTeamOrder(sort?: string): Prisma.TeamOrderByWithRelationInput[] {
  if (sort === "updated-desc") return [{ updatedAt: "desc" }];
  if (sort === "updated-asc") return [{ updatedAt: "asc" }];
  if (sort === "name-desc") return [{ name: "desc" }];
  return [{ name: "asc" }];
}
