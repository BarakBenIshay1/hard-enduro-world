import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { AuthUser } from "@/lib/auth";
import { standingsConnectorKey } from "@/lib/admin/standings-calculation";

type PrismaTransaction = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

type PublicationActor = Pick<AuthUser, "id" | "email" | "name">;

export type StandingPublicationResult =
  | {
      ok: true;
      publicationId: string;
      status: "PUBLISHED";
      message: string;
    }
  | {
      ok: false;
      code: "invalid" | "not-found" | "conflict" | "unauthorized";
      message: string;
    };

export async function publishStandingCalculationSet({
  reviewItemId,
  actor,
  note,
}: {
  reviewItemId: string;
  actor: PublicationActor;
  note?: string | null;
}): Promise<StandingPublicationResult> {
  const seed = await prisma.connectorReviewItem.findUnique({
    where: { id: reviewItemId },
    include: { snapshot: true },
  });
  if (!seed) return notFound("Review item was not found.");

  const seedProposal = asRecord(seed.proposedValues);
  const calculationSetId = getString(seedProposal, "calculationSetId");
  const calculationSetGroupKey = getString(seedProposal, "calculationSetGroupKey");
  const expectedProposalCount = getNumber(seedProposal, "expectedProposalCount");
  if (!calculationSetId || !calculationSetGroupKey || !expectedProposalCount) {
    return invalid("Review item is not part of a Standing calculation set.");
  }

  const items = (
    await prisma.connectorReviewItem.findMany({
      where: {
        connectorKey: standingsConnectorKey,
        season: seed.season,
        snapshotId: seed.snapshotId,
      },
      include: { snapshot: true },
      orderBy: [{ eventName: "asc" }, { id: "asc" }],
    })
  ).filter(
    (item) =>
      getString(asRecord(item.proposedValues), "calculationSetId") === calculationSetId,
  );

  const readiness = await validatePublishReadiness({
    seed,
    items,
    calculationSetId,
    calculationSetGroupKey,
    expectedProposalCount,
  });
  if (!readiness.ok) return readiness;

  try {
    const publication = await prisma.$transaction(async (tx) => {
      const rows = await buildPublishedRows(items, tx);
      const { regulationId, regulationVersion, regulationChecksum } =
        readRegulationReference(seedProposal);
      const activeKey = publicationActiveKey({
        seasonId: requiredString(seedProposal, "seasonId"),
        classificationScope: "OVERALL",
        className: getString(seedProposal, "className"),
      });
      const now = new Date();

      const previousActive = await tx.standingPublication.findUnique({
        where: { activeKey },
      });
      const existingActiveForSet =
        previousActive?.calculationSetId === calculationSetId ? previousActive : null;
      if (existingActiveForSet) return existingActiveForSet;

      const publicationVersion = await nextPublicationVersion(activeKey, tx);

      if (previousActive) {
        await tx.standingPublication.update({
          where: { id: previousActive.id },
          data: {
            status: "SUPERSEDED",
            activeKey: null,
            supersededAt: now,
          },
        });
      }

      const created = await tx.standingPublication.create({
        data: {
          seasonId: requiredString(seedProposal, "seasonId"),
          classificationScope: "OVERALL",
          className: getString(seedProposal, "className"),
          calculationSetId,
          calculationSetGroupKey,
          regulationId,
          regulationVersion,
          regulationChecksum,
          snapshotId: seed.snapshotId,
          snapshotChecksum: seed.snapshot.payloadChecksum,
          status: "PUBLISHED",
          activeKey,
          publicationVersion,
          versionKey: `${activeKey}:v${publicationVersion}`,
          rows: rows as Prisma.InputJsonValue,
          publishedAt: now,
          publishedByUserId: actor.id,
          publishedByUserEmail: actor.email,
        },
      });

      if (previousActive) {
        await tx.standingPublication.update({
          where: { id: previousActive.id },
          data: {
            supersededById: created.id,
          },
        });
      }

      await createPublicationVersions({
        tx,
        actor,
        publication: created,
        rows,
        previousActive,
        note,
      });

      return created;
    });
    safeRevalidateStandings();
    return {
      ok: true,
      publicationId: publication.id,
      status: "PUBLISHED",
      message: "Standing publication is now live.",
    };
  } catch (error) {
    return invalid(sanitizeError(error));
  }
}

export async function rollbackStandingPublication({
  publicationId,
  actor,
  note,
}: {
  publicationId: string;
  actor: PublicationActor;
  note?: string | null;
}): Promise<StandingPublicationResult> {
  const target = await prisma.standingPublication.findUnique({
    where: { id: publicationId },
  });
  if (!target) return notFound("Standing publication was not found.");
  if (!["PUBLISHED", "SUPERSEDED", "ARCHIVED"].includes(target.status)) {
    return invalid("Only a historical published Standing version can be restored.");
  }

  try {
    const publication = await prisma.$transaction(async (tx) => {
      const activeKey = publicationActiveKey({
        seasonId: target.seasonId,
        classificationScope: target.classificationScope,
        className: target.className,
      });
      const now = new Date();
      const previousActive = await tx.standingPublication.findUnique({
        where: { activeKey },
      });
      const publicationVersion = await nextPublicationVersion(activeKey, tx);
      if (previousActive) {
        await tx.standingPublication.update({
          where: { id: previousActive.id },
          data: {
            status: "SUPERSEDED",
            activeKey: null,
            supersededAt: now,
          },
        });
      }
      const restored = await tx.standingPublication.create({
        data: {
          seasonId: target.seasonId,
          classificationScope: target.classificationScope,
          className: target.className,
          calculationSetId: target.calculationSetId,
          calculationSetGroupKey: target.calculationSetGroupKey,
          regulationId: target.regulationId,
          regulationVersion: target.regulationVersion,
          regulationChecksum: target.regulationChecksum,
          snapshotId: target.snapshotId,
          snapshotChecksum: target.snapshotChecksum,
          status: "PUBLISHED",
          activeKey,
          publicationVersion,
          versionKey: `${activeKey}:v${publicationVersion}`,
          rows: target.rows as Prisma.InputJsonValue,
          publishedAt: now,
          publishedByUserId: actor.id,
          publishedByUserEmail: actor.email,
          rollbackOfId: target.id,
        },
      });

      if (previousActive) {
        await tx.standingPublication.update({
          where: { id: previousActive.id },
          data: {
            supersededById: restored.id,
          },
        });
      }

      await createPublicationVersions({
        tx,
        actor,
        publication: restored,
        rows: asRows(target.rows),
        previousActive,
        note,
        action: "ROLLBACK",
      });

      return restored;
    });
    safeRevalidateStandings();
    return {
      ok: true,
      publicationId: publication.id,
      status: "PUBLISHED",
      message: "Standing publication was rolled back.",
    };
  } catch (error) {
    return invalid(sanitizeError(error));
  }
}

async function validatePublishReadiness({
  seed,
  items,
  calculationSetId,
  calculationSetGroupKey,
  expectedProposalCount,
}: {
  seed: NonNullable<Awaited<ReturnType<typeof prisma.connectorReviewItem.findUnique>>> & {
    snapshot: { payloadChecksum: string; id: string };
  };
  items: Array<{
    id: string;
    reviewStatus: string;
    applicationStatus: string;
    suggestedAction: string;
    proposedValues: Prisma.JsonValue | null;
    currentValues: Prisma.JsonValue | null;
    appliedStandingId: string | null;
    currentStandingId: string | null;
    snapshotId: string;
    snapshot: { payloadChecksum: string; id: string };
  }>;
  calculationSetId: string;
  calculationSetGroupKey: string;
  expectedProposalCount: number;
}): Promise<StandingPublicationResult | { ok: true }> {
  if (!items.length || items.length !== expectedProposalCount) {
    return conflict("Calculation set is incomplete and cannot be published.");
  }
  if (items.some((item) => item.suggestedAction === "STANDING_INVALID")) {
    return invalid("Calculation set contains invalid or obsolete Standing blockers.");
  }
  const newerItems = await prisma.connectorReviewItem.findMany({
    where: {
      connectorKey: standingsConnectorKey,
      season: seed.season,
      createdAt: { gte: seed.createdAt },
    },
    select: {
      proposedValues: true,
      reviewStatus: true,
      applicationStatus: true,
    },
  });
  const hasNewerCurrentSet = newerItems.some((item) => {
    const proposed = asRecord(item.proposedValues);
    return (
      getString(proposed, "calculationSetGroupKey") === calculationSetGroupKey &&
      getString(proposed, "calculationSetId") !== calculationSetId &&
      item.reviewStatus !== "REJECTED"
    );
  });
  if (hasNewerCurrentSet) {
    return conflict("A newer unapplied Standing calculation set exists for this scope.");
  }
  if (items.some((item) => item.reviewStatus !== "APPROVED")) {
    return conflict("Every Standing proposal must be approved before publication.");
  }
  if (items.some((item) => item.applicationStatus !== "APPLIED")) {
    return conflict("Every Standing proposal must be applied before publication.");
  }

  const proposal = asRecord(seed.proposedValues);
  const { regulationId, regulationVersion, regulationChecksum } =
    readRegulationReference(proposal);
  if (!regulationId || !regulationVersion || !regulationChecksum) {
    return invalid("Publication requires regulation identity and checksum.");
  }
  const regulation = await prisma.championshipRegulation.findUnique({
    where: { id: regulationId },
    select: {
      id: true,
      status: true,
      archivedAt: true,
      version: true,
      contentChecksum: true,
    },
  });
  if (
    !regulation ||
    regulation.status !== "ACTIVE" ||
    regulation.archivedAt ||
    regulation.version !== regulationVersion ||
    regulation.contentChecksum !== regulationChecksum
  ) {
    return invalid("Regulation changed or is no longer active.");
  }

  return { ok: true };
}

async function buildPublishedRows(
  items: Array<{
    id: string;
    appliedStandingId: string | null;
    currentStandingId: string | null;
    proposedValues: Prisma.JsonValue | null;
    changedFields?: string[];
  }>,
  tx: PrismaTransaction,
) {
  const standingIds = Array.from(
    new Set(
      items
        .map((item) => item.appliedStandingId ?? item.currentStandingId)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const proposalByStandingId = new Map(
    items.flatMap((item) => {
      const standingId = item.appliedStandingId ?? item.currentStandingId;
      return standingId ? [[standingId, item] as const] : [];
    }),
  );
  const standings = await tx.standing.findMany({
    where: { id: { in: standingIds } },
    include: {
      season: { select: { id: true, name: true, year: true } },
      rider: {
        include: {
          country: true,
          currentMotorcycle: { include: { manufacturer: true } },
          teamMemberships: { take: 1, include: { team: true } },
          careerSeasons: {
            include: {
              team: true,
              manufacturer: true,
              motorcycle: { include: { manufacturer: true } },
            },
          },
        },
      },
    },
  });
  if (standings.length !== standingIds.length) {
    throw new Error("Published Standing set is incomplete.");
  }
  const versions = await tx.dataVersion.findMany({
    where: { entityType: "Standing", entityId: { in: standingIds } },
    orderBy: { createdAt: "desc" },
  });
  const latestVersionByStandingId = new Map<string, string>();
  for (const version of versions) {
    if (!latestVersionByStandingId.has(version.entityId)) {
      latestVersionByStandingId.set(version.entityId, version.id);
    }
  }
  return standings
    .map((standing) => {
      const proposalItem = proposalByStandingId.get(standing.id);
      const proposal = asRecord(proposalItem?.proposedValues ?? null);
      assertStandingMatchesProposal(standing, proposal);
      const standingState = toStandingIntegrityState(standing);
      const career =
        standing.rider.careerSeasons.find(
          (item) => item.seasonId === standing.seasonId,
        ) ?? standing.rider.careerSeasons[0];
      const motorcycle = standing.rider.currentMotorcycle ?? career?.motorcycle ?? null;
      const manufacturer = motorcycle?.manufacturer ?? career?.manufacturer ?? null;
      return {
        standingId: standing.id,
        standingDataVersionId: latestVersionByStandingId.get(standing.id) ?? null,
        standingChecksum: stableHash(standingState),
        reviewItemId: proposalItem?.id ?? null,
        calculationSetId: getString(proposal, "calculationSetId"),
        regulationId: readRegulationReference(proposal).regulationId,
        regulationVersion: readRegulationReference(proposal).regulationVersion,
        regulationChecksum: readRegulationReference(proposal).regulationChecksum,
        seasonId: standing.seasonId,
        seasonName: standing.season.name,
        seasonYear: standing.season.year,
        className: standing.className,
        position: standing.position,
        points: standing.points,
        wins: standing.wins,
        podiums: standing.podiums,
        starts: standing.starts,
        dnfs: standing.dnfs,
        riderId: standing.riderId,
        riderName: `${standing.rider.firstName} ${standing.rider.lastName}`,
        riderSlug: standing.rider.slug,
        country: standing.rider.country?.name ?? "Unknown",
        countryCode: standing.rider.country?.isoCode ?? "TBC",
        team:
          standing.rider.teamMemberships[0]?.team.name ??
          career?.team?.name ??
          "Independent",
        manufacturer: manufacturer?.name ?? "TBC",
        motorcycle: motorcycle
          ? `${motorcycle.model}${motorcycle.year ? ` ${motorcycle.year}` : ""}`
          : "TBC",
      };
    })
    .sort(
      (left, right) =>
        (left.position ?? 999_999) - (right.position ?? 999_999) ||
        right.points - left.points ||
        left.riderName.localeCompare(right.riderName),
    );
}

async function nextPublicationVersion(activeKey: string, tx: PrismaTransaction) {
  const latest = await tx.standingPublication.findFirst({
    where: {
      OR: [{ activeKey }, { versionKey: { startsWith: `${activeKey}:v` } }],
    },
    orderBy: { publicationVersion: "desc" },
    select: { publicationVersion: true },
  });
  return (latest?.publicationVersion ?? 0) + 1;
}

function assertStandingMatchesProposal(
  standing: {
    id: string;
    position: number | null;
    points: number;
    wins: number;
    podiums: number;
    starts: number;
    dnfs: number;
  },
  proposal: Record<string, unknown>,
) {
  for (const field of ["position", "points", "wins", "podiums", "starts", "dnfs"]) {
    if (standing[field as keyof typeof standing] !== proposal[field]) {
      throw new Error(
        `Standing ${standing.id} differs from the applied calculation set.`,
      );
    }
  }
}

function toStandingIntegrityState(standing: {
  id: string;
  seasonId: string;
  riderId: string;
  className: string | null;
  position: number | null;
  points: number;
  wins: number;
  podiums: number;
  starts: number;
  dnfs: number;
}) {
  return {
    id: standing.id,
    seasonId: standing.seasonId,
    riderId: standing.riderId,
    className: standing.className,
    position: standing.position,
    points: standing.points,
    wins: standing.wins,
    podiums: standing.podiums,
    starts: standing.starts,
    dnfs: standing.dnfs,
  };
}

async function createPublicationVersions({
  tx,
  actor,
  publication,
  rows,
  previousActive,
  note,
  action = "CREATE",
}: {
  tx: PrismaTransaction;
  actor: PublicationActor;
  publication: { id: string; status: string };
  rows: Array<Record<string, unknown>>;
  previousActive: { id: string; status: string } | null;
  note?: string | null;
  action?: "CREATE" | "ROLLBACK";
}) {
  await tx.dataVersion.create({
    data: {
      entityType: "StandingPublication",
      entityId: publication.id,
      action,
      previous: previousActive
        ? ({
            id: previousActive.id,
            status: previousActive.status,
          } as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      next: {
        id: publication.id,
        status: publication.status,
        rows: rows.length,
        note: note?.trim() || null,
      },
      createdBy: actor.id,
    },
  });

  for (const row of rows) {
    const standingId = String(row.standingId ?? "");
    if (!standingId) continue;
    await tx.dataVersion.create({
      data: {
        entityType: "Standing",
        entityId: standingId,
        action: "MANUAL_EDIT",
        previous: previousActive
          ? ({ publicationId: previousActive.id } as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        next: {
          publicationId: publication.id,
          publicationStatus: publication.status,
        },
        createdBy: actor.id,
      },
    });
  }
}

function readRegulationReference(proposal: Record<string, unknown>) {
  const references = proposal.regulationReferences;
  const first =
    Array.isArray(references) && references[0] && typeof references[0] === "object"
      ? (references[0] as Record<string, unknown>)
      : {};
  return {
    regulationId: getString(first, "id"),
    regulationVersion: getNumber(first, "version"),
    regulationChecksum: getString(first, "checksum"),
  };
}

function publicationActiveKey({
  seasonId,
  classificationScope,
  className,
}: {
  seasonId: string;
  classificationScope: string;
  className: string | null;
}) {
  return `${seasonId}:${classificationScope}:${className ?? "__NULL__"}`;
}

function asRows(value: Prisma.JsonValue): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? [item as Record<string, unknown>]
      : [],
  );
}

function asRecord(value: Prisma.JsonValue | null): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function getString(value: Record<string, unknown>, key: string) {
  const field = value[key];
  return typeof field === "string" && field.trim() ? field.trim() : null;
}

function requiredString(value: Record<string, unknown>, key: string) {
  const field = getString(value, key);
  if (!field) throw new Error(`${key} is required.`);
  return field;
}

function getNumber(value: Record<string, unknown>, key: string) {
  const field = value[key];
  return typeof field === "number" && Number.isFinite(field) ? field : null;
}

function invalid(message: string): StandingPublicationResult {
  return { ok: false, code: "invalid", message };
}

function conflict(message: string): StandingPublicationResult {
  return { ok: false, code: "conflict", message };
}

function notFound(message: string): StandingPublicationResult {
  return { ok: false, code: "not-found", message };
}

function sanitizeError(error: unknown) {
  return error instanceof Error ? error.message : "Standing publication failed.";
}

function safeRevalidateStandings() {
  try {
    revalidatePath("/standings");
  } catch {
    // Publication is already committed at this point. In non-Next validation runners,
    // cache revalidation may be unavailable; the server action path still revalidates.
  }
}

function stableHash(value: unknown) {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
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
