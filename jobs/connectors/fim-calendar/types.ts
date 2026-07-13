import type {
  ProductionSourceRegistryEntry,
  ProductionUpdateType,
} from "@/lib/source-intelligence/registry";
import type { SourceConfidence, SourcePriority } from "@/lib/source-intelligence";

export type FimCalendarRaceStatusCandidate =
  | "Coming Soon"
  | "Live Now"
  | "Race Completed"
  | "Cancelled"
  | "Postponed"
  | "Suspended"
  | "Unknown";

export type FimCalendarChangeType =
  | "new-event-found"
  | "existing-event-unchanged"
  | "date-changed"
  | "time-changed"
  | "country-changed"
  | "location-changed"
  | "status-changed"
  | "official-url-changed"
  | "missing-from-source"
  | "not-evaluated-partial-input"
  | "ambiguous-match-requires-review";

export type FimCalendarSeverity = "info" | "warning" | "review-required";
export type FimCalendarInputCoverageMode =
  | "full-season"
  | "partial-season"
  | "single-event";
export type FimCalendarInputSourceType =
  | "local-json"
  | "local-ics"
  | "local-html"
  | "configured-url-fetch-disabled"
  | "unknown";

export type FimCalendarConfig = {
  connectorId: "fim-calendar";
  sourceId: string;
  source: ProductionSourceRegistryEntry;
  seasonYear: number;
  dryRun: true;
  sourceUrl: string | null;
  supportedUpdateType: ProductionUpdateType;
};

export type RawFimCalendarItem = {
  sourceEventId?: string | null;
  eventName?: string | null;
  seasonYear?: number | null;
  country?: string | null;
  countryCode?: string | null;
  location?: string | null;
  venue?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: string | null;
  officialUrl?: string | null;
  notes?: string | null;
};

export type NormalizedFimCalendarEventCandidate = {
  sourceEventId: string | null;
  seasonYear: number;
  eventName: string;
  slugCandidate: string;
  country: string | null;
  countryCode: string | null;
  location: string | null;
  venue: string | null;
  startDate: string | null;
  endDate: string | null;
  raceStatusCandidate: FimCalendarRaceStatusCandidate;
  startDatePrecision: "date" | "datetime" | "unknown";
  endDatePrecision: "date" | "datetime" | "unknown";
  officialUrl: string | null;
  sourceId: string;
  confidence: SourceConfidence;
  reviewRequired: true;
  notes: string;
};

export type FimCalendarCurrentEvent = {
  id: string;
  slug: string;
  name: string;
  seasonYear: number;
  country: string | null;
  countryCode: string | null;
  location: string | null;
  venue: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string | null;
  officialUrl: string | null;
  sourceEventId?: string | null;
};

export type FimCalendarMatch =
  | {
      status: "matched";
      event: FimCalendarCurrentEvent;
      strategy: FimCalendarMatchingStrategy;
      confidence: number;
      reason: string;
    }
  | {
      status: "ambiguous";
      events: FimCalendarCurrentEvent[];
      strategy: FimCalendarMatchingStrategy;
      confidence: number;
      reason: string;
    }
  | {
      status: "not-found";
      strategy: FimCalendarMatchingStrategy;
      confidence: number;
      reason: string;
    };

export type FimCalendarMatchingStrategy =
  | "sourceEventId"
  | "explicit-alias"
  | "exact-normalized-slug"
  | "sponsorless-name-season"
  | "country-location-overlapping-dates"
  | "unmatched";

export type FimCalendarReportRow = {
  eventName: string;
  currentValue: Record<string, unknown> | null;
  proposedValue: Record<string, unknown> | null;
  changeType: FimCalendarChangeType;
  confidence: SourceConfidence;
  severity: FimCalendarSeverity;
  reviewRecommendation: string;
  sourceUrl: string | null;
  matchingStrategy: FimCalendarMatchingStrategy;
  matchingConfidence: number;
  ambiguousReason?: string | null;
};

export type FimCalendarReviewItem = {
  id: string;
  changeType: FimCalendarChangeType;
  eventName: string;
  sourceId: string;
  priority: SourcePriority;
  confidence: SourceConfidence;
  recommendation: string;
  payload: FimCalendarReportRow;
};

export type FimCalendarDryRunReport = {
  summary: {
    sourceId: string;
    runMode: "dry-run";
    seasonYear: number;
    totalSourceEvents: number;
    totalMatchedEvents: number;
    newCandidates: number;
    changedCandidates: number;
    ambiguousCandidates: number;
    warnings: string[];
    errors: string[];
  };
  metadata: {
    inputCoverageMode: FimCalendarInputCoverageMode;
    inputSourceType: FimCalendarInputSourceType;
    inputCompletenessWarning: string | null;
  };
  rows: FimCalendarReportRow[];
  reviewItems: FimCalendarReviewItem[];
  source: {
    id: string;
    displayName: string;
    priority: SourcePriority;
    confidenceLevel: string;
    reviewPolicy: string;
    sourceUrl: string | null;
  };
};

export type FimCalendarDryRunInput = {
  rawContent?: string | null;
  rawItems?: RawFimCalendarItem[];
  currentEvents: FimCalendarCurrentEvent[];
  seasonYear?: number;
  sourceId?: string;
  coverageMode?: FimCalendarInputCoverageMode;
  inputSourceType?: FimCalendarInputSourceType;
  selectedEventSlug?: string | null;
};
