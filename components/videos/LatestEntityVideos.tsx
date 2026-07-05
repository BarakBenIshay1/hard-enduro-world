"use client";

import { filterVideosForEntity } from "./helpers";
import { EntityVideoStrip } from "./EntityVideoStrip";
import type { VideoFeedItem } from "./types";

type LatestEntityVideosProps = {
  videos: VideoFeedItem[];
  title?: string;
  entity:
    | { type: "rider"; id: string }
    | { type: "team"; id: string }
    | { type: "manufacturer"; id: string }
    | { type: "motorcycle"; id: string }
    | { type: "event"; id: string }
    | { type: "stage"; id: string }
    | { type: "season"; year: number }
    | { type: "source"; id: string };
};

export function LatestEntityVideos({
  videos,
  entity,
  title = "Latest videos",
}: LatestEntityVideosProps) {
  const latestVideos = filterVideosForEntity(videos, entity).sort((a, b) => {
    const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bTime - aTime;
  });

  return (
    <EntityVideoStrip
      title={title}
      description="Latest approved video metadata connected to this entity."
      videos={latestVideos}
    />
  );
}
