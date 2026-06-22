import { RidersBrowser, type RiderCardData } from "@/components/riders/riders-browser";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { SectionTitle } from "@/components/ui/section-title";
import { getRidersList } from "@/db/riders";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Riders",
  description:
    "Premium Hard Enduro rider index with country, team, manufacturer, motorcycle, and career statistics.",
};

export default async function RidersPage() {
  const riders = await getRidersList();
  const riderCards: RiderCardData[] = riders.map((rider) => {
    const career = rider.careerSeasons[0];
    const standing = rider.standings[0];
    const motorcycle = rider.currentMotorcycle ?? career?.motorcycle ?? null;
    const manufacturer = motorcycle?.manufacturer ?? career?.manufacturer ?? null;

    return {
      id: rider.id,
      slug: rider.slug,
      name: `${rider.firstName} ${rider.lastName}`,
      country: rider.country?.name ?? "Unknown",
      countryCode: rider.country?.isoCode ?? "TBC",
      team: rider.teamMemberships[0]?.team.name ?? career?.team?.name ?? "Independent",
      manufacturer: manufacturer?.name ?? "TBC",
      motorcycle: motorcycle
        ? `${motorcycle.model}${motorcycle.year ? ` ${motorcycle.year}` : ""}`
        : "TBC",
      status: "Active",
      wins: standing?.wins ?? career?.wins ?? 0,
      podiums: standing?.podiums ?? career?.podiums ?? 0,
      championships: career?.championshipPosition === 1 ? 1 : 0,
      dnfs:
        standing?.dnfs ??
        career?.dnfs ??
        rider.results.filter((result) => result.status === "DNF").length,
      points: standing?.points ?? career?.points ?? 0,
    };
  });

  return (
    <main className="min-h-screen bg-surface text-foreground">
      <PageHero
        compact
        eyebrow="Riders"
        title="The athletes who define the hard line."
        description="Search, filter, and explore the seeded rider grid while the module prepares for complete career histories and future automation."
      />

      <Container className="py-12">
        <div className="mb-8">
          <SectionTitle
            eyebrow="Rider Index"
            title="Filter the paddock"
            description="Built on Prisma rider, country, team, motorcycle, standings, and career-history records."
          />
        </div>
        <RidersBrowser riders={riderCards} />
      </Container>
    </main>
  );
}
