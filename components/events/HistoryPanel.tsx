import Link from "next/link";
import { Clock, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionTitle } from "@/components/ui/section-title";
import type { VerifiedEventFact } from "@/data/verified/types";
import { CompactMetricRow } from "./dashboard-ui";
import { winnerName } from "./helpers";
import type { EventDetail, EventResult, SummaryRow } from "./types";

export function HistoryPanel({
  event,
  verifiedFact,
  fastestStage,
  manufacturerRows,
  previousWinner,
  finalWinner,
}: {
  event: EventDetail;
  verifiedFact: VerifiedEventFact;
  fastestStage: EventDetail["stages"][number]["stageResults"][number] | undefined;
  manufacturerRows: SummaryRow[];
  previousWinner: string;
  finalWinner: EventResult["rider"] | undefined;
}) {
  return (
    <section id="history" className="scroll-mt-32">
      <SectionTitle
        eyebrow="History"
        title="History"
        description="Historical context stays last so users reach current results and controls first."
      />
      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-3">
          {event.previousEditions.length > 0 ? (
            event.previousEditions.slice(0, 4).map((edition) => {
              const winner = edition.results[0]?.rider;

              return (
                <Link key={edition.id} href={`/events/${edition.slug}`}>
                  <Card className="grid gap-3 p-4 sm:grid-cols-[90px_1fr_140px]">
                    <p className="text-2xl font-black text-accent">
                      {edition.season.year}
                    </p>
                    <div>
                      <h3 className="font-black">{edition.name}</h3>
                      <p className="mt-1 text-sm text-foreground/[0.58]">
                        {edition.country?.name ?? "Country TBC"}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">{winnerName(winner)}</p>
                  </Card>
                </Link>
              );
            })
          ) : (
            <EmptyState
              icon={Clock}
              title="No previous editions yet"
              description="Verified historical editions will appear here once source-reviewed."
            />
          )}
        </div>
        <Card className="p-6">
          <Trophy className="h-5 w-5 text-accent" aria-hidden="true" />
          <h3 className="mt-5 text-xl font-black">Event records preview</h3>
          <div className="mt-5 grid gap-2">
            <CompactMetricRow
              label="Fastest stage"
              value={fastestStage?.totalTimeText ?? "TBC"}
            />
            <CompactMetricRow
              label="Largest field"
              value={
                verifiedFact.verifiedFinisherCount
                  ? `${verifiedFact.verifiedFinisherCount} verified finishers`
                  : "TBC"
              }
            />
            <CompactMetricRow
              label="Best manufacturer"
              value={manufacturerRows[0]?.name ?? "TBC"}
            />
            <CompactMetricRow
              label="Previous winner"
              value={previousWinner || winnerName(finalWinner)}
            />
          </div>
        </Card>
      </div>
    </section>
  );
}
