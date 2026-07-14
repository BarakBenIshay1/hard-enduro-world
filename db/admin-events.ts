import type { EventStatus, EventVisibility, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AdminEventListFilters = {
  search?: string;
  season?: string;
  championship?: string;
  status?: EventStatus;
  page?: number;
  sort?: string;
};

const pageSize = 12;

export async function getAdminEventOptions() {
  const [seasons, countries, statuses] = await Promise.all([
    prisma.season.findMany({
      orderBy: { year: "desc" },
      select: {
        id: true,
        year: true,
        name: true,
      },
    }),
    prisma.country.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        isoCode: true,
      },
    }),
    Promise.resolve<EventStatus[]>([
      "SCHEDULED",
      "LIVE",
      "SUSPENDED",
      "COMPLETED",
      "CANCELLED",
    ]),
  ]);

  return {
    seasons,
    countries,
    statuses,
    visibility: ["PUBLIC", "DRAFT", "PRIVATE"] satisfies EventVisibility[],
  };
}

export async function getAdminEvents(filters: AdminEventListFilters) {
  const page = Math.max(filters.page ?? 1, 1);
  const where = buildEventWhere(filters);
  const orderBy = buildEventOrder(filters.sort);

  const [events, total, options] = await prisma.$transaction([
    prisma.event.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        season: true,
        country: true,
      },
    }),
    prisma.event.count({ where }),
    prisma.season.findMany({
      orderBy: { year: "desc" },
      select: {
        id: true,
        year: true,
        name: true,
      },
    }),
  ]);

  return {
    events,
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
    seasons: options,
  };
}

export async function getAdminEventDetail(id: string) {
  return prisma.event.findUnique({
    where: { id },
    include: {
      season: true,
      country: true,
      stages: {
        orderBy: { stageOrder: "asc" },
      },
      timelineItems: {
        orderBy: [{ occurredAt: "asc" }, { createdAt: "asc" }],
      },
      mediaItems: {
        orderBy: [{ uploadedAt: "desc" }],
      },
      results: {
        orderBy: [{ overallPosition: "asc" }],
        take: 10,
        include: {
          rider: true,
          manufacturer: true,
        },
      },
    },
  });
}

export async function getAdminEventAudit(id: string) {
  return prisma.dataVersion.findMany({
    where: {
      entityType: "Event",
      entityId: id,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function getAdminEventBySlug(slug: string) {
  return prisma.event.findUnique({
    where: { slug },
    select: {
      id: true,
    },
  });
}

function buildEventWhere(filters: AdminEventListFilters): Prisma.EventWhereInput {
  return {
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" } },
            { slug: { contains: filters.search, mode: "insensitive" } },
            { city: { contains: filters.search, mode: "insensitive" } },
            { venue: { contains: filters.search, mode: "insensitive" } },
            { officialUrl: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filters.season ? { seasonId: filters.season } : {}),
    ...(filters.championship
      ? {
          season: {
            name: { contains: filters.championship, mode: "insensitive" },
          },
        }
      : {}),
    ...(filters.status ? { status: filters.status } : {}),
  };
}

function buildEventOrder(sort?: string): Prisma.EventOrderByWithRelationInput[] {
  if (sort === "name-asc") return [{ name: "asc" }];
  if (sort === "name-desc") return [{ name: "desc" }];
  if (sort === "updated-desc") return [{ updatedAt: "desc" }];
  if (sort === "updated-asc") return [{ updatedAt: "asc" }];
  if (sort === "start-desc") return [{ startDate: "desc" }];
  return [{ startDate: "asc" }];
}
