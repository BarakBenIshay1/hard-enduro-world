import type {
  ProductionSourceCategory,
  ProductionSourceRegistryEntry,
  ProductionUpdateType,
  RefreshFrequency,
} from "./types";
import type { SourceContentType, SourceEntityType, SourcePriority } from "../types";

const standardBackoff = {
  type: "exponential",
  initialDelayMs: 60_000,
  maxDelayMs: 3_600_000,
  multiplier: 2,
} as const;

const manualBackoff = {
  type: "none",
  initialDelayMs: 0,
  maxDelayMs: 0,
} as const;

type SourceInput = {
  id: string;
  displayName: string;
  officialName?: string;
  shortDescription: string;
  websiteUrl?: string | null;
  category: ProductionSourceCategory;
  priority?: SourcePriority;
  country?: string | null;
  timezone?: string | null;
  entityTypes: SourceEntityType[];
  contentTypes: SourceContentType[];
  updateTypes: ProductionUpdateType[];
  refreshFrequency?: RefreshFrequency;
  connectorName?: string;
  connectorVersion?: string;
  enabled?: boolean;
  tags?: string[];
  notes?: string;
};

function createSource(input: SourceInput): ProductionSourceRegistryEntry {
  return {
    id: input.id,
    displayName: input.displayName,
    officialName: input.officialName ?? input.displayName,
    shortDescription: input.shortDescription,
    websiteUrl: input.websiteUrl ?? null,
    category: input.category,
    priority: input.priority ?? "medium",
    confidenceLevel:
      input.category === "trusted-creator" ? "trusted" : "official-primary",
    reviewPolicy:
      input.category === "trusted-creator" || input.category === "official-media"
        ? "media-review"
        : "always-review",
    enabled: input.enabled ?? true,
    status: input.enabled === false ? "planned" : "active",
    language: "en",
    country: input.country ?? null,
    timezone: input.timezone ?? null,
    connectorName: input.connectorName ?? "not-implemented",
    connectorVersion: input.connectorVersion ?? "0.0.0",
    supportedEntityTypes: input.entityTypes,
    supportedContentTypes: input.contentTypes,
    supportedUpdateTypes: input.updateTypes,
    refreshFrequency: input.refreshFrequency ?? "manual",
    retryPolicy: {
      maximumRetries: input.enabled === false ? 0 : 3,
      backoff: input.enabled === false ? manualBackoff : standardBackoff,
    },
    maximumRetries: input.enabled === false ? 0 : 3,
    lastManualReview: null,
    documentationReference: "docs/architecture/source-registry.md",
    owner: "Hard Enduro World Data Team",
    tags: input.tags ?? [],
    notes:
      input.notes ??
      "Registry metadata only. No connector, sync, scrape, API call, or publication is enabled by this entry.",
  };
}

const eventEntities: SourceEntityType[] = [
  "event",
  "stage",
  "result",
  "season",
  "standings",
  "media",
  "document",
  "course-map",
];

const eventContent: SourceContentType[] = [
  "calendar",
  "event-metadata",
  "results",
  "timing",
  "standings",
  "participants",
  "media",
  "videos",
  "maps",
  "documents",
  "course-map",
  "history",
];

const eventUpdates: ProductionUpdateType[] = [
  "calendar",
  "results",
  "timing",
  "standings",
  "participants",
  "media",
  "videos",
  "maps",
  "documents",
  "history",
];

const manufacturerEntities: SourceEntityType[] = [
  "manufacturer",
  "team",
  "rider",
  "motorcycle",
  "media",
  "document",
];

const manufacturerContent: SourceContentType[] = [
  "manufacturer-profile",
  "team-profile",
  "rider-profile",
  "motorcycle-profile",
  "media",
  "videos",
  "documents",
];

const manufacturerUpdates: ProductionUpdateType[] = [
  "manufacturer-assignment",
  "team-assignment",
  "motorcycle-assignment",
  "biography",
  "media",
  "videos",
  "documents",
];

const mediaEntities: SourceEntityType[] = ["video", "media", "event", "rider"];
const mediaContent: SourceContentType[] = ["video-metadata", "videos", "media"];
const mediaUpdates: ProductionUpdateType[] = ["videos", "media"];

export const productionSourceRegistry: ProductionSourceRegistryEntry[] = [
  createSource({
    id: "fim-hard-enduro-world-championship",
    displayName: "FIM Hard Enduro World Championship",
    shortDescription:
      "Primary championship authority for calendars, standings, classifications, and official documents.",
    websiteUrl: "https://www.fim-moto.com",
    category: "official-championship",
    priority: "critical",
    entityTypes: ["event", "stage", "result", "season", "standings", "document"],
    contentTypes: ["calendar", "event-metadata", "results", "standings", "documents"],
    updateTypes: ["calendar", "results", "standings", "documents"],
    refreshFrequency: "daily",
    connectorName: "fim-calendar",
    tags: ["championship", "fim", "primary"],
  }),
  createSource({
    id: "official-hard-enduro-world-championship",
    displayName: "Official Hard Enduro World Championship",
    shortDescription:
      "Series-level source for official championship calendar and event context.",
    category: "official-championship",
    priority: "critical",
    entityTypes: ["event", "stage", "season", "standings", "document", "media"],
    contentTypes: ["calendar", "event-metadata", "standings", "documents", "media"],
    updateTypes: ["calendar", "standings", "documents", "media"],
    refreshFrequency: "daily",
    connectorName: "hard-enduro-championship-calendar",
    tags: ["championship", "calendar"],
    notes:
      "Website URL should be attached after manual source review. Registry entry is prepared without external validation.",
  }),
  createSource({
    id: "red-bull-erzbergrodeo",
    displayName: "Red Bull Erzbergrodeo",
    shortDescription:
      "Official event source for Erzbergrodeo calendar, documents, results, timing, media, and maps.",
    websiteUrl: "https://www.redbullerzbergrodeo.com",
    category: "official-event",
    priority: "critical",
    country: "AT",
    timezone: "Europe/Vienna",
    entityTypes: eventEntities,
    contentTypes: eventContent,
    updateTypes: eventUpdates,
    refreshFrequency: "event-week",
    connectorName: "red-bull-erzbergrodeo",
    tags: ["event", "erzbergrodeo", "red-bull"],
  }),
  createSource({
    id: "red-bull-romaniacs",
    displayName: "Red Bull Romaniacs",
    shortDescription:
      "Official event source for Romaniacs multi-day event metadata, documents, media, timing, and results.",
    websiteUrl: "https://www.redbullromaniacs.com",
    category: "official-event",
    priority: "critical",
    country: "RO",
    timezone: "Europe/Bucharest",
    entityTypes: eventEntities,
    contentTypes: eventContent,
    updateTypes: eventUpdates,
    refreshFrequency: "event-week",
    connectorName: "red-bull-romaniacs",
    tags: ["event", "romaniacs", "red-bull"],
  }),
  createSource({
    id: "sea-to-sky",
    displayName: "Sea to Sky",
    officialName: "Sea to Sky Official",
    shortDescription:
      "Official event source for Sea to Sky event metadata, race formats, documents, media, maps, timing, and results.",
    websiteUrl: "https://seatosky.com.tr",
    category: "official-event",
    priority: "high",
    country: "TR",
    timezone: "Europe/Istanbul",
    entityTypes: eventEntities,
    contentTypes: eventContent,
    updateTypes: eventUpdates,
    refreshFrequency: "event-week",
    connectorName: "sea-to-sky",
    tags: ["event", "sea-to-sky"],
  }),
  createSource({
    id: "xross-hard-enduro",
    displayName: "Xross Hard Enduro",
    shortDescription:
      "Official event source for Xross event calendar, documents, media, maps, timing, and results when available.",
    category: "official-event",
    priority: "high",
    entityTypes: eventEntities,
    contentTypes: eventContent,
    updateTypes: eventUpdates,
    refreshFrequency: "event-week",
    connectorName: "xross-hard-enduro",
    tags: ["event", "xross"],
  }),
  createSource({
    id: "abestone-hard-enduro",
    displayName: "Abestone Hard Enduro",
    shortDescription:
      "Official event source for Abestone event metadata, documents, media, maps, timing, and results when available.",
    category: "official-event",
    priority: "high",
    country: "IT",
    timezone: "Europe/Rome",
    entityTypes: eventEntities,
    contentTypes: eventContent,
    updateTypes: eventUpdates,
    refreshFrequency: "event-week",
    connectorName: "abestone-hard-enduro",
    tags: ["event", "abestone"],
  }),
  createSource({
    id: "tennessee-knockout",
    displayName: "Tennessee Knockout",
    shortDescription:
      "Official event source for Tennessee Knockout event metadata, documents, participants, media, timing, and results.",
    websiteUrl: "https://tennesseeknockoutenduro.com",
    category: "official-event",
    priority: "high",
    country: "US",
    timezone: "America/Chicago",
    entityTypes: eventEntities,
    contentTypes: eventContent,
    updateTypes: eventUpdates,
    refreshFrequency: "event-week",
    connectorName: "tennessee-knockout",
    tags: ["event", "tko", "us-hard-enduro"],
  }),
  ...[
    ["ktm-factory-racing", "KTM Factory Racing", "KTM factory racing source."],
    [
      "husqvarna-factory-racing",
      "Husqvarna Factory Racing",
      "Husqvarna factory racing source.",
    ],
    ["sherco-factory-racing", "Sherco Factory Racing", "Sherco factory racing source."],
    ["beta-factory-racing", "Beta Factory Racing", "Beta factory racing source."],
    ["gasgas-factory-racing", "GASGAS Factory Racing", "GASGAS factory racing source."],
    ["rieju-racing", "Rieju Racing", "Rieju racing source."],
    ["tm-racing", "TM Racing", "TM Racing manufacturer and racing source."],
  ].map(([id, displayName, shortDescription]) =>
    createSource({
      id,
      displayName,
      shortDescription,
      category: "official-manufacturer",
      priority: "high",
      entityTypes: manufacturerEntities,
      contentTypes: manufacturerContent,
      updateTypes: manufacturerUpdates,
      refreshFrequency: "monthly",
      connectorName: `${id}-profile`,
      tags: ["manufacturer", "factory-racing"],
    }),
  ),
  createSource({
    id: "red-bull-motorsports",
    displayName: "Red Bull Motorsports",
    shortDescription:
      "Official Red Bull motorsports media source for reviewed video and media metadata.",
    websiteUrl: "https://www.redbull.com/int-en/tags/motorsports",
    category: "official-media",
    priority: "high",
    entityTypes: mediaEntities,
    contentTypes: mediaContent,
    updateTypes: mediaUpdates,
    refreshFrequency: "weekly",
    connectorName: "youtube-media",
    tags: ["media", "red-bull", "youtube"],
  }),
  createSource({
    id: "media-mike-tv",
    displayName: "Media Mike TV",
    shortDescription:
      "Trusted creator source for reviewed Hard Enduro video/media metadata only.",
    category: "trusted-creator",
    priority: "medium",
    entityTypes: mediaEntities,
    contentTypes: mediaContent,
    updateTypes: mediaUpdates,
    refreshFrequency: "weekly",
    connectorName: "youtube-media",
    tags: ["media", "creator"],
  }),
  createSource({
    id: "2pro1slow",
    displayName: "2PRO1SLOW",
    shortDescription:
      "Trusted creator source for reviewed Hard Enduro video/media metadata only.",
    websiteUrl: "https://www.youtube.com/@2PRO1SLOW",
    category: "trusted-creator",
    priority: "medium",
    entityTypes: mediaEntities,
    contentTypes: mediaContent,
    updateTypes: mediaUpdates,
    refreshFrequency: "weekly",
    connectorName: "youtube-media",
    tags: ["media", "creator", "youtube"],
  }),
  ...[
    ["youtube-red-bull-motorsports", "Red Bull Motorsports YouTube"],
    ["youtube-red-bull-romaniacs", "Red Bull Romaniacs YouTube"],
    ["youtube-sea-to-sky", "Sea to Sky Official YouTube"],
    ["youtube-us-hard-enduro", "US Hard Enduro YouTube"],
  ].map(([id, displayName]) =>
    createSource({
      id,
      displayName,
      shortDescription:
        "Official YouTube channel registry entry for reviewed video metadata only.",
      category: "official-media",
      priority: "medium",
      entityTypes: mediaEntities,
      contentTypes: mediaContent,
      updateTypes: mediaUpdates,
      refreshFrequency: "weekly",
      connectorName: "youtube-media",
      tags: ["media", "youtube", "registry-only"],
      notes:
        "Registry only. YouTube API sync is not implemented and this source cannot update official sporting facts.",
    }),
  ),
  ...[
    ["instagram-red-bull-erzbergrodeo", "Red Bull Erzbergrodeo Instagram"],
    ["instagram-red-bull-romaniacs", "Red Bull Romaniacs Instagram"],
    ["instagram-sea-to-sky", "Sea to Sky Instagram"],
    ["instagram-ktm-factory-racing", "KTM Factory Racing Instagram"],
  ].map(([id, displayName]) =>
    createSource({
      id,
      displayName,
      shortDescription:
        "Official Instagram registry entry for reviewed media/social references only.",
      category: "official-social",
      priority: "low",
      entityTypes: ["media", "video", "event", "rider", "team", "manufacturer"],
      contentTypes: ["media", "media-asset", "videos"],
      updateTypes: ["media", "videos"],
      refreshFrequency: "manual",
      connectorName: "social-media",
      enabled: false,
      tags: ["media", "instagram", "registry-only"],
      notes:
        "Registry only. Social media sync is not implemented and cannot update official results, timing, standings, or biographies.",
    }),
  ),
];
