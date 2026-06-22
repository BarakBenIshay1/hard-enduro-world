import {
  previewRecordsCalculation,
  type ChampionshipCareerInput,
} from "@/jobs/calculations/records-engine";
import { validateStatisticsAndRecordsInputs } from "@/jobs/calculations/record-validation";
import {
  previewStatisticsCalculation,
  type StatisticsResultInput,
} from "@/jobs/calculations/statistics-engine";
import { prisma } from "@/lib/prisma";

export async function getRecalculationAdminData() {
  const [
    latestRun,
    pendingRecalculationItems,
    existingRecordsCount,
    results,
    careerSeasons,
  ] = await prisma.$transaction([
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
        OR: [
          {
            jobName: {
              contains: "statistics",
              mode: "insensitive",
            },
          },
          {
            jobName: {
              contains: "records",
              mode: "insensitive",
            },
          },
          {
            jobName: {
              contains: "recalculate",
              mode: "insensitive",
            },
          },
        ],
      },
    }),
    prisma.championshipRecord.count(),
    prisma.result.findMany({
      orderBy: [{ event: { startDate: "desc" } }, { overallPosition: "asc" }],
      include: {
        event: true,
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
    prisma.riderCareerSeason.findMany({
      where: {
        championshipPosition: 1,
      },
      include: {
        rider: true,
      },
    }),
  ]);

  const resultInputs: StatisticsResultInput[] = results.map((result) => {
    const career =
      result.rider.careerSeasons.find(
        (item) => item.seasonId === result.event.seasonId,
      ) ?? result.rider.careerSeasons[0];
    const team = result.rider.teamMemberships[0]?.team ?? career?.team ?? null;
    const motorcycle = result.motorcycle ?? career?.motorcycle ?? null;
    const manufacturer =
      result.manufacturer ?? motorcycle?.manufacturer ?? career?.manufacturer ?? null;

    return {
      id: result.id,
      eventId: result.eventId,
      riderId: result.riderId,
      riderName: `${result.rider.firstName} ${result.rider.lastName}`,
      riderHref: `/riders/${result.rider.slug}`,
      countryId: result.rider.countryId,
      countryName: result.rider.country?.name ?? "Unknown",
      countryHref: result.rider.country
        ? `/countries/${result.rider.country.slug}`
        : undefined,
      teamId: team?.id ?? null,
      teamName: team?.name ?? "Independent",
      teamHref: team ? `/teams/${team.slug}` : undefined,
      manufacturerId: manufacturer?.id ?? null,
      manufacturerName: manufacturer?.name ?? "TBC",
      manufacturerHref: manufacturer ? `/manufacturers/${manufacturer.slug}` : undefined,
      motorcycleId: motorcycle?.id ?? null,
      motorcycleName: motorcycle
        ? `${motorcycle.manufacturer.name} ${motorcycle.model}${
            motorcycle.year ? ` ${motorcycle.year}` : ""
          }`
        : "TBC",
      motorcycleHref: motorcycle ? `/motorcycles/${motorcycle.slug}` : undefined,
      position: result.overallPosition,
      status: result.status,
    };
  });
  const championshipCareers = careerSeasons.reduce<ChampionshipCareerInput[]>(
    (rows, career) => {
      const riderName = `${career.rider.firstName} ${career.rider.lastName}`;
      const existing = rows.find((row) => row.riderId === career.riderId);

      if (existing) {
        existing.championships += 1;
        return rows;
      }

      rows.push({
        riderId: career.riderId,
        riderName,
        riderHref: `/riders/${career.rider.slug}`,
        championships: 1,
      });

      return rows;
    },
    [],
  );
  const statisticsPreview = previewStatisticsCalculation(resultInputs);
  const recordsPreview = previewRecordsCalculation({
    statistics: statisticsPreview,
    championshipCareers,
  });
  const validationIssues = validateStatisticsAndRecordsInputs(resultInputs);

  return {
    latestRun,
    pendingRecalculationItems,
    existingRecordsCount,
    resultRowsCount: resultInputs.length,
    statisticsPreview,
    recordsPreview,
    validationIssues,
    wouldChange: {
      statisticsLeaderboards: Object.keys(statisticsPreview.leaderboards).length,
      recordPreviews: recordsPreview.records.length,
      existingRecordsCount,
    },
  };
}
