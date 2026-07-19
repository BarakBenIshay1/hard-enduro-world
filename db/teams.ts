import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { publicResultWhere, publicTeamWhere } from "@/lib/results/public-filters";

export async function getTeamsList() {
  return prisma.team.findMany({
    where: publicTeamWhere,
    orderBy: {
      name: "asc",
    },
    include: {
      country: true,
      manufacturer: true,
      memberships: {
        include: {
          rider: {
            include: {
              currentMotorcycle: {
                include: {
                  manufacturer: true,
                },
              },
            },
          },
        },
      },
      careerSeasons: {
        include: {
          season: true,
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
}

export async function getTeamDetail(slug: string) {
  const team = await prisma.team.findFirst({
    where: {
      slug,
      ...publicTeamWhere,
    },
    include: {
      country: true,
      manufacturer: true,
      memberships: {
        include: {
          rider: {
            include: {
              country: true,
              currentMotorcycle: {
                include: {
                  manufacturer: true,
                },
              },
              standings: {
                orderBy: {
                  points: "desc",
                },
                take: 1,
                include: {
                  season: true,
                },
              },
              careerSeasons: {
                include: {
                  season: true,
                  team: true,
                  manufacturer: true,
                  motorcycle: {
                    include: {
                      manufacturer: true,
                    },
                  },
                },
              },
              results: {
                where: publicResultWhere,
                include: {
                  rider: true,
                  event: {
                    include: {
                      country: true,
                      season: true,
                    },
                  },
                  manufacturer: true,
                  motorcycle: {
                    include: {
                      manufacturer: true,
                    },
                  },
                },
                orderBy: {
                  createdAt: "desc",
                },
              },
            },
          },
        },
      },
      careerSeasons: {
        include: {
          season: true,
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
    },
  });

  if (!team) {
    notFound();
  }

  return team;
}
