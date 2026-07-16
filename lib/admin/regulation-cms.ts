import { Prisma, type ChampionshipRegulation } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildChangedFieldDiffs } from "@/lib/admin/event-cms";
import {
  validateOfficialRegulation,
  regulationChecksum,
} from "@/lib/regulations/championship-regulations";

export type RegulationCmsInput = {
  seasonId: string;
  classificationScope: string;
  className: string | null;
  title: string;
  sourceUrl: string;
  regulationYear: number;
  section: string;
  effectiveFrom: Date | null;
  effectiveTo: Date | null;
  verificationDate: Date;
  sourceSnapshotId: string | null;
  contentChecksum: string | null;
  pointsMapping: Prisma.InputJsonValue;
  tieBreakRules: Prisma.InputJsonValue | null;
  notes: string | null;
};

export type RegulationCmsValidationError =
  | "missing-season"
  | "missing-title"
  | "missing-source-url"
  | "invalid-year"
  | "missing-section"
  | "invalid-date"
  | "invalid-json"
  | "invalid-source-snapshot"
  | "active-locked"
  | "invalid-regulation"
  | "duplicate-active-scope";

type RegulationWriteAction =
  | "CREATE"
  | "UPDATE"
  | "ACTIVATE"
  | "DEACTIVATE"
  | "ARCHIVE"
  | "RESTORE"
  | "NEW_VERSION";

export async function createDraftRegulation({
  input,
  actorId,
}: {
  input: RegulationCmsInput;
  actorId: string;
}) {
  await validateRegulationReferences(input);
  return prisma.$transaction(async (tx) => {
    const regulation = await tx.championshipRegulation.create({
      data: {
        ...regulationData(input),
        version: 1,
        status: "DRAFT",
      },
    });
    await writeRegulationVersion(tx, "CREATE", null, regulation, actorId);
    return regulation;
  });
}

export async function updateDraftRegulation({
  id,
  input,
  actorId,
}: {
  id: string;
  input: RegulationCmsInput;
  actorId: string;
}) {
  const existing = await prisma.championshipRegulation.findUnique({ where: { id } });
  if (!existing) throw new Error("Regulation not found.");
  if (existing.status === "ACTIVE") throw new Error("active-locked");
  await validateRegulationReferences(input);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.championshipRegulation.update({
      where: { id },
      data: regulationData(input),
    });
    await writeRegulationVersion(tx, "UPDATE", existing, updated, actorId);
    return updated;
  });
}

export async function activateRegulation({
  id,
  actorId,
}: {
  id: string;
  actorId: string;
}) {
  const existing = await prisma.championshipRegulation.findUnique({ where: { id } });
  if (!existing) throw new Error("Regulation not found.");
  if (existing.archivedAt) throw new Error("Archived regulations cannot activate.");
  const validationIssues = validateOfficialRegulation(existing);
  if (validationIssues.some((issue) => issue.severity === "error")) {
    throw new Error("invalid-regulation");
  }
  const duplicate = await prisma.championshipRegulation.findFirst({
    where: {
      id: { not: id },
      seasonId: existing.seasonId,
      classificationScope: existing.classificationScope,
      className: existing.className,
      status: "ACTIVE",
      archivedAt: null,
    },
    select: { id: true },
  });
  if (duplicate) throw new Error("duplicate-active-scope");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.championshipRegulation.update({
      where: { id },
      data: { status: "ACTIVE" },
    });
    await writeRegulationVersion(tx, "ACTIVATE", existing, updated, actorId);
    return updated;
  });
}

export async function deactivateRegulation({
  id,
  actorId,
}: {
  id: string;
  actorId: string;
}) {
  const existing = await prisma.championshipRegulation.findUnique({ where: { id } });
  if (!existing) throw new Error("Regulation not found.");
  return prisma.$transaction(async (tx) => {
    const updated = await tx.championshipRegulation.update({
      where: { id },
      data: { status: "INACTIVE" },
    });
    await writeRegulationVersion(tx, "DEACTIVATE", existing, updated, actorId);
    return updated;
  });
}

export async function archiveRegulation({
  id,
  actorId,
}: {
  id: string;
  actorId: string;
}) {
  const existing = await prisma.championshipRegulation.findUnique({ where: { id } });
  if (!existing) throw new Error("Regulation not found.");
  return prisma.$transaction(async (tx) => {
    const updated = await tx.championshipRegulation.update({
      where: { id },
      data: {
        status: existing.status === "ACTIVE" ? "INACTIVE" : existing.status,
        archivedAt: new Date(),
        archivedBy: actorId,
      },
    });
    await writeRegulationVersion(tx, "ARCHIVE", existing, updated, actorId);
    return updated;
  });
}

export async function restoreRegulation({
  id,
  actorId,
}: {
  id: string;
  actorId: string;
}) {
  const existing = await prisma.championshipRegulation.findUnique({ where: { id } });
  if (!existing) throw new Error("Regulation not found.");
  return prisma.$transaction(async (tx) => {
    const updated = await tx.championshipRegulation.update({
      where: { id },
      data: { archivedAt: null, archivedBy: null },
    });
    await writeRegulationVersion(tx, "RESTORE", existing, updated, actorId);
    return updated;
  });
}

export async function createRegulationVersion({
  id,
  actorId,
}: {
  id: string;
  actorId: string;
}) {
  const existing = await prisma.championshipRegulation.findUnique({ where: { id } });
  if (!existing) throw new Error("Regulation not found.");
  return prisma.$transaction(async (tx) => {
    const created = await tx.championshipRegulation.create({
      data: {
        seasonId: existing.seasonId,
        classificationScope: existing.classificationScope,
        className: existing.className,
        title: existing.title,
        sourceUrl: existing.sourceUrl,
        regulationYear: existing.regulationYear,
        section: existing.section,
        effectiveFrom: existing.effectiveFrom,
        effectiveTo: existing.effectiveTo,
        verificationDate: existing.verificationDate,
        sourceSnapshotId: existing.sourceSnapshotId,
        contentChecksum: existing.contentChecksum,
        version: existing.version + 1,
        status: "DRAFT",
        pointsMapping: existing.pointsMapping as Prisma.InputJsonValue,
        tieBreakRules:
          existing.tieBreakRules === null
            ? Prisma.JsonNull
            : (existing.tieBreakRules as Prisma.InputJsonValue),
        notes: existing.notes,
      },
    });
    await createRegulationVersionRecord(tx, "NEW_VERSION", existing, created, actorId);
    return created;
  });
}

function regulationData(input: RegulationCmsInput) {
  return {
    ...input,
    tieBreakRules: input.tieBreakRules ?? Prisma.JsonNull,
  };
}

export async function validateRegulationReferences(input: RegulationCmsInput) {
  const season = await prisma.season.findUnique({ where: { id: input.seasonId } });
  if (!season) throw new Error("missing-season");
  if (input.sourceSnapshotId) {
    const snapshot = await prisma.sourceSnapshot.findUnique({
      where: { id: input.sourceSnapshotId },
    });
    if (!snapshot) throw new Error("invalid-source-snapshot");
  }
}

export function parseRegulationCmsInput(
  formData: FormData,
):
  | { ok: true; input: RegulationCmsInput }
  | { ok: false; error: RegulationCmsValidationError } {
  const title = stringField(formData, "title");
  const sourceUrl = stringField(formData, "sourceUrl");
  const section = stringField(formData, "section");
  const seasonId = stringField(formData, "seasonId");
  const regulationYear = Number(stringField(formData, "regulationYear"));
  const verificationDate = parseDate(stringField(formData, "verificationDate"));
  const effectiveFrom = parseOptionalDate(stringField(formData, "effectiveFrom"));
  const effectiveTo = parseOptionalDate(stringField(formData, "effectiveTo"));
  const pointsMapping = parseJson(stringField(formData, "pointsMapping"));
  const tieBreakRulesRaw = stringField(formData, "tieBreakRules");
  const tieBreakRules = tieBreakRulesRaw ? parseJson(tieBreakRulesRaw) : null;

  if (!seasonId) return { ok: false, error: "missing-season" };
  if (!title) return { ok: false, error: "missing-title" };
  if (!sourceUrl) return { ok: false, error: "missing-source-url" };
  if (!Number.isInteger(regulationYear) || regulationYear < 1900) {
    return { ok: false, error: "invalid-year" };
  }
  if (!section) return { ok: false, error: "missing-section" };
  if (!verificationDate || effectiveFrom === false || effectiveTo === false) {
    return { ok: false, error: "invalid-date" };
  }
  if (pointsMapping === false || tieBreakRules === false) {
    return { ok: false, error: "invalid-json" };
  }

  return {
    ok: true,
    input: {
      seasonId,
      classificationScope: stringField(formData, "classificationScope") || "OVERALL",
      className: nullableString(formData, "className"),
      title,
      sourceUrl,
      regulationYear,
      section,
      effectiveFrom,
      effectiveTo,
      verificationDate,
      sourceSnapshotId: nullableString(formData, "sourceSnapshotId"),
      contentChecksum: nullableString(formData, "contentChecksum"),
      pointsMapping,
      tieBreakRules,
      notes: nullableString(formData, "notes"),
    },
  };
}

async function writeRegulationVersion(
  tx: Prisma.TransactionClient,
  action: RegulationWriteAction,
  previous: ChampionshipRegulation | null,
  next: ChampionshipRegulation,
  actorId: string,
) {
  await createRegulationVersionRecord(tx, action, previous, next, actorId);
}

async function createRegulationVersionRecord(
  tx: Prisma.TransactionClient,
  action: RegulationWriteAction,
  previous: ChampionshipRegulation | null,
  next: ChampionshipRegulation,
  actorId: string,
) {
  const previousPayload = previous ? serializeRegulation(previous) : null;
  const nextPayload = serializeRegulation(next);
  const diffs = previousPayload
    ? buildChangedFieldDiffs(previousPayload, nextPayload)
    : [];
  await tx.dataVersion.create({
    data: {
      entityType: "ChampionshipRegulation",
      entityId: next.id,
      action: action === "CREATE" ? "CREATE" : "MANUAL_EDIT",
      previous: (previousPayload ?? null) as Prisma.InputJsonValue,
      next: {
        ...nextPayload,
        operation: action,
        checksum: regulationChecksum(nextPayload),
        changedFields: diffs.map((diff) => diff.field),
        fieldDiffs: diffs,
      },
      sourceUrl: next.sourceUrl,
      createdBy: actorId,
    },
  });
}

function serializeRegulation(regulation: ChampionshipRegulation) {
  return {
    id: regulation.id,
    seasonId: regulation.seasonId,
    classificationScope: regulation.classificationScope,
    className: regulation.className,
    title: regulation.title,
    sourceUrl: regulation.sourceUrl,
    regulationYear: regulation.regulationYear,
    section: regulation.section,
    effectiveFrom: regulation.effectiveFrom?.toISOString() ?? null,
    effectiveTo: regulation.effectiveTo?.toISOString() ?? null,
    verificationDate: regulation.verificationDate.toISOString(),
    sourceSnapshotId: regulation.sourceSnapshotId,
    contentChecksum: regulation.contentChecksum,
    version: regulation.version,
    status: regulation.status,
    pointsMapping: regulation.pointsMapping,
    tieBreakRules: regulation.tieBreakRules,
    notes: regulation.notes,
    archivedAt: regulation.archivedAt?.toISOString() ?? null,
    archivedBy: regulation.archivedBy,
  };
}

function parseJson(value: string) {
  try {
    return JSON.parse(value || "[]") as Prisma.InputJsonValue;
  } catch {
    return false;
  }
}

function parseDate(value: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseOptionalDate(value: string) {
  if (!value) return null;
  return parseDate(value) ?? false;
}

function nullableString(formData: FormData, key: string) {
  return stringField(formData, key) || null;
}

function stringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
