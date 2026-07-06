import type {
  ConnectorCapability,
  Source,
  SourceContentType,
  SourceEntityType,
} from "./types";

export type SourceRegistryEntry = Source & {
  capabilities: ConnectorCapability[];
};

export type SourceRegistryValidationIssue = {
  severity: "warning" | "error";
  code: string;
  message: string;
  sourceId: string;
};

export function validateSourceRegistryEntry(
  entry: SourceRegistryEntry,
): SourceRegistryValidationIssue[] {
  const issues: SourceRegistryValidationIssue[] = [];

  if (!entry.id) {
    issues.push({
      severity: "error",
      code: "missing-source-id",
      message: "Source registry entry requires a stable source id.",
      sourceId: entry.id,
    });
  }

  if (entry.maximumRetryCount < 0) {
    issues.push({
      severity: "error",
      code: "invalid-retry-count",
      message: "Maximum retry count cannot be negative.",
      sourceId: entry.id,
    });
  }

  if (entry.confidence.score < 0 || entry.confidence.score > 1) {
    issues.push({
      severity: "error",
      code: "invalid-confidence-score",
      message: "Source confidence score must be between 0 and 1.",
      sourceId: entry.id,
    });
  }

  if (entry.enabled && entry.capabilities.length === 0) {
    issues.push({
      severity: "warning",
      code: "enabled-source-without-capabilities",
      message: "Enabled source has no connector capabilities configured.",
      sourceId: entry.id,
    });
  }

  return issues;
}

export function sourceSupportsEntityType(source: Source, entityType: SourceEntityType) {
  return source.entityTypes.includes(entityType);
}

export function sourceSupportsContentType(
  source: Source,
  contentType: SourceContentType,
) {
  return source.supportedContentTypes.includes(contentType);
}

export function getEnabledSources(entries: SourceRegistryEntry[]) {
  return entries.filter((entry) => entry.enabled);
}
