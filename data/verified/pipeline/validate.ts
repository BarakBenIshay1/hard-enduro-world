import { verifiedCoverageMatrix } from "../coverage";
import { getOfficialSource } from "../source-registry";
import type {
  VerifiedEventFact,
  VerifiedOverallResult,
  VerifiedSourceReference,
  VerifiedStageResult,
  VerifiedAllowedDataType,
} from "../types";
import type { NormalizedVerifiedPackage } from "./normalize";

export type VerifiedValidationSeverity = "error" | "warning";

export type VerifiedValidationIssue = {
  severity: VerifiedValidationSeverity;
  code: string;
  message: string;
  entityType: "source" | "event" | "overall-result" | "stage-result" | "package";
  entityKey: string;
};

export type VerifiedValidationReport = {
  valid: boolean;
  errors: VerifiedValidationIssue[];
  warnings: VerifiedValidationIssue[];
};

export function validateVerifiedPackage(
  normalized: NormalizedVerifiedPackage,
): VerifiedValidationReport {
  const issues: VerifiedValidationIssue[] = [];
  const sourceIds = new Set(normalized.sources.map((source) => source.id));

  normalized.sources.forEach((source) => {
    issues.push(...validateSource(source));
  });

  normalized.eventFacts.forEach((eventFact) => {
    issues.push(...validateEventFact(eventFact, sourceIds));
  });

  issues.push(...validateOverallResults(normalized.overallResults, sourceIds));
  issues.push(...validateStageResults(normalized.stageResults, sourceIds));

  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function validateSource(source: VerifiedSourceReference): VerifiedValidationIssue[] {
  const issues: VerifiedValidationIssue[] = [];
  const registrySource = getOfficialSource(source.id);

  if (!source.id || !source.name || !source.url) {
    issues.push({
      severity: "error",
      code: "missing-source-identity",
      message: "Verified source must include id, name, and URL.",
      entityType: "source",
      entityKey: source.id || "unknown-source",
    });
  }

  if (!registrySource) {
    issues.push({
      severity: "error",
      code: "source-not-in-official-registry",
      message: "Verified source id is not configured in the official source registry.",
      entityType: "source",
      entityKey: source.id || "unknown-source",
    });
  }

  if (registrySource && !registrySource.requiresReview) {
    issues.push({
      severity: "error",
      code: "source-must-require-review",
      message: "All source-derived facts must require review.",
      entityType: "source",
      entityKey: source.id,
    });
  }

  if (source.confidence === "low") {
    issues.push({
      severity: "warning",
      code: "low-source-confidence",
      message: "Low-confidence sources require manual verification before use.",
      entityType: "source",
      entityKey: source.id,
    });
  }

  return issues;
}

function validateEventFact(
  eventFact: VerifiedEventFact,
  sourceIds: Set<string>,
): VerifiedValidationIssue[] {
  const issues: VerifiedValidationIssue[] = [];

  if (!eventFact.eventSlug) {
    issues.push({
      severity: "error",
      code: "missing-event-slug",
      message: "Verified event fact is missing an event slug.",
      entityType: "event",
      entityKey: "unknown-event",
    });
  }

  issues.push(
    ...validateSourceReferences(
      eventFact.sourceIds,
      sourceIds,
      "event",
      eventFact.eventSlug,
      "events",
    ),
  );
  issues.push(
    ...validateFutureSeason(eventFact.eventSlug, sourceIds, eventFact.sourceIds),
  );

  return issues;
}

function validateOverallResults(
  results: VerifiedOverallResult[],
  sourceIds: Set<string>,
): VerifiedValidationIssue[] {
  const issues: VerifiedValidationIssue[] = [];
  const eventRiderKeys = new Set<string>();
  const eventPositionKeys = new Set<string>();

  results.forEach((result) => {
    const entityKey = `${result.eventSlug}:${result.riderSlug}`;

    if (!result.eventSlug) {
      issues.push({
        severity: "error",
        code: "missing-event-slug",
        message: "Overall result is missing an event slug.",
        entityType: "overall-result",
        entityKey,
      });
    }

    if (!result.riderSlug) {
      issues.push({
        severity: "error",
        code: "missing-rider-slug",
        message: "Overall result is missing a rider slug.",
        entityType: "overall-result",
        entityKey,
      });
    }

    if (eventRiderKeys.has(entityKey)) {
      issues.push({
        severity: "error",
        code: "duplicate-rider-result",
        message: "Duplicate rider result found for the same event.",
        entityType: "overall-result",
        entityKey,
      });
    }
    eventRiderKeys.add(entityKey);

    if (result.overallPosition !== null) {
      const positionKey = `${result.eventSlug}:P${result.overallPosition}`;
      if (eventPositionKeys.has(positionKey)) {
        issues.push({
          severity: "error",
          code: "duplicate-result-position",
          message: "Duplicate overall result position found for the same event.",
          entityType: "overall-result",
          entityKey: positionKey,
        });
      }
      eventPositionKeys.add(positionKey);
    }

    issues.push(
      ...validateSourceReferences(
        result.sourceIds,
        sourceIds,
        "overall-result",
        entityKey,
        "results",
      ),
    );
    issues.push(...validateFutureSeason(result.eventSlug, sourceIds, result.sourceIds));
  });

  return issues;
}

function validateStageResults(
  results: VerifiedStageResult[],
  sourceIds: Set<string>,
): VerifiedValidationIssue[] {
  const issues: VerifiedValidationIssue[] = [];
  const stageRiderKeys = new Set<string>();

  results.forEach((result) => {
    const entityKey = `${result.eventSlug}:${result.stageSlug}:${result.riderSlug}`;

    if (!result.eventSlug || !result.stageSlug || !result.riderSlug) {
      issues.push({
        severity: "error",
        code: "missing-stage-result-identity",
        message: "Stage result requires event slug, stage slug, and rider slug.",
        entityType: "stage-result",
        entityKey,
      });
    }

    if (stageRiderKeys.has(entityKey)) {
      issues.push({
        severity: "error",
        code: "duplicate-stage-rider-result",
        message: "Duplicate rider stage result found for the same stage.",
        entityType: "stage-result",
        entityKey,
      });
    }
    stageRiderKeys.add(entityKey);

    issues.push(
      ...validateSourceReferences(
        result.sourceIds,
        sourceIds,
        "stage-result",
        entityKey,
        "timing",
      ),
    );
    issues.push(...validateFutureSeason(result.eventSlug, sourceIds, result.sourceIds));
  });

  return issues;
}

function validateSourceReferences(
  referencedSourceIds: string[],
  availableSourceIds: Set<string>,
  entityType: VerifiedValidationIssue["entityType"],
  entityKey: string,
  dataType: VerifiedAllowedDataType,
): VerifiedValidationIssue[] {
  if (referencedSourceIds.length === 0) {
    return [
      {
        severity: "error",
        code: "missing-source-reference",
        message: "Verified data row must reference at least one source.",
        entityType,
        entityKey,
      },
    ];
  }

  return referencedSourceIds.flatMap((sourceId) => {
    const issues: VerifiedValidationIssue[] = [];
    const registrySource = getOfficialSource(sourceId);

    if (!availableSourceIds.has(sourceId)) {
      issues.push({
        severity: "error",
        code: "unknown-source-reference",
        message: `Referenced source '${sourceId}' is not present in the intake package.`,
        entityType,
        entityKey,
      });
    }

    if (!registrySource) {
      issues.push({
        severity: "error",
        code: "source-not-in-official-registry",
        message: `Referenced source '${sourceId}' is not configured in the official source registry.`,
        entityType,
        entityKey,
      });
      return issues;
    }

    if (!registrySource.allowedDataTypes.includes(dataType)) {
      issues.push({
        severity: "error",
        code: "source-not-allowed-for-data-type",
        message: `Source '${sourceId}' is not allowed to provide ${dataType}.`,
        entityType,
        entityKey,
      });
    }

    if (registrySource.trustLevel === "media-only" && dataType !== "media") {
      issues.push({
        severity: "error",
        code: "media-source-cannot-create-official-data",
        message:
          "Trusted media sources may create media references only, not official results, standings, timing, or records.",
        entityType,
        entityKey,
      });
    }

    if (!registrySource.requiresReview) {
      issues.push({
        severity: "error",
        code: "source-derived-facts-require-review",
        message: "All source-derived facts must remain review-required.",
        entityType,
        entityKey,
      });
    }

    return issues;
  });
}

function validateFutureSeason(
  eventSlug: string,
  availableSourceIds: Set<string>,
  referencedSourceIds: string[],
): VerifiedValidationIssue[] {
  const match = eventSlug.match(/-(\d{4})$/);
  const year = match ? Number.parseInt(match[1], 10) : null;

  if (year === null || year < 2027) {
    return [];
  }

  const hasOfficialFutureSource = referencedSourceIds.some((sourceId) => {
    if (!availableSourceIds.has(sourceId)) {
      return false;
    }

    return verifiedCoverageMatrix.some(
      (coverage) => coverage.eventSlug === eventSlug && coverage.status === "scheduled",
    );
  });

  return [
    {
      severity: hasOfficialFutureSource ? "warning" : "error",
      code: "future-season-requires-official-calendar",
      message:
        "2027 or later data is blocked unless explicitly marked as official future calendar metadata.",
      entityType: "package",
      entityKey: eventSlug,
    },
  ];
}
