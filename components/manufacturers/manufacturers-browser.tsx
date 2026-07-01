"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Bike, Factory, Flag, Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export type ManufacturerCardData = {
  id: string;
  slug: string;
  name: string;
  country: string;
  countryCode: string;
  status: string;
  season: string;
  motorcycleModels: string[];
  activeTeams: number;
  activeRiders: number;
  championships: number;
  wins: number;
  podiums: number;
  overview: string;
};

type ManufacturersBrowserProps = {
  manufacturers: ManufacturerCardData[];
};

const sortOptions = [
  { label: "Name", value: "name" },
  { label: "Active models", value: "models" },
  { label: "Riders", value: "riders" },
  { label: "Factory connections", value: "teams" },
] as const;

export function ManufacturersBrowser({ manufacturers }: ManufacturersBrowserProps) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("all");
  const [status, setStatus] = useState("all");
  const [season, setSeason] = useState("all");
  const [sort, setSort] = useState<(typeof sortOptions)[number]["value"]>("name");

  const countries = useMemo(
    () => unique(manufacturers.map((manufacturer) => manufacturer.country)),
    [manufacturers],
  );
  const statuses = useMemo(
    () => unique(manufacturers.map((manufacturer) => manufacturer.status)),
    [manufacturers],
  );
  const seasons = useMemo(
    () => unique(manufacturers.map((manufacturer) => manufacturer.season)),
    [manufacturers],
  );

  const visibleManufacturers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return manufacturers
      .filter(
        (manufacturer) =>
          !normalizedQuery || manufacturer.name.toLowerCase().includes(normalizedQuery),
      )
      .filter((manufacturer) => country === "all" || manufacturer.country === country)
      .filter((manufacturer) => status === "all" || manufacturer.status === status)
      .filter((manufacturer) => season === "all" || manufacturer.season === season)
      .sort((a, b) => {
        if (sort === "name") {
          return a.name.localeCompare(b.name);
        }

        if (sort === "models") {
          return b.motorcycleModels.length - a.motorcycleModels.length;
        }

        if (sort === "riders") {
          return b.activeRiders - a.activeRiders;
        }

        return b.activeTeams - a.activeTeams;
      });
  }, [country, manufacturers, query, season, sort, status]);

  return (
    <div className="grid gap-8">
      <Card className="p-4">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
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
                placeholder="Search manufacturer"
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
          <FilterSelect
            label="Status"
            value={status}
            onChange={setStatus}
            options={statuses}
          />
          <FilterSelect
            label="Season"
            value={season}
            onChange={setSeason}
            options={seasons}
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
        {visibleManufacturers.map((manufacturer) => (
          <ManufacturerCard key={manufacturer.id} manufacturer={manufacturer} />
        ))}
      </div>
    </div>
  );
}

function ManufacturerCard({ manufacturer }: { manufacturer: ManufacturerCardData }) {
  return (
    <Card className="overflow-hidden">
      <div className="relative min-h-64 bg-black">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(0_0%_4%),hsl(220_10%_12%)_44%,hsl(20_86%_18%))]" />
        <div className="absolute left-5 top-5 flex h-16 w-16 items-center justify-center rounded-md border border-white/[0.16] bg-white/[0.08] text-white backdrop-blur">
          <Factory className="h-7 w-7 text-accent" aria-hidden="true" />
          <span className="sr-only">Manufacturer brand badge placeholder</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/62 to-transparent p-5 text-white">
          <Badge className="border-white/[0.16] bg-white/10 text-white">
            {manufacturer.status}
          </Badge>
          <h2 className="mt-4 text-2xl font-semibold">{manufacturer.name}</h2>
          <p className="mt-2 inline-flex items-center gap-2 text-sm text-white/[0.64]">
            <Flag className="h-4 w-4 text-accent" />
            {manufacturer.country}{" "}
            <span className="text-white/[0.42]">({manufacturer.countryCode})</span>
          </p>
        </div>
      </div>

      <div className="grid gap-5 p-5">
        <div className="grid gap-2 text-sm text-foreground/[0.68]">
          <span className="inline-flex items-center gap-2">
            <Bike className="h-4 w-4 text-accent" />
            {manufacturer.motorcycleModels.length} active model
            {manufacturer.motorcycleModels.length === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-2">
            <Users className="h-4 w-4 text-accent" />
            {manufacturer.activeRiders} rider
            {manufacturer.activeRiders === 1 ? "" : "s"}
            {" using the brand"}
          </span>
          <span className="inline-flex items-center gap-2">
            <Factory className="h-4 w-4 text-accent" />
            {manufacturer.activeTeams} factory connection
            {manufacturer.activeTeams === 1 ? "" : "s"}
          </span>
        </div>

        <p className="text-sm leading-6 text-foreground/[0.64]">
          {manufacturer.overview}
        </p>

        {manufacturer.motorcycleModels.length > 0 ? (
          <div className="rounded-md border border-border bg-surface-muted p-3">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-foreground/[0.48]">
              Models
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground/[0.74]">
              {manufacturer.motorcycleModels.slice(0, 3).join(" / ")}
              {manufacturer.motorcycleModels.length > 3 ? " / more" : ""}
            </p>
          </div>
        ) : null}

        <PerformanceSummary />

        <ButtonLink href={`/manufacturers/${manufacturer.slug}`} className="w-full">
          Explore Manufacturer <ArrowRight className="ml-2 h-4 w-4" />
        </ButtonLink>
      </div>
    </Card>
  );
}

function PerformanceSummary() {
  return (
    <div className="rounded-md border border-border bg-surface-muted p-3 text-sm font-semibold text-foreground/[0.62]">
      Verified performance data coming soon
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
