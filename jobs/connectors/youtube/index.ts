import { createDiffPreviewPlaceholder } from "@/jobs/automation/diff";
import type { ReviewQueueItem } from "@/jobs/automation/types";
import { fetchYouTubeApiResult } from "@/jobs/connectors/youtube/api-fetcher";
import {
  getYouTubeConnectorConfig,
  getYouTubeSourceUrl,
} from "@/jobs/connectors/youtube/config";
import { fetchYouTubeDemoResult } from "@/jobs/connectors/youtube/mock-fetcher";
import { normalizeYouTubeVideo } from "@/jobs/connectors/youtube/normalizer";
import { parseYouTubeResponsePlaceholder } from "@/jobs/connectors/youtube/parser";
import type {
  NormalizedYouTubeVideo,
  YouTubeImportPreview,
  YouTubeSourceTrackingPreview,
} from "@/jobs/connectors/youtube/types";

export async function previewYouTubeImport(): Promise<YouTubeImportPreview> {
  const config = getYouTubeConnectorConfig();
  const sourceUrl = getYouTubeSourceUrl(config);
  const apiResult = await fetchYouTubeApiResult(config, sourceUrl);
  const fetchResult =
    apiResult.apiStatus === "missing-config"
      ? await fetchYouTubeDemoResult(sourceUrl)
      : apiResult;
  const rawVideos = fetchResult.videos.slice(0, config.maxResults);
  const parsedVideos = parseYouTubeResponsePlaceholder(rawVideos);
  const normalizedVideos = parsedVideos.map(normalizeYouTubeVideo);
  const diffs = normalizedVideos.map((video) =>
    createDiffPreviewPlaceholder({
      entityType: "MEDIA_ITEM",
      sourceUrl,
      payload: {
        type: "YOUTUBE",
        title: video.title,
        url: video.watchUrl,
        thumbnailUrl: video.thumbnailUrl,
        provider: video.provider,
        providerId: video.providerId,
        publishedAt: video.publishedAt.toISOString(),
      },
    }),
  );
  const reviewItems: ReviewQueueItem[] = diffs.map((diff, index) => ({
    id: `youtube-videos-review-${index + 1}`,
    jobId: "youtube-videos",
    state: "pending-change",
    diff,
    validationIssues: [],
  }));

  return {
    sourceUrl,
    mode: fetchResult.mode,
    apiStatus: fetchResult.apiStatus,
    channelStatus: fetchResult.channelStatus,
    fetchedAt: fetchResult.fetchedAt,
    channel: fetchResult.channel,
    playlists: fetchResult.playlists,
    rawVideos,
    normalizedVideos,
    diffs,
    reviewItems,
    sourceTracking: buildSourceTrackingPreview({
      sourceUrl,
      fetchedAt: fetchResult.fetchedAt,
      videos: normalizedVideos,
    }),
    errorMessage: fetchResult.errorMessage,
  };
}

function buildSourceTrackingPreview({
  sourceUrl,
  fetchedAt,
  videos,
}: {
  sourceUrl: string;
  fetchedAt: Date;
  videos: NormalizedYouTubeVideo[];
}): YouTubeSourceTrackingPreview {
  return {
    dataSource: {
      name: "YouTube official channel source",
      type: "YOUTUBE",
      url: sourceUrl,
    },
    sourceSnapshot: {
      url: sourceUrl,
      contentHash: `youtube-preview-${fetchedAt.toISOString()}-${videos.length}`,
      fetchedAt: fetchedAt.toISOString(),
      status: "preview",
    },
    importRun: {
      jobName: "youtube-videos",
      status: "NEEDS_REVIEW",
      recordsFound: videos.length,
      recordsCreated: videos.length,
      recordsUpdated: 0,
    },
    sourceLinks: videos.map((video) => ({
      entityType: "MEDIA_ITEM",
      entityId: video.providerId,
      url: video.watchUrl,
    })),
    dataVersions: videos.map((video) => ({
      entityType: "MEDIA_ITEM",
      entityId: video.providerId,
      action: "IMPORT",
      status: "preview",
    })),
  };
}
