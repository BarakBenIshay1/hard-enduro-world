import type { YouTubeRawVideo } from "@/jobs/connectors/youtube/types";

export async function fetchYouTubeVideosDemo(): Promise<YouTubeRawVideo[]> {
  return [
    {
      id: "demo-hard-enduro-prologue-2026",
      title: "Sample Hard Enduro GP 2026 Prologue Highlights",
      description: "Demo YouTube metadata for the Step 17 connector foundation.",
      thumbnailUrl:
        "https://img.youtube.com/vi/demo-hard-enduro-prologue-2026/hqdefault.jpg",
      channelTitle: "Hard Enduro World Championship",
      publishedAt: "2026-06-04T18:00:00.000Z",
      watchUrl: "https://www.youtube.com/watch?v=demo-hard-enduro-prologue-2026",
    },
    {
      id: "demo-iron-mountain-preview-2026",
      title: "Iron Mountain Course Preview",
      description: "Demo event preview video prepared for review before publishing.",
      thumbnailUrl:
        "https://img.youtube.com/vi/demo-iron-mountain-preview-2026/hqdefault.jpg",
      channelTitle: "Hard Enduro World Championship",
      publishedAt: "2026-05-28T12:00:00.000Z",
      watchUrl: "https://www.youtube.com/watch?v=demo-iron-mountain-preview-2026",
    },
    {
      id: "demo-rider-focus-lettenbichler",
      title: "Rider Focus: Manuel Lettenbichler",
      description: "Demo rider profile video metadata for import review.",
      thumbnailUrl:
        "https://img.youtube.com/vi/demo-rider-focus-lettenbichler/hqdefault.jpg",
      channelTitle: "Hard Enduro World Championship",
      publishedAt: "2026-05-20T09:30:00.000Z",
      watchUrl: "https://www.youtube.com/watch?v=demo-rider-focus-lettenbichler",
    },
  ];
}
