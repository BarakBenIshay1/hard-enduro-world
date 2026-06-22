import type { Metadata } from "next";
import Link from "next/link";
import {
  Bike,
  BookOpen,
  CalendarDays,
  CirclePlay,
  FileText,
  Flag,
  GalleryHorizontal,
  Medal,
  Trophy,
  Users,
} from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHero } from "@/components/ui/page-hero";
import { SectionTitle } from "@/components/ui/section-title";
import { MetricCard } from "@/components/statistics/metric-card";
import { siteConfig } from "@/config/site";
import { getSeasonHistory } from "@/db/history";
import { formatDateRange, formatOptional } from "@/lib/format";

export const dynamic = "force-dynamic";

type SeasonHistoryPageProps = {
  params: Promise<{
    year: string;
  }>;
};

export async function generateMetadata({
  params,
}: SeasonHistoryPageProps): Promise<Metadata> {
  const { year } = await params;
  const season = await getSeasonHistory(Number(year));
  const canonical = `/history/${season.year}`;
  const champion = season.standings[0]?.rider;
  const championName = champion ? `${champion.firstName} ${champion.lastName}` : "TBC";
  const description = `${season.year} Hard Enduro World Championship season archive with champion ${championName}, standings, events, winners, timeline, and records.`;

  return {
    title: `${season.year} Season History`,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${season.year} Season History | Hard Enduro World`,
      description,
      url: new URL(canonical, siteConfig.url).toString(),
      siteName: siteConfig.name,
      type: "article",
    },
  };
}

export default async function SeasonHistoryPage({ params }: SeasonHistoryPageProps) {
  const { year } = await params;
  const season = await getSeasonHistory(Number(year));
  const championStanding = season.standings[0];
  const runnerUpStanding = season.standings[1];
  const championName = championStanding
    ? `${championStanding.rider.firstName} ${championStanding.rider.lastName}`
    : "Champion pending";
  const runnerUpName = runnerUpStanding
    ? `${runnerUpStanding.rider.firstName} ${runnerUpStanding.rider.lastName}`
    : "Runner-up pending";
  const totalResults = season.events.reduce(
    (sum, event) => sum + event.results.length,
    0,
  );
  const totalStages = season.events.reduce((sum, event) => sum + event.stages.length, 0);
  const dnfCount = season.events.reduce(
    (sum, event) =>
      sum + event.results.filter((result) => result.status === "DNF").length,
    0,
  );
  const eventWinners = season.events.map((event) => ({
    event,
    winner: event.results[0]?.rider,
    manufacturer:
      event.results[0]?.manufacturer ?? event.results[0]?.motorcycle?.manufacturer,
    motorcycle: event.results[0]?.motorcycle,
  }));
  const mostWins = getMostWins(eventWinners);
  const manufacturerChampion = getManufacturerChampion(season);

  return (
    <main className="min-h-screen bg-surface text-foreground">
      <PageHero
        compact
        eyebrow="Season History"
        title={`${season.year} Hard Enduro World Championship`}
        description="A cinematic season archive prepared for official documents, photos, videos, complete historical imports, and future AI season summaries."
      >
        <div className="grid gap-5">
          <Breadcrumb
            items={[
              { label: "History", href: "/history" },
              { label: String(season.year) },
            ]}
          />
          <div className="flex flex-wrap gap-3 text-sm text-white/[0.68]">
            <span className="inline-flex items-center gap-2">
              <Trophy className="h-4 w-4 text-accent" />
              Champion: {championName}
            </span>
            <span className="inline-flex items-center gap-2">
              <Medal className="h-4 w-4 text-accent" />
              Runner-up: {runnerUpName}
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-accent" />
              {season.events.length} round{season.events.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </PageHero>

      <Container className="grid gap-10 py-12 lg:grid-cols-[0.9fr_1.1fr]">
        <section>
          <SectionTitle
            eyebrow="Season Summary"
            title="The championship frame"
            description={`${season.name} is represented from seeded standings, event, result, rider, manufacturer, and motorcycle data.`}
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <MetricCard label="Champion" value={championName} icon={Trophy} />
            <MetricCard label="Runner-up" value={runnerUpName} icon={Medal} />
            <MetricCard
              label="Manufacturer Champion"
              value={manufacturerChampion}
              detail="Placeholder-style derived preview"
              icon={Bike}
            />
            <MetricCard label="Season Status" value={season.status} icon={Flag} />
          </div>
        </section>

        <section>
          <SectionTitle
            eyebrow="Key Statistics"
            title="Season data pulse"
            description="Core figures derived from this season's events, final results, stage rows, and standings."
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <MetricCard
              label="Events"
              value={String(season.events.length)}
              icon={CalendarDays}
            />
            <MetricCard
              label="Total Riders"
              value={String(season.standings.length)}
              icon={Users}
            />
            <MetricCard
              label="Final Results"
              value={String(totalResults)}
              icon={FileText}
            />
            <MetricCard label="Stage Rows" value={String(totalStages)} icon={Flag} />
            <MetricCard label="DNFs" value={String(dnfCount)} icon={FileText} />
            <MetricCard
              label="Most Wins"
              value={mostWins?.name ?? "Pending"}
              detail={mostWins ? `${mostWins.wins} win(s)` : undefined}
              icon={Trophy}
            />
          </div>
        </section>
      </Container>

      <section className="border-y border-border bg-black text-white">
        <Container className="py-12">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <SectionTitle
              eyebrow="Final Standings"
              title="Championship classification preview"
              description="Top standings rows link directly to rider profiles and prepare the page for complete historical standings."
            />
            <ButtonLink href="/standings" variant="secondary">
              Open Standings
            </ButtonLink>
          </div>
          <Card className="overflow-hidden bg-white/[0.045] text-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-white/[0.08] text-xs uppercase tracking-[0.18em] text-white/[0.58]">
                  <tr>
                    {[
                      "Pos",
                      "Rider",
                      "Country",
                      "Team",
                      "Manufacturer",
                      "Points",
                      "Wins",
                      "Podiums",
                    ].map((heading) => (
                      <th key={heading} className="px-5 py-4 font-semibold">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {season.standings.slice(0, 8).map((standing) => {
                    const career = standing.rider.careerSeasons[0];
                    const manufacturer =
                      standing.rider.currentMotorcycle?.manufacturer ??
                      career?.manufacturer ??
                      null;

                    return (
                      <tr key={standing.id} className="border-t border-white/10">
                        <td className="px-5 py-4 font-black text-accent">
                          {formatOptional(standing.position)}
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            href={`/riders/${standing.rider.slug}`}
                            className="font-semibold hover:text-accent"
                          >
                            {standing.rider.firstName} {standing.rider.lastName}
                          </Link>
                        </td>
                        <td className="px-5 py-4 text-white/[0.64]">
                          {standing.rider.country?.name ?? "TBC"}
                        </td>
                        <td className="px-5 py-4 text-white/[0.64]">
                          {standing.rider.teamMemberships[0]?.team.name ??
                            career?.team?.name ??
                            "Independent"}
                        </td>
                        <td className="px-5 py-4">{manufacturer?.name ?? "TBC"}</td>
                        <td className="px-5 py-4 font-mono">{standing.points}</td>
                        <td className="px-5 py-4">{standing.wins}</td>
                        <td className="px-5 py-4">{standing.podiums}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </Container>
      </section>

      <Container className="grid gap-10 py-12 lg:grid-cols-[1fr_0.9fr]">
        <section>
          <SectionTitle
            eyebrow="Events"
            title="All rounds in the season"
            description="Season events link into the existing Events module."
          />
          <div className="mt-8 grid gap-4">
            {season.events.map((event) => (
              <Link key={event.id} href={`/events/${event.slug}`}>
                <Card className="p-5">
                  <div className="grid gap-4 md:grid-cols-[90px_1fr_140px] md:items-center">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-foreground/[0.48]">
                        Round
                      </p>
                      <p className="mt-1 text-2xl font-black">
                        {event.roundNumber ?? "TBC"}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold">{event.name}</h3>
                      <p className="mt-1 text-sm text-foreground/[0.58]">
                        {event.country?.name ?? "Location TBC"} •{" "}
                        {formatDateRange(event.startDate, event.endDate)}
                      </p>
                    </div>
                    <p className="text-sm text-foreground/[0.58]">{event.liveStatus}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle
            eyebrow="Event Winners"
            title="Round winner archive"
            description="Winners are derived from each event's final classification."
          />
          <div className="mt-8 grid gap-4">
            {eventWinners.map(({ event, winner, manufacturer, motorcycle }) => (
              <Card key={event.id} className="p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-foreground/[0.48]">
                  {event.name}
                </p>
                <h3 className="mt-2 text-xl font-semibold">
                  {winner ? `${winner.firstName} ${winner.lastName}` : "Winner pending"}
                </h3>
                <p className="mt-2 text-sm text-foreground/[0.62]">
                  {manufacturer?.name ?? "Manufacturer TBC"} {motorcycle?.model ?? ""}
                </p>
              </Card>
            ))}
          </div>
        </section>
      </Container>

      <section className="border-y border-border bg-surface-muted">
        <Container className="py-12">
          <SectionTitle
            eyebrow="Timeline"
            title="Season timeline"
            description="Round-by-round structure prepared for full historical storytelling and automatic generation."
          />
          <div className="mt-8 grid gap-4">
            {season.events.map((event, index) => (
              <Link key={event.id} href={`/events/${event.slug}`}>
                <Card className="p-5">
                  <div className="grid gap-4 md:grid-cols-[130px_1fr] md:items-start">
                    <p className="text-2xl font-black text-accent">
                      {index === season.events.length - 1
                        ? "Final round"
                        : `Round ${event.roundNumber ?? index + 1}`}
                    </p>
                    <div>
                      <h3 className="text-lg font-semibold">{event.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-foreground/[0.64]">
                        {formatDateRange(event.startDate, event.endDate)} •{" "}
                        {event.country?.name ?? "Location TBC"}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
            <Card className="p-5">
              <div className="grid gap-4 md:grid-cols-[130px_1fr] md:items-start">
                <p className="text-2xl font-black text-accent">Crowned</p>
                <div>
                  <h3 className="text-lg font-semibold">{championName}</h3>
                  <p className="mt-2 text-sm leading-6 text-foreground/[0.64]">
                    Champion crowned from the final seeded standings for {season.year}.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </Container>
      </section>

      <Container className="grid gap-10 py-12 lg:grid-cols-[1fr_0.9fr]">
        <section>
          <SectionTitle
            eyebrow="Season Records"
            title="Record preview"
            description="Season records are derived from this year's standings and results, ready for future materialized record tables."
          />
          <div className="mt-8 grid gap-3">
            <RecordRow
              label="Champion"
              value={championName}
              href={
                championStanding ? `/riders/${championStanding.rider.slug}` : undefined
              }
            />
            <RecordRow
              label="Most wins"
              value={mostWins ? `${mostWins.name} (${mostWins.wins})` : "Pending"}
            />
            <RecordRow label="Manufacturer champion" value={manufacturerChampion} />
            <RecordRow label="DNF count" value={String(dnfCount)} />
          </div>
        </section>

        <section>
          <SectionTitle
            eyebrow="Cross Links"
            title="Explore connected modules"
            description="Season pages connect the history archive to the broader championship database."
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <ButtonLink href="/results" variant="secondary">
              Results
            </ButtonLink>
            <ButtonLink href="/events" variant="secondary">
              Events
            </ButtonLink>
            <ButtonLink href="/riders" variant="secondary">
              Riders
            </ButtonLink>
            <ButtonLink href="/manufacturers" variant="secondary">
              Manufacturers
            </ButtonLink>
            <ButtonLink href="/motorcycles" variant="secondary">
              Motorcycles
            </ButtonLink>
            <ButtonLink href="/records" variant="secondary">
              Records
            </ButtonLink>
          </div>
        </section>
      </Container>

      <section className="border-y border-border bg-black text-white">
        <Container className="grid gap-6 py-12 md:grid-cols-2 xl:grid-cols-4">
          <EmptyState
            icon={BookOpen}
            title="Notable Moments"
            description="Season storytelling placeholder for a future approved module."
          />
          <EmptyState
            icon={GalleryHorizontal}
            title="Gallery"
            description="Season gallery placeholder reserved for future media work."
          />
          <EmptyState
            icon={CirclePlay}
            title="Videos"
            description="Season videos placeholder reserved for future media work."
          />
          <EmptyState
            icon={FileText}
            title="Sources"
            description="Official document/source placeholder for future imports."
          />
        </Container>
      </section>
    </main>
  );
}

function RecordRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <Card className="flex items-center justify-between gap-4 p-5">
      <p className="font-semibold">{label}</p>
      {href ? (
        <Link href={href} className="font-mono text-accent hover:text-accent-hot">
          {value}
        </Link>
      ) : (
        <p className="font-mono text-accent">{value}</p>
      )}
    </Card>
  );
}

function getMostWins(
  eventWinners: Array<{
    winner: { id: string; firstName: string; lastName: string } | undefined;
  }>,
) {
  const wins = new Map<string, { name: string; wins: number }>();

  eventWinners.forEach(({ winner }) => {
    if (!winner) {
      return;
    }

    const current = wins.get(winner.id) ?? {
      name: `${winner.firstName} ${winner.lastName}`,
      wins: 0,
    };
    current.wins += 1;
    wins.set(winner.id, current);
  });

  return Array.from(wins.values()).sort((a, b) => b.wins - a.wins)[0];
}

function getManufacturerChampion(season: Awaited<ReturnType<typeof getSeasonHistory>>) {
  const championStanding = season.standings[0];
  const career = championStanding?.rider.careerSeasons[0];
  const manufacturer =
    championStanding?.rider.currentMotorcycle?.manufacturer ??
    career?.manufacturer ??
    null;

  return manufacturer?.name ?? "Manufacturer champion pending";
}
