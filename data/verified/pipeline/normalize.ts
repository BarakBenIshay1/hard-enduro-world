import type {
  VerifiedEventFact,
  VerifiedOverallResult,
  VerifiedRiderEntry,
  VerifiedSourceReference,
  VerifiedStageResult,
} from "../types";
import type {
  VerifiedIntakeEventFact,
  VerifiedIntakeOverallResult,
  VerifiedIntakePackage,
  VerifiedIntakeRiderReference,
  VerifiedIntakeSource,
  VerifiedIntakeStageResult,
} from "./intake";

export type NormalizedVerifiedPackage = {
  packageId: string;
  sources: VerifiedSourceReference[];
  eventFacts: VerifiedEventFact[];
  riderEntries: VerifiedRiderEntry[];
  overallResults: VerifiedOverallResult[];
  stageResults: VerifiedStageResult[];
  notes: string;
};

export function normalizeVerifiedIntake(
  intake: VerifiedIntakePackage,
): NormalizedVerifiedPackage {
  return {
    packageId: intake.packageId,
    sources: intake.sources.map(normalizeSource),
    eventFacts: intake.eventFacts.map(normalizeEventFact),
    riderEntries: intake.riderReferences.map(normalizeRiderEntry),
    overallResults: intake.overallResults.map(normalizeOverallResult),
    stageResults: intake.stageResults.map(normalizeStageResult),
    notes: intake.notes,
  };
}

function normalizeSource(source: VerifiedIntakeSource): VerifiedSourceReference {
  return {
    id: source.id,
    name: source.name,
    url: source.url,
    sourceType:
      source.sourceType === "csv-timing-export"
        ? "timing_system"
        : source.sourceType === "manual-verified-note"
          ? "manual_verified"
          : source.sourceType === "official-pdf-metadata"
            ? "document"
            : "official_website",
    publishedDate: source.publishedDate ?? null,
    confidence: source.confidence,
    notes: source.notes,
  };
}

function normalizeEventFact(fact: VerifiedIntakeEventFact): VerifiedEventFact {
  return {
    eventSlug: fact.eventSlug,
    displayName: fact.displayName ?? null,
    previousWinner: fact.previousWinner ?? null,
    verifiedWinner: fact.verifiedWinner ?? null,
    verifiedFinisherCount: fact.verifiedFinisherCount ?? null,
    factsNote: fact.factsNote ?? "Verified event fact requires manual note.",
    sourceIds: fact.sourceIds,
  };
}

function normalizeRiderEntry(
  reference: VerifiedIntakeRiderReference,
): VerifiedRiderEntry {
  return {
    riderSlug: reference.riderSlug,
    sourceIds: reference.sourceIds,
    notes: reference.notes ?? "Verified rider reference requires manual note.",
  };
}

function normalizeOverallResult(
  result: VerifiedIntakeOverallResult,
): VerifiedOverallResult {
  return {
    eventSlug: result.eventSlug,
    riderSlug: result.riderSlug,
    className: result.className ?? null,
    overallPosition: result.overallPosition ?? null,
    classPosition: result.classPosition ?? null,
    points: result.points ?? null,
    totalTimeMs: result.totalTimeMs ?? null,
    totalTimeText: result.totalTimeText ?? null,
    gapToLeaderMs: result.gapToLeaderMs ?? null,
    gapToLeaderText: result.gapToLeaderText ?? null,
    gapToPreviousMs: result.gapToPreviousMs ?? null,
    gapToPreviousText: result.gapToPreviousText ?? null,
    penaltiesMs: result.penaltiesMs ?? null,
    bonusTimeMs: result.bonusTimeMs ?? null,
    checkpointsCompleted: result.checkpointsCompleted ?? null,
    averageSpeedKmh: result.averageSpeedKmh ?? null,
    status: result.status ?? "UNKNOWN",
    sourceIds: result.sourceIds,
    notes: result.notes ?? "Verified overall result requires manual note.",
  };
}

function normalizeStageResult(result: VerifiedIntakeStageResult): VerifiedStageResult {
  const overall = normalizeOverallResult(result);

  return {
    ...overall,
    stageSlug: result.stageSlug,
    checkpointsCompleted: result.checkpointsCompleted ?? null,
    penaltiesText: result.penaltiesText ?? null,
    bonusTimeText: result.bonusTimeText ?? null,
  };
}
