import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  CloudSun,
  Download,
  FileText,
  Film,
  Flag,
  GalleryHorizontal,
  MapPin,
  Mountain,
  Newspaper,
  Trophy,
  Users,
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
import { PageHero } from "@/components/ui/page-hero";
import { SectionTitle } from "@/components/ui/section-title";
import { siteConfig } from "@/config/site";
import { getEventDetail } from "@/db/events";
import { formatDateRange, formatOptional } from "@/lib/format";

export const dynamic = "force-dynamic";

type EventDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const stageLabels = ["Prologue", "Day 1", "Day 2", "Day 3"];

export async function generateMetadata({
  params,
}: EventDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventDetail(slug);
  const description =
    event.description ??
    `${event.name} event profile, stages, timing table, winners history, and related content.`;
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
  const latestWeather = event.weatherSnapshots[0];
  const finalWinner = event.results[0]?.rider;
  const allStageResults = event.stages.flatMap((stage) => stage.stageResults);
  const finishers = event.results.filter((result) => result.status === "FINISHED").length;
  const dnfCount = event.results.filter((result) => result.status === "DNF").length;
  const fastestStage = allStageResults
    .filter((result) => result.totalTimeMs !== null)
    .sort((a, b) => (a.totalTimeMs ?? 0) - (b.totalTimeMs ?? 0))[0];
  const averageStageTime = getAverageStageTime(
    allStageResults.map((result) => result.totalTimeMs),
  );

  return (
    <main className="min-h-screen bg-surface text-foreground">
      <PageHero
        compact
        eyebrow={`Round ${event.roundNumber ?? "TBC"} • ${event.season.year}`}
        title={event.name}
        description={event.description ?? "A production-ready event profile foundation."}
      >
        <div className="grid gap-5">
          <Breadcrumb
            items={[{ label: "Events", href: "/events" }, { label: event.name }]}
          />
          <div className="flex flex-wrap gap-3 text-sm text-white/[0.68]">
            <span className="inline-flex items-center gap-2">
              <Flag className="h-4 w-4 text-accent" />
              {event.country?.name ?? "Country TBC"}
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-accent" />
              {formatDateRange(event.startDate, event.endDate)}
            </span>
            <span className="inline-flex items-center gap-2">
              <Mountain className="h-4 w-4 text-accent" />
              1,466 m elevation profile
            </span>
          </div>
        </div>
      </PageHero>

      <Container className="grid gap-8 py-12 lg:grid-cols-[1fr_360px]">
        <section>
          <SectionTitle
            eyebrow="Event Overview"
            title="A flagship event module for timing, terrain, history, and race-week context."
            description="This page keeps the current seeded data model intact while preparing the layout for future official PDFs, media, weather, and richer event metadata."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <InfoCard
              icon={MapPin}
              label="Location"
              value={event.venue ?? event.city ?? "TBC"}
            />
            <InfoCard icon={Flag} label="Country" value={event.country?.name ?? "TBC"} />
            <InfoCard icon={Mountain} label="Elevation" value="1,466 m race profile" />
            <InfoCard
              icon={CloudSun}
              label="Weather"
              value={
                latestWeather
                  ? `${formatOptional(latestWeather.temperatureC?.toString())} C, ${latestWeather.weatherDescription}`
                  : "Weather feed placeholder"
              }
            />
          </div>

          <Card className="mt-6 p-6">
            <h2 className="text-xl font-semibold">Terrain description</h2>
            <p className="mt-3 leading-7 text-foreground/[0.68]">
              Steep forest climbs, loose rock, exposed ridgelines, and technical final
              sectors. The terrain field is currently a premium placeholder and is ready
              for official event metadata in a later step.
            </p>
          </Card>
        </section>

        <aside className="grid gap-4">
          <Card className="overflow-hidden">
            <div className="min-h-48 bg-[linear-gradient(135deg,hsl(0_0%_5%),hsl(24_82%_18%)_52%,hsl(42_70%_24%))]" />
            <div className="p-5">
              <Badge>{event.liveStatus}</Badge>
              <h2 className="mt-4 text-xl font-semibold">Event control panel</h2>
              <p className="mt-3 text-sm leading-6 text-foreground/[0.64]">
                Official document, gallery, video, and weather placeholders are staged
                here without implementing those modules yet.
              </p>
            </div>
          </Card>
          <PlaceholderLink icon={Download} label="Official PDF" />
          <PlaceholderLink icon={GalleryHorizontal} label="Gallery" />
          <PlaceholderLink icon={Film} label="Video" />
        </aside>
      </Container>

      <section className="border-y border-border bg-surface-muted">
        <Container className="py-12">
          <SectionTitle
            eyebrow="Event Statistics"
            title="Race summary"
            description="Calculated from seeded timing and final classification rows where available."
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <SummaryCard label="Winner" value={winnerName(finalWinner)} icon={Trophy} />
            <SummaryCard
              label="Fastest Stage"
              value={fastestStage?.totalTimeText ?? "Pending"}
              icon={CalendarDays}
            />
            <SummaryCard
              label="Total Riders"
              value={String(event.results.length)}
              icon={Users}
            />
            <SummaryCard label="Finishers" value={String(finishers)} icon={Flag} />
            <SummaryCard label="DNF" value={String(dnfCount)} icon={FileText} />
            <SummaryCard label="Avg Time" value={averageStageTime} icon={CloudSun} />
          </div>
        </Container>
      </section>

      <Container className="py-12">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle
            eyebrow="Stage Navigation"
            title="Stage-ready structure"
            description="Each stage section is URL-ready and prepared for future dedicated stage pages."
          />
          <ButtonLink href="#timing" variant="secondary">
            Jump to Timing
          </ButtonLink>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {stageLabels.map((label, index) => {
            const stage = event.stages[index];
            const href = stage ? `#stage-${stage.slug}` : `#stage-${index + 1}`;

            return (
              <Link key={label} href={href}>
                <Card className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                    Stage {index + 1}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">{stage?.name ?? label}</h2>
                  <p className="mt-3 text-sm text-foreground/[0.6]">
                    {stage
                      ? `${stage.stageResults.length} timing row`
                      : "URL-ready placeholder"}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      </Container>

      <section id="timing" className="border-y border-border bg-black text-white">
        <Container className="py-12">
          <SectionTitle
            eyebrow="Timing Table"
            title="Sortable stage classification foundation"
            description="Position, rider, country, team, manufacturer, motorcycle, time, gaps, penalties, and status."
          />
          <div className="mt-8 grid gap-8">
            {event.stages.map((stage) => (
              <section key={stage.id} id={`stage-${stage.slug}`} className="scroll-mt-28">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                      {stage.stageType}
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold text-white">
                      {stage.name}
                    </h2>
                  </div>
                  <p className="text-sm text-white/[0.56]">{stage.status}</p>
                </div>
                <StageTimingTable results={mapTimingResults(stage.stageResults)} />
              </section>
            ))}
          </div>
        </Container>
      </section>

      <Container className="py-12">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <section>
            <SectionTitle
              eyebrow="Winners History"
              title="Previous winners"
              description="This timeline is seeded from the current final classification and prepared for historical records."
            />
            <div className="mt-8 grid gap-3">
              <Card className="p-5">
                <p className="text-sm text-foreground/[0.56]">{event.season.year}</p>
                <h3 className="mt-1 text-xl font-semibold">{winnerName(finalWinner)}</h3>
                <p className="mt-2 text-sm text-foreground/[0.62]">
                  {event.name} overall winner
                </p>
              </Card>
            </div>
          </section>

          <section>
            <SectionTitle
              eyebrow="Related Content"
              title="Prepared media and document lanes"
              description="Placeholders only. News, videos, gallery, and documents are not implemented in Step 6."
            />
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <RelatedPlaceholder icon={Newspaper} title="News" />
              <RelatedPlaceholder icon={Film} title="Videos" />
              <RelatedPlaceholder icon={GalleryHorizontal} title="Gallery" />
              <RelatedPlaceholder icon={FileText} title="Documents" />
            </div>
          </section>
        </div>
      </Container>
    </main>
  );
}

function mapTimingResults(
  results: Awaited<ReturnType<typeof getEventDetail>>["stages"][number]["stageResults"],
): StageTimingResult[] {
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

function winnerName(rider: { firstName: string; lastName: string } | undefined) {
  return rider ? `${rider.firstName} ${rider.lastName}` : "Pending";
}

function getAverageStageTime(values: Array<number | null>) {
  const validValues = values.filter((value): value is number => value !== null);

  if (validValues.length === 0) {
    return "Pending";
  }

  const average = Math.round(
    validValues.reduce((total, value) => total + value, 0) / validValues.length,
  );
  const minutes = Math.floor(average / 60000);
  const seconds = Math.floor((average % 60000) / 1000);

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-5">
      <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
      <p className="mt-5 text-sm text-foreground/[0.56]">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </Card>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-5">
      <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
      <p className="mt-6 text-xs uppercase tracking-[0.16em] text-foreground/[0.48]">
        {label}
      </p>
      <p className="mt-2 text-xl font-black">{value}</p>
    </Card>
  );
}

function PlaceholderLink({
  icon: Icon,
  label,
}: {
  icon: typeof Download;
  label: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-accent" />
        <div>
          <h3 className="font-semibold">{label}</h3>
          <p className="text-sm text-foreground/[0.56]">Placeholder</p>
        </div>
      </div>
    </Card>
  );
}

function RelatedPlaceholder({
  icon: Icon,
  title,
}: {
  icon: typeof Newspaper;
  title: string;
}) {
  return (
    <EmptyState
      icon={Icon}
      title={title}
      description={`${title} content lane is reserved for a future approved module.`}
    />
  );
}
