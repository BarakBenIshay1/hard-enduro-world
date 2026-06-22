import type { Metadata } from "next";
import {
  StandingsTable,
  type StandingRowData,
} from "@/components/competition/standings-table";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { SectionTitle } from "@/components/ui/section-title";
import { siteConfig } from "@/config/site";
import { getStandingsPageData } from "@/db/standings";

export const dynamic = "force-dynamic";

const canonical = "/standings";
const description =
  "Hard Enduro World Championship standings with rider, country, team, manufacturer, motorcycle, points, wins, podiums, starts, and DNF data.";

export const metadata: Metadata = {
  title: "Standings",
  description,
  alternates: {
    canonical,
  },
  openGraph: {
    title: "Standings | Hard Enduro World",
    description,
    url: new URL(canonical, siteConfig.url).toString(),
    siteName: siteConfig.name,
    type: "website",
  },
};

export default async function StandingsPage() {
  const { seasons } = await getStandingsPageData();
  const seasonOptions = seasons.map((season) => ({
    value: season.id,
    label: season.name,
  }));
  const rows: StandingRowData[] = seasons.flatMap((season) =>
    season.standings.map((standing) => {
      const career =
        standing.rider.careerSeasons.find((item) => item.seasonId === season.id) ??
        standing.rider.careerSeasons[0];
      const motorcycle = standing.rider.currentMotorcycle ?? career?.motorcycle ?? null;
      const manufacturer = motorcycle?.manufacturer ?? career?.manufacturer ?? null;

      return {
        id: standing.id,
        seasonId: season.id,
        seasonLabel: season.name,
        className: standing.className ?? "Pro",
        position: standing.position,
        riderName: `${standing.rider.firstName} ${standing.rider.lastName}`,
        riderSlug: standing.rider.slug,
        country: standing.rider.country?.name ?? "Unknown",
        countryCode: standing.rider.country?.isoCode ?? "TBC",
        team:
          standing.rider.teamMemberships[0]?.team.name ??
          career?.team?.name ??
          "Independent",
        manufacturer: manufacturer?.name ?? "TBC",
        motorcycle: motorcycle
          ? `${motorcycle.model}${motorcycle.year ? ` ${motorcycle.year}` : ""}`
          : "TBC",
        points: standing.points,
        wins: standing.wins,
        podiums: standing.podiums,
        starts: standing.starts,
        dnfs: standing.dnfs,
        trend: "Trend pending",
      };
    }),
  );

  return (
    <main className="min-h-screen bg-surface text-foreground">
      <PageHero
        compact
        eyebrow="Standings"
        title="The championship table, built for depth."
        description="Filter the seeded championship standings across rider, country, team, manufacturer, motorcycle, and performance metrics."
      />

      <Container className="py-12">
        <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-end">
          <SectionTitle
            eyebrow="Championship Core"
            title="Sortable standings"
            description="A reusable standings surface prepared for live standings, official imports, statistics, and records."
          />
          <Card className="p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-foreground/[0.48]">
              Rows loaded
            </p>
            <p className="mt-2 text-3xl font-black text-accent">{rows.length}</p>
          </Card>
        </div>
        <StandingsTable rows={rows} seasons={seasonOptions} />
      </Container>
    </main>
  );
}
