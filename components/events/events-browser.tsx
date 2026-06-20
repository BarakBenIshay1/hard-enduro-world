"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Flag, Mountain, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export type EventCardData = {
  id: string;
  slug: string;
  name: string;
  country: string;
  countryCode: string;
  season: string;
  year: number;
  dateLabel: string;
  startTimestamp: number;
  status: string;
  elevation: string;
  previousWinner: string;
  stageCount: number;
  riderCount: number;
  finisherCount: number;
};

type EventsBrowserProps = {
  events: EventCardData[];
};

const sortOptions = [
  { label: "Soonest", value: "soonest" },
  { label: "Latest", value: "latest" },
  { label: "Name", value: "name" },
] as const;

export function EventsBrowser({ events }: EventsBrowserProps) {
  const [year, setYear] = useState("all");
  const [country, setCountry] = useState("all");
  const [season, setSeason] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<(typeof sortOptions)[number]["value"]>("soonest");

  const years = useMemo(
    () => unique(events.map((event) => String(event.year))),
    [events],
  );
  const countries = useMemo(() => unique(events.map((event) => event.country)), [events]);
  const seasons = useMemo(() => unique(events.map((event) => event.season)), [events]);
  const statuses = useMemo(() => unique(events.map((event) => event.status)), [events]);

  const visibleEvents = useMemo(() => {
    return events
      .filter((event) => year === "all" || String(event.year) === year)
      .filter((event) => country === "all" || event.country === country)
      .filter((event) => season === "all" || event.season === season)
      .filter((event) => status === "all" || event.status === status)
      .sort((a, b) => {
        if (sort === "latest") {
          return b.startTimestamp - a.startTimestamp;
        }

        if (sort === "name") {
          return a.name.localeCompare(b.name);
        }

        return a.startTimestamp - b.startTimestamp;
      });
  }, [country, events, season, sort, status, year]);

  return (
    <div className="grid gap-8">
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <FilterSelect label="Year" value={year} onChange={setYear} options={years} />
          <FilterSelect
            label="Country"
            value={country}
            onChange={setCountry}
            options={countries}
          />
          <FilterSelect
            label="Season"
            value={season}
            onChange={setSeason}
            options={seasons}
          />
          <FilterSelect
            label="Status"
            value={status}
            onChange={setStatus}
            options={statuses}
          />
          <FilterSelect
            label="Sort"
            value={sort}
            onChange={(value) => setSort(value as typeof sort)}
            options={sortOptions.map((option) => option.value)}
            labels={Object.fromEntries(
              sortOptions.map((option) => [option.value, option.label]),
            )}
          />
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {visibleEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

function EventCard({ event }: { event: EventCardData }) {
  return (
    <Card className="group overflow-hidden">
      <div className="relative min-h-64 overflow-hidden bg-black">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(0_0%_5%),hsl(24_82%_18%)_50%,hsl(42_70%_24%))]" />
        <div className="absolute left-5 top-5 rounded-md border border-white/[0.14] bg-black/[0.45] px-4 py-3 text-white backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
            Event logo
          </p>
          <p className="mt-1 font-black uppercase tracking-[0.16em]">
            {event.countryCode}
          </p>
        </div>
        <Badge className="absolute right-5 top-5 border-white/[0.18] bg-white/10 text-white">
          {event.status}
        </Badge>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent p-5 text-white">
          <p className="text-sm text-white/58">
            {event.season} • {event.dateLabel}
          </p>
          <h2 className="mt-2 text-3xl font-semibold">{event.name}</h2>
        </div>
      </div>

      <div className="grid gap-5 p-5">
        <div className="grid gap-3 text-sm text-foreground/[0.68] sm:grid-cols-2">
          <span className="inline-flex items-center gap-2">
            <Flag className="h-4 w-4 text-accent" />
            {event.country}
          </span>
          <span className="inline-flex items-center gap-2">
            <Mountain className="h-4 w-4 text-accent" />
            {event.elevation}
          </span>
          <span className="inline-flex items-center gap-2">
            <Trophy className="h-4 w-4 text-accent" />
            Previous winner: {event.previousWinner}
          </span>
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-accent" />
            {event.dateLabel}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <MiniStat label="Stages" value={event.stageCount} />
          <MiniStat label="Riders" value={event.riderCount} />
          <MiniStat label="Finishers" value={event.finisherCount} />
        </div>

        <ButtonLink href={`/events/${event.slug}`} className="w-full">
          Explore Event <ArrowRight className="ml-2 h-4 w-4" />
        </ButtonLink>
      </div>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-surface-muted p-3">
      <p className="text-lg font-black">{value}</p>
      <p className="text-xs uppercase tracking-[0.16em] text-foreground/[0.48]">
        {label}
      </p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  labels,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  labels?: Record<string, string>;
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
            {labels?.[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}
