import { Prisma, type ConnectorReviewStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AuthUser } from "@/lib/auth";

export type ConnectorReviewDecision = "APPROVED" | "REJECTED";

export type ConnectorReviewDecisionInput = {
  reviewItemId: string;
  expectedStatus: ConnectorReviewStatus;
  expectedVersion: number;
  decision: ConnectorReviewDecision;
  actor: Pick<AuthUser, "id" | "email" | "name">;
  note?: string | null;
};

export type ConnectorReviewDecisionResult =
  | { ok: true; reviewItemId: string; status: ConnectorReviewDecision; version: number }
  | { ok: false; code: "not-found" | "conflict" | "invalid"; message: string };

export type ConnectorReviewDecisionRecord = {
  id: string;
  snapshotId: string;
  connectorKey: string;
  season: number;
  suggestedAction: string;
  reviewStatus: ConnectorReviewStatus;
  decidedByUserId: string | null;
  decidedAt: Date | null;
  version: number;
  snapshot: {
    payloadChecksum: string;
    finalResponseUrl: string | null;
  };
};

export type ConnectorReviewDecisionAudit = {
  entityType: "ConnectorReviewItem";
  entityId: string;
  previous: Prisma.InputJsonObject;
  next: Prisma.InputJsonObject;
  sourceUrl: string | null;
  createdBy: string;
};

export type ConnectorReviewDecisionRepository = {
  transaction<T>(
    callback: (repository: ConnectorReviewDecisionRepository) => Promise<T>,
  ): Promise<T>;
  findReviewItem(id: string): Promise<ConnectorReviewDecisionRecord | null>;
  updatePendingReviewItem(input: {
    id: string;
    expectedVersion: number;
    decision: ConnectorReviewDecision;
    actor: Pick<AuthUser, "id" | "email" | "name">;
    note: string | null;
    decidedAt: Date;
  }): Promise<{ count: number; item: ConnectorReviewDecisionRecord | null }>;
  createAudit(input: ConnectorReviewDecisionAudit): Promise<void>;
};

export async function decideConnectorReviewItem(
  input: ConnectorReviewDecisionInput,
): Promise<ConnectorReviewDecisionResult> {
  return decideConnectorReviewItemWithRepository(
    createPrismaConnectorReviewDecisionRepository(),
    input,
  );
}

export async function decideConnectorReviewItemWithRepository(
  repository: ConnectorReviewDecisionRepository,
  input: ConnectorReviewDecisionInput,
): Promise<ConnectorReviewDecisionResult> {
  if (input.expectedStatus !== "PENDING") {
    return {
      ok: false,
      code: "invalid",
      message: "Only PENDING review items can be decided.",
    };
  }

  if (input.decision === "REJECTED" && !input.note?.trim()) {
    return {
      ok: false,
      code: "invalid",
      message: "A rejection reason is required.",
    };
  }

  return repository.transaction(async (tx) => {
    const current = await tx.findReviewItem(input.reviewItemId);

    if (!current) {
      return {
        ok: false,
        code: "not-found",
        message: "Review item was not found.",
      };
    }

    if (
      current.reviewStatus !== "PENDING" ||
      current.reviewStatus !== input.expectedStatus ||
      current.version !== input.expectedVersion
    ) {
      return conflictResult();
    }

    const decidedAt = new Date();
    const update = await tx.updatePendingReviewItem({
      id: input.reviewItemId,
      expectedVersion: input.expectedVersion,
      decision: input.decision,
      actor: input.actor,
      note: input.note?.trim() || null,
      decidedAt,
    });

    if (update.count !== 1 || !update.item) {
      return conflictResult();
    }

    await tx.createAudit({
      entityType: "ConnectorReviewItem",
      entityId: current.id,
      previous: {
        reviewStatus: current.reviewStatus,
        version: current.version,
        decidedByUserId: current.decidedByUserId,
        decidedAt: current.decidedAt?.toISOString() ?? null,
      },
      next: {
        reviewStatus: update.item.reviewStatus,
        version: update.item.version,
        decidedByUserId: input.actor.id,
        decidedByUserEmail: input.actor.email,
        decidedAt: decidedAt.toISOString(),
        decisionNote: input.note?.trim() || null,
        connectorKey: update.item.connectorKey,
        season: update.item.season,
        suggestedAction: update.item.suggestedAction,
        snapshotId: update.item.snapshotId,
        snapshotChecksum: current.snapshot.payloadChecksum,
      },
      sourceUrl: current.snapshot.finalResponseUrl,
      createdBy: input.actor.id,
    });

    return {
      ok: true,
      reviewItemId: update.item.id,
      status: update.item.reviewStatus as ConnectorReviewDecision,
      version: update.item.version,
    };
  });
}

function createPrismaConnectorReviewDecisionRepository(
  client: typeof prisma = prisma,
  { inTransaction = false }: { inTransaction?: boolean } = {},
): ConnectorReviewDecisionRepository {
  const repository: ConnectorReviewDecisionRepository = {
    async transaction(callback) {
      if (inTransaction) return callback(repository);

      return client.$transaction((tx) =>
        callback(
          createPrismaConnectorReviewDecisionRepository(tx as typeof prisma, {
            inTransaction: true,
          }),
        ),
      );
    },

    async findReviewItem(id) {
      return client.connectorReviewItem.findUnique({
        where: { id },
        include: {
          snapshot: {
            select: {
              payloadChecksum: true,
              finalResponseUrl: true,
            },
          },
        },
      });
    },

    async updatePendingReviewItem({
      id,
      expectedVersion,
      decision,
      actor,
      note,
      decidedAt,
    }) {
      const update = await client.connectorReviewItem.updateMany({
        where: {
          id,
          reviewStatus: "PENDING",
          version: expectedVersion,
        },
        data: {
          reviewStatus: decision,
          decidedByUserId: actor.id,
          decidedByUserEmail: actor.email,
          decidedAt,
          decisionNote: note,
          version: {
            increment: 1,
          },
        },
      });

      if (update.count !== 1) return { count: update.count, item: null };

      const item = await client.connectorReviewItem.findUnique({
        where: { id },
        include: {
          snapshot: {
            select: {
              payloadChecksum: true,
              finalResponseUrl: true,
            },
          },
        },
      });

      return { count: update.count, item };
    },

    async createAudit(input) {
      await client.dataVersion.create({
        data: {
          entityType: input.entityType,
          entityId: input.entityId,
          action: "MANUAL_EDIT",
          previous: input.previous,
          next: input.next,
          sourceUrl: input.sourceUrl,
          createdBy: input.createdBy,
        },
      });
    },
  };

  return repository;
}

function conflictResult(): ConnectorReviewDecisionResult {
  return {
    ok: false,
    code: "conflict",
    message: "This review item has already changed. Reload it before making a decision.",
  };
}
