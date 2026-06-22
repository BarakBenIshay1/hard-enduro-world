import type { Metadata } from "next";
import { ResultsTable, type ResultRowData } from "@/components/competition/results-table";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { SectionTitle } from "@/components/ui/section-title";
import { siteConfig } from "@/config/site";
import { getResultsPageData } from "@/db/results";

export const dynamic = "force-dynamic";

const canonical = "/results";
const description =
  "Hard Enduro World Championship race results with event, stage, rider, motorcycle, timing, gaps, penalties, points, and status data.";

export const metadata: Metadata = {
  title: "Results",
  description,
  alternates: {
    canonical,
  },
  openGraph: {
    title: "Results | Hard Enduro World",
    description,
    url: new URL(canonical, siteConfig.url).toString(),
    siteName: siteConfig.name,
    type: "website",
  },
};

export default async function ResultsPage() {
  const { seasons, events, overallResults, stageResults } = await getResultsPageData();
  const seasonOptions = seasons.map((season) => ({
    value: season.id,
    label: season.name,
  }));
  const eventOptions = events.map((event) => ({
    value: event.id,
    label: event.name,
  }));
  const overallRows: ResultRowData[] = overallResults.map((result) => {
    const career =
      result.rider.careerSeasons.find(
        (item) => item.seasonId === result.event.seasonId,
      ) ?? result.rider.careerSeasons[0];
    const motorcycle = result.motorcycle ?? career?.motorcycle ?? null;
    const manufacturer =
      result.manufacturer ?? motorcycle?.manufacturer ?? career?.manufacturer;

    return {
      id: `overall-${result.id}`,
      sourceType: "overall",
      seasonId: result.event.seasonId,
      eventId: result.eventId,
      eventName: result.event.name,
      eventSlug: result.event.slug,
      stageLabel: "Overall",
      riderName: `${result.rider.firstName} ${result.rider.lastName}`,
      riderSlug: result.rider.slug,
      country: result.rider.country?.name ?? "Unknown",
      countryCode: result.rider.country?.isoCode ?? "TBC",
      team:
        result.rider.teamMemberships[0]?.team.name ?? career?.team?.name ?? "Independent",
      manufacturer: manufacturer?.name ?? "TBC",
      motorcycle: motorcycle
        ? `${motorcycle.model}${motorcycle.year ? ` ${motorcycle.year}` : ""}`
        : "TBC",
      position: result.overallPosition,
      time: result.totalTimeText,
      gapToLeader: result.gapToLeaderText,
      gapToPrevious: result.gapToPreviousText,
      penalties: result.penaltiesMs ? `${result.penaltiesMs} ms` : null,
      points: result.points,
      status: result.status,
    };
  });
  const stageRows: ResultRowData[] = stageResults.map((result) => {
    const career =
      result.rider.careerSeasons.find(
        (item) => item.seasonId === result.stage.event.seasonId,
      ) ?? result.rider.careerSeasons[0];
    const motorcycle = result.motorcycle ?? career?.motorcycle ?? null;
    const manufacturer =
      result.manufacturer ?? motorcycle?.manufacturer ?? career?.manufacturer;

    return {
      id: `stage-${result.id}`,
      sourceType: "stage",
      seasonId: result.stage.event.seasonId,
      eventId: result.stage.eventId,
      eventName: result.stage.event.name,
      eventSlug: result.stage.event.slug,
      stageLabel: result.stage.name,
      riderName: `${result.rider.firstName} ${result.rider.lastName}`,
      riderSlug: result.rider.slug,
      country: result.rider.country?.name ?? "Unknown",
      countryCode: result.rider.country?.isoCode ?? "TBC",
      team:
        result.rider.teamMemberships[0]?.team.name ?? career?.team?.name ?? "Independent",
      manufacturer: manufacturer?.name ?? "TBC",
      motorcycle: motorcycle
        ? `${motorcycle.model}${motorcycle.year ? ` ${motorcycle.year}` : ""}`
        : "TBC",
      position: result.overallPosition,
      time: result.totalTimeText,
      gapToLeader: result.gapToLeaderText,
      gapToPrevious: result.gapToPreviousText,
      penalties:
        result.penaltiesText ?? (result.penaltiesMs ? `${result.penaltiesMs} ms` : null),
      points: null,
      status: result.status,
    };
  });
  const rows = [...overallRows, ...stageRows];

  return (
    <main className="min-h-screen bg-surface text-foreground">
      <PageHero
        compact
        eyebrow="Results"
        title="Race classifications, preserved row by row."
        description="Explore final results and stage timing rows with event, rider, machine, timing, gaps, penalties, points, and status filters."
      />

      <Container className="py-12">
        <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-end">
          <SectionTitle
            eyebrow="Race Results"
            title="Overall and stage classifications"
            description="A reusable results surface prepared for official imports, complete timing tables, and future live timing."
          />
          <Card className="p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-foreground/[0.48]">
              Rows loaded
            </p>
            <p className="mt-2 text-3xl font-black text-accent">{rows.length}</p>
          </Card>
        </div>
        <ResultsTable rows={rows} seasons={seasonOptions} events={eventOptions} />
      </Container>
    </main>
  );
}
