import Link from "next/link";
import { StageTimingTable } from "@/components/stage-timing-table";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";
import type { VerifiedEventFact } from "@/data/verified/types";
import { formatOptional } from "@/lib/format";
import {
  CompactMessage,
  DetailRow,
  MetricCard,
  OverallResultsTable,
} from "./dashboard-ui";
import { mapTimingResults, winnerName } from "./helpers";
import type { EventDetail, EventResult } from "./types";

export function ResultsPanel({
  event,
  verifiedFact,
  isVerified,
}: {
  event: EventDetail;
  verifiedFact: VerifiedEventFact;
  isVerified: boolean;
}) {
  const stagesWithTiming = isVerified
    ? event.stages.filter((stage) => stage.stageResults.length > 0)
    : [];
  const classifiedRows = isVerified ? event.results : [];

  return (
    <section id="results" className="scroll-mt-32">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <SectionTitle
          eyebrow="Results"
          title={`${event.name} classification`}
          description="Verified podium and first-pass overall rows. Stage timing stays hidden until official rows are verified."
        />
        <ButtonLink href="/results" variant="secondary">
          Open Results Module
        </ButtonLink>
      </div>

      <div className="mt-6 grid gap-4">
        <div className="grid gap-3 md:grid-cols-3">
          {classifiedRows
            .filter((result) => result.overallPosition !== null)
            .sort((a, b) => (a.overallPosition ?? 999) - (b.overallPosition ?? 999))
            .slice(0, 3)
            .map((result) => (
              <PodiumCard key={result.id} result={result} />
            ))}
          {classifiedRows.length === 0 ? <PodiumComingSoon /> : null}
        </div>

        <Card className="overflow-hidden border-white/12 bg-black text-white">
          <div className="flex flex-col gap-2 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xl font-black">Overall results</h3>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/[0.52]">
              Timing fields pending source rows
            </span>
          </div>
          {classifiedRows.length > 0 ? (
            <OverallResultsTable results={classifiedRows} />
          ) : (
            <div className="p-5">
              <CompactMessage text="Overall results coming soon." />
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                Stage results
              </p>
              <h3 className="mt-1 text-lg font-black">Timing tables</h3>
            </div>
            {stagesWithTiming.length === 0 ? (
              <CompactMessage text="Stage timing pending official verification." />
            ) : null}
          </div>
          {stagesWithTiming.length > 0 ? (
            <div className="mt-5 grid gap-5">
              {stagesWithTiming.map((stage) => (
                <section
                  key={stage.id}
                  id={`stage-${stage.slug}`}
                  className="scroll-mt-32"
                >
                  <h3 className="mb-3 text-lg font-black">{stage.name}</h3>
                  <StageTimingTable results={mapTimingResults(stage.stageResults)} />
                </section>
              ))}
            </div>
          ) : null}
        </Card>

        <div className="grid gap-3 md:grid-cols-3">
          <MetricCard
            label="DNF"
            value={verifiedFact.participants?.dnf.value}
            fallback="TBC"
          />
          <MetricCard
            label="DNS"
            value={verifiedFact.participants?.dns.value}
            fallback="TBC"
          />
          <MetricCard
            label="DSQ"
            value={verifiedFact.participants?.dsq.value}
            fallback="TBC"
          />
        </div>
      </div>
    </section>
  );
}

function PodiumComingSoon() {
  return [1, 2, 3].map((position) => (
    <Card key={position} className="h-full p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
        Position {position}
      </p>
      <h3 className="mt-2 text-xl font-black">Coming Soon</h3>
      <p className="mt-1 text-sm text-foreground/[0.58]">
        Official result pending verification.
      </p>
    </Card>
  ));
}

function PodiumCard({ result }: { result: EventResult }) {
  const position = result.overallPosition ?? 0;
  const labels = ["Winner", "Second", "Third"];

  return (
    <Link href={`/riders/${result.rider.slug}`}>
      <Card className="h-full p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          {labels[position - 1] ?? `P${formatOptional(position)}`}
        </p>
        <h3 className="mt-2 text-xl font-black">{winnerName(result.rider)}</h3>
        <p className="mt-1 text-sm text-foreground/[0.58]">
          {result.rider.country?.name ?? "Country TBC"}
        </p>
        <div className="mt-3 grid gap-2">
          <DetailRow
            label="Manufacturer"
            value={result.manufacturer?.name ?? "TBC"}
            compact
          />
          <DetailRow label="Time" value={result.totalTimeText ?? "TBC"} compact />
        </div>
      </Card>
    </Link>
  );
}
