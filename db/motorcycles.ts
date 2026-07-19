import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  publicMotorcycleWhere,
  publicResultWhere,
  publicStageResultWhere,
} from "@/lib/results/public-filters";

export async function getMotorcyclesList() {
  return prisma.motorcycle.findMany({
    where: publicMotorcycleWhere,
    orderBy: [{ manufacturer: { name: "asc" } }, { model: "asc" }],
    include: {
      manufacturer: {
        include: {
          country: true,
        },
      },
      currentRiders: true,
      results: {
        where: publicResultWhere,
        include: {
          event: {
            include: {
              season: true,
            },
          },
        },
      },
      riderCareerSeasons: {
        include: {
          season: true,
          rider: true,
          team: true,
        },
      },
    },
  });
}

export async function getMotorcycleDetail(slug: string) {
  const motorcycle = await prisma.motorcycle.findFirst({
    where: {
      slug,
      ...publicMotorcycleWhere,
    },
    include: {
      manufacturer: {
        include: {
          country: true,
        },
      },
      currentRiders: {
        include: {
          country: true,
          standings: {
            orderBy: {
              points: "desc",
            },
            take: 1,
          },
        },
      },
      results: {
        where: publicResultWhere,
        include: {
          rider: {
            include: {
              country: true,
              standings: {
                orderBy: {
                  points: "desc",
                },
                take: 1,
              },
            },
          },
          event: {
            include: {
              country: true,
              season: true,
            },
          },
          manufacturer: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      stageResults: {
        where: publicStageResultWhere,
        include: {
          rider: {
            include: {
              country: true,
            },
          },
          stage: {
            include: {
              event: true,
            },
          },
        },
        take: 8,
      },
      riderCareerSeasons: {
        include: {
          season: true,
          rider: {
            include: {
              country: true,
              standings: {
                orderBy: {
                  points: "desc",
                },
                take: 1,
              },
            },
          },
          team: {
            include: {
              country: true,
            },
          },
          manufacturer: true,
        },
      },
      seasonStats: {
        include: {
          season: true,
        },
      },
    },
  });

  if (!motorcycle) {
    notFound();
  }

  return motorcycle;
}
