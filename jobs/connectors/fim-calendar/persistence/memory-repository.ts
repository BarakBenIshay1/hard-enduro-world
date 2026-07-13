import type {
  FimCalendarPersistenceRepository,
  FimCalendarReviewInput,
  PersistableConnectorSnapshot,
  PersistableReviewItem,
} from "./types";

export function createMemoryFimCalendarPersistenceRepository({
  failOnCommit = false,
}: {
  failOnCommit?: boolean;
} = {}): FimCalendarPersistenceRepository & {
  snapshots: PersistableConnectorSnapshot[];
  reviewItems: PersistableReviewItem[];
} {
  const snapshots: PersistableConnectorSnapshot[] = [];
  const reviewItems: PersistableReviewItem[] = [];

  const createRepository = (
    snapshotStore: PersistableConnectorSnapshot[],
    reviewStore: PersistableReviewItem[],
  ): FimCalendarPersistenceRepository => ({
    async findLatestSnapshot({ connectorKey, season }) {
      return (
        snapshotStore
          .filter(
            (snapshot) =>
              snapshot.connectorKey === connectorKey && snapshot.season === season,
          )
          .sort(
            (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
          )[0] ?? null
      );
    },

    async createSnapshot(input) {
      const snapshot = {
        id: `snapshot-${snapshotStore.length + 1}`,
        connectorKey: input.connectorKey,
        sourceKey: input.sourceKey,
        season: input.season,
        payloadChecksum: input.payloadChecksum,
        createdAt: new Date(1_700_000_000_000 + snapshotStore.length),
      };
      snapshotStore.push(snapshot);
      return snapshot;
    },

    async findPendingReviewItemByDeduplicationKey(deduplicationKey) {
      return (
        reviewStore.find(
          (item) =>
            item.deduplicationKey === deduplicationKey && item.reviewStatus === "PENDING",
        ) ?? null
      );
    },

    async findPendingReviewItemsForEvent({
      connectorKey,
      season,
      sourceEventId,
      currentEventId,
      suggestedAction,
    }) {
      return reviewStore.filter(
        (item) =>
          item.connectorKey === connectorKey &&
          item.season === season &&
          item.suggestedAction === suggestedAction &&
          item.reviewStatus === "PENDING" &&
          ((sourceEventId && item.sourceEventId === sourceEventId) ||
            (currentEventId && item.currentEventId === currentEventId)),
      );
    },

    async createReviewItem({ snapshotId, input }) {
      const item = createMemoryReviewItem({
        id: `review-${reviewStore.length + 1}`,
        snapshotId,
        input,
      });
      reviewStore.push(item);
      return item;
    },

    async updateReviewItemSnapshot({ id, snapshotId }) {
      const item = mustFindReviewItem(reviewStore, id);
      item.snapshotId = snapshotId;
      item.updatedAt = new Date(item.updatedAt.getTime() + 1);
      return item;
    },

    async supersedeReviewItem(id) {
      const item = mustFindReviewItem(reviewStore, id);
      item.reviewStatus = "SUPERSEDED";
      item.updatedAt = new Date(item.updatedAt.getTime() + 1);
      return item;
    },

    async countPendingReviewItems({ connectorKey, season }) {
      return reviewStore.filter(
        (item) =>
          item.connectorKey === connectorKey &&
          item.season === season &&
          item.reviewStatus === "PENDING",
      ).length;
    },

    async transaction(callback) {
      const snapshotCopy = snapshotStore.map((snapshot) => ({ ...snapshot }));
      const reviewCopy = reviewStore.map((item) => ({ ...item }));
      const result = await callback(createRepository(snapshotCopy, reviewCopy));

      if (failOnCommit) throw new Error("Simulated transaction rollback.");

      snapshotStore.splice(0, snapshotStore.length, ...snapshotCopy);
      reviewStore.splice(0, reviewStore.length, ...reviewCopy);
      return result;
    },
  });

  return Object.assign(createRepository(snapshots, reviewItems), {
    snapshots,
    reviewItems,
  });
}

function createMemoryReviewItem({
  id,
  snapshotId,
  input,
}: {
  id: string;
  snapshotId: string;
  input: FimCalendarReviewInput;
}): PersistableReviewItem {
  const now = new Date(1_700_000_100_000 + Number(id.replace("review-", "")));

  return {
    id,
    snapshotId,
    connectorKey: input.connectorKey,
    season: input.season,
    sourceEventId: input.sourceEventId,
    currentEventId: input.currentEventId,
    eventName: input.eventName,
    suggestedAction: input.suggestedAction,
    reviewStatus: "PENDING",
    confidence: input.confidence,
    matchingStrategy: input.matchingStrategy,
    ambiguityReason: input.ambiguityReason,
    currentValues: input.currentValues,
    proposedValues: input.proposedValues,
    changedFields: input.changedFields,
    recommendation: input.recommendation,
    deduplicationKey: input.deduplicationKey,
    createdAt: now,
    updatedAt: now,
  };
}

function mustFindReviewItem(items: PersistableReviewItem[], id: string) {
  const item = items.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`Review item '${id}' not found.`);
  return item;
}
