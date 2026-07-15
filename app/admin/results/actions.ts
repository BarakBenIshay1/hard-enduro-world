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

export async function updateAdminResult(formData: FormData) {
  const session = await requireResultManager();
  const resultId = stringField(formData, "resultId");
  if (!resultId) redirect("/admin/results?error=missing-result");

  const existing = await prisma.result.findUnique({ where: { id: resultId } });
  if (!existing) redirect("/admin/results?error=not-found");
  if (existing.archivedAt) redirect(`/admin/results/${resultId}?error=archived-locked`);

  const parsed = await parseResultForm(formData);
  if (!parsed.ok) redirect(`/admin/results/${resultId}?error=${parsed.error}`);

  const duplicate = await prisma.result.findFirst({
    where: {
      id: { not: resultId },
      eventId: existing.eventId,
      riderId: existing.riderId,
      className: parsed.input.className,
    },
    select: { id: true },
  });
  if (duplicate) redirect(`/admin/results/${resultId}?error=duplicate-result`);

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.result.update({
        where: { id: resultId },
        data: parsed.input,
      });
      await createResultVersion({
        tx,
        action: "UPDATE",
        previous: existing,
        next: result,
        actorId: session.user.id,
      });
      return result;
    });

    revalidateResultAdmin(updated.id);
    redirect(`/admin/results/${updated.id}?saved=updated`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Results CMS update failed", sanitizeAdminError(error));
    redirect(`/admin/results/${resultId}?error=database-unavailable`);
  }
}

export async function archiveAdminResult(formData: FormData) {
  const session = await requireResultManager();
  const resultId = stringField(formData, "resultId");
  const confirm = stringField(formData, "confirmArchive") === "on";
  if (!resultId || !confirm)
    redirect(`/admin/results/${resultId}?error=archive-confirmation`);

  const existing = await prisma.result.findUnique({ where: { id: resultId } });
  if (!existing) redirect("/admin/results?error=not-found");

  try {
    const archived = await prisma.$transaction(async (tx) => {
      const result = await tx.result.update({
        where: { id: resultId },
        data: { archivedAt: new Date(), archivedBy: session.user.id },
      });
      await createResultVersion({
        tx,
        action: "MANUAL_EDIT",
        previous: existing,
        next: result,
        actorId: session.user.id,
      });
      return result;
    });

    revalidateResultAdmin(archived.id);
    redirect(`/admin/results/${archived.id}?saved=archived`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Results CMS archive failed", sanitizeAdminError(error));
    redirect(`/admin/results/${resultId}?error=database-unavailable`);
  }
}

export async function restoreAdminResult(formData: FormData) {
  const session = await requireResultManager();
  const resultId = stringField(formData, "resultId");
  const confirm = stringField(formData, "confirmRestore") === "on";
  if (!resultId || !confirm)
    redirect(`/admin/results/${resultId}?error=restore-confirmation`);

  const existing = await prisma.result.findUnique({ where: { id: resultId } });
  if (!existing) redirect("/admin/results?error=not-found");

  try {
    const restored = await prisma.$transaction(async (tx) => {
      const result = await tx.result.update({
        where: { id: resultId },
        data: { archivedAt: null, archivedBy: null },
      });
      await createResultVersion({
        tx,
        action: "MANUAL_EDIT",
        previous: existing,
        next: result,
        actorId: session.user.id,
      });
      return result;
    });

    revalidateResultAdmin(restored.id);
    redirect(`/admin/results/${restored.id}?saved=restored`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Results CMS restore failed", sanitizeAdminError(error));
    redirect(`/admin/results/${resultId}?error=database-unavailable`);
  }
}

async function requireResultManager(): Promise<{ user: AuthUser }> {
  const session = await getAuthSession();
  if (!session.user || !canManageResults(session.role)) {
    redirect("/admin/results?error=unauthorized");
  }
  return { user: session.user };
}

async function parseResultForm(
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

async function createResultVersion({
  tx,
  action,
  previous,
  next,
  actorId,
}: {
  tx: Prisma.TransactionClient;
  action: "UPDATE" | "MANUAL_EDIT";
  previous: ResultAuditShape;
  next: ResultAuditShape;
  actorId: string;
}) {
  const previousPayload = serializeResultAudit(previous);
  const nextPayload = serializeResultAudit(next);
  const diffs = buildChangedFieldDiffs(previousPayload, nextPayload);
  await tx.dataVersion.create({
    data: {
      entityType: "Result",
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

type ResultAuditShape = {
  id: string;
  eventId: string;
  riderId: string;
  motorcycleId: string | null;
  manufacturerId: string | null;
  className: string | null;
  overallPosition: number | null;
  classPosition: number | null;
  points: number | null;
  totalTimeMs: number | null;
  totalTimeText: string | null;
  gapToLeaderMs: number | null;
  gapToLeaderText: string | null;
  gapToPreviousMs: number | null;
  gapToPreviousText: string | null;
  penaltiesMs: number | null;
  bonusTimeMs: number | null;
  checkpointsCompleted: number | null;
  averageSpeedKmh: Prisma.Decimal | null;
  status: ResultStatus;
  notes: string | null;
  officialRawRow: Prisma.JsonValue | null;
  archivedAt: Date | null;
  archivedBy: string | null;
};

function serializeResultAudit(result: ResultAuditShape) {
  return {
    id: result.id,
    eventId: result.eventId,
    riderId: result.riderId,
    motorcycleId: result.motorcycleId,
    manufacturerId: result.manufacturerId,
    className: result.className,
    overallPosition: result.overallPosition,
    classPosition: result.classPosition,
    points: result.points,
    totalTimeMs: result.totalTimeMs,
    totalTimeText: result.totalTimeText,
    gapToLeaderMs: result.gapToLeaderMs,
    gapToLeaderText: result.gapToLeaderText,
    gapToPreviousMs: result.gapToPreviousMs,
    gapToPreviousText: result.gapToPreviousText,
    penaltiesMs: result.penaltiesMs,
    bonusTimeMs: result.bonusTimeMs,
    checkpointsCompleted: result.checkpointsCompleted,
    averageSpeedKmh: result.averageSpeedKmh?.toString() ?? null,
    status: result.status,
    notes: result.notes,
    officialRawRow: result.officialRawRow,
    archivedAt: result.archivedAt?.toISOString() ?? null,
    archivedBy: result.archivedBy,
  };
}

function revalidateResultAdmin(id: string) {
  revalidatePath("/admin/results");
  revalidatePath(`/admin/results/${id}`);
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
