import { createDiffPreviewPlaceholder } from "@/jobs/automation/diff";
import type { ReviewQueueItem } from "@/jobs/automation/types";
import { getResultsConnectorConfig } from "@/jobs/connectors/results/config";
import { fetchOfficialResultsDemo } from "@/jobs/connectors/results/mock-fetcher";
import { normalizeOfficialResult } from "@/jobs/connectors/results/normalizer";
import { parseOfficialResultsPlaceholder } from "@/jobs/connectors/results/parser";
import type { ResultsImportPreview } from "@/jobs/connectors/results/types";

export async function previewOfficialResultsImport(): Promise<ResultsImportPreview> {
  const config = getResultsConnectorConfig();
  const rawResults = await fetchOfficialResultsDemo();
  const parsedResults = parseOfficialResultsPlaceholder(rawResults);
  const normalizedResults = parsedResults.map(normalizeOfficialResult);
  const diffs = normalizedResults.map((result) =>
    createDiffPreviewPlaceholder({
      entityType: "RESULT",
      entityId: result.existingResultId ?? undefined,
      sourceUrl: result.officialSourceUrl,
      payload: {
        externalId: result.externalId,
        event: result.event,
        stage: result.stage,
        rider: result.rider,
        country: result.country,
        team: result.team,
        manufacturer: result.manufacturer,
        motorcycle: result.motorcycle,
        position: result.position,
        time: result.time,
        gapToLeader: result.gapToLeader,
        gapToPrevious: result.gapToPrevious,
        penalties: result.penalties,
        points: result.points,
        status: result.status,
        officialSourceUrl: result.officialSourceUrl,
        reviewRequired: config.reviewRequired,
        autoPublish: config.autoPublish,
      },
    }),
  );
  const reviewItems: ReviewQueueItem[] = diffs.map((diff, index) => ({
    id: `official-results-demo-${index + 1}`,
    jobId: "official-results",
    state: "pending-change",
    diff,
    validationIssues: [],
  }));

  return {
    sourceUrl: config.sourceUrl,
    rawResults,
    normalizedResults,
    diffs,
    reviewItems,
  };
}
