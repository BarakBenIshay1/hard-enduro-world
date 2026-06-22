import type { RawOfficialResult } from "@/jobs/connectors/results/types";

export function parseOfficialResultsPlaceholder(
  results: RawOfficialResult[],
): RawOfficialResult[] {
  return results.filter(
    (result) =>
      result.externalId &&
      result.event &&
      result.stage &&
      result.rider &&
      result.country &&
      result.officialSourceUrl,
  );
}
