export type AutomationSourceType =
  | "official-website"
  | "timing-system"
  | "youtube"
  | "weather"
  | "internal";

export type AutomationFrequency =
  | "hourly"
  | "daily"
  | "weekly"
  | "after-event"
  | "manual";

export type AutomationRiskLevel = "low" | "medium" | "high";

export type AutomationJobStatus = "active" | "paused" | "failed" | "disabled";

export type AutomationJobDefinition = {
  id: string;
  name: string;
  description: string;
  sourceType: AutomationSourceType;
  frequency: AutomationFrequency;
  riskLevel: AutomationRiskLevel;
  reviewRequired: boolean;
  enabled: boolean;
};

export type AutomationRunContext = {
  jobId: string;
  dryRun: boolean;
  requestedBy: "system" | "admin";
};

export type AutomationSnapshot = {
  sourceUrl: string;
  contentHash: string;
  rawContent: string;
  fetchedAt: Date;
};

export type ParsedAutomationRecord = {
  entityType: string;
  entityId?: string;
  sourceUrl?: string;
  payload: Record<string, unknown>;
};

export type AutomationValidationIssue = {
  field: string;
  message: string;
  severity: "info" | "warning" | "error";
};

export type AutomationDiff = {
  entityType: string;
  entityId?: string;
  action: "create" | "update" | "delete" | "noop";
  previous: Record<string, unknown> | null;
  next: Record<string, unknown> | null;
  confidence: number;
};

export type ReviewState =
  | "pending-change"
  | "approved-change"
  | "rejected-change"
  | "failed-import";

export type ReviewQueueItem = {
  id: string;
  jobId: string;
  state: ReviewState;
  diff: AutomationDiff;
  validationIssues: AutomationValidationIssue[];
};

export type AutomationRunResult = {
  jobId: string;
  status: "completed" | "needs-review" | "failed" | "skipped";
  recordsFound: number;
  diffs: AutomationDiff[];
  reviewItems: ReviewQueueItem[];
  message: string;
};
