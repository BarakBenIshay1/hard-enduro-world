import type { Metadata } from "next";
import {
  HistoryBrowser,
  type HistorySeasonCardData,
} from "@/components/history/history-browser";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { SectionTitle } from "@/components/ui/section-title";
import { siteConfig } from "@/config/site";
import { getHistoryIndexData } from "@/db/history";

export const dynamic = "force-dynamic";

const canonical = "/history";
const description =
  "Hard Enduro World Championship history archive with season cards, champions, runner-up previews, events, riders, and manufacturer context.";

export const metadata: Metadata = {
  title: "History",
  description,
  alternates: {
    canonical,
  },
  openGraph: {
    title: "History | Hard Enduro World",
    description,
    url: new URL(canonical, siteConfig.url).toString(),
    siteName: siteConfig.name,
    type: "website",
  },
};

export default async function HistoryPage() {
  const { seasons } = await getHistoryIndexData();
  const seasonCards: HistorySeasonCardData[] = seasons.map((season) => {
    const championStanding = season.standings[0];
    const runnerUpStanding = season.standings[1];
    const championCareer = championStanding?.rider.careerSeasons[0];
    const championMotorcycle =
      championStanding?.rider.currentMotorcycle ?? championCareer?.motorcycle ?? null;
    const championManufacturer =
      championMotorcycle?.manufacturer ?? championCareer?.manufacturer ?? null;

    return {
      id: season.id,
      year: season.year,
      name: season.name,
      status: season.status,
      champion: championStanding
        ? `${championStanding.rider.firstName} ${championStanding.rider.lastName}`
        : "Champion pending",
      runnerUp: runnerUpStanding
        ? `${runnerUpStanding.rider.firstName} ${runnerUpStanding.rider.lastName}`
        : "Runner-up pending",
      eventsCount: season.events.length,
      totalRiders: season.standings.length,
      manufacturerChampion: championManufacturer?.name ?? "Manufacturer champion pending",
    };
  });

  return (
    <main className="min-h-screen bg-surface text-foreground">
      <PageHero
        compact
        eyebrow="Championship History"
        title="The archive of hard enduro seasons."
        description="Explore each championship year through champions, runner-up previews, event counts, rider totals, and season detail pages."
      />

      <Container className="py-12">
        <div className="mb-8">
          <SectionTitle
            eyebrow="Season Archive"
            title="Year-by-year championship index"
            description="This archive is ready for automatic season generation and historical expansion from 2018 onward."
          />
        </div>
        <HistoryBrowser seasons={seasonCards} />
      </Container>
    </main>
  );
}
