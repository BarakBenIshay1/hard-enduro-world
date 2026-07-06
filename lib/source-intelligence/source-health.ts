import type { ImportRun, Source, SourceHealth, SourceStatistics } from "./types";

export function createSourceHealth({
  source,
  importRuns,
  averageLatencyMs = null,
  lastReviewedDate = source.confidence.lastReviewedAt ?? null,
}: {
  source: Source;
  importRuns: ImportRun[];
  averageLatencyMs?: number | null;
  lastReviewedDate?: string | null;
}): SourceHealth {
  const lastSuccessfulRun = findLatestRun(importRuns, "completed");
  const lastFailedRun = findLatestRun(importRuns, "failed");

  return {
    sourceId: source.id,
    lastSuccessfulSync: lastSuccessfulRun?.finishedAt ?? lastSuccessfulRun?.startedAt,
    lastFailedSync: lastFailedRun?.finishedAt ?? lastFailedRun?.startedAt,
    currentStatus: source.enabled
      ? lastFailedRun && !lastSuccessfulRun
        ? "failing"
        : "healthy"
      : "disabled",
    averageLatencyMs,
    confidence: source.confidence,
    priority: source.priority,
    supportedEntities: source.entityTypes,
    supportedContentTypes: source.supportedContentTypes,
    connectorVersion: source.connectorVersion,
    lastReviewedDate,
  };
}

export function createSourceStatistics({
  sourceId,
  importRuns,
  pendingReviewItems,
  approvedChanges,
  rejectedChanges,
  averageLatencyMs = null,
}: {
  sourceId: string;
  importRuns: ImportRun[];
  pendingReviewItems: number;
  approvedChanges: number;
  rejectedChanges: number;
  averageLatencyMs?: number | null;
}): SourceStatistics {
  return {
    sourceId,
    totalRuns: importRuns.length,
    successfulRuns: importRuns.filter((run) => run.status === "completed").length,
    failedRuns: importRuns.filter((run) => run.status === "failed").length,
    pendingReviewItems,
    approvedChanges,
    rejectedChanges,
    averageLatencyMs,
    lastRunAt: importRuns[0]?.startedAt ?? null,
  };
}

function findLatestRun(importRuns: ImportRun[], status: ImportRun["status"]) {
  return [...importRuns]
    .filter((run) => run.status === status)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
}
