import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";
import type { VerifiedEventFact } from "@/data/verified/types";
import { CompactTextBlock, MetricCard } from "./dashboard-ui";
import { UNKNOWN_VERIFIED_VALUE } from "./helpers";

export function RaceOverviewPanel({
  verifiedFact,
  podiumLabel,
  terrain,
  elevation,
}: {
  verifiedFact: VerifiedEventFact;
  podiumLabel: string | null;
  terrain: string;
  elevation: string;
}) {
  return (
    <section id="race-overview" className="scroll-mt-32">
      <SectionTitle
        eyebrow="Overview"
        title="Race overview"
        description="About, format, course, verified facts, and statistics are grouped into one compact dashboard."
      />
      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Winner"
          value={verifiedFact.verifiedWinner}
          fallback={UNKNOWN_VERIFIED_VALUE}
        />
        <MetricCard
          label="Podium"
          value={podiumLabel}
          fallback={UNKNOWN_VERIFIED_VALUE}
        />
        <MetricCard
          label="Finishers"
          value={verifiedFact.raceStatistics?.finishers.value}
          fallback={UNKNOWN_VERIFIED_VALUE}
        />
        <MetricCard
          label="Finish rate"
          value={verifiedFact.raceStatistics?.finishRate.value}
          fallback="TBC"
        />
        <MetricCard
          label="Terrain"
          value={verifiedFact.terrainDescription?.value ?? terrain}
          fallback="TBC"
        />
        <MetricCard
          label="Elevation"
          value={verifiedFact.elevation?.value ?? elevation}
          fallback="TBC"
        />
        <MetricCard
          label="Distance"
          value={verifiedFact.raceStatistics?.totalDistance.value}
          fallback="TBC"
        />
        <MetricCard
          label="Checkpoints"
          value={verifiedFact.raceStatistics?.checkpointCount.value}
          fallback="TBC"
        />
      </div>
      <Card className="mt-4 p-5">
        <div className="grid gap-4 lg:grid-cols-3">
          <CompactTextBlock title="About" text={verifiedFact.eventDescription?.value} />
          <CompactTextBlock title="Race format" text={verifiedFact.eventFormat?.value} />
          <CompactTextBlock
            title="Course"
            text={verifiedFact.terrainDescription?.value}
          />
        </div>
      </Card>
    </section>
  );
}
