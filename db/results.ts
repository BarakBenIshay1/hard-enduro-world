import { prisma } from "@/lib/prisma";
import { publicResultWhere, publicStageResultWhere } from "@/lib/results/public-filters";

export async function getResultsPageData() {
  const [seasons, events, overallResults, stageResults] = await prisma.$transaction([
    prisma.season.findMany({
      orderBy: {
        year: "desc",
      },
    }),
    prisma.event.findMany({
      orderBy: [{ startDate: "desc" }],
      include: {
        season: true,
        country: true,
        stages: {
          orderBy: {
            stageOrder: "asc",
          },
        },
      },
    }),
    prisma.result.findMany({
      where: publicResultWhere,
      orderBy: [{ event: { startDate: "desc" } }, { overallPosition: "asc" }],
      include: {
        event: {
          include: {
            season: true,
            country: true,
          },
        },
        rider: {
          include: {
            country: true,
            teamMemberships: {
              take: 1,
              include: {
                team: true,
              },
            },
            careerSeasons: {
              include: {
                team: true,
                manufacturer: true,
                motorcycle: {
                  include: {
                    manufacturer: true,
                  },
                },
                season: true,
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
    }),
    prisma.stageResult.findMany({
      where: publicStageResultWhere,
      orderBy: [{ stage: { event: { startDate: "desc" } } }, { overallPosition: "asc" }],
      include: {
        stage: {
          include: {
            event: {
              include: {
                season: true,
                country: true,
              },
            },
          },
        },
        rider: {
          include: {
            country: true,
            teamMemberships: {
              take: 1,
              include: {
                team: true,
              },
            },
            careerSeasons: {
              include: {
                team: true,
                manufacturer: true,
                motorcycle: {
                  include: {
                    manufacturer: true,
                  },
                },
                season: true,
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
    }),
  ]);

  return {
    seasons,
    events,
    overallResults,
    stageResults,
  };
}
