import type { AutomationDiff, ReviewQueueItem } from "@/jobs/automation/types";

export type EventsConnectorConfig = {
  sourceUrl: string;
  seasonYear: number;
  reviewRequired: boolean;
};

export type EventsConnectorStatus =
  | "configured"
  | "missing-config"
  | "demo-fallback"
  | "error";

export type OfficialEventsFetchResult = {
  mode: "api" | "demo";
  connectorStatus: EventsConnectorStatus;
  sourceStatus: "available" | "not-configured" | "error";
  sourceUrl: string;
  fetchedAt: Date;
  rawContent: string;
  events: RawOfficialEvent[];
  errorMessage?: string;
};

export type RawOfficialEvent = {
  externalId: string;
  name: string;
  seasonYear: number;
  startDate: string;
  endDate?: string;
  countryName: string;
  countryCode: string;
  city?: string;
  venue?: string;
  status: "SCHEDULED" | "LIVE" | "SUSPENDED" | "COMPLETED" | "CANCELLED";
  officialUrl: string;
};

export type EventsSourceTrackingPreview = {
  dataSource: {
    name: string;
    type: "OFFICIAL_WEBSITE";
    url: string;
  };
  sourceSnapshot: {
    url: string;
    contentHash: string;
    fetchedAt: string;
    status: "preview";
  };
  importRun: {
    jobName: "official-events";
    status: "NEEDS_REVIEW";
    recordsFound: number;
    recordsCreated: number;
    recordsUpdated: number;
  };
  sourceLinks: Array<{
    entityType: "EVENT";
    entityId: string;
    url: string;
  }>;
  dataVersions: Array<{
    entityType: "EVENT";
    entityId: string;
    action: "IMPORT";
    status: "preview";
  }>;
};

export type NormalizedOfficialEvent = {
  externalId: string;
  name: string;
  slug: string;
  seasonYear: number;
  startDate: Date;
  endDate: Date | null;
  countryName: string;
  countryCode: string;
  city: string | null;
  venue: string | null;
  status: RawOfficialEvent["status"];
  officialUrl: string;
};

export type EventsImportPreview = {
  sourceUrl: string;
  mode: OfficialEventsFetchResult["mode"];
  connectorStatus: EventsConnectorStatus;
  sourceStatus: OfficialEventsFetchResult["sourceStatus"];
  fetchedAt: Date;
  rawEvents: RawOfficialEvent[];
  normalizedEvents: NormalizedOfficialEvent[];
  diffs: AutomationDiff[];
  reviewItems: ReviewQueueItem[];
  sourceTracking: EventsSourceTrackingPreview;
  errorMessage?: string;
};
