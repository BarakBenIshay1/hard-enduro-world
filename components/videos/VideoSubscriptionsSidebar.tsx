"use client";

import { BadgeCheck, Bell, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { VideoFilters, type VideoFilterState } from "./VideoFilters";
import type { VideoEventOption, VideoSource } from "./types";

type VideoSubscriptionsSidebarProps = {
  sources: VideoSource[];
  activeSourceId: string;
  onSourceChange: (sourceId: string) => void;
  filters: VideoFilterState;
  events: VideoEventOption[];
  onFiltersChange: (filters: VideoFilterState) => void;
};

export function VideoSubscriptionsSidebar({
  sources,
  activeSourceId,
  onSourceChange,
  filters,
  events,
  onFiltersChange,
}: VideoSubscriptionsSidebarProps) {
  return (
    <aside className="rounded-xl border border-white/[0.1] bg-surface-muted/64 p-4 lg:sticky lg:top-24 lg:self-start">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Sources
          </p>
          <h2 className="mt-1 text-2xl font-black">Official & Trusted Sources</h2>
        </div>
        <Bell className="h-5 w-5 text-accent" aria-hidden="true" />
      </div>

      <div className="grid gap-2">
        <button
          type="button"
          onClick={() => onSourceChange("all")}
          className={cn(
            "flex items-center gap-3 rounded-lg border border-white/[0.08] bg-black/18 p-3 text-left transition hover:border-accent/40",
            activeSourceId === "all" && "border-accent/60 bg-accent/10",
          )}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/[0.06]">
            <Radio className="h-5 w-5 text-accent" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-black">All Sources</span>
            <span className="block text-xs text-foreground/52">
              Official and trusted channels
            </span>
          </span>
        </button>

        {sources.map((source) => (
          <button
            key={source.id}
            type="button"
            onClick={() => onSourceChange(source.id)}
            className={cn(
              "flex items-center gap-3 rounded-lg border border-white/[0.08] bg-black/18 p-3 text-left transition hover:border-accent/40",
              activeSourceId === source.id && "border-accent/60 bg-accent/10",
            )}
          >
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/12 bg-[radial-gradient(circle_at_35%_25%,rgba(245,123,32,0.35),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] text-sm font-black">
              {initials(source.name)}
              {source.featured ? (
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-surface-muted bg-emerald-400" />
              ) : null}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-black">{source.name}</span>
              <span className="mt-1 flex flex-wrap items-center gap-1.5">
                {source.featured ? (
                  <Badge className="border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-200">
                    <BadgeCheck className="mr-1 h-3 w-3" aria-hidden="true" />
                    Featured
                  </Badge>
                ) : null}
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className="my-6 h-px bg-white/[0.1]" />

      <VideoFilters filters={filters} events={events} onChange={onFiltersChange} />
    </aside>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
