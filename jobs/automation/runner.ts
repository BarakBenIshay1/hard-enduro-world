import { createDiffPreviewPlaceholder } from "@/jobs/automation/diff";
import { automationJobRegistry } from "@/jobs/automation/registry";
import { createSnapshotPlaceholder } from "@/jobs/automation/snapshot";
import type {
  AutomationRunContext,
  AutomationRunResult,
  ParsedAutomationRecord,
} from "@/jobs/automation/types";
import { validateParsedRecordPlaceholder } from "@/jobs/automation/validation";

export async function runAutomationJobPlaceholder(
  context: AutomationRunContext,
): Promise<AutomationRunResult> {
  const job = automationJobRegistry.find((item) => item.id === context.jobId);

  if (!job || !job.enabled) {
    return {
      jobId: context.jobId,
      status: "skipped",
      recordsFound: 0,
      diffs: [],
      reviewItems: [],
      message: "Job is disabled or not registered. No action was executed.",
    };
  }

  const snapshot = createSnapshotPlaceholder(`internal://${job.id}`);
  const parsedRecord: ParsedAutomationRecord = {
    entityType: "AUTOMATION_PLACEHOLDER",
    sourceUrl: snapshot.sourceUrl,
    payload: {
      jobId: job.id,
      dryRun: context.dryRun,
      message: "Placeholder parser output. No external source was fetched.",
    },
  };
  const validationIssues = validateParsedRecordPlaceholder(parsedRecord);
  const diff = createDiffPreviewPlaceholder(parsedRecord);

  return {
    jobId: job.id,
    status: job.reviewRequired ? "needs-review" : "completed",
    recordsFound: 1,
    diffs: [diff],
    reviewItems: job.reviewRequired
      ? [
          {
            id: `${job.id}-placeholder-review`,
            jobId: job.id,
            state: "pending-change",
            diff,
            validationIssues,
          },
        ]
      : [],
    message: "Placeholder run completed without fetching or mutating external data.",
  };
}
