import type { AutomationDiff, ReviewQueueItem } from "@/jobs/automation/types";

export type YouTubeConnectorConfig = {
  apiKey?: string;
  channelId?: string;
  maxResults: number;
  reviewRequired: boolean;
};

export type YouTubeApiStatus =
  | "configured"
  | "missing-config"
  | "demo-fallback"
  | "error";

export type YouTubeChannelInfo = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  subscriberCount?: string;
  videoCount?: string;
  uploadsPlaylistId?: string;
};

export type YouTubePlaylistInfo = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  itemCount?: number;
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

export type YouTubeFetchResult = {
  mode: "api" | "demo";
  apiStatus: YouTubeApiStatus;
  channelStatus: "found" | "missing" | "not-configured" | "error";
  sourceUrl: string;
  fetchedAt: Date;
  channel: YouTubeChannelInfo | null;
  playlists: YouTubePlaylistInfo[];
  videos: YouTubeRawVideo[];
  errorMessage?: string;
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

export type YouTubeSourceTrackingPreview = {
  dataSource: {
    name: string;
    type: "YOUTUBE";
    url: string;
  };
  sourceSnapshot: {
    url: string;
    contentHash: string;
    fetchedAt: string;
    status: "preview";
  };
  importRun: {
    jobName: "youtube-videos";
    status: "NEEDS_REVIEW";
    recordsFound: number;
    recordsCreated: number;
    recordsUpdated: number;
  };
  sourceLinks: Array<{
    entityType: "MEDIA_ITEM";
    entityId: string;
    url: string;
  }>;
  dataVersions: Array<{
    entityType: "MEDIA_ITEM";
    entityId: string;
    action: "IMPORT";
    status: "preview";
  }>;
};

export type YouTubeImportPreview = {
  sourceUrl: string;
  mode: YouTubeFetchResult["mode"];
  apiStatus: YouTubeApiStatus;
  channelStatus: YouTubeFetchResult["channelStatus"];
  fetchedAt: Date;
  channel: YouTubeChannelInfo | null;
  playlists: YouTubePlaylistInfo[];
  rawVideos: YouTubeRawVideo[];
  normalizedVideos: NormalizedYouTubeVideo[];
  diffs: AutomationDiff[];
  reviewItems: ReviewQueueItem[];
  sourceTracking: YouTubeSourceTrackingPreview;
  errorMessage?: string;
};
