import { createDiffPreviewPlaceholder } from "@/jobs/automation/diff";
import type { ReviewQueueItem } from "@/jobs/automation/types";
import {
  getYouTubeConnectorConfig,
  getYouTubeSourceUrl,
} from "@/jobs/connectors/youtube/config";
import { fetchYouTubeVideosDemo } from "@/jobs/connectors/youtube/mock-fetcher";
import { normalizeYouTubeVideo } from "@/jobs/connectors/youtube/normalizer";
import { parseYouTubeResponsePlaceholder } from "@/jobs/connectors/youtube/parser";
import type { YouTubeImportPreview } from "@/jobs/connectors/youtube/types";

export async function previewYouTubeImport(): Promise<YouTubeImportPreview> {
  const config = getYouTubeConnectorConfig();
  const sourceUrl = getYouTubeSourceUrl(config);
  const rawVideos = (await fetchYouTubeVideosDemo()).slice(0, config.maxResults);
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
    id: `youtube-videos-demo-${index + 1}`,
    jobId: "youtube-videos",
    state: "pending-change",
    diff,
    validationIssues: [],
  }));

  return {
    sourceUrl,
    rawVideos,
    normalizedVideos,
    diffs,
    reviewItems,
  };
}
