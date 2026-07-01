import Link from "next/link";
import { StageTimingTable } from "@/components/stage-timing-table";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";
import type { VerifiedEventFact } from "@/data/verified/types";
import { cn } from "@/lib/cn";
import { formatOptional } from "@/lib/format";
import { CompactMessage, MetricCard, OverallResultsTable } from "./dashboard-ui";
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
        <PodiumLayout
          podium={classifiedRows
            .filter((result) => result.overallPosition !== null)
            .sort((a, b) => (a.overallPosition ?? 999) - (b.overallPosition ?? 999))
            .slice(0, 3)}
        />

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

function PodiumLayout({ podium }: { podium: EventResult[] }) {
  const podiumOrder = [1, 2, 3];

  return (
    <Card className="overflow-hidden border-white/12 bg-black text-white shadow-[0_24px_80px_hsl(0_0%_0%/0.25)]">
      <div className="border-b border-white/10 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Podium
        </p>
        <h3 className="mt-1 text-xl font-black">Verified top three</h3>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-[1fr_1.14fr_1fr] md:items-end">
        {podiumOrder.map((position) => (
          <PodiumCard
            key={position}
            position={position}
            result={podium.find((result) => result.overallPosition === position) ?? null}
          />
        ))}
      </div>
    </Card>
  );
}

function PodiumCard({
  position,
  result,
}: {
  position: number;
  result: EventResult | null;
}) {
  const card = (
    <Card
      className={cn(
        "relative h-full overflow-hidden border-white/12 bg-white/[0.055] p-5 text-center text-white transition hover:border-accent/70 hover:bg-white/[0.08]",
        position === 1 &&
          "border-accent/45 bg-[radial-gradient(circle_at_50%_0%,hsl(42_90%_55%/0.2),hsl(0_0%_100%/0.06)_48%,transparent_72%)] p-6 shadow-[0_0_38px_hsl(24_92%_48%/0.16)] md:order-2 md:min-h-[355px]",
        position === 2 && "md:order-1 md:min-h-[318px]",
        position === 3 && "md:order-3 md:min-h-[318px]",
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent" />
      <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-white/12 bg-black/40 px-3 py-1 text-xs font-black uppercase tracking-[0.14em]">
        <span className="text-accent">P{position}</span>
        <span className="text-white/46">{getPositionLabel(position)}</span>
      </div>

      <PortraitPlaceholder
        initials={result ? getRiderInitials(result.rider) : "TBC"}
        large={position === 1}
      />

      <h3
        className={cn(
          "mx-auto mt-4 max-w-[15rem] font-black leading-tight",
          position === 1 ? "text-2xl" : "text-xl",
        )}
      >
        {result ? winnerName(result.rider) : "Coming Soon"}
      </h3>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <span className="rounded-sm border border-white/10 bg-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/[0.68]">
          {result?.rider.country?.isoCode ?? result?.rider.country?.name ?? "TBC"}
        </span>
        <span className="rounded-sm border border-accent/30 bg-accent/12 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">
          {getManufacturerLabel(result)}
        </span>
      </div>

      <div className="mt-5 rounded-md border border-white/10 bg-black/30 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42">
          Time
        </p>
        <p className="mt-1 font-mono text-sm font-black">
          {result?.totalTimeText ?? "TBC"}
        </p>
      </div>
    </Card>
  );

  return result ? (
    <Link href={`/riders/${result.rider.slug}`} className="block h-full">
      {card}
    </Link>
  ) : (
    card
  );
}

function PortraitPlaceholder({ initials, large }: { initials: string; large: boolean }) {
  return (
    <div
      className={cn(
        "mx-auto mt-5 flex items-center justify-center rounded-full border border-white/14 bg-[radial-gradient(circle_at_35%_25%,hsl(24_85%_45%/0.55),hsl(0_0%_13%)_58%,hsl(0_0%_4%))] font-black text-white shadow-xl shadow-black/30",
        large ? "h-28 w-28 text-3xl" : "h-24 w-24 text-2xl",
      )}
      aria-label="Rider portrait placeholder"
    >
      {initials}
    </div>
  );
}

function getPositionLabel(position: number) {
  if (position === 1) {
    return "Winner";
  }

  if (position === 2) {
    return "Second";
  }

  if (position === 3) {
    return "Third";
  }

  return `P${formatOptional(position)}`;
}

function getRiderInitials(rider: EventResult["rider"]) {
  return `${rider.firstName[0] ?? ""}${rider.lastName[0] ?? ""}`;
}

function getManufacturerLabel(result: EventResult | null) {
  return (
    result?.manufacturer?.name ??
    result?.motorcycle?.manufacturer.name ??
    "Manufacturer TBC"
  );
}
