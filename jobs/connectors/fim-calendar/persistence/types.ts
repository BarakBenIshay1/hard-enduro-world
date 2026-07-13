import type {
  FimCalendarDryRunReport,
  FimCalendarReportRow,
  NormalizedFimCalendarEventCandidate,
} from "../types";

export type PersistableReviewStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUPERSEDED";

export type PersistableReviewAction =
  | "NEW_EVENT"
  | "UPDATE_EVENT"
  | "SOURCE_REMOVED"
  | "MANUAL_REVIEW";

export type PersistableConnectorSnapshot = {
  id: string;
  connectorKey: string;
  sourceKey: string;
  season: number;
  payloadChecksum: string;
  createdAt: Date;
};

export type PersistableReviewItem = {
  id: string;
  snapshotId: string;
  connectorKey: string;
  season: number;
  sourceEventId: string | null;
  currentEventId: string | null;
  eventName: string;
  suggestedAction: PersistableReviewAction;
  reviewStatus: PersistableReviewStatus;
  confidence: unknown;
  matchingStrategy: string | null;
  ambiguityReason: string | null;
  currentValues: unknown;
  proposedValues: unknown;
  changedFields: string[];
  recommendation: string | null;
  deduplicationKey: string;
  createdAt: Date;
  updatedAt: Date;
};

export type FimCalendarSnapshotInput = {
  connectorKey: string;
  sourceKey: string;
  season: number;
  coverageMode: string;
  inputSourceType: string;
  requestedSourceUrl: string | null;
  finalResponseUrl: string | null;
  httpStatus: number | null;
  contentType: string | null;
  parserSelected: string;
  rawRecordCount: number;
  usableEventCount: number;
  rejectedRecordCount: number;
  rejectionReasons: string[];
  fetchDurationMs: number | null;
  executionDurationMs: number | null;
  fallbackUsed: boolean;
  environment: string | null;
  gitCommitSha: string | null;
  connectorVersion: string | null;
  normalizedPayload: unknown;
  matchingPayload: unknown;
  diagnostics: unknown;
  payloadChecksum: string;
};

export type FimCalendarReviewInput = {
  connectorKey: string;
  season: number;
  sourceEventId: string | null;
  currentEventId: string | null;
  eventName: string;
  suggestedAction: PersistableReviewAction;
  confidence: unknown;
  matchingStrategy: string | null;
  ambiguityReason: string | null;
  currentValues: unknown;
  proposedValues: unknown;
  changedFields: string[];
  recommendation: string | null;
  deduplicationKey: string;
};

export type FimCalendarPersistenceRepository = {
  findLatestSnapshot(params: {
    connectorKey: string;
    season: number;
  }): Promise<PersistableConnectorSnapshot | null>;
  createSnapshot(input: FimCalendarSnapshotInput): Promise<PersistableConnectorSnapshot>;
  findPendingReviewItemByDeduplicationKey(
    deduplicationKey: string,
  ): Promise<PersistableReviewItem | null>;
  findPendingReviewItemsForEvent(params: {
    connectorKey: string;
    season: number;
    sourceEventId: string | null;
    currentEventId: string | null;
    suggestedAction: PersistableReviewAction;
  }): Promise<PersistableReviewItem[]>;
  createReviewItem(params: {
    snapshotId: string;
    input: FimCalendarReviewInput;
  }): Promise<PersistableReviewItem>;
  updateReviewItemSnapshot(params: {
    id: string;
    snapshotId: string;
  }): Promise<PersistableReviewItem>;
  supersedeReviewItem(id: string): Promise<PersistableReviewItem>;
  countPendingReviewItems(params: {
    connectorKey: string;
    season: number;
  }): Promise<number>;
  transaction<T>(
    callback: (repository: FimCalendarPersistenceRepository) => Promise<T>,
  ): Promise<T>;
};

export type FimCalendarPersistenceInput = {
  report: FimCalendarDryRunReport;
  normalizedCandidates: NormalizedFimCalendarEventCandidate[];
  startedAt: Date;
  finishedAt: Date;
  environment?: string | null;
  gitCommitSha?: string | null;
  connectorVersion?: string | null;
};

export type FimCalendarPersistenceResult = {
  requested: boolean;
  performed: boolean;
  snapshotStatus: "not-requested" | "created" | "reused" | "skipped-duplicate" | "failed";
  snapshotId: string | null;
  snapshotChecksum: string | null;
  snapshotCreated: boolean;
  snapshotReused: boolean;
  duplicateSnapshotDetected: boolean;
  reviewItemsCreated: PersistableReviewItem[];
  reviewItemsReused: PersistableReviewItem[];
  reviewItemsSuperseded: PersistableReviewItem[];
  totalPendingReviewItems: number;
  publicEventsUpdated: 0;
  errorMessage?: string | null;
};

export type ActionableReviewRow = {
  row: FimCalendarReportRow;
  input: FimCalendarReviewInput;
};
