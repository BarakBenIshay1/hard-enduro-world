"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  EventSelector,
  type EventSelectorOption,
} from "@/components/competition/event-selector";
import { PointsBadge } from "@/components/competition/points-badge";
import { PositionBadge } from "@/components/competition/position-badge";
import { StatusBadge } from "@/components/competition/status-badge";
import {
  SeasonSelector,
  type SeasonSelectorOption,
} from "@/components/competition/season-selector";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { formatOptional } from "@/lib/format";

export type ResultRowData = {
  id: string;
  sourceType: "overall" | "stage";
  seasonId: string;
  eventId: string;
  eventName: string;
  eventSlug: string;
  stageLabel: string;
  riderName: string;
  riderSlug: string;
  country: string;
  countryCode: string;
  team: string;
  manufacturer: string;
  motorcycle: string;
  position: number | null;
  time: string | null;
  gapToLeader: string | null;
  gapToPrevious: string | null;
  penalties: string | null;
  points: number | null;
  status: string;
};

type ResultsTableProps = {
  rows: ResultRowData[];
  seasons: SeasonSelectorOption[];
  events: EventSelectorOption[];
};

export function ResultsTable({ rows, seasons, events }: ResultsTableProps) {
  const [season, setSeason] = useState(seasons[0]?.value ?? "all");
  const [event, setEvent] = useState("all");
  const [stage, setStage] = useState("all");
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("all");
  const [team, setTeam] = useState("all");
  const [manufacturer, setManufacturer] = useState("all");
  const [motorcycle, setMotorcycle] = useState("all");
  const [status, setStatus] = useState("all");

  const stages = useMemo(() => unique(rows.map((row) => row.stageLabel)), [rows]);
  const countries = useMemo(() => unique(rows.map((row) => row.country)), [rows]);
  const teams = useMemo(() => unique(rows.map((row) => row.team)), [rows]);
  const manufacturers = useMemo(
    () => unique(rows.map((row) => row.manufacturer)),
    [rows],
  );
  const motorcycles = useMemo(() => unique(rows.map((row) => row.motorcycle)), [rows]);
  const statuses = useMemo(() => unique(rows.map((row) => row.status)), [rows]);

  const visibleRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return rows
      .filter((row) => season === "all" || row.seasonId === season)
      .filter((row) => event === "all" || row.eventId === event)
      .filter((row) => stage === "all" || row.stageLabel === stage)
      .filter(
        (row) =>
          !normalizedQuery || row.riderName.toLowerCase().includes(normalizedQuery),
      )
      .filter((row) => country === "all" || row.country === country)
      .filter((row) => team === "all" || row.team === team)
      .filter((row) => manufacturer === "all" || row.manufacturer === manufacturer)
      .filter((row) => motorcycle === "all" || row.motorcycle === motorcycle)
      .filter((row) => status === "all" || row.status === status)
      .sort(
        (a, b) =>
          (a.position ?? Number.MAX_SAFE_INTEGER) -
          (b.position ?? Number.MAX_SAFE_INTEGER),
      );
  }, [
    country,
    event,
    manufacturer,
    motorcycle,
    query,
    rows,
    season,
    stage,
    status,
    team,
  ]);

  return (
    <div className="grid gap-8">
      <Card className="p-4">
        <div className="grid gap-3 xl:grid-cols-[1fr_1fr_1fr_1.2fr_repeat(5,1fr)]">
          <SeasonSelector value={season} onChange={setSeason} options={seasons} />
          <EventSelector value={event} onChange={setEvent} options={events} />
          <FilterSelect
            label="Stage"
            value={stage}
            onChange={setStage}
            options={stages}
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
                onChange={(nextEvent) => setQuery(nextEvent.target.value)}
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
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1540px] text-left text-sm">
            <thead className="bg-black text-xs uppercase tracking-[0.18em] text-white/[0.64]">
              <tr>
                {[
                  "Position",
                  "Rider",
                  "Country",
                  "Team",
                  "Manufacturer",
                  "Motorcycle",
                  "Event",
                  "Stage / Overall",
                  "Time",
                  "Gap leader",
                  "Gap previous",
                  "Penalties",
                  "Points",
                  "Status",
                ].map((heading) => (
                  <th key={heading} className="px-5 py-4 font-semibold">
                    {heading}
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
                    <Link
                      href={`/events/${row.eventSlug}`}
                      className="font-semibold transition hover:text-accent"
                    >
                      {row.eventName}
                    </Link>
                  </td>
                  <td className="px-5 py-4">{row.stageLabel}</td>
                  <td className="px-5 py-4 font-mono">{formatOptional(row.time)}</td>
                  <td className="px-5 py-4 font-mono">
                    {formatOptional(row.gapToLeader)}
                  </td>
                  <td className="px-5 py-4 font-mono">
                    {formatOptional(row.gapToPrevious)}
                  </td>
                  <td className="px-5 py-4 font-mono">{formatOptional(row.penalties)}</td>
                  <td className="px-5 py-4">
                    <PointsBadge points={row.points} />
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
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
