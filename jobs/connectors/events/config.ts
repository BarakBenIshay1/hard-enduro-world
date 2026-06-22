import type { EventsConnectorConfig } from "@/jobs/connectors/events/types";

export function getEventsConnectorConfig(): EventsConnectorConfig {
  return {
    sourceUrl: "https://iridehardenduro.com/calendar/demo",
    seasonYear: 2026,
    reviewRequired: true,
  };
}
