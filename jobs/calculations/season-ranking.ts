import { allocatePoints } from "@/jobs/calculations/points-system";
import type { CalculationResultInput } from "@/jobs/calculations/validation";

export type SeasonStandingPreview = {
  seasonId: string;
  riderId: string;
  riderName: string;
  className: string | null;
  proposedPosition: number | null;
  proposedPoints: number;
  wins: number;
  podiums: number;
  starts: number;
  dnfs: number;
};

export function calculateSeasonRankingPreview(
  results: CalculationResultInput[],
): SeasonStandingPreview[] {
  const rows = new Map<string, SeasonStandingPreview>();

  for (const result of results) {
    if (!result.riderId) {
      continue;
    }

    const key = `${result.seasonId}:${result.riderId}:${result.className ?? "__NULL__"}`;
    const existing = rows.get(key) ?? {
      seasonId: result.seasonId,
      riderId: result.riderId,
      riderName: result.riderName,
      className: result.className,
      proposedPosition: 0,
      proposedPoints: 0,
      wins: 0,
      podiums: 0,
      starts: 0,
      dnfs: 0,
    };

    existing.starts += result.status === "DNS" ? 0 : 1;
    existing.dnfs += result.status === "DNF" ? 1 : 0;
    existing.wins += result.position === 1 && result.status === "FINISHED" ? 1 : 0;
    existing.podiums +=
      result.position !== null && result.position <= 3 && result.status === "FINISHED"
        ? 1
        : 0;
    existing.proposedPoints += allocatePoints(result.points, result.status);

    rows.set(key, existing);
  }

  const sorted = Array.from(rows.values()).sort(
    (a, b) =>
      a.seasonId.localeCompare(b.seasonId) ||
      (a.className ?? "").localeCompare(b.className ?? "") ||
      b.proposedPoints - a.proposedPoints ||
      b.wins - a.wins ||
      b.podiums - a.podiums ||
      a.riderName.localeCompare(b.riderName),
  );
  const scopeCounts = new Map<string, number>();
  return sorted.map((row) => {
    const scope = `${row.seasonId}:${row.className ?? "__NULL__"}`;
    const position = (scopeCounts.get(scope) ?? 0) + 1;
    scopeCounts.set(scope, position);
    return {
      ...row,
      proposedPosition: position,
    };
  });
}
