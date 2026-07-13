import { compareFimCalendarCandidates } from "./compare";
import { getFimCalendarConfig } from "./config";
import { normalizeFimCalendarItems } from "./normalize";
import { parseFimCalendarItems, parseFimCalendarPayload } from "./parser";
import { buildFimCalendarDryRunReport } from "./report";
import type {
  FimCalendarDryRunInput,
  FimCalendarDryRunReport,
  FimCalendarInputDiagnostics,
} from "./types";

export async function runFimCalendarDryRun(
  input: FimCalendarDryRunInput,
): Promise<FimCalendarDryRunReport> {
  const { config, errors, warnings } = getFimCalendarConfig({
    sourceId: input.sourceId,
    seasonYear: input.seasonYear,
  });
  warnings.push(...(input.inputWarnings ?? []));

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
        diagnostics: createInputDiagnostics(input.inputDiagnostics),
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
  const diagnostics = createInputDiagnostics({
    ...input.inputDiagnostics,
    ...(parsedPayload?.diagnostics ?? {}),
    usableEventsParsed: 0,
  });

  if (!input.rawItems && !input.rawContent) {
    warnings.push(
      "No local source input was provided. Dry-run completed without parsing source events.",
    );
  }

  const parsedItems = parseFimCalendarItems(rawItems);
  const candidates = normalizeFimCalendarItems(parsedItems, config).filter(
    (candidate) => candidate.seasonYear === config.seasonYear,
  );
  diagnostics.usableEventsParsed = candidates.length;
  diagnostics.recordsRejected =
    diagnostics.rawRecordsDetected > 0
      ? Math.max(diagnostics.rawRecordsDetected - candidates.length, 0)
      : diagnostics.recordsRejected;
  warnings.push(
    ...detectSuspiciousInput({
      inputSourceType,
      coverageMode,
      rawItemCount: rawItems.length,
      parsedItemCount: parsedItems.length,
      candidateCount: candidates.length,
    }),
  );
  if (inputSourceType === "official-fetch" && candidates.length === 0) {
    errors.push(
      "Official fetch returned zero usable events for the requested season. Dry-run is incomplete and must fail closed.",
    );
    diagnostics.fetchStatus = "official-fetch-incomplete";
  }
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
    diagnostics,
  });
}

export * from "./compare";
export * from "./config";
export * from "./fetcher";
export * from "./normalize";
export * from "./parser";
export * from "./report";
export * from "./types";

function detectSuspiciousInput({
  inputSourceType,
  coverageMode,
  rawItemCount,
  parsedItemCount,
  candidateCount,
}: {
  inputSourceType: FimCalendarDryRunInput["inputSourceType"];
  coverageMode: NonNullable<FimCalendarDryRunInput["coverageMode"]>;
  rawItemCount: number;
  parsedItemCount: number;
  candidateCount: number;
}) {
  if (inputSourceType !== "official-fetch") return [];

  const warnings: string[] = [];

  if (rawItemCount === 0 || parsedItemCount === 0 || candidateCount === 0) {
    warnings.push(
      "Official fetch completed, but no usable calendar events were parsed. Treat this report as incomplete.",
    );
  }

  if (coverageMode === "full-season" && candidateCount > 0 && candidateCount < 3) {
    warnings.push(
      "Official fetch returned fewer than three full-season event candidates. Missing-from-source conclusions require manual review.",
    );
  }

  return warnings;
}

function createInputDiagnostics(
  overrides: Partial<FimCalendarInputDiagnostics> | undefined,
): FimCalendarInputDiagnostics {
  return {
    requestedOfficialUrl: null,
    finalResponseUrl: null,
    httpStatus: null,
    contentType: null,
    responseSizeBytes: null,
    parserSelected: "unknown",
    rawRecordsDetected: 0,
    usableEventsParsed: 0,
    recordsRejected: 0,
    rejectionReasons: [],
    fallbackUsed: false,
    fetchStatus: "local-input",
    ...overrides,
  };
}
