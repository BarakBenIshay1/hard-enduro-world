import Link from "next/link";
import { StageTimingTable } from "@/components/stage-timing-table";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";
import type { VerifiedEventFact } from "@/data/verified/types";
import { formatOptional } from "@/lib/format";
import { CourseMapsBlock } from "./CourseMapsBlock";
import { CompactMessage, MetricCard } from "./dashboard-ui";
import { mapTimingResults, winnerName } from "./helpers";
import type { RacePhase } from "./race-status";
import type { EventDetail, EventResult, EventStageCard } from "./types";

export function ResultsPanel({
  event,
  verifiedFact,
  isVerified,
  stageCards,
  racePhase,
}: {
  event: EventDetail;
  verifiedFact: VerifiedEventFact;
  isVerified: boolean;
  stageCards: EventStageCard[];
  racePhase: RacePhase;
}) {
  const stagesWithTiming = isVerified
    ? event.stages.filter((stage) => stage.stageResults.length > 0)
    : [];
  const classifiedRows = isVerified ? event.results : [];
  const topClassificationRows = classifiedRows
    .filter((result) => result.overallPosition !== null)
    .sort((a, b) => (a.overallPosition ?? 999) - (b.overallPosition ?? 999))
    .slice(0, 10);

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
        <TopClassificationTable results={topClassificationRows} />
        <CourseMapsBlock stages={stageCards} racePhase={racePhase} />

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

function TopClassificationTable({ results }: { results: EventResult[] }) {
  return (
    <Card className="overflow-hidden border-white/12 bg-black text-white">
      <div className="flex flex-col gap-2 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Classification
          </p>
          <h3 className="mt-1 text-xl font-black">Top 10 Classification</h3>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/[0.52]">
          Verified rows only
        </span>
      </div>

      {results.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-white/[0.06] text-xs uppercase tracking-[0.18em] text-white/[0.62]">
                <tr>
                  {["Position", "Rider", "Country", "Manufacturer", "Time", "Status"].map(
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
                  <tr
                    key={result.id}
                    className="border-t border-white/10 transition hover:bg-white/[0.04]"
                  >
                    <td className="px-4 py-4 text-lg font-black text-accent">
                      {formatOptional(result.overallPosition)}
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/riders/${result.rider.slug}`}
                        className="font-semibold transition hover:text-accent"
                      >
                        {winnerName(result.rider)}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      {result.rider.country?.isoCode ??
                        result.rider.country?.name ??
                        "TBC"}
                    </td>
                    <td className="px-4 py-4">{getManufacturerLabel(result)}</td>
                    <td className="px-4 py-4 font-mono">
                      {result.totalTimeText ?? "TBC"}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-sm border border-white/12 bg-white/10 px-2 py-1 text-xs font-semibold capitalize">
                        {result.status.toLowerCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {results.length < 10 ? (
            <div className="border-t border-white/10 p-4">
              <CompactMessage text="Only verified classification rows are shown. Remaining official finishers pending source verification." />
            </div>
          ) : null}
        </>
      ) : (
        <div className="p-5">
          <CompactMessage text="Overall results coming soon." />
        </div>
      )}
    </Card>
  );
}

function getManufacturerLabel(result: EventResult | null) {
  return (
    result?.manufacturer?.name ??
    result?.motorcycle?.manufacturer.name ??
    "Manufacturer TBC"
  );
}
