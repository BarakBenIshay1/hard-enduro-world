import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getFimCalendarCurrentEvents } from "@/db/fim-calendar";
import {
  runFimCalendarDryRun,
  type FimCalendarDryRunReport,
} from "@/jobs/connectors/fim-calendar";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const defaultSamplePath = path.join(
  projectRoot,
  "jobs/connectors/fim-calendar/sample-2026-calendar.json",
);

async function main() {
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
  const inputPath =
    explicitInputPath ?? (configuredOfficialUrl ? null : defaultSamplePath);
  const rawContent = inputPath ? await readFile(inputPath, "utf8") : null;
  const currentEvents = await getCurrentEventsSafely(seasonYear);
  const report = await runFimCalendarDryRun({
    rawContent,
    currentEvents,
    seasonYear,
    coverageMode,
    inputSourceType: inputPath ? undefined : "configured-url-fetch-disabled",
    selectedEventSlug: process.env.FIM_CALENDAR_EVENT_SLUG ?? null,
  });

  printReport(report, inputPath, configuredOfficialUrl);
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
  inputPath: string | null,
  configuredOfficialUrl: string | null,
) {
  const { summary } = report;

  console.log("\nFIM Calendar Dry Run Report");
  console.log("===========================");
  console.log(`Source: ${report.source.displayName} (${summary.sourceId})`);
  console.log(`Run mode: ${summary.runMode}`);
  console.log(`Season: ${summary.seasonYear}`);
  console.log(
    `Input: ${
      inputPath ??
      `fetch disabled for configured official URL ${configuredOfficialUrl ?? "none"}`
    }`,
  );
  console.log(`Coverage mode: ${report.metadata.inputCoverageMode}`);
  console.log(`Input source type: ${report.metadata.inputSourceType}`);
  if (report.metadata.inputCompletenessWarning) {
    console.log(`Completeness: ${report.metadata.inputCompletenessWarning}`);
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

  console.log("\nDry-run complete. No database writes were performed.\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
