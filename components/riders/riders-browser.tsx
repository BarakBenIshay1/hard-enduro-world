"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Bike, Flag, Medal, Search, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export type RiderCardData = {
  id: string;
  slug: string;
  name: string;
  country: string;
  countryCode: string;
  team: string;
  manufacturer: string;
  motorcycle: string;
  status: string;
  wins: number;
  podiums: number;
  championships: number;
  dnfs: number;
  points: number;
};

type RidersBrowserProps = {
  riders: RiderCardData[];
};

const sortOptions = [
  { label: "Name", value: "name" },
  { label: "Wins", value: "wins" },
  { label: "Podiums", value: "podiums" },
  { label: "Championships", value: "championships" },
  { label: "Points", value: "points" },
] as const;

export function RidersBrowser({ riders }: RidersBrowserProps) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("all");
  const [team, setTeam] = useState("all");
  const [manufacturer, setManufacturer] = useState("all");
  const [motorcycle, setMotorcycle] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<(typeof sortOptions)[number]["value"]>("name");

  const countries = useMemo(() => unique(riders.map((rider) => rider.country)), [riders]);
  const teams = useMemo(() => unique(riders.map((rider) => rider.team)), [riders]);
  const manufacturers = useMemo(
    () => unique(riders.map((rider) => rider.manufacturer)),
    [riders],
  );
  const motorcycles = useMemo(
    () => unique(riders.map((rider) => rider.motorcycle)),
    [riders],
  );
  const statuses = useMemo(() => unique(riders.map((rider) => rider.status)), [riders]);

  const visibleRiders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return riders
      .filter(
        (rider) => !normalizedQuery || rider.name.toLowerCase().includes(normalizedQuery),
      )
      .filter((rider) => country === "all" || rider.country === country)
      .filter((rider) => team === "all" || rider.team === team)
      .filter((rider) => manufacturer === "all" || rider.manufacturer === manufacturer)
      .filter((rider) => motorcycle === "all" || rider.motorcycle === motorcycle)
      .filter((rider) => status === "all" || rider.status === status)
      .sort((a, b) => {
        if (sort === "name") {
          return a.name.localeCompare(b.name);
        }

        return b[sort] - a[sort];
      });
  }, [country, manufacturer, motorcycle, query, riders, sort, status, team]);

  return (
    <div className="grid gap-8">
      <Card className="p-4">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(5,1fr)]">
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
                placeholder="Search rider"
                className="h-11 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              />
            </span>
          </label>
          <FilterSelect
            label="Country"
            value={country}
            onChange={setCountry}
            options={countries}
          />
          <FilterSelect label="Team" value={team} onChange={setTeam} options={teams} />
          <FilterSelect
            label="Manufacturer"
            value={manufacturer}
            onChange={setManufacturer}
            options={manufacturers}
          />
          <FilterSelect
            label="Motorcycle"
            value={motorcycle}
            onChange={setMotorcycle}
            options={motorcycles}
          />
          <FilterSelect
            label="Status"
            value={status}
            onChange={setStatus}
            options={statuses}
          />
        </div>
        <div className="mt-3 max-w-xs">
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

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visibleRiders.map((rider) => (
          <RiderCard key={rider.id} rider={rider} />
        ))}
      </div>
    </div>
  );
}

function RiderCard({ rider }: { rider: RiderCardData }) {
  return (
    <Card className="overflow-hidden">
      <div className="relative min-h-72 bg-black">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(0_0%_5%),hsl(220_10%_12%)_42%,hsl(24_92%_18%))]" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent p-5 text-white">
          <Badge className="border-white/[0.16] bg-white/10 text-white">
            {rider.status}
          </Badge>
          <h2 className="mt-4 text-3xl font-semibold">{rider.name}</h2>
          <p className="mt-2 inline-flex items-center gap-2 text-sm text-white/[0.64]">
            <Flag className="h-4 w-4 text-accent" />
            {rider.country}{" "}
            <span className="text-white/[0.42]">({rider.countryCode})</span>
          </p>
        </div>
      </div>

      <div className="grid gap-5 p-5">
        <div className="grid gap-2 text-sm text-foreground/[0.68]">
          <span className="inline-flex items-center gap-2">
            <Trophy className="h-4 w-4 text-accent" />
            {rider.team}
          </span>
          <span className="inline-flex items-center gap-2">
            <Bike className="h-4 w-4 text-accent" />
            {rider.manufacturer} {rider.motorcycle}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <MiniStat label="Wins" value={rider.wins} />
          <MiniStat label="Podiums" value={rider.podiums} />
          <MiniStat label="Titles" value={rider.championships} />
          <MiniStat label="DNF" value={rider.dnfs} />
        </div>

        <ButtonLink href={`/riders/${rider.slug}`} className="w-full">
          Explore Profile <ArrowRight className="ml-2 h-4 w-4" />
        </ButtonLink>
      </div>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-surface-muted p-3">
      <Medal className="h-4 w-4 text-accent" aria-hidden="true" />
      <p className="mt-3 text-xl font-black">{value}</p>
      <p className="text-[0.68rem] uppercase tracking-[0.16em] text-foreground/[0.48]">
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
