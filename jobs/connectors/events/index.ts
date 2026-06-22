import { createDiffPreviewPlaceholder } from "@/jobs/automation/diff";
import type { ReviewQueueItem } from "@/jobs/automation/types";
import { getEventsConnectorConfig } from "@/jobs/connectors/events/config";
import { fetchOfficialEventsDemo } from "@/jobs/connectors/events/mock-fetcher";
import { normalizeOfficialEvent } from "@/jobs/connectors/events/normalizer";
import { parseOfficialEventsPlaceholder } from "@/jobs/connectors/events/parser";
import type { EventsImportPreview } from "@/jobs/connectors/events/types";

export async function previewOfficialEventsImport(): Promise<EventsImportPreview> {
  const config = getEventsConnectorConfig();
  const rawEvents = await fetchOfficialEventsDemo();
  const parsedEvents = parseOfficialEventsPlaceholder(rawEvents);
  const normalizedEvents = parsedEvents.map(normalizeOfficialEvent);
  const diffs = normalizedEvents.map((event) =>
    createDiffPreviewPlaceholder({
      entityType: "EVENT",
      sourceUrl: config.sourceUrl,
      payload: {
        externalId: event.externalId,
        name: event.name,
        slug: event.slug,
        seasonYear: event.seasonYear,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate?.toISOString() ?? null,
        countryName: event.countryName,
        countryCode: event.countryCode,
        city: event.city,
        venue: event.venue,
        status: event.status,
        officialUrl: event.officialUrl,
      },
    }),
  );
  const reviewItems: ReviewQueueItem[] = diffs.map((diff, index) => ({
    id: `official-events-demo-${index + 1}`,
    jobId: "official-events",
    state: "pending-change",
    diff,
    validationIssues: [],
  }));

  return {
    sourceUrl: config.sourceUrl,
    rawEvents,
    normalizedEvents,
    diffs,
    reviewItems,
  };
}
