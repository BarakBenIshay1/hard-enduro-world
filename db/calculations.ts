import { previewStandingsCalculation } from "@/jobs/calculations/standings-engine";
import { pointsSystems } from "@/jobs/calculations/points-system";
import type { CalculationResultInput } from "@/jobs/calculations/validation";
import { prisma } from "@/lib/prisma";
import { publicResultWhere } from "@/lib/results/public-filters";

export async function getCalculationsAdminData() {
  const [latestCalculationRun, pendingRecalculations, pendingResultImports, seasons] =
    await prisma.$transaction([
      prisma.importRun.findFirst({
        where: {
          jobName: {
            contains: "recalculate",
            mode: "insensitive",
          },
        },
        orderBy: {
          startedAt: "desc",
        },
      }),
      prisma.importRun.count({
        where: {
          status: {
            in: ["PENDING", "NEEDS_REVIEW"],
          },
          jobName: {
            contains: "recalculate",
            mode: "insensitive",
          },
        },
      }),
      prisma.importRun.count({
        where: {
          status: "NEEDS_REVIEW",
          jobName: {
            contains: "official-results",
            mode: "insensitive",
          },
        },
      }),
      prisma.season.findMany({
        orderBy: {
          year: "desc",
        },
        include: {
          standings: {
            include: {
              rider: true,
            },
          },
          events: {
            include: {
              results: {
                where: publicResultWhere,
                include: {
                  rider: true,
                },
              },
            },
          },
        },
      }),
    ]);

  const season = seasons[0] ?? null;
  const resultInputs: CalculationResultInput[] =
    season?.events.flatMap((event) =>
      event.results.map((result) => ({
        id: result.id,
        seasonId: season.id,
        eventId: event.id,
        riderId: result.riderId,
        riderName: `${result.rider.firstName} ${result.rider.lastName}`,
        className: result.className,
        position: result.overallPosition,
        points: result.points,
        status: result.status,
      })),
    ) ?? [];
  const currentStandings =
    season?.standings.map((standing) => ({
      seasonId: season.id,
      riderId: standing.riderId,
      className: standing.className,
      currentPosition: standing.position,
      currentPoints: standing.points,
    })) ?? [];
  const preview = previewStandingsCalculation({
    results: resultInputs,
    currentStandings,
    pointsSystemId: "source-result-points",
  });
  const affectedSeasons = seasons.filter((item) =>
    item.events.some((event) => event.results.length > 0),
  );

  return {
    latestCalculationRun,
    pendingRecalculations,
    pendingResultImports,
    affectedSeasons,
    selectedSeason: season,
    pointsSystems,
    preview,
  };
}
