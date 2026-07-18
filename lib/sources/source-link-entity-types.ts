import { ClassifiableEntityType } from "@prisma/client";

export const canonicalSourceLinkEntityTypes = {
  result: "RESULT",
  stageResult: "STAGE_RESULT",
} as const;

export function canonicalSourceLinkEntityTypeForClassifiable(
  entityType: ClassifiableEntityType,
) {
  switch (entityType) {
    case ClassifiableEntityType.RESULT:
      return canonicalSourceLinkEntityTypes.result;
    case ClassifiableEntityType.STAGE_RESULT:
      return canonicalSourceLinkEntityTypes.stageResult;
    default:
      return null;
  }
}

export function requiredCanonicalSourceLinkEntityTypeForClassifiable(
  entityType: ClassifiableEntityType,
) {
  const canonical = canonicalSourceLinkEntityTypeForClassifiable(entityType);
  if (!canonical) {
    throw new Error(`Unsupported canonical SourceLink entity type: ${entityType}`);
  }
  return canonical;
}

export function sourceLinkEntityTypeAliasesFor(value: string) {
  if (value === canonicalSourceLinkEntityTypes.result || value === "Result") {
    return [canonicalSourceLinkEntityTypes.result, "Result"];
  }
  if (value === canonicalSourceLinkEntityTypes.stageResult || value === "StageResult") {
    return [canonicalSourceLinkEntityTypes.stageResult, "StageResult"];
  }
  return [value];
}

export function classifiableEntityTypeFromSourceLink(value: string) {
  if (
    sourceLinkEntityTypeAliasesFor(value).includes(canonicalSourceLinkEntityTypes.result)
  ) {
    return ClassifiableEntityType.RESULT;
  }
  if (
    sourceLinkEntityTypeAliasesFor(value).includes(
      canonicalSourceLinkEntityTypes.stageResult,
    )
  ) {
    return ClassifiableEntityType.STAGE_RESULT;
  }
  return null;
}

export function dedupeSourceLinksByLogicalEvidence<
  T extends {
    entityType: string;
    entityId: string;
    dataSourceId: string;
    url: string;
    note: string | null;
  },
>(links: T[]) {
  const byKey = new Map<string, T>();
  for (const link of links) {
    const key = `${link.entityId}:${link.dataSourceId}:${link.url}:${link.note ?? ""}`;
    const existing = byKey.get(key);
    if (!existing || isCanonicalSourceLinkType(link.entityType)) {
      byKey.set(key, link);
    }
  }
  return Array.from(byKey.values());
}

function isCanonicalSourceLinkType(value: string) {
  return (
    value === canonicalSourceLinkEntityTypes.result ||
    value === canonicalSourceLinkEntityTypes.stageResult
  );
}
