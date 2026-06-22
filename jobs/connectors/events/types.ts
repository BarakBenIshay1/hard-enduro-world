import type { AutomationDiff, ReviewQueueItem } from "@/jobs/automation/types";

export type EventsConnectorConfig = {
  sourceUrl: string;
  seasonYear: number;
  reviewRequired: boolean;
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
  rawEvents: RawOfficialEvent[];
  normalizedEvents: NormalizedOfficialEvent[];
  diffs: AutomationDiff[];
  reviewItems: ReviewQueueItem[];
};
