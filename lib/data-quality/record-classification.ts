import {
  ClassifiableEntityType,
  DataOriginStatus,
  Prisma,
  type PrismaClient,
  type RecordClassification,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type ClassificationState = "UNCLASSIFIED" | "CLASSIFIED";

export type OfficialWorkflowEligibility =
  | "ELIGIBLE"
  | "CONDITIONAL"
  | "REVIEW_ONLY"
  | "BLOCKED"
  | "UNENFORCED";

export type ClassificationResolution = {
  state: ClassificationState;
  classification: RecordClassification | null;
  originStatus: DataOriginStatus | null;
  explicitlyQuarantined: boolean;
  officialWorkflowEligibility: OfficialWorkflowEligibility;
};

export type ClassificationFilter = DataOriginStatus | "UNCLASSIFIED" | "ALL";

export type ClassificationSummary = {
  total: number;
  classified: number;
  unclassified: number;
  verified: number;
  manual: number;
  sourceManaged: number;
  quarantined: number;
};

export type ClassifiableEntityIdentity = {
  entityType: ClassifiableEntityType;
  entityId: string;
  exists: boolean;
  label: string | null;
};

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

const quarantinedStatuses = new Set<DataOriginStatus>([
  DataOriginStatus.MANUAL_PLACEHOLDER,
  DataOriginStatus.DEMO,
  DataOriginStatus.SEED,
  DataOriginStatus.VALIDATION,
  DataOriginStatus.UNKNOWN,
  DataOriginStatus.CONFLICTING,
  DataOriginStatus.ARCHIVED_HISTORY,
]);

const eligibilityByOriginStatus: Record<DataOriginStatus, OfficialWorkflowEligibility> = {
  [DataOriginStatus.VERIFIED_OFFICIAL]: "ELIGIBLE",
  [DataOriginStatus.AUDITED_MANUAL]: "CONDITIONAL",
  [DataOriginStatus.SOURCE_MANAGED_UNVERIFIED]: "REVIEW_ONLY",
  [DataOriginStatus.MANUAL_PLACEHOLDER]: "BLOCKED",
  [DataOriginStatus.DEMO]: "BLOCKED",
  [DataOriginStatus.SEED]: "BLOCKED",
  [DataOriginStatus.VALIDATION]: "BLOCKED",
  [DataOriginStatus.UNKNOWN]: "BLOCKED",
  [DataOriginStatus.CONFLICTING]: "BLOCKED",
  [DataOriginStatus.ARCHIVED_HISTORY]: "BLOCKED",
};

export const classifiableEntityTypes = [
  ClassifiableEntityType.SEASON,
  ClassifiableEntityType.EVENT,
  ClassifiableEntityType.RACE_STAGE,
  ClassifiableEntityType.RIDER,
  ClassifiableEntityType.TEAM,
  ClassifiableEntityType.MANUFACTURER,
  ClassifiableEntityType.MOTORCYCLE,
  ClassifiableEntityType.RESULT,
  ClassifiableEntityType.STAGE_RESULT,
  ClassifiableEntityType.RESULT_POINT_COMPONENT,
  ClassifiableEntityType.CHAMPIONSHIP_REGULATION,
  ClassifiableEntityType.STANDING,
  ClassifiableEntityType.STANDING_PUBLICATION,
] as const satisfies readonly ClassifiableEntityType[];

export function isExplicitlyQuarantined(originStatus: DataOriginStatus) {
  return quarantinedStatuses.has(originStatus);
}

export function getOfficialWorkflowEligibility(
  originStatus: DataOriginStatus,
): OfficialWorkflowEligibility {
  return eligibilityByOriginStatus[originStatus];
}

export async function getActiveRecordClassification(
  entityType: ClassifiableEntityType,
  entityId: string,
  client: PrismaExecutor = prisma,
) {
  return client.recordClassification.findFirst({
    where: { entityType, entityId, supersededAt: null },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
  });
}

export async function getRecordClassificationHistory(
  entityType: ClassifiableEntityType,
  entityId: string,
  client: PrismaExecutor = prisma,
) {
  return client.recordClassification.findMany({
    where: { entityType, entityId },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
  });
}

export async function getRecordClassificationHistoryWithEvidence(
  entityType: ClassifiableEntityType,
  entityId: string,
  client: PrismaExecutor = prisma,
) {
  return client.recordClassification.findMany({
    where: { entityType, entityId },
    include: {
      sourceLink: { include: { dataSource: true } },
      sourceSnapshot: { include: { dataSource: true } },
      connectorReviewItem: {
        include: {
          snapshot: { select: { id: true, sourceKey: true, createdAt: true } },
        },
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
  });
}

export async function resolveRecordClassification(
  entityType: ClassifiableEntityType,
  entityId: string,
  client: PrismaExecutor = prisma,
): Promise<ClassificationResolution> {
  const classification = await getActiveRecordClassification(
    entityType,
    entityId,
    client,
  );

  if (!classification) {
    return {
      state: "UNCLASSIFIED",
      classification: null,
      originStatus: null,
      explicitlyQuarantined: false,
      officialWorkflowEligibility: "UNENFORCED",
    };
  }

  return {
    state: "CLASSIFIED",
    classification,
    originStatus: classification.originStatus,
    explicitlyQuarantined: isExplicitlyQuarantined(classification.originStatus),
    officialWorkflowEligibility: getOfficialWorkflowEligibility(
      classification.originStatus,
    ),
  };
}

export async function resolveRecordClassifications(
  entityType: ClassifiableEntityType,
  entityIds: string[],
  client: PrismaExecutor = prisma,
) {
  const uniqueIds = Array.from(new Set(entityIds.filter(Boolean)));
  if (uniqueIds.length === 0) return new Map<string, ClassificationResolution>();

  const rows = await client.recordClassification.findMany({
    where: { entityType, entityId: { in: uniqueIds }, supersededAt: null },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
  });
  const activeRows = new Map<string, RecordClassification>();
  for (const row of rows) {
    if (!activeRows.has(row.entityId)) activeRows.set(row.entityId, row);
  }

  const resolutions = new Map<string, ClassificationResolution>();
  for (const entityId of uniqueIds) {
    const classification = activeRows.get(entityId) ?? null;
    if (!classification) {
      resolutions.set(entityId, {
        state: "UNCLASSIFIED",
        classification: null,
        originStatus: null,
        explicitlyQuarantined: false,
        officialWorkflowEligibility: "UNENFORCED",
      });
      continue;
    }

    resolutions.set(entityId, {
      state: "CLASSIFIED",
      classification,
      originStatus: classification.originStatus,
      explicitlyQuarantined: isExplicitlyQuarantined(classification.originStatus),
      officialWorkflowEligibility: getOfficialWorkflowEligibility(
        classification.originStatus,
      ),
    });
  }

  return resolutions;
}

export async function getClassificationEntityIdFilter(
  entityType: ClassifiableEntityType,
  filter: ClassificationFilter | undefined,
  client: PrismaExecutor = prisma,
): Promise<Prisma.StringFilter | undefined> {
  if (!filter || filter === "ALL") return undefined;

  const rows = await client.recordClassification.findMany({
    where: {
      entityType,
      supersededAt: null,
      ...(filter === "UNCLASSIFIED" ? {} : { originStatus: filter }),
    },
    distinct: ["entityId"],
    select: { entityId: true },
  });
  const ids = rows.map((row) => row.entityId);

  if (filter === "UNCLASSIFIED") {
    return ids.length ? { notIn: ids } : undefined;
  }

  return ids.length ? { in: ids } : { in: ["__no_classified_records__"] };
}

export function summarizeClassificationResolutions(
  resolutions: Iterable<ClassificationResolution>,
): ClassificationSummary {
  const summary: ClassificationSummary = {
    total: 0,
    classified: 0,
    unclassified: 0,
    verified: 0,
    manual: 0,
    sourceManaged: 0,
    quarantined: 0,
  };

  for (const resolution of resolutions) {
    summary.total += 1;
    if (resolution.state === "UNCLASSIFIED") {
      summary.unclassified += 1;
      continue;
    }

    summary.classified += 1;
    if (resolution.originStatus === DataOriginStatus.VERIFIED_OFFICIAL) {
      summary.verified += 1;
    }
    if (resolution.originStatus === DataOriginStatus.AUDITED_MANUAL) {
      summary.manual += 1;
    }
    if (resolution.originStatus === DataOriginStatus.SOURCE_MANAGED_UNVERIFIED) {
      summary.sourceManaged += 1;
    }
    if (resolution.explicitlyQuarantined) {
      summary.quarantined += 1;
    }
  }

  return summary;
}

export async function classifiableEntityExists(
  entityType: ClassifiableEntityType,
  entityId: string,
  client: PrismaExecutor = prisma,
): Promise<ClassifiableEntityIdentity> {
  const identity = await findClassifiableEntityIdentity(entityType, entityId, client);

  return {
    entityType,
    entityId,
    exists: Boolean(identity),
    label: identity?.label ?? null,
  };
}

export async function assertClassifiableEntityExists(
  entityType: ClassifiableEntityType,
  entityId: string,
  client: PrismaExecutor = prisma,
) {
  const identity = await classifiableEntityExists(entityType, entityId, client);

  if (!identity.exists) {
    throw new Error(`Classifiable entity ${entityType}:${entityId} does not exist.`);
  }

  return identity;
}

export function normalizeLegacyEntityType(value: string): ClassifiableEntityType | null {
  const normalized = value.replace(/[_\s-]/g, "").toLowerCase();

  switch (normalized) {
    case "season":
      return ClassifiableEntityType.SEASON;
    case "event":
      return ClassifiableEntityType.EVENT;
    case "racestage":
      return ClassifiableEntityType.RACE_STAGE;
    case "rider":
      return ClassifiableEntityType.RIDER;
    case "team":
      return ClassifiableEntityType.TEAM;
    case "manufacturer":
      return ClassifiableEntityType.MANUFACTURER;
    case "motorcycle":
      return ClassifiableEntityType.MOTORCYCLE;
    case "result":
      return ClassifiableEntityType.RESULT;
    case "stageresult":
      return ClassifiableEntityType.STAGE_RESULT;
    case "resultpointcomponent":
      return ClassifiableEntityType.RESULT_POINT_COMPONENT;
    case "championshipregulation":
      return ClassifiableEntityType.CHAMPIONSHIP_REGULATION;
    case "standing":
      return ClassifiableEntityType.STANDING;
    case "standingpublication":
      return ClassifiableEntityType.STANDING_PUBLICATION;
    default:
      return null;
  }
}

async function findClassifiableEntityIdentity(
  entityType: ClassifiableEntityType,
  entityId: string,
  client: PrismaExecutor,
): Promise<{ label: string | null } | null> {
  switch (entityType) {
    case ClassifiableEntityType.SEASON: {
      const row = await client.season.findUnique({
        where: { id: entityId },
        select: { name: true, year: true },
      });
      return row ? { label: row.name ?? String(row.year) } : null;
    }
    case ClassifiableEntityType.EVENT: {
      const row = await client.event.findUnique({
        where: { id: entityId },
        select: { name: true },
      });
      return row ? { label: row.name } : null;
    }
    case ClassifiableEntityType.RACE_STAGE: {
      const row = await client.raceStage.findUnique({
        where: { id: entityId },
        select: { name: true },
      });
      return row ? { label: row.name } : null;
    }
    case ClassifiableEntityType.RIDER: {
      const row = await client.rider.findUnique({
        where: { id: entityId },
        select: { firstName: true, lastName: true },
      });
      return row ? { label: `${row.firstName} ${row.lastName}` } : null;
    }
    case ClassifiableEntityType.TEAM: {
      const row = await client.team.findUnique({
        where: { id: entityId },
        select: { name: true },
      });
      return row ? { label: row.name } : null;
    }
    case ClassifiableEntityType.MANUFACTURER: {
      const row = await client.manufacturer.findUnique({
        where: { id: entityId },
        select: { name: true },
      });
      return row ? { label: row.name } : null;
    }
    case ClassifiableEntityType.MOTORCYCLE: {
      const row = await client.motorcycle.findUnique({
        where: { id: entityId },
        select: { model: true, year: true },
      });
      return row ? { label: [row.year, row.model].filter(Boolean).join(" ") } : null;
    }
    case ClassifiableEntityType.RESULT: {
      const row = await client.result.findUnique({
        where: { id: entityId },
        select: { id: true },
      });
      return row ? { label: row.id } : null;
    }
    case ClassifiableEntityType.STAGE_RESULT: {
      const row = await client.stageResult.findUnique({
        where: { id: entityId },
        select: { id: true },
      });
      return row ? { label: row.id } : null;
    }
    case ClassifiableEntityType.RESULT_POINT_COMPONENT: {
      const row = await client.resultPointComponent.findUnique({
        where: { id: entityId },
        select: { id: true },
      });
      return row ? { label: row.id } : null;
    }
    case ClassifiableEntityType.CHAMPIONSHIP_REGULATION: {
      const row = await client.championshipRegulation.findUnique({
        where: { id: entityId },
        select: { title: true },
      });
      return row ? { label: row.title } : null;
    }
    case ClassifiableEntityType.STANDING: {
      const row = await client.standing.findUnique({
        where: { id: entityId },
        select: { id: true },
      });
      return row ? { label: row.id } : null;
    }
    case ClassifiableEntityType.STANDING_PUBLICATION: {
      const row = await client.standingPublication.findUnique({
        where: { id: entityId },
        select: { versionKey: true },
      });
      return row ? { label: row.versionKey } : null;
    }
    default: {
      const exhaustive: never = entityType;
      throw new Error(`Unsupported classifiable entity type: ${exhaustive}`);
    }
  }
}
