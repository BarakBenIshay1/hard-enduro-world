"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Building2, Flag, ShieldCheck, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export type TeamCardData = {
  id: string;
  slug: string;
  name: string;
  country: string;
  countryCode: string;
  manufacturer: string;
  teamType: string;
  riderRoster: string[];
  status: string;
  season: string;
  activeRiders: number;
  championships: number;
  wins: number;
  podiums: number;
  overview: string;
};

type TeamsBrowserProps = {
  teams: TeamCardData[];
};

const sortOptions = [
  { label: "Team Name", value: "name" },
  { label: "Active riders", value: "riders" },
  { label: "Team type", value: "teamType" },
  { label: "Manufacturer", value: "manufacturer" },
] as const;

const teamNameGroups = [
  {
    label: "Teams",
    options: [
      "Red Bull KTM Factory Racing",
      "Factory Sherco Racing",
      "FMF KTM Factory Racing",
      "GASGAS Factory Racing",
    ].map((label) => ({ label, value: `team:${label}` })),
  },
  {
    label: "Riders",
    options: [
      "Manuel Lettenbichler",
      "Billy Bolt",
      "Mario Roman",
      "Trystan Hart",
      "Alfredo Gomez",
    ].map((label) => ({ label, value: `rider:${label}` })),
  },
];

export function TeamsBrowser({ teams }: TeamsBrowserProps) {
  const [teamFilter, setTeamFilter] = useState("all");
  const [sort, setSort] = useState<(typeof sortOptions)[number]["value"]>("name");

  const visibleTeams = useMemo(() => {
    return teams
      .filter((team) => matchesTeamFilter(team, teamFilter))
      .sort((a, b) => {
        if (sort === "name") {
          return a.name.localeCompare(b.name);
        }

        if (sort === "riders") {
          return b.activeRiders - a.activeRiders;
        }

        return a[sort].localeCompare(b[sort]);
      });
  }, [sort, teamFilter, teams]);

  return (
    <div className="grid gap-8">
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
          <FilterSelect
            label="Sort"
            value={sort}
            onChange={(value) => setSort(value as typeof sort)}
            options={sortOptions.map((option) => option.value)}
            labels={Object.fromEntries(
              sortOptions.map((option) => [option.value, option.label]),
            )}
          />
          <GroupedFilterSelect
            label="Team Name"
            value={teamFilter}
            onChange={setTeamFilter}
            groups={teamNameGroups}
          />
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visibleTeams.map((team) => (
          <TeamCard key={team.id} team={team} />
        ))}
      </div>
    </div>
  );
}

function matchesTeamFilter(team: TeamCardData, filter: string) {
  if (filter === "all") {
    return true;
  }

  const [type, rawValue] = filter.split(":");
  const value = normalize(rawValue ?? "");

  if (type === "team") {
    return normalize(team.name).includes(value);
  }

  if (type === "rider") {
    return team.riderRoster.some((name) => normalize(name).includes(value));
  }

  return true;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function TeamCard({ team }: { team: TeamCardData }) {
  return (
    <Card className="overflow-hidden">
      <div className="relative min-h-64 bg-black">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(0_0%_4%),hsl(220_10%_12%)_46%,hsl(18_82%_20%))]" />
        <div className="absolute left-5 top-5 flex h-16 w-16 items-center justify-center rounded-md border border-white/[0.16] bg-white/[0.08] text-white backdrop-blur">
          <ShieldCheck className="h-7 w-7 text-accent" aria-hidden="true" />
          <span className="sr-only">Team crest placeholder</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/62 to-transparent p-5 text-white">
          <Badge className="border-white/[0.16] bg-white/10 text-white">
            {team.status}
          </Badge>
          <h2 className="mt-4 text-2xl font-semibold">{team.name}</h2>
          <p className="mt-2 inline-flex items-center gap-2 text-sm text-white/[0.64]">
            <Flag className="h-4 w-4 text-accent" />
            {team.country} <span className="text-white/[0.42]">({team.countryCode})</span>
          </p>
        </div>
      </div>

      <div className="grid gap-5 p-5">
        <div className="grid gap-2 text-sm text-foreground/[0.68]">
          <span className="inline-flex items-center gap-2">
            <Building2 className="h-4 w-4 text-accent" />
            {team.teamType}
          </span>
          <span className="inline-flex items-center gap-2">
            <Trophy className="h-4 w-4 text-accent" />
            {team.manufacturer} partner
          </span>
          <span className="inline-flex items-center gap-2">
            <Users className="h-4 w-4 text-accent" />
            {team.activeRiders} active rider{team.activeRiders === 1 ? "" : "s"}
          </span>
        </div>

        <p className="text-sm leading-6 text-foreground/[0.64]">{team.overview}</p>

        {team.riderRoster.length > 0 ? (
          <div className="rounded-md border border-border bg-surface-muted p-3">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-foreground/[0.48]">
              Rider roster
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground/[0.74]">
              {team.riderRoster.slice(0, 3).join(" / ")}
              {team.riderRoster.length > 3 ? " / more" : ""}
            </p>
          </div>
        ) : null}

        <PerformanceSummary />

        <ButtonLink href={`/teams/${team.slug}`} className="w-full">
          Explore Team <ArrowRight className="ml-2 h-4 w-4" />
        </ButtonLink>
      </div>
    </Card>
  );
}

function PerformanceSummary() {
  return (
    <div className="rounded-md border border-border bg-surface-muted p-3 text-sm font-semibold text-foreground/[0.62]">
      Verified team results coming soon
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
        {options.map((option) => (
          <option key={option} value={option}>
            {labels?.[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}

function GroupedFilterSelect({
  label,
  value,
  onChange,
  groups,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  groups: Array<{ label: string; options: Array<{ label: string; value: string }> }>;
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
        {groups.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
