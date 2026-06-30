import type { VerifiedConfidence } from "../types";

export type VerifiedIntakeSourceType =
  | "official-html"
  | "official-pdf-metadata"
  | "csv-timing-export"
  | "manual-verified-note";

export type VerifiedIntakeResultStatus = "FINISHED" | "DNF" | "DNS" | "DSQ" | "UNKNOWN";

export type VerifiedIntakeSource = {
  id: string;
  name: string;
  url: string;
  sourceType: VerifiedIntakeSourceType;
  publishedDate: string | null;
  confidence: VerifiedConfidence;
  notes: string;
};

export type VerifiedIntakeEventFact = {
  eventSlug: string;
  displayName?: string | null;
  previousWinner?: string | null;
  verifiedWinner?: string | null;
  verifiedFinisherCount?: number | null;
  factsNote?: string | null;
  sourceIds: string[];
};

export type VerifiedIntakeRiderReference = {
  riderSlug: string;
  sourceIds: string[];
  notes?: string | null;
};

export type VerifiedIntakeOverallResult = {
  eventSlug: string;
  riderSlug: string;
  className?: string | null;
  overallPosition?: number | null;
  classPosition?: number | null;
  points?: number | null;
  totalTimeMs?: number | null;
  totalTimeText?: string | null;
  gapToLeaderMs?: number | null;
  gapToLeaderText?: string | null;
  gapToPreviousMs?: number | null;
  gapToPreviousText?: string | null;
  penaltiesMs?: number | null;
  bonusTimeMs?: number | null;
  checkpointsCompleted?: number | null;
  averageSpeedKmh?: number | null;
  status?: VerifiedIntakeResultStatus | null;
  sourceIds: string[];
  notes?: string | null;
};

export type VerifiedIntakeStageResult = VerifiedIntakeOverallResult & {
  stageSlug: string;
  penaltiesText?: string | null;
  bonusTimeText?: string | null;
};

export type VerifiedIntakePackage = {
  packageId: string;
  sourceType: VerifiedIntakeSourceType;
  receivedAt: string;
  season: number | null;
  sources: VerifiedIntakeSource[];
  eventFacts: VerifiedIntakeEventFact[];
  riderReferences: VerifiedIntakeRiderReference[];
  overallResults: VerifiedIntakeOverallResult[];
  stageResults: VerifiedIntakeStageResult[];
  notes: string;
};

export function createEmptyVerifiedIntakePackage(
  packageId: string,
  sourceType: VerifiedIntakeSourceType,
): VerifiedIntakePackage {
  return {
    packageId,
    sourceType,
    receivedAt: new Date().toISOString(),
    season: null,
    sources: [],
    eventFacts: [],
    riderReferences: [],
    overallResults: [],
    stageResults: [],
    notes: "Empty verified intake package. No external source was fetched.",
  };
}
