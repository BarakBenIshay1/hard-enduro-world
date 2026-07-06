import type { ChangeItem, ChangeItemType, ChangeSet, EntityReference } from "./types";

export function createChangeItem({
  id,
  type,
  entity,
  fieldPath = null,
  previousValue,
  nextValue,
  sourceIds,
  confidence,
  relationships,
  detectedAt = new Date().toISOString(),
}: Pick<
  ChangeItem,
  | "id"
  | "entity"
  | "previousValue"
  | "nextValue"
  | "sourceIds"
  | "confidence"
  | "relationships"
> & {
  type: ChangeItemType;
  fieldPath?: string | null;
  detectedAt?: string;
}): ChangeItem {
  return {
    id,
    type,
    entity,
    fieldPath,
    previousValue,
    nextValue,
    sourceIds,
    confidence,
    relationships,
    detectedAt,
  };
}

export function createChangeSet({
  id,
  sourceId,
  importRunId = null,
  items,
  createdAt = new Date().toISOString(),
}: {
  id: string;
  sourceId: string;
  importRunId?: string | null;
  items: ChangeItem[];
  createdAt?: string;
}): ChangeSet {
  return {
    id,
    sourceId,
    importRunId,
    createdAt,
    items,
    summary: summarizeChanges(items),
  };
}

export function summarizeChanges(items: ChangeItem[]): ChangeSet["summary"] {
  return {
    newEntities: countChanges(items, "new-entity"),
    removedEntities: countChanges(items, "removed-entity"),
    updatedEntities: countChanges(items, "updated-entity"),
    relationshipChanges: countChanges(items, "relationship-change"),
    mediaChanges: countChanges(items, "media-change"),
    documentChanges: countChanges(items, "document-change"),
    statusChanges: countChanges(items, "status-change"),
  };
}

export function detectMetadataChanges({
  entity,
  previous,
  next,
  sourceIds,
}: {
  entity: EntityReference;
  previous: Record<string, unknown>;
  next: Record<string, unknown>;
  sourceIds: string[];
}) {
  return Object.keys(next)
    .filter((key) => previous[key] !== next[key])
    .map((key) =>
      createChangeItem({
        id: `${entity.type}:${entity.id ?? entity.slug ?? entity.displayName}:${key}`,
        type: "metadata-change",
        entity,
        fieldPath: key,
        previousValue: previous[key] ?? null,
        nextValue: next[key] ?? null,
        sourceIds,
        confidence: {
          level: "manual-review",
          score: 0.7,
          reason: "Metadata value changed and requires review.",
        },
      }),
    );
}

function countChanges(items: ChangeItem[], type: ChangeItemType) {
  return items.filter((item) => item.type === type).length;
}
