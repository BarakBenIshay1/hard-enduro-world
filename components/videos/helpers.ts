import type { VideoFeedItem, VideoSourceType } from "./types";

const sourceTypePriority: Record<VideoSourceType, number> = {
  "Official Event": 1,
  "Official Rider": 2,
  "Official Brand": 3,
  "Trusted Creator": 4,
};

export function getVideoSourcePriority(video: Pick<VideoFeedItem, "sourceType">) {
  return sourceTypePriority[video.sourceType] ?? 99;
}

export function sortVideosBySourcePriority(videos: VideoFeedItem[]) {
  return [...videos].sort((a, b) => {
    const priorityDelta = getVideoSourcePriority(a) - getVideoSourcePriority(b);
    if (priorityDelta !== 0) return priorityDelta;
    return a.sourceName.localeCompare(b.sourceName);
  });
}

export function filterVideosForEntity(
  videos: VideoFeedItem[],
  entity:
    | { type: "rider"; id: string }
    | { type: "team"; id: string }
    | { type: "manufacturer"; id: string }
    | { type: "motorcycle"; id: string }
    | { type: "event"; id: string }
    | { type: "stage"; id: string }
    | { type: "season"; year: number }
    | { type: "source"; id: string },
) {
  return videos.filter((video) => {
    if (entity.type === "season") {
      return video.relations.season?.year === entity.year;
    }

    return video.relations[entity.type]?.id === entity.id;
  });
}
