"use client";

import { filterVideosForEntity, sortVideosBySourcePriority } from "./helpers";
import { EntityVideoStrip } from "./EntityVideoStrip";
import type { VideoFeedItem } from "./types";

type RelatedVideosProps = {
  videos: VideoFeedItem[];
  entity:
    | { type: "rider"; id: string; name: string }
    | { type: "team"; id: string; name: string }
    | { type: "manufacturer"; id: string; name: string }
    | { type: "motorcycle"; id: string; name: string }
    | { type: "event"; id: string; name: string }
    | { type: "stage"; id: string; name: string }
    | { type: "season"; year: number; name: string }
    | { type: "source"; id: string; name: string };
};

export function RelatedVideos({ videos, entity }: RelatedVideosProps) {
  const relatedVideos = sortVideosBySourcePriority(
    filterVideosForEntity(
      videos,
      entity.type === "season"
        ? { type: "season", year: entity.year }
        : { type: entity.type, id: entity.id },
    ),
  );

  return (
    <EntityVideoStrip
      title={`Related videos: ${entity.name}`}
      description="Approved official and trusted videos connected to this page."
      videos={relatedVideos}
    />
  );
}
