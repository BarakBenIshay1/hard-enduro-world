import type { VerifiedIntakeResultStatus } from "../../pipeline/intake";

export type ParsedHtmlSourceReference = {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  publishedDate: string | null;
  notes: string;
};

export type ParsedHtmlEventMetadata = {
  eventSlug: string | null;
  displayName: string | null;
  previousWinner: string | null;
  verifiedWinner: string | null;
  verifiedFinisherCount: number | null;
  factsNote: string | null;
  sourceIds: string[];
};

export type ParsedHtmlRiderMetadata = {
  riderSlug: string | null;
  sourceIds: string[];
  notes: string | null;
};

export type ParsedHtmlOverallResult = {
  eventSlug: string | null;
  riderSlug: string | null;
  className: string | null;
  overallPosition: number | null;
  classPosition: number | null;
  points: number | null;
  totalTimeText: string | null;
  gapToLeaderText: string | null;
  gapToPreviousText: string | null;
  penaltiesText: string | null;
  status: VerifiedIntakeResultStatus | null;
  sourceIds: string[];
  notes: string | null;
};

export type ParsedHtmlStageResult = ParsedHtmlOverallResult & {
  stageSlug: string | null;
};

export type ParsedHtmlStanding = {
  season: number | null;
  riderSlug: string | null;
  position: number | null;
  points: number | null;
  wins: number | null;
  podiums: number | null;
  sourceIds: string[];
  notes: string | null;
};

export type ParsedHtmlDocument = {
  title: string | null;
  url: string | null;
  documentType: "regulations" | "entry-list" | "results" | "timing" | "other";
  publishedAt: string | null;
  relatedEventSlug: string | null;
  sourceIds: string[];
  notes: string | null;
};

export type ParsedHtmlMediaReference = {
  title: string | null;
  url: string | null;
  publishedAt: string | null;
  relatedEventSlug: string | null;
  relatedRiderSlug: string | null;
  sourceIds: string[];
  notes: string | null;
};

export type ParsedOfficialHtmlDocument = {
  sourceId: string;
  canonicalUrl: string;
  receivedAt: string;
  sourceReferences: ParsedHtmlSourceReference[];
  eventMetadata: ParsedHtmlEventMetadata[];
  riderMetadata: ParsedHtmlRiderMetadata[];
  overallResults: ParsedHtmlOverallResult[];
  stageResults: ParsedHtmlStageResult[];
  standings: ParsedHtmlStanding[];
  documents: ParsedHtmlDocument[];
  mediaReferences: ParsedHtmlMediaReference[];
  notes: string;
};

export function createEmptyParsedOfficialHtmlDocument(
  sourceId: string,
  canonicalUrl: string,
): ParsedOfficialHtmlDocument {
  return {
    sourceId,
    canonicalUrl,
    receivedAt: new Date().toISOString(),
    sourceReferences: [],
    eventMetadata: [],
    riderMetadata: [],
    overallResults: [],
    stageResults: [],
    standings: [],
    documents: [],
    mediaReferences: [],
    notes:
      "Empty official HTML document model. No fetching, scraping, or browser automation was performed.",
  };
}
