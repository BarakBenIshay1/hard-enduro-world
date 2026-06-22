import type { AutomationDiff, ReviewQueueItem } from "@/jobs/automation/types";

export type YouTubeConnectorConfig = {
  apiKey?: string;
  channelId?: string;
  maxResults: number;
  reviewRequired: boolean;
};

export type YouTubeRawVideo = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  watchUrl: string;
};

export type NormalizedYouTubeVideo = {
  provider: "youtube";
  providerId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: Date;
  watchUrl: string;
  relatedEvent?: string;
  relatedRider?: string;
};

export type YouTubeImportPreview = {
  sourceUrl: string;
  rawVideos: YouTubeRawVideo[];
  normalizedVideos: NormalizedYouTubeVideo[];
  diffs: AutomationDiff[];
  reviewItems: ReviewQueueItem[];
};
