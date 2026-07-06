import type { ProductionSourceRegistryEntry } from "./types";

export type ProductionSourceRegistryIssue = {
  severity: "warning" | "error";
  code: string;
  message: string;
  sourceId: string;
};

export function validateProductionSourceRegistry(
  registry: ProductionSourceRegistryEntry[],
) {
  const seenIds = new Set<string>();
  const issues: ProductionSourceRegistryIssue[] = [];

  registry.forEach((source) => {
    if (seenIds.has(source.id)) {
      issues.push({
        severity: "error",
        code: "duplicate-source-id",
        message: "Source ids must be unique.",
        sourceId: source.id,
      });
    }
    seenIds.add(source.id);

    if (source.maximumRetries !== source.retryPolicy.maximumRetries) {
      issues.push({
        severity: "warning",
        code: "retry-policy-mismatch",
        message: "maximumRetries should match retryPolicy.maximumRetries.",
        sourceId: source.id,
      });
    }

    if (source.enabled && source.supportedUpdateTypes.length === 0) {
      issues.push({
        severity: "error",
        code: "enabled-source-without-update-types",
        message: "Enabled sources must declare supported update types.",
        sourceId: source.id,
      });
    }

    if (source.confidenceLevel === "trusted" && source.priority === "critical") {
      issues.push({
        severity: "warning",
        code: "trusted-source-critical-priority",
        message:
          "Trusted creator/media sources should not usually have critical priority.",
        sourceId: source.id,
      });
    }
  });

  return {
    valid: issues.every((issue) => issue.severity !== "error"),
    issues,
  };
}
