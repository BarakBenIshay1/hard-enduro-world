import { getPointsSystem, type PointsSystemId } from "@/jobs/calculations/points-system";
import {
  calculateSeasonRankingPreview,
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
  pointsSystemId = "fim-style",
}: {
  results: CalculationResultInput[];
  currentStandings: CurrentStandingInput[];
  pointsSystemId?: PointsSystemId;
}): StandingsCalculationPreview {
  const pointsSystem = getPointsSystem(pointsSystemId);
  const validationIssues = validateCalculationInputs(results);
  const currentByRider = new Map(
    currentStandings.map((standing) => [
      `${standing.seasonId}:${standing.riderId}`,
      standing,
    ]),
  );
  const calculated = calculateSeasonRankingPreview(results, pointsSystem);
  const standings = calculated.map((row) => {
    const current = currentByRider.get(`${row.seasonId}:${row.riderId}`);

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
    pointsSystemId,
    validationIssues,
    standings,
  };
}
