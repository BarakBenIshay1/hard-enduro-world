import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function getManufacturersList() {
  return prisma.manufacturer.findMany({
    orderBy: {
      name: "asc",
    },
    include: {
      country: true,
      motorcycles: {
        include: {
          currentRiders: true,
        },
      },
      results: {
        include: {
          event: {
            include: {
              season: true,
            },
          },
          rider: true,
        },
      },
      riderCareerSeasons: {
        include: {
          season: true,
          rider: true,
          team: true,
          motorcycle: true,
        },
      },
    },
  });
}

export async function getManufacturerDetail(slug: string) {
  const manufacturer = await prisma.manufacturer.findUnique({
    where: { slug },
    include: {
      country: true,
      motorcycles: {
        include: {
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
        },
      },
      results: {
        include: {
          rider: {
            include: {
              country: true,
            },
          },
          event: {
            include: {
              country: true,
              season: true,
            },
          },
          motorcycle: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      riderCareerSeasons: {
        include: {
          season: true,
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
              },
            },
          },
          team: {
            include: {
              country: true,
            },
          },
          motorcycle: true,
        },
      },
      seasonStats: {
        include: {
          season: true,
        },
      },
    },
  });

  if (!manufacturer) {
    notFound();
  }

  return manufacturer;
}
