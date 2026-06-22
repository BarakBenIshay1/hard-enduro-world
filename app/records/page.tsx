import type { Metadata } from "next";
import { Clock, Trophy } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHero } from "@/components/ui/page-hero";
import { SectionTitle } from "@/components/ui/section-title";
import { ChartPlaceholder } from "@/components/statistics/chart-placeholder";
import { MiniRankingTable } from "@/components/statistics/mini-ranking-table";
import { RecordCard } from "@/components/statistics/record-card";
import { siteConfig } from "@/config/site";
import { getRecordsPageData } from "@/db/records";

export const dynamic = "force-dynamic";

const canonical = "/records";
const description =
  "Hard Enduro World Championship records including most wins, podiums, championships, starts, DNFs, successful manufacturers, motorcycles, and countries.";

export const metadata: Metadata = {
  title: "Records",
  description,
  alternates: {
    canonical,
  },
  openGraph: {
    title: "Records | Hard Enduro World",
    description,
    url: new URL(canonical, siteConfig.url).toString(),
    siteName: siteConfig.name,
    type: "website",
  },
};

export default async function RecordsPage() {
  const { recordCards, tables, placeholders } = await getRecordsPageData();

  return (
    <main className="min-h-screen bg-surface text-foreground">
      <PageHero
        compact
        eyebrow="Records"
        title="Historic markers, generated from the database."
        description="Explore premium record cards and ranking tables derived from the seeded championship data, ready for future automated recalculation."
      >
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/statistics">Open Statistics</ButtonLink>
          <ButtonLink href="/results" variant="secondary">
            Open Results
          </ButtonLink>
        </div>
      </PageHero>

      <Container className="py-12">
        <div className="mb-8">
          <SectionTitle
            eyebrow="Record Cards"
            title="Championship record board"
            description="Current leaders are calculated from seeded standings, career seasons, and final result rows."
          />
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {recordCards.map((record) => (
            <RecordCard key={record.title} {...record} />
          ))}
        </div>
      </Container>

      <section className="border-y border-border bg-surface-muted">
        <Container className="grid gap-6 py-12 lg:grid-cols-2">
          <MiniRankingTable title="Most wins" rows={tables.riderWins} />
          <MiniRankingTable title="Most podiums" rows={tables.riderPodiums} />
          <MiniRankingTable title="Most championships" rows={tables.riderChampionships} />
          <MiniRankingTable title="Most starts" rows={tables.riderStarts} />
          <MiniRankingTable title="Most DNFs" rows={tables.riderDnfs} />
          <MiniRankingTable
            title="Most successful manufacturer"
            rows={tables.manufacturerWins}
          />
          <MiniRankingTable
            title="Most successful motorcycle"
            rows={tables.motorcycleWins}
          />
          <MiniRankingTable title="Most successful country" rows={tables.countryWins} />
        </Container>
      </section>

      <Container className="grid gap-6 py-12 lg:grid-cols-2">
        <ChartPlaceholder
          title="Manufacturer record distribution"
          description="Visual placeholder for future records charts."
          bars={tables.manufacturerWins.map((row) => ({
            label: row.label,
            value: row.value,
          }))}
        />
        <ChartPlaceholder
          title="Motorcycle record distribution"
          description="Visual placeholder for future motorcycle success charts."
          bars={tables.motorcycleWins.map((row) => ({
            label: row.label,
            value: row.value,
          }))}
        />
      </Container>

      <section className="border-y border-border bg-black text-white">
        <Container className="py-12">
          <SectionTitle
            eyebrow="Future Record Types"
            title="Placeholders for records that need richer history"
            description="These record types are reserved until birth dates, complete event chronology, and multi-season streak data are imported."
          />
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {placeholders.map((placeholder) => (
              <EmptyState
                key={placeholder}
                icon={placeholder.includes("streak") ? Trophy : Clock}
                title={placeholder}
                description="Placeholder only. This record will be calculated when deeper official history is available."
              />
            ))}
          </div>
        </Container>
      </section>
    </main>
  );
}
