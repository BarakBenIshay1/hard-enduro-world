import { EventsBrowser, type EventCardData } from "@/components/events/events-browser";
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
      status: event.liveStatus,
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
        description="Explore each event through country, season, status, stage count, winner context, and the first timing statistics."
      />

      <Container className="py-12">
        <div className="mb-8">
          <SectionTitle
            eyebrow="Event Index"
            title="Filter the calendar"
            description="This module is prepared for many seasons while currently using the seeded event dataset."
          />
        </div>
        <EventsBrowser events={eventCards} />
      </Container>
    </main>
  );
}
