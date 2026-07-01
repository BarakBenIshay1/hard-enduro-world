import {
  ManufacturersBrowser,
  type ManufacturerCardData,
} from "@/components/manufacturers/manufacturers-browser";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { SectionTitle } from "@/components/ui/section-title";
import { getManufacturersList } from "@/db/manufacturers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manufacturers",
  description:
    "Hard Enduro motorcycle manufacturer index covering factory programs, technical evolution, rider line-ups, and championship history.",
};

export default async function ManufacturersPage() {
  const manufacturers = await getManufacturersList();
  const manufacturerCards: ManufacturerCardData[] = manufacturers.map((manufacturer) => {
    const teams = uniqueIds(
      manufacturer.riderCareerSeasons
        .map((career) => career.team?.id)
        .filter((value): value is string => Boolean(value)),
    );
    const riders = uniqueIds([
      ...manufacturer.riderCareerSeasons.map((career) => career.rider.id),
      ...manufacturer.motorcycles.flatMap((motorcycle) =>
        motorcycle.currentRiders.map((rider) => rider.id),
      ),
    ]);
    const totals = manufacturer.riderCareerSeasons.reduce(
      (acc, career) => ({
        championships: acc.championships + (career.championshipPosition === 1 ? 1 : 0),
        wins: acc.wins + career.wins,
        podiums: acc.podiums + career.podiums,
      }),
      { championships: 0, wins: 0, podiums: 0 },
    );
    const primarySeason = [...manufacturer.riderCareerSeasons].sort(
      (a, b) => b.season.year - a.season.year || b.points - a.points,
    )[0]?.season.name;
    const status =
      manufacturer.riderCareerSeasons.length > 0 || manufacturer.results.length > 0
        ? "Active"
        : "Historic";

    return {
      id: manufacturer.id,
      slug: manufacturer.slug,
      name: manufacturer.name,
      country: manufacturer.country?.name ?? "International",
      countryCode: manufacturer.country?.isoCode ?? "TBC",
      status,
      season: primarySeason ?? "Manufacturer archive",
      motorcycleModels: manufacturer.motorcycles.map((motorcycle) => motorcycle.model),
      activeTeams: teams.length,
      activeRiders: riders.length,
      championships: totals.championships,
      wins: totals.wins,
      podiums: totals.podiums,
      overview: `${manufacturer.name} is a motorcycle brand represented by riders and teams across Hard Enduro events, with technical model history ready for verified expansion.`,
    };
  });

  return (
    <main className="min-h-screen bg-surface text-foreground">
      <PageHero
        compact
        eyebrow="Manufacturers"
        title="Manufacturers"
        description="Explore the motorcycle brands competing in Hard Enduro, their factory programs, championship history, technical evolution, and rider line-ups."
      />

      <Container className="py-12">
        <div className="mb-8">
          <SectionTitle
            eyebrow="Manufacturer Index"
            title="Filter the motorcycle brands"
            description="Browse manufacturer profiles centered on machines, factory programs, rider usage, and future verified performance history."
          />
        </div>
        <ManufacturersBrowser manufacturers={manufacturerCards} />
      </Container>
    </main>
  );
}

function uniqueIds(values: string[]) {
  return Array.from(new Set(values));
}
