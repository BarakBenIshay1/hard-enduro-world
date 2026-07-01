import Link from "next/link";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";
import type { VerifiedEventFact } from "@/data/verified/types";
import {
  CompactMessage,
  CrossLinkGroup,
  DashboardPanel,
  DetailRow,
  MetricCard,
  SummaryTable,
} from "./dashboard-ui";
import type { CrossNavigation, RiderCardItem, SummaryRow } from "./types";

export function ParticipantsPanel({
  verifiedFact,
  riderCards,
  manufacturerRows,
  teamRows,
  crossNavigation,
}: {
  verifiedFact: VerifiedEventFact;
  riderCards: RiderCardItem[];
  manufacturerRows: SummaryRow[];
  teamRows: SummaryRow[];
  crossNavigation: CrossNavigation;
}) {
  return (
    <section id="participants" className="scroll-mt-32">
      <SectionTitle
        eyebrow="Participants"
        title="Riders, manufacturers, teams, and motorcycles"
        description="Grouped into compact tab-style panels instead of separate long sections."
      />
      <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Participants">
        {["Riders", "Manufacturers", "Teams", "Motorcycles"].map((label) => (
          <a
            key={label}
            href={`#participants-${label.toLowerCase()}`}
            className="rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition hover:border-accent hover:text-accent"
            role="tab"
          >
            {label}
          </a>
        ))}
      </div>
      <div className="mt-6 grid gap-4">
        <DashboardPanel id="participants-riders" title="Riders">
          {riderCards.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {riderCards.slice(0, 8).map((rider) => (
                <Link key={rider.slug} href={`/riders/${rider.slug}`}>
                  <Card className="h-full p-4">
                    <h3 className="font-black">{rider.name}</h3>
                    <p className="mt-1 text-sm text-foreground/[0.58]">{rider.country}</p>
                    <div className="mt-3 grid gap-2">
                      <DetailRow label="Team" value={rider.team} compact />
                      <DetailRow
                        label="Manufacturer"
                        value={rider.manufacturer}
                        compact
                      />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <CompactMessage text="Participant list pending official verification." />
          )}
        </DashboardPanel>

        <DashboardPanel id="participants-manufacturers" title="Manufacturers">
          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <SummaryTable
              rows={manufacturerRows.map((row) => [
                row.name,
                String(row.entries),
                row.bestResult,
                String(row.wins),
                String(row.podiums),
              ])}
              headings={["Manufacturer", "Bikes", "Best", "Wins", "Podiums"]}
            />
            <CrossLinkGroup
              title="Linked manufacturers"
              links={crossNavigation.manufacturers}
            />
          </div>
        </DashboardPanel>

        <DashboardPanel id="participants-teams" title="Teams">
          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <SummaryTable
              rows={teamRows.map((row) => [
                row.name,
                String(row.entries),
                row.bestResult,
                String(row.wins),
                String(row.podiums),
              ])}
              headings={["Team", "Riders", "Best", "Wins", "Podiums"]}
            />
            <CrossLinkGroup title="Linked teams" links={crossNavigation.teams} />
          </div>
        </DashboardPanel>

        <DashboardPanel id="participants-motorcycles" title="Motorcycles">
          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="grid gap-3 md:grid-cols-3">
              <MetricCard
                label="Models"
                value={verifiedFact.motorcycleContext?.motorcycleModels.value}
                fallback="TBC"
              />
              <MetricCard
                label="Engine size"
                value={verifiedFact.motorcycleContext?.engineSize.value}
                fallback="TBC"
              />
              <MetricCard
                label="Manufacturer"
                value={verifiedFact.motorcycleContext?.manufacturer.value}
                fallback="TBC"
              />
            </div>
            <CrossLinkGroup
              title="Linked motorcycles"
              links={crossNavigation.motorcycles}
            />
          </div>
        </DashboardPanel>
      </div>
    </section>
  );
}
