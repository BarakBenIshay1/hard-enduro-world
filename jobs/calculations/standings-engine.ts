import { getPointsSystem, type PointsSystemId } from "@/jobs/calculations/points-system";
import {
  calculateSeasonRankingPreview,
  type TieBreakRulesByScope,
  type SeasonStandingPreview,
} from "@/jobs/calculations/season-ranking";
import {
  validateCalculationInputs,
  type CalculationResultInput,
  type CalculationValidationIssue,
} from "@/jobs/calculations/validation";

export type CurrentStandingInput = {
  seasonId: string;
  riderId: string;
  className: string | null;
  currentPosition: number | null;
  currentPoints: number;
};

export type StandingsComparisonPreview = SeasonStandingPreview & {
  currentPosition: number | null;
  currentPoints: number;
  pointsDifference: number;
  positionDifference: number | null;
};

export type StandingsCalculationPreview = {
  pointsSystemId: PointsSystemId;
  validationIssues: CalculationValidationIssue[];
  standings: StandingsComparisonPreview[];
};

export function previewStandingsCalculation({
  results,
  currentStandings,
  pointsSystemId = "source-result-points",
  tieBreakRulesByScope,
}: {
  results: CalculationResultInput[];
  currentStandings: CurrentStandingInput[];
  pointsSystemId?: PointsSystemId;
  tieBreakRulesByScope?: TieBreakRulesByScope;
}): StandingsCalculationPreview {
  const pointsSystem = getPointsSystem(pointsSystemId);
  const validationIssues = validateCalculationInputs(results);
  const currentByRider = new Map(
    currentStandings.map((standing) => [
      `${standing.seasonId}:${standing.riderId}:${standing.className ?? "__NULL__"}`,
      standing,
    ]),
  );
  const calculated = calculateSeasonRankingPreview(results, tieBreakRulesByScope ?? {});
  validationIssues.push(...findUnresolvedTies(calculated));
  const standings = calculated.map((row) => {
    const current = currentByRider.get(
      `${row.seasonId}:${row.riderId}:${row.className ?? "__NULL__"}`,
    );

    return {
      ...row,
      currentPosition: current?.currentPosition ?? null,
      currentPoints: current?.currentPoints ?? 0,
      pointsDifference: row.proposedPoints - (current?.currentPoints ?? 0),
      positionDifference:
        current?.currentPosition && row.proposedPosition
          ? current.currentPosition - row.proposedPosition
          : null,
    };
  });

  return {
    pointsSystemId: pointsSystem.id,
    validationIssues,
    standings,
  };
}

function findUnresolvedTies(
  standings: Array<{
    seasonId: string;
    className: string | null;
    proposedPoints: number;
    riderName: string;
    tieBreakResolved: boolean;
  }>,
): CalculationValidationIssue[] {
  const byScopeAndPoints = new Map<string, string[]>();
  for (const standing of standings) {
    const key = `${standing.seasonId}:${standing.className ?? "__NULL__"}:${standing.proposedPoints}`;
    const riders = byScopeAndPoints.get(key) ?? [];
    if (!standing.tieBreakResolved) riders.push(standing.riderName);
    byScopeAndPoints.set(key, riders);
  }

  return Array.from(byScopeAndPoints.entries())
    .filter(([, riders]) => riders.length > 1)
    .map(([key, riders]) => {
      const [, className, points] = key.split(":");
      return {
        severity: "error" as const,
        code: "unresolved-tie" as const,
        message: `Official tie-break rules are not configured for ${riders.join(", ")} with ${points} points in class ${className === "__NULL__" ? "Overall" : className}.`,
      };
    });
}
