import Link from "next/link";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";

export type RiderResultRow = {
  id: string;
  event: string;
  eventHref: string;
  date: string;
  position: string;
  status: string;
  motorcycle: string;
  points: string;
};

export function RiderResultsHistory({ results }: { results: RiderResultRow[] }) {
  return (
    <section>
      <SectionTitle
        eyebrow="Recent Results"
        title="Latest event classifications"
        description="Verified event result rows linked to this rider."
      />
      <Card className="mt-6 overflow-hidden">
        {results.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-black text-xs uppercase tracking-[0.18em] text-white/[0.62]">
                <tr>
                  {["Event", "Date", "Position", "Status", "Motorcycle", "Points"].map(
                    (heading) => (
                      <th key={heading} className="px-4 py-3 font-semibold">
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result.id} className="border-t border-border">
                    <td className="px-4 py-4">
                      <Link
                        href={result.eventHref}
                        className="font-semibold transition hover:text-accent"
                      >
                        {result.event}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-foreground/[0.62]">{result.date}</td>
                    <td className="px-4 py-4 font-black text-accent">
                      {result.position}
                    </td>
                    <td className="px-4 py-4">{result.status}</td>
                    <td className="px-4 py-4">{result.motorcycle}</td>
                    <td className="px-4 py-4 font-mono">{result.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 text-sm font-semibold text-foreground/[0.62]">
            Verified data coming soon.
          </div>
        )}
      </Card>
    </section>
  );
}
