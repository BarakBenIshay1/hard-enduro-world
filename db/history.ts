import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { publicResultWhere, publicStageResultWhere } from "@/lib/results/public-filters";

export async function getHistoryIndexData() {
  const seasons = await prisma.season.findMany({
    orderBy: {
      year: "desc",
    },
    include: {
      events: {
        include: {
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
      },
      standings: {
        orderBy: [{ position: "asc" }, { points: "desc" }],
        include: {
          rider: {
            include: {
              country: true,
              currentMotorcycle: {
                include: {
                  manufacturer: true,
                },
              },
              careerSeasons: {
                include: {
                  manufacturer: true,
                  motorcycle: {
                    include: {
                      manufacturer: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return { seasons };
}

export async function getSeasonHistory(year: number) {
  const season = await prisma.season.findUnique({
    where: { year },
    include: {
      events: {
        orderBy: [{ roundNumber: "asc" }, { startDate: "asc" }],
        include: {
          country: true,
          results: {
            where: publicResultWhere,
            orderBy: [{ overallPosition: "asc" }],
            include: {
              rider: {
                include: {
                  country: true,
                },
              },
              manufacturer: true,
              motorcycle: {
                include: {
                  manufacturer: true,
                },
              },
            },
          },
          stages: {
            include: {
              stageResults: {
                where: publicStageResultWhere,
              },
            },
          },
        },
      },
      standings: {
        orderBy: [{ position: "asc" }, { points: "desc" }],
        include: {
          rider: {
            include: {
              country: true,
              currentMotorcycle: {
                include: {
                  manufacturer: true,
                },
              },
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
                },
              },
            },
          },
        },
      },
      riderCareerSeasons: {
        include: {
          rider: {
            include: {
              country: true,
            },
          },
          team: true,
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

  if (!season) {
    notFound();
  }

  return season;
}
