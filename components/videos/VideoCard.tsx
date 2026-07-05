"use client";

import {
  BadgeCheck,
  CalendarDays,
  Clock3,
  ExternalLink,
  Film,
  Play,
  Radio,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import type { VideoFeedItem, VideoView } from "./types";

type VideoCardProps = {
  video: VideoFeedItem;
  view: VideoView;
};

export function VideoCard({ video, view }: VideoCardProps) {
  const isList = view === "list";
  const title = video.title ?? "Official video metadata coming soon";

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-lg border border-white/[0.1] bg-surface-muted/70 shadow-[0_20px_70px_rgba(0,0,0,0.22)] transition duration-200 hover:border-accent/40",
        isList && "grid gap-0 md:grid-cols-[minmax(220px,0.42fr)_1fr]",
      )}
    >
      <div
        className={cn(
          "relative min-h-56 overflow-hidden bg-black",
          isList && "md:min-h-full",
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_24%,rgba(245,123,32,0.22),transparent_30%),linear-gradient(135deg,hsl(0_0%_4%),hsl(220_10%_12%)_48%,hsl(22_84%_16%))]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0_18%,rgba(255,255,255,0.06)_18%_19%,transparent_19%_42%,rgba(255,255,255,0.04)_42%_43%,transparent_43%)]" />
        <div className="absolute left-5 top-5 flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.16] bg-white/[0.08] text-white backdrop-blur">
          <Play className="h-6 w-6 fill-accent text-accent" aria-hidden="true" />
          <span className="sr-only">Video thumbnail placeholder</span>
        </div>
        {video.duration ? (
          <span className="absolute bottom-4 right-4 rounded-sm bg-black/72 px-2.5 py-1 text-xs font-semibold text-white">
            {video.duration}
          </span>
        ) : null}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/62 to-transparent p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/48">
            Thumbnail pending approval
          </p>
        </div>
      </div>

      <div className="grid gap-5 p-5">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge className="border-white/12 bg-white/[0.06] text-foreground/76">
              {video.sourceType}
            </Badge>
            {video.verified ? (
              <Badge className="border-emerald-400/30 bg-emerald-400/10 text-emerald-200">
                <BadgeCheck className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                Trusted
              </Badge>
            ) : (
              <Badge className="border-accent/28 bg-accent/10 text-accent">
                Source-aware
              </Badge>
            )}
          </div>
          <h2 className="text-xl font-black leading-tight text-foreground md:text-2xl">
            {title}
          </h2>
          <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-foreground/72">
            <Radio className="h-4 w-4 text-accent" aria-hidden="true" />
            {video.sourceName}
          </p>
        </div>

        <div className="grid gap-2 text-sm text-foreground/58">
          {video.eventName ? (
            <span className="inline-flex items-center gap-2">
              <Film className="h-4 w-4 text-accent" aria-hidden="true" />
              {video.eventName}
            </span>
          ) : null}
          {video.publishedAt ? (
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-accent" aria-hidden="true" />
              {formatDate(new Date(video.publishedAt))}
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-accent" aria-hidden="true" />
              Publish date pending review
            </span>
          )}
        </div>

        <Button type="button" disabled={!video.url} className="w-full opacity-80">
          <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
          Watch
        </Button>
      </div>
    </article>
  );
}
