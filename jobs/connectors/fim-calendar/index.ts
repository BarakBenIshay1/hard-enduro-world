import { compareFimCalendarCandidates } from "./compare";
import { getFimCalendarConfig } from "./config";
import { normalizeFimCalendarItems } from "./normalize";
import { parseFimCalendarItems, parseFimCalendarPayload } from "./parser";
import { buildFimCalendarDryRunReport } from "./report";
import type { FimCalendarDryRunInput, FimCalendarDryRunReport } from "./types";

export async function runFimCalendarDryRun(
  input: FimCalendarDryRunInput,
): Promise<FimCalendarDryRunReport> {
  const { config, errors, warnings } = getFimCalendarConfig({
    sourceId: input.sourceId,
    seasonYear: input.seasonYear,
  });

  if (!config) {
    return {
      summary: {
        sourceId: input.sourceId ?? "fim-hard-enduro-world-championship",
        runMode: "dry-run",
        seasonYear: input.seasonYear ?? 2026,
        totalSourceEvents: 0,
        totalMatchedEvents: 0,
        newCandidates: 0,
        changedCandidates: 0,
        ambiguousCandidates: 0,
        warnings,
        errors,
      },
      metadata: {
        inputCoverageMode: input.coverageMode ?? "partial-season",
        inputSourceType: input.inputSourceType ?? "unknown",
        inputCompletenessWarning:
          "Connector configuration failed before source input could be evaluated.",
      },
      rows: [],
      reviewItems: [],
      source: {
        id: input.sourceId ?? "fim-hard-enduro-world-championship",
        displayName: "Unavailable source",
        priority: "low",
        confidenceLevel: "unknown",
        reviewPolicy: "always-review",
        sourceUrl: null,
      },
    };
  }

  const parsedPayload = input.rawContent
    ? parseFimCalendarPayload(input.rawContent)
    : null;
  const rawItems = input.rawItems ?? parsedPayload?.items ?? [];
  const coverageMode =
    input.coverageMode ?? parsedPayload?.coverageMode ?? "partial-season";
  const inputSourceType =
    input.inputSourceType ??
    parsedPayload?.inputSourceType ??
    (input.rawItems ? "unknown" : "configured-url-fetch-disabled");
  const inputCompletenessWarning =
    coverageMode === "full-season"
      ? null
      : "Input is not marked as full-season. Missing-from-source checks are suppressed for unrelated events.";

  if (!input.rawItems && !input.rawContent) {
    warnings.push(
      "No local source input was provided. Dry-run completed without parsing source events.",
    );
  }

  const parsedItems = parseFimCalendarItems(rawItems);
  const candidates = normalizeFimCalendarItems(parsedItems, config).filter(
    (candidate) => candidate.seasonYear === config.seasonYear,
  );
  const rows = compareFimCalendarCandidates({
    candidates,
    currentEvents: input.currentEvents.filter(
      (event) => event.seasonYear === config.seasonYear,
    ),
    coverageMode,
    selectedEventSlug: input.selectedEventSlug,
  });

  return buildFimCalendarDryRunReport({
    config,
    rows,
    warnings,
    errors,
    inputCoverageMode: coverageMode,
    inputSourceType,
    inputCompletenessWarning,
  });
}

export * from "./compare";
export * from "./config";
export * from "./normalize";
export * from "./parser";
export * from "./report";
export * from "./types";
