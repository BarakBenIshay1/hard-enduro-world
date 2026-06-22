import { prisma } from "@/lib/prisma";

export async function getStandingsPageData() {
  const seasons = await prisma.season.findMany({
    orderBy: {
      year: "desc",
    },
    include: {
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
                  season: true,
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
