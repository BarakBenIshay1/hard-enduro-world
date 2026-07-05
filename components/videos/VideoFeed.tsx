"use client";

import { LayoutGrid, ListVideo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";
import { VideoCard } from "./VideoCard";
import type { VideoFeedItem, VideoSort, VideoTopTab, VideoView } from "./types";

type VideoFeedProps = {
  videos: VideoFeedItem[];
  activeTab: VideoTopTab;
  onTabChange: (tab: VideoTopTab) => void;
  sort: VideoSort;
  onSortChange: (sort: VideoSort) => void;
  view: VideoView;
  onViewChange: (view: VideoView) => void;
};

const tabs: Array<{ label: string; value: VideoTopTab }> = [
  { label: "All", value: "all" },
  { label: "Subscribed", value: "subscribed" },
  { label: "Highlights", value: "highlights" },
  { label: "Races", value: "races" },
  { label: "Behind the Scenes", value: "behind-scenes" },
  { label: "Interviews", value: "interviews" },
];

export function VideoFeed({
  videos,
  activeTab,
  onTabChange,
  sort,
  onSortChange,
  view,
  onViewChange,
}: VideoFeedProps) {
  return (
    <section aria-labelledby="videos-feed-title" className="min-w-0">
      <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Video Hub
          </p>
          <h1 id="videos-feed-title" className="mt-2 text-4xl font-black md:text-6xl">
            Videos
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-foreground/64">
            Official and trusted Hard Enduro videos from riders, events, teams,
            manufacturers, and media creators.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-foreground/50">
            Sort
            <select
              value={sort}
              onChange={(event) => onSortChange(event.target.value as VideoSort)}
              className="h-11 min-w-40 rounded-md border border-white/[0.12] bg-black/24 px-3 text-sm font-semibold normal-case tracking-normal text-foreground outline-none transition focus:border-accent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="source">Source Name</option>
            </select>
          </label>

          <div
            className="flex h-11 overflow-hidden rounded-md border border-white/[0.12] bg-black/24"
            aria-label="Video view"
          >
            <Button
              type="button"
              variant="ghost"
              aria-pressed={view === "grid"}
              onClick={() => onViewChange("grid")}
              className={cn(
                "h-11 rounded-none px-3",
                view === "grid" && "bg-accent text-accent-foreground",
              )}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Grid view</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              aria-pressed={view === "list"}
              onClick={() => onViewChange("list")}
              className={cn(
                "h-11 rounded-none px-3",
                view === "list" && "bg-accent text-accent-foreground",
              )}
            >
              <ListVideo className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">List view</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-7 flex gap-2 overflow-x-auto rounded-lg border border-white/[0.1] bg-surface-muted/52 p-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onTabChange(tab.value)}
            className={cn(
              "h-10 shrink-0 rounded-md px-4 text-sm font-semibold text-foreground/62 transition hover:text-foreground",
              activeTab === tab.value &&
                "bg-accent text-accent-foreground shadow-[0_14px_34px_hsl(var(--accent)/0.22)]",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {videos.length > 0 ? (
        <div
          className={cn(
            "grid gap-5",
            view === "grid" ? "md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1",
          )}
        >
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} view={view} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Official video metadata coming soon"
          description="Adjust filters or check back after approved media records are reviewed."
        />
      )}
    </section>
  );
}
