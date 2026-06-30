import { getOfficialSource } from "../../source-registry";
import type { AdapterValidationIssue, AdapterValidationResult } from "../base";
import type { ParsedOfficialHtmlDocument } from "./parser";

export function validateParsedOfficialHtmlDocument(
  document: ParsedOfficialHtmlDocument,
): AdapterValidationResult {
  const issues: AdapterValidationIssue[] = [];

  if (!document.sourceId || !getOfficialSource(document.sourceId)) {
    issues.push({
      severity: "error",
      code: "html-source-not-registered",
      message: "HTML adapter input must reference a registered official source id.",
    });
  }

  const availableSourceIds = new Set([
    document.sourceId,
    ...document.sourceReferences.map((source) => source.sourceId),
  ]);

  document.eventMetadata.forEach((event) => {
    if (!event.eventSlug) {
      issues.push({
        severity: "error",
        code: "html-event-missing-id",
        message: "Parsed HTML event metadata is missing event id/slug.",
      });
    }
    pushSourceIssues(issues, event.sourceIds, availableSourceIds);
    pushFutureSeasonIssues(issues, event.eventSlug);
  });

  validateResultRows(issues, document.overallResults, availableSourceIds, "overall");
  validateResultRows(issues, document.stageResults, availableSourceIds, "stage");

  document.riderMetadata.forEach((rider) => {
    pushSourceIssues(issues, rider.sourceIds, availableSourceIds);
  });
  document.standings.forEach((standing) => {
    pushSourceIssues(issues, standing.sourceIds, availableSourceIds);
    if (!standing.season || !standing.riderSlug) {
      issues.push({
        severity: "error",
        code: "html-standing-missing-identity",
        message: "Parsed HTML standings row requires season and rider slug.",
      });
    }
  });
  document.documents.forEach((documentReference) => {
    pushSourceIssues(issues, documentReference.sourceIds, availableSourceIds);
  });
  document.mediaReferences.forEach((media) => {
    pushSourceIssues(issues, media.sourceIds, availableSourceIds);
  });

  return {
    valid: !issues.some((issue) => issue.severity === "error"),
    warnings: issues.filter((issue) => issue.severity === "warning"),
    errors: issues.filter((issue) => issue.severity === "error"),
  };
}

function validateResultRows(
  issues: AdapterValidationIssue[],
  rows: Array<{
    eventSlug: string | null;
    riderSlug: string | null;
    overallPosition: number | null;
    sourceIds: string[];
  }>,
  availableSourceIds: Set<string>,
  type: "overall" | "stage",
) {
  const riderKeys = new Set<string>();
  const positionKeys = new Set<string>();

  rows.forEach((row) => {
    if (!row.eventSlug) {
      issues.push({
        severity: "error",
        code: `html-${type}-missing-event-id`,
        message: "Parsed HTML result row is missing event id/slug.",
      });
    }

    if (!row.riderSlug) {
      issues.push({
        severity: "error",
        code: `html-${type}-missing-rider-id`,
        message: "Parsed HTML result row is missing rider id/slug.",
      });
    }

    const riderKey = `${row.eventSlug}:${row.riderSlug}`;
    if (riderKeys.has(riderKey)) {
      issues.push({
        severity: "error",
        code: `html-${type}-duplicate-rider`,
        message: "Parsed HTML result rows contain a duplicate rider for the same event.",
      });
    }
    riderKeys.add(riderKey);

    if (row.overallPosition !== null) {
      const positionKey = `${row.eventSlug}:P${row.overallPosition}`;
      if (positionKeys.has(positionKey)) {
        issues.push({
          severity: "error",
          code: `html-${type}-duplicate-position`,
          message:
            "Parsed HTML result rows contain a duplicate finishing position for the same event.",
        });
      }
      positionKeys.add(positionKey);
    }

    pushSourceIssues(issues, row.sourceIds, availableSourceIds);
    pushFutureSeasonIssues(issues, row.eventSlug);
  });
}

function pushSourceIssues(
  issues: AdapterValidationIssue[],
  sourceIds: string[],
  availableSourceIds: Set<string>,
) {
  if (sourceIds.length === 0) {
    issues.push({
      severity: "error",
      code: "html-row-missing-source",
      message: "Parsed HTML row must reference at least one source.",
    });
    return;
  }

  sourceIds.forEach((sourceId) => {
    if (!availableSourceIds.has(sourceId)) {
      issues.push({
        severity: "error",
        code: "html-row-unknown-source",
        message: `Parsed HTML row references unknown source '${sourceId}'.`,
      });
    }

    if (!getOfficialSource(sourceId)) {
      issues.push({
        severity: "error",
        code: "html-row-source-not-registered",
        message: `Parsed HTML row source '${sourceId}' is not in the official registry.`,
      });
    }
  });
}

function pushFutureSeasonIssues(
  issues: AdapterValidationIssue[],
  eventSlug: string | null,
) {
  const year = eventSlug?.match(/-(\d{4})$/)?.[1];

  if (year && Number.parseInt(year, 10) >= 2027) {
    issues.push({
      severity: "error",
      code: "html-future-season-blocked",
      message:
        "HTML adapter blocks 2027 or later data unless a later approved step adds explicit official future calendar handling.",
    });
  }
}
