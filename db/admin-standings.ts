import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  defaultAdminPageSize,
  getAdminPagination,
  getAdminTotalPages,
} from "@/lib/admin/platform";

export type AdminStandingListFilters = {
  search?: string;
  seasonId?: string;
  riderId?: string;
  page?: number;
  sort?: string;
};

export async function getAdminStandingOptions() {
  const [seasons, riders] = await prisma.$transaction([
    prisma.season.findMany({
      orderBy: { year: "desc" },
      select: { id: true, name: true, year: true },
    }),
    prisma.rider.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true },
    }),
  ]);
  return { seasons, riders };
}

export async function getAdminStandings(filters: AdminStandingListFilters) {
  const pagination = getAdminPagination({
    page: filters.page,
    pageSize: defaultAdminPageSize,
  });
  const where = buildStandingWhere(filters);
  const orderBy = buildStandingOrder(filters.sort);

  const [standings, total, options, publications] = await Promise.all([
    prisma.standing.findMany({
      where,
      orderBy,
      skip: pagination.skip,
      take: pagination.pageSize,
      include: {
        season: true,
        rider: { include: { country: true } },
      },
    }),
    prisma.standing.count({ where }),
    getAdminStandingOptions(),
    prisma.standingPublication.findMany({
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 20,
      include: {
        season: { select: { name: true, year: true } },
        regulation: { select: { title: true, version: true } },
      },
    }),
  ]);

  return {
    standings,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: getAdminTotalPages(total, pagination.pageSize),
    options,
    publications,
  };
}

export async function getAdminStandingDetail(id: string) {
  const standing = await prisma.standing.findUnique({
    where: { id },
    include: {
      season: true,
      rider: {
        include: {
          country: true,
          currentMotorcycle: { include: { manufacturer: true } },
        },
      },
    },
  });
  if (!standing) return null;

  const [versions, reviewItems] = await Promise.all([
    getVersions("Standing", standing.id),
    prisma.connectorReviewItem.findMany({
      where: {
        OR: [{ currentStandingId: standing.id }, { appliedStandingId: standing.id }],
      },
      orderBy: { updatedAt: "desc" },
      include: { snapshot: { select: { id: true, createdAt: true, sourceKey: true } } },
    }),
  ]);

  return { ...standing, versions, reviewItems };
}

function buildStandingWhere(
  filters: AdminStandingListFilters,
): Prisma.StandingWhereInput {
  return {
    ...(filters.search
      ? {
          OR: [
            { className: { contains: filters.search, mode: "insensitive" } },
            { season: { name: { contains: filters.search, mode: "insensitive" } } },
            { rider: { firstName: { contains: filters.search, mode: "insensitive" } } },
            { rider: { lastName: { contains: filters.search, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(filters.seasonId ? { seasonId: filters.seasonId } : {}),
    ...(filters.riderId ? { riderId: filters.riderId } : {}),
  };
}

function buildStandingOrder(
  sort = "position-asc",
): Prisma.StandingOrderByWithRelationInput[] {
  if (sort === "points-desc") return [{ points: "desc" }, { position: "asc" }];
  if (sort === "points-asc") return [{ points: "asc" }, { position: "asc" }];
  if (sort === "updated-desc") return [{ updatedAt: "desc" }, { id: "asc" }];
  if (sort === "updated-asc") return [{ updatedAt: "asc" }, { id: "asc" }];
  if (sort === "season-desc") return [{ season: { year: "desc" } }, { position: "asc" }];
  return [{ season: { year: "desc" } }, { position: "asc" }, { points: "desc" }];
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
