export type CalculationResultInput = {
  id: string;
  seasonId: string;
  eventId: string;
  riderId: string | null;
  riderName: string;
  position: number | null;
  points: number | null;
  status: "FINISHED" | "DNF" | "DNS" | "DSQ" | "UNKNOWN";
};

export type CalculationValidationIssue = {
  severity: "info" | "warning" | "error";
  code:
    | "duplicate-rider-result"
    | "duplicate-event-result"
    | "missing-points"
    | "invalid-position"
    | "missing-rider";
  message: string;
};

export function validateCalculationInputs(
  results: CalculationResultInput[],
): CalculationValidationIssue[] {
  const issues: CalculationValidationIssue[] = [];
  const riderEventKeys = new Set<string>();
  const positionEventKeys = new Set<string>();

  for (const result of results) {
    if (!result.riderId) {
      issues.push({
        severity: "error",
        code: "missing-rider",
        message: `${result.riderName} is missing a rider id.`,
      });
    }

    if (result.status === "FINISHED" && result.points === null) {
      issues.push({
        severity: "warning",
        code: "missing-points",
        message: `${result.riderName} has a finished result without points.`,
      });
    }

    if (
      result.status === "FINISHED" &&
      (result.position === null || result.position < 1)
    ) {
      issues.push({
        severity: "error",
        code: "invalid-position",
        message: `${result.riderName} has an invalid finishing position.`,
      });
    }

    if (result.riderId) {
      const riderEventKey = `${result.eventId}:${result.riderId}`;

      if (riderEventKeys.has(riderEventKey)) {
        issues.push({
          severity: "error",
          code: "duplicate-rider-result",
          message: `${result.riderName} appears more than once in the same event.`,
        });
      }

      riderEventKeys.add(riderEventKey);
    }

    if (result.position !== null) {
      const positionEventKey = `${result.eventId}:${result.position}`;

      if (positionEventKeys.has(positionEventKey)) {
        issues.push({
          severity: "warning",
          code: "duplicate-event-result",
          message: `Position ${result.position} appears more than once in one event.`,
        });
      }

      positionEventKeys.add(positionEventKey);
    }
  }

  return issues;
}
