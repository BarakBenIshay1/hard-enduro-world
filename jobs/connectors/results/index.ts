import { createDiffPreviewPlaceholder } from "@/jobs/automation/diff";
import type { ReviewQueueItem } from "@/jobs/automation/types";
import { getResultsConnectorConfig } from "@/jobs/connectors/results/config";
import { fetchOfficialResultsDemoResult } from "@/jobs/connectors/results/mock-fetcher";
import { normalizeOfficialResult } from "@/jobs/connectors/results/normalizer";
import { parseOfficialResultsPayload } from "@/jobs/connectors/results/parser";
import { fetchOfficialResultsSource } from "@/jobs/connectors/results/source-fetcher";
import type {
  NormalizedOfficialResult,
  ResultsImportPreview,
  ResultsSourceTrackingPreview,
} from "@/jobs/connectors/results/types";

export async function previewOfficialResultsImport(): Promise<ResultsImportPreview> {
  const config = getResultsConnectorConfig();
  const sourceResult = await fetchOfficialResultsSource(config);
  const fetchResult =
    sourceResult.connectorStatus === "missing-config"
      ? await fetchOfficialResultsDemoResult(config.sourceUrl)
      : sourceResult;
  const rawResults =
    fetchResult.results.length > 0
      ? fetchResult.results
      : parseOfficialResultsPayload({
          rawContent: fetchResult.rawContent,
          payloadType: fetchResult.payloadType,
          sourceUrl: config.sourceUrl,
        });
  const parsedResults = rawResults;
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
    id: `official-results-review-${index + 1}`,
    jobId: "official-results",
    state: "pending-change",
    diff,
    validationIssues: [],
  }));

  return {
    sourceUrl: config.sourceUrl,
    mode: fetchResult.mode,
    connectorStatus: fetchResult.connectorStatus,
    sourceStatus: fetchResult.sourceStatus,
    payloadType: fetchResult.payloadType,
    fetchedAt: fetchResult.fetchedAt,
    rawResults,
    normalizedResults,
    diffs,
    reviewItems,
    sourceTracking: buildSourceTrackingPreview({
      sourceUrl: config.sourceUrl,
      fetchedAt: fetchResult.fetchedAt,
      payloadType: fetchResult.payloadType,
      results: normalizedResults,
    }),
    errorMessage: fetchResult.errorMessage,
  };
}

function buildSourceTrackingPreview({
  sourceUrl,
  fetchedAt,
  payloadType,
  results,
}: {
  sourceUrl: string;
  fetchedAt: Date;
  payloadType: ResultsSourceTrackingPreview["sourceSnapshot"]["payloadType"];
  results: NormalizedOfficialResult[];
}): ResultsSourceTrackingPreview {
  return {
    dataSource: {
      name: "Official timing/results source",
      type: "TIMING_SYSTEM",
      url: sourceUrl,
    },
    sourceSnapshot: {
      url: sourceUrl,
      contentHash: `official-results-preview-${fetchedAt.toISOString()}-${results.length}`,
      fetchedAt: fetchedAt.toISOString(),
      payloadType,
      status: "preview",
    },
    importRun: {
      jobName: "official-results",
      status: "NEEDS_REVIEW",
      recordsFound: results.length,
      recordsCreated: results.filter((result) => !result.existingResultId).length,
      recordsUpdated: results.filter((result) => result.existingResultId).length,
    },
    sourceLinks: results.map((result) => ({
      entityType: "RESULT",
      entityId: result.externalId,
      url: result.officialSourceUrl,
    })),
    dataVersions: results.map((result) => ({
      entityType: "RESULT",
      entityId: result.externalId,
      action: "IMPORT",
      status: "preview",
    })),
  };
}
