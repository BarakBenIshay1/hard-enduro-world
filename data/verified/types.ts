export type VerifiedConfidence = "official" | "high" | "medium" | "low";

export type VerifiedCoverageConfidence =
  | "verified"
  | "source-needed"
  | "partial"
  | "scheduled";

export type VerifiedCoverageStatus = "completed" | "scheduled" | "live";

export type VerifiedSourceReference = {
  id: string;
  name: string;
  url: string;
  sourceType: "official_website" | "timing_system" | "manual_verified" | "document";
  publishedDate: string | null;
  confidence: VerifiedConfidence;
  notes: string;
};

export type VerifiedEventFact = {
  eventSlug: string;
  displayName: string | null;
  previousWinner: string | null;
  verifiedWinner: string | null;
  verifiedFinisherCount: number | null;
  factsNote: string;
  sourceIds: string[];
};

export type VerifiedRiderEntry = {
  riderSlug: string;
  sourceIds: string[];
  notes: string;
};

export type VerifiedOverallResult = {
  eventSlug: string;
  riderSlug: string;
  className: string | null;
  overallPosition: number | null;
  classPosition: number | null;
  points: number | null;
  totalTimeMs: number | null;
  totalTimeText: string | null;
  gapToLeaderMs: number | null;
  gapToLeaderText: string | null;
  gapToPreviousMs: number | null;
  gapToPreviousText: string | null;
  penaltiesMs: number | null;
  bonusTimeMs: number | null;
  checkpointsCompleted: number | null;
  averageSpeedKmh: number | null;
  status: "FINISHED" | "DNF" | "DNS" | "DSQ" | "UNKNOWN";
  sourceIds: string[];
  notes: string;
};

export type VerifiedStageResult = {
  eventSlug: string;
  stageSlug: string;
  riderSlug: string;
  className: string | null;
  overallPosition: number | null;
  classPosition: number | null;
  totalTimeMs: number | null;
  totalTimeText: string | null;
  gapToLeaderMs: number | null;
  gapToLeaderText: string | null;
  gapToPreviousMs: number | null;
  gapToPreviousText: string | null;
  checkpointsCompleted: number | null;
  penaltiesMs: number | null;
  penaltiesText: string | null;
  bonusTimeMs: number | null;
  bonusTimeText: string | null;
  averageSpeedKmh: number | null;
  status: "FINISHED" | "DNF" | "DNS" | "DSQ" | "UNKNOWN";
  sourceIds: string[];
  notes: string;
};

export type VerifiedEventCoverage = {
  season: 2022 | 2023 | 2024 | 2025 | 2026;
  eventSlug: string;
  eventName: string;
  country: string;
  status: VerifiedCoverageStatus;
  hasEventMetadata: boolean;
  hasOverallResults: boolean;
  hasStageResults: boolean;
  hasStandingsImpact: boolean;
  hasSourceLinks: boolean;
  confidence: VerifiedCoverageConfidence;
  neededResultTypes: Array<
    | "overall-results"
    | "stage-results"
    | "standings"
    | "finishers"
    | "dns-dnf-dsq"
    | "points"
  >;
  requiredSources: string[];
  priority: number;
  notes: string;
};

export type VerifiedCoverageSummary = {
  totalTargetSeasons: number;
  totalTargetEvents: number;
  verifiedEvents: number;
  missingOverallResults: number;
  missingStageResults: number;
  missingSourceLinks: number;
};
