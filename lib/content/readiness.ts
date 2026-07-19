export type ContentReadinessStatus = "complete" | "warning" | "blocked";

export type ContentReadinessDimension =
  | "DATA_COMPLETE"
  | "MEDIA_COMPLETE"
  | "SOURCES_COMPLETE"
  | "RIGHTS_COMPLETE"
  | "PUBLICATION_READY";

export type ContentReadinessItem = {
  dimension: ContentReadinessDimension;
  status: ContentReadinessStatus;
  label: string;
  missing: string[];
  warnings: string[];
};

export type EventContentReadinessInput = {
  name: string | null;
  slug: string | null;
  seasonId: string | null;
  countryId: string | null;
  roundNumber: number | null;
  city: string | null;
  venue: string | null;
  startDate: Date | null;
  endDate: Date | null;
  officialUrl: string | null;
  organizer: string | null;
  description: string | null;
  heroImage: string | null;
  galleryImages: string[];
  visibility: "PUBLIC" | "DRAFT" | "PRIVATE";
  archivedAt: Date | null;
  sourceLinkCount: number;
  mediaItems: Array<{
    type: string;
    title: string | null;
    url: string;
    copyrightOwner: string | null;
    license: string | null;
    source: string | null;
  }>;
};

export function getEventContentReadiness(input: EventContentReadinessInput) {
  const data = getDataCompleteness(input);
  const media = getMediaCompleteness(input);
  const sources = getSourcesCompleteness(input);
  const rights = getRightsCompleteness(input);
  const publicationBlockers = [
    input.archivedAt ? "Archived events cannot be public-ready." : null,
    input.visibility !== "PUBLIC" ? "Visibility is not PUBLIC." : null,
    ...data.missing,
    ...media.missing,
    ...sources.missing,
    ...rights.missing,
  ].filter((item): item is string => Boolean(item));

  const publication: ContentReadinessItem = {
    dimension: "PUBLICATION_READY",
    label: "Publication Ready",
    status: publicationBlockers.length ? "blocked" : "complete",
    missing: publicationBlockers,
    warnings: [
      ...data.warnings,
      ...media.warnings,
      ...sources.warnings,
      ...rights.warnings,
    ],
  };

  const dimensions = [data, media, sources, rights, publication];

  return {
    dimensions,
    publicationReady: publication.status === "complete",
    blockerCount: dimensions.reduce((sum, item) => sum + item.missing.length, 0),
    warningCount: dimensions.reduce((sum, item) => sum + item.warnings.length, 0),
  };
}

function getDataCompleteness(input: EventContentReadinessInput): ContentReadinessItem {
  const missing = [
    !input.name ? "Official name is missing." : null,
    !input.slug ? "Slug is missing." : null,
    !input.seasonId ? "Season is missing." : null,
    !input.countryId ? "Country is missing." : null,
    input.roundNumber === null ? "Championship round is missing." : null,
    !input.city && !input.venue ? "City or venue is missing." : null,
    !input.startDate ? "Start date is missing." : null,
    !input.endDate ? "End date is missing." : null,
    !input.officialUrl ? "Official URL is missing." : null,
    !input.description ? "Description is missing." : null,
  ].filter((item): item is string => Boolean(item));

  const warnings = [!input.organizer ? "Organizer is not set." : null].filter(
    (item): item is string => Boolean(item),
  );

  return buildItem("DATA_COMPLETE", "Data Complete", missing, warnings);
}

function getMediaCompleteness(input: EventContentReadinessInput): ContentReadinessItem {
  const hasHero = Boolean(input.heroImage);
  const hasGallery = input.galleryImages.length > 0 || hasMediaType(input, "IMAGE");
  const missing = [
    !hasHero ? "Hero image is missing." : null,
    !hasGallery ? "Gallery image or linked image media is missing." : null,
  ].filter((item): item is string => Boolean(item));

  const warnings = [
    !hasMediaType(input, "VIDEO") && !hasMediaType(input, "YOUTUBE")
      ? "Video reference is not attached."
      : null,
  ].filter((item): item is string => Boolean(item));

  return buildItem("MEDIA_COMPLETE", "Media Complete", missing, warnings);
}

function getSourcesCompleteness(input: EventContentReadinessInput): ContentReadinessItem {
  const missing = [
    input.sourceLinkCount < 1 ? "At least one SourceLink is required." : null,
  ].filter((item): item is string => Boolean(item));

  return buildItem("SOURCES_COMPLETE", "Sources Complete", missing, []);
}

function getRightsCompleteness(input: EventContentReadinessInput): ContentReadinessItem {
  const mediaWithoutRights = input.mediaItems.filter(
    (item) => !item.copyrightOwner && !item.license,
  );
  const mediaWithoutSource = input.mediaItems.filter((item) => !item.source);
  const missing = [
    input.heroImage && input.mediaItems.length === 0
      ? "Hero image URL has no MediaItem rights record."
      : null,
    mediaWithoutRights.length
      ? `${mediaWithoutRights.length} media item(s) are missing rights metadata.`
      : null,
  ].filter((item): item is string => Boolean(item));
  const warnings = [
    mediaWithoutSource.length
      ? `${mediaWithoutSource.length} media item(s) are missing source attribution.`
      : null,
  ].filter((item): item is string => Boolean(item));

  return buildItem("RIGHTS_COMPLETE", "Rights Complete", missing, warnings);
}

function hasMediaType(input: EventContentReadinessInput, type: string) {
  return input.mediaItems.some((item) => item.type === type);
}

function buildItem(
  dimension: ContentReadinessDimension,
  label: string,
  missing: string[],
  warnings: string[],
): ContentReadinessItem {
  return {
    dimension,
    label,
    status: missing.length ? "blocked" : warnings.length ? "warning" : "complete",
    missing,
    warnings,
  };
}
