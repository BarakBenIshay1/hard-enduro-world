import { EventsBrowser, type EventCardData } from "@/components/events/events-browser";
import { getRaceStatus } from "@/components/events/race-status";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { SectionTitle } from "@/components/ui/section-title";
import { getEventsList } from "@/db/events";
import { formatDateRange } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Events",
  description:
    "Premium Hard Enduro World Championship event calendar with stage, country, winner, and timing previews.",
};

export default async function EventsPage() {
  const events = await getEventsList();
  const eventCards: EventCardData[] = events.map((event) => {
    const winner = event.results[0]?.rider;
    const raceStatus = getRaceStatus(event);
    const finisherCount = event.results.filter(
      (result) => result.status === "FINISHED",
    ).length;

    return {
      id: event.id,
      slug: event.slug,
      name: event.name,
      country: event.country?.name ?? "Location TBC",
      countryCode: event.country?.isoCode ?? "TBC",
      season: event.season.name,
      year: event.season.year,
      dateLabel: formatDateRange(event.startDate, event.endDate),
      startTimestamp: event.startDate.getTime(),
      status: raceStatus.label,
      statusPhase: raceStatus.phase,
      elevation: "1,466 m profile",
      previousWinner: winner ? `${winner.firstName} ${winner.lastName}` : "Pending",
      stageCount: event.stages.length,
      riderCount: event._count.results,
      finisherCount,
    };
  });

  return (
    <main className="min-h-screen bg-surface text-foreground">
      <PageHero
        compact
        eyebrow="Events"
        title="The championship calendar, built like a race control room."
        description="Browse the 2026 Hard Enduro World Championship calendar, then explore previous seasons through the championship archive."
      />

      <Container className="py-12">
        <div className="mb-8">
          <SectionTitle
            eyebrow="Event Index"
            title="Filter the calendar"
            description="The current season is shown first. Older championship seasons remain available through the year selector."
          />
        </div>
        <EventsBrowser events={eventCards} />
      </Container>
    </main>
  );
}
