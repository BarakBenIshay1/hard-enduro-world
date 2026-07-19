import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  publicEventWhere,
  publicResultWhere,
  publicStageResultWhere,
} from "@/lib/results/public-filters";

export async function getHomeSummary() {
  const [eventCount, riderCount, motorcycleCount, stageResultCount, latestEvents] =
    await prisma.$transaction([
      prisma.event.count({ where: publicEventWhere }),
      prisma.rider.count(),
      prisma.motorcycle.count(),
      prisma.stageResult.count({ where: publicStageResultWhere }),
      prisma.event.findMany({
        where: publicEventWhere,
        orderBy: [{ startDate: "asc" }],
        take: 3,
        include: {
          country: true,
          season: true,
          stages: {
            orderBy: { stageOrder: "asc" },
            take: 1,
            include: {
              stageResults: {
                where: publicStageResultWhere,
                orderBy: [{ overallPosition: "asc" }],
                take: 1,
                include: {
                  rider: true,
                },
              },
            },
          },
        },
      }),
    ]);

  return {
    eventCount,
    riderCount,
    motorcycleCount,
    stageResultCount,
    latestEvents,
  };
}

export async function getEventsList() {
  return prisma.event.findMany({
    where: publicEventWhere,
    orderBy: [{ startDate: "asc" }],
    include: {
      country: true,
      season: true,
      stages: {
        orderBy: { stageOrder: "asc" },
        select: {
          id: true,
        },
      },
      results: {
        where: publicResultWhere,
        orderBy: [{ overallPosition: "asc" }],
        take: 1,
        include: {
          rider: true,
        },
      },
      _count: {
        select: {
          results: { where: publicResultWhere },
        },
      },
    },
  });
}

export async function getEventDetail(slug: string) {
  const event = await prisma.event.findFirst({
    where: {
      slug,
      ...publicEventWhere,
    },
    include: {
      country: true,
      season: true,
      timelineItems: {
        orderBy: [{ occurredAt: "asc" }, { createdAt: "asc" }],
      },
      weatherSnapshots: {
        orderBy: { fetchedAt: "desc" },
        take: 1,
      },
      stages: {
        orderBy: { stageOrder: "asc" },
        include: {
          stageResults: {
            where: publicStageResultWhere,
            orderBy: [{ overallPosition: "asc" }, { classPosition: "asc" }],
            include: {
              rider: {
                include: {
                  country: true,
                  teamMemberships: {
                    take: 1,
                    include: {
                      team: true,
                    },
                  },
                },
              },
              motorcycle: {
                include: {
                  manufacturer: true,
                },
              },
              manufacturer: true,
            },
          },
        },
      },
      results: {
        where: publicResultWhere,
        orderBy: [{ overallPosition: "asc" }, { classPosition: "asc" }],
        include: {
          rider: {
            include: {
              country: true,
              standings: true,
              teamMemberships: {
                include: {
                  team: true,
                },
              },
            },
          },
          motorcycle: {
            include: {
              manufacturer: true,
            },
          },
          manufacturer: true,
        },
      },
      mediaItems: {
        orderBy: { uploadedAt: "desc" },
      },
    },
  });

  if (!event) {
    notFound();
  }

  const baseName = event.name.replace(/\s+\d{4}$/, "");
  const previousEditions = await prisma.event.findMany({
    where: {
      ...publicEventWhere,
      name: {
        startsWith: baseName,
      },
      NOT: {
        id: event.id,
      },
    },
    orderBy: {
      startDate: "desc",
    },
    take: 8,
    include: {
      country: true,
      season: true,
      results: {
        where: publicResultWhere,
        orderBy: [{ overallPosition: "asc" }],
        take: 1,
        include: {
          rider: true,
          manufacturer: true,
          motorcycle: {
            include: {
              manufacturer: true,
            },
          },
        },
      },
    },
  });

  return {
    ...event,
    previousEditions,
  };
}
