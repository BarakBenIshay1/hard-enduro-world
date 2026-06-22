import type { YouTubeRawVideo } from "@/jobs/connectors/youtube/types";

export function parseYouTubeResponsePlaceholder(
  videos: YouTubeRawVideo[],
): YouTubeRawVideo[] {
  return videos.filter((video) => video.id && video.title && video.watchUrl);
}
