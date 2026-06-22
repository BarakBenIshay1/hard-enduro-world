import { createLeaderboard, type LeaderboardRow } from "@/jobs/calculations/leaderboards";

export type StatisticsResultInput = {
  id: string;
  eventId: string;
  riderId: string | null;
  riderName: string;
  riderHref?: string;
  countryId: string | null;
  countryName: string;
  countryHref?: string;
  teamId: string | null;
  teamName: string;
  teamHref?: string;
  manufacturerId: string | null;
  manufacturerName: string;
  manufacturerHref?: string;
  motorcycleId: string | null;
  motorcycleName: string;
  motorcycleHref?: string;
  position: number | null;
  status: "FINISHED" | "DNF" | "DNS" | "DSQ" | "UNKNOWN";
};

export type RiderStatisticPreview = {
  riderId: string;
  riderName: string;
  href?: string;
  wins: number;
  podiums: number;
  starts: number;
  dnfs: number;
  finishRate: number;
  averageFinishPosition: number | null;
};

export type StatisticsPreview = {
  riderStats: RiderStatisticPreview[];
  leaderboards: {
    riderWins: LeaderboardRow[];
    riderPodiums: LeaderboardRow[];
    riderStarts: LeaderboardRow[];
    riderDnfs: LeaderboardRow[];
    manufacturerWins: LeaderboardRow[];
    manufacturerPodiums: LeaderboardRow[];
    motorcycleWins: LeaderboardRow[];
    motorcyclePodiums: LeaderboardRow[];
    countryWins: LeaderboardRow[];
    teamWins: LeaderboardRow[];
  };
};

export function previewStatisticsCalculation(
  results: StatisticsResultInput[],
): StatisticsPreview {
  const riderStats = calculateRiderStats(results);

  return {
    riderStats,
    leaderboards: {
      riderWins: createLeaderboard({
        rows: results,
        getId: (row) => row.riderId,
        getLabel: (row) => row.riderName,
        getValue: (row) => (row.position === 1 && row.status === "FINISHED" ? 1 : 0),
        getHref: (row) => row.riderHref,
      }),
      riderPodiums: createLeaderboard({
        rows: results,
        getId: (row) => row.riderId,
        getLabel: (row) => row.riderName,
        getValue: podiumValue,
        getHref: (row) => row.riderHref,
      }),
      riderStarts: createLeaderboard({
        rows: results,
        getId: (row) => row.riderId,
        getLabel: (row) => row.riderName,
        getValue: () => 1,
        getHref: (row) => row.riderHref,
      }),
      riderDnfs: createLeaderboard({
        rows: results,
        getId: (row) => row.riderId,
        getLabel: (row) => row.riderName,
        getValue: (row) => (row.status === "DNF" ? 1 : 0),
        getHref: (row) => row.riderHref,
      }),
      manufacturerWins: createLeaderboard({
        rows: results,
        getId: (row) => row.manufacturerId,
        getLabel: (row) => row.manufacturerName,
        getValue: (row) => (row.position === 1 && row.status === "FINISHED" ? 1 : 0),
        getHref: (row) => row.manufacturerHref,
      }),
      manufacturerPodiums: createLeaderboard({
        rows: results,
        getId: (row) => row.manufacturerId,
        getLabel: (row) => row.manufacturerName,
        getValue: podiumValue,
        getHref: (row) => row.manufacturerHref,
      }),
      motorcycleWins: createLeaderboard({
        rows: results,
        getId: (row) => row.motorcycleId,
        getLabel: (row) => row.motorcycleName,
        getValue: (row) => (row.position === 1 && row.status === "FINISHED" ? 1 : 0),
        getHref: (row) => row.motorcycleHref,
      }),
      motorcyclePodiums: createLeaderboard({
        rows: results,
        getId: (row) => row.motorcycleId,
        getLabel: (row) => row.motorcycleName,
        getValue: podiumValue,
        getHref: (row) => row.motorcycleHref,
      }),
      countryWins: createLeaderboard({
        rows: results,
        getId: (row) => row.countryId,
        getLabel: (row) => row.countryName,
        getValue: (row) => (row.position === 1 && row.status === "FINISHED" ? 1 : 0),
        getHref: (row) => row.countryHref,
      }),
      teamWins: createLeaderboard({
        rows: results,
        getId: (row) => row.teamId,
        getLabel: (row) => row.teamName,
        getValue: (row) => (row.position === 1 && row.status === "FINISHED" ? 1 : 0),
        getHref: (row) => row.teamHref,
      }),
    },
  };
}

function calculateRiderStats(results: StatisticsResultInput[]) {
  const map = new Map<string, RiderStatisticPreview & { finishPositionSum: number }>();

  for (const result of results) {
    if (!result.riderId) {
      continue;
    }

    const current = map.get(result.riderId) ?? {
      riderId: result.riderId,
      riderName: result.riderName,
      href: result.riderHref,
      wins: 0,
      podiums: 0,
      starts: 0,
      dnfs: 0,
      finishRate: 0,
      averageFinishPosition: null,
      finishPositionSum: 0,
    };

    current.starts += 1;
    current.wins += result.position === 1 && result.status === "FINISHED" ? 1 : 0;
    current.podiums += podiumValue(result);
    current.dnfs += result.status === "DNF" ? 1 : 0;
    current.finishPositionSum +=
      result.status === "FINISHED" && result.position ? result.position : 0;
    const finishes = current.starts - current.dnfs;
    current.finishRate = current.starts > 0 ? finishes / current.starts : 0;
    current.averageFinishPosition =
      finishes > 0 ? Number((current.finishPositionSum / finishes).toFixed(2)) : null;

    map.set(result.riderId, current);
  }

  return Array.from(map.values())
    .map((row) => ({
      riderId: row.riderId,
      riderName: row.riderName,
      href: row.href,
      wins: row.wins,
      podiums: row.podiums,
      starts: row.starts,
      dnfs: row.dnfs,
      finishRate: row.finishRate,
      averageFinishPosition: row.averageFinishPosition,
    }))
    .sort(
      (a, b) =>
        b.wins - a.wins ||
        b.podiums - a.podiums ||
        a.riderName.localeCompare(b.riderName),
    );
}

function podiumValue(result: StatisticsResultInput) {
  return result.position !== null && result.position <= 3 && result.status === "FINISHED"
    ? 1
    : 0;
}
