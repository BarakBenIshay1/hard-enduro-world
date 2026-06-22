import type { RawOfficialEvent } from "@/jobs/connectors/events/types";

export function parseOfficialEventsPlaceholder(
  events: RawOfficialEvent[],
): RawOfficialEvent[] {
  return events.filter(
    (event) =>
      event.externalId &&
      event.name &&
      event.seasonYear &&
      event.startDate &&
      event.countryName &&
      event.officialUrl,
  );
}
