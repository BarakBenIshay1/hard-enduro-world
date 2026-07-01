import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import {
  Bike,
  BookOpen,
  Building2,
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
import { siteConfig } from "@/config/site";
import { getTeamDetail } from "@/db/teams";
import { formatDate, formatOptional } from "@/lib/format";

export const dynamic = "force-dynamic";

type TeamProfilePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: TeamProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const team = await getTeamDetail(slug);
  const canonical = `/teams/${team.slug}`;
  const description = `${team.name} team profile, riders, manufacturer relationship, results history, and championship foundation.`;

  return {
    title: team.name,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${team.name} | Hard Enduro World`,
      description,
      url: new URL(canonical, siteConfig.url).toString(),
      siteName: siteConfig.name,
      type: "website",
    },
  };
}

export default async function TeamProfilePage({ params }: TeamProfilePageProps) {
  const { slug } = await params;
  const team = await getTeamDetail(slug);
  const foundationYear = getFoundationYear(team.slug);
  const careers = [...team.careerSeasons].sort(
    (a, b) => b.season.year - a.season.year || b.points - a.points,
  );
  const currentSeasonYear = careers[0]?.season.year;
  const currentSeasonCareers = careers.filter(
    (career) => career.season.year === currentSeasonYear,
  );
  const riders = team.memberships.map((membership) => membership.rider);
  const riderResults = uniqueById(riders.flatMap((rider) => rider.results)).sort(
    (a, b) => b.event.startDate.getTime() - a.event.startDate.getTime(),
  );
  const totals = careers.reduce(
    (acc, career) => ({
      championships: acc.championships + (career.championshipPosition === 1 ? 1 : 0),
      wins: acc.wins + career.wins,
      podiums: acc.podiums + career.podiums,
      seasons: acc.seasons.add(career.season.year),
      points: acc.points + career.points,
    }),
    {
      championships: 0,
      wins: 0,
      podiums: 0,
      seasons: new Set<number>(),
      points: 0,
    },
  );
  const currentManufacturer = getMostCommon(
    currentSeasonCareers
      .map((career) => career.manufacturer?.name)
      .filter((value): value is string => Boolean(value)),
  );
  const previousManufacturers = unique(
    careers
      .map((career) => career.manufacturer?.name)
      .filter(
        (value): value is string => Boolean(value) && value !== currentManufacturer,
      ),
  );
  const eventVictories = riderResults.filter(
    (result) => result.overallPosition === 1,
  ).length;
  const championshipRows = aggregateChampionshipHistory(careers);
  const timeline = buildTeamTimeline({
    foundationYear,
    teamName: team.name,
    country: team.country?.name ?? "international",
    championships: totals.championships,
    wins: totals.wins,
    riders: riders.map((rider) => `${rider.firstName} ${rider.lastName}`),
    manufacturer: currentManufacturer,
  });

  return (
    <main className="min-h-screen bg-surface text-foreground">
      <PageHero
        compact
        eyebrow="Team Profile"
        title={team.name}
        description="A production-ready team hub connecting riders, manufacturer partnerships, event results, championship history, and future content modules."
      >
        <div className="grid gap-5">
          <Breadcrumb
            items={[{ label: "Teams", href: "/teams" }, { label: team.name }]}
          />
          <div className="flex flex-wrap gap-3 text-sm text-white/[0.68]">
            <span className="inline-flex items-center gap-2">
              <Flag className="h-4 w-4 text-accent" />
              {team.country?.name ?? "International"} ({team.country?.isoCode ?? "TBC"})
            </span>
            <span className="inline-flex items-center gap-2">
              <Building2 className="h-4 w-4 text-accent" />
              Founded {foundationYear}
            </span>
            <span className="inline-flex items-center gap-2">
              <Bike className="h-4 w-4 text-accent" />
              {currentManufacturer}
            </span>
          </div>
        </div>
      </PageHero>

      <Container className="grid gap-10 py-12 lg:grid-cols-[0.82fr_1.18fr]">
        <Card className="overflow-hidden">
          <div className="relative min-h-[440px] bg-black">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(0_0%_4%),hsl(220_10%_12%)_46%,hsl(18_82%_20%))]" />
            <div className="absolute left-6 top-6 flex h-24 w-24 items-center justify-center rounded-md border border-white/[0.16] bg-white/[0.08] text-white backdrop-blur">
              <Building2 className="h-10 w-10 text-accent" aria-hidden="true" />
              <span className="sr-only">Team logo placeholder</span>
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/64 to-transparent p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/[0.52]">
                Team identity placeholder
              </p>
              <h2 className="mt-2 text-3xl font-black">{team.name}</h2>
            </div>
          </div>
        </Card>

        <section>
          <SectionTitle
            eyebrow="History"
            title="Organization profile"
            description={`${team.name} is represented with seeded/demo records and a page structure ready for official biographies, historic partnerships, and automated result imports in a later release.`}
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <InfoCard label="Country" value={team.country?.name ?? "TBC"} icon={Flag} />
            <InfoCard
              label="Foundation Year"
              value={String(foundationYear)}
              icon={CalendarDays}
            />
            <InfoCard
              label="Current Manufacturer"
              value={currentManufacturer}
              icon={Bike}
            />
            <InfoCard label="Active Riders" value={String(riders.length)} icon={Users} />
          </div>
        </section>
      </Container>

      <section className="border-y border-border bg-surface-muted">
        <Container className="py-12">
          <SectionTitle eyebrow="Team Statistics" title="Competitive summary" />
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <SummaryCard
              label="Championships"
              value={totals.championships}
              icon={Trophy}
            />
            <SummaryCard label="Wins" value={totals.wins} icon={Medal} />
            <SummaryCard label="Podiums" value={totals.podiums} icon={Medal} />
            <SummaryCard label="Riders" value={riders.length} icon={Users} />
            <SummaryCard
              label="Seasons"
              value={totals.seasons.size}
              icon={CalendarDays}
            />
            <SummaryCard label="Event Victories" value={eventVictories} icon={Flag} />
          </div>
        </Container>
      </section>

      <Container className="py-12">
        <SectionTitle
          eyebrow="Riders"
          title="Current roster"
          description="Team members are linked directly to rider profiles and inherit motorcycle, manufacturer, and performance records from the seeded database."
        />
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {riders.map((rider) => {
            const career = rider.careerSeasons.find((item) => item.team?.id === team.id);
            const motorcycle = rider.currentMotorcycle ?? career?.motorcycle ?? null;
            const manufacturer = motorcycle?.manufacturer ?? career?.manufacturer ?? null;
            const standing = rider.standings[0];

            return (
              <Card key={rider.id} className="overflow-hidden">
                <div className="relative min-h-56 bg-black">
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(0_0%_5%),hsl(220_10%_13%)_48%,hsl(24_92%_18%))]" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent p-5 text-white">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/[0.46]">
                      Rider photo placeholder
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold">
                      {rider.firstName} {rider.lastName}
                    </h3>
                    <p className="mt-2 text-sm text-white/[0.64]">
                      {rider.country?.name ?? "Country TBC"}
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 p-5">
                  <p className="text-sm text-foreground/[0.64]">
                    {manufacturer?.name ?? "TBC"} {motorcycle?.model ?? ""}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <MiniMetric
                      label="Wins"
                      value={standing?.wins ?? career?.wins ?? 0}
                    />
                    <MiniMetric
                      label="Podiums"
                      value={standing?.podiums ?? career?.podiums ?? 0}
                    />
                  </div>
                  <ButtonLink href={`/riders/${rider.slug}`} variant="secondary">
                    Open Rider
                  </ButtonLink>
                </div>
              </Card>
            );
          })}
        </div>
      </Container>

      <section className="border-y border-border bg-black text-white">
        <Container className="grid gap-10 py-12 lg:grid-cols-[1fr_0.95fr]">
          <section>
            <SectionTitle
              eyebrow="Current Season"
              title={
                currentSeasonYear ? `${currentSeasonYear} team results` : "Season results"
              }
              description="Rows are generated from rider career-season records and are ready for future automated team standings."
            />
            <Card className="mt-8 overflow-hidden bg-white/[0.045] text-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-white/[0.08] text-xs uppercase tracking-[0.18em] text-white/[0.58]">
                    <tr>
                      {[
                        "Rider",
                        "Manufacturer",
                        "Motorcycle",
                        "Position",
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
                    {currentSeasonCareers.map((career) => (
                      <tr key={career.id} className="border-t border-white/10">
                        <td className="px-5 py-4 font-semibold">
                          {career.rider.firstName} {career.rider.lastName}
                        </td>
                        <td className="px-5 py-4 text-white/[0.64]">
                          {career.manufacturer?.name ?? "TBC"}
                        </td>
                        <td className="px-5 py-4 text-white/[0.64]">
                          {career.motorcycle?.model ?? "TBC"}
                        </td>
                        <td className="px-5 py-4 text-accent">
                          {formatOptional(career.championshipPosition)}
                        </td>
                        <td className="px-5 py-4 font-mono">{career.points}</td>
                        <td className="px-5 py-4">{career.wins}</td>
                        <td className="px-5 py-4">{career.podiums}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

          <section>
            <SectionTitle
              eyebrow="Manufacturer"
              title="Partnership structure"
              description="The team page is prepared for current and previous manufacturer relationships without implementing manufacturer profiles yet."
            />
            <Card className="mt-8 p-6">
              <p className="text-sm uppercase tracking-[0.18em] text-white/[0.48]">
                Current manufacturer
              </p>
              <p className="mt-3 text-3xl font-black">{currentManufacturer}</p>
              <div className="mt-8 border-t border-white/10 pt-6">
                <p className="text-sm uppercase tracking-[0.18em] text-white/[0.48]">
                  Previous partnerships
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(previousManufacturers.length > 0
                    ? previousManufacturers
                    : ["Historic partnership data pending"]
                  ).map((manufacturer) => (
                    <span
                      key={manufacturer}
                      className="rounded-md border border-white/10 bg-white/[0.06] px-3 py-2 text-sm"
                    >
                      {manufacturer}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          </section>
        </Container>
      </section>

      <Container className="grid gap-10 py-12 lg:grid-cols-[1fr_0.9fr]">
        <section>
          <SectionTitle
            eyebrow="Event History"
            title="Team event results"
            description="Event rows are derived from the team's riders and prepared for future official imports."
          />
          <Card className="mt-8 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-black text-xs uppercase tracking-[0.18em] text-white/[0.64]">
                  <tr>
                    {["Event", "Date", "Rider", "Position", "Status", "Points"].map(
                      (heading) => (
                        <th key={heading} className="px-5 py-4 font-semibold">
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {riderResults.map((result) => (
                    <tr key={result.id} className="border-t border-border">
                      <td className="px-5 py-4 font-semibold">{result.event.name}</td>
                      <td className="px-5 py-4 text-foreground/[0.62]">
                        {formatDate(result.event.startDate)}
                      </td>
                      <td className="px-5 py-4">
                        {result.rider.firstName} {result.rider.lastName}
                      </td>
                      <td className="px-5 py-4 text-accent">
                        {formatOptional(result.overallPosition)}
                      </td>
                      <td className="px-5 py-4">{result.status}</td>
                      <td className="px-5 py-4 font-mono">
                        {formatOptional(result.points)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        <section>
          <SectionTitle
            eyebrow="Championship History"
            title="Season rollup"
            description="Aggregated career-season data keeps the team page ready for future championship standings."
          />
          <div className="mt-8 grid gap-3">
            {championshipRows.map((row) => (
              <Card key={row.year} className="p-5">
                <div className="grid gap-4 sm:grid-cols-[90px_1fr_100px] sm:items-center">
                  <div>
                    <p className="text-2xl font-black">{row.year}</p>
                    <p className="text-sm text-foreground/[0.56]">
                      {row.riders} rider{row.riders === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold">{row.manufacturers.join(", ")}</h3>
                    <p className="mt-1 text-sm text-foreground/[0.58]">
                      {row.wins} wins • {row.podiums} podiums
                    </p>
                  </div>
                  <div className="font-mono text-sm">{row.points} pts</div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </Container>

      <section className="border-y border-border bg-surface-muted">
        <Container className="py-12">
          <SectionTitle
            eyebrow="Timeline"
            title="Team history foundation"
            description="A structured timeline lane prepared for official milestones, championships, and notable riders."
          />
          <div className="mt-8 grid gap-4">
            {timeline.map((item) => (
              <Card key={`${item.year}-${item.title}`} className="p-5">
                <div className="grid gap-4 md:grid-cols-[110px_1fr] md:items-start">
                  <p className="text-2xl font-black text-accent">{item.year}</p>
                  <div>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-foreground/[0.64]">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <Container className="grid gap-6 py-12 md:grid-cols-2 xl:grid-cols-4">
        <EmptyState
          icon={BookOpen}
          title="News"
          description="Team news lane reserved for a future approved module."
        />
        <EmptyState
          icon={CirclePlay}
          title="Videos"
          description="Team videos lane reserved for a future approved module."
        />
        <EmptyState
          icon={GalleryHorizontal}
          title="Gallery"
          description="Team gallery lane reserved for a future approved module."
        />
        <EmptyState
          icon={FileText}
          title="Documents"
          description="Team documents lane reserved for a future approved module."
        />
      </Container>

      <Container className="py-12">
        <ButtonLink href="/teams" variant="secondary">
          Back to Teams
        </ButtonLink>
      </Container>
    </main>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
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
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <Card className="p-5">
      <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
      <p className="mt-6 text-xs uppercase tracking-[0.16em] text-foreground/[0.48]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </Card>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-surface-muted p-3">
      <p className="text-xl font-black">{value}</p>
      <p className="mt-1 text-[0.68rem] uppercase tracking-[0.16em] text-foreground/[0.48]">
        {label}
      </p>
    </div>
  );
}

function getFoundationYear(slug: string) {
  const demoFoundationYears: Record<string, number> = {
    "red-bull-ktm-factory-racing": 2003,
    "factory-sherco-racing": 1998,
    "husqvarna-factory-racing": 2013,
    "fmf-ktm-factory-racing": 2014,
    "rieju-factory-racing": 2020,
    "beta-factory-racing": 2005,
    "independent-hard-enduro": 2026,
  };

  return demoFoundationYears[slug] ?? 2026;
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function getMostCommon(values: string[]) {
  if (values.length === 0) {
    return "Manufacturer TBC";
  }

  const counts = values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function uniqueById<T extends { id: string }>(items: T[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

function aggregateChampionshipHistory<
  T extends {
    season: { year: number };
    manufacturer: { name: string } | null;
    rider: { id: string };
    wins: number;
    podiums: number;
    points: number;
  },
>(careers: T[]) {
  const rows = new Map<
    number,
    {
      year: number;
      riders: Set<string>;
      manufacturers: Set<string>;
      wins: number;
      podiums: number;
      points: number;
    }
  >();

  careers.forEach((career) => {
    const row = rows.get(career.season.year) ?? {
      year: career.season.year,
      riders: new Set<string>(),
      manufacturers: new Set<string>(),
      wins: 0,
      podiums: 0,
      points: 0,
    };

    row.riders.add(career.rider.id);
    if (career.manufacturer?.name) {
      row.manufacturers.add(career.manufacturer.name);
    }
    row.wins += career.wins;
    row.podiums += career.podiums;
    row.points += career.points;
    rows.set(career.season.year, row);
  });

  return Array.from(rows.values())
    .sort((a, b) => b.year - a.year)
    .map((row) => ({
      year: row.year,
      riders: row.riders.size,
      manufacturers:
        row.manufacturers.size > 0
          ? Array.from(row.manufacturers).sort((a, b) => a.localeCompare(b))
          : ["Manufacturer TBC"],
      wins: row.wins,
      podiums: row.podiums,
      points: row.points,
    }));
}

function buildTeamTimeline({
  foundationYear,
  teamName,
  country,
  championships,
  wins,
  riders,
  manufacturer,
}: {
  foundationYear: number;
  teamName: string;
  country: string;
  championships: number;
  wins: number;
  riders: string[];
  manufacturer: string;
}) {
  return [
    {
      year: foundationYear,
      title: "Foundation",
      description: `${teamName} enters the Hard Enduro knowledge base as a ${country} team profile with structured history fields.`,
    },
    {
      year: 2026,
      title: "Manufacturer relationship",
      description: `${teamName} is currently represented with ${manufacturer} affiliation data in the demo dataset.`,
    },
    {
      year: 2026,
      title: "Competitive record",
      description: `${championships} championship marker${championships === 1 ? "" : "s"} and ${wins} event win${wins === 1 ? "" : "s"} are derived from seeded career records.`,
    },
    {
      year: 2026,
      title: "Notable riders",
      description:
        riders.length > 0
          ? `${riders.join(", ")} currently connect this team to rider profiles and result history.`
          : "Notable rider data is ready for future official imports.",
    },
  ];
}
