import { prisma } from "@/lib/prisma";

export type StatisticFact = {
  id: string;
  seasonId: string;
  seasonLabel: string;
  className: string;
  eventName: string;
  eventSlug: string;
  riderName: string;
  riderSlug: string;
  country: string;
  team: string;
  teamSlug: string | null;
  manufacturer: string;
  manufacturerSlug: string | null;
  motorcycle: string;
  motorcycleSlug: string | null;
  position: number | null;
  points: number;
  status: string;
};

export type PointsLeader = {
  id: string;
  seasonId: string;
  riderName: string;
  riderSlug: string;
  points: number;
  wins: number;
  podiums: number;
};

export async function getStatisticsPageData() {
  const [
    seasons,
    totalRiders,
    totalEvents,
    totalResults,
    totalManufacturers,
    totalMotorcycles,
    results,
    standings,
  ] = await prisma.$transaction([
    prisma.season.findMany({ orderBy: { year: "desc" } }),
    prisma.rider.count(),
    prisma.event.count(),
    prisma.result.count(),
    prisma.manufacturer.count(),
    prisma.motorcycle.count(),
    prisma.result.findMany({
      orderBy: [{ event: { startDate: "desc" } }, { overallPosition: "asc" }],
      include: {
        event: {
          include: {
            season: true,
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
              },
            },
          },
        },
        manufacturer: true,
        motorcycle: {
          include: {
            manufacturer: true,
          },
        },
      },
    }),
    prisma.standing.findMany({
      orderBy: [{ season: { year: "desc" } }, { points: "desc" }],
      include: {
        season: true,
        rider: true,
      },
    }),
  ]);

  const facts: StatisticFact[] = results.map((result) => {
    const career =
      result.rider.careerSeasons.find(
        (item) => item.seasonId === result.event.seasonId,
      ) ?? result.rider.careerSeasons[0];
    const motorcycle = result.motorcycle ?? career?.motorcycle ?? null;
    const manufacturer =
      result.manufacturer ?? motorcycle?.manufacturer ?? career?.manufacturer;
    const team = result.rider.teamMemberships[0]?.team ?? career?.team ?? null;

    return {
      id: result.id,
      seasonId: result.event.seasonId,
      seasonLabel: result.event.season.name,
      className: result.className ?? "Pro",
      eventName: result.event.name,
      eventSlug: result.event.slug,
      riderName: `${result.rider.firstName} ${result.rider.lastName}`,
      riderSlug: result.rider.slug,
      country: result.rider.country?.name ?? "Unknown",
      team: team?.name ?? "Independent",
      teamSlug: team?.slug ?? null,
      manufacturer: manufacturer?.name ?? "TBC",
      manufacturerSlug: manufacturer?.slug ?? null,
      motorcycle: motorcycle
        ? `${motorcycle.manufacturer.name} ${motorcycle.model}${
            motorcycle.year ? ` ${motorcycle.year}` : ""
          }`
        : "TBC",
      motorcycleSlug: motorcycle?.slug ?? null,
      position: result.overallPosition,
      points: result.points ?? 0,
      status: result.status,
    };
  });

  const pointsLeaders: PointsLeader[] = standings.map((standing) => ({
    id: standing.id,
    seasonId: standing.seasonId,
    riderName: `${standing.rider.firstName} ${standing.rider.lastName}`,
    riderSlug: standing.rider.slug,
    points: standing.points,
    wins: standing.wins,
    podiums: standing.podiums,
  }));

  return {
    seasons: seasons.map((season) => ({ value: season.id, label: season.name })),
    overview: {
      totalRiders,
      totalEvents,
      totalResults,
      totalManufacturers,
      totalMotorcycles,
    },
    facts,
    pointsLeaders,
  };
}
