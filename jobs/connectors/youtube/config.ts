import type { YouTubeConnectorConfig } from "@/jobs/connectors/youtube/types";

export function getYouTubeConnectorConfig(): YouTubeConnectorConfig {
  return {
    apiKey: process.env.YOUTUBE_API_KEY || undefined,
    channelId: process.env.YOUTUBE_CHANNEL_ID || undefined,
    maxResults: 6,
    reviewRequired: true,
  };
}

export function getYouTubeSourceUrl(config: YouTubeConnectorConfig) {
  return config.channelId
    ? `https://www.youtube.com/channel/${config.channelId}`
    : "https://www.youtube.com/@HardEnduroWorld/demo";
}
