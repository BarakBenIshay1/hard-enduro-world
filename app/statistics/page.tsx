import type { Metadata } from "next";
import { Bike, Factory, Flag, ListChecks, Trophy, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { SectionTitle } from "@/components/ui/section-title";
import { MetricCard } from "@/components/statistics/metric-card";
import { StatisticsExplorer } from "@/components/statistics/statistics-explorer";
import { siteConfig } from "@/config/site";
import { getStatisticsPageData } from "@/db/statistics";

export const dynamic = "force-dynamic";

const canonical = "/statistics";
const description =
  "Hard Enduro World Championship statistics with wins, podiums, DNFs, finish rate, average finish, points leaders, manufacturer performance, and motorcycle performance.";

export const metadata: Metadata = {
  title: "Statistics",
  description,
  alternates: {
    canonical,
  },
  openGraph: {
    title: "Statistics | Hard Enduro World",
    description,
    url: new URL(canonical, siteConfig.url).toString(),
    siteName: siteConfig.name,
    type: "website",
  },
};

export default async function StatisticsPage() {
  const { seasons, overview, facts, pointsLeaders } = await getStatisticsPageData();

  return (
    <main className="min-h-screen bg-surface text-foreground">
      <PageHero
        compact
        eyebrow="Statistics"
        title="The championship knowledge base begins here."
        description="Explore result-driven championship statistics across riders, countries, teams, manufacturers, motorcycles, finishes, DNFs, and points leaders."
      >
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/results">Open Results</ButtonLink>
          <ButtonLink href="/standings" variant="secondary">
            Open Standings
          </ButtonLink>
        </div>
      </PageHero>

      <Container className="py-12">
        <div className="mb-8">
          <SectionTitle
            eyebrow="Global Overview"
            title="Database-wide championship metrics"
            description="High-level counts from the current seeded dataset, ready to evolve into materialized statistics."
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard
            label="Total Riders"
            value={String(overview.totalRiders)}
            icon={Users}
          />
          <MetricCard
            label="Total Events"
            value={String(overview.totalEvents)}
            icon={Flag}
          />
          <MetricCard
            label="Total Results"
            value={String(overview.totalResults)}
            icon={ListChecks}
          />
          <MetricCard
            label="Manufacturers"
            value={String(overview.totalManufacturers)}
            icon={Factory}
          />
          <MetricCard
            label="Motorcycles"
            value={String(overview.totalMotorcycles)}
            icon={Bike}
          />
        </div>
      </Container>

      <section className="border-y border-border bg-surface-muted">
        <Container className="py-12">
          <div className="mb-8">
            <SectionTitle
              eyebrow="Interactive-ready"
              title="Filterable statistics explorer"
              description="The current UI uses lightweight chart-ready sections. Chart.js can replace these views later without changing the data model."
            />
          </div>
          <StatisticsExplorer
            seasons={seasons}
            facts={facts}
            pointsLeaders={pointsLeaders}
          />
        </Container>
      </section>

      <Container className="py-12">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-center">
          <SectionTitle
            eyebrow="Future Architecture"
            title="Prepared for calculated statistics"
            description="This step keeps calculations centralized and prepares the app for materialized statistics, automated recalculation jobs, charts, records, and AI insights."
          />
          <MetricCard
            label="Chart Engine"
            value="Ready"
            detail="No chart library added yet."
            icon={Trophy}
          />
        </div>
      </Container>
    </main>
  );
}
