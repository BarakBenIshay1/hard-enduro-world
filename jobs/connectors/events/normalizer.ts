import type {
  NormalizedOfficialEvent,
  RawOfficialEvent,
} from "@/jobs/connectors/events/types";
import { createSlug } from "@/lib/slug";

export function normalizeOfficialEvent(event: RawOfficialEvent): NormalizedOfficialEvent {
  return {
    externalId: event.externalId,
    name: event.name,
    slug: `${createSlug(event.name)}-${event.seasonYear}`,
    seasonYear: event.seasonYear,
    startDate: new Date(event.startDate),
    endDate: event.endDate ? new Date(event.endDate) : null,
    countryName: event.countryName,
    countryCode: event.countryCode,
    city: event.city ?? null,
    venue: event.venue ?? null,
    status: event.status,
    officialUrl: event.officialUrl,
  };
}
