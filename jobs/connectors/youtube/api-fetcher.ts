import type {
  YouTubeChannelInfo,
  YouTubeConnectorConfig,
  YouTubeFetchResult,
  YouTubePlaylistInfo,
  YouTubeRawVideo,
} from "@/jobs/connectors/youtube/types";

const youtubeApiBaseUrl = "https://www.googleapis.com/youtube/v3";

type YouTubeThumbnailSet = {
  default?: { url?: string };
  medium?: { url?: string };
  high?: { url?: string };
  standard?: { url?: string };
  maxres?: { url?: string };
};

type YouTubeChannelResponse = {
  items?: Array<{
    id: string;
    snippet?: {
      title?: string;
      description?: string;
      publishedAt?: string;
      thumbnails?: YouTubeThumbnailSet;
    };
    contentDetails?: {
      relatedPlaylists?: {
        uploads?: string;
      };
    };
    statistics?: {
      subscriberCount?: string;
      videoCount?: string;
    };
  }>;
  error?: { message?: string };
};

type YouTubeSearchResponse = {
  items?: Array<{
    id?: {
      videoId?: string;
    };
    snippet?: {
      title?: string;
      description?: string;
      publishedAt?: string;
      channelTitle?: string;
      thumbnails?: YouTubeThumbnailSet;
    };
  }>;
  error?: { message?: string };
};

type YouTubePlaylistResponse = {
  items?: Array<{
    id: string;
    snippet?: {
      title?: string;
      description?: string;
      publishedAt?: string;
      thumbnails?: YouTubeThumbnailSet;
    };
    contentDetails?: {
      itemCount?: number;
    };
  }>;
  error?: { message?: string };
};

export async function fetchYouTubeApiResult(
  config: YouTubeConnectorConfig,
  sourceUrl: string,
): Promise<YouTubeFetchResult> {
  if (!config.apiKey || !config.channelId) {
    return {
      mode: "demo",
      apiStatus: "missing-config",
      channelStatus: "not-configured",
      sourceUrl,
      fetchedAt: new Date(),
      channel: null,
      playlists: [],
      videos: [],
      errorMessage: "YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID are required.",
    };
  }

  try {
    const apiConfig = {
      apiKey: config.apiKey,
      channelId: config.channelId,
      maxResults: config.maxResults,
    };
    const [channel, videos, playlists] = await Promise.all([
      fetchChannel(apiConfig),
      fetchLatestVideos(apiConfig),
      fetchPlaylists(apiConfig),
    ]);

    return {
      mode: "api",
      apiStatus: "configured",
      channelStatus: channel ? "found" : "missing",
      sourceUrl,
      fetchedAt: new Date(),
      channel,
      playlists,
      videos,
    };
  } catch (error) {
    return {
      mode: "api",
      apiStatus: "error",
      channelStatus: "error",
      sourceUrl,
      fetchedAt: new Date(),
      channel: null,
      playlists: [],
      videos: [],
      errorMessage: error instanceof Error ? error.message : "Unknown YouTube API error.",
    };
  }
}

async function fetchChannel(
  config: Required<Pick<YouTubeConnectorConfig, "apiKey" | "channelId">>,
): Promise<YouTubeChannelInfo | null> {
  const response = await fetchJson<YouTubeChannelResponse>("channels", {
    part: "snippet,contentDetails,statistics",
    id: config.channelId,
    key: config.apiKey,
  });
  const item = response.items?.[0];

  if (!item) {
    return null;
  }

  return {
    id: item.id,
    title: item.snippet?.title ?? "Untitled channel",
    description: item.snippet?.description ?? "",
    thumbnailUrl: pickThumbnail(item.snippet?.thumbnails),
    publishedAt: item.snippet?.publishedAt ?? new Date(0).toISOString(),
    subscriberCount: item.statistics?.subscriberCount,
    videoCount: item.statistics?.videoCount,
    uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads,
  };
}

async function fetchLatestVideos(
  config: Required<Pick<YouTubeConnectorConfig, "apiKey" | "channelId">> & {
    maxResults: number;
  },
): Promise<YouTubeRawVideo[]> {
  const response = await fetchJson<YouTubeSearchResponse>("search", {
    part: "snippet",
    channelId: config.channelId,
    maxResults: String(config.maxResults),
    order: "date",
    type: "video",
    key: config.apiKey,
  });

  return (response.items ?? [])
    .map((item): YouTubeRawVideo | null => {
      const id = item.id?.videoId;

      if (!id) {
        return null;
      }

      return {
        id,
        title: item.snippet?.title ?? "Untitled video",
        description: item.snippet?.description ?? "",
        thumbnailUrl: pickThumbnail(item.snippet?.thumbnails),
        channelTitle: item.snippet?.channelTitle ?? "YouTube",
        publishedAt: item.snippet?.publishedAt ?? new Date(0).toISOString(),
        watchUrl: `https://www.youtube.com/watch?v=${id}`,
      };
    })
    .filter((video): video is YouTubeRawVideo => video !== null);
}

async function fetchPlaylists(
  config: Required<Pick<YouTubeConnectorConfig, "apiKey" | "channelId">>,
): Promise<YouTubePlaylistInfo[]> {
  const response = await fetchJson<YouTubePlaylistResponse>("playlists", {
    part: "snippet,contentDetails",
    channelId: config.channelId,
    maxResults: "10",
    key: config.apiKey,
  });

  return (response.items ?? []).map((item) => ({
    id: item.id,
    title: item.snippet?.title ?? "Untitled playlist",
    description: item.snippet?.description ?? "",
    thumbnailUrl: pickThumbnail(item.snippet?.thumbnails),
    publishedAt: item.snippet?.publishedAt ?? new Date(0).toISOString(),
    itemCount: item.contentDetails?.itemCount,
  }));
}

async function fetchJson<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${youtubeApiBaseUrl}/${path}`);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url);
  const body = (await response.json()) as T & { error?: { message?: string } };

  if (!response.ok) {
    throw new Error(body.error?.message ?? `YouTube API request failed: ${path}`);
  }

  return body;
}

function pickThumbnail(thumbnails?: YouTubeThumbnailSet) {
  return (
    thumbnails?.maxres?.url ??
    thumbnails?.standard?.url ??
    thumbnails?.high?.url ??
    thumbnails?.medium?.url ??
    thumbnails?.default?.url ??
    ""
  );
}
