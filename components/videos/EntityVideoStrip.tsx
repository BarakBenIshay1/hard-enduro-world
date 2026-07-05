"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { VideoCard } from "./VideoCard";
import type { VideoFeedItem } from "./types";

type EntityVideoStripProps = {
  title: string;
  description?: string;
  videos: VideoFeedItem[];
  limit?: number;
};

export function EntityVideoStrip({
  title,
  description,
  videos,
  limit = 4,
}: EntityVideoStripProps) {
  const visibleVideos = videos.slice(0, limit);

  return (
    <section aria-labelledby={titleId(title)} className="grid gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Video
        </p>
        <h2 id={titleId(title)} className="mt-2 text-2xl font-black md:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground/62">
            {description}
          </p>
        ) : null}
      </div>

      {visibleVideos.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {visibleVideos.map((video) => (
            <VideoCard key={video.id} video={video} view="grid" />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Video metadata will appear here once approved sources are connected."
          description="Approved official and trusted videos can be shown here when they are related to this page."
        />
      )}
    </section>
  );
}

function titleId(title: string) {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-videos`;
}
