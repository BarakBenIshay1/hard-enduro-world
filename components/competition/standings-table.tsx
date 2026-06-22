"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDownUp, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PositionBadge } from "@/components/competition/position-badge";
import { PointsBadge } from "@/components/competition/points-badge";
import { SeasonSelector, type SeasonSelectorOption } from "./season-selector";
import { cn } from "@/lib/cn";

export type StandingRowData = {
  id: string;
  seasonId: string;
  seasonLabel: string;
  className: string;
  position: number | null;
  riderName: string;
  riderSlug: string;
  country: string;
  countryCode: string;
  team: string;
  manufacturer: string;
  motorcycle: string;
  points: number;
  wins: number;
  podiums: number;
  starts: number;
  dnfs: number;
  trend: string;
};

type StandingsTableProps = {
  rows: StandingRowData[];
  seasons: SeasonSelectorOption[];
};

type SortKey = "position" | "points" | "wins" | "podiums" | "dnfs";

const sortOptions = [
  { label: "Position", value: "position" },
  { label: "Points", value: "points" },
  { label: "Wins", value: "wins" },
  { label: "Podiums", value: "podiums" },
  { label: "DNFs", value: "dnfs" },
] as const;

export function StandingsTable({ rows, seasons }: StandingsTableProps) {
  const [season, setSeason] = useState(seasons[0]?.value ?? "all");
  const [className, setClassName] = useState("all");
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("all");
  const [team, setTeam] = useState("all");
  const [manufacturer, setManufacturer] = useState("all");
  const [motorcycle, setMotorcycle] = useState("all");
  const [sort, setSort] = useState<SortKey>("position");

  const classes = useMemo(() => unique(rows.map((row) => row.className)), [rows]);
  const countries = useMemo(() => unique(rows.map((row) => row.country)), [rows]);
  const teams = useMemo(() => unique(rows.map((row) => row.team)), [rows]);
  const manufacturers = useMemo(
    () => unique(rows.map((row) => row.manufacturer)),
    [rows],
  );
  const motorcycles = useMemo(() => unique(rows.map((row) => row.motorcycle)), [rows]);

  const visibleRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return rows
      .filter((row) => season === "all" || row.seasonId === season)
      .filter((row) => className === "all" || row.className === className)
      .filter(
        (row) =>
          !normalizedQuery || row.riderName.toLowerCase().includes(normalizedQuery),
      )
      .filter((row) => country === "all" || row.country === country)
      .filter((row) => team === "all" || row.team === team)
      .filter((row) => manufacturer === "all" || row.manufacturer === manufacturer)
      .filter((row) => motorcycle === "all" || row.motorcycle === motorcycle)
      .sort((a, b) => {
        if (sort === "position") {
          return (
            (a.position ?? Number.MAX_SAFE_INTEGER) -
            (b.position ?? Number.MAX_SAFE_INTEGER)
          );
        }

        return b[sort] - a[sort];
      });
  }, [className, country, manufacturer, motorcycle, query, rows, season, sort, team]);

  return (
    <div className="grid gap-8">
      <Card className="p-4">
        <div className="grid gap-3 xl:grid-cols-[1fr_1fr_1.2fr_repeat(4,1fr)]">
          <SeasonSelector value={season} onChange={setSeason} options={seasons} />
          <FilterSelect
            label="Class"
            value={className}
            onChange={setClassName}
            options={classes}
          />
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
        </div>
        <div className="mt-3 max-w-xs">
          <FilterSelect
            label="Sort"
            value={sort}
            onChange={(value) => setSort(value as SortKey)}
            options={sortOptions.map((option) => option.value)}
            labels={Object.fromEntries(
              sortOptions.map((option) => [option.value, option.label]),
            )}
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1260px] text-left text-sm">
            <thead className="bg-black text-xs uppercase tracking-[0.18em] text-white/[0.64]">
              <tr>
                {[
                  "Position",
                  "Rider",
                  "Country",
                  "Team",
                  "Manufacturer",
                  "Motorcycle",
                  "Points",
                  "Wins",
                  "Podiums",
                  "Starts",
                  "DNFs",
                  "Trend",
                ].map((heading) => (
                  <th key={heading} className="px-5 py-4 font-semibold">
                    <button
                      type="button"
                      onClick={() => updateSortFromHeading(heading, setSort)}
                      className="inline-flex items-center gap-2 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      {heading}
                      {["Position", "Points", "Wins", "Podiums", "DNFs"].includes(
                        heading,
                      ) ? (
                        <ArrowDownUp className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : null}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-5 py-4">
                    <PositionBadge position={row.position} />
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/riders/${row.riderSlug}`}
                      className="font-semibold transition hover:text-accent"
                    >
                      {row.riderName}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    {row.country}{" "}
                    <span className="text-foreground/[0.42]">({row.countryCode})</span>
                  </td>
                  <td className="px-5 py-4 text-foreground/[0.66]">{row.team}</td>
                  <td className="px-5 py-4">{row.manufacturer}</td>
                  <td className="px-5 py-4 text-foreground/[0.66]">{row.motorcycle}</td>
                  <td className="px-5 py-4">
                    <PointsBadge points={row.points} />
                  </td>
                  <td className="px-5 py-4">{row.wins}</td>
                  <td className="px-5 py-4">{row.podiums}</td>
                  <td className="px-5 py-4">{row.starts}</td>
                  <td className="px-5 py-4">{row.dnfs}</td>
                  <td className="px-5 py-4 text-foreground/[0.58]">{row.trend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function updateSortFromHeading(heading: string, setSort: (value: SortKey) => void) {
  const map: Record<string, SortKey> = {
    Position: "position",
    Points: "points",
    Wins: "wins",
    Podiums: "podiums",
    DNFs: "dnfs",
  };

  if (map[heading]) {
    setSort(map[heading]);
  }
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
