import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { productionSourceRegistry } from "@/lib/source-intelligence/registry";

export type OfficialRegulationStatus = "ACTIVE" | "DRAFT" | "ARCHIVED";

export type RegulationValidationIssue = {
  severity: "error" | "warning";
  code:
    | "missing-source-title"
    | "missing-source-url"
    | "unsupported-official-source"
    | "missing-section"
    | "missing-regulation-year"
    | "missing-verification-date"
    | "missing-source-snapshot"
    | "missing-content-checksum"
    | "invalid-version"
    | "missing-points-mapping"
    | "invalid-points-mapping"
    | "duplicate-position-mapping"
    | "missing-tie-break-rules"
    | "invalid-tie-break-rule";
  message: string;
};

export type PointsMappingEntry = {
  position: number;
  points: number;
};

export type TieBreakRule = {
  type: "wins" | "second-places" | "best-recent-finish";
  order: number;
  description: string;
  section: string;
};

export type RegulationLike = {
  title: string;
  sourceUrl: string;
  regulationYear: number;
  section: string;
  verificationDate: Date;
  sourceSnapshotId?: string | null;
  contentChecksum?: string | null;
  version?: number;
  pointsMapping: Prisma.JsonValue;
  tieBreakRules: Prisma.JsonValue | null;
};

export function validateOfficialRegulation(
  regulation: RegulationLike,
): RegulationValidationIssue[] {
  const issues: RegulationValidationIssue[] = [];

  if (!regulation.title.trim()) {
    issues.push({
      severity: "error",
      code: "missing-source-title",
      message: "Regulation source title is required.",
    });
  }
  if (!isSafeOfficialUrl(regulation.sourceUrl)) {
    issues.push({
      severity: "error",
      code: "missing-source-url",
      message: "Official regulation source URL is required.",
    });
  } else if (!isRegisteredOfficialRegulationSource(regulation.sourceUrl)) {
    issues.push({
      severity: "error",
      code: "unsupported-official-source",
      message:
        "Regulation URL must match an enabled official source that can provide standings or documents.",
    });
  }
  if (!Number.isInteger(regulation.regulationYear) || regulation.regulationYear < 1900) {
    issues.push({
      severity: "error",
      code: "missing-regulation-year",
      message: "Regulation year is required.",
    });
  }
  if (!regulation.section.trim()) {
    issues.push({
      severity: "error",
      code: "missing-section",
      message: "Relevant regulation section/article is required.",
    });
  }
  if (!(regulation.verificationDate instanceof Date)) {
    issues.push({
      severity: "error",
      code: "missing-verification-date",
      message: "Verification date is required.",
    });
  }
  if (!regulation.sourceSnapshotId) {
    issues.push({
      severity: "error",
      code: "missing-source-snapshot",
      message: "A source snapshot is required before regulation points can be used.",
    });
  }
  if (!regulation.contentChecksum) {
    issues.push({
      severity: "error",
      code: "missing-content-checksum",
      message: "A regulation content checksum is required.",
    });
  }
  if (
    regulation.version !== undefined &&
    (!Number.isInteger(regulation.version) || regulation.version < 1)
  ) {
    issues.push({
      severity: "error",
      code: "invalid-version",
      message: "Regulation version must be a positive integer.",
    });
  }

  const mappingIssues = validatePointsMapping(regulation.pointsMapping);
  issues.push(...mappingIssues.issues);

  const tieBreakIssues = validateTieBreakRules(regulation.tieBreakRules);
  issues.push(...tieBreakIssues);

  return issues;
}

export function parsePointsMapping(value: Prisma.JsonValue): PointsMappingEntry[] {
  const parsed = validatePointsMapping(value);
  if (parsed.issues.some((issue) => issue.severity === "error")) return [];
  return parsed.mapping;
}

export function parseTieBreakRules(value: Prisma.JsonValue | null): TieBreakRule[] {
  if (!Array.isArray(value)) return [];
  const rules: TieBreakRule[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const raw = item as Record<string, unknown>;
    const type = String(raw.type ?? "");
    if (!isSupportedTieBreakType(type)) continue;
    rules.push({
      type,
      order: Number(raw.order),
      description: String(raw.description ?? ""),
      section: String(raw.section ?? ""),
    });
  }
  return rules;
}

export function pointsForPosition(
  position: number | null,
  mapping: PointsMappingEntry[],
) {
  if (!position || position < 1) return null;
  return mapping.find((entry) => entry.position === position)?.points ?? null;
}

export function regulationChecksum(value: unknown) {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function validatePointsMapping(value: Prisma.JsonValue) {
  const issues: RegulationValidationIssue[] = [];
  if (!Array.isArray(value) || value.length === 0) {
    return {
      mapping: [],
      issues: [
        {
          severity: "error" as const,
          code: "missing-points-mapping" as const,
          message: "At least one official position-to-points mapping is required.",
        },
      ],
    };
  }

  const seen = new Set<number>();
  const mapping: PointsMappingEntry[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      issues.push({
        severity: "error",
        code: "invalid-points-mapping",
        message: "Each points mapping row must be an object.",
      });
      continue;
    }
    const raw = item as Record<string, unknown>;
    const position = Number(raw.position);
    const points = Number(raw.points);
    if (
      !Number.isInteger(position) ||
      position < 1 ||
      !Number.isInteger(points) ||
      points < 0
    ) {
      issues.push({
        severity: "error",
        code: "invalid-points-mapping",
        message: "Position and points mappings must be non-negative integers.",
      });
      continue;
    }
    if (seen.has(position)) {
      issues.push({
        severity: "error",
        code: "duplicate-position-mapping",
        message: `Position ${position} is mapped more than once.`,
      });
      continue;
    }
    seen.add(position);
    mapping.push({ position, points });
  }

  return {
    mapping: mapping.sort((a, b) => a.position - b.position),
    issues,
  };
}

function validateTieBreakRules(value: Prisma.JsonValue | null) {
  const issues: RegulationValidationIssue[] = [];
  if (!Array.isArray(value) || value.length === 0) {
    return [
      {
        severity: "error" as const,
        code: "missing-tie-break-rules" as const,
        message: "Official tie-break rules are required before standings publication.",
      },
    ];
  }
  const orders = new Set<number>();
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      issues.push({
        severity: "error",
        code: "invalid-tie-break-rule",
        message: "Each tie-break rule must be an object.",
      });
      continue;
    }
    const raw = item as Record<string, unknown>;
    const type = String(raw.type ?? "");
    const order = Number(raw.order);
    if (
      !isSupportedTieBreakType(type) ||
      !Number.isInteger(order) ||
      order < 1 ||
      typeof raw.section !== "string" ||
      raw.section.length === 0
    ) {
      issues.push({
        severity: "error",
        code: "invalid-tie-break-rule",
        message: "Tie-break rules require a supported type, order, and source section.",
      });
    }
    if (orders.has(order)) {
      issues.push({
        severity: "error",
        code: "invalid-tie-break-rule",
        message: `Tie-break order ${order} is duplicated.`,
      });
    }
    orders.add(order);
  }
  return issues;
}

function isSupportedTieBreakType(value: string): value is TieBreakRule["type"] {
  return value === "wins" || value === "second-places" || value === "best-recent-finish";
}

function isSafeOfficialUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function isRegisteredOfficialRegulationSource(value: string) {
  let candidate: URL;
  try {
    candidate = new URL(value);
  } catch {
    return false;
  }
  return productionSourceRegistry.some((source) => {
    if (!source.enabled || source.status !== "active" || !source.websiteUrl) {
      return false;
    }
    if (
      !source.supportedEntityTypes.includes("standings") &&
      !source.supportedEntityTypes.includes("document")
    ) {
      return false;
    }
    if (
      !source.supportedContentTypes.includes("standings") &&
      !source.supportedContentTypes.includes("documents")
    ) {
      return false;
    }
    const registered = new URL(source.websiteUrl);
    return (
      candidate.hostname === registered.hostname ||
      candidate.hostname.endsWith(`.${registered.hostname}`)
    );
  });
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map(
        (key) =>
          `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`,
      )
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
