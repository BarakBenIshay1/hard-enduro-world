import type {
  AutomationValidationIssue,
  ParsedAutomationRecord,
} from "@/jobs/automation/types";

export function validateParsedRecordPlaceholder(
  record: ParsedAutomationRecord,
): AutomationValidationIssue[] {
  const issues: AutomationValidationIssue[] = [];

  if (!record.entityType) {
    issues.push({
      field: "entityType",
      message: "Entity type is required before a record can enter review.",
      severity: "error",
    });
  }

  return issues;
}
