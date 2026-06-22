"use client";

import { useMemo, useState } from "react";
import { Bike, Factory, Flag, Search, Trophy, Users } from "lucide-react";
import {
  SeasonSelector,
  type SeasonSelectorOption,
} from "@/components/competition/season-selector";
import { Card } from "@/components/ui/card";
import { ChartPlaceholder } from "@/components/statistics/chart-placeholder";
import { MetricCard } from "@/components/statistics/metric-card";
import { StatLeaderboard } from "@/components/statistics/stat-leaderboard";
import type { PointsLeader, StatisticFact } from "@/db/statistics";
import { cn } from "@/lib/cn";

type StatisticsExplorerProps = {
  seasons: SeasonSelectorOption[];
  facts: StatisticFact[];
  pointsLeaders: PointsLeader[];
};

export function StatisticsExplorer({
  seasons,
  facts,
  pointsLeaders,
}: StatisticsExplorerProps) {
  const [season, setSeason] = useState(seasons[0]?.value ?? "all");
  const [className, setClassName] = useState("all");
  const [country, setCountry] = useState("all");
  const [team, setTeam] = useState("all");
  const [manufacturer, setManufacturer] = useState("all");
  const [motorcycle, setMotorcycle] = useState("all");
  const [query, setQuery] = useState("");

  const classes = useMemo(() => unique(facts.map((fact) => fact.className)), [facts]);
  const countries = useMemo(() => unique(facts.map((fact) => fact.country)), [facts]);
  const teams = useMemo(() => unique(facts.map((fact) => fact.team)), [facts]);
  const manufacturers = useMemo(
    () => unique(facts.map((fact) => fact.manufacturer)),
    [facts],
  );
  const motorcycles = useMemo(
    () => unique(facts.map((fact) => fact.motorcycle)),
    [facts],
  );

  const filteredFacts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return facts
      .filter((fact) => season === "all" || fact.seasonId === season)
      .filter((fact) => className === "all" || fact.className === className)
      .filter((fact) => country === "all" || fact.country === country)
      .filter((fact) => team === "all" || fact.team === team)
      .filter((fact) => manufacturer === "all" || fact.manufacturer === manufacturer)
      .filter((fact) => motorcycle === "all" || fact.motorcycle === motorcycle)
      .filter(
        (fact) =>
          !normalizedQuery ||
          fact.riderName.toLowerCase().includes(normalizedQuery) ||
          fact.eventName.toLowerCase().includes(normalizedQuery),
      );
  }, [className, country, facts, manufacturer, motorcycle, query, season, team]);

  const totalResults = filteredFacts.length;
  const finishers = filteredFacts.filter((fact) => fact.status === "FINISHED").length;
  const dnfs = filteredFacts.filter((fact) => fact.status === "DNF").length;
  const positions = filteredFacts
    .map((fact) => fact.position)
    .filter((value): value is number => typeof value === "number");
  const averageFinish =
    positions.length > 0
      ? (positions.reduce((sum, value) => sum + value, 0) / positions.length).toFixed(1)
      : "TBC";
  const finishRate =
    totalResults > 0 ? `${Math.round((finishers / totalResults) * 100)}%` : "TBC";

  const winsByRider = aggregate(filteredFacts.filter(isWin), (fact) => fact.riderName, {
    href: (fact) => `/riders/${fact.riderSlug}`,
    detail: (fact) => fact.country,
  });
  const winsByCountry = aggregate(filteredFacts.filter(isWin), (fact) => fact.country);
  const winsByManufacturer = aggregate(
    filteredFacts.filter(isWin),
    (fact) => fact.manufacturer,
    {
      href: (fact) =>
        fact.manufacturerSlug ? `/manufacturers/${fact.manufacturerSlug}` : undefined,
    },
  );
  const podiumsByRider = aggregate(
    filteredFacts.filter(isPodium),
    (fact) => fact.riderName,
    {
      href: (fact) => `/riders/${fact.riderSlug}`,
      detail: (fact) => fact.country,
    },
  );
  const podiumsByManufacturer = aggregate(
    filteredFacts.filter(isPodium),
    (fact) => fact.manufacturer,
    {
      href: (fact) =>
        fact.manufacturerSlug ? `/manufacturers/${fact.manufacturerSlug}` : undefined,
    },
  );
  const manufacturerPerformance = aggregate(filteredFacts, (fact) => fact.manufacturer, {
    href: (fact) =>
      fact.manufacturerSlug ? `/manufacturers/${fact.manufacturerSlug}` : undefined,
  });
  const motorcyclePerformance = aggregate(filteredFacts, (fact) => fact.motorcycle, {
    href: (fact) =>
      fact.motorcycleSlug ? `/motorcycles/${fact.motorcycleSlug}` : undefined,
    detail: (fact) => fact.manufacturer,
  });
  const filteredPointsLeaders = pointsLeaders.filter(
    (leader) => season === "all" || leader.seasonId === season,
  );

  return (
    <div className="grid gap-10">
      <Card className="p-4">
        <div className="grid gap-3 xl:grid-cols-[1fr_1fr_repeat(4,1fr)_1.2fr]">
          <SeasonSelector value={season} onChange={setSeason} options={seasons} />
          <FilterSelect
            label="Class"
            value={className}
            onChange={setClassName}
            options={classes}
          />
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
                placeholder="Rider or event"
                className="h-11 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              />
            </span>
          </label>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Filtered Results" value={String(totalResults)} icon={Trophy} />
        <MetricCard label="DNF Count" value={String(dnfs)} icon={Flag} />
        <MetricCard label="Finish Rate" value={finishRate} icon={Users} />
        <MetricCard label="Average Finish" value={averageFinish} icon={Trophy} />
        <MetricCard
          label="Manufacturers"
          value={String(new Set(filteredFacts.map((fact) => fact.manufacturer)).size)}
          icon={Factory}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <StatLeaderboard
          title="Wins by rider"
          description="Final event wins from the filtered result set."
          rows={winsByRider}
        />
        <StatLeaderboard
          title="Wins by country"
          description="Winning riders grouped by country."
          rows={winsByCountry}
        />
        <StatLeaderboard
          title="Wins by manufacturer"
          description="Event wins grouped by manufacturer."
          rows={winsByManufacturer}
        />
        <StatLeaderboard
          title="Podiums by rider"
          description="Top-three final classifications grouped by rider."
          rows={podiumsByRider}
        />
        <StatLeaderboard
          title="Podiums by manufacturer"
          description="Top-three final classifications grouped by manufacturer."
          rows={podiumsByManufacturer}
        />
        <StatLeaderboard
          title="Points leaders"
          description="Current seeded standings points leaders."
          rows={filteredPointsLeaders.map((leader) => ({
            id: leader.id,
            label: leader.riderName,
            value: leader.points,
            href: `/riders/${leader.riderSlug}`,
            detail: `${leader.wins} wins • ${leader.podiums} podiums`,
          }))}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartPlaceholder
          title="Manufacturer performance"
          description="Result participation count by manufacturer, ready to become a real chart."
          bars={manufacturerPerformance.map((row) => ({
            label: row.label,
            value: Number(row.value),
          }))}
        />
        <ChartPlaceholder
          title="Motorcycle performance"
          description="Result participation count by motorcycle, ready for a future charting library."
          bars={motorcyclePerformance.map((row) => ({
            label: row.label,
            value: Number(row.value),
          }))}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Unique Riders"
          value={String(new Set(filteredFacts.map((fact) => fact.riderSlug)).size)}
          icon={Users}
        />
        <MetricCard
          label="Unique Events"
          value={String(new Set(filteredFacts.map((fact) => fact.eventSlug)).size)}
          icon={Trophy}
        />
        <MetricCard
          label="Unique Motorcycles"
          value={String(new Set(filteredFacts.map((fact) => fact.motorcycle)).size)}
          icon={Bike}
        />
        <MetricCard
          label="Result Points"
          value={String(filteredFacts.reduce((sum, fact) => sum + fact.points, 0))}
          icon={Trophy}
        />
      </div>
    </div>
  );
}

function isWin(fact: StatisticFact) {
  return fact.position === 1;
}

function isPodium(fact: StatisticFact) {
  return typeof fact.position === "number" && fact.position >= 1 && fact.position <= 3;
}

function aggregate(
  facts: StatisticFact[],
  getLabel: (fact: StatisticFact) => string,
  options: {
    href?: (fact: StatisticFact) => string | undefined;
    detail?: (fact: StatisticFact) => string | undefined;
  } = {},
) {
  const map = new Map<
    string,
    {
      id: string;
      label: string;
      value: number;
      href?: string;
      detail?: string;
    }
  >();

  facts.forEach((fact) => {
    const label = getLabel(fact);
    const current = map.get(label) ?? {
      id: label,
      label,
      value: 0,
      href: options.href?.(fact),
      detail: options.detail?.(fact),
    };

    current.value += 1;
    map.set(label, current);
  });

  return Array.from(map.values()).sort((a, b) => b.value - a.value);
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
