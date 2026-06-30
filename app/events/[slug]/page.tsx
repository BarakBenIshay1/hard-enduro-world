import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Clock,
  Download,
  FileText,
  Flag,
  Globe2,
  Image as ImageIcon,
  Link as LinkIcon,
  MapPin,
  Mountain,
  Sparkles,
  Trophy,
  Users,
  Youtube,
} from "lucide-react";
import {
  StageTimingTable,
  type StageTimingResult,
} from "@/components/stage-timing-table";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionTitle } from "@/components/ui/section-title";
import { siteConfig } from "@/config/site";
import { getVerifiedEventFact } from "@/data/verified/events";
import { getOfficialSource } from "@/data/verified/source-registry";
import type { VerifiedEventFact, VerifiedSourcedLink } from "@/data/verified/types";
import { getEventDetail } from "@/db/events";
import { cn } from "@/lib/cn";
import { formatDate, formatDateRange, formatOptional } from "@/lib/format";

export const dynamic = "force-dynamic";

type EventDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type EventDetail = Awaited<ReturnType<typeof getEventDetail>>;
type Stage = EventDetail["stages"][number];
type Result = EventDetail["results"][number];
type CrossLink = {
  label: string;
  href: string;
  detail: string;
};

const eventTabs = [
  "Overview",
  "About The Race",
  "Race Format",
  "Course",
  "Participants",
  "Race Statistics",
  "Timeline",
  "Schedule",
  "Stages",
  "Results",
  "Riders",
  "Manufacturers",
  "Teams",
  "Motorcycles",
  "History",
  "Verified Facts",
  "Official Links",
  "Media",
  "Documents",
];

const UNKNOWN_VERIFIED_VALUE = "Verified data coming soon";

export async function generateMetadata({
  params,
}: EventDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventDetail(slug);
  const description =
    event.description ??
    `${event.name} event center with stages, riders, results, media, and history.`;
  const canonical = `/events/${event.slug}`;

  return {
    title: event.name,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${event.name} | Hard Enduro World`,
      description,
      url: new URL(canonical, siteConfig.url).toString(),
      siteName: siteConfig.name,
      type: "article",
    },
  };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const event = await getEventDetail(slug);
  const verifiedFact = getVerifiedEventFact(event.slug);
  const terrain = extractDescriptionField(event.description, "Terrain");
  const elevation = extractDescriptionField(event.description, "Elevation");
  const previousWinner = extractDescriptionField(
    event.description,
    "Previous winner marker",
  );
  const verifiedFinisherCount = parseOptionalInt(
    extractDescriptionField(event.description, "Verified finisher count"),
  );
  const finalWinner = event.results.find((result) => result.overallPosition === 1)?.rider;
  const allStageResults = event.stages.flatMap((stage) => stage.stageResults);
  const finishers = event.results.filter((result) => result.status === "FINISHED").length;
  const displayedFinishers = verifiedFinisherCount ?? finishers;
  const dnfCount = event.results.filter((result) => result.status === "DNF").length;
  const dnsCount = event.results.filter((result) => result.status === "DNS").length;
  const dsqCount = event.results.filter((result) => result.status === "DSQ").length;
  const fastestStage = allStageResults
    .filter((result) => result.totalTimeMs !== null)
    .sort((a, b) => (a.totalTimeMs ?? 0) - (b.totalTimeMs ?? 0))[0];
  const stageCards = event.stages.map((stage) =>
    buildStageCard(stage, terrain, elevation),
  );
  const riderCards = buildRiderCards(event);
  const manufacturerRows = buildManufacturerRows(event.results);
  const teamRows = buildTeamRows(event.results);
  const documents = buildDocuments(event);
  const mediaStats = buildMediaStats(event.mediaItems);
  const verifiedOfficialLinks = buildOfficialLinks(verifiedFact);
  const crossNavigation = buildCrossNavigation(event);

  return (
    <main className="min-h-screen bg-surface text-foreground">
      <section className="relative overflow-hidden border-b border-border bg-black text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,hsl(24_92%_48%/0.34),transparent_34%),linear-gradient(135deg,hsl(0_0%_2%),hsl(0_0%_8%)_48%,hsl(24_80%_18%))]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent" />
        <Container className="relative grid min-h-[720px] items-end gap-10 pb-12 pt-32 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-8">
              <Breadcrumb
                items={[{ label: "Events", href: "/events" }, { label: event.name }]}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>{event.liveStatus}</Badge>
              <Badge className="border-white/20 bg-white/10 text-white">
                Round {event.roundNumber ?? "TBC"}
              </Badge>
              <Badge className="border-white/20 bg-white/10 text-white">
                {event.season.year}
              </Badge>
            </div>
            <h1 className="mt-6 max-w-5xl text-5xl font-black leading-[0.92] tracking-normal md:text-7xl lg:text-8xl">
              {event.name}
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-7 text-white/[0.72] md:text-lg">
              {verifiedFact?.eventDescription?.value ??
                buildOverview(event, terrain, elevation)}
            </p>
            <div className="mt-8 flex flex-wrap gap-4 text-sm text-white/[0.72]">
              <HeroFact icon={Flag} value={event.country?.name ?? "Country TBC"} />
              <HeroFact
                icon={MapPin}
                value={event.city ?? event.venue ?? "Location TBC"}
              />
              <HeroFact
                icon={CalendarDays}
                value={formatDateRange(event.startDate, event.endDate)}
              />
              <HeroFact icon={Mountain} value={elevation || "Elevation TBC"} />
            </div>
          </div>

          <div className="grid gap-4">
            <Card className="overflow-hidden border-white/14 bg-white/[0.06] text-white">
              <div className="aspect-[16/10] bg-[linear-gradient(135deg,hsl(0_0%_9%),hsl(24_90%_32%)_54%,hsl(42_74%_30%))]" />
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <BrandBlock
                  label="Event brand"
                  value={event.name.replace(/\s+\d{4}$/, "")}
                />
                <BrandBlock
                  label="Factory focus"
                  value={manufacturerRows[0]?.name ?? "Demo paddock"}
                />
              </div>
            </Card>
            <div className="grid gap-3 sm:grid-cols-2">
              <QuickStat label="Riders" value={String(event.results.length)} />
              <QuickStat label="Stages" value={String(event.stages.length)} />
              <QuickStat label="Finishers" value={String(displayedFinishers)} />
              <QuickStat
                label="DNF / DNS / DSQ"
                value={`${dnfCount}/${dnsCount}/${dsqCount}`}
              />
            </div>
          </div>
        </Container>
      </section>

      <nav className="sticky top-16 z-30 border-b border-border bg-surface/[0.92] backdrop-blur-xl">
        <Container className="flex gap-2 overflow-x-auto py-3">
          {eventTabs.map((tab) => (
            <Link
              key={tab}
              href={`#${tab.toLowerCase().replaceAll(" ", "-")}`}
              className="shrink-0 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition hover:border-accent hover:text-accent"
            >
              {tab}
            </Link>
          ))}
        </Container>
      </nav>

      <Container className="grid gap-12 py-12">
        <section id="overview" className="scroll-mt-32">
          <SectionTitle
            eyebrow="Overview"
            title="Race week command center"
            description={
              verifiedFact
                ? "Verified event information, official-source placeholders, and source-tracked result context for Erzbergrodeo 2026."
                : "A complete event hub built from existing event, stage, result, media, source, and timeline demo data."
            }
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="p-6">
              <h2 className="text-2xl font-black">Event profile</h2>
              <p className="mt-4 leading-7 text-foreground/[0.68]">
                {verifiedFact?.eventDescription?.value ??
                  event.description ??
                  buildOverview(event, terrain, elevation)}
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <DetailRow label="Terrain" value={terrain || "Terrain profile pending"} />
                <DetailRow
                  label="Difficulty"
                  value={getDifficultyLabel(event.roundNumber)}
                />
                <DetailRow label="Distance" value={getTotalDistance(event.stages)} />
                <DetailRow label="Elevation" value={elevation || "Elevation TBC"} />
                <DetailRow
                  label="Previous winner"
                  value={previousWinner || "Demo winner pending"}
                />
                <DetailRow label="Defending champion" value={winnerName(finalWinner)} />
              </div>
            </Card>

            <div className="grid gap-4">
              <Card className="p-6">
                <Sparkles className="h-5 w-5 text-accent" aria-hidden="true" />
                <h2 className="mt-5 text-xl font-black">Interesting facts</h2>
                <ul className="mt-4 grid gap-3 text-sm leading-6 text-foreground/[0.66]">
                  {buildFacts(
                    event,
                    terrain,
                    elevation,
                    manufacturerRows.length,
                    verifiedFact,
                  ).map((fact) => (
                    <li
                      key={fact}
                      className="rounded-md border border-border bg-surface-muted p-3"
                    >
                      {fact}
                    </li>
                  ))}
                </ul>
              </Card>
              <Card className="p-6">
                <h2 className="text-xl font-black">Timeline highlights</h2>
                <div className="mt-5 grid gap-3">
                  {event.timelineItems.slice(0, 4).map((item) => (
                    <TimelineItem
                      key={item.id}
                      label={item.title}
                      detail={item.description ?? item.type}
                      date={item.occurredAt}
                    />
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </section>

        {verifiedFact ? (
          <>
            <section id="about-the-race" className="scroll-mt-32">
              <SectionTitle
                eyebrow="About"
                title="About the race"
                description="Official-source backed context first; unknown historical details remain clearly marked."
              />
              <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <VerifiedInfoCard
                  title="Event description"
                  value={verifiedFact.eventDescription?.value}
                  sourceIds={verifiedFact.eventDescription?.sourceIds}
                  notes={verifiedFact.eventDescription?.notes}
                />
                <VerifiedInfoCard
                  title="Event history summary"
                  value={verifiedFact.historySummary?.value}
                  sourceIds={verifiedFact.historySummary?.sourceIds}
                  notes={verifiedFact.historySummary?.notes}
                />
                <VerifiedInfoCard
                  title="Official organizer"
                  value={verifiedFact.officialOrganizer?.value}
                  sourceIds={verifiedFact.officialOrganizer?.sourceIds}
                  notes={verifiedFact.officialOrganizer?.notes}
                />
                <VerifiedInfoCard
                  title="Weather"
                  value={verifiedFact.weather?.value}
                  sourceIds={verifiedFact.weather?.sourceIds}
                  notes={verifiedFact.weather?.notes}
                />
              </div>
              <SectionSourceNote eventFact={verifiedFact} />
            </section>

            <section id="race-format" className="scroll-mt-32">
              <SectionTitle
                eyebrow="Format"
                title="Race format"
                description="Prologue and main-race structure will be filled only from official source material."
              />
              <div className="mt-8 grid gap-6 lg:grid-cols-3">
                <VerifiedInfoCard
                  title="Event format"
                  value={verifiedFact.eventFormat?.value}
                  sourceIds={verifiedFact.eventFormat?.sourceIds}
                  notes={verifiedFact.eventFormat?.notes}
                />
                <VerifiedInfoCard
                  title="Prologue explanation"
                  value={verifiedFact.prologueExplanation?.value}
                  sourceIds={verifiedFact.prologueExplanation?.sourceIds}
                  notes={verifiedFact.prologueExplanation?.notes}
                />
                <VerifiedInfoCard
                  title="Main race explanation"
                  value={verifiedFact.mainRaceExplanation?.value}
                  sourceIds={verifiedFact.mainRaceExplanation?.sourceIds}
                  notes={verifiedFact.mainRaceExplanation?.notes}
                />
              </div>
              <SectionSourceNote eventFact={verifiedFact} />
            </section>

            <section id="course" className="scroll-mt-32">
              <SectionTitle
                eyebrow="Course"
                title="Course profile"
                description="Terrain, distance, elevation, and checkpoint data stay pending until official values are verified."
              />
              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <VerifiedInfoCard
                  title="Terrain"
                  value={verifiedFact.terrainDescription?.value}
                  sourceIds={verifiedFact.terrainDescription?.sourceIds}
                  notes={verifiedFact.terrainDescription?.notes}
                  compact
                />
                <VerifiedInfoCard
                  title="Elevation"
                  value={verifiedFact.elevation?.value}
                  sourceIds={verifiedFact.elevation?.sourceIds}
                  notes={verifiedFact.elevation?.notes}
                  compact
                />
                <VerifiedInfoCard
                  title="Distance"
                  value={verifiedFact.distance?.value}
                  sourceIds={verifiedFact.distance?.sourceIds}
                  notes={verifiedFact.distance?.notes}
                  compact
                />
                <VerifiedInfoCard
                  title="Checkpoints"
                  value={verifiedFact.checkpointCount?.value}
                  sourceIds={verifiedFact.checkpointCount?.sourceIds}
                  notes={verifiedFact.checkpointCount?.notes}
                  compact
                />
              </div>
              <SectionSourceNote eventFact={verifiedFact} />
            </section>

            <section id="participants" className="scroll-mt-32">
              <SectionTitle
                eyebrow="Participants"
                title="Verified participant control"
                description="Registered riders, starters, finishers, and race-status buckets stay source-tracked and incomplete until official lists are verified."
              />
              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <VerifiedInfoCard
                  title="Registered riders"
                  value={verifiedFact.participants?.registeredRiders.value}
                  sourceIds={verifiedFact.participants?.registeredRiders.sourceIds}
                  notes={verifiedFact.participants?.registeredRiders.notes}
                  compact
                />
                <VerifiedInfoCard
                  title="Confirmed starters"
                  value={verifiedFact.participants?.confirmedStarters.value}
                  sourceIds={verifiedFact.participants?.confirmedStarters.sourceIds}
                  notes={verifiedFact.participants?.confirmedStarters.notes}
                  compact
                />
                <VerifiedInfoCard
                  title="Verified finishers"
                  value={verifiedFact.participants?.verifiedFinishers.value}
                  sourceIds={verifiedFact.participants?.verifiedFinishers.sourceIds}
                  notes={verifiedFact.participants?.verifiedFinishers.notes}
                  compact
                />
                <VerifiedInfoCard
                  title="DNF"
                  value={verifiedFact.participants?.dnf.value}
                  sourceIds={verifiedFact.participants?.dnf.sourceIds}
                  notes={verifiedFact.participants?.dnf.notes}
                  compact
                />
                <VerifiedInfoCard
                  title="DNS"
                  value={verifiedFact.participants?.dns.value}
                  sourceIds={verifiedFact.participants?.dns.sourceIds}
                  notes={verifiedFact.participants?.dns.notes}
                  compact
                />
                <VerifiedInfoCard
                  title="DSQ"
                  value={verifiedFact.participants?.dsq.value}
                  sourceIds={verifiedFact.participants?.dsq.sourceIds}
                  notes={verifiedFact.participants?.dsq.notes}
                  compact
                />
              </div>
              <div className="mt-6 grid gap-4 lg:grid-cols-4">
                <CrossLinkGroup
                  title="Verified rider links"
                  links={crossNavigation.riders}
                />
                <CrossLinkGroup
                  title="Manufacturer links"
                  links={crossNavigation.manufacturers}
                />
                <CrossLinkGroup title="Team links" links={crossNavigation.teams} />
                <CrossLinkGroup
                  title="Motorcycle links"
                  links={crossNavigation.motorcycles}
                />
              </div>
              <SectionSourceNote eventFact={verifiedFact} />
            </section>

            <section id="race-statistics" className="scroll-mt-32">
              <SectionTitle
                eyebrow="Statistics"
                title="Race statistics"
                description="Only verified statistics are populated. Unknown race metrics remain visible as review-ready placeholders."
              />
              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <VerifiedInfoCard
                  title="Starters"
                  value={verifiedFact.raceStatistics?.starters.value}
                  sourceIds={verifiedFact.raceStatistics?.starters.sourceIds}
                  notes={verifiedFact.raceStatistics?.starters.notes}
                  compact
                />
                <VerifiedInfoCard
                  title="Finishers"
                  value={verifiedFact.raceStatistics?.finishers.value}
                  sourceIds={verifiedFact.raceStatistics?.finishers.sourceIds}
                  notes={verifiedFact.raceStatistics?.finishers.notes}
                  compact
                />
                <VerifiedInfoCard
                  title="Finish rate"
                  value={verifiedFact.raceStatistics?.finishRate.value}
                  sourceIds={verifiedFact.raceStatistics?.finishRate.sourceIds}
                  notes={verifiedFact.raceStatistics?.finishRate.notes}
                  compact
                />
                <VerifiedInfoCard
                  title="Longest stage"
                  value={verifiedFact.raceStatistics?.longestStage.value}
                  sourceIds={verifiedFact.raceStatistics?.longestStage.sourceIds}
                  notes={verifiedFact.raceStatistics?.longestStage.notes}
                  compact
                />
                <VerifiedInfoCard
                  title="Total distance"
                  value={verifiedFact.raceStatistics?.totalDistance.value}
                  sourceIds={verifiedFact.raceStatistics?.totalDistance.sourceIds}
                  notes={verifiedFact.raceStatistics?.totalDistance.notes}
                  compact
                />
                <VerifiedInfoCard
                  title="Elevation gain"
                  value={verifiedFact.raceStatistics?.elevationGain.value}
                  sourceIds={verifiedFact.raceStatistics?.elevationGain.sourceIds}
                  notes={verifiedFact.raceStatistics?.elevationGain.notes}
                  compact
                />
                <VerifiedInfoCard
                  title="Checkpoints"
                  value={verifiedFact.raceStatistics?.checkpointCount.value}
                  sourceIds={verifiedFact.raceStatistics?.checkpointCount.sourceIds}
                  notes={verifiedFact.raceStatistics?.checkpointCount.notes}
                  compact
                />
              </div>
              <SectionSourceNote eventFact={verifiedFact} />
            </section>

            <section id="timeline" className="scroll-mt-32">
              <SectionTitle
                eyebrow="Timeline"
                title="Official event timeline"
                description="Registration, prologue, main race, awards, media, and results-publication milestones are ready for official dates."
              />
              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {verifiedFact.eventTimeline?.map((item) => (
                  <VerifiedTimelineCard key={item.label} item={item} />
                ))}
              </div>
              <SectionSourceNote eventFact={verifiedFact} />
            </section>
          </>
        ) : null}

        <section id="schedule" className="scroll-mt-32">
          <SectionTitle
            eyebrow="Schedule"
            title="Race week schedule"
            description="Professional schedule cards with stage summaries and current status."
          />
          <div className="mt-8 grid gap-3">
            <ScheduleRow
              label="Registration"
              date={
                event.timelineItems.find((item) => item.type === "REGISTRATION_OPEN")
                  ?.occurredAt
              }
              status="Ready"
              summary="Rider check-in, documents, technical control, and demo entry flow."
            />
            {event.stages.map((stage) => (
              <ScheduleRow
                key={stage.id}
                label={stage.name}
                date={stage.startDate}
                status={stage.status}
                summary={`${formatOptional(stage.distanceKm?.toString())} km stage with ${stage.stageResults.length} timing rows.`}
              />
            ))}
            <ScheduleRow
              label="Final classification"
              date={event.endDate}
              status={event.results.length ? "Published" : "Pending"}
              summary="Overall event results and points preview."
            />
          </div>
        </section>

        <section id="stages" className="scroll-mt-32">
          <SectionTitle
            eyebrow="Stages"
            title="Stage-by-stage control"
            description="Each stage includes winner, best time, DNF count, terrain, difficulty, and expandable details."
          />
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {stageCards.map((stage) => (
              <details
                key={stage.id}
                id={`stage-${stage.slug}`}
                className="group scroll-mt-32"
              >
                <summary className="list-none">
                  <Card className="cursor-pointer p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                          Stage {stage.order} / {stage.type}
                        </p>
                        <h3 className="mt-2 text-2xl font-black">{stage.name}</h3>
                      </div>
                      <ChevronDown className="h-5 w-5 text-accent transition group-open:rotate-180" />
                    </div>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <DetailRow label="Distance" value={stage.distance} />
                      <DetailRow label="Winner" value={stage.winner} />
                      <DetailRow label="Best time" value={stage.bestTime} />
                      <DetailRow label="DNF count" value={stage.dnfCount} />
                    </div>
                    <p className="mt-5 text-sm leading-6 text-foreground/[0.62]">
                      {stage.terrain}. Difficulty: {stage.difficulty}. Elevation:{" "}
                      {stage.elevation}.
                    </p>
                  </Card>
                </summary>
                <Card className="mt-2 p-5">
                  <p className="text-sm leading-6 text-foreground/[0.66]">
                    Stage detail placeholder prepared for official maps, checkpoint notes,
                    sector splits, and source-tracked route documents.
                  </p>
                </Card>
              </details>
            ))}
          </div>
        </section>
      </Container>

      <section
        id="results"
        className="scroll-mt-32 border-y border-border bg-black text-white"
      >
        <Container className="py-12">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <SectionTitle
              eyebrow="Results"
              title="Overall and stage classifications"
              description="Sortable timing foundation with gaps, penalties, statuses, and podium emphasis."
            />
            <ButtonLink href="/results" variant="secondary">
              Open Results Module
            </ButtonLink>
          </div>

          <div className="mt-8 grid gap-8">
            <Card className="overflow-hidden border-white/12 bg-white/[0.04] text-white">
              <div className="border-b border-white/10 p-5">
                <h3 className="text-xl font-black">Overall classification</h3>
                <p className="mt-2 text-sm text-white/[0.58]">
                  Filter-ready table structure. Podium rows are highlighted.
                </p>
              </div>
              <OverallResultsTable results={event.results} />
            </Card>

            {event.stages.map((stage) => (
              <section key={stage.id} className="scroll-mt-32">
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                    {stage.stageType}
                  </p>
                  <h3 className="mt-1 text-2xl font-black text-white">{stage.name}</h3>
                </div>
                <StageTimingTable results={mapTimingResults(stage.stageResults)} />
              </section>
            ))}
          </div>
        </Container>
      </section>

      <Container className="grid gap-12 py-12">
        <section id="riders" className="scroll-mt-32">
          <SectionTitle
            eyebrow="Riders"
            title="Entry list and championship context"
            description="Participating rider cards with nationality, team, manufacturer, bike, and season position."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {riderCards.map((rider) => (
              <Link key={rider.slug} href={`/riders/${rider.slug}`}>
                <Card className="h-full p-5">
                  <div className="aspect-square rounded-md bg-[linear-gradient(135deg,hsl(0_0%_10%),hsl(24_78%_24%))]" />
                  <h3 className="mt-4 text-xl font-black">{rider.name}</h3>
                  <p className="mt-1 text-sm text-foreground/[0.58]">
                    {rider.country} / {rider.team}
                  </p>
                  <div className="mt-4 grid gap-2 text-sm">
                    <DetailRow label="Manufacturer" value={rider.manufacturer} compact />
                    <DetailRow label="Bike" value={rider.motorcycle} compact />
                    <DetailRow
                      label="Championship"
                      value={rider.championshipPosition}
                      compact
                    />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section id="manufacturers" className="grid scroll-mt-32 gap-8 lg:grid-cols-2">
          <div>
            <SectionTitle
              eyebrow="Manufacturers"
              title="Factory performance"
              description="Bike counts, best result, wins, and podiums represented at this event."
            />
            {verifiedFact?.manufacturerContext ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <VerifiedInfoCard
                  title="Factory participation"
                  value={verifiedFact.manufacturerContext.factoryParticipation.value}
                  sourceIds={
                    verifiedFact.manufacturerContext.factoryParticipation.sourceIds
                  }
                  notes={verifiedFact.manufacturerContext.factoryParticipation.notes}
                  compact
                />
                <VerifiedInfoCard
                  title="Participating manufacturers"
                  value={
                    verifiedFact.manufacturerContext.participatingManufacturers.value
                  }
                  sourceIds={
                    verifiedFact.manufacturerContext.participatingManufacturers.sourceIds
                  }
                  notes={
                    verifiedFact.manufacturerContext.participatingManufacturers.notes
                  }
                  compact
                />
                <VerifiedInfoCard
                  title="Factory riders"
                  value={verifiedFact.manufacturerContext.factoryRiders.value}
                  sourceIds={verifiedFact.manufacturerContext.factoryRiders.sourceIds}
                  notes={verifiedFact.manufacturerContext.factoryRiders.notes}
                  compact
                />
                <VerifiedInfoCard
                  title="Private riders"
                  value={verifiedFact.manufacturerContext.privateRiders.value}
                  sourceIds={verifiedFact.manufacturerContext.privateRiders.sourceIds}
                  notes={verifiedFact.manufacturerContext.privateRiders.notes}
                  compact
                />
              </div>
            ) : null}
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
          </div>
          <div id="teams" className="scroll-mt-32">
            <SectionTitle
              eyebrow="Teams"
              title="Team representation"
              description="Seeded team summary derived from participating riders."
            />
            {verifiedFact?.teamContext ? (
              <div className="mt-8 grid gap-4">
                <VerifiedInfoCard
                  title="Factory teams"
                  value={verifiedFact.teamContext.factoryTeams.value}
                  sourceIds={verifiedFact.teamContext.factoryTeams.sourceIds}
                  notes={verifiedFact.teamContext.factoryTeams.notes}
                  compact
                />
                <VerifiedInfoCard
                  title="Independent teams"
                  value={verifiedFact.teamContext.independentTeams.value}
                  sourceIds={verifiedFact.teamContext.independentTeams.sourceIds}
                  notes={verifiedFact.teamContext.independentTeams.notes}
                  compact
                />
                <VerifiedInfoCard
                  title="Support teams"
                  value={verifiedFact.teamContext.supportTeams.value}
                  sourceIds={verifiedFact.teamContext.supportTeams.sourceIds}
                  notes={verifiedFact.teamContext.supportTeams.notes}
                  compact
                />
              </div>
            ) : null}
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
          </div>
          {verifiedFact ? (
            <div className="lg:col-span-2">
              <SectionSourceNote eventFact={verifiedFact} />
            </div>
          ) : null}
        </section>

        {verifiedFact?.motorcycleContext ? (
          <section id="motorcycles" className="scroll-mt-32">
            <SectionTitle
              eyebrow="Motorcycles"
              title="Motorcycle participation"
              description="Model, engine, and manufacturer facts remain placeholders until verified source material confirms them."
            />
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <VerifiedInfoCard
                title="Motorcycle models"
                value={verifiedFact.motorcycleContext.motorcycleModels.value}
                sourceIds={verifiedFact.motorcycleContext.motorcycleModels.sourceIds}
                notes={verifiedFact.motorcycleContext.motorcycleModels.notes}
                compact
              />
              <VerifiedInfoCard
                title="Engine size"
                value={verifiedFact.motorcycleContext.engineSize.value}
                sourceIds={verifiedFact.motorcycleContext.engineSize.sourceIds}
                notes={verifiedFact.motorcycleContext.engineSize.notes}
                compact
              />
              <VerifiedInfoCard
                title="Manufacturer"
                value={verifiedFact.motorcycleContext.manufacturer.value}
                sourceIds={verifiedFact.motorcycleContext.manufacturer.sourceIds}
                notes={verifiedFact.motorcycleContext.manufacturer.notes}
                compact
              />
            </div>
            <div className="mt-6">
              <CrossLinkGroup
                title="Linked motorcycles from verified rows"
                links={crossNavigation.motorcycles}
              />
            </div>
            <SectionSourceNote eventFact={verifiedFact} />
          </section>
        ) : null}

        <section id="history" className="scroll-mt-32">
          <SectionTitle
            eyebrow="History"
            title="Previous editions and records"
            description="Timeline of seeded previous editions, winners, highlights, and event records."
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
            <div className="grid gap-3">
              {event.previousEditions.length > 0 ? (
                event.previousEditions.map((edition) => {
                  const winner = edition.results[0]?.rider;

                  return (
                    <Link key={edition.id} href={`/events/${edition.slug}`}>
                      <Card className="grid gap-3 p-5 sm:grid-cols-[120px_1fr_160px]">
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
                  description="This event is ready for historical editions as seeded or imported data grows."
                />
              )}
            </div>
            <Card className="p-6">
              <Trophy className="h-5 w-5 text-accent" aria-hidden="true" />
              <h3 className="mt-5 text-xl font-black">Event records preview</h3>
              <div className="mt-5 grid gap-3">
                <DetailRow
                  label="Fastest stage"
                  value={fastestStage?.totalTimeText ?? "Pending"}
                />
                <DetailRow
                  label="Largest field"
                  value={
                    verifiedFinisherCount
                      ? `${verifiedFinisherCount} verified finishers`
                      : `${event.results.length} classified rows`
                  }
                />
                <DetailRow
                  label="Best manufacturer"
                  value={manufacturerRows[0]?.name ?? "Pending"}
                />
                <DetailRow
                  label="Podium sweep"
                  value={getPodiumSweep(manufacturerRows)}
                />
              </div>
            </Card>
          </div>
        </section>

        {verifiedFact ? (
          <>
            <section id="verified-facts" className="scroll-mt-32">
              <SectionTitle
                eyebrow="Verified"
                title="Verified facts"
                description="Only approved event facts are shown here; partial data is labeled instead of filled by assumption."
              />
              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <VerifiedInfoCard
                  title="Winner"
                  value={verifiedFact.verifiedWinner}
                  sourceIds={verifiedFact.sourceIds}
                  notes={verifiedFact.factsNote}
                  compact
                />
                <VerifiedInfoCard
                  title="Podium"
                  value="1 Manuel Lettenbichler / 2 Trystan Hart / 3 Mario Roman"
                  sourceIds={verifiedFact.sourceIds}
                  notes="Verified first-pass podium only. Full results remain pending."
                  compact
                />
                <VerifiedInfoCard
                  title="Finishers"
                  value={`${verifiedFact.verifiedFinisherCount ?? UNKNOWN_VERIFIED_VALUE}`}
                  sourceIds={verifiedFact.sourceIds}
                  notes="Verified finisher count; full finisher list remains pending."
                  compact
                />
                <VerifiedInfoCard
                  title="Finish rate"
                  value={verifiedFact.finishRate?.value}
                  sourceIds={verifiedFact.finishRate?.sourceIds}
                  notes={verifiedFact.finishRate?.notes}
                  compact
                />
              </div>
              <SectionSourceNote eventFact={verifiedFact} />
            </section>

            <section id="official-links" className="scroll-mt-32">
              <SectionTitle
                eyebrow="Official"
                title="Official links"
                description="Official and trusted links only. Missing links stay as verified placeholders."
              />
              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {verifiedOfficialLinks.map((link) => (
                  <OfficialLinkCard key={`${link.group}-${link.label}`} link={link} />
                ))}
              </div>
              <SectionSourceNote eventFact={verifiedFact} />
            </section>
          </>
        ) : null}

        <section id="media" className="scroll-mt-32">
          <SectionTitle
            eyebrow="Media"
            title="Gallery, video, and social lanes"
            description="Demo media placeholders are source-aware and ready for future approval workflows."
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="grid gap-3 sm:grid-cols-3">
              {verifiedFact?.officialMediaGalleryPlaceholders?.map((item) => (
                <OfficialPlaceholderCard
                  key={item.label}
                  icon={ImageIcon}
                  title={item.label}
                  link={item}
                />
              ))}
              {event.mediaItems.slice(0, 9).map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <div className="aspect-[4/3] bg-[linear-gradient(135deg,hsl(0_0%_11%),hsl(24_78%_26%))]" />
                  <div className="p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-accent">
                      {item.type}
                    </p>
                    <h3 className="mt-2 font-semibold">{item.title ?? "Demo media"}</h3>
                  </div>
                </Card>
              ))}
            </div>
            <Card className="p-6">
              <h3 className="text-xl font-black">Media statistics</h3>
              <div className="mt-5 grid gap-3">
                <DetailRow label="Gallery items" value={String(mediaStats.images)} />
                <DetailRow label="Videos" value={String(mediaStats.videos)} />
                <DetailRow label="Documents" value={String(mediaStats.documents)} />
                <DetailRow label="Social lane" value="Placeholder ready" />
              </div>
            </Card>
          </div>
          {verifiedFact ? <SectionSourceNote eventFact={verifiedFact} /> : null}
        </section>

        <section id="documents" className="scroll-mt-32">
          <SectionTitle
            eyebrow="Documents"
            title="Official document center"
            description="Regulations, entry lists, final results, and PDF placeholders remain demo-only until approved sources are connected."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {verifiedFact?.officialPdfPlaceholders?.map((item) => (
              <OfficialPlaceholderCard
                key={item.label}
                icon={FileText}
                title={item.label}
                link={item}
              />
            ))}
            {documents.map((document) => (
              <Card key={document.title} className="p-5">
                <document.icon className="h-5 w-5 text-accent" aria-hidden="true" />
                <h3 className="mt-5 text-lg font-black">{document.title}</h3>
                <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
                  {document.description}
                </p>
                <span className="mt-5 inline-flex h-10 items-center rounded-md border border-border bg-surface-muted px-3 text-sm font-semibold">
                  {document.status}
                </span>
              </Card>
            ))}
          </div>
          {verifiedFact ? <SectionSourceNote eventFact={verifiedFact} /> : null}
        </section>
      </Container>
    </main>
  );
}

function HeroFact({ icon: Icon, value }: { icon: typeof Flag; value: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Icon className="h-4 w-4 text-accent" aria-hidden="true" />
      {value}
    </span>
  );
}

function BrandBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/12 bg-black/30 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-white/[0.52]">{label}</p>
      <p className="mt-2 text-lg font-black">{value}</p>
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-white/12 bg-white/[0.06] p-4 text-white">
      <p className="text-xs uppercase tracking-[0.18em] text-white/[0.5]">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </Card>
  );
}

function DetailRow({
  label,
  value,
  compact,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-surface-muted",
        compact ? "p-2" : "p-3",
      )}
    >
      <p className="text-xs uppercase tracking-[0.16em] text-foreground/[0.46]">
        {label}
      </p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function VerifiedInfoCard({
  title,
  value,
  sourceIds,
  notes,
  compact,
}: {
  title: string;
  value: string | number | null | undefined;
  sourceIds?: string[];
  notes?: string;
  compact?: boolean;
}) {
  const displayValue =
    value === null || value === undefined || value === ""
      ? UNKNOWN_VERIFIED_VALUE
      : String(value);

  return (
    <Card className={cn("p-6", compact && "p-4")}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
        {title}
      </p>
      <p className={cn("mt-3 font-black", compact ? "text-lg" : "text-2xl")}>
        {displayValue}
      </p>
      {notes ? (
        <p className="mt-3 text-sm leading-6 text-foreground/[0.62]">{notes}</p>
      ) : null}
      <SourceTrail sourceIds={sourceIds} />
    </Card>
  );
}

function SourceTrail({ sourceIds }: { sourceIds?: string[] }) {
  const labels =
    sourceIds?.map((sourceId) => getOfficialSource(sourceId)?.name ?? sourceId) ?? [];

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {labels.length > 0 ? (
        labels.map((label) => (
          <span
            key={label}
            className="rounded-sm border border-border bg-surface-muted px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/[0.54]"
          >
            Source: {label}
          </span>
        ))
      ) : (
        <span className="rounded-sm border border-border bg-surface-muted px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/[0.54]">
          Source: {UNKNOWN_VERIFIED_VALUE}
        </span>
      )}
    </div>
  );
}

function SectionSourceNote({ eventFact }: { eventFact: VerifiedEventFact }) {
  const review = eventFact.review;

  return (
    <Card className="mt-6 border-dashed p-4">
      <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-foreground/[0.58]">
        <span>Verified source support</span>
        <span>/</span>
        <span>Last reviewed: {review?.lastReviewed ?? UNKNOWN_VERIFIED_VALUE}</span>
        <span>/</span>
        <span>Confidence: {review?.confidence ?? UNKNOWN_VERIFIED_VALUE}</span>
      </div>
      {review?.notes ? (
        <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">{review.notes}</p>
      ) : null}
      <SourceTrail sourceIds={review?.sourceIds ?? eventFact.sourceIds} />
    </Card>
  );
}

function VerifiedTimelineCard({
  item,
}: {
  item: NonNullable<VerifiedEventFact["eventTimeline"]>[number];
}) {
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
        {item.status}
      </p>
      <h3 className="mt-3 text-xl font-black">{item.label}</h3>
      <p className="mt-3 text-sm leading-6 text-foreground/[0.62]">
        {item.description ?? UNKNOWN_VERIFIED_VALUE}
      </p>
      <p className="mt-4 text-sm font-semibold">{item.date ?? UNKNOWN_VERIFIED_VALUE}</p>
      <p className="mt-3 text-sm leading-6 text-foreground/[0.62]">{item.notes}</p>
      <SourceTrail sourceIds={item.sourceIds} />
    </Card>
  );
}

function CrossLinkGroup({ title, links }: { title: string; links: CrossLink[] }) {
  return (
    <Card className="p-5">
      <h3 className="text-lg font-black">{title}</h3>
      <div className="mt-4 grid gap-2">
        {links.length > 0 ? (
          links.map((link) => (
            <Link
              key={`${link.href}-${link.label}`}
              href={link.href}
              className="rounded-md border border-border bg-surface-muted p-3 transition hover:border-accent hover:text-accent"
            >
              <span className="block text-sm font-semibold">{link.label}</span>
              <span className="mt-1 block text-xs text-foreground/[0.54]">
                {link.detail}
              </span>
            </Link>
          ))
        ) : (
          <div className="rounded-md border border-dashed border-border bg-surface-muted p-3 text-sm text-foreground/[0.58]">
            {UNKNOWN_VERIFIED_VALUE}
          </div>
        )}
      </div>
    </Card>
  );
}

type OfficialLinkItem = VerifiedSourcedLink & {
  group: string;
};

function OfficialLinkCard({ link }: { link: OfficialLinkItem }) {
  const content = (
    <Card className="h-full p-5">
      <div className="flex items-start gap-3">
        {getOfficialLinkIcon(link.group)}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            {link.group}
          </p>
          <h3 className="mt-2 text-lg font-black">{link.label}</h3>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-foreground/[0.62]">
        {link.url ?? UNKNOWN_VERIFIED_VALUE}
      </p>
      <p className="mt-3 text-sm leading-6 text-foreground/[0.62]">{link.notes}</p>
      <SourceTrail sourceIds={link.sourceIds} />
    </Card>
  );

  return link.url ? (
    <a href={link.url} target="_blank" rel="noreferrer" className="block h-full">
      {content}
    </a>
  ) : (
    content
  );
}

function OfficialPlaceholderCard({
  icon: Icon,
  title,
  link,
}: {
  icon: typeof FileText;
  title: string;
  link: VerifiedSourcedLink;
}) {
  return (
    <Card className="p-5">
      <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
      <h3 className="mt-5 text-lg font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
        {link.url ?? UNKNOWN_VERIFIED_VALUE}
      </p>
      <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">{link.notes}</p>
      <SourceTrail sourceIds={link.sourceIds} />
    </Card>
  );
}

function getOfficialLinkIcon(group: string) {
  if (group === "Website") {
    return <Globe2 className="mt-1 h-5 w-5 text-accent" aria-hidden="true" />;
  }

  if (group === "YouTube") {
    return <Youtube className="mt-1 h-5 w-5 text-accent" aria-hidden="true" />;
  }

  return <LinkIcon className="mt-1 h-5 w-5 text-accent" aria-hidden="true" />;
}

function TimelineItem({
  label,
  detail,
  date,
}: {
  label: string;
  detail: string;
  date: Date | null;
}) {
  return (
    <div className="grid gap-1 rounded-md border border-border bg-surface-muted p-3">
      <p className="font-semibold">{label}</p>
      <p className="text-sm text-foreground/[0.62]">{detail}</p>
      <p className="text-xs uppercase tracking-[0.14em] text-accent">
        {date ? formatDate(date) : "Date TBC"}
      </p>
    </div>
  );
}

function ScheduleRow({
  label,
  date,
  status,
  summary,
}: {
  label: string;
  date: Date | null | undefined;
  status: string;
  summary: string;
}) {
  return (
    <Card className="grid gap-4 p-5 md:grid-cols-[190px_150px_120px_1fr] md:items-center">
      <h3 className="text-lg font-black">{label}</h3>
      <p className="text-sm text-foreground/[0.62]">{date ? formatDate(date) : "TBC"}</p>
      <Badge>{status}</Badge>
      <p className="text-sm leading-6 text-foreground/[0.62]">{summary}</p>
    </Card>
  );
}

function OverallResultsTable({ results }: { results: Result[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1180px] text-left text-sm">
        <thead className="bg-white/[0.06] text-xs uppercase tracking-[0.18em] text-white/[0.62]">
          <tr>
            {[
              "Pos",
              "Rider",
              "Country",
              "Team",
              "Manufacturer",
              "Bike",
              "Time",
              "Gap",
              "Penalty",
              "Points",
              "Status",
            ].map((heading) => (
              <th key={heading} className="px-4 py-3 font-semibold">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.map((result) => {
            const podium = result.overallPosition !== null && result.overallPosition <= 3;

            return (
              <tr
                key={result.id}
                className={cn("border-t border-white/10", podium && "bg-accent/10")}
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
                <td className="px-4 py-4">{result.rider.country?.isoCode ?? "TBC"}</td>
                <td className="px-4 py-4 text-white/[0.66]">
                  {getTeamName(result.rider)}
                </td>
                <td className="px-4 py-4">
                  {result.manufacturer?.name ??
                    result.motorcycle?.manufacturer.name ??
                    "TBC"}
                </td>
                <td className="px-4 py-4 text-white/[0.66]">
                  {result.motorcycle
                    ? `${result.motorcycle.manufacturer.name} ${result.motorcycle.model}`
                    : "TBC"}
                </td>
                <td className="px-4 py-4 font-mono">
                  {formatOptional(result.totalTimeText)}
                </td>
                <td className="px-4 py-4 font-mono">
                  {formatOptional(result.gapToLeaderText)}
                </td>
                <td className="px-4 py-4 font-mono">
                  {formatOptional(
                    result.penaltiesMs
                      ? `${Math.round(result.penaltiesMs / 1000)}s`
                      : null,
                  )}
                </td>
                <td className="px-4 py-4 font-black">{formatOptional(result.points)}</td>
                <td className="px-4 py-4">
                  <span className="rounded-sm border border-white/12 bg-white/10 px-2 py-1 text-xs font-semibold">
                    {result.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SummaryTable({ headings, rows }: { headings: string[]; rows: string[][] }) {
  return (
    <Card className="mt-8 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="bg-black text-xs uppercase tracking-[0.18em] text-white/[0.64]">
            <tr>
              {headings.map((heading) => (
                <th key={heading} className="px-4 py-3 font-semibold">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.join("-")} className="border-t border-border">
                {row.map((cell) => (
                  <td key={cell} className="px-4 py-4">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function mapTimingResults(results: Stage["stageResults"]): StageTimingResult[] {
  return results.map((result) => ({
    id: result.id,
    overallPosition: result.overallPosition,
    classPosition: result.classPosition,
    className: result.className,
    riderName: `${result.rider.firstName} ${result.rider.lastName}`,
    countryCode: result.rider.country?.isoCode ?? null,
    teamName: result.rider.teamMemberships[0]?.team.name ?? null,
    manufacturerName:
      result.manufacturer?.name ?? result.motorcycle?.manufacturer.name ?? null,
    motorcycleName: result.motorcycle
      ? `${result.motorcycle.manufacturer.name} ${result.motorcycle.model}${
          result.motorcycle.year ? ` ${result.motorcycle.year}` : ""
        }`
      : null,
    totalTimeText: result.totalTimeText,
    totalTimeMs: result.totalTimeMs,
    gapToLeaderText: result.gapToLeaderText,
    gapToLeaderMs: result.gapToLeaderMs,
    penaltiesText: result.penaltiesText,
    penaltiesMs: result.penaltiesMs,
    status: result.status,
  }));
}

function buildStageCard(stage: Stage, terrain: string, elevation: string) {
  const finishedResults = stage.stageResults.filter(
    (result) => result.status === "FINISHED",
  );
  const winner = finishedResults.find((result) => result.overallPosition === 1);
  const bestTime = finishedResults
    .filter((result) => result.totalTimeMs !== null)
    .sort((a, b) => (a.totalTimeMs ?? 0) - (b.totalTimeMs ?? 0))[0];
  const dnfCount = stage.stageResults.filter((result) => result.status === "DNF").length;

  return {
    id: stage.id,
    slug: stage.slug,
    order: stage.stageOrder,
    type: stage.stageType,
    name: stage.name,
    distance: stage.distanceKm ? `${stage.distanceKm.toString()} km` : "Distance TBC",
    terrain: terrain || "Demo technical hard enduro terrain",
    elevation: elevation || "Elevation TBC",
    winner: winner ? winnerName(winner.rider) : "Pending",
    bestTime: bestTime?.totalTimeText ?? "Pending",
    dnfCount: String(dnfCount),
    difficulty: getDifficultyLabel(stage.stageOrder),
  };
}

function buildRiderCards(event: EventDetail) {
  return event.results.slice(0, 24).map((result) => {
    const standing = result.rider.standings.find(
      (item) => item.seasonId === event.seasonId,
    );

    return {
      slug: result.rider.slug,
      name: winnerName(result.rider),
      country: result.rider.country?.name ?? "Country TBC",
      team: getTeamName(result.rider),
      manufacturer:
        result.manufacturer?.name ?? result.motorcycle?.manufacturer.name ?? "TBC",
      motorcycle: result.motorcycle
        ? `${result.motorcycle.manufacturer.name} ${result.motorcycle.model}`
        : "TBC",
      championshipPosition: standing?.position ? `P${standing.position}` : "Unranked",
    };
  });
}

function buildCrossNavigation(event: EventDetail) {
  const riders: CrossLink[] = [];
  const manufacturers: CrossLink[] = [];
  const teams: CrossLink[] = [];
  const motorcycles: CrossLink[] = [];
  const seen = new Set<string>();

  event.results.forEach((result) => {
    addCrossLink(seen, riders, {
      label: winnerName(result.rider),
      href: `/riders/${result.rider.slug}`,
      detail: `Verified row: ${formatOptional(result.overallPosition)}`,
    });

    const manufacturer = result.manufacturer ?? result.motorcycle?.manufacturer ?? null;
    if (manufacturer) {
      addCrossLink(seen, manufacturers, {
        label: manufacturer.name,
        href: `/manufacturers/${manufacturer.slug}`,
        detail: "Linked from verified result row",
      });
    }

    const team = result.rider.teamMemberships[0]?.team;
    if (team) {
      addCrossLink(seen, teams, {
        label: team.name,
        href: `/teams/${team.slug}`,
        detail: "Linked through rider profile",
      });
    }

    if (result.motorcycle) {
      addCrossLink(seen, motorcycles, {
        label: `${result.motorcycle.manufacturer.name} ${result.motorcycle.model}`,
        href: `/motorcycles/${result.motorcycle.slug}`,
        detail: result.motorcycle.year
          ? `${result.motorcycle.year} model`
          : "Linked from verified result row",
      });
    }
  });

  return { riders, manufacturers, teams, motorcycles };
}

function addCrossLink(seen: Set<string>, links: CrossLink[], link: CrossLink) {
  if (seen.has(link.href)) {
    return;
  }

  seen.add(link.href);
  links.push(link);
}

function buildManufacturerRows(results: Result[]) {
  const map = new Map<
    string,
    { name: string; entries: number; best: number; wins: number; podiums: number }
  >();

  results.forEach((result) => {
    const name =
      result.manufacturer?.name ?? result.motorcycle?.manufacturer.name ?? "TBC";
    const current = map.get(name) ?? {
      name,
      entries: 0,
      best: 999,
      wins: 0,
      podiums: 0,
    };
    current.entries += 1;
    current.best = Math.min(current.best, result.overallPosition ?? 999);
    current.wins += result.overallPosition === 1 ? 1 : 0;
    current.podiums += result.overallPosition && result.overallPosition <= 3 ? 1 : 0;
    map.set(name, current);
  });

  return Array.from(map.values())
    .sort((a, b) => a.best - b.best)
    .map((row) => ({
      ...row,
      bestResult: row.best === 999 ? "TBC" : `P${row.best}`,
    }));
}

function buildTeamRows(results: Result[]) {
  const map = new Map<
    string,
    { name: string; entries: number; best: number; wins: number; podiums: number }
  >();

  results.forEach((result) => {
    const name = getTeamName(result.rider);
    const current = map.get(name) ?? {
      name,
      entries: 0,
      best: 999,
      wins: 0,
      podiums: 0,
    };
    current.entries += 1;
    current.best = Math.min(current.best, result.overallPosition ?? 999);
    current.wins += result.overallPosition === 1 ? 1 : 0;
    current.podiums += result.overallPosition && result.overallPosition <= 3 ? 1 : 0;
    map.set(name, current);
  });

  return Array.from(map.values())
    .sort((a, b) => a.best - b.best)
    .map((row) => ({
      ...row,
      bestResult: row.best === 999 ? "TBC" : `P${row.best}`,
    }));
}

function buildDocuments(event: EventDetail) {
  return [
    {
      icon: ClipboardList,
      title: "Regulations",
      description: "Demo regulations PDF placeholder prepared for source tracking.",
      status: "Preview PDF",
    },
    {
      icon: Users,
      title: "Entry list",
      description: `${event.results.length} seeded rider entries available in preview.`,
      status: "Seeded",
    },
    {
      icon: Trophy,
      title: "Final results",
      description: event.results.length
        ? "Final classification demo table is available."
        : "Final classification pending.",
      status: event.results.length ? "Available" : "Pending",
    },
    {
      icon: Download,
      title: "Download pack",
      description: "Future approved document bundle placeholder.",
      status: "Placeholder",
    },
  ];
}

function buildOfficialLinks(eventFact: VerifiedEventFact | null): OfficialLinkItem[] {
  if (!eventFact) {
    return [];
  }

  return [
    eventFact.officialWebsite ? { ...eventFact.officialWebsite, group: "Website" } : null,
    ...(eventFact.officialSocialLinks ?? []).map((link) => ({
      ...link,
      group: "Social",
    })),
    ...(eventFact.officialYoutubeLinks ?? []).map((link) => ({
      ...link,
      group: "YouTube",
    })),
    ...(eventFact.officialDocumentPlaceholders ?? []).map((link) => ({
      ...link,
      group: "Documents",
    })),
  ].filter((link) => link !== null);
}

function buildMediaStats(mediaItems: EventDetail["mediaItems"]) {
  return {
    images: mediaItems.filter((item) => item.type === "IMAGE").length,
    videos: mediaItems.filter((item) => item.type === "VIDEO" || item.type === "YOUTUBE")
      .length,
    documents: mediaItems.filter((item) => item.type === "DOCUMENT").length,
  };
}

function getTeamName(rider: Result["rider"]) {
  return rider.teamMemberships[0]?.team.name ?? "Independent";
}

function winnerName(rider: { firstName: string; lastName: string } | null | undefined) {
  return rider ? `${rider.firstName} ${rider.lastName}` : "Pending";
}

function buildOverview(event: EventDetail, terrain: string, elevation: string) {
  return `${event.country?.name ?? "Demo country"} hosts ${event.name}, a seeded championship event profile covering ${terrain || "hard enduro terrain"} with ${elevation || "event elevation"} and complete demo timing context.`;
}

function extractDescriptionField(description: string | null, label: string) {
  if (!description) {
    return "";
  }

  const match = description.match(new RegExp(`${label}:\\s*([^.]*)`, "i"));
  return match?.[1]?.trim() ?? "";
}

function parseOptionalInt(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function getDifficultyLabel(seed: number | null | undefined) {
  const labels = ["Severe", "Extreme", "Technical", "Endurance", "Elite"];
  return labels[(seed ?? 0) % labels.length];
}

function getTotalDistance(stages: Stage[]) {
  const total = stages.reduce((sum, stage) => sum + Number(stage.distanceKm ?? 0), 0);
  return total > 0 ? `${Math.round(total)} km` : "Distance TBC";
}

function buildFacts(
  event: EventDetail,
  terrain: string,
  elevation: string,
  manufacturerCount: number,
  verifiedFact: VerifiedEventFact | null,
) {
  if (verifiedFact) {
    return [
      `${event.results.length} verified first-pass overall result rows are connected to rider, team, manufacturer, and motorcycle records.`,
      `${verifiedFact.verifiedFinisherCount ?? UNKNOWN_VERIFIED_VALUE} finishers are verified; complete timing and full finisher details remain pending.`,
      `Official-source placeholders are attached for documents, media, and event-format verification.`,
      `${terrain || "Terrain"} and ${elevation || "elevation"} remain database metadata unless confirmed by official source material.`,
    ];
  }

  return [
    `${event.results.length} seeded entries are connected to rider, team, manufacturer, and motorcycle records.`,
    `${event.stages.length} stages are prepared for timing, live-status, and future source-tracked updates.`,
    `${manufacturerCount} manufacturers are represented in the current seeded event classification.`,
    `${terrain || "Terrain"} and ${elevation || "elevation"} metadata are preserved in the demo overview text.`,
  ];
}

function getPodiumSweep(rows: Array<{ name: string; podiums: number }>) {
  const row = rows.find((item) => item.podiums >= 3);
  return row ? `${row.name} demo sweep` : "No seeded sweep";
}
