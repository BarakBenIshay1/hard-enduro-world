import { prisma } from "@/lib/prisma";

export async function getAdminDashboardData() {
  const [
    events,
    riders,
    teams,
    manufacturers,
    motorcycles,
    results,
    standings,
    records,
    sources,
  ] = await prisma.$transaction([
    prisma.event.count(),
    prisma.rider.count(),
    prisma.team.count(),
    prisma.manufacturer.count(),
    prisma.motorcycle.count(),
    prisma.result.count(),
    prisma.standing.count(),
    prisma.championshipRecord.count(),
    prisma.sourceLink.count(),
  ]);

  return {
    counts: {
      events,
      riders,
      teams,
      manufacturers,
      motorcycles,
      results,
      standings,
      records,
      sources,
      pendingReviews: 0,
    },
  };
}
