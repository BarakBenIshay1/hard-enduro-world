"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Bike, Gauge, Medal, Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export type MotorcycleCardData = {
  id: string;
  slug: string;
  manufacturer: string;
  model: string;
  year: string;
  engineCc: string;
  engineCcValue: number;
  strokeType: string;
  weight: string;
  weightValue: number;
  status: string;
  ridersUsingIt: number;
  wins: number;
  podiums: number;
  championships: number;
};

type MotorcyclesBrowserProps = {
  motorcycles: MotorcycleCardData[];
};

const sortOptions = [
  { label: "Model name", value: "model" },
  { label: "Wins", value: "wins" },
  { label: "Podiums", value: "podiums" },
  { label: "Championships", value: "championships" },
  { label: "Weight", value: "weightValue" },
  { label: "Engine CC", value: "engineCcValue" },
] as const;

export function MotorcyclesBrowser({ motorcycles }: MotorcyclesBrowserProps) {
  const [query, setQuery] = useState("");
  const [manufacturer, setManufacturer] = useState("all");
  const [engineCc, setEngineCc] = useState("all");
  const [strokeType, setStrokeType] = useState("all");
  const [year, setYear] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<(typeof sortOptions)[number]["value"]>("model");

  const manufacturers = useMemo(
    () => unique(motorcycles.map((motorcycle) => motorcycle.manufacturer)),
    [motorcycles],
  );
  const engineOptions = useMemo(
    () => unique(motorcycles.map((motorcycle) => motorcycle.engineCc)),
    [motorcycles],
  );
  const strokeOptions = useMemo(
    () => unique(motorcycles.map((motorcycle) => motorcycle.strokeType)),
    [motorcycles],
  );
  const years = useMemo(
    () => unique(motorcycles.map((motorcycle) => motorcycle.year)),
    [motorcycles],
  );
  const statuses = useMemo(
    () => unique(motorcycles.map((motorcycle) => motorcycle.status)),
    [motorcycles],
  );

  const visibleMotorcycles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return motorcycles
      .filter((motorcycle) => {
        const haystack = `${motorcycle.manufacturer} ${motorcycle.model}`.toLowerCase();
        return !normalizedQuery || haystack.includes(normalizedQuery);
      })
      .filter(
        (motorcycle) =>
          manufacturer === "all" || motorcycle.manufacturer === manufacturer,
      )
      .filter((motorcycle) => engineCc === "all" || motorcycle.engineCc === engineCc)
      .filter(
        (motorcycle) => strokeType === "all" || motorcycle.strokeType === strokeType,
      )
      .filter((motorcycle) => year === "all" || motorcycle.year === year)
      .filter((motorcycle) => status === "all" || motorcycle.status === status)
      .sort((a, b) => {
        if (sort === "model") {
          return `${a.manufacturer} ${a.model}`.localeCompare(
            `${b.manufacturer} ${b.model}`,
          );
        }

        return b[sort] - a[sort];
      });
  }, [engineCc, manufacturer, motorcycles, query, sort, status, strokeType, year]);

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
                placeholder="Search motorcycle"
                className="h-11 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              />
            </span>
          </label>
          <FilterSelect
            label="Manufacturer"
            value={manufacturer}
            onChange={setManufacturer}
            options={manufacturers}
          />
          <FilterSelect
            label="Engine"
            value={engineCc}
            onChange={setEngineCc}
            options={engineOptions}
          />
          <FilterSelect
            label="Stroke"
            value={strokeType}
            onChange={setStrokeType}
            options={strokeOptions}
          />
          <FilterSelect label="Year" value={year} onChange={setYear} options={years} />
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
        {visibleMotorcycles.map((motorcycle) => (
          <MotorcycleCard key={motorcycle.id} motorcycle={motorcycle} />
        ))}
      </div>
    </div>
  );
}

function MotorcycleCard({ motorcycle }: { motorcycle: MotorcycleCardData }) {
  return (
    <Card className="overflow-hidden">
      <div className="relative min-h-64 bg-black">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(0_0%_4%),hsl(220_10%_12%)_44%,hsl(22_88%_18%))]" />
        <div className="absolute left-5 top-5 flex h-16 w-16 items-center justify-center rounded-md border border-white/[0.16] bg-white/[0.08] text-white backdrop-blur">
          <Bike className="h-7 w-7 text-accent" aria-hidden="true" />
          <span className="sr-only">Motorcycle image placeholder</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/62 to-transparent p-5 text-white">
          <Badge className="border-white/[0.16] bg-white/10 text-white">
            {motorcycle.status}
          </Badge>
          <h2 className="mt-4 text-2xl font-semibold">
            {motorcycle.manufacturer} {motorcycle.model}
          </h2>
          <p className="mt-2 text-sm text-white/[0.64]">{motorcycle.year}</p>
        </div>
      </div>

      <div className="grid gap-5 p-5">
        <div className="grid gap-2 text-sm text-foreground/[0.68]">
          <span className="inline-flex items-center gap-2">
            <Gauge className="h-4 w-4 text-accent" />
            {motorcycle.engineCc} • {motorcycle.strokeType} • {motorcycle.weight}
          </span>
          <span className="inline-flex items-center gap-2">
            <Users className="h-4 w-4 text-accent" />
            {motorcycle.ridersUsingIt} rider
            {motorcycle.ridersUsingIt === 1 ? "" : "s"} using it
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <MiniStat label="Wins" value={motorcycle.wins} />
          <MiniStat label="Podiums" value={motorcycle.podiums} />
          <MiniStat label="Titles" value={motorcycle.championships} />
        </div>

        <ButtonLink href={`/motorcycles/${motorcycle.slug}`} className="w-full">
          Explore Motorcycle <ArrowRight className="ml-2 h-4 w-4" />
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
