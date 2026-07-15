"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Bike, Factory, Flag, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export type ManufacturerCardData = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  country: string;
  countryCode: string;
  status: string;
  season: string;
  motorcycleModels: string[];
  riderNames: string[];
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
  { label: "Alphabetical (A–Z)", value: "name-asc" },
  { label: "Alphabetical (Z–A)", value: "name-desc" },
  { label: "Most Riders", value: "riders" },
  { label: "Most Factory Teams", value: "teams" },
] as const;

const manufacturerOptions = [
  "KTM",
  "Sherco",
  "Beta",
  "GASGAS",
  "Husqvarna",
  "Rieju",
  "TM Racing",
  "Honda",
];

const riderOptions = [
  "Manuel Lettenbichler",
  "Billy Bolt",
  "Mario Roman",
  "Trystan Hart",
  "Alfredo Gomez",
];

const motorcycleModelOptions = [
  "KTM 300 EXC",
  "Husqvarna TE 300",
  "Sherco 300 SE Factory",
  "Beta RR Racing",
  "GASGAS EC 300",
  "TM MC 300",
];

export function ManufacturersBrowser({ manufacturers }: ManufacturersBrowserProps) {
  const [manufacturerFilter, setManufacturerFilter] = useState("all");
  const [riderFilter, setRiderFilter] = useState("all");
  const [motorcycleFilter, setMotorcycleFilter] = useState("all");
  const [sort, setSort] = useState<(typeof sortOptions)[number]["value"]>("name-asc");

  const visibleManufacturers = useMemo(() => {
    return manufacturers
      .filter((manufacturer) =>
        matchesManufacturerFilters(manufacturer, {
          manufacturer: manufacturerFilter,
          rider: riderFilter,
          motorcycle: motorcycleFilter,
        }),
      )
      .sort((a, b) => {
        if (sort === "name-asc") {
          return a.name.localeCompare(b.name);
        }

        if (sort === "name-desc") {
          return b.name.localeCompare(a.name);
        }

        if (sort === "riders") {
          return b.activeRiders - a.activeRiders;
        }

        return b.activeTeams - a.activeTeams;
      });
  }, [manufacturerFilter, manufacturers, motorcycleFilter, riderFilter, sort]);

  return (
    <div className="grid gap-8">
      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <FilterSelect
            label="Sort"
            value={sort}
            onChange={(value) => setSort(value as typeof sort)}
            options={sortOptions.map((option) => option.value)}
            labels={Object.fromEntries(
              sortOptions.map((option) => [option.value, option.label]),
            )}
          />
          <FilterSelect
            label="Manufacturers"
            value={manufacturerFilter}
            onChange={setManufacturerFilter}
            options={manufacturerOptions}
            includeAll
          />
          <FilterSelect
            label="Riders"
            value={riderFilter}
            onChange={setRiderFilter}
            options={riderOptions}
            includeAll
          />
          <FilterSelect
            label="Motorcycle Models"
            value={motorcycleFilter}
            onChange={setMotorcycleFilter}
            options={motorcycleModelOptions}
            includeAll
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

function matchesManufacturerFilters(
  manufacturer: ManufacturerCardData,
  filters: { manufacturer: string; rider: string; motorcycle: string },
) {
  const manufacturerMatches =
    filters.manufacturer === "all" ||
    normalize(manufacturer.name).includes(normalize(filters.manufacturer));
  const riderMatches =
    filters.rider === "all" ||
    manufacturer.riderNames.some((name) =>
      normalize(name).includes(normalize(filters.rider)),
    );
  const motorcycleMatches =
    filters.motorcycle === "all" ||
    manufacturer.motorcycleModels.some((model) =>
      normalize(`${manufacturer.name} ${model}`).includes(normalize(filters.motorcycle)),
    );

  return manufacturerMatches && riderMatches && motorcycleMatches;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function ManufacturerCard({ manufacturer }: { manufacturer: ManufacturerCardData }) {
  return (
    <Card className="overflow-hidden">
      <div className="relative min-h-64 bg-black">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(0_0%_4%),hsl(220_10%_12%)_44%,hsl(20_86%_18%))]" />
        <div className="absolute left-5 top-5 flex h-16 w-16 items-center justify-center rounded-md border border-white/[0.16] bg-white/[0.08] text-white backdrop-blur">
          {manufacturer.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- CMS logos are stored in approved media storage.
            <img
              src={manufacturer.logoUrl}
              alt={`${manufacturer.name} logo`}
              className="h-full w-full object-contain p-2"
            />
          ) : (
            <>
              <Factory className="h-7 w-7 text-accent" aria-hidden="true" />
              <span className="sr-only">Manufacturer brand badge placeholder</span>
            </>
          )}
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
  includeAll = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  labels?: Record<string, string>;
  includeAll?: boolean;
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
        {includeAll ? <option value="all">All</option> : null}
        {options.map((option) => (
          <option key={option} value={option}>
            {labels?.[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}
