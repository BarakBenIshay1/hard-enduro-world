import type { Metadata } from "next";
import {
  Bike,
  Brain,
  CalendarDays,
  CirclePlay,
  Flag,
  GalleryHorizontal,
  Medal,
  Swords,
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
import { getRiderDetail } from "@/db/riders";
import { formatDate, formatOptional } from "@/lib/format";

export const dynamic = "force-dynamic";

type RiderProfilePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: RiderProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const rider = await getRiderDetail(slug);
  const name = `${rider.firstName} ${rider.lastName}`;
  const canonical = `/riders/${rider.slug}`;
  const description = `${name} rider profile, career summary, results history, motorcycles, and stage performance preview.`;

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
      type: "profile",
    },
  };
}

export default async function RiderProfilePage({ params }: RiderProfilePageProps) {
  const { slug } = await params;
  const rider = await getRiderDetail(slug);
  const name = `${rider.firstName} ${rider.lastName}`;
  const currentCareer = rider.careerSeasons[0];
  const currentStanding = rider.standings[0];
  const currentTeam = rider.teamMemberships[0]?.team ?? currentCareer?.team ?? null;
  const currentMotorcycle = rider.currentMotorcycle ?? currentCareer?.motorcycle ?? null;
  const currentManufacturer =
    currentMotorcycle?.manufacturer ?? currentCareer?.manufacturer ?? null;
  const championships = rider.careerSeasons.filter(
    (career) => career.championshipPosition === 1,
  ).length;
  const totals = rider.careerSeasons.reduce(
    (acc, career) => ({
      wins: acc.wins + career.wins,
      podiums: acc.podiums + career.podiums,
      starts: acc.starts + career.starts,
      dnfs: acc.dnfs + career.dnfs,
      points: acc.points + career.points,
    }),
    { wins: 0, podiums: 0, starts: 0, dnfs: 0, points: 0 },
  );

  return (
    <main className="min-h-screen bg-surface text-foreground">
      <PageHero
        compact
        eyebrow="Rider Profile"
        title={name}
        description="A cinematic rider profile foundation prepared for long-term career history, media, and future AI summaries."
      >
        <div className="grid gap-5">
          <Breadcrumb items={[{ label: "Riders", href: "/riders" }, { label: name }]} />
          <div className="flex flex-wrap gap-3 text-sm text-white/[0.68]">
            <span className="inline-flex items-center gap-2">
              <Flag className="h-4 w-4 text-accent" />
              {rider.country?.name ?? "Country TBC"} ({rider.country?.isoCode ?? "TBC"})
            </span>
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4 text-accent" />
              {currentTeam?.name ?? "Independent"}
            </span>
            <span className="inline-flex items-center gap-2">
              <Bike className="h-4 w-4 text-accent" />
              {currentManufacturer?.name ?? "TBC"} {currentMotorcycle?.model ?? ""}
            </span>
          </div>
        </div>
      </PageHero>

      <Container className="grid gap-10 py-12 lg:grid-cols-[0.85fr_1.15fr]">
        <Card className="overflow-hidden">
          <div className="relative min-h-[520px] bg-black">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(0_0%_5%),hsl(220_10%_12%)_44%,hsl(24_92%_18%))]" />
            <div className="absolute bottom-5 left-5 rounded-md border border-white/[0.14] bg-black/[0.42] px-4 py-3 text-white backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/[0.52]">
                Rider image placeholder
              </p>
              <p className="mt-1 text-xl font-black">{name}</p>
            </div>
          </div>
        </Card>

        <section>
          <SectionTitle
            eyebrow="Biography"
            title="Built for the complete career arc."
            description={`${name} is represented here with seeded/demo data. The profile is ready for automated official imports, verified biography text, media, and AI-generated editorial summaries in future approved steps.`}
          />

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <InfoCard label="Age" value={getAge(rider.birthDate)} icon={CalendarDays} />
            <InfoCard label="Country" value={rider.country?.name ?? "TBC"} icon={Flag} />
            <InfoCard
              label="Team"
              value={currentTeam?.name ?? "Independent"}
              icon={Users}
            />
            <InfoCard
              label="Motorcycle"
              value={
                currentMotorcycle
                  ? `${currentManufacturer?.name ?? ""} ${currentMotorcycle.model}`.trim()
                  : "TBC"
              }
              icon={Bike}
            />
          </div>
        </section>
      </Container>

      <section className="border-y border-border bg-surface-muted">
        <Container className="py-12">
          <SectionTitle eyebrow="Career Summary" title="Core performance record" />
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <SummaryCard label="Championships" value={championships} icon={Trophy} />
            <SummaryCard label="Wins" value={totals.wins} icon={Medal} />
            <SummaryCard label="Podiums" value={totals.podiums} icon={Medal} />
            <SummaryCard label="Starts" value={totals.starts} icon={Flag} />
            <SummaryCard label="DNFs" value={totals.dnfs} icon={CalendarDays} />
            <SummaryCard label="Points" value={totals.points} icon={Trophy} />
          </div>
        </Container>
      </section>

      <Container className="grid gap-10 py-12 lg:grid-cols-[1fr_0.9fr]">
        <section>
          <SectionTitle
            eyebrow="Current Season"
            title={
              currentStanding?.season.name ?? currentCareer?.season.name ?? "Season TBC"
            }
            description="Current season overview is generated from standings and rider career records."
          />
          <Card className="mt-8 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-black text-white">
                  <tr>
                    {["Position", "Points", "Wins", "Podiums", "Starts", "DNFs"].map(
                      (heading) => (
                        <th key={heading} className="px-5 py-4 font-semibold">
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-5 py-4 font-black text-accent">
                      {formatOptional(currentStanding?.position)}
                    </td>
                    <td className="px-5 py-4">
                      {currentStanding?.points ?? totals.points}
                    </td>
                    <td className="px-5 py-4">{currentStanding?.wins ?? totals.wins}</td>
                    <td className="px-5 py-4">
                      {currentStanding?.podiums ?? totals.podiums}
                    </td>
                    <td className="px-5 py-4">
                      {currentStanding?.starts ?? totals.starts}
                    </td>
                    <td className="px-5 py-4">{currentStanding?.dnfs ?? totals.dnfs}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        <section>
          <SectionTitle
            eyebrow="Performance Visualization"
            title="Points curve placeholder"
            description="A lightweight chart-ready structure that can be replaced by a charting library later."
          />
          <Card className="mt-8 p-6">
            <div className="flex h-56 items-end gap-3">
              {rider.careerSeasons.map((career, index) => (
                <div key={career.id} className="flex flex-1 flex-col items-center gap-3">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-accent to-gold"
                    style={{
                      height: `${Math.max(18, Math.min(100, career.points * 4))}%`,
                    }}
                  />
                  <p className="text-xs font-semibold text-foreground/[0.58]">
                    {career.season.year + index * 0}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </Container>

      <section className="border-y border-border bg-black text-white">
        <Container className="py-12">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <SectionTitle
              eyebrow="Results History"
              title="Event classifications"
              description="Seeded final results connected to event, manufacturer, and motorcycle records."
            />
            <ButtonLink href="/results" variant="secondary">
              Open Results Module
            </ButtonLink>
          </div>
          <Card className="mt-8 overflow-hidden bg-white/[0.045] text-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead className="bg-white/[0.08] text-xs uppercase tracking-[0.18em] text-white/[0.58]">
                  <tr>
                    {["Event", "Date", "Position", "Status", "Motorcycle", "Points"].map(
                      (heading) => (
                        <th key={heading} className="px-5 py-4 font-semibold">
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rider.results.map((result) => (
                    <tr key={result.id} className="border-t border-white/10">
                      <td className="px-5 py-4 font-semibold">{result.event.name}</td>
                      <td className="px-5 py-4 text-white/[0.64]">
                        {formatDate(result.event.startDate)}
                      </td>
                      <td className="px-5 py-4 text-accent">
                        {formatOptional(result.overallPosition)}
                      </td>
                      <td className="px-5 py-4">{result.status}</td>
                      <td className="px-5 py-4">
                        {result.motorcycle
                          ? `${result.motorcycle.manufacturer.name} ${result.motorcycle.model}`
                          : (result.manufacturer?.name ?? "TBC")}
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
        </Container>
      </section>

      <Container className="grid gap-10 py-12 lg:grid-cols-[1fr_0.9fr]">
        <section>
          <SectionTitle
            eyebrow="Season-by-Season"
            title="Career history"
            description="Career rows preserve team, manufacturer, motorcycle, championship position, points, wins, podiums, starts, and DNFs."
          />
          <div className="mt-8 grid gap-3">
            {rider.careerSeasons.map((career) => (
              <Card key={career.id} className="p-5">
                <div className="grid gap-4 lg:grid-cols-[120px_1fr_120px] lg:items-center">
                  <div>
                    <p className="text-2xl font-black">{career.season.year}</p>
                    <p className="text-sm text-foreground/[0.56]">
                      P{formatOptional(career.championshipPosition)}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {career.team?.name ?? "Independent"}
                    </h3>
                    <p className="mt-1 text-sm text-foreground/[0.64]">
                      {career.manufacturer?.name ?? "TBC"}{" "}
                      {career.motorcycle?.model ?? ""}
                    </p>
                  </div>
                  <div className="text-sm">
                    <p>{career.points} pts</p>
                    <p className="text-foreground/[0.56]">
                      {career.wins} wins • {career.podiums} podiums
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle
            eyebrow="Stage Results"
            title="Stage preview"
            description="A compact preview of official stage timing rows for the rider."
          />
          <div className="mt-8 grid gap-3">
            {rider.stageResults.map((stageResult) => (
              <Card key={stageResult.id} className="p-5">
                <p className="text-sm text-foreground/[0.56]">
                  {stageResult.stage.event.name}
                </p>
                <h3 className="mt-1 font-semibold">{stageResult.stage.name}</h3>
                <p className="mt-2 font-mono text-sm">
                  {stageResult.totalTimeText ?? "Time pending"} • {stageResult.status}
                </p>
              </Card>
            ))}
          </div>
        </section>
      </Container>

      <section className="border-y border-border bg-surface-muted">
        <Container className="grid gap-6 py-12 md:grid-cols-2 xl:grid-cols-4">
          <EmptyState
            icon={GalleryHorizontal}
            title="Gallery"
            description="Rider gallery lane reserved for a future approved module."
          />
          <EmptyState
            icon={CirclePlay}
            title="Videos"
            description="Rider videos lane reserved for a future approved module."
          />
          <EmptyState
            icon={Brain}
            title="AI Summary"
            description="AI-generated rider summary placeholder. No AI is implemented yet."
          />
          <EmptyState
            icon={Swords}
            title="Compare Riders"
            description="Rider vs Rider comparison placeholder for a future engine."
          />
        </Container>
      </section>

      <Container className="py-12">
        <ButtonLink href="/riders" variant="secondary">
          Back to Riders
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
  icon: typeof CalendarDays;
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

function getAge(birthDate: Date | null) {
  if (!birthDate) {
    return "TBC";
  }

  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const hasHadBirthday =
    now.getMonth() > birthDate.getMonth() ||
    (now.getMonth() === birthDate.getMonth() && now.getDate() >= birthDate.getDate());

  if (!hasHadBirthday) {
    age -= 1;
  }

  return String(age);
}
