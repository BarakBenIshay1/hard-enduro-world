import type { AutomationDiff, ReviewQueueItem } from "@/jobs/automation/types";

export type ResultsConnectorConfig = {
  sourceUrl: string;
  eventExternalId: string;
  reviewRequired: true;
  autoPublish: false;
};

export type OfficialResultStatus = "Finished" | "DNF" | "DNS" | "DSQ";

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

export type ResultsImportPreview = {
  sourceUrl: string;
  rawResults: RawOfficialResult[];
  normalizedResults: NormalizedOfficialResult[];
  diffs: AutomationDiff[];
  reviewItems: ReviewQueueItem[];
};
