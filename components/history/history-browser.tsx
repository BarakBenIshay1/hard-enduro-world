"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Factory, Search, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export type HistorySeasonCardData = {
  id: string;
  year: number;
  name: string;
  status: string;
  champion: string;
  runnerUp: string;
  eventsCount: number;
  totalRiders: number;
  manufacturerChampion: string;
};

type HistoryBrowserProps = {
  seasons: HistorySeasonCardData[];
};

export function HistoryBrowser({ seasons }: HistoryBrowserProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const statuses = useMemo(
    () => unique(seasons.map((season) => season.status)),
    [seasons],
  );
  const visibleSeasons = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return seasons
      .filter(
        (season) =>
          !normalizedQuery ||
          String(season.year).includes(normalizedQuery) ||
          season.name.toLowerCase().includes(normalizedQuery) ||
          season.champion.toLowerCase().includes(normalizedQuery),
      )
      .filter((season) => status === "all" || season.status === status)
      .sort((a, b) => b.year - a.year);
  }, [query, seasons, status]);

  return (
    <div className="grid gap-8">
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr]">
          <label className="grid gap-2 text-sm">
            <span className="font-semibold text-foreground/[0.64]">Search</span>
            <span className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/[0.42]"
                aria-hidden="true"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search year, season, champion"
                className="h-11 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              />
            </span>
          </label>
          <FilterSelect
            label="Status"
            value={status}
            onChange={setStatus}
            options={statuses}
          />
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {visibleSeasons.map((season) => (
          <SeasonCard key={season.id} season={season} />
        ))}
      </div>
    </div>
  );
}

function SeasonCard({ season }: { season: HistorySeasonCardData }) {
  return (
    <Card className="overflow-hidden">
      <div className="relative min-h-64 bg-black">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(0_0%_4%),hsl(220_10%_12%)_46%,hsl(24_88%_18%))]" />
        <Badge className="absolute right-5 top-5 border-white/[0.16] bg-white/10 text-white">
          {season.status}
        </Badge>
        <div className="absolute left-5 top-5 rounded-md border border-white/[0.14] bg-black/[0.45] px-4 py-3 text-white backdrop-blur">
          <p className="text-xs uppercase tracking-[0.2em] text-white/[0.48]">Season</p>
          <p className="mt-1 text-3xl font-black">{season.year}</p>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/62 to-transparent p-5 text-white">
          <p className="text-sm text-white/[0.58]">{season.name}</p>
          <h2 className="mt-2 text-3xl font-semibold">{season.champion}</h2>
          <p className="mt-2 text-sm text-white/[0.62]">Champion preview</p>
        </div>
      </div>

      <div className="grid gap-5 p-5">
        <div className="grid gap-3 text-sm text-foreground/[0.68] sm:grid-cols-2">
          <span className="inline-flex items-center gap-2">
            <Trophy className="h-4 w-4 text-accent" />
            Runner-up: {season.runnerUp}
          </span>
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-accent" />
            {season.eventsCount} event{season.eventsCount === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-2">
            <Users className="h-4 w-4 text-accent" />
            {season.totalRiders} rider{season.totalRiders === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-2">
            <Factory className="h-4 w-4 text-accent" />
            {season.manufacturerChampion}
          </span>
        </div>

        <ButtonLink href={`/history/${season.year}`} className="w-full">
          Explore Season <ArrowRight className="ml-2 h-4 w-4" />
        </ButtonLink>
      </div>
    </Card>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-semibold text-foreground/[0.64]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-11 rounded-md border border-border bg-surface px-3 text-sm font-semibold",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        )}
      >
        <option value="all">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}
