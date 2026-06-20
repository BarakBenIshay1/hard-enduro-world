import type { StageResult } from "@prisma/client";
import { formatOptional } from "@/lib/format";

type StageTimingResult = StageResult & {
  rider: {
    firstName: string;
    lastName: string;
    country: {
      isoCode: string;
    } | null;
  };
  motorcycle: {
    model: string;
    year: number | null;
    manufacturer: {
      name: string;
    };
  } | null;
  manufacturer: {
    name: string;
  } | null;
};

type StageTimingTableProps = {
  results: StageTimingResult[];
};

export function StageTimingTable({ results }: StageTimingTableProps) {
  return (
    <div className="overflow-hidden rounded-md border border-border">
      <div className="overflow-x-auto">
        <table className="min-w-[920px] w-full border-collapse text-left text-sm">
          <thead className="bg-surface-muted text-xs uppercase tracking-wide text-foreground/60">
            <tr>
              <th className="px-4 py-3 font-semibold">Overall</th>
              <th className="px-4 py-3 font-semibold">Class</th>
              <th className="px-4 py-3 font-semibold">Rider</th>
              <th className="px-4 py-3 font-semibold">Motorcycle</th>
              <th className="px-4 py-3 font-semibold">Time</th>
              <th className="px-4 py-3 font-semibold">Gap leader</th>
              <th className="px-4 py-3 font-semibold">Penalty</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <tr key={result.id} className="border-t border-border">
                <td className="px-4 py-4 font-semibold">
                  {formatOptional(result.overallPosition)}
                </td>
                <td className="px-4 py-4">
                  {formatOptional(result.classPosition)}
                  <span className="ml-2 text-foreground/52">
                    {formatOptional(result.className)}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="font-medium">
                    {result.rider.firstName} {result.rider.lastName}
                  </span>
                  {result.rider.country ? (
                    <span className="ml-2 text-foreground/52">
                      {result.rider.country.isoCode}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-4">
                  {result.motorcycle ? (
                    <span>
                      {result.motorcycle.manufacturer.name} {result.motorcycle.model}
                      {result.motorcycle.year ? ` ${result.motorcycle.year}` : ""}
                    </span>
                  ) : (
                    formatOptional(result.manufacturer?.name)
                  )}
                </td>
                <td className="px-4 py-4 font-mono text-sm">
                  {formatOptional(result.totalTimeText)}
                </td>
                <td className="px-4 py-4 font-mono text-sm">
                  {formatOptional(result.gapToLeaderText)}
                </td>
                <td className="px-4 py-4 font-mono text-sm">
                  {formatOptional(result.penaltiesText)}
                </td>
                <td className="px-4 py-4">{result.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
