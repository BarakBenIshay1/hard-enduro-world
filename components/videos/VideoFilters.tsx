"use client";

import type { VideoContentType, VideoEventOption, VideoSourceType } from "./types";

export type VideoFilterState = {
  sourceType: "All" | VideoSourceType;
  contentType: "All" | VideoContentType;
  eventId: "all" | string;
  riderId: "all" | string;
  teamId: "all" | string;
  manufacturerId: "all" | string;
  motorcycleId: "all" | string;
  seasonYear: "all" | number;
  dateRange: "all" | "latest" | "week" | "month" | "season";
};

type VideoFiltersProps = {
  filters: VideoFilterState;
  events: VideoEventOption[];
  onChange: (filters: VideoFilterState) => void;
};

const sourceTypes: VideoFilterState["sourceType"][] = [
  "All",
  "Official Rider",
  "Official Event",
  "Official Brand",
  "Trusted Creator",
];

const contentTypes: VideoFilterState["contentType"][] = [
  "All",
  "Highlights",
  "Full Race",
  "Behind the Scenes",
  "Interviews",
  "Training",
  "Onboard",
];

const dateRanges: Array<{ label: string; value: VideoFilterState["dateRange"] }> = [
  { label: "All Time", value: "all" },
  { label: "Latest", value: "latest" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "This Season", value: "season" },
];

export function VideoFilters({ filters, events, onChange }: VideoFiltersProps) {
  return (
    <div className="grid gap-4">
      <FilterSelect
        label="Source Type"
        value={filters.sourceType}
        onChange={(value) =>
          onChange({ ...filters, sourceType: value as VideoFilterState["sourceType"] })
        }
        options={sourceTypes.map((type) => ({ label: type, value: type }))}
      />
      <FilterSelect
        label="Content Type"
        value={filters.contentType}
        onChange={(value) =>
          onChange({
            ...filters,
            contentType: value as VideoFilterState["contentType"],
          })
        }
        options={contentTypes.map((type) => ({ label: type, value: type }))}
      />
      <FilterSelect
        label="Event"
        value={filters.eventId}
        onChange={(value) => onChange({ ...filters, eventId: value })}
        options={[
          { label: "All Events", value: "all" },
          ...events.map((event) => ({ label: event.name, value: event.id })),
        ]}
      />
      <FilterSelect
        label="Date"
        value={filters.dateRange}
        onChange={(value) =>
          onChange({ ...filters, dateRange: value as VideoFilterState["dateRange"] })
        }
        options={dateRanges}
      />
    </div>
  );
}

type FilterSelectProps = {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
};

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-foreground/72">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-md border border-white/[0.16] bg-surface px-3 text-sm font-semibold normal-case tracking-normal text-foreground shadow-inner outline-none transition focus:border-accent focus:bg-black/40"
      >
        {options.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
