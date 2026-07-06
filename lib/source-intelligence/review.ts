import type { ChangeItem, ReviewItem, SourcePriority } from "./types";
import { recommendVerificationStatus } from "./verification";

export function createReviewItemFromChange({
  change,
  priority = "medium",
  createdAt = new Date().toISOString(),
}: {
  change: ChangeItem;
  priority?: SourcePriority;
  createdAt?: string;
}): ReviewItem {
  return {
    id: `review:${change.id}`,
    changeItemId: change.id,
    changedFields: change.fieldPath ? [change.fieldPath] : [],
    previousValue: change.previousValue,
    newValue: change.nextValue,
    sourceIds: change.sourceIds,
    confidence: change.confidence,
    priority,
    affectedEntities: [
      change.entity,
      ...(change.relationships?.flatMap((relationship) => [
        relationship.from,
        relationship.to,
      ]) ?? []),
    ],
    recommendedAction:
      change.confidence.score >= 0.8 ? "approve" : "request-more-evidence",
    verificationStatus: recommendVerificationStatus(change),
    createdAt,
  };
}

export function createReviewItemsFromChanges(changes: ChangeItem[]) {
  return changes.map((change) => createReviewItemFromChange({ change }));
}
