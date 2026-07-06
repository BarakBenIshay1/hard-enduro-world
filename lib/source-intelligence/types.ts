export type SourceEntityType =
  | "rider"
  | "team"
  | "manufacturer"
  | "motorcycle"
  | "event"
  | "stage"
  | "result"
  | "season"
  | "standings"
  | "video"
  | "media"
  | "document"
  | "course-map"
  | "history"
  | "history-record"
  | "source";

export type SourceContentType =
  | "calendar"
  | "results"
  | "timing"
  | "event-metadata"
  | "result-classification"
  | "stage-timing"
  | "standings"
  | "participants"
  | "media"
  | "videos"
  | "rider-profile"
  | "team-profile"
  | "manufacturer-profile"
  | "motorcycle-profile"
  | "biography"
  | "team-assignment"
  | "manufacturer-assignment"
  | "motorcycle-assignment"
  | "video-metadata"
  | "media-asset"
  | "maps"
  | "documents"
  | "document"
  | "course-map"
  | "history";

export type SourcePriority = "critical" | "high" | "medium" | "low";

export type SourceConfidenceLevel =
  | "official-primary"
  | "official-secondary"
  | "trusted"
  | "manual-review"
  | "unknown";

export type VerificationStatus =
  | "verified"
  | "pending"
  | "rejected"
  | "needs-review"
  | "conflicting-sources"
  | "unknown";

export type ChangeItemType =
  | "new-entity"
  | "removed-entity"
  | "updated-entity"
  | "metadata-change"
  | "relationship-change"
  | "media-change"
  | "document-change"
  | "status-change";

export type RelationshipType =
  | "video-to-rider"
  | "video-to-team"
  | "video-to-manufacturer"
  | "video-to-event"
  | "video-to-stage"
  | "result-to-rider"
  | "result-to-event"
  | "result-to-stage"
  | "event-to-team"
  | "event-to-manufacturer"
  | "manufacturer-to-motorcycle"
  | "team-to-rider"
  | "rider-to-motorcycle"
  | "season-to-event"
  | "season-to-standing"
  | "media-to-event"
  | "media-to-rider"
  | "media-to-team";

export type BackoffStrategy = {
  type: "none" | "linear" | "exponential";
  initialDelayMs: number;
  maxDelayMs: number;
  multiplier?: number;
};

export type SourceConfidence = {
  level: SourceConfidenceLevel;
  score: number;
  reason: string;
  lastReviewedAt?: string | null;
};

export type Source = {
  id: string;
  displayName: string;
  priority: SourcePriority;
  confidence: SourceConfidence;
  entityTypes: SourceEntityType[];
  supportedContentTypes: SourceContentType[];
  connectorVersion: string;
  enabled: boolean;
  refreshFrequency: "manual" | "hourly" | "daily" | "weekly" | "event-week";
  maximumRetryCount: number;
  backoffStrategy: BackoffStrategy;
  owner: string;
  documentationLink?: string | null;
};

export type SourceSnapshot = {
  id: string;
  sourceId: string;
  url: string;
  contentHash: string;
  capturedAt: string;
  statusCode?: number | null;
  rawContent?: string | null;
  metadata?: Record<string, unknown>;
};

export type ImportRun = {
  id: string;
  sourceId: string;
  connectorId: string;
  dryRun: boolean;
  status: "pending" | "running" | "completed" | "failed" | "needs-review";
  startedAt: string;
  finishedAt?: string | null;
  recordsFound: number;
  recordsChanged: number;
  recordsSkipped: number;
  errorMessage?: string | null;
  snapshotId?: string | null;
};

export type EntityReference = {
  type: SourceEntityType;
  id?: string | null;
  slug?: string | null;
  displayName: string;
  externalId?: string | null;
};

export type EntityAlias = {
  entityType: SourceEntityType;
  canonicalName: string;
  alias: string;
  sourceId?: string | null;
  notes?: string | null;
};

export type RelationshipReference = {
  type: RelationshipType;
  from: EntityReference;
  to: EntityReference;
  confidence: SourceConfidence;
  sourceIds: string[];
  notes?: string | null;
};

export type ChangeItem = {
  id: string;
  type: ChangeItemType;
  entity: EntityReference;
  fieldPath?: string | null;
  previousValue: unknown;
  nextValue: unknown;
  sourceIds: string[];
  confidence: SourceConfidence;
  relationships?: RelationshipReference[];
  detectedAt: string;
};

export type ChangeSet = {
  id: string;
  sourceId: string;
  importRunId?: string | null;
  createdAt: string;
  items: ChangeItem[];
  summary: {
    newEntities: number;
    removedEntities: number;
    updatedEntities: number;
    relationshipChanges: number;
    mediaChanges: number;
    documentChanges: number;
    statusChanges: number;
  };
};

export type VerificationDecision = {
  id: string;
  status: VerificationStatus;
  reviewerId?: string | null;
  decidedAt?: string | null;
  reason: string;
  sourceIds: string[];
  confidence: SourceConfidence;
};

export type ReviewItem = {
  id: string;
  changeItemId: string;
  changedFields: string[];
  previousValue: unknown;
  newValue: unknown;
  sourceIds: string[];
  confidence: SourceConfidence;
  priority: SourcePriority;
  affectedEntities: EntityReference[];
  recommendedAction: "approve" | "reject" | "request-more-evidence" | "merge";
  verificationStatus: VerificationStatus;
  createdAt: string;
};

export type SourceHealth = {
  sourceId: string;
  lastSuccessfulSync?: string | null;
  lastFailedSync?: string | null;
  currentStatus: "healthy" | "degraded" | "failing" | "disabled" | "unknown";
  averageLatencyMs?: number | null;
  confidence: SourceConfidence;
  priority: SourcePriority;
  supportedEntities: SourceEntityType[];
  supportedContentTypes: SourceContentType[];
  connectorVersion: string;
  lastReviewedDate?: string | null;
};

export type SourceStatistics = {
  sourceId: string;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  pendingReviewItems: number;
  approvedChanges: number;
  rejectedChanges: number;
  averageLatencyMs?: number | null;
  lastRunAt?: string | null;
};

export type ConnectorCapability = {
  connectorId: string;
  sourceId: string;
  version: string;
  entityTypes: SourceEntityType[];
  contentTypes: SourceContentType[];
  supportsDryRun: boolean;
  supportsSnapshots: boolean;
  supportsChangeDetection: boolean;
  requiresReview: boolean;
};

export type ConnectorResult = {
  connectorId: string;
  sourceId: string;
  dryRun: boolean;
  snapshot?: SourceSnapshot | null;
  importRun: ImportRun;
  changeSet: ChangeSet;
  reviewItems: ReviewItem[];
  health: SourceHealth;
  warnings: string[];
  errors: string[];
};

export type SyncContext = {
  runId: string;
  sourceId: string;
  connectorId: string;
  dryRun: boolean;
  requestedBy: "system" | "admin" | "developer";
  startedAt: string;
  environment: "local" | "staging" | "production";
};
