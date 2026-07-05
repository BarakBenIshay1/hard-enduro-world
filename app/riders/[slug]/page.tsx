import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";
import { getRiderDetail } from "@/db/riders";
import { formatDate, formatOptional } from "@/lib/format";
import { RiderCareerTimeline } from "@/components/riders/RiderCareerTimeline";
import { RiderCurrentSetup } from "@/components/riders/RiderCurrentSetup";
import { RiderHero } from "@/components/riders/RiderHero";
import { RiderRelatedLinks } from "@/components/riders/RiderRelatedLinks";
import { RiderResultsHistory } from "@/components/riders/RiderResultsHistory";
import { RiderStatsCards } from "@/components/riders/RiderStatsCards";

export const dynamic = "force-dynamic";

type RiderProfilePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: RiderProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const rider = await getRiderDetail(slug);
  const name = getRiderName(rider.firstName, rider.lastName);
  const canonical = `/riders/${rider.slug}`;
  const description = `${name} rider profile, current team, motorcycle setup, verified results, and career timeline.`;

  return {
    title: name,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${name} | Hard Enduro World`,
      description,
      url: new URL(canonical, siteConfig.url).toString(),
      siteName: siteConfig.name,
      type: "profile",
    },
  };
}

export default async function RiderProfilePage({ params }: RiderProfilePageProps) {
  const { slug } = await params;
  const rider = await getRiderDetail(slug);
  const name = getRiderName(rider.firstName, rider.lastName);
  const currentCareer = rider.careerSeasons[0] ?? null;
  const currentStanding = rider.standings[0] ?? null;
  const currentTeam = rider.teamMemberships[0]?.team ?? currentCareer?.team ?? null;
  const currentMotorcycle = rider.currentMotorcycle ?? currentCareer?.motorcycle ?? null;
  const currentManufacturer =
    currentMotorcycle?.manufacturer ?? currentCareer?.manufacturer ?? null;
  const status =
    currentTeam || currentCareer || rider.results.length > 0 ? "Active" : "Profile";
  const championships = rider.careerSeasons.filter(
    (career) => career.championshipPosition === 1,
  ).length;
  const totals = rider.careerSeasons.reduce(
    (acc, career) => ({
      wins: acc.wins + career.wins,
      podiums: acc.podiums + career.podiums,
      starts: acc.starts + career.starts,
      dnfs: acc.dnfs + career.dnfs,
    }),
    { wins: 0, podiums: 0, starts: 0, dnfs: 0 },
  );
  const resultFinishes = rider.results.filter(
    (result) => result.status === "FINISHED",
  ).length;
  const resultDnfs = rider.results.filter((result) => result.status === "DNF").length;
  const starts = totals.starts > 0 ? totals.starts : rider.results.length;
  const dnfs = totals.dnfs > 0 ? totals.dnfs : resultDnfs;

  return (
    <main className="min-h-screen bg-surface text-foreground">
      <RiderHero
        name={name}
        initials={getInitials(rider.firstName, rider.lastName)}
        country={rider.country?.name ?? "Country TBC"}
        countryCode={rider.country?.isoCode ?? "TBC"}
        team={currentTeam?.name ?? "Independent"}
        manufacturer={currentManufacturer?.name ?? "Manufacturer TBC"}
        motorcycle={currentMotorcycle?.model ?? "Motorcycle TBC"}
        status={status}
        bio="Verified biography coming soon. This profile is prepared to preserve official rider history, current setup, and source-reviewed results."
        profileImageUrl={null}
      />

      <Container className="grid gap-10 py-12">
        <VerificationNote />

        <RiderStatsCards
          stats={[
            { label: "Wins", value: totals.wins },
            { label: "Podiums", value: totals.podiums },
            { label: "Titles", value: championships },
            { label: "Starts", value: starts },
            { label: "Finishes", value: resultFinishes },
            { label: "DNF", value: dnfs },
          ]}
        />

        <div className="grid gap-10 xl:grid-cols-[0.95fr_1.05fr]">
          <RiderCurrentSetup
            items={buildCurrentSetupItems({
              currentTeam,
              currentManufacturer,
              currentMotorcycle,
              season: currentStanding?.season.name ?? currentCareer?.season.name ?? null,
              status,
            })}
          />

          <RiderRelatedLinks
            links={buildRelatedLinks({
              currentTeam,
              currentManufacturer,
              currentMotorcycle,
              results: rider.results,
            })}
          />
        </div>

        <RiderCareerTimeline
          items={rider.careerSeasons.map((career) => ({
            id: career.id,
            year: career.season.year,
            season: career.season.name,
            team: career.team?.name ?? "Independent",
            manufacturer: career.manufacturer?.name ?? "Manufacturer TBC",
            motorcycle: career.motorcycle
              ? `${career.motorcycle.manufacturer.name} ${career.motorcycle.model}`
              : "Motorcycle TBC",
            championshipPosition: career.championshipPosition
              ? `Championship P${career.championshipPosition}`
              : "Classification pending verification",
            achievement:
              career.wins > 0 || career.podiums > 0
                ? `${career.wins} wins / ${career.podiums} podiums`
                : "Major achievements pending verification",
          }))}
        />

        <RiderResultsHistory
          results={rider.results.slice(0, 8).map((result) => ({
            id: result.id,
            event: result.event.name,
            eventHref: `/events/${result.event.slug}`,
            date: formatDate(result.event.startDate),
            position: formatOptional(result.overallPosition),
            status: result.status,
            motorcycle: result.motorcycle
              ? `${result.motorcycle.manufacturer.name} ${result.motorcycle.model}`
              : (result.manufacturer?.name ?? "Motorcycle TBC"),
            points: formatOptional(result.points),
          }))}
        />

        <div className="flex justify-start">
          <ButtonLink href="/riders" variant="secondary">
            Back to Riders
          </ButtonLink>
        </div>
      </Container>
    </main>
  );
}

function VerificationNote() {
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <ShieldCheck className="h-5 w-5 text-accent" aria-hidden="true" />
        <p className="text-sm font-semibold text-foreground/[0.66]">
          Rider profile data is displayed conservatively. Unverified biography,
          performance totals, and historical details remain marked as pending until
          official sources are reviewed.
        </p>
      </div>
    </Card>
  );
}

function buildCurrentSetupItems({
  currentTeam,
  currentManufacturer,
  currentMotorcycle,
  season,
  status,
}: {
  currentTeam: { name: string; slug: string } | null;
  currentManufacturer: { name: string; slug: string } | null;
  currentMotorcycle: {
    model: string;
    slug: string;
    manufacturer?: { name: string };
  } | null;
  season: string | null;
  status: string;
}) {
  return [
    currentTeam
      ? { label: "Team", value: currentTeam.name, href: `/teams/${currentTeam.slug}` }
      : { label: "Team", value: "Independent" },
    currentManufacturer
      ? {
          label: "Manufacturer",
          value: currentManufacturer.name,
          href: `/manufacturers/${currentManufacturer.slug}`,
        }
      : { label: "Manufacturer", value: "Verified data coming soon" },
    currentMotorcycle
      ? {
          label: "Motorcycle",
          value: `${currentMotorcycle.manufacturer?.name ?? ""} ${
            currentMotorcycle.model
          }`.trim(),
          href: `/motorcycles/${currentMotorcycle.slug}`,
        }
      : { label: "Motorcycle", value: "Verified data coming soon" },
    { label: "Season", value: season ?? "Verified data coming soon" },
    { label: "Status", value: status },
  ];
}

function buildRelatedLinks({
  currentTeam,
  currentManufacturer,
  currentMotorcycle,
  results,
}: {
  currentTeam: { name: string; slug: string } | null;
  currentManufacturer: { name: string; slug: string } | null;
  currentMotorcycle: {
    model: string;
    slug: string;
    manufacturer?: { name: string };
  } | null;
  results: Array<{ event: { name: string; slug: string } }>;
}) {
  const links = [
    currentTeam
      ? { type: "Team", label: currentTeam.name, href: `/teams/${currentTeam.slug}` }
      : null,
    currentManufacturer
      ? {
          type: "Manufacturer",
          label: currentManufacturer.name,
          href: `/manufacturers/${currentManufacturer.slug}`,
        }
      : null,
    currentMotorcycle
      ? {
          type: "Motorcycle",
          label: `${currentMotorcycle.manufacturer?.name ?? ""} ${
            currentMotorcycle.model
          }`.trim(),
          href: `/motorcycles/${currentMotorcycle.slug}`,
        }
      : null,
    ...results.slice(0, 4).map((result) => ({
      type: "Event",
      label: result.event.name,
      href: `/events/${result.event.slug}`,
    })),
  ].filter((link): link is { type: string; label: string; href: string } =>
    Boolean(link),
  );

  return Array.from(new Map(links.map((link) => [link.href, link])).values());
}

function getRiderName(firstName: string, lastName: string) {
  return [firstName, lastName].filter(Boolean).join(" ");
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
