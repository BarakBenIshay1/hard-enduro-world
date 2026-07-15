import {
  fetchErzbergrodeoOverallResultsPayload,
  getErzbergrodeoOverallResultsConfig,
  normalizeOverallResultRows,
  parseOverallResultsCsv,
} from "./official-erzbergrodeo-overall";
import { matchOverallResultProposals } from "./overall-matching";
import { persistOverallResultsReviewRun } from "./overall-persistence";
import {
  overallResultsConnectorKey,
  type OverallResultsImportReport,
} from "./overall-types";

export async function runOverallResultsImport({
  persistReview = process.env.RESULTS_IMPORT_PERSIST_REVIEW === "true",
}: {
  persistReview?: boolean;
} = {}): Promise<OverallResultsImportReport> {
  const config = getErzbergrodeoOverallResultsConfig();
  const fetchResult = await fetchErzbergrodeoOverallResultsPayload(config);
  const parsedRows = parseOverallResultsCsv(fetchResult.rawContent);
  const normalized = normalizeOverallResultRows({ rows: parsedRows, config });
  const matched = await matchOverallResultProposals(normalized);

  if (!persistReview) {
    return {
      summary: {
        connectorKey: overallResultsConnectorKey,
        sourceId: config.sourceId,
        eventSlug: config.eventSlug,
        seasonYear: config.seasonYear,
        inputType: fetchResult.inputType,
        totalRows: parsedRows.length,
        normalizedRows: normalized.length,
        newResults: matched.filter((row) => row.reviewAction === "NEW_RESULT").length,
        changedResults: matched.filter((row) => row.reviewAction === "UPDATE_RESULT")
          .length,
        unchangedResults: matched.filter((row) => row.reviewAction === "UNCHANGED")
          .length,
        blockedRows: matched.filter((row) => !row.applyEligible).length,
        warnings: matched.reduce(
          (total, row) => total + row.validationWarnings.length,
          0,
        ),
        resultRowsWritten: 0,
      },
      snapshot: {
        connectorSnapshotId: null,
        sourceSnapshotId: null,
        importRunId: null,
        checksum: "not-persisted",
        status: "not-persisted",
        duplicateDetected: false,
      },
      review: {
        created: 0,
        reused: 0,
        superseded: 0,
        pendingTotal: 0,
      },
      rows: matched,
    };
  }

  return persistOverallResultsReviewRun({
    config: { ...config, inputType: fetchResult.inputType },
    rawContent: fetchResult.rawContent,
    contentType: fetchResult.contentType,
    statusCode: fetchResult.statusCode,
    finalUrl: fetchResult.finalUrl,
    fetchedAt: fetchResult.fetchedAt,
    rows: matched,
  });
}
