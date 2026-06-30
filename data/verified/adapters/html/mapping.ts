import type {
  ParsedDocumentReference,
  ParsedMediaReference,
  ParsedStandingsRow,
} from "../base";
import type {
  VerifiedEventFact,
  VerifiedOverallResult,
  VerifiedRiderEntry,
  VerifiedSourceReference,
  VerifiedStageResult,
} from "../../types";
import type {
  ParsedHtmlDocument,
  ParsedHtmlEventMetadata,
  ParsedHtmlMediaReference,
  ParsedHtmlOverallResult,
  ParsedHtmlRiderMetadata,
  ParsedHtmlSourceReference,
  ParsedHtmlStageResult,
  ParsedHtmlStanding,
} from "./parser";

export function mapHtmlSourceReference(
  source: ParsedHtmlSourceReference,
): VerifiedSourceReference {
  return {
    id: source.sourceId,
    name: source.sourceName,
    url: source.sourceUrl,
    sourceType: "official_website",
    publishedDate: source.publishedDate,
    confidence: "official",
    notes: source.notes,
  };
}

export function mapHtmlEventMetadata(
  event: ParsedHtmlEventMetadata,
): VerifiedEventFact | null {
  if (!event.eventSlug) {
    return null;
  }

  return {
    eventSlug: event.eventSlug,
    displayName: event.displayName,
    previousWinner: event.previousWinner,
    verifiedWinner: event.verifiedWinner,
    verifiedFinisherCount: event.verifiedFinisherCount,
    factsNote: event.factsNote ?? "Official HTML event metadata requires review.",
    sourceIds: event.sourceIds,
  };
}

export function mapHtmlRiderMetadata(
  rider: ParsedHtmlRiderMetadata,
): VerifiedRiderEntry | null {
  if (!rider.riderSlug) {
    return null;
  }

  return {
    riderSlug: rider.riderSlug,
    sourceIds: rider.sourceIds,
    notes: rider.notes ?? "Official HTML rider metadata requires review.",
  };
}

export function mapHtmlOverallResult(
  result: ParsedHtmlOverallResult,
): VerifiedOverallResult | null {
  if (!result.eventSlug || !result.riderSlug) {
    return null;
  }

  return {
    eventSlug: result.eventSlug,
    riderSlug: result.riderSlug,
    className: result.className,
    overallPosition: result.overallPosition,
    classPosition: result.classPosition,
    points: result.points,
    totalTimeMs: null,
    totalTimeText: result.totalTimeText,
    gapToLeaderMs: null,
    gapToLeaderText: result.gapToLeaderText,
    gapToPreviousMs: null,
    gapToPreviousText: result.gapToPreviousText,
    penaltiesMs: null,
    bonusTimeMs: null,
    checkpointsCompleted: null,
    averageSpeedKmh: null,
    status: result.status ?? "UNKNOWN",
    sourceIds: result.sourceIds,
    notes: result.notes ?? "Official HTML overall result requires review.",
  };
}

export function mapHtmlStageResult(
  result: ParsedHtmlStageResult,
): VerifiedStageResult | null {
  const overall = mapHtmlOverallResult(result);

  if (!overall || !result.stageSlug) {
    return null;
  }

  return {
    ...overall,
    stageSlug: result.stageSlug,
    checkpointsCompleted: null,
    penaltiesText: result.penaltiesText,
    bonusTimeText: null,
  };
}

export function mapHtmlStanding(row: ParsedHtmlStanding): ParsedStandingsRow | null {
  if (!row.season || !row.riderSlug) {
    return null;
  }

  return {
    season: row.season,
    riderSlug: row.riderSlug,
    position: row.position,
    points: row.points,
    wins: row.wins,
    podiums: row.podiums,
    sourceIds: row.sourceIds,
    notes: row.notes ?? "Official HTML standings row requires review.",
  };
}

export function mapHtmlDocument(
  document: ParsedHtmlDocument,
): ParsedDocumentReference | null {
  if (!document.title || !document.url) {
    return null;
  }

  return {
    sourceIds: document.sourceIds,
    title: document.title,
    url: document.url,
    documentType: document.documentType,
    publishedAt: document.publishedAt,
    relatedEventSlug: document.relatedEventSlug,
    notes: document.notes ?? "Official HTML document reference requires review.",
  };
}

export function mapHtmlMediaReference(
  media: ParsedHtmlMediaReference,
): ParsedMediaReference | null {
  if (!media.title || !media.url) {
    return null;
  }

  return {
    sourceIds: media.sourceIds,
    title: media.title,
    url: media.url,
    publishedAt: media.publishedAt,
    relatedEventSlug: media.relatedEventSlug,
    relatedRiderSlug: media.relatedRiderSlug,
    notes: media.notes ?? "Official HTML media reference requires review.",
  };
}
