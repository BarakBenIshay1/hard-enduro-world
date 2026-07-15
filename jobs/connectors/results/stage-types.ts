import type { ConnectorReviewAction, ResultStatus } from "@prisma/client";
import type { EntityMatch, OverallResultsInputType } from "./overall-types";

export const stageResultsConnectorKey = "official-stage-results";
export const stageResultsConnectorVersion = "1.0.0";

export type StageResultsSourceConfig = {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  eventSlug: string;
  seasonYear: number;
  inputType: OverallResultsInputType;
};

export type StageMatch = {
  entityType: "RaceStage";
  sourceStageId: string | null;
  sourceStageName: string | null;
  sourceStageSlug: string | null;
  sourceStageOrder: number | null;
  matchedId: string | null;
  matchedEventId: string | null;
  matchedStageName: string | null;
  matchedStageOrder: number | null;
  matchedStageType: string | null;
  method:
    | "explicit-alias"
    | "exact-slug"
    | "exact-normalized-name"
    | "event-stage-order"
    | "unresolved"
    | "ambiguous";
  confidence: number;
  reason: string;
  ambiguityReason: string | null;
  required: true;
};

export type ParsedStageResultRow = {
  sourceRowId: string | null;
  sourceStageId: string | null;
  sourceStageName: string | null;
  eventSlug: string | null;
  eventName: string | null;
  seasonYear: number | null;
  stageSlug: string | null;
  stageOrder: number | null;
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

export type NormalizedStageResultProposal = {
  sourceRowId: string;
  sourceStageId: string | null;
  sourceStageName: string | null;
  sourceId: string;
  eventSlug: string | null;
  eventName: string | null;
  seasonYear: number;
  stageSlug: string | null;
  stageOrder: number | null;
  riderSlug: string | null;
  riderName: string | null;
  countryCode: string | null;
  position: number | null;
  status: ResultStatus | null;
  manufacturer: string | null;
  motorcycle: string | null;
  team: string | null;
  totalTimeMs: number | null;
  totalTimeText: string | null;
  gapToLeaderText: string | null;
  gapToPreviousText: string | null;
  className: string | null;
  officialSourceUrl: string | null;
  officialRawRow: Record<string, unknown>;
};

export type MatchedStageResultProposal = NormalizedStageResultProposal & {
  eventId: string | null;
  stageId: string | null;
  riderId: string | null;
  manufacturerId: string | null;
  motorcycleId: string | null;
  currentStageResultId: string | null;
  currentValues: Record<string, unknown> | null;
  proposedValues: Record<string, unknown>;
  changedFields: string[];
  stageMatch: StageMatch;
  entityMatches: EntityMatch[];
  validationWarnings: string[];
  applyEligible: boolean;
  reviewAction: ConnectorReviewAction | "UNCHANGED";
  recommendation: string;
};

export type StageResultsImportReport = {
  summary: {
    connectorKey: string;
    sourceId: string;
    eventSlug: string;
    seasonYear: number;
    inputType: OverallResultsInputType;
    totalRows: number;
    normalizedRows: number;
    newStageResults: number;
    changedStageResults: number;
    unchangedStageResults: number;
    missingSourceWarnings: number;
    blockedRows: number;
    warnings: number;
    stageResultRowsWritten: 0;
    overallResultRowsWritten: 0;
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
  rows: MatchedStageResultProposal[];
};
