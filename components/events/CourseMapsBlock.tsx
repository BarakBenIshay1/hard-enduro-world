"use client";

import { useMemo, useState } from "react";
import { Map, Route } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import type { EventStageCard } from "./types";

type CourseMapsBlockProps = {
  stages: EventStageCard[];
};

export function CourseMapsBlock({ stages }: CourseMapsBlockProps) {
  const [selectedStageId, setSelectedStageId] = useState(stages[0]?.id ?? "");
  const selectedStage = useMemo(
    () => stages.find((stage) => stage.id === selectedStageId) ?? stages[0] ?? null,
    [selectedStageId, stages],
  );

  if (stages.length === 0 || !selectedStage) {
    return null;
  }

  return (
    <Card className="mt-4 overflow-hidden p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Course Maps
          </p>
          <h3 className="mt-1 text-xl font-black">Stage route overview</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground/[0.62]">
            Tabs are generated from the event stage data. Official map imagery, GPX files,
            PDF maps, and source metadata can be attached later after verification.
          </p>
        </div>
        <StatusBadge label="Official maps pending" />
      </div>

      <div
        className="mt-5 flex gap-2 overflow-x-auto pb-1"
        role="tablist"
        aria-label="Course map stages"
      >
        {stages.map((stage) => {
          const selected = stage.id === selectedStage.id;

          return (
            <button
              key={stage.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setSelectedStageId(stage.id)}
              className={cn(
                "min-w-[170px] rounded-md border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                selected
                  ? "border-accent/70 bg-accent/12 text-accent"
                  : "border-border bg-surface-muted hover:border-accent hover:text-accent",
              )}
            >
              <span className="block text-xs font-semibold uppercase tracking-[0.14em]">
                Stage {stage.order}
              </span>
              <span className="mt-1 block truncate text-sm font-black">{stage.name}</span>
              <span className="mt-2 block text-xs text-current/62">{stage.distance}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative min-h-[280px] overflow-hidden rounded-md border border-border bg-black text-white">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(0_0%_5%),hsl(0_0%_12%)_48%,hsl(24_72%_18%))]" />
          <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_24%_24%,hsl(24_94%_52%/0.22),transparent_28%),linear-gradient(145deg,transparent_0_44%,hsl(0_0%_100%/0.08)_44%_45%,transparent_45%)]" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/72 to-transparent p-5">
            <Map className="h-5 w-5 text-accent" aria-hidden="true" />
            <h4 className="mt-4 text-2xl font-black">{selectedStage.name}</h4>
            <p className="mt-2 max-w-md text-sm leading-6 text-white/[0.64]">
              Official course map pending verification.
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          <RouteDetail label="Distance" value={selectedStage.distance} />
          <RouteDetail label="Terrain" value={selectedStage.terrain} />
          <RouteDetail label="Elevation gain" value="TBC" />
          <RouteDetail label="Key sections" value="TBC" />
          <RouteDetail label="Official source status" value="Pending verification" />
          <div className="rounded-md border border-dashed border-border bg-surface-muted p-4">
            <div className="flex items-center gap-2">
              <Route className="h-4 w-4 text-accent" aria-hidden="true" />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/[0.48]">
                Future attachments
              </p>
            </div>
            <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
              Official map image, GPS/GPX file, route preview, PDF map, and source
              metadata are supported by this layout once approved data exists.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

function RouteDetail({ label, value }: { label: string; value: string }) {
  const hasValue = value !== "TBC" && !value.toLowerCase().includes("tbc");

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-muted px-3 py-2 text-sm">
      <span className="text-foreground/[0.56]">{label}</span>
      {hasValue ? (
        <span className="text-right font-semibold">{value}</span>
      ) : (
        <StatusBadge label="TBC" />
      )}
    </div>
  );
}

function StatusBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex w-fit rounded-sm border border-dashed border-border bg-surface px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground/[0.52]">
      {label}
    </span>
  );
}
