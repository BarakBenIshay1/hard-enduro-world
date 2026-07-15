import { runOverallResultsImport } from "@/jobs/connectors/results/overall-import";

async function main() {
  const report = await runOverallResultsImport();

  console.log("Overall Results Import");
  console.log("======================");
  console.log(`Connector: ${report.summary.connectorKey}`);
  console.log(`Source: ${report.summary.sourceId}`);
  console.log(`Event: ${report.summary.eventSlug}`);
  console.log(`Season: ${report.summary.seasonYear}`);
  console.log(`Input type: ${report.summary.inputType}`);
  console.log(`Rows parsed: ${report.summary.totalRows}`);
  console.log(`New result proposals: ${report.summary.newResults}`);
  console.log(`Changed result proposals: ${report.summary.changedResults}`);
  console.log(`Unchanged results: ${report.summary.unchangedResults}`);
  console.log(`Blocked rows: ${report.summary.blockedRows}`);
  console.log(`Result rows written: ${report.summary.resultRowsWritten}`);
  console.log("");
  console.log("Persistence");
  console.log("-----------");
  console.log(`Snapshot status: ${report.snapshot.status}`);
  console.log(`Connector snapshot ID: ${report.snapshot.connectorSnapshotId ?? "none"}`);
  console.log(`Source snapshot ID: ${report.snapshot.sourceSnapshotId ?? "none"}`);
  console.log(`Import run ID: ${report.snapshot.importRunId ?? "none"}`);
  console.log(`Duplicate detected: ${report.snapshot.duplicateDetected ? "yes" : "no"}`);
  console.log(`Review items created: ${report.review.created}`);
  console.log(`Review items reused: ${report.review.reused}`);
  console.log(`Review items superseded: ${report.review.superseded}`);
  console.log(`Pending review items: ${report.review.pendingTotal}`);
  console.log("");
  console.log("Rows");
  console.log("----");
  for (const row of report.rows) {
    console.log(
      `${row.position ?? "-"} ${row.riderName ?? row.riderSlug ?? "Unknown rider"} - ${row.reviewAction} (${row.applyEligible ? "eligible" : "blocked"})`,
    );
    if (row.validationWarnings.length) {
      console.log(`  ${row.validationWarnings.join(" ")}`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Results import failed.");
  process.exitCode = 1;
});
