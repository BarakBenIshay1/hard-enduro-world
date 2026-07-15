"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  Prisma,
  type EventVisibility,
  type MotorcycleStatus,
  type StrokeType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthSession, type AuthUser } from "@/lib/auth";
import { buildChangedFieldDiffs } from "@/lib/admin/event-cms";
import {
  buildMotorcycleSlug,
  canManageMotorcycles,
  canPermanentlyDeleteMotorcycles,
  normalizeMotorcycleSlug,
  validateMotorcycleInput,
} from "@/lib/admin/motorcycle-cms";
import { isNextRedirect, sanitizeAdminError } from "@/lib/admin/platform";
import { getMotorcycleDeleteEligibility } from "@/db/admin-motorcycles";

type MotorcycleFormInput = {
  manufacturerId: string;
  model: string;
  slug: string;
  year: number | null;
  engineCc: number | null;
  strokeType: StrokeType | null;
  weightKg: Prisma.Decimal | null;
  suspensionFront: string | null;
  suspensionRear: string | null;
  horsepower: Prisma.Decimal | null;
  torqueNm: Prisma.Decimal | null;
  fuelCapacityL: Prisma.Decimal | null;
  transmission: string | null;
  description: string | null;
  heroImage: string | null;
  status: MotorcycleStatus;
  visibility: EventVisibility;
};

export async function createAdminMotorcycle(formData: FormData) {
  const session = await requireMotorcycleManager();
  const parsed = await parseMotorcycleForm(formData, null);
  if (!parsed.ok) redirect(`/admin/motorcycles/new?error=${parsed.error}`);

  const duplicate = await prisma.motorcycle.findUnique({
    where: { slug: parsed.input.slug },
    select: { id: true },
  });
  if (duplicate) redirect("/admin/motorcycles/new?error=slug-exists");

  try {
    const motorcycle = await prisma.$transaction(async (tx) => {
      const created = await tx.motorcycle.create({ data: parsed.input });
      await tx.dataVersion.create({
        data: {
          entityType: "Motorcycle",
          entityId: created.id,
          action: "CREATE",
          previous: Prisma.JsonNull,
          next: serializeMotorcycleAudit(created),
          createdBy: session.user.id,
        },
      });
      return created;
    });

    revalidateMotorcycleAdmin(motorcycle.id, motorcycle.slug);
    redirect(`/admin/motorcycles/${motorcycle.id}?saved=created`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Motorcycle CMS create failed", sanitizeAdminError(error));
    redirect(`/admin/motorcycles/new?error=${createErrorCode(error)}`);
  }
}

export async function updateAdminMotorcycle(formData: FormData) {
  const session = await requireMotorcycleManager();
  const motorcycleId = stringField(formData, "motorcycleId");
  if (!motorcycleId) redirect("/admin/motorcycles?error=missing-motorcycle");

  const existing = await prisma.motorcycle.findUnique({ where: { id: motorcycleId } });
  if (!existing) redirect("/admin/motorcycles?error=not-found");

  const parsed = await parseMotorcycleForm(formData, existing.manufacturerId);
  if (!parsed.ok) redirect(`/admin/motorcycles/${motorcycleId}?error=${parsed.error}`);

  const duplicate = await prisma.motorcycle.findFirst({
    where: { slug: parsed.input.slug, NOT: { id: motorcycleId } },
    select: { id: true },
  });
  if (duplicate) redirect(`/admin/motorcycles/${motorcycleId}?error=slug-exists`);

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const motorcycle = await tx.motorcycle.update({
        where: { id: motorcycleId },
        data: parsed.input,
      });
      const diffs = buildChangedFieldDiffs(
        serializeMotorcycleAudit(existing),
        serializeMotorcycleAudit(motorcycle),
      );

      await tx.dataVersion.create({
        data: {
          entityType: "Motorcycle",
          entityId: motorcycle.id,
          action: "UPDATE",
          previous: serializeMotorcycleAudit(existing),
          next: {
            ...serializeMotorcycleAudit(motorcycle),
            changedFields: diffs.map((diff) => diff.field),
            fieldDiffs: diffs,
          },
          createdBy: session.user.id,
        },
      });
      return motorcycle;
    });

    revalidateMotorcycleAdmin(updated.id, updated.slug);
    redirect(`/admin/motorcycles/${updated.id}?saved=updated`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Motorcycle CMS update failed", sanitizeAdminError(error));
    redirect(`/admin/motorcycles/${motorcycleId}?error=database-unavailable`);
  }
}

export async function archiveAdminMotorcycle(formData: FormData) {
  const session = await requireMotorcycleManager();
  const motorcycleId = stringField(formData, "motorcycleId");
  const confirm = stringField(formData, "confirmArchive") === "on";
  if (!motorcycleId || !confirm) {
    redirect(`/admin/motorcycles/${motorcycleId}?error=archive-confirmation`);
  }

  const existing = await prisma.motorcycle.findUnique({ where: { id: motorcycleId } });
  if (!existing) redirect("/admin/motorcycles?error=not-found");

  try {
    const archived = await prisma.$transaction(async (tx) => {
      const motorcycle = await tx.motorcycle.update({
        where: { id: motorcycleId },
        data: {
          archivedAt: new Date(),
          archivedBy: session.user.id,
          visibility: "PRIVATE",
        },
      });
      const diffs = buildChangedFieldDiffs(
        serializeMotorcycleAudit(existing),
        serializeMotorcycleAudit(motorcycle),
      );
      await tx.dataVersion.create({
        data: {
          entityType: "Motorcycle",
          entityId: motorcycle.id,
          action: "MANUAL_EDIT",
          previous: serializeMotorcycleAudit(existing),
          next: {
            ...serializeMotorcycleAudit(motorcycle),
            archived: true,
            changedFields: diffs.map((diff) => diff.field),
            fieldDiffs: diffs,
          },
          createdBy: session.user.id,
        },
      });
      return motorcycle;
    });

    revalidateMotorcycleAdmin(archived.id, archived.slug);
    redirect(`/admin/motorcycles/${archived.id}?saved=archived`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Motorcycle CMS archive failed", sanitizeAdminError(error));
    redirect(`/admin/motorcycles/${motorcycleId}?error=database-unavailable`);
  }
}

export async function restoreAdminMotorcycle(formData: FormData) {
  const session = await requireMotorcycleManager();
  const motorcycleId = stringField(formData, "motorcycleId");
  const confirm = stringField(formData, "confirmRestore") === "on";
  if (!motorcycleId || !confirm) {
    redirect(`/admin/motorcycles/${motorcycleId}?error=restore-confirmation`);
  }

  const existing = await prisma.motorcycle.findUnique({ where: { id: motorcycleId } });
  if (!existing) redirect("/admin/motorcycles?error=not-found");

  try {
    const restored = await prisma.$transaction(async (tx) => {
      const motorcycle = await tx.motorcycle.update({
        where: { id: motorcycleId },
        data: { archivedAt: null, archivedBy: null, visibility: "DRAFT" },
      });
      const diffs = buildChangedFieldDiffs(
        serializeMotorcycleAudit(existing),
        serializeMotorcycleAudit(motorcycle),
      );
      await tx.dataVersion.create({
        data: {
          entityType: "Motorcycle",
          entityId: motorcycle.id,
          action: "MANUAL_EDIT",
          previous: serializeMotorcycleAudit(existing),
          next: {
            ...serializeMotorcycleAudit(motorcycle),
            restored: true,
            changedFields: diffs.map((diff) => diff.field),
            fieldDiffs: diffs,
          },
          createdBy: session.user.id,
        },
      });
      return motorcycle;
    });

    revalidateMotorcycleAdmin(restored.id, restored.slug);
    redirect(`/admin/motorcycles/${restored.id}?saved=restored`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Motorcycle CMS restore failed", sanitizeAdminError(error));
    redirect(`/admin/motorcycles/${motorcycleId}?error=database-unavailable`);
  }
}

export async function permanentlyDeleteAdminMotorcycle(formData: FormData) {
  const session = await requireMotorcycleOwner();
  const motorcycleId = stringField(formData, "motorcycleId");
  const confirmation = stringField(formData, "deleteConfirmation");
  const reason = stringField(formData, "deleteReason");
  const confirm = stringField(formData, "confirmPermanentDelete") === "on";
  if (!motorcycleId) redirect("/admin/motorcycles?error=missing-motorcycle");
  if (!confirm) redirect(`/admin/motorcycles/${motorcycleId}?error=delete-confirmation`);
  if (!reason) {
    redirect(`/admin/motorcycles/${motorcycleId}?error=delete-reason-required`);
  }

  try {
    const deleted = await prisma.$transaction(async (tx) => {
      const eligibility = await getMotorcycleDeleteEligibility(motorcycleId, tx);
      if (!eligibility.motorcycle) throw new Error("Motorcycle was not found.");
      const motorcycle = eligibility.motorcycle;
      if (confirmation !== motorcycle.slug && confirmation !== motorcycle.model) {
        throw new Error(
          "Deletion confirmation does not match the motorcycle model or slug.",
        );
      }
      if (!eligibility.eligible) {
        throw new Error(
          `Motorcycle is not eligible for deletion: ${eligibility.blockers.join(" ")}`,
        );
      }

      await tx.dataVersion.create({
        data: {
          entityType: "MotorcycleDeletionTombstone",
          entityId: motorcycle.id,
          action: "DELETE",
          previous: serializeMotorcycleAudit(motorcycle),
          next: {
            deletedMotorcycleId: motorcycle.id,
            model: motorcycle.model,
            slug: motorcycle.slug,
            manufacturer: motorcycle.manufacturer.name,
            origin: eligibility.origin,
            deletedByUserId: session.user.id,
            deletedByEmail: session.user.email,
            deletedAt: new Date().toISOString(),
            deletionReason: reason,
            dependencyCheck: eligibility,
          },
          createdBy: session.user.id,
        },
      });

      await tx.motorcycle.delete({ where: { id: motorcycle.id } });
      return motorcycle;
    });

    revalidateMotorcycleAdmin(deleted.id, deleted.slug);
    redirect("/admin/motorcycles?saved=deleted");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Motorcycle CMS permanent delete failed", sanitizeAdminError(error));
    redirect(`/admin/motorcycles/${motorcycleId}?error=${deleteErrorCode(error)}`);
  }
}

async function parseMotorcycleForm(
  formData: FormData,
  allowedArchivedManufacturerId: string | null,
): Promise<{ ok: true; input: MotorcycleFormInput } | { ok: false; error: string }> {
  const manufacturerId = stringField(formData, "manufacturerId");
  const manufacturer = manufacturerId
    ? await prisma.manufacturer.findUnique({
        where: { id: manufacturerId },
        select: { name: true, archivedAt: true },
      })
    : null;
  if (!manufacturer) return { ok: false, error: "manufacturer-required" };
  if (manufacturer.archivedAt && manufacturerId !== allowedArchivedManufacturerId) {
    return { ok: false, error: "manufacturer-archived" };
  }

  const model = stringField(formData, "model");
  const year = parseOptionalInt(stringField(formData, "year"));
  const strokeValue = stringField(formData, "strokeType");
  const strokeType = strokeValue ? (strokeValue as StrokeType) : null;
  const visibility = stringField(formData, "visibility") as EventVisibility;
  const status = stringField(formData, "status") as MotorcycleStatus;
  const heroImage = nullableString(formData, "heroImage");
  const weightKg = parseOptionalDecimal(stringField(formData, "weightKg"));
  const horsepower = parseOptionalDecimal(stringField(formData, "horsepower"));
  const torqueNm = parseOptionalDecimal(stringField(formData, "torqueNm"));
  const fuelCapacityL = parseOptionalDecimal(stringField(formData, "fuelCapacityL"));
  const engineCc = parseOptionalInt(stringField(formData, "engineCc"));

  if (
    engineCc === "invalid" ||
    year === "invalid" ||
    weightKg === "invalid" ||
    horsepower === "invalid" ||
    torqueNm === "invalid" ||
    fuelCapacityL === "invalid"
  ) {
    return { ok: false, error: "invalid-number" };
  }

  const slug = normalizeMotorcycleSlug(
    stringField(formData, "slug") ||
      buildMotorcycleSlug({ manufacturerName: manufacturer.name, model, year }),
  );

  const validationError = validateMotorcycleInput({
    manufacturerId,
    model,
    slug,
    year,
    engineCc,
    strokeType,
    weightKg,
    horsepower,
    torqueNm,
    fuelCapacityL,
    heroImage,
    visibility,
    status,
  });
  if (validationError) return { ok: false, error: validationError };

  return {
    ok: true,
    input: {
      manufacturerId,
      model,
      slug,
      year,
      engineCc,
      strokeType,
      weightKg: decimalOrNull(weightKg),
      suspensionFront: nullableString(formData, "suspensionFront"),
      suspensionRear: nullableString(formData, "suspensionRear"),
      horsepower: decimalOrNull(horsepower),
      torqueNm: decimalOrNull(torqueNm),
      fuelCapacityL: decimalOrNull(fuelCapacityL),
      transmission: nullableString(formData, "transmission"),
      description: nullableString(formData, "description"),
      heroImage,
      status,
      visibility,
    },
  };
}

async function requireMotorcycleManager(): Promise<{ user: AuthUser }> {
  const session = await getAuthSession();
  if (!session.user || !canManageMotorcycles(session.role)) {
    redirect("/admin/motorcycles?error=unauthorized");
  }
  return { user: session.user };
}

async function requireMotorcycleOwner(): Promise<{ user: AuthUser }> {
  const session = await getAuthSession();
  if (!session.user || !canPermanentlyDeleteMotorcycles(session.role)) {
    redirect("/admin/motorcycles?error=unauthorized");
  }
  return { user: session.user };
}

function stringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableString(formData: FormData, key: string) {
  const value = stringField(formData, key);
  return value || null;
}

function parseOptionalInt(value: string): number | null | "invalid" {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : "invalid";
}

function parseOptionalDecimal(value: string): number | null | "invalid" {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : "invalid";
}

function decimalOrNull(value: number | null) {
  return value === null ? null : new Prisma.Decimal(value);
}

function serializeMotorcycleAudit(motorcycle: {
  id: string;
  manufacturerId: string;
  model: string;
  slug: string;
  year: number | null;
  engineCc: number | null;
  strokeType: StrokeType | null;
  weightKg: Prisma.Decimal | null;
  suspensionFront: string | null;
  suspensionRear: string | null;
  horsepower: Prisma.Decimal | null;
  torqueNm: Prisma.Decimal | null;
  fuelCapacityL: Prisma.Decimal | null;
  transmission: string | null;
  description: string | null;
  heroImage: string | null;
  status: MotorcycleStatus;
  visibility: EventVisibility;
  archivedAt: Date | null;
  archivedBy: string | null;
}) {
  return {
    id: motorcycle.id,
    manufacturerId: motorcycle.manufacturerId,
    model: motorcycle.model,
    slug: motorcycle.slug,
    year: motorcycle.year,
    engineCc: motorcycle.engineCc,
    strokeType: motorcycle.strokeType,
    weightKg: motorcycle.weightKg?.toString() ?? null,
    suspensionFront: motorcycle.suspensionFront,
    suspensionRear: motorcycle.suspensionRear,
    horsepower: motorcycle.horsepower?.toString() ?? null,
    torqueNm: motorcycle.torqueNm?.toString() ?? null,
    fuelCapacityL: motorcycle.fuelCapacityL?.toString() ?? null,
    transmission: motorcycle.transmission,
    description: motorcycle.description,
    heroImage: motorcycle.heroImage,
    status: motorcycle.status,
    visibility: motorcycle.visibility,
    archivedAt: motorcycle.archivedAt?.toISOString() ?? null,
    archivedBy: motorcycle.archivedBy,
  };
}

function revalidateMotorcycleAdmin(id: string, slug?: string) {
  revalidatePath("/admin/motorcycles");
  revalidatePath(`/admin/motorcycles/${id}`);
  revalidatePath("/admin/audit");
  revalidatePath("/motorcycles");
  if (slug) revalidatePath(`/motorcycles/${slug}`);
}

function createErrorCode(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("Unique constraint")) return "slug-exists";
  return "database-unavailable";
}

function deleteErrorCode(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("confirmation")) return "delete-confirmation-mismatch";
  if (message.includes("not eligible")) return "delete-blocked";
  if (message.includes("not found")) return "not-found";
  return "database-unavailable";
}
