import { notFound } from "next/navigation";
import {
  Prisma,
  type ConnectorReviewAction,
  type ConnectorReviewStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ConnectorReviewFilters = {
  connector?: string;
  season?: number;
  status?: ConnectorReviewStatus;
  action?: ConnectorReviewAction;
  eventName?: string;
  snapshotId?: string;
  minimumConfidence?: number;
  page?: number;
  pageSize?: number;
};

export type ConnectorReviewListItem = Awaited<
  ReturnType<typeof getConnectorReviewItems>
>["items"][number];

export type ConnectorReviewDetail = NonNullable<
  Awaited<ReturnType<typeof getConnectorReviewItemDetail>>
>;

const defaultPageSize = 20;

export async function getConnectorReviewItems(filters: ConnectorReviewFilters = {}) {
  const pageSize = Math.min(Math.max(filters.pageSize ?? defaultPageSize, 1), 100);
  const page = Math.max(filters.page ?? 1, 1);
  const where = buildReviewWhere(filters);

  const [items, total, filterOptions] = await Promise.all([
    prisma.connectorReviewItem.findMany({
      where,
      orderBy: [
        { reviewStatus: "asc" },
        { snapshot: { createdAt: "desc" } },
        { createdAt: "desc" },
        { id: "asc" },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        snapshot: {
          select: {
            id: true,
            sourceKey: true,
            createdAt: true,
            runTimestamp: true,
            payloadChecksum: true,
            parserSelected: true,
          },
        },
      },
    }),
    prisma.connectorReviewItem.count({ where }),
    getConnectorReviewFilterOptions(),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
    filterOptions,
  };
}

export async function getConnectorReviewItemDetail(id: string) {
  const item = await prisma.connectorReviewItem.findUnique({
    where: { id },
    include: {
      snapshot: true,
    },
  });

  if (!item) notFound();

  return item;
}

export async function getConnectorReviewDecisionAudit(reviewItemId: string) {
  return prisma.dataVersion.findMany({
    where: {
      entityType: "ConnectorReviewItem",
      entityId: reviewItemId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

function buildReviewWhere(
  filters: ConnectorReviewFilters,
): Prisma.ConnectorReviewItemWhereInput {
  return {
    ...(filters.connector ? { connectorKey: filters.connector } : {}),
    ...(filters.season ? { season: filters.season } : {}),
    ...(filters.status ? { reviewStatus: filters.status } : {}),
    ...(filters.action ? { suggestedAction: filters.action } : {}),
    ...(filters.snapshotId ? { snapshotId: filters.snapshotId } : {}),
    ...(filters.eventName
      ? {
          eventName: {
            contains: filters.eventName,
            mode: "insensitive",
          },
        }
      : {}),
    ...(filters.minimumConfidence
      ? {
          confidence: {
            path: ["score"],
            gte: filters.minimumConfidence,
          },
        }
      : {}),
  };
}

async function getConnectorReviewFilterOptions() {
  const [connectors, seasons, snapshots] = await Promise.all([
    prisma.connectorReviewItem.findMany({
      distinct: ["connectorKey"],
      select: { connectorKey: true },
      orderBy: { connectorKey: "asc" },
    }),
    prisma.connectorReviewItem.findMany({
      distinct: ["season"],
      select: { season: true },
      orderBy: { season: "desc" },
    }),
    prisma.connectorSnapshot.findMany({
      select: { id: true, connectorKey: true, season: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return {
    connectors: connectors.map((item) => item.connectorKey),
    seasons: seasons.map((item) => item.season),
    snapshots,
  };
}

export function getConfidenceScore(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const score = (value as { score?: unknown }).score;
  return typeof score === "number" ? score : null;
}

export function getOfficialSourceUrl(item: {
  proposedValues: Prisma.JsonValue | null;
  currentValues: Prisma.JsonValue | null;
}) {
  return (
    getJsonString(item.proposedValues, "officialUrl") ??
    getJsonString(item.proposedValues, "officialSourceUrl") ??
    getJsonString(item.currentValues, "officialUrl")
  );
}

export function getJsonString(value: Prisma.JsonValue | null, key: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const field = (value as Record<string, unknown>)[key];
  return typeof field === "string" && field.length > 0 ? field : null;
}
