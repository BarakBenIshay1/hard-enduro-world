import type { AutomationDiff, ParsedAutomationRecord } from "@/jobs/automation/types";

export function createDiffPreviewPlaceholder(
  record: ParsedAutomationRecord,
): AutomationDiff {
  return {
    entityType: record.entityType,
    entityId: record.entityId,
    action: record.entityId ? "update" : "create",
    previous: null,
    next: record.payload,
    confidence: 0,
  };
}
