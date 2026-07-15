import type { ConnectorReviewAction, ResultStatus } from "@prisma/client";

export const overallResultsConnectorKey = "official-results-overall";
export const overallResultsConnectorVersion = "1.0.0";

export type OverallResultsInputType = "official-fetch" | "local-official-fixture";

export type OverallResultsSourceConfig = {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  eventSlug: string;
  seasonYear: number;
  inputType: OverallResultsInputType;
};

export type ParsedOverallResultRow = {
  sourceRowId: string | null;
  eventSlug: string | null;
  eventName: string | null;
  seasonYear: number | null;
  riderSlug: string | null;
  riderName: string | null;
  countryCode: string | null;
  position: number | null;
  status: ResultStatus | "INVALID" | null;
  manufacturer: string | null;
  motorcycle: string | null;
  team: string | null;
  totalTimeText: string | null;
  gapToLeaderText: string | null;
  gapToPreviousText: string | null;
  className: string | null;
  officialSourceUrl: string | null;
  raw: Record<string, string | null>;
};

export type EntityMatch = {
  entityType: "Event" | "Rider" | "Manufacturer" | "Motorcycle" | "Team";
  sourceValue: string | null;
  matchedId: string | null;
  method: "slug" | "exact-name" | "manufacturer-model" | "not-supplied" | "unresolved";
  confidence: number;
  reason: string;
  required: boolean;
};

export type NormalizedOverallResultProposal = {
  sourceRowId: string;
  sourceId: string;
  eventSlug: string | null;
  eventName: string | null;
  seasonYear: number;
  riderSlug: string | null;
  riderName: string | null;
  countryCode: string | null;
  position: number | null;
  status: ResultStatus | null;
  manufacturer: string | null;
  motorcycle: string | null;
  team: string | null;
  totalTimeText: string | null;
  gapToLeaderText: string | null;
  gapToPreviousText: string | null;
  className: string | null;
  officialSourceUrl: string | null;
  officialRawRow: Record<string, unknown>;
};

export type MatchedOverallResultProposal = NormalizedOverallResultProposal & {
  eventId: string | null;
  riderId: string | null;
  manufacturerId: string | null;
  motorcycleId: string | null;
  currentResultId: string | null;
  currentValues: Record<string, unknown> | null;
  proposedValues: Record<string, unknown>;
  changedFields: string[];
  entityMatches: EntityMatch[];
  validationWarnings: string[];
  applyEligible: boolean;
  reviewAction: ConnectorReviewAction | "UNCHANGED";
  recommendation: string;
};

export type OverallResultsImportReport = {
  summary: {
    connectorKey: string;
    sourceId: string;
    eventSlug: string;
    seasonYear: number;
    inputType: OverallResultsInputType;
    totalRows: number;
    normalizedRows: number;
    newResults: number;
    changedResults: number;
    unchangedResults: number;
    blockedRows: number;
    warnings: number;
    resultRowsWritten: 0;
  };
  snapshot: {
    connectorSnapshotId: string | null;
    sourceSnapshotId: string | null;
    importRunId: string | null;
    checksum: string;
    status: "created" | "reused" | "not-persisted";
    duplicateDetected: boolean;
  };
  review: {
    created: number;
    reused: number;
    superseded: number;
    pendingTotal: number;
  };
  rows: MatchedOverallResultProposal[];
};
