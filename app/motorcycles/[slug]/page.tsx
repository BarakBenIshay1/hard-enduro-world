import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import {
  Bike,
  BookOpen,
  CirclePlay,
  Factory,
  FileText,
  GalleryHorizontal,
  Gauge,
  Medal,
  Settings,
  SlidersHorizontal,
  Trophy,
  Users,
  Wrench,
} from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHero } from "@/components/ui/page-hero";
import { SectionTitle } from "@/components/ui/section-title";
import { siteConfig } from "@/config/site";
import { getMotorcycleDetail } from "@/db/motorcycles";
import { formatDate, formatOptional } from "@/lib/format";

export const dynamic = "force-dynamic";

type MotorcycleProfilePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: MotorcycleProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const motorcycle = await getMotorcycleDetail(slug);
  const name = `${motorcycle.manufacturer.name} ${motorcycle.model}${
    motorcycle.year ? ` ${motorcycle.year}` : ""
  }`;
  const canonical = `/motorcycles/${motorcycle.slug}`;
  const description = `${name} motorcycle profile with specifications, riders, manufacturer, event results, and performance summary.`;

  return {
    title: name,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${name} | Hard Enduro World`,
      description,
      url: new URL(canonical, siteConfig.url).toString(),
      siteName: siteConfig.name,
      type: "website",
    },
  };
}

export default async function MotorcycleProfilePage({
  params,
}: MotorcycleProfilePageProps) {
  const { slug } = await params;
  const motorcycle = await getMotorcycleDetail(slug);
  const name = `${motorcycle.manufacturer.name} ${motorcycle.model}${
    motorcycle.year ? ` ${motorcycle.year}` : ""
  }`;
  const riders = uniqueById([
    ...motorcycle.currentRiders,
    ...motorcycle.riderCareerSeasons.map((career) => career.rider),
    ...motorcycle.results.map((result) => result.rider),
  ]);
  const teams = uniqueById(
    motorcycle.riderCareerSeasons
      .map((career) => career.team)
      .filter((value): value is NonNullable<typeof value> => Boolean(value)),
  );
  const totals = motorcycle.riderCareerSeasons.reduce(
    (acc, career) => ({
      championships: acc.championships + (career.championshipPosition === 1 ? 1 : 0),
      wins: acc.wins + career.wins,
      podiums: acc.podiums + career.podiums,
      starts: acc.starts + career.starts,
      dnfs: acc.dnfs + career.dnfs,
      points: acc.points + career.points,
    }),
    { championships: 0, wins: 0, podiums: 0, starts: 0, dnfs: 0, points: 0 },
  );
  const resultWins = motorcycle.results.filter(
    (result) => result.overallPosition === 1,
  ).length;
  const resultPodiums = motorcycle.results.filter(
    (result) =>
      result.overallPosition !== null &&
      result.overallPosition >= 1 &&
      result.overallPosition <= 3,
  ).length;
  const resultDnfs = motorcycle.results.filter(
    (result) => result.status === "DNF",
  ).length;
  const averageFinish = getAverageFinish(
    motorcycle.results
      .map((result) => result.overallPosition)
      .filter((value): value is number => typeof value === "number"),
  );
  const specRows = [
    ["Engine CC", motorcycle.engineCc ? `${motorcycle.engineCc} cc` : "TBC"],
    ["Stroke type", formatStrokeType(motorcycle.strokeType)],
    ["Weight", motorcycle.weightKg ? `${Number(motorcycle.weightKg)} kg` : "TBC"],
    ["Front suspension", motorcycle.suspensionFront ?? "TBC"],
    ["Rear suspension", motorcycle.suspensionRear ?? "TBC"],
    ["Horsepower", motorcycle.horsepower ? `${Number(motorcycle.horsepower)} hp` : "TBC"],
    ["Torque", motorcycle.torqueNm ? `${Number(motorcycle.torqueNm)} Nm` : "TBC"],
    ["Transmission", motorcycle.transmission ?? "TBC"],
    [
      "Fuel capacity",
      motorcycle.fuelCapacityL ? `${Number(motorcycle.fuelCapacityL)} L` : "TBC",
    ],
    ["Description", motorcycle.description ?? "Technical description pending."],
  ];

  return (
    <main className="min-h-screen bg-surface text-foreground">
      <PageHero
        compact
        eyebrow="Motorcycle Profile"
        title={name}
        description="A production-ready motorcycle profile connecting technical specifications, riders, manufacturer links, event results, and future comparison data."
      >
        <div className="grid gap-5">
          <Breadcrumb
            items={[{ label: "Motorcycles", href: "/motorcycles" }, { label: name }]}
          />
          <div className="flex flex-wrap gap-3 text-sm text-white/[0.68]">
            <span className="inline-flex items-center gap-2">
              <Factory className="h-4 w-4 text-accent" />
              {motorcycle.manufacturer.name}
            </span>
            <span className="inline-flex items-center gap-2">
              <Gauge className="h-4 w-4 text-accent" />
              {formatOptional(motorcycle.engineCc)} cc •{" "}
              {formatStrokeType(motorcycle.strokeType)}
            </span>
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4 text-accent" />
              {riders.length} rider{riders.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </PageHero>

      <Container className="grid gap-10 py-12 lg:grid-cols-[0.82fr_1.18fr]">
        <Card className="overflow-hidden">
          <div className="relative min-h-[460px] bg-black">
            {motorcycle.heroImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- CMS media uses approved Supabase Storage URLs.
              <img
                src={motorcycle.heroImage}
                alt={name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <>
                <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(0_0%_4%),hsl(220_10%_12%)_46%,hsl(22_88%_18%))]" />
                <div className="absolute left-6 top-6 flex h-24 w-24 items-center justify-center rounded-md border border-white/[0.16] bg-white/[0.08] text-white backdrop-blur">
                  <Bike className="h-10 w-10 text-accent" aria-hidden="true" />
                  <span className="sr-only">Motorcycle image placeholder</span>
                </div>
              </>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/38 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/64 to-transparent p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/[0.52]">
                {motorcycle.heroImage
                  ? "Motorcycle hero image"
                  : "Motorcycle image placeholder"}
              </p>
              <h2 className="mt-2 text-3xl font-black">{name}</h2>
            </div>
          </div>
        </Card>

        <section>
          <SectionTitle
            eyebrow="Technical Overview"
            title="Built for extreme terrain data."
            description={
              motorcycle.description ??
              "This seeded/demo motorcycle profile is ready for official specifications, setup notes, rider usage, and performance analytics in a later release."
            }
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <InfoCard
              label="Manufacturer"
              value={motorcycle.manufacturer.name}
              icon={Factory}
            />
            <InfoCard label="Model" value={motorcycle.model} icon={Bike} />
            <InfoCard
              label="Year"
              value={motorcycle.year ? String(motorcycle.year) : "TBC"}
              icon={Settings}
            />
            <InfoCard
              label="Weight"
              value={motorcycle.weightKg ? `${Number(motorcycle.weightKg)} kg` : "TBC"}
              icon={Gauge}
            />
          </div>
        </section>
      </Container>

      <section className="border-y border-border bg-surface-muted">
        <Container className="py-12">
          <SectionTitle eyebrow="Performance Summary" title="Competitive record" />
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <SummaryCard
              label="Championships"
              value={totals.championships}
              icon={Trophy}
            />
            <SummaryCard
              label="Wins"
              value={Math.max(totals.wins, resultWins)}
              icon={Medal}
            />
            <SummaryCard
              label="Podiums"
              value={Math.max(totals.podiums, resultPodiums)}
              icon={Medal}
            />
            <SummaryCard
              label="DNFs"
              value={Math.max(totals.dnfs, resultDnfs)}
              icon={Wrench}
            />
            <SummaryCard label="Riders" value={riders.length} icon={Users} />
            <SummaryCard label="Teams" value={teams.length} icon={Factory} />
          </div>
        </Container>
      </section>

      <Container className="grid gap-10 py-12 lg:grid-cols-[0.95fr_1.05fr]">
        <section>
          <SectionTitle
            eyebrow="Specifications"
            title="Technical specification table"
            description="The schema already preserves core hard-enduro motorcycle fields and can expand into setup data later."
          />
          <Card className="mt-8 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <tbody>
                  {specRows.map(([label, value]) => (
                    <tr key={label} className="border-t border-border first:border-t-0">
                      <th className="w-56 bg-surface-muted px-5 py-4 font-semibold">
                        {label}
                      </th>
                      <td className="px-5 py-4 text-foreground/[0.68]">{value}</td>
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
            title="Factory relationship"
            description="The motorcycle profile links back to its manufacturer while keeping the full manufacturer module separate."
          />
          <Card className="mt-8 p-6">
            <Factory className="h-8 w-8 text-accent" aria-hidden="true" />
            <h3 className="mt-5 text-3xl font-black">{motorcycle.manufacturer.name}</h3>
            <p className="mt-3 text-sm leading-6 text-foreground/[0.64]">
              {motorcycle.manufacturer.country?.name ?? "Country TBC"} manufacturer
              profile connected to this motorcycle through the Prisma manufacturer
              relation.
            </p>
            <ButtonLink
              href={`/manufacturers/${motorcycle.manufacturer.slug}`}
              variant="secondary"
              className="mt-6"
            >
              Open Manufacturer
            </ButtonLink>
          </Card>
        </section>
      </Container>

      <section className="border-y border-border bg-black text-white">
        <Container className="grid gap-10 py-12 lg:grid-cols-[1fr_0.95fr]">
          <section>
            <SectionTitle
              eyebrow="Riders"
              title="Riders associated with this motorcycle"
              description="Riders are connected by current motorcycle, result rows, and career-season records."
            />
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {riders.map((rider) => {
                const standing = rider.standings[0];

                return (
                  <Card key={rider.id} className="bg-white/[0.045] p-5 text-white">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/[0.48]">
                      {rider.country?.name ?? "Country TBC"}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold">
                      {rider.firstName} {rider.lastName}
                    </h3>
                    <p className="mt-2 text-sm text-white/[0.62]">
                      {standing?.points ?? 0} points
                    </p>
                    <ButtonLink
                      href={`/riders/${rider.slug}`}
                      variant="secondary"
                      className="mt-5"
                    >
                      Open Rider
                    </ButtonLink>
                  </Card>
                );
              })}
            </div>
          </section>

          <section>
            <SectionTitle
              eyebrow="Comparison"
              title="Motorcycle comparison placeholder"
              description="Future comparisons will support model-vs-model analysis without adding that engine in Step 10."
            />
            <Card className="mt-8 bg-white/[0.045] p-6 text-white">
              <SlidersHorizontal className="h-8 w-8 text-accent" aria-hidden="true" />
              <h3 className="mt-5 text-2xl font-black">Comparison engine reserved</h3>
              <p className="mt-3 text-sm leading-6 text-white/[0.64]">
                Prepared for comparisons such as KTM 300 EXC vs Husqvarna TE 300, GASGAS
                EC 300 vs Beta RR 300, finish rate, DNF rate, wins, podiums, and rider
                usage.
              </p>
            </Card>
          </section>
        </Container>
      </section>

      <Container className="grid gap-10 py-12 lg:grid-cols-[1fr_0.9fr]">
        <section>
          <SectionTitle
            eyebrow="Event Results"
            title="Motorcycle result history"
            description="Final event results preserve rider, event, finishing position, status, and points for future statistics."
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
                  {motorcycle.results.map((result) => (
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
            eyebrow="Performance Detail"
            title="Analytics foundation"
            description="Prepared values for future standings, records, statistics, and setup analytics."
          />
          <div className="mt-8 grid gap-3">
            <PerformanceRow label="Wins" value={Math.max(totals.wins, resultWins)} />
            <PerformanceRow
              label="Podiums"
              value={Math.max(totals.podiums, resultPodiums)}
            />
            <PerformanceRow label="DNFs" value={Math.max(totals.dnfs, resultDnfs)} />
            <PerformanceRow label="Championships" value={totals.championships} />
            <PerformanceRow label="Average finish" value={averageFinish} />
            <PerformanceRow label="Career points" value={totals.points} />
          </div>
        </section>
      </Container>

      <Container className="grid gap-6 py-12 md:grid-cols-2 xl:grid-cols-5">
        <EmptyState
          icon={BookOpen}
          title="News"
          description="Motorcycle news lane reserved for a future approved module."
        />
        <EmptyState
          icon={CirclePlay}
          title="Videos"
          description="Motorcycle videos lane reserved for a future approved module."
        />
        <EmptyState
          icon={GalleryHorizontal}
          title="Gallery"
          description="Motorcycle gallery lane reserved for a future approved module."
        />
        <EmptyState
          icon={FileText}
          title="Documents"
          description="Motorcycle documents lane reserved for a future approved module."
        />
        <EmptyState
          icon={Wrench}
          title="Setup Guides"
          description="Setup-guide lane reserved for future technical database work."
        />
      </Container>

      <Container className="py-12">
        <ButtonLink href="/motorcycles" variant="secondary">
          Back to Motorcycles
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

function PerformanceRow({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="flex items-center justify-between gap-4 p-5">
      <p className="font-semibold">{label}</p>
      <p className="font-mono text-lg text-accent">{value}</p>
    </Card>
  );
}

function formatStrokeType(value: string | null) {
  if (value === "TWO_STROKE") {
    return "2T";
  }

  if (value === "FOUR_STROKE") {
    return "4T";
  }

  return "TBC";
}

function getAverageFinish(values: number[]) {
  if (values.length === 0) {
    return "TBC";
  }

  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return average.toFixed(1);
}

function uniqueById<T extends { id: string }>(items: T[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}
