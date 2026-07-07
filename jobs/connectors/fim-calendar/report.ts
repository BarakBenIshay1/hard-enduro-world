import type {
  FimCalendarConfig,
  FimCalendarDryRunReport,
  FimCalendarReportRow,
  FimCalendarReviewItem,
} from "./types";

export function buildFimCalendarDryRunReport({
  config,
  rows,
  warnings,
  errors,
}: {
  config: FimCalendarConfig;
  rows: FimCalendarReportRow[];
  warnings: string[];
  errors: string[];
}): FimCalendarDryRunReport {
  const reviewRows = rows.filter((row) => row.severity === "review-required");

  return {
    summary: {
      sourceId: config.sourceId,
      runMode: "dry-run",
      seasonYear: config.seasonYear,
      totalSourceEvents: rows.filter((row) => row.changeType !== "missing-from-source")
        .length,
      totalMatchedEvents: rows.filter(
        (row) =>
          row.changeType === "existing-event-unchanged" ||
          row.changeType.endsWith("-changed"),
      ).length,
      newCandidates: rows.filter((row) => row.changeType === "new-event-found").length,
      changedCandidates: rows.filter((row) => row.changeType.endsWith("-changed")).length,
      ambiguousCandidates: rows.filter(
        (row) => row.changeType === "ambiguous-match-requires-review",
      ).length,
      warnings,
      errors,
    },
    rows,
    reviewItems: reviewRows.map((row, index): FimCalendarReviewItem => {
      return {
        id: `fim-calendar-review-${index + 1}`,
        changeType: row.changeType,
        eventName: row.eventName,
        sourceId: config.sourceId,
        priority: config.source.priority,
        confidence: row.confidence,
        recommendation: row.reviewRecommendation,
        payload: row,
      };
    }),
    source: {
      id: config.source.id,
      displayName: config.source.displayName,
      priority: config.source.priority,
      confidenceLevel: config.source.confidenceLevel,
      reviewPolicy: config.source.reviewPolicy,
      sourceUrl: config.sourceUrl,
    },
  };
}
