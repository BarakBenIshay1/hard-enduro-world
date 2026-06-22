import { createDiffPreviewPlaceholder } from "@/jobs/automation/diff";
import type { ReviewQueueItem } from "@/jobs/automation/types";
import { getEventsConnectorConfig } from "@/jobs/connectors/events/config";
import { fetchOfficialEventsDemoResult } from "@/jobs/connectors/events/mock-fetcher";
import { normalizeOfficialEvent } from "@/jobs/connectors/events/normalizer";
import { parseOfficialEventsPayload } from "@/jobs/connectors/events/parser";
import { fetchOfficialEventsSource } from "@/jobs/connectors/events/source-fetcher";
import type {
  EventsImportPreview,
  EventsSourceTrackingPreview,
  NormalizedOfficialEvent,
} from "@/jobs/connectors/events/types";

export async function previewOfficialEventsImport(): Promise<EventsImportPreview> {
  const config = getEventsConnectorConfig();
  const sourceResult = await fetchOfficialEventsSource(config);
  const fetchResult =
    sourceResult.connectorStatus === "missing-config"
      ? await fetchOfficialEventsDemoResult(config.sourceUrl)
      : sourceResult;
  const rawEvents =
    fetchResult.events.length > 0
      ? fetchResult.events
      : parseOfficialEventsPayload(
          fetchResult.rawContent,
          config.seasonYear,
          config.sourceUrl,
        );
  const parsedEvents = rawEvents;
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
    id: `official-events-review-${index + 1}`,
    jobId: "official-events",
    state: "pending-change",
    diff,
    validationIssues: [],
  }));

  return {
    sourceUrl: config.sourceUrl,
    mode: fetchResult.mode,
    connectorStatus: fetchResult.connectorStatus,
    sourceStatus: fetchResult.sourceStatus,
    fetchedAt: fetchResult.fetchedAt,
    rawEvents,
    normalizedEvents,
    diffs,
    reviewItems,
    sourceTracking: buildSourceTrackingPreview({
      sourceUrl: config.sourceUrl,
      fetchedAt: fetchResult.fetchedAt,
      events: normalizedEvents,
    }),
    errorMessage: fetchResult.errorMessage,
  };
}

function buildSourceTrackingPreview({
  sourceUrl,
  fetchedAt,
  events,
}: {
  sourceUrl: string;
  fetchedAt: Date;
  events: NormalizedOfficialEvent[];
}): EventsSourceTrackingPreview {
  return {
    dataSource: {
      name: "Official events calendar source",
      type: "OFFICIAL_WEBSITE",
      url: sourceUrl,
    },
    sourceSnapshot: {
      url: sourceUrl,
      contentHash: `official-events-preview-${fetchedAt.toISOString()}-${events.length}`,
      fetchedAt: fetchedAt.toISOString(),
      status: "preview",
    },
    importRun: {
      jobName: "official-events",
      status: "NEEDS_REVIEW",
      recordsFound: events.length,
      recordsCreated: events.length,
      recordsUpdated: 0,
    },
    sourceLinks: events.map((event) => ({
      entityType: "EVENT",
      entityId: event.externalId,
      url: event.officialUrl,
    })),
    dataVersions: events.map((event) => ({
      entityType: "EVENT",
      entityId: event.externalId,
      action: "IMPORT",
      status: "preview",
    })),
  };
}
