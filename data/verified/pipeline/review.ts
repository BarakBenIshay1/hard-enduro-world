import type { VerifiedCoverageConfidence } from "../types";
import type { NormalizedVerifiedPackage } from "./normalize";
import type { VerifiedValidationReport } from "./validate";

export type VerifiedReviewChangeType =
  | "add-source"
  | "add-event-fact"
  | "add-rider-reference"
  | "add-overall-result"
  | "add-stage-result";

export type VerifiedReviewItem = {
  id: string;
  changeType: VerifiedReviewChangeType;
  action: "would-add" | "would-update" | "missing" | "needs-manual-verification";
  entityKey: string;
  sourceConfidence: VerifiedCoverageConfidence | "official" | "high" | "medium" | "low";
  notes: string;
  payload: unknown;
};

export type VerifiedReviewPackage = {
  packageId: string;
  valid: boolean;
  wouldAdd: VerifiedReviewItem[];
  wouldUpdate: VerifiedReviewItem[];
  missing: VerifiedReviewItem[];
  needsManualVerification: VerifiedReviewItem[];
  errors: VerifiedValidationReport["errors"];
  warnings: VerifiedValidationReport["warnings"];
};

export function buildVerifiedReviewPackage(
  normalized: NormalizedVerifiedPackage,
  validation: VerifiedValidationReport,
): VerifiedReviewPackage {
  const reviewItems: VerifiedReviewItem[] = [
    ...normalized.sources.map(
      (source): VerifiedReviewItem => ({
        id: `source:${source.id}`,
        changeType: "add-source",
        action: "would-add",
        entityKey: source.id,
        sourceConfidence: source.confidence,
        notes: source.notes,
        payload: source,
      }),
    ),
    ...normalized.eventFacts.map(
      (eventFact): VerifiedReviewItem => ({
        id: `event:${eventFact.eventSlug}`,
        changeType: "add-event-fact",
        action: "would-add",
        entityKey: eventFact.eventSlug,
        sourceConfidence: "partial",
        notes: eventFact.factsNote,
        payload: eventFact,
      }),
    ),
    ...normalized.riderEntries.map(
      (rider): VerifiedReviewItem => ({
        id: `rider:${rider.riderSlug}`,
        changeType: "add-rider-reference",
        action: "would-add",
        entityKey: rider.riderSlug,
        sourceConfidence: "partial",
        notes: rider.notes,
        payload: rider,
      }),
    ),
    ...normalized.overallResults.map(
      (result): VerifiedReviewItem => ({
        id: `overall:${result.eventSlug}:${result.riderSlug}`,
        changeType: "add-overall-result",
        action: "would-add",
        entityKey: `${result.eventSlug}:${result.riderSlug}`,
        sourceConfidence: "partial",
        notes: result.notes,
        payload: result,
      }),
    ),
    ...normalized.stageResults.map(
      (result): VerifiedReviewItem => ({
        id: `stage:${result.eventSlug}:${result.stageSlug}:${result.riderSlug}`,
        changeType: "add-stage-result",
        action: "would-add",
        entityKey: `${result.eventSlug}:${result.stageSlug}:${result.riderSlug}`,
        sourceConfidence: "partial",
        notes: result.notes,
        payload: result,
      }),
    ),
  ];

  const needsManualVerification = reviewItems.filter(
    (item) =>
      item.sourceConfidence === "low" ||
      item.notes.toLowerCase().includes("requires manual"),
  );

  return {
    packageId: normalized.packageId,
    valid: validation.valid,
    wouldAdd: reviewItems,
    wouldUpdate: [],
    missing: validation.errors.map(
      (error): VerifiedReviewItem => ({
        id: `missing:${error.code}:${error.entityKey}`,
        changeType: "add-source",
        action: "missing",
        entityKey: error.entityKey,
        sourceConfidence: "source-needed",
        notes: error.message,
        payload: error,
      }),
    ),
    needsManualVerification,
    errors: validation.errors,
    warnings: validation.warnings,
  };
}
