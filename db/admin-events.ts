import type { EventStatus, EventVisibility, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getEventContentReadiness } from "@/lib/content/readiness";

export type AdminEventListFilters = {
  search?: string;
  season?: string;
  championship?: string;
  status?: EventStatus;
  visibility?: EventVisibility;
  lifecycle?: "active" | "draft" | "archived" | "all";
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
  const audit = await prisma.dataVersion.findMany({
    where: {
      entityType: "Event",
      entityId: id,
    },
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

export async function getAdminEventReadiness(id: string) {
  const [event, sourceLinkCount] = await Promise.all([
    prisma.event.findUnique({
      where: { id },
      include: {
        mediaItems: {
          select: {
            type: true,
            title: true,
            url: true,
            copyrightOwner: true,
            license: true,
            source: true,
          },
        },
      },
    }),
    prisma.sourceLink.count({
      where: {
        entityId: id,
        entityType: { in: ["EVENT", "Event"] },
      },
    }),
  ]);

  if (!event) return null;

  return getEventContentReadiness({
    name: event.name,
    slug: event.slug,
    seasonId: event.seasonId,
    countryId: event.countryId,
    roundNumber: event.roundNumber,
    city: event.city,
    venue: event.venue,
    startDate: event.startDate,
    endDate: event.endDate,
    officialUrl: event.officialUrl,
    organizer: event.organizer,
    description: event.description,
    heroImage: event.heroImage,
    galleryImages: event.galleryImages,
    visibility: event.visibility,
    archivedAt: event.archivedAt,
    sourceLinkCount,
    mediaItems: event.mediaItems,
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

export async function getAdminEventDeleteEligibility(id: string) {
  return getEventDeleteEligibility(id, prisma);
}

export async function getEventDeleteEligibility(
  id: string,
  client: Pick<
    typeof prisma,
    | "event"
    | "raceStage"
    | "eventTimelineItem"
    | "result"
    | "weatherSnapshot"
    | "mediaItem"
    | "sourceLink"
    | "connectorReviewItem"
    | "dataVersion"
  >,
) {
  const event = await client.event.findUnique({
    where: { id },
    include: {
      season: true,
      country: true,
    },
  });

  if (!event) {
    return {
      eligible: false,
      event: null,
      origin: "unknown",
      blockers: ["Event no longer exists."],
      dependencyCounts: {},
    };
  }

  const [
    stages,
    timelineItems,
    results,
    weatherSnapshots,
    mediaItems,
    sourceLinks,
    connectorHistory,
    manualCreateAudit,
  ] = await Promise.all([
    client.raceStage.count({ where: { eventId: id } }),
    client.eventTimelineItem.count({ where: { eventId: id } }),
    client.result.count({ where: { eventId: id } }),
    client.weatherSnapshot.count({ where: { eventId: id } }),
    client.mediaItem.count({ where: { eventId: id } }),
    client.sourceLink.count({ where: { entityType: "Event", entityId: id } }),
    client.connectorReviewItem.count({
      where: {
        OR: [{ currentEventId: id }, { appliedEventId: id }],
      },
    }),
    client.dataVersion.findFirst({
      where: {
        entityType: "Event",
        entityId: id,
        action: "CREATE",
        createdBy: { not: null },
      },
      select: { id: true },
    }),
  ]);

  const dependencyCounts = {
    stages,
    timelineItems,
    results,
    weatherSnapshots,
    mediaItems,
    sourceLinks,
    connectorHistory,
  };
  const blockers: string[] = [];
  const origin = manualCreateAudit ? "manual" : "unverified";

  if (!event.archivedAt) blockers.push("Event must be archived first.");
  if (!manualCreateAudit) {
    blockers.push("Event does not have a verified manual CREATE audit.");
  }
  if (connectorHistory > 0) blockers.push("Connector review/application history exists.");
  if (sourceLinks > 0) blockers.push("Source tracking links exist.");
  if (results > 0) blockers.push("Result rows exist.");
  if (stages > 0) blockers.push("Stage rows exist.");
  if (timelineItems > 0) blockers.push("Timeline rows exist.");
  if (weatherSnapshots > 0) blockers.push("Weather snapshots exist.");
  if (mediaItems > 0) blockers.push("Media dependencies exist.");

  return {
    eligible: blockers.length === 0,
    event,
    origin,
    blockers,
    dependencyCounts,
  };
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
    ...(filters.visibility ? { visibility: filters.visibility } : {}),
    ...buildLifecycleWhere(filters.lifecycle ?? "active"),
  };
}

function buildLifecycleWhere(
  lifecycle: NonNullable<AdminEventListFilters["lifecycle"]>,
): Prisma.EventWhereInput {
  if (lifecycle === "all") return {};
  if (lifecycle === "archived") return { archivedAt: { not: null } };
  if (lifecycle === "draft") return { archivedAt: null, visibility: "DRAFT" };
  return { archivedAt: null };
}

function buildEventOrder(sort?: string): Prisma.EventOrderByWithRelationInput[] {
  if (sort === "name-asc") return [{ name: "asc" }];
  if (sort === "name-desc") return [{ name: "desc" }];
  if (sort === "updated-desc") return [{ updatedAt: "desc" }];
  if (sort === "updated-asc") return [{ updatedAt: "asc" }];
  if (sort === "start-desc") return [{ startDate: "desc" }];
  return [{ startDate: "asc" }];
}
