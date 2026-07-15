import {
  MotorcyclesBrowser,
  type MotorcycleCardData,
} from "@/components/motorcycles/motorcycles-browser";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { SectionTitle } from "@/components/ui/section-title";
import { getMotorcyclesList } from "@/db/motorcycles";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Motorcycles",
  description:
    "Premium Hard Enduro motorcycle index connecting manufacturers, riders, teams, results, and technical specifications.",
};

export default async function MotorcyclesPage() {
  const motorcycles = await getMotorcyclesList();
  const motorcycleCards: MotorcycleCardData[] = motorcycles.map((motorcycle) => {
    const riders = uniqueIds([
      ...motorcycle.currentRiders.map((rider) => rider.id),
      ...motorcycle.riderCareerSeasons.map((career) => career.rider.id),
    ]);
    const totals = motorcycle.riderCareerSeasons.reduce(
      (acc, career) => ({
        championships: acc.championships + (career.championshipPosition === 1 ? 1 : 0),
        wins: acc.wins + career.wins,
        podiums: acc.podiums + career.podiums,
      }),
      { championships: 0, wins: 0, podiums: 0 },
    );
    const status =
      motorcycle.currentRiders.length > 0 ||
      motorcycle.results.length > 0 ||
      motorcycle.riderCareerSeasons.length > 0
        ? "Active"
        : "Historic";

    return {
      id: motorcycle.id,
      slug: motorcycle.slug,
      manufacturer: motorcycle.manufacturer.name,
      model: motorcycle.model,
      heroImage: motorcycle.heroImage,
      year: motorcycle.year ? String(motorcycle.year) : "Year TBC",
      engineCc: motorcycle.engineCc ? `${motorcycle.engineCc} cc` : "Engine TBC",
      engineCcValue: motorcycle.engineCc ?? 0,
      strokeType: formatStrokeType(motorcycle.strokeType),
      weight: motorcycle.weightKg ? `${Number(motorcycle.weightKg)} kg` : "Weight TBC",
      weightValue: motorcycle.weightKg ? Number(motorcycle.weightKg) : 0,
      status,
      ridersUsingIt: riders.length,
      wins: totals.wins,
      podiums: totals.podiums,
      championships: totals.championships,
    };
  });

  return (
    <main className="min-h-screen bg-surface text-foreground">
      <PageHero
        compact
        eyebrow="Motorcycles"
        title="The technical layer of hard enduro."
        description="Explore the motorcycles connecting factory brands, riders, teams, final classifications, and future performance statistics."
      />

      <Container className="py-12">
        <div className="mb-8">
          <SectionTitle
            eyebrow="Motorcycle Index"
            title="Filter the machinery"
            description="This module is powered by Prisma motorcycle, manufacturer, rider career, result, and technical specification records."
          />
        </div>
        <MotorcyclesBrowser motorcycles={motorcycleCards} />
      </Container>
    </main>
  );
}

function uniqueIds(values: string[]) {
  return Array.from(new Set(values));
}

function formatStrokeType(value: string | null) {
  if (value === "TWO_STROKE") {
    return "2T";
  }

  if (value === "FOUR_STROKE") {
    return "4T";
  }

  return "Stroke TBC";
}
