import type {
  EventsConnectorConfig,
  OfficialEventsFetchResult,
} from "@/jobs/connectors/events/types";

export async function fetchOfficialEventsSource(
  config: EventsConnectorConfig,
): Promise<OfficialEventsFetchResult> {
  if (!process.env.OFFICIAL_EVENTS_URL) {
    return {
      mode: "demo",
      connectorStatus: "missing-config",
      sourceStatus: "not-configured",
      sourceUrl: config.sourceUrl,
      fetchedAt: new Date(),
      rawContent: "",
      events: [],
      errorMessage: "OFFICIAL_EVENTS_URL is required for real calendar imports.",
    };
  }

  try {
    const response = await fetch(config.sourceUrl);
    const rawContent = await response.text();

    if (!response.ok) {
      return {
        mode: "api",
        connectorStatus: "error",
        sourceStatus: "error",
        sourceUrl: config.sourceUrl,
        fetchedAt: new Date(),
        rawContent,
        events: [],
        errorMessage: `Official events fetch failed with HTTP ${response.status}.`,
      };
    }

    return {
      mode: "api",
      connectorStatus: "configured",
      sourceStatus: "available",
      sourceUrl: config.sourceUrl,
      fetchedAt: new Date(),
      rawContent,
      events: [],
    };
  } catch (error) {
    return {
      mode: "api",
      connectorStatus: "error",
      sourceStatus: "error",
      sourceUrl: config.sourceUrl,
      fetchedAt: new Date(),
      rawContent: "",
      events: [],
      errorMessage:
        error instanceof Error ? error.message : "Unknown official events fetch error.",
    };
  }
}
