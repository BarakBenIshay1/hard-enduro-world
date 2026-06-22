import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function getRidersList() {
  return prisma.rider.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
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
        orderBy: {
          points: "desc",
        },
        take: 1,
        include: {
          manufacturer: true,
          motorcycle: {
            include: {
              manufacturer: true,
            },
          },
          team: true,
          season: true,
        },
      },
      results: {
        select: {
          status: true,
        },
      },
    },
  });
}

export async function getRiderDetail(slug: string) {
  const rider = await prisma.rider.findUnique({
    where: { slug },
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
      standings: {
        orderBy: [{ season: { year: "desc" } }],
        include: {
          season: true,
        },
      },
      careerSeasons: {
        orderBy: [{ season: { year: "desc" } }],
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
        orderBy: [{ event: { startDate: "desc" } }],
        include: {
          event: {
            include: {
              country: true,
              season: true,
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
      stageResults: {
        orderBy: [{ stage: { stageOrder: "asc" } }],
        take: 8,
        include: {
          stage: {
            include: {
              event: true,
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
  });

  if (!rider) {
    notFound();
  }

  return rider;
}
