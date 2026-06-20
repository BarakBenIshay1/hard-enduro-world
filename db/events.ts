import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function getHomeSummary() {
  const [eventCount, riderCount, motorcycleCount, stageResultCount, latestEvents] =
    await prisma.$transaction([
      prisma.event.count(),
      prisma.rider.count(),
      prisma.motorcycle.count(),
      prisma.stageResult.count(),
      prisma.event.findMany({
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
        orderBy: [{ overallPosition: "asc" }],
        take: 1,
        include: {
          rider: true,
        },
      },
      _count: {
        select: {
          results: true,
        },
      },
    },
  });
}

export async function getEventDetail(slug: string) {
  const event = await prisma.event.findUnique({
    where: { slug },
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
        orderBy: [{ overallPosition: "asc" }, { classPosition: "asc" }],
        include: {
          rider: true,
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

  return event;
}
