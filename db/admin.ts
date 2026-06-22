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
    pendingReviews,
    failedImports,
    latestChanges,
  ] = await prisma.$transaction([
    prisma.event.count(),
    prisma.rider.count(),
    prisma.team.count(),
    prisma.manufacturer.count(),
    prisma.motorcycle.count(),
    prisma.result.count(),
    prisma.standing.count(),
    prisma.championshipRecord.count(),
    prisma.dataSource.count(),
    prisma.importRun.count({
      where: {
        status: {
          in: ["PENDING", "NEEDS_REVIEW"],
        },
      },
    }),
    prisma.importRun.count({
      where: {
        status: "FAILED",
      },
    }),
    prisma.dataVersion.count(),
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
      pendingReviews,
      failedImports,
      latestChanges,
    },
  };
}
