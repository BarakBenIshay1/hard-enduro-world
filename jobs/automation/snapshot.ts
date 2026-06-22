import type { AutomationSnapshot } from "@/jobs/automation/types";

export function createSnapshotPlaceholder(sourceUrl: string): AutomationSnapshot {
  return {
    sourceUrl,
    contentHash: "placeholder-no-fetch",
    rawContent: "Network fetching is intentionally disabled in Step 16.",
    fetchedAt: new Date(),
  };
}
