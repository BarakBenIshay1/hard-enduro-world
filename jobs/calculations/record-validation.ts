import type { StatisticsResultInput } from "@/jobs/calculations/statistics-engine";

export type RecordValidationIssue = {
  severity: "info" | "warning" | "error";
  code:
    | "missing-result-rows"
    | "duplicated-results"
    | "invalid-podium-calculation"
    | "missing-rider-link"
    | "missing-manufacturer-link"
    | "missing-motorcycle-link"
    | "inconsistent-dnf-dns-status";
  message: string;
};

export function validateStatisticsAndRecordsInputs(
  results: StatisticsResultInput[],
): RecordValidationIssue[] {
  const issues: RecordValidationIssue[] = [];
  const resultKeys = new Set<string>();

  if (results.length === 0) {
    issues.push({
      severity: "error",
      code: "missing-result-rows",
      message: "No result rows are available for statistics or records calculation.",
    });
  }

  for (const result of results) {
    const key = `${result.eventId}:${result.riderId ?? "missing-rider"}`;

    if (resultKeys.has(key)) {
      issues.push({
        severity: "error",
        code: "duplicated-results",
        message: `${result.riderName} appears more than once in the same event.`,
      });
    }

    resultKeys.add(key);

    if (
      result.position !== null &&
      result.position <= 3 &&
      result.status !== "FINISHED"
    ) {
      issues.push({
        severity: "warning",
        code: "invalid-podium-calculation",
        message: `${result.riderName} has a podium position with a non-finished status.`,
      });
    }

    if (!result.riderId) {
      issues.push({
        severity: "error",
        code: "missing-rider-link",
        message: `${result.riderName} is missing a rider link.`,
      });
    }

    if (!result.manufacturerId) {
      issues.push({
        severity: "warning",
        code: "missing-manufacturer-link",
        message: `${result.riderName} is missing a manufacturer link.`,
      });
    }

    if (!result.motorcycleId) {
      issues.push({
        severity: "warning",
        code: "missing-motorcycle-link",
        message: `${result.riderName} is missing a motorcycle link.`,
      });
    }

    if (
      (result.status === "DNF" || result.status === "DNS") &&
      result.position !== null
    ) {
      issues.push({
        severity: "warning",
        code: "inconsistent-dnf-dns-status",
        message: `${result.riderName} has ${result.status} status with a classified position.`,
      });
    }
  }

  return issues;
}
