import type { EventsConnectorConfig } from "@/jobs/connectors/events/types";

export function getEventsConnectorConfig(): EventsConnectorConfig {
  return {
    sourceUrl:
      process.env.OFFICIAL_EVENTS_URL || "https://iridehardenduro.com/calendar/demo",
    seasonYear: 2026,
    reviewRequired: true,
  };
}
