import type {
  NormalizedYouTubeVideo,
  YouTubeRawVideo,
} from "@/jobs/connectors/youtube/types";

export function normalizeYouTubeVideo(video: YouTubeRawVideo): NormalizedYouTubeVideo {
  return {
    provider: "youtube",
    providerId: video.id,
    title: video.title,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    channelTitle: video.channelTitle,
    publishedAt: new Date(video.publishedAt),
    watchUrl: video.watchUrl,
    relatedEvent: inferRelatedEvent(video.title),
    relatedRider: inferRelatedRider(video.title),
  };
}

function inferRelatedEvent(title: string) {
  if (
    title.toLowerCase().includes("iron mountain") ||
    title.toLowerCase().includes("gp")
  ) {
    return "Sample Hard Enduro GP";
  }

  return undefined;
}

function inferRelatedRider(title: string) {
  if (title.toLowerCase().includes("lettenbichler")) {
    return "Manuel Lettenbichler";
  }

  return undefined;
}
