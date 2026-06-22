import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import {
  Bike,
  BookOpen,
  Building2,
  CalendarDays,
  CirclePlay,
  Factory,
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
import { getManufacturerDetail } from "@/db/manufacturers";
import { formatDate, formatOptional } from "@/lib/format";

export const dynamic = "force-dynamic";

type ManufacturerProfilePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: ManufacturerProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const manufacturer = await getManufacturerDetail(slug);
  const canonical = `/manufacturers/${manufacturer.slug}`;
  const description = `${manufacturer.name} manufacturer profile, teams, riders, motorcycles, event victories, and championship history.`;

  return {
    title: manufacturer.name,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${manufacturer.name} | Hard Enduro World`,
      description,
      url: new URL(canonical, siteConfig.url).toString(),
      siteName: siteConfig.name,
      type: "website",
    },
  };
}

export default async function ManufacturerProfilePage({
  params,
}: ManufacturerProfilePageProps) {
  const { slug } = await params;
  const manufacturer = await getManufacturerDetail(slug);
  const foundationYear = getFoundationYear(manufacturer.slug);
  const careers = [...manufacturer.riderCareerSeasons].sort(
    (a, b) => b.season.year - a.season.year || b.points - a.points,
  );
  const teams = uniqueById(
    careers
      .map((career) => career.team)
      .filter((value): value is NonNullable<typeof value> => Boolean(value)),
  );
  const riders = uniqueById([
    ...careers.map((career) => career.rider),
    ...manufacturer.motorcycles.flatMap((motorcycle) => motorcycle.currentRiders),
  ]);
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
  const championshipRows = aggregateChampionshipHistory(careers, manufacturer.results);
  const timeline = buildManufacturerTimeline({
    foundationYear,
    manufacturerName: manufacturer.name,
    country: manufacturer.country?.name ?? "international",
    championships: totals.championships,
    wins: totals.wins,
    riders: riders.map((rider) => `${rider.firstName} ${rider.lastName}`),
    motorcycles: manufacturer.motorcycles.map((motorcycle) => motorcycle.model),
  });

  return (
    <main className="min-h-screen bg-surface text-foreground">
      <PageHero
        compact
        eyebrow="Manufacturer Profile"
        title={manufacturer.name}
        description="A production-ready manufacturer hub connecting factory teams, riders, motorcycles, event results, and future statistics."
      >
        <div className="grid gap-5">
          <Breadcrumb
            items={[
              { label: "Manufacturers", href: "/manufacturers" },
              { label: manufacturer.name },
            ]}
          />
          <div className="flex flex-wrap gap-3 text-sm text-white/[0.68]">
            <span className="inline-flex items-center gap-2">
              <Flag className="h-4 w-4 text-accent" />
              {manufacturer.country?.name ?? "International"} (
              {manufacturer.country?.isoCode ?? "TBC"})
            </span>
            <span className="inline-flex items-center gap-2">
              <Factory className="h-4 w-4 text-accent" />
              Founded {foundationYear}
            </span>
            <span className="inline-flex items-center gap-2">
              <Bike className="h-4 w-4 text-accent" />
              {manufacturer.motorcycles.length} motorcycle
              {manufacturer.motorcycles.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </PageHero>

      <Container className="grid gap-10 py-12 lg:grid-cols-[0.82fr_1.18fr]">
        <Card className="overflow-hidden">
          <div className="relative min-h-[440px] bg-black">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(0_0%_4%),hsl(220_10%_12%)_46%,hsl(20_86%_18%))]" />
            <div className="absolute left-6 top-6 flex h-24 w-24 items-center justify-center rounded-md border border-white/[0.16] bg-white/[0.08] text-white backdrop-blur">
              <Factory className="h-10 w-10 text-accent" aria-hidden="true" />
              <span className="sr-only">Manufacturer logo placeholder</span>
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/64 to-transparent p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/[0.52]">
                Manufacturer identity placeholder
              </p>
              <h2 className="mt-2 text-3xl font-black">{manufacturer.name}</h2>
            </div>
          </div>
        </Card>

        <section>
          <SectionTitle
            eyebrow="History"
            title="Factory profile"
            description={`${manufacturer.name} is represented with seeded/demo records and a page structure ready for official factory biographies, motorcycle histories, and automated championship statistics.`}
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <InfoCard
              label="Country"
              value={manufacturer.country?.name ?? "TBC"}
              icon={Flag}
            />
            <InfoCard
              label="Foundation Year"
              value={String(foundationYear)}
              icon={CalendarDays}
            />
            <InfoCard label="Teams" value={String(teams.length)} icon={Building2} />
            <InfoCard
              label="Motorcycles"
              value={String(manufacturer.motorcycles.length)}
              icon={Bike}
            />
          </div>
        </section>
      </Container>

      <section className="border-y border-border bg-surface-muted">
        <Container className="py-12">
          <SectionTitle eyebrow="Manufacturer Statistics" title="Competitive summary" />
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <SummaryCard
              label="Championships"
              value={totals.championships}
              icon={Trophy}
            />
            <SummaryCard label="Wins" value={totals.wins} icon={Medal} />
            <SummaryCard label="Podiums" value={totals.podiums} icon={Medal} />
            <SummaryCard label="Teams" value={teams.length} icon={Building2} />
            <SummaryCard label="Riders" value={riders.length} icon={Users} />
            <SummaryCard
              label="Motorcycles"
              value={manufacturer.motorcycles.length}
              icon={Bike}
            />
          </div>
        </Container>
      </section>

      <Container className="grid gap-10 py-12 lg:grid-cols-[1fr_0.95fr]">
        <section>
          <SectionTitle
            eyebrow="Teams"
            title="Associated teams"
            description="Teams are inferred from rider career-season records and link into the Step 8 Teams module."
          />
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {teams.map((team) => (
              <Card key={team.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-foreground/[0.48]">
                      Team
                    </p>
                    <h3 className="mt-2 text-xl font-semibold">{team.name}</h3>
                    <p className="mt-2 text-sm text-foreground/[0.6]">
                      {team.country?.name ?? "Country TBC"}
                    </p>
                  </div>
                  <Building2 className="h-6 w-6 text-accent" aria-hidden="true" />
                </div>
                <ButtonLink
                  href={`/teams/${team.slug}`}
                  variant="secondary"
                  className="mt-5"
                >
                  Open Team
                </ButtonLink>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle
            eyebrow="Riders"
            title="Factory riders"
            description="Riders are connected through current motorcycles and manufacturer career records."
          />
          <div className="mt-8 grid gap-5">
            {riders.map((rider) => {
              const standing = rider.standings[0];

              return (
                <Card key={rider.id} className="p-5">
                  <div className="grid gap-4 sm:grid-cols-[1fr_90px] sm:items-center">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-foreground/[0.48]">
                        {rider.country?.name ?? "Country TBC"}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold">
                        {rider.firstName} {rider.lastName}
                      </h3>
                      <p className="mt-2 text-sm text-foreground/[0.6]">
                        {standing?.points ?? 0} points
                      </p>
                    </div>
                    <ButtonLink href={`/riders/${rider.slug}`} variant="secondary">
                      Open
                    </ButtonLink>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      </Container>

      <section className="border-y border-border bg-black text-white">
        <Container className="py-12">
          <SectionTitle
            eyebrow="Motorcycle Preview"
            title="Factory machinery"
            description="A preview of motorcycles tied to this manufacturer. The full motorcycle module is intentionally reserved for Step 10."
          />
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {manufacturer.motorcycles.map((motorcycle) => (
              <Card
                key={motorcycle.id}
                className="overflow-hidden bg-white/[0.045] text-white"
              >
                <div className="relative min-h-52 bg-black">
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(0_0%_5%),hsl(220_10%_12%)_46%,hsl(24_92%_18%))]" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/[0.46]">
                      Motorcycle preview
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold">
                      {manufacturer.name} {motorcycle.model}
                    </h3>
                  </div>
                </div>
                <div className="grid gap-3 p-5 text-sm text-white/[0.66]">
                  <p>Year: {formatOptional(motorcycle.year)}</p>
                  <p>Engine: {formatOptional(motorcycle.engineCc)} cc</p>
                  <p>Current riders: {motorcycle.currentRiders.length}</p>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <Container className="grid gap-10 py-12 lg:grid-cols-[1fr_0.9fr]">
        <section>
          <SectionTitle
            eyebrow="Championship History"
            title="Season rollup"
            description="Championship rows combine career-season and event-result data for future standings and statistics."
          />
          <div className="mt-8 grid gap-3">
            {championshipRows.map((row) => (
              <Card key={row.year} className="p-5">
                <div className="grid gap-4 sm:grid-cols-[90px_1fr_120px] sm:items-center">
                  <div>
                    <p className="text-2xl font-black">{row.year}</p>
                    <p className="text-sm text-foreground/[0.56]">
                      {row.riders} rider{row.riders === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {row.championships} championship marker
                      {row.championships === 1 ? "" : "s"}
                    </h3>
                    <p className="mt-1 text-sm text-foreground/[0.58]">
                      {row.wins} wins • {row.podiums} podiums • {row.eventVictories} event
                      victories
                    </p>
                  </div>
                  <div className="font-mono text-sm">{row.points} pts</div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle
            eyebrow="Event Victories"
            title="Result history"
            description="Final result rows preserve the event, rider, motorcycle, position, and status."
          />
          <Card className="mt-8 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-black text-xs uppercase tracking-[0.18em] text-white/[0.64]">
                  <tr>
                    {["Event", "Date", "Rider", "Motorcycle", "Position", "Points"].map(
                      (heading) => (
                        <th key={heading} className="px-5 py-4 font-semibold">
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {manufacturer.results.map((result) => (
                    <tr key={result.id} className="border-t border-border">
                      <td className="px-5 py-4 font-semibold">{result.event.name}</td>
                      <td className="px-5 py-4 text-foreground/[0.62]">
                        {formatDate(result.event.startDate)}
                      </td>
                      <td className="px-5 py-4">
                        {result.rider.firstName} {result.rider.lastName}
                      </td>
                      <td className="px-5 py-4">{result.motorcycle?.model ?? "TBC"}</td>
                      <td className="px-5 py-4 text-accent">
                        {formatOptional(result.overallPosition)}
                      </td>
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
      </Container>

      <section className="border-y border-border bg-surface-muted">
        <Container className="py-12">
          <SectionTitle
            eyebrow="Timeline"
            title="Manufacturer history foundation"
            description="A structured timeline lane prepared for official factory milestones, championship eras, important riders, and important motorcycles."
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
          description="Manufacturer news lane reserved for a future approved module."
        />
        <EmptyState
          icon={CirclePlay}
          title="Videos"
          description="Manufacturer videos lane reserved for a future approved module."
        />
        <EmptyState
          icon={GalleryHorizontal}
          title="Gallery"
          description="Manufacturer gallery lane reserved for a future approved module."
        />
        <EmptyState
          icon={FileText}
          title="Documents"
          description="Manufacturer documents lane reserved for a future approved module."
        />
      </Container>

      <Container className="py-12">
        <ButtonLink href="/manufacturers" variant="secondary">
          Back to Manufacturers
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

function getFoundationYear(slug: string) {
  const demoFoundationYears: Record<string, number> = {
    ktm: 1934,
    husqvarna: 1903,
    gasgas: 1985,
    sherco: 1998,
    beta: 1905,
    "tm-racing": 1977,
    honda: 1948,
    rieju: 1934,
    fantic: 1968,
  };

  return demoFoundationYears[slug] ?? 2026;
}

function uniqueById<T extends { id: string }>(items: T[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

function aggregateChampionshipHistory<
  T extends {
    season: { year: number };
    rider: { id: string };
    championshipPosition: number | null;
    wins: number;
    podiums: number;
    points: number;
  },
  R extends {
    event: { season: { year: number } };
    overallPosition: number | null;
  },
>(careers: T[], results: R[]) {
  const rows = new Map<
    number,
    {
      year: number;
      riders: Set<string>;
      championships: number;
      wins: number;
      podiums: number;
      points: number;
      eventVictories: number;
    }
  >();

  careers.forEach((career) => {
    const row = rows.get(career.season.year) ?? {
      year: career.season.year,
      riders: new Set<string>(),
      championships: 0,
      wins: 0,
      podiums: 0,
      points: 0,
      eventVictories: 0,
    };

    row.riders.add(career.rider.id);
    row.championships += career.championshipPosition === 1 ? 1 : 0;
    row.wins += career.wins;
    row.podiums += career.podiums;
    row.points += career.points;
    rows.set(career.season.year, row);
  });

  results.forEach((result) => {
    if (result.overallPosition !== 1) {
      return;
    }

    const year = result.event.season.year;
    const row = rows.get(year) ?? {
      year,
      riders: new Set<string>(),
      championships: 0,
      wins: 0,
      podiums: 0,
      points: 0,
      eventVictories: 0,
    };

    row.eventVictories += 1;
    rows.set(year, row);
  });

  return Array.from(rows.values())
    .sort((a, b) => b.year - a.year)
    .map((row) => ({
      year: row.year,
      riders: row.riders.size,
      championships: row.championships,
      wins: row.wins,
      podiums: row.podiums,
      points: row.points,
      eventVictories: row.eventVictories,
    }));
}

function buildManufacturerTimeline({
  foundationYear,
  manufacturerName,
  country,
  championships,
  wins,
  riders,
  motorcycles,
}: {
  foundationYear: number;
  manufacturerName: string;
  country: string;
  championships: number;
  wins: number;
  riders: string[];
  motorcycles: string[];
}) {
  return [
    {
      year: foundationYear,
      title: "Foundation",
      description: `${manufacturerName} enters the Hard Enduro knowledge base as a ${country} manufacturer profile with structured history fields.`,
    },
    {
      year: 2026,
      title: "Motorcycle program",
      description:
        motorcycles.length > 0
          ? `${motorcycles.join(", ")} form the current seeded motorcycle preview for this manufacturer.`
          : "Motorcycle history is ready for Step 10 expansion.",
    },
    {
      year: 2026,
      title: "Championship record",
      description: `${championships} championship marker${championships === 1 ? "" : "s"} and ${wins} win${wins === 1 ? "" : "s"} are derived from seeded career records.`,
    },
    {
      year: 2026,
      title: "Important riders",
      description:
        riders.length > 0
          ? `${riders.join(", ")} currently connect this manufacturer to rider profiles and result history.`
          : "Important rider data is ready for future official imports.",
    },
  ];
}
