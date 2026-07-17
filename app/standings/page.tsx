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
  const { publications } = await getStandingsPageData();
  const seasonOptions = publications.map((publication) => ({
    value: publication.season.id,
    label: publication.season.name,
  }));
  const rows: StandingRowData[] = publications.flatMap((publication) =>
    publication.rows.map((standing) => ({
      id: standing.standingId,
      seasonId: publication.season.id,
      seasonLabel: publication.season.name,
      className: standing.className ?? "Pro",
      position: standing.position,
      riderName: standing.riderName,
      riderSlug: standing.riderSlug,
      country: standing.country,
      countryCode: standing.countryCode,
      team: standing.team,
      manufacturer: standing.manufacturer,
      motorcycle: standing.motorcycle,
      points: standing.points,
      wins: standing.wins,
      podiums: standing.podiums,
      starts: standing.starts,
      dnfs: standing.dnfs,
      trend: "Trend pending",
    })),
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
            description="Officially published standings versions only. Draft calculations and applied-but-unpublished rows stay internal."
          />
          <Card className="p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-foreground/[0.48]">
              Rows loaded
            </p>
            <p className="mt-2 text-3xl font-black text-accent">{rows.length}</p>
          </Card>
        </div>
        {rows.length ? (
          <StandingsTable rows={rows} seasons={seasonOptions} />
        ) : (
          <Card className="p-6 text-sm text-foreground/[0.62]">
            Official standings will appear here after a reviewed calculation set is
            explicitly published.
          </Card>
        )}
      </Container>
    </main>
  );
}
