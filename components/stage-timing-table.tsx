"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp } from "lucide-react";
import { formatOptional } from "@/lib/format";
import { cn } from "@/lib/cn";

export type StageTimingResult = {
  id: string;
  overallPosition: number | null;
  classPosition: number | null;
  className: string | null;
  riderName: string;
  countryCode: string | null;
  teamName: string | null;
  manufacturerName: string | null;
  motorcycleName: string | null;
  totalTimeText: string | null;
  totalTimeMs: number | null;
  gapToLeaderText: string | null;
  gapToLeaderMs: number | null;
  penaltiesText: string | null;
  penaltiesMs: number | null;
  status: string;
};

type StageTimingTableProps = {
  results: StageTimingResult[];
};

type SortKey =
  | "position"
  | "rider"
  | "country"
  | "team"
  | "manufacturer"
  | "motorcycle"
  | "time"
  | "gap"
  | "penalties"
  | "status";

const columns: Array<{ key: SortKey; label: string; align?: "right" }> = [
  { key: "position", label: "Position" },
  { key: "rider", label: "Rider" },
  { key: "country", label: "Country" },
  { key: "team", label: "Team" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "motorcycle", label: "Motorcycle" },
  { key: "time", label: "Time", align: "right" },
  { key: "gap", label: "Gap", align: "right" },
  { key: "penalties", label: "Penalties", align: "right" },
  { key: "status", label: "Status" },
];

export function StageTimingTable({ results }: StageTimingTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("position");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");

  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      const comparison = compareValues(
        getSortValue(a, sortKey),
        getSortValue(b, sortKey),
      );
      return direction === "asc" ? comparison : comparison * -1;
    });
  }, [direction, results, sortKey]);

  function updateSort(nextKey: SortKey) {
    if (nextKey === sortKey) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setDirection("asc");
  }

  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      <div className="border-b border-border px-4 py-4">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
          Official timing table
        </p>
        <p className="mt-1 text-sm text-foreground/[0.58]">
          Sortable foundation for future live timing and complete stage classifications.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
          <thead className="bg-surface-muted text-xs uppercase tracking-wide text-foreground/[0.6]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3 font-semibold",
                    column.align === "right" && "text-right",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => updateSort(column.key)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent",
                      column.align === "right" && "ml-auto",
                    )}
                  >
                    {column.label}
                    <ArrowDownUp className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedResults.map((result) => (
              <tr key={result.id} className="border-t border-border">
                <td className="px-4 py-4 text-lg font-black text-accent">
                  {formatOptional(result.overallPosition)}
                </td>
                <td className="px-4 py-4 font-semibold">{result.riderName}</td>
                <td className="px-4 py-4">{formatOptional(result.countryCode)}</td>
                <td className="px-4 py-4 text-foreground/[0.68]">
                  {formatOptional(result.teamName)}
                </td>
                <td className="px-4 py-4">{formatOptional(result.manufacturerName)}</td>
                <td className="px-4 py-4">{formatOptional(result.motorcycleName)}</td>
                <td className="px-4 py-4 text-right font-mono text-sm">
                  {formatOptional(result.totalTimeText)}
                </td>
                <td className="px-4 py-4 text-right font-mono text-sm">
                  {formatOptional(result.gapToLeaderText)}
                </td>
                <td className="px-4 py-4 text-right font-mono text-sm">
                  {formatOptional(result.penaltiesText)}
                </td>
                <td className="px-4 py-4">
                  <span className="rounded-sm border border-border bg-surface-muted px-2 py-1 text-xs font-semibold">
                    {result.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getSortValue(result: StageTimingResult, key: SortKey) {
  switch (key) {
    case "position":
      return result.overallPosition ?? Number.MAX_SAFE_INTEGER;
    case "rider":
      return result.riderName;
    case "country":
      return result.countryCode ?? "";
    case "team":
      return result.teamName ?? "";
    case "manufacturer":
      return result.manufacturerName ?? "";
    case "motorcycle":
      return result.motorcycleName ?? "";
    case "time":
      return result.totalTimeMs ?? Number.MAX_SAFE_INTEGER;
    case "gap":
      return result.gapToLeaderMs ?? Number.MAX_SAFE_INTEGER;
    case "penalties":
      return result.penaltiesMs ?? 0;
    case "status":
      return result.status;
  }
}

function compareValues(a: string | number, b: string | number) {
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }

  return String(a).localeCompare(String(b));
}
