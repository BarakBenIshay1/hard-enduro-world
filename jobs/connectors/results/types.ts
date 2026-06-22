import type { AutomationDiff, ReviewQueueItem } from "@/jobs/automation/types";

export type ResultsConnectorConfig = {
  sourceUrl: string;
  eventExternalId: string;
  reviewRequired: true;
  autoPublish: false;
};

export type ResultsConnectorStatus =
  | "configured"
  | "missing-config"
  | "demo-fallback"
  | "error";

export type ResultsPayloadType = "json" | "csv" | "html" | "pdf-metadata" | "unknown";

export type OfficialResultStatus = "Finished" | "DNF" | "DNS" | "DSQ";

export type OfficialResultsFetchResult = {
  mode: "api" | "demo";
  connectorStatus: ResultsConnectorStatus;
  sourceStatus: "available" | "not-configured" | "error";
  payloadType: ResultsPayloadType;
  sourceUrl: string;
  fetchedAt: Date;
  rawContent: string;
  results: RawOfficialResult[];
  errorMessage?: string;
};

export type RawOfficialResult = {
  externalId: string;
  existingResultId?: string;
  event: string;
  stage: string;
  rider: string;
  country: string;
  team: string;
  manufacturer: string;
  motorcycle: string;
  position: number | null;
  time: string | null;
  gapToLeader: string | null;
  gapToPrevious: string | null;
  penalties: string | null;
  points: number | null;
  status: OfficialResultStatus;
  officialSourceUrl: string;
};

export type NormalizedOfficialResult = {
  externalId: string;
  existingResultId: string | null;
  event: string;
  stage: string;
  rider: string;
  country: string;
  team: string;
  manufacturer: string;
  motorcycle: string;
  position: number | null;
  time: string | null;
  gapToLeader: string | null;
  gapToPrevious: string | null;
  penalties: string | null;
  points: number | null;
  status: OfficialResultStatus;
  officialSourceUrl: string;
};

export type ResultsSourceTrackingPreview = {
  dataSource: {
    name: string;
    type: "TIMING_SYSTEM";
    url: string;
  };
  sourceSnapshot: {
    url: string;
    contentHash: string;
    fetchedAt: string;
    payloadType: ResultsPayloadType;
    status: "preview";
  };
  importRun: {
    jobName: "official-results";
    status: "NEEDS_REVIEW";
    recordsFound: number;
    recordsCreated: number;
    recordsUpdated: number;
  };
  sourceLinks: Array<{
    entityType: "RESULT";
    entityId: string;
    url: string;
  }>;
  dataVersions: Array<{
    entityType: "RESULT";
    entityId: string;
    action: "IMPORT";
    status: "preview";
  }>;
};

export type ResultsImportPreview = {
  sourceUrl: string;
  mode: OfficialResultsFetchResult["mode"];
  connectorStatus: ResultsConnectorStatus;
  sourceStatus: OfficialResultsFetchResult["sourceStatus"];
  payloadType: ResultsPayloadType;
  fetchedAt: Date;
  rawResults: RawOfficialResult[];
  normalizedResults: NormalizedOfficialResult[];
  diffs: AutomationDiff[];
  reviewItems: ReviewQueueItem[];
  sourceTracking: ResultsSourceTrackingPreview;
  errorMessage?: string;
};
