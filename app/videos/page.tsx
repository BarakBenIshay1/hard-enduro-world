import type { Metadata } from "next";
import { VideoHub } from "@/components/videos/VideoHub";
import type { VideoFeedItem, VideoSource } from "@/components/videos/types";
import { siteConfig } from "@/config/site";
import { getVideosPageData } from "@/db/videos";

export const dynamic = "force-dynamic";

const canonical = "/videos";
const description =
  "Official and trusted Hard Enduro videos from riders, events, teams, manufacturers, and media creators.";

export const metadata: Metadata = {
  title: "Videos",
  description,
  alternates: {
    canonical,
  },
  openGraph: {
    title: "Videos | Hard Enduro World",
    description,
    url: new URL(canonical, siteConfig.url).toString(),
    siteName: siteConfig.name,
    type: "website",
  },
};

export default async function VideosPage() {
  const { mediaItems, events } = await getVideosPageData();
  const approvedVideos: VideoFeedItem[] = mediaItems.map((item) => ({
    id: item.id,
    title: item.title ?? null,
    sourceName: item.provider ?? "Reviewed media source",
    sourceType: classifySourceType(item.provider),
    contentType: null,
    eventName: item.event?.name ?? null,
    publishedAt: (item.publishedAt ?? item.uploadedAt)?.toISOString() ?? null,
    duration: null,
    verified: true,
    url: item.url,
    placeholder: false,
  }));
  const videos = approvedVideos.length > 0 ? approvedVideos : placeholderVideos;

  return (
    <main className="min-h-screen bg-surface text-foreground">
      <VideoHub
        sources={videoSources}
        events={events.map((event) => ({ id: event.id, name: event.name }))}
        videos={videos}
      />
    </main>
  );
}

const videoSources: VideoSource[] = [
  {
    id: "manuel-lettenbichler",
    name: "Manuel Lettenbichler",
    type: "Official Rider",
    subscribed: true,
  },
  {
    id: "media-mike-tv",
    name: "Media Mike TV",
    type: "Trusted Creator",
    subscribed: true,
  },
  {
    id: "billy-bolt",
    name: "Billy Bolt",
    type: "Official Rider",
    subscribed: true,
  },
  {
    id: "red-bull-motorsports",
    name: "Red Bull Motorsports",
    type: "Official Brand",
    subscribed: true,
  },
  {
    id: "red-bull-erzbergrodeo",
    name: "Red Bull Erzbergrodeo",
    type: "Official Event",
    subscribed: true,
  },
  {
    id: "red-bull-romaniacs",
    name: "Red Bull Romaniacs",
    type: "Official Event",
    subscribed: true,
  },
  {
    id: "sea-to-sky-official",
    name: "Sea to Sky Official",
    type: "Official Event",
    subscribed: true,
  },
];

const placeholderVideos: VideoFeedItem[] = [
  createPlaceholderVideo(
    "placeholder-red-bull",
    "Red Bull Motorsports",
    "Official Brand",
  ),
  createPlaceholderVideo(
    "placeholder-erzberg",
    "Red Bull Erzbergrodeo",
    "Official Event",
  ),
  createPlaceholderVideo("placeholder-romaniacs", "Red Bull Romaniacs", "Official Event"),
  createPlaceholderVideo(
    "placeholder-sea-to-sky",
    "Sea to Sky Official",
    "Official Event",
  ),
  createPlaceholderVideo("placeholder-manuel", "Manuel Lettenbichler", "Official Rider"),
  createPlaceholderVideo("placeholder-media-mike", "Media Mike TV", "Trusted Creator"),
];

function createPlaceholderVideo(
  id: string,
  sourceName: string,
  sourceType: VideoSource["type"],
): VideoFeedItem {
  return {
    id,
    title: null,
    sourceName,
    sourceType,
    contentType: null,
    eventName: null,
    publishedAt: null,
    duration: null,
    verified: false,
    url: null,
    placeholder: true,
  };
}

function classifySourceType(provider: string | null): VideoSource["type"] {
  const normalized = provider?.toLowerCase() ?? "";

  if (normalized.includes("red bull motorsports")) return "Official Brand";
  if (
    normalized.includes("erzberg") ||
    normalized.includes("romaniacs") ||
    normalized.includes("sea to sky")
  ) {
    return "Official Event";
  }
  if (normalized.includes("lettenbichler") || normalized.includes("billy bolt")) {
    return "Official Rider";
  }

  return "Trusted Creator";
}
