"use client";

import { useMemo, useState } from "react";
import { Container } from "@/components/ui/container";
import type { VideoFilterState } from "./VideoFilters";
import { VideoFeed } from "./VideoFeed";
import { VideoSubscriptionsSidebar } from "./VideoSubscriptionsSidebar";
import type {
  VideoEventOption,
  VideoFeedItem,
  VideoSort,
  VideoSource,
  VideoTopTab,
  VideoView,
} from "./types";

type VideoHubProps = {
  sources: VideoSource[];
  events: VideoEventOption[];
  videos: VideoFeedItem[];
};

const initialFilters: VideoFilterState = {
  sourceType: "All",
  contentType: "All",
  eventId: "all",
  dateRange: "all",
};

export function VideoHub({ sources, events, videos }: VideoHubProps) {
  const [activeSourceId, setActiveSourceId] = useState("all");
  const [filters, setFilters] = useState<VideoFilterState>(initialFilters);
  const [activeTab, setActiveTab] = useState<VideoTopTab>("all");
  const [sort, setSort] = useState<VideoSort>("newest");
  const [view, setView] = useState<VideoView>("grid");

  const filteredVideos = useMemo(() => {
    const activeSource = sources.find((source) => source.id === activeSourceId);
    const subscribedSourceNames = new Set(
      sources.filter((source) => source.subscribed).map((source) => source.name),
    );
    const now = new Date();

    return videos
      .filter((video) => {
        if (activeSource && video.sourceName !== activeSource.name) return false;
        if (filters.sourceType !== "All" && video.sourceType !== filters.sourceType) {
          return false;
        }
        if (filters.contentType !== "All" && video.contentType !== filters.contentType) {
          return false;
        }
        if (filters.eventId !== "all") {
          const event = events.find((item) => item.id === filters.eventId);
          if (!event || video.eventName !== event.name) return false;
        }
        if (!matchesDateFilter(video.publishedAt, filters.dateRange, now)) {
          return false;
        }
        if (activeTab === "subscribed" && !subscribedSourceNames.has(video.sourceName)) {
          return false;
        }
        if (activeTab === "highlights" && video.contentType !== "Highlights") {
          return false;
        }
        if (activeTab === "races" && video.contentType !== "Full Race") {
          return false;
        }
        if (activeTab === "behind-scenes" && video.contentType !== "Behind the Scenes") {
          return false;
        }
        if (activeTab === "interviews" && video.contentType !== "Interviews") {
          return false;
        }
        return true;
      })
      .sort((a, b) => sortVideos(a, b, sort));
  }, [activeSourceId, activeTab, events, filters, sort, sources, videos]);

  return (
    <Container className="py-12">
      <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        <VideoSubscriptionsSidebar
          sources={sources}
          activeSourceId={activeSourceId}
          onSourceChange={setActiveSourceId}
          filters={filters}
          events={events}
          onFiltersChange={setFilters}
        />
        <VideoFeed
          videos={filteredVideos}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          sort={sort}
          onSortChange={setSort}
          view={view}
          onViewChange={setView}
        />
      </div>
    </Container>
  );
}

function matchesDateFilter(
  publishedAt: string | null,
  dateRange: VideoFilterState["dateRange"],
  now: Date,
) {
  if (dateRange === "all") return true;
  if (!publishedAt) return dateRange === "latest";

  const published = new Date(publishedAt);
  const ageMs = now.getTime() - published.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  if (dateRange === "latest") return true;
  if (dateRange === "week") return ageMs <= 7 * dayMs;
  if (dateRange === "month") return ageMs <= 31 * dayMs;
  if (dateRange === "season") return published.getFullYear() === now.getFullYear();
  return true;
}

function sortVideos(a: VideoFeedItem, b: VideoFeedItem, sort: VideoSort) {
  if (sort === "source") {
    return a.sourceName.localeCompare(b.sourceName);
  }

  const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
  const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;

  return sort === "oldest" ? aTime - bTime : bTime - aTime;
}
