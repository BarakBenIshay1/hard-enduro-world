import { TeamsBrowser, type TeamCardData } from "@/components/teams/teams-browser";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { SectionTitle } from "@/components/ui/section-title";
import { getTeamsList } from "@/db/teams";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Teams",
  description:
    "Hard Enduro team index covering factory and independent racing organizations, riders, achievements, and season history.",
};

export default async function TeamsPage() {
  const teams = await getTeamsList();
  const teamCards: TeamCardData[] = teams.map((team) => {
    const totals = team.careerSeasons.reduce(
      (acc, career) => ({
        championships: acc.championships + (career.championshipPosition === 1 ? 1 : 0),
        wins: acc.wins + career.wins,
        podiums: acc.podiums + career.podiums,
      }),
      { championships: 0, wins: 0, podiums: 0 },
    );
    const primaryCareer = [...team.careerSeasons].sort((a, b) => b.points - a.points)[0];
    const manufacturer =
      primaryCareer?.manufacturer?.name ??
      team.memberships[0]?.rider.currentMotorcycle?.manufacturer.name ??
      "Independent";
    const season =
      primaryCareer?.season.name ??
      team.careerSeasons[0]?.season.name ??
      "Championship season TBC";

    return {
      id: team.id,
      slug: team.slug,
      name: team.name,
      country: team.country?.name ?? "International",
      countryCode: team.country?.isoCode ?? "TBC",
      manufacturer,
      status: team.memberships.length > 0 ? "Active" : "Historic",
      season,
      activeRiders: team.memberships.length,
      championships: totals.championships,
      wins: totals.wins,
      podiums: totals.podiums,
      overview: `${team.name} is connected to seeded/demo rider, manufacturer, motorcycle, and championship records for the Step 8 Teams module foundation.`,
    };
  });

  return (
    <main className="min-h-screen bg-surface text-foreground">
      <PageHero
        compact
        eyebrow="Teams"
        title="Teams"
        description="Discover the factory and independent teams competing throughout the championship, their riders, achievements, and season history."
      />

      <Container className="py-12">
        <div className="mb-8">
          <SectionTitle
            eyebrow="Team Index"
            title="Filter the paddock organizations"
            description="Browse racing organizations by country, manufacturer relationship, active riders, and championship-era profile data."
          />
        </div>
        <TeamsBrowser teams={teamCards} />
      </Container>
    </main>
  );
}
