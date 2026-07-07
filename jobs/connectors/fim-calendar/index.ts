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

  const rawItems =
    input.rawItems ?? (input.rawContent ? parseFimCalendarPayload(input.rawContent) : []);

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
  });

  return buildFimCalendarDryRunReport({
    config,
    rows,
    warnings,
    errors,
  });
}

export * from "./compare";
export * from "./config";
export * from "./normalize";
export * from "./parser";
export * from "./report";
export * from "./types";
