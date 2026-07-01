"use client";

import { useMemo, useState } from "react";
import { Check, Map as MapIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import type { RacePhase } from "./race-status";
import type { EventStageCard } from "./types";

type CourseMapsBlockProps = {
  stages: EventStageCard[];
  racePhase: RacePhase;
};

type StageProgressState = "upcoming" | "completed" | "live";

export function CourseMapsBlock({ stages, racePhase }: CourseMapsBlockProps) {
  const [selectedStageId, setSelectedStageId] = useState(stages[0]?.id ?? "");
  const selectedStage = useMemo(
    () => stages.find((stage) => stage.id === selectedStageId) ?? stages[0] ?? null,
    [selectedStageId, stages],
  );
  const stageStates = useMemo(
    () => getStageProgressStates(stages, racePhase),
    [racePhase, stages],
  );

  if (stages.length === 0 || !selectedStage) {
    return null;
  }

  const routeDetails = [
    { label: "Distance", value: selectedStage.distance },
    { label: "Terrain", value: selectedStage.terrain },
    { label: "Elevation", value: selectedStage.elevation },
  ].filter((item) => hasVerifiedValue(item.value));

  return (
    <Card className="overflow-hidden p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Course Maps
          </p>
          <h3 className="mt-1 text-xl font-black">Course Maps</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground/[0.62]">
            Browse the official stages of this event. Official course maps will appear
            here after verification.
          </p>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto pb-1" aria-label="Stage progress">
        <div className="flex min-w-max items-center gap-2">
          {stages.map((stage, index) => (
            <StageProgressItem
              key={stage.id}
              name={stage.name}
              state={stageStates.get(stage.id) ?? "upcoming"}
              trailing={index < stages.length - 1}
            />
          ))}
        </div>
      </div>

      <div
        className="mt-4 flex gap-2 overflow-x-auto pb-1"
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
              {hasVerifiedValue(stage.distance) ? (
                <span className="mt-2 block text-xs text-current/62">
                  {stage.distance}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div
        className={cn(
          "mt-5 grid gap-4",
          routeDetails.length > 0 && "lg:grid-cols-[1.05fr_0.95fr]",
        )}
      >
        <div className="relative min-h-[280px] overflow-hidden rounded-md border border-border bg-black text-white">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(0_0%_5%),hsl(0_0%_12%)_48%,hsl(24_72%_18%))]" />
          <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_24%_24%,hsl(24_94%_52%/0.22),transparent_28%),linear-gradient(145deg,transparent_0_44%,hsl(0_0%_100%/0.08)_44%_45%,transparent_45%)]" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/72 to-transparent p-5">
            <MapIcon className="h-5 w-5 text-accent" aria-hidden="true" />
            <h4 className="mt-4 text-2xl font-black">Official course map coming soon</h4>
            <p className="mt-2 max-w-md text-sm leading-6 text-white/[0.64]">
              {selectedStage.name}
            </p>
          </div>
        </div>

        {routeDetails.length > 0 ? (
          <div className="grid content-start gap-3">
            {routeDetails.map((item) => (
              <RouteDetail key={item.label} label={item.label} value={item.value} />
            ))}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function RouteDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-muted px-3 py-2 text-sm">
      <span className="text-foreground/[0.56]">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}

function StageProgressItem({
  name,
  state,
  trailing,
}: {
  name: string;
  state: StageProgressState;
  trailing: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold",
          state === "completed" &&
            "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
          state === "live" &&
            "border-red-500/50 bg-red-500/15 text-red-200 shadow-[0_0_20px_hsl(0_84%_60%/0.24)]",
          state === "upcoming" && "border-border bg-surface-muted text-foreground/[0.54]",
        )}
      >
        <StageStateIcon state={state} />
        <span className="max-w-[170px] truncate">{name}</span>
      </div>
      {trailing ? <span className="h-px w-6 bg-border" aria-hidden="true" /> : null}
    </div>
  );
}

function StageStateIcon({ state }: { state: StageProgressState }) {
  if (state === "completed") {
    return <Check className="h-3.5 w-3.5" aria-hidden="true" />;
  }

  if (state === "live") {
    return (
      <span
        className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_14px_hsl(0_84%_60%/0.85)] motion-safe:animate-pulse"
        aria-hidden="true"
      />
    );
  }

  return (
    <span
      className="h-2.5 w-2.5 rounded-full border border-current/50"
      aria-hidden="true"
    />
  );
}

function getStageProgressStates(stages: EventStageCard[], racePhase: RacePhase) {
  const states = new Map<string, StageProgressState>();

  if (racePhase === "race-completed") {
    stages.forEach((stage) => states.set(stage.id, "completed"));
    return states;
  }

  if (racePhase === "coming-soon") {
    stages.forEach((stage) => states.set(stage.id, "upcoming"));
    return states;
  }

  const firstOpenStage = stages.find((stage) => stage.resultCount === 0);

  stages.forEach((stage) => {
    if (stage.resultCount > 0) {
      states.set(stage.id, "completed");
      return;
    }

    states.set(stage.id, stage.id === firstOpenStage?.id ? "live" : "upcoming");
  });

  return states;
}

function hasVerifiedValue(value: string) {
  const normalized = value.trim().toLowerCase();
  return (
    normalized !== "" &&
    normalized !== "tbc" &&
    !normalized.includes("tbc") &&
    !normalized.includes("pending")
  );
}
