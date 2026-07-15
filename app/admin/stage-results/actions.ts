"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, type ResultStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthSession, type AuthUser } from "@/lib/auth";
import { buildChangedFieldDiffs } from "@/lib/admin/event-cms";
import {
  canManageResults,
  validateResultCmsInput,
  type ResultCmsInput,
} from "@/lib/admin/result-cms";
import { isNextRedirect, sanitizeAdminError } from "@/lib/admin/platform";

export async function updateAdminStageResult(formData: FormData) {
  const session = await requireStageResultManager();
  const stageResultId = stringField(formData, "stageResultId");
  if (!stageResultId) redirect("/admin/stage-results?error=missing-stage-result");

  const existing = await prisma.stageResult.findUnique({
    where: { id: stageResultId },
  });
  if (!existing) redirect("/admin/stage-results?error=not-found");
  if (existing.archivedAt) {
    redirect(`/admin/stage-results/${stageResultId}?error=archived-locked`);
  }

  const parsed = await parseStageResultForm(formData);
  if (!parsed.ok) redirect(`/admin/stage-results/${stageResultId}?error=${parsed.error}`);

  const duplicate = await prisma.stageResult.findFirst({
    where: {
      id: { not: stageResultId },
      stageId: existing.stageId,
      riderId: existing.riderId,
      className: parsed.input.className,
    },
    select: { id: true },
  });
  if (duplicate) {
    redirect(`/admin/stage-results/${stageResultId}?error=duplicate-stage-result`);
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.stageResult.update({
        where: { id: stageResultId },
        data: parsed.input,
      });
      await createStageResultVersion({
        tx,
        action: "UPDATE",
        previous: existing,
        next: result,
        actorId: session.user.id,
      });
      return result;
    });

    revalidateStageResultAdmin(updated.id);
    redirect(`/admin/stage-results/${updated.id}?saved=updated`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Stage Results CMS update failed", sanitizeAdminError(error));
    redirect(`/admin/stage-results/${stageResultId}?error=database-unavailable`);
  }
}

export async function archiveAdminStageResult(formData: FormData) {
  const session = await requireStageResultManager();
  const stageResultId = stringField(formData, "stageResultId");
  const confirm = stringField(formData, "confirmArchive") === "on";
  if (!stageResultId || !confirm) {
    redirect(`/admin/stage-results/${stageResultId}?error=archive-confirmation`);
  }

  const existing = await prisma.stageResult.findUnique({ where: { id: stageResultId } });
  if (!existing) redirect("/admin/stage-results?error=not-found");

  try {
    const archived = await prisma.$transaction(async (tx) => {
      const result = await tx.stageResult.update({
        where: { id: stageResultId },
        data: { archivedAt: new Date(), archivedBy: session.user.id },
      });
      await createStageResultVersion({
        tx,
        action: "MANUAL_EDIT",
        previous: existing,
        next: result,
        actorId: session.user.id,
      });
      return result;
    });

    revalidateStageResultAdmin(archived.id);
    redirect(`/admin/stage-results/${archived.id}?saved=archived`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Stage Results CMS archive failed", sanitizeAdminError(error));
    redirect(`/admin/stage-results/${stageResultId}?error=database-unavailable`);
  }
}

export async function restoreAdminStageResult(formData: FormData) {
  const session = await requireStageResultManager();
  const stageResultId = stringField(formData, "stageResultId");
  const confirm = stringField(formData, "confirmRestore") === "on";
  if (!stageResultId || !confirm) {
    redirect(`/admin/stage-results/${stageResultId}?error=restore-confirmation`);
  }

  const existing = await prisma.stageResult.findUnique({ where: { id: stageResultId } });
  if (!existing) redirect("/admin/stage-results?error=not-found");

  try {
    const restored = await prisma.$transaction(async (tx) => {
      const result = await tx.stageResult.update({
        where: { id: stageResultId },
        data: { archivedAt: null, archivedBy: null },
      });
      await createStageResultVersion({
        tx,
        action: "MANUAL_EDIT",
        previous: existing,
        next: result,
        actorId: session.user.id,
      });
      return result;
    });

    revalidateStageResultAdmin(restored.id);
    redirect(`/admin/stage-results/${restored.id}?saved=restored`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Stage Results CMS restore failed", sanitizeAdminError(error));
    redirect(`/admin/stage-results/${stageResultId}?error=database-unavailable`);
  }
}

async function requireStageResultManager(): Promise<{ user: AuthUser }> {
  const session = await getAuthSession();
  if (!session.user || !canManageResults(session.role)) {
    redirect("/admin/stage-results?error=unauthorized");
  }
  return { user: session.user };
}

async function parseStageResultForm(
  formData: FormData,
): Promise<{ ok: true; input: ResultCmsInput } | { ok: false; error: string }> {
  const input: ResultCmsInput = {
    className: nullableString(formData, "className"),
    overallPosition: parseOptionalInt(stringField(formData, "overallPosition")),
    classPosition: parseOptionalInt(stringField(formData, "classPosition")),
    motorcycleId: nullableString(formData, "motorcycleId"),
    manufacturerId: nullableString(formData, "manufacturerId"),
    totalTimeText: nullableString(formData, "totalTimeText"),
    gapToLeaderText: nullableString(formData, "gapToLeaderText"),
    gapToPreviousText: nullableString(formData, "gapToPreviousText"),
    status: stringField(formData, "status") as ResultStatus,
    notes: nullableString(formData, "notes"),
  };

  if (input.overallPosition === -1 || input.classPosition === -1) {
    return { ok: false, error: "invalid-number" };
  }
  const validationError = validateResultCmsInput(input);
  if (validationError) return { ok: false, error: validationError };

  if (input.motorcycleId) {
    const motorcycle = await prisma.motorcycle.findUnique({
      where: { id: input.motorcycleId },
      select: { id: true },
    });
    if (!motorcycle) return { ok: false, error: "invalid-motorcycle" };
  }
  if (input.manufacturerId) {
    const manufacturer = await prisma.manufacturer.findUnique({
      where: { id: input.manufacturerId },
      select: { id: true },
    });
    if (!manufacturer) return { ok: false, error: "invalid-manufacturer" };
  }

  return { ok: true, input };
}

async function createStageResultVersion({
  tx,
  action,
  previous,
  next,
  actorId,
}: {
  tx: Prisma.TransactionClient;
  action: "UPDATE" | "MANUAL_EDIT";
  previous: StageResultAuditShape;
  next: StageResultAuditShape;
  actorId: string;
}) {
  const previousPayload = serializeStageResultAudit(previous);
  const nextPayload = serializeStageResultAudit(next);
  const diffs = buildChangedFieldDiffs(previousPayload, nextPayload);
  await tx.dataVersion.create({
    data: {
      entityType: "StageResult",
      entityId: next.id,
      action,
      previous: previousPayload,
      next: {
        ...nextPayload,
        changedFields: diffs.map((diff) => diff.field),
        fieldDiffs: diffs,
      },
      createdBy: actorId,
    },
  });
}

type StageResultAuditShape = {
  id: string;
  stageId: string;
  riderId: string;
  motorcycleId: string | null;
  manufacturerId: string | null;
  className: string | null;
  overallPosition: number | null;
  classPosition: number | null;
  totalTimeMs: number | null;
  totalTimeText: string | null;
  gapToLeaderMs: number | null;
  gapToLeaderText: string | null;
  gapToPreviousMs: number | null;
  gapToPreviousText: string | null;
  checkpointsCompleted: number | null;
  penaltiesMs: number | null;
  penaltiesText: string | null;
  bonusTimeMs: number | null;
  bonusTimeText: string | null;
  averageSpeedKmh: Prisma.Decimal | null;
  status: ResultStatus;
  notes: string | null;
  officialRawRow: Prisma.JsonValue | null;
  archivedAt: Date | null;
  archivedBy: string | null;
};

function serializeStageResultAudit(result: StageResultAuditShape) {
  return {
    id: result.id,
    stageId: result.stageId,
    riderId: result.riderId,
    motorcycleId: result.motorcycleId,
    manufacturerId: result.manufacturerId,
    className: result.className,
    overallPosition: result.overallPosition,
    classPosition: result.classPosition,
    totalTimeMs: result.totalTimeMs,
    totalTimeText: result.totalTimeText,
    gapToLeaderMs: result.gapToLeaderMs,
    gapToLeaderText: result.gapToLeaderText,
    gapToPreviousMs: result.gapToPreviousMs,
    gapToPreviousText: result.gapToPreviousText,
    checkpointsCompleted: result.checkpointsCompleted,
    penaltiesMs: result.penaltiesMs,
    penaltiesText: result.penaltiesText,
    bonusTimeMs: result.bonusTimeMs,
    bonusTimeText: result.bonusTimeText,
    averageSpeedKmh: result.averageSpeedKmh?.toString() ?? null,
    status: result.status,
    notes: result.notes,
    officialRawRow: result.officialRawRow,
    archivedAt: result.archivedAt?.toISOString() ?? null,
    archivedBy: result.archivedBy,
  };
}

function revalidateStageResultAdmin(id: string) {
  revalidatePath("/admin/stage-results");
  revalidatePath(`/admin/stage-results/${id}`);
  revalidatePath("/admin/audit");
  revalidatePath("/results");
}

function stringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableString(formData: FormData, key: string) {
  const value = stringField(formData, key);
  return value || null;
}

function parseOptionalInt(value: string): number | null | -1 {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : -1;
}
