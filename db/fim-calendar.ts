import type { FimCalendarCurrentEvent } from "@/jobs/connectors/fim-calendar";
import { prisma } from "@/lib/prisma";

export async function getFimCalendarCurrentEvents(
  seasonYear: number,
): Promise<FimCalendarCurrentEvent[]> {
  const events = await prisma.event.findMany({
    where: {
      season: {
        year: seasonYear,
      },
    },
    include: {
      country: true,
      season: true,
    },
    orderBy: {
      startDate: "asc",
    },
  });

  return events.map((event) => ({
    id: event.id,
    slug: event.slug,
    name: event.name,
    seasonYear: event.season.year,
    country: event.country?.name ?? null,
    countryCode: event.country?.isoCode ?? null,
    location: event.city,
    venue: event.venue,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate?.toISOString() ?? null,
    status: event.status,
    officialUrl: event.officialUrl,
    sourceEventId: null,
  }));
}
