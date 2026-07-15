import {
  fetchErzbergrodeoStageResultsPayload,
  getErzbergrodeoStageResultsConfig,
  normalizeStageResultRows,
  parseStageResultsCsv,
} from "./official-erzbergrodeo-stage";
import {
  appendMissingSourceStageResultWarnings,
  matchStageResultProposals,
} from "./stage-matching";
import { persistStageResultsReviewRun } from "./stage-persistence";
import { stageResultsConnectorKey, type StageResultsImportReport } from "./stage-types";

export async function runStageResultsImport({
  persistReview = process.env.STAGE_RESULTS_IMPORT_PERSIST_REVIEW === "true",
}: {
  persistReview?: boolean;
} = {}): Promise<StageResultsImportReport> {
  const config = getErzbergrodeoStageResultsConfig();
  const fetchResult = await fetchErzbergrodeoStageResultsPayload(config);
  const parsedRows = parseStageResultsCsv(fetchResult.rawContent);
  const normalized = normalizeStageResultRows({ rows: parsedRows, config });
  const matched = await appendMissingSourceStageResultWarnings({
    rows: await matchStageResultProposals(normalized),
    config,
  });

  if (!persistReview) {
    return {
      summary: {
        connectorKey: stageResultsConnectorKey,
        sourceId: config.sourceId,
        eventSlug: config.eventSlug,
        seasonYear: config.seasonYear,
        inputType: fetchResult.inputType,
        totalRows: parsedRows.length,
        normalizedRows: normalized.length,
        newStageResults: matched.filter((row) => row.reviewAction === "NEW_STAGE_RESULT")
          .length,
        changedStageResults: matched.filter(
          (row) => row.reviewAction === "UPDATE_STAGE_RESULT",
        ).length,
        unchangedStageResults: matched.filter((row) => row.reviewAction === "UNCHANGED")
          .length,
        missingSourceWarnings: matched.filter(
          (row) => row.reviewAction === "STAGE_RESULT_MISSING_SOURCE",
        ).length,
        blockedRows: matched.filter((row) => !row.applyEligible).length,
        warnings: matched.reduce(
          (total, row) => total + row.validationWarnings.length,
          0,
        ),
        stageResultRowsWritten: 0,
        overallResultRowsWritten: 0,
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

  return persistStageResultsReviewRun({
    config: { ...config, inputType: fetchResult.inputType },
    rawContent: fetchResult.rawContent,
    contentType: fetchResult.contentType,
    statusCode: fetchResult.statusCode,
    finalUrl: fetchResult.finalUrl,
    fetchedAt: fetchResult.fetchedAt,
    rows: matched,
  });
}
