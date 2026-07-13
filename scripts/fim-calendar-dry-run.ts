import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getFimCalendarCurrentEvents } from "@/db/fim-calendar";
import {
  fetchFimCalendarOfficialSource,
  getFimCalendarConfig,
  normalizeFimCalendarItems,
  parseFimCalendarItems,
  parseFimCalendarPayload,
  runFimCalendarDryRun,
  type FimCalendarDryRunInput,
  type FimCalendarDryRunReport,
} from "@/jobs/connectors/fim-calendar";
import {
  createFailedPersistenceResult,
  createNoPersistenceResult,
  createPrismaFimCalendarPersistenceRepository,
  persistFimCalendarReviewRun,
  type FimCalendarPersistenceResult,
} from "@/jobs/connectors/fim-calendar/persistence";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const defaultSamplePath = path.join(
  projectRoot,
  "jobs/connectors/fim-calendar/sample-2026-calendar.json",
);

async function main() {
  const startedAt = new Date();
  const seasonYear = Number(
    process.env.FIM_CALENDAR_SEASON ?? process.env.FIM_CALENDAR_SEASON_YEAR ?? 2026,
  );
  const coverageMode =
    process.env.FIM_CALENDAR_COVERAGE_MODE === "full-season" ||
    process.env.FIM_CALENDAR_COVERAGE_MODE === "partial-season" ||
    process.env.FIM_CALENDAR_COVERAGE_MODE === "single-event"
      ? process.env.FIM_CALENDAR_COVERAGE_MODE
      : undefined;
  const explicitInputPath = process.env.FIM_CALENDAR_INPUT_PATH
    ? path.resolve(process.env.FIM_CALENDAR_INPUT_PATH)
    : null;
  const configuredOfficialUrl =
    process.env.FIM_CALENDAR_OFFICIAL_URL ?? process.env.FIM_CALENDAR_URL ?? null;
  const sourceConfig = getFimCalendarConfig({ seasonYear }).config;
  const officialUrl = configuredOfficialUrl ?? sourceConfig?.sourceUrl ?? null;
  const input = await resolveDryRunInput({
    explicitInputPath,
    officialUrl,
    coverageMode,
    seasonYear,
  });
  const currentEvents = await getCurrentEventsSafely(seasonYear);
  const report = await runFimCalendarDryRun({
    rawContent: input.rawContent,
    currentEvents,
    seasonYear,
    coverageMode: input.coverageMode,
    inputSourceType: input.inputSourceType,
    inputWarnings: input.inputWarnings,
    inputDiagnostics: input.inputDiagnostics,
    selectedEventSlug: process.env.FIM_CALENDAR_EVENT_SLUG ?? null,
  });
  const persistence = await maybePersistReviewRun({
    requested: process.env.FIM_CALENDAR_PERSIST_REVIEW === "true",
    report,
    rawContent: input.rawContent,
    startedAt,
  });

  printReport(report, input.inputLabel, persistence);

  if (
    report.metadata.inputSourceType === "official-fetch" &&
    report.metadata.diagnostics.usableEventsParsed === 0
  ) {
    process.exitCode = 1;
  }
  if (persistence.requested && !persistence.performed) {
    process.exitCode = 1;
  }
}

async function maybePersistReviewRun({
  requested,
  report,
  rawContent,
  startedAt,
}: {
  requested: boolean;
  report: FimCalendarDryRunReport;
  rawContent: string | null;
  startedAt: Date;
}): Promise<FimCalendarPersistenceResult> {
  if (!requested) return createNoPersistenceResult(false);

  try {
    const config = getFimCalendarConfig({ seasonYear: report.summary.seasonYear }).config;
    if (!config) {
      throw new Error("FIM calendar config unavailable for persistence.");
    }
    const parsedPayload = rawContent ? parseFimCalendarPayload(rawContent) : null;
    const parsedItems = parseFimCalendarItems(parsedPayload?.items ?? []);
    const normalizedCandidates = normalizeFimCalendarItems(parsedItems, config).filter(
      (candidate) => candidate.seasonYear === report.summary.seasonYear,
    );

    return await persistFimCalendarReviewRun({
      repository: createPrismaFimCalendarPersistenceRepository(),
      input: {
        report,
        normalizedCandidates,
        startedAt,
        finishedAt: new Date(),
        environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "local",
        gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
        connectorVersion: config.source.connectorVersion,
      },
    });
  } catch (error) {
    return createFailedPersistenceResult(
      error instanceof Error ? error.message : "Unknown persistence error.",
    );
  }
}

async function resolveDryRunInput({
  explicitInputPath,
  officialUrl,
  coverageMode,
  seasonYear,
}: {
  explicitInputPath: string | null;
  officialUrl: string | null;
  coverageMode: FimCalendarDryRunInput["coverageMode"];
  seasonYear: number;
}): Promise<{
  rawContent: string | null;
  coverageMode: FimCalendarDryRunInput["coverageMode"];
  inputSourceType: FimCalendarDryRunInput["inputSourceType"];
  inputWarnings: string[];
  inputDiagnostics: FimCalendarDryRunInput["inputDiagnostics"];
  inputLabel: string;
}> {
  if (explicitInputPath) {
    return {
      rawContent: await readFile(explicitInputPath, "utf8"),
      coverageMode,
      inputSourceType: undefined,
      inputWarnings: [],
      inputDiagnostics: {
        fallbackUsed: false,
        fetchStatus: "local-input",
      },
      inputLabel: explicitInputPath,
    };
  }

  if (officialUrl) {
    const fetchResult = await fetchFimCalendarOfficialSource({
      url: officialUrl,
      seasonYear,
      timeoutMs: Number(process.env.FIM_CALENDAR_FETCH_TIMEOUT_MS ?? 8_000),
      retries: Number(process.env.FIM_CALENDAR_FETCH_RETRIES ?? 2),
    });

    if (fetchResult.ok) {
      return {
        rawContent: fetchResult.rawContent,
        coverageMode: coverageMode ?? "full-season",
        inputSourceType: "official-fetch",
        inputWarnings: [
          `Official fetch completed from ${fetchResult.url} with HTTP ${fetchResult.status} in ${fetchResult.elapsedMs}ms after ${fetchResult.attempts} attempt(s).`,
          fetchResult.endpointDiscovered
            ? `Official calendar endpoint discovered: ${fetchResult.endpointUrl}.`
            : "No separate calendar endpoint was discovered; parsing the fetched source response directly.",
        ],
        inputDiagnostics: {
          requestedOfficialUrl: fetchResult.requestedUrl,
          finalResponseUrl: fetchResult.url,
          httpStatus: fetchResult.status,
          contentType: fetchResult.contentType,
          responseSizeBytes: fetchResult.responseSizeBytes,
          fallbackUsed: false,
          fetchStatus: "official-fetch-success",
        },
        inputLabel: `${fetchResult.url} (official fetch)`,
      };
    }

    return {
      rawContent: await readFile(defaultSamplePath, "utf8"),
      coverageMode: coverageMode ?? "partial-season",
      inputSourceType: undefined,
      inputWarnings: [
        `Official fetch failed for ${fetchResult.url}: ${fetchResult.errorMessage}`,
        "Falling back to local partial-season sample input. No database writes were performed.",
      ],
      inputDiagnostics: {
        requestedOfficialUrl: fetchResult.requestedUrl,
        finalResponseUrl: fetchResult.url,
        httpStatus: fetchResult.status,
        contentType: fetchResult.contentType,
        fallbackUsed: true,
        fetchStatus: "fallback-local-json",
      },
      inputLabel: `${defaultSamplePath} (fallback after official fetch failure)`,
    };
  }

  return {
    rawContent: await readFile(defaultSamplePath, "utf8"),
    coverageMode: coverageMode ?? "partial-season",
    inputSourceType: undefined,
    inputWarnings: [
      "No official calendar URL is configured. Using local partial-season sample input.",
    ],
    inputDiagnostics: {
      fallbackUsed: true,
      fetchStatus: "fallback-local-json",
    },
    inputLabel: `${defaultSamplePath} (local fallback)`,
  };
}

async function getCurrentEventsSafely(seasonYear: number) {
  try {
    return await getFimCalendarCurrentEvents(seasonYear);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    console.warn(
      `\nDatabase read warning: ${message}\nContinuing dry-run with an empty current-event list.\n`,
    );
    return [];
  }
}

function printReport(
  report: FimCalendarDryRunReport,
  inputLabel: string,
  persistence: FimCalendarPersistenceResult,
) {
  const { summary } = report;

  console.log("\nFIM Calendar Dry Run Report");
  console.log("===========================");
  console.log(`Source: ${report.source.displayName} (${summary.sourceId})`);
  console.log(`Run mode: ${summary.runMode}`);
  console.log(`Season: ${summary.seasonYear}`);
  console.log(`Input: ${inputLabel}`);
  console.log(`Coverage mode: ${report.metadata.inputCoverageMode}`);
  console.log(`Input source type: ${report.metadata.inputSourceType}`);
  console.log(`Fetch status: ${report.metadata.diagnostics.fetchStatus}`);
  console.log(
    `Fallback used: ${report.metadata.diagnostics.fallbackUsed ? "yes" : "no"}`,
  );
  if (report.metadata.inputCompletenessWarning) {
    console.log(`Completeness: ${report.metadata.inputCompletenessWarning}`);
  }
  console.log("");
  console.log("Input Diagnostics");
  console.log("-----------------");
  console.log(
    `Requested official URL: ${report.metadata.diagnostics.requestedOfficialUrl ?? "none"}`,
  );
  console.log(
    `Final response URL: ${report.metadata.diagnostics.finalResponseUrl ?? "none"}`,
  );
  console.log(`HTTP status: ${report.metadata.diagnostics.httpStatus ?? "none"}`);
  console.log(`Content type: ${report.metadata.diagnostics.contentType ?? "none"}`);
  console.log(
    `Response size: ${report.metadata.diagnostics.responseSizeBytes ?? "unknown"} bytes`,
  );
  console.log(`Parser selected: ${report.metadata.diagnostics.parserSelected}`);
  console.log(`Raw records detected: ${report.metadata.diagnostics.rawRecordsDetected}`);
  console.log(`Usable events parsed: ${report.metadata.diagnostics.usableEventsParsed}`);
  console.log(`Records rejected: ${report.metadata.diagnostics.recordsRejected}`);
  if (report.metadata.diagnostics.rejectionReasons.length > 0) {
    console.log("Rejection reasons:");
    report.metadata.diagnostics.rejectionReasons.forEach((reason) =>
      console.log(`- ${reason}`),
    );
  }
  console.log("");
  console.log("Summary");
  console.log("-------");
  console.log(`Total source events: ${summary.totalSourceEvents}`);
  console.log(`Matched events: ${summary.totalMatchedEvents}`);
  console.log(`New candidates: ${summary.newCandidates}`);
  console.log(`Changed candidates: ${summary.changedCandidates}`);
  console.log(`Ambiguous candidates: ${summary.ambiguousCandidates}`);
  console.log(`Warnings: ${summary.warnings.length}`);
  console.log(`Errors: ${summary.errors.length}`);

  if (summary.warnings.length > 0) {
    console.log("\nWarnings");
    console.log("--------");
    summary.warnings.forEach((warning) => console.log(`- ${warning}`));
  }

  if (summary.errors.length > 0) {
    console.log("\nErrors");
    console.log("------");
    summary.errors.forEach((error) => console.log(`- ${error}`));
  }

  console.log("\nRows");
  console.log("----");
  if (report.rows.length === 0) {
    console.log("No rows generated.");
  } else {
    report.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.eventName}`);
      console.log(`   Change: ${row.changeType}`);
      console.log(`   Severity: ${row.severity}`);
      console.log(`   Confidence: ${row.confidence.score} (${row.confidence.level})`);
      console.log(
        `   Match: ${row.matchingStrategy} (${row.matchingConfidence})${
          row.ambiguousReason ? ` - ${row.ambiguousReason}` : ""
        }`,
      );
      console.log(`   Source URL: ${row.sourceUrl ?? "none"}`);
      console.log(`   Recommendation: ${row.reviewRecommendation}`);
      console.log(
        `   Current: ${row.currentValue ? JSON.stringify(row.currentValue) : "none"}`,
      );
      console.log(
        `   Proposed: ${row.proposedValue ? JSON.stringify(row.proposedValue) : "none"}`,
      );
    });
  }

  console.log("\nReview Recommendations");
  console.log("----------------------");
  if (report.reviewItems.length === 0) {
    console.log("No review-required rows.");
  } else {
    report.reviewItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item.eventName}: ${item.recommendation}`);
    });
  }

  console.log("\nPersistence");
  console.log("-----------");
  console.log(`Persistence requested: ${persistence.requested ? "yes" : "no"}`);
  console.log(`Persistence performed: ${persistence.performed ? "yes" : "no"}`);
  console.log(`Snapshot status: ${persistence.snapshotStatus}`);
  console.log(`Snapshot ID: ${persistence.snapshotId ?? "none"}`);
  console.log(`Snapshot checksum: ${persistence.snapshotChecksum ?? "none"}`);
  console.log(`Snapshot created: ${persistence.snapshotCreated ? "yes" : "no"}`);
  console.log(`Snapshot reused: ${persistence.snapshotReused ? "yes" : "no"}`);
  console.log(
    `Duplicate snapshot detected: ${persistence.duplicateSnapshotDetected ? "yes" : "no"}`,
  );
  console.log(`Review items created: ${persistence.reviewItemsCreated.length}`);
  console.log(`Review items reused: ${persistence.reviewItemsReused.length}`);
  console.log(`Review items superseded: ${persistence.reviewItemsSuperseded.length}`);
  console.log(`Total pending review items: ${persistence.totalPendingReviewItems}`);
  console.log(`Public events updated: ${persistence.publicEventsUpdated}`);
  if (persistence.errorMessage) {
    console.log(`Persistence error: ${persistence.errorMessage}`);
  }

  const reviewItems = [
    ...persistence.reviewItemsCreated,
    ...persistence.reviewItemsReused,
    ...persistence.reviewItemsSuperseded,
  ];
  if (reviewItems.length > 0) {
    console.log("\nPersisted Review Items");
    console.log("----------------------");
    reviewItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item.eventName}`);
      console.log(`   ID: ${item.id}`);
      console.log(`   Suggested action: ${item.suggestedAction}`);
      console.log(`   Status: ${item.reviewStatus}`);
      console.log(`   Confidence: ${JSON.stringify(item.confidence)}`);
      console.log(`   Matching strategy: ${item.matchingStrategy ?? "none"}`);
      console.log(`   Changed fields: ${item.changedFields.join(", ") || "none"}`);
      console.log(`   Current: ${JSON.stringify(item.currentValues ?? null)}`);
      console.log(`   Proposed: ${JSON.stringify(item.proposedValues ?? null)}`);
      console.log(`   Recommendation: ${item.recommendation ?? "none"}`);
    });
  }

  console.log(
    "\nDry-run complete. No public Event rows were inserted, updated, deleted, or published.\n",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
