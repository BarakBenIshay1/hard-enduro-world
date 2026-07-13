import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  FimCalendarPersistenceRepository,
  FimCalendarReviewInput,
  PersistableConnectorSnapshot,
  PersistableReviewItem,
} from "./types";

type PrismaTransaction = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export function createPrismaFimCalendarPersistenceRepository(
  client: PrismaClient | PrismaTransaction = prisma,
): FimCalendarPersistenceRepository {
  return {
    async findLatestSnapshot({ connectorKey, season }) {
      const snapshot = await client.connectorSnapshot.findFirst({
        where: { connectorKey, season },
        orderBy: { createdAt: "desc" },
      });
      return snapshot ? mapSnapshot(snapshot) : null;
    },

    async createSnapshot(input) {
      const snapshot = await client.connectorSnapshot.create({
        data: {
          connectorKey: input.connectorKey,
          sourceKey: input.sourceKey,
          season: input.season,
          coverageMode: input.coverageMode,
          inputSourceType: input.inputSourceType,
          requestedSourceUrl: input.requestedSourceUrl,
          finalResponseUrl: input.finalResponseUrl,
          httpStatus: input.httpStatus,
          contentType: input.contentType,
          parserSelected: input.parserSelected,
          rawRecordCount: input.rawRecordCount,
          usableEventCount: input.usableEventCount,
          rejectedRecordCount: input.rejectedRecordCount,
          rejectionReasons: input.rejectionReasons,
          fetchDurationMs: input.fetchDurationMs,
          executionDurationMs: input.executionDurationMs,
          fallbackUsed: input.fallbackUsed,
          environment: input.environment,
          gitCommitSha: input.gitCommitSha,
          connectorVersion: input.connectorVersion,
          normalizedPayload: input.normalizedPayload as Prisma.InputJsonValue,
          matchingPayload: input.matchingPayload as Prisma.InputJsonValue,
          diagnostics: input.diagnostics as Prisma.InputJsonValue,
          payloadChecksum: input.payloadChecksum,
        },
      });
      return mapSnapshot(snapshot);
    },

    async findPendingReviewItemByDeduplicationKey(deduplicationKey) {
      const item = await client.connectorReviewItem.findFirst({
        where: { deduplicationKey, reviewStatus: "PENDING" },
      });
      return item ? mapReviewItem(item) : null;
    },

    async findPendingReviewItemsForEvent({
      connectorKey,
      season,
      sourceEventId,
      currentEventId,
      suggestedAction,
    }) {
      const items = await client.connectorReviewItem.findMany({
        where: {
          connectorKey,
          season,
          suggestedAction,
          reviewStatus: "PENDING",
          OR: [
            ...(sourceEventId ? [{ sourceEventId }] : []),
            ...(currentEventId ? [{ currentEventId }] : []),
          ],
        },
      });
      return items.map(mapReviewItem);
    },

    async createReviewItem({ snapshotId, input }) {
      const item = await client.connectorReviewItem.create({
        data: mapReviewInputToCreate(snapshotId, input),
      });
      return mapReviewItem(item);
    },

    async updateReviewItemSnapshot({ id, snapshotId }) {
      const item = await client.connectorReviewItem.update({
        where: { id },
        data: { snapshotId },
      });
      return mapReviewItem(item);
    },

    async supersedeReviewItem(id) {
      const item = await client.connectorReviewItem.update({
        where: { id },
        data: { reviewStatus: "SUPERSEDED" },
      });
      return mapReviewItem(item);
    },

    async countPendingReviewItems({ connectorKey, season }) {
      return client.connectorReviewItem.count({
        where: { connectorKey, season, reviewStatus: "PENDING" },
      });
    },

    async transaction(callback) {
      if ("$transaction" in client) {
        return client.$transaction((tx) =>
          callback(createPrismaFimCalendarPersistenceRepository(tx)),
        );
      }
      return callback(createPrismaFimCalendarPersistenceRepository(client));
    },
  };
}

function mapSnapshot(snapshot: {
  id: string;
  connectorKey: string;
  sourceKey: string;
  season: number;
  payloadChecksum: string;
  createdAt: Date;
}): PersistableConnectorSnapshot {
  return {
    id: snapshot.id,
    connectorKey: snapshot.connectorKey,
    sourceKey: snapshot.sourceKey,
    season: snapshot.season,
    payloadChecksum: snapshot.payloadChecksum,
    createdAt: snapshot.createdAt,
  };
}

function mapReviewInputToCreate(
  snapshotId: string,
  input: FimCalendarReviewInput,
): Prisma.ConnectorReviewItemCreateInput {
  return {
    snapshot: { connect: { id: snapshotId } },
    connectorKey: input.connectorKey,
    season: input.season,
    sourceEventId: input.sourceEventId,
    currentEventId: input.currentEventId,
    eventName: input.eventName,
    suggestedAction: input.suggestedAction,
    reviewStatus: "PENDING",
    confidence: input.confidence as Prisma.InputJsonValue,
    matchingStrategy: input.matchingStrategy,
    ambiguityReason: input.ambiguityReason,
    currentValues:
      input.currentValues === null
        ? Prisma.JsonNull
        : (input.currentValues as Prisma.InputJsonValue),
    proposedValues:
      input.proposedValues === null
        ? Prisma.JsonNull
        : (input.proposedValues as Prisma.InputJsonValue),
    changedFields: input.changedFields,
    recommendation: input.recommendation,
    deduplicationKey: input.deduplicationKey,
  };
}

function mapReviewItem(item: {
  id: string;
  snapshotId: string;
  connectorKey: string;
  season: number;
  sourceEventId: string | null;
  currentEventId: string | null;
  eventName: string;
  suggestedAction: "NEW_EVENT" | "UPDATE_EVENT" | "SOURCE_REMOVED" | "MANUAL_REVIEW";
  reviewStatus: "PENDING" | "APPROVED" | "REJECTED" | "SUPERSEDED";
  confidence: Prisma.JsonValue;
  matchingStrategy: string | null;
  ambiguityReason: string | null;
  currentValues: Prisma.JsonValue | null;
  proposedValues: Prisma.JsonValue | null;
  changedFields: string[];
  recommendation: string | null;
  deduplicationKey: string;
  createdAt: Date;
  updatedAt: Date;
}): PersistableReviewItem {
  return {
    id: item.id,
    snapshotId: item.snapshotId,
    connectorKey: item.connectorKey,
    season: item.season,
    sourceEventId: item.sourceEventId,
    currentEventId: item.currentEventId,
    eventName: item.eventName,
    suggestedAction: item.suggestedAction,
    reviewStatus: item.reviewStatus,
    confidence: item.confidence,
    matchingStrategy: item.matchingStrategy,
    ambiguityReason: item.ambiguityReason,
    currentValues: item.currentValues,
    proposedValues: item.proposedValues,
    changedFields: item.changedFields,
    recommendation: item.recommendation,
    deduplicationKey: item.deduplicationKey,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}
