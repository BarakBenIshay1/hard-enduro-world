import type {
  BackoffStrategy,
  SourceConfidenceLevel,
  SourceContentType,
  SourceEntityType,
  SourcePriority,
} from "../types";

export type ProductionSourceCategory =
  | "official-championship"
  | "official-event"
  | "official-manufacturer"
  | "official-team"
  | "official-rider"
  | "official-media"
  | "trusted-creator"
  | "official-timing"
  | "official-documents"
  | "official-maps"
  | "official-social";

export type ProductionSourceStatus = "active" | "disabled" | "planned" | "needs-review";

export type ProductionReviewPolicy =
  | "always-review"
  | "review-high-risk"
  | "media-review"
  | "manual-only";

export type ProductionUpdateType =
  | "calendar"
  | "results"
  | "timing"
  | "standings"
  | "participants"
  | "media"
  | "videos"
  | "maps"
  | "documents"
  | "biography"
  | "team-assignment"
  | "manufacturer-assignment"
  | "motorcycle-assignment"
  | "history";

export type RefreshFrequency =
  | "manual"
  | "hourly"
  | "daily"
  | "weekly"
  | "event-week"
  | "monthly";

export type RetryPolicy = {
  maximumRetries: number;
  backoff: BackoffStrategy;
};

export type ProductionSourceRegistryEntry = {
  id: string;
  displayName: string;
  officialName: string;
  shortDescription: string;
  websiteUrl: string | null;
  category: ProductionSourceCategory;
  priority: SourcePriority;
  confidenceLevel: SourceConfidenceLevel;
  reviewPolicy: ProductionReviewPolicy;
  enabled: boolean;
  status: ProductionSourceStatus;
  language: string;
  country: string | null;
  timezone: string | null;
  connectorName: string;
  connectorVersion: string;
  supportedEntityTypes: SourceEntityType[];
  supportedContentTypes: SourceContentType[];
  supportedUpdateTypes: ProductionUpdateType[];
  refreshFrequency: RefreshFrequency;
  retryPolicy: RetryPolicy;
  maximumRetries: number;
  lastManualReview: string | null;
  documentationReference: string | null;
  owner: string;
  tags: string[];
  notes: string;
};

export type SourceCapabilityQuestion = {
  sourceId: string;
  entityType?: SourceEntityType;
  updateType?: ProductionUpdateType;
  contentType?: SourceContentType;
};
