import { getVerifiedCoverageSummary } from "../coverage";
import type { VerifiedCoverageSummary } from "../types";
import type { VerifiedIntakePackage } from "./intake";
import { normalizeVerifiedIntake, type NormalizedVerifiedPackage } from "./normalize";
import { buildVerifiedReviewPackage, type VerifiedReviewPackage } from "./review";
import { validateVerifiedPackage, type VerifiedValidationReport } from "./validate";

export type VerifiedPipelineSummary = {
  packageId: string;
  normalized: NormalizedVerifiedPackage;
  validation: VerifiedValidationReport;
  review: VerifiedReviewPackage;
  coverage: VerifiedCoverageSummary;
  counts: {
    sources: number;
    eventFacts: number;
    riderEntries: number;
    overallResults: number;
    stageResults: number;
    errors: number;
    warnings: number;
    reviewItems: number;
  };
};

export function summarizeVerifiedIntake(
  intake: VerifiedIntakePackage,
): VerifiedPipelineSummary {
  const normalized = normalizeVerifiedIntake(intake);
  const validation = validateVerifiedPackage(normalized);
  const review = buildVerifiedReviewPackage(normalized, validation);

  return {
    packageId: intake.packageId,
    normalized,
    validation,
    review,
    coverage: getVerifiedCoverageSummary(),
    counts: {
      sources: normalized.sources.length,
      eventFacts: normalized.eventFacts.length,
      riderEntries: normalized.riderEntries.length,
      overallResults: normalized.overallResults.length,
      stageResults: normalized.stageResults.length,
      errors: validation.errors.length,
      warnings: validation.warnings.length,
      reviewItems:
        review.wouldAdd.length +
        review.wouldUpdate.length +
        review.missing.length +
        review.needsManualVerification.length,
    },
  };
}
