"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, type EventVisibility, type ManufacturerStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthSession, type AuthUser } from "@/lib/auth";
import { buildChangedFieldDiffs } from "@/lib/admin/event-cms";
import {
  canManageManufacturers,
  canPermanentlyDeleteManufacturers,
  normalizeManufacturerSlug,
  validateManufacturerInput,
} from "@/lib/admin/manufacturer-cms";
import { isNextRedirect, sanitizeAdminError } from "@/lib/admin/platform";
import { getManufacturerDeleteEligibility } from "@/db/admin-manufacturers";

type ManufacturerFormInput = {
  name: string;
  slug: string;
  countryId: string | null;
  foundedYear: number | null;
  websiteUrl: string | null;
  description: string | null;
  status: ManufacturerStatus;
  visibility: EventVisibility;
  logoUrl: string | null;
};

export async function createAdminManufacturer(formData: FormData) {
  const session = await requireManufacturerManager();
  const parsed = parseManufacturerForm(formData);
  if (!parsed.ok) redirect(`/admin/manufacturers/new?error=${parsed.error}`);

  const duplicate = await prisma.manufacturer.findUnique({
    where: { slug: parsed.input.slug },
    select: { id: true },
  });
  if (duplicate) redirect("/admin/manufacturers/new?error=slug-exists");

  try {
    const manufacturer = await prisma.$transaction(async (tx) => {
      const created = await tx.manufacturer.create({ data: parsed.input });
      await tx.dataVersion.create({
        data: {
          entityType: "Manufacturer",
          entityId: created.id,
          action: "CREATE",
          previous: Prisma.JsonNull,
          next: serializeManufacturerAudit(created),
          createdBy: session.user.id,
        },
      });
      return created;
    });

    revalidateManufacturerAdmin(manufacturer.id, manufacturer.slug);
    redirect(`/admin/manufacturers/${manufacturer.id}?saved=created`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Manufacturer CMS create failed", sanitizeAdminError(error));
    redirect(`/admin/manufacturers/new?error=${createErrorCode(error)}`);
  }
}

export async function updateAdminManufacturer(formData: FormData) {
  const session = await requireManufacturerManager();
  const manufacturerId = stringField(formData, "manufacturerId");
  const parsed = parseManufacturerForm(formData);
  if (!manufacturerId) redirect("/admin/manufacturers?error=missing-manufacturer");
  if (!parsed.ok) {
    redirect(`/admin/manufacturers/${manufacturerId}?error=${parsed.error}`);
  }

  const existing = await prisma.manufacturer.findUnique({
    where: { id: manufacturerId },
  });
  if (!existing) redirect("/admin/manufacturers?error=not-found");

  const duplicate = await prisma.manufacturer.findFirst({
    where: { slug: parsed.input.slug, NOT: { id: manufacturerId } },
    select: { id: true },
  });
  if (duplicate) redirect(`/admin/manufacturers/${manufacturerId}?error=slug-exists`);

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const manufacturer = await tx.manufacturer.update({
        where: { id: manufacturerId },
        data: parsed.input,
      });
      const diffs = buildChangedFieldDiffs(
        serializeManufacturerAudit(existing),
        serializeManufacturerAudit(manufacturer),
      );

      await tx.dataVersion.create({
        data: {
          entityType: "Manufacturer",
          entityId: manufacturer.id,
          action: "UPDATE",
          previous: serializeManufacturerAudit(existing),
          next: {
            ...serializeManufacturerAudit(manufacturer),
            changedFields: diffs.map((diff) => diff.field),
            fieldDiffs: diffs,
          },
          createdBy: session.user.id,
        },
      });
      return manufacturer;
    });

    revalidateManufacturerAdmin(updated.id, updated.slug);
    redirect(`/admin/manufacturers/${updated.id}?saved=updated`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Manufacturer CMS update failed", sanitizeAdminError(error));
    redirect(`/admin/manufacturers/${manufacturerId}?error=database-unavailable`);
  }
}

export async function archiveAdminManufacturer(formData: FormData) {
  const session = await requireManufacturerManager();
  const manufacturerId = stringField(formData, "manufacturerId");
  const confirm = stringField(formData, "confirmArchive") === "on";
  if (!manufacturerId || !confirm) {
    redirect(`/admin/manufacturers/${manufacturerId}?error=archive-confirmation`);
  }

  const existing = await prisma.manufacturer.findUnique({
    where: { id: manufacturerId },
  });
  if (!existing) redirect("/admin/manufacturers?error=not-found");

  try {
    const archived = await prisma.$transaction(async (tx) => {
      const manufacturer = await tx.manufacturer.update({
        where: { id: manufacturerId },
        data: {
          archivedAt: new Date(),
          archivedBy: session.user.id,
          visibility: "PRIVATE",
        },
      });
      const diffs = buildChangedFieldDiffs(
        serializeManufacturerAudit(existing),
        serializeManufacturerAudit(manufacturer),
      );
      await tx.dataVersion.create({
        data: {
          entityType: "Manufacturer",
          entityId: manufacturer.id,
          action: "MANUAL_EDIT",
          previous: serializeManufacturerAudit(existing),
          next: {
            ...serializeManufacturerAudit(manufacturer),
            archived: true,
            changedFields: diffs.map((diff) => diff.field),
            fieldDiffs: diffs,
          },
          createdBy: session.user.id,
        },
      });
      return manufacturer;
    });

    revalidateManufacturerAdmin(archived.id, archived.slug);
    redirect(`/admin/manufacturers/${archived.id}?saved=archived`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Manufacturer CMS archive failed", sanitizeAdminError(error));
    redirect(`/admin/manufacturers/${manufacturerId}?error=database-unavailable`);
  }
}

export async function restoreAdminManufacturer(formData: FormData) {
  const session = await requireManufacturerManager();
  const manufacturerId = stringField(formData, "manufacturerId");
  const confirm = stringField(formData, "confirmRestore") === "on";
  if (!manufacturerId || !confirm) {
    redirect(`/admin/manufacturers/${manufacturerId}?error=restore-confirmation`);
  }

  const existing = await prisma.manufacturer.findUnique({
    where: { id: manufacturerId },
  });
  if (!existing) redirect("/admin/manufacturers?error=not-found");

  try {
    const restored = await prisma.$transaction(async (tx) => {
      const manufacturer = await tx.manufacturer.update({
        where: { id: manufacturerId },
        data: { archivedAt: null, archivedBy: null, visibility: "DRAFT" },
      });
      const diffs = buildChangedFieldDiffs(
        serializeManufacturerAudit(existing),
        serializeManufacturerAudit(manufacturer),
      );
      await tx.dataVersion.create({
        data: {
          entityType: "Manufacturer",
          entityId: manufacturer.id,
          action: "MANUAL_EDIT",
          previous: serializeManufacturerAudit(existing),
          next: {
            ...serializeManufacturerAudit(manufacturer),
            restored: true,
            changedFields: diffs.map((diff) => diff.field),
            fieldDiffs: diffs,
          },
          createdBy: session.user.id,
        },
      });
      return manufacturer;
    });

    revalidateManufacturerAdmin(restored.id, restored.slug);
    redirect(`/admin/manufacturers/${restored.id}?saved=restored`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Manufacturer CMS restore failed", sanitizeAdminError(error));
    redirect(`/admin/manufacturers/${manufacturerId}?error=database-unavailable`);
  }
}

export async function permanentlyDeleteAdminManufacturer(formData: FormData) {
  const session = await requireManufacturerOwner();
  const manufacturerId = stringField(formData, "manufacturerId");
  const confirmation = stringField(formData, "deleteConfirmation");
  const reason = stringField(formData, "deleteReason");
  const confirm = stringField(formData, "confirmPermanentDelete") === "on";
  if (!manufacturerId) redirect("/admin/manufacturers?error=missing-manufacturer");
  if (!confirm) {
    redirect(`/admin/manufacturers/${manufacturerId}?error=delete-confirmation`);
  }
  if (!reason) {
    redirect(`/admin/manufacturers/${manufacturerId}?error=delete-reason-required`);
  }

  try {
    const deleted = await prisma.$transaction(async (tx) => {
      const eligibility = await getManufacturerDeleteEligibility(manufacturerId, tx);
      if (!eligibility.manufacturer) throw new Error("Manufacturer was not found.");
      const manufacturer = eligibility.manufacturer;
      if (confirmation !== manufacturer.slug && confirmation !== manufacturer.name) {
        throw new Error(
          "Deletion confirmation does not match the manufacturer name or slug.",
        );
      }
      if (!eligibility.eligible) {
        throw new Error(
          `Manufacturer is not eligible for deletion: ${eligibility.blockers.join(" ")}`,
        );
      }

      await tx.dataVersion.create({
        data: {
          entityType: "ManufacturerDeletionTombstone",
          entityId: manufacturer.id,
          action: "DELETE",
          previous: serializeManufacturerAudit(manufacturer),
          next: {
            deletedManufacturerId: manufacturer.id,
            name: manufacturer.name,
            slug: manufacturer.slug,
            country: manufacturer.country?.name ?? null,
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

      await tx.manufacturer.delete({ where: { id: manufacturer.id } });
      return manufacturer;
    });

    revalidateManufacturerAdmin(deleted.id, deleted.slug);
    redirect("/admin/manufacturers?saved=deleted");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Manufacturer CMS permanent delete failed", sanitizeAdminError(error));
    redirect(`/admin/manufacturers/${manufacturerId}?error=${deleteErrorCode(error)}`);
  }
}

function parseManufacturerForm(
  formData: FormData,
): { ok: true; input: ManufacturerFormInput } | { ok: false; error: string } {
  const name = stringField(formData, "name");
  const slug = normalizeManufacturerSlug(stringField(formData, "slug") || name);
  const foundedYear = parseOptionalInt(stringField(formData, "foundedYear"));
  const websiteUrl = nullableString(formData, "websiteUrl");
  const logoUrl = nullableString(formData, "logoUrl");
  const visibility = stringField(formData, "visibility") as EventVisibility;
  const status = stringField(formData, "status") as ManufacturerStatus;

  const validationError = validateManufacturerInput({
    name,
    slug,
    foundedYear,
    websiteUrl,
    logoUrl,
    visibility,
    status,
  });
  if (validationError) return { ok: false, error: validationError };

  return {
    ok: true,
    input: {
      name,
      slug,
      countryId: nullableString(formData, "countryId"),
      foundedYear,
      websiteUrl,
      description: nullableString(formData, "description"),
      status,
      visibility,
      logoUrl,
    },
  };
}

async function requireManufacturerManager(): Promise<{ user: AuthUser }> {
  const session = await getAuthSession();
  if (!session.user || !canManageManufacturers(session.role)) {
    redirect("/admin/manufacturers?error=unauthorized");
  }
  return { user: session.user };
}

async function requireManufacturerOwner(): Promise<{ user: AuthUser }> {
  const session = await getAuthSession();
  if (!session.user || !canPermanentlyDeleteManufacturers(session.role)) {
    redirect("/admin/manufacturers?error=unauthorized");
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

function parseOptionalInt(value: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function serializeManufacturerAudit(manufacturer: {
  id: string;
  countryId: string | null;
  name: string;
  slug: string;
  foundedYear: number | null;
  websiteUrl: string | null;
  description: string | null;
  status: ManufacturerStatus;
  visibility: EventVisibility;
  logoUrl: string | null;
  archivedAt: Date | null;
  archivedBy: string | null;
}) {
  return {
    id: manufacturer.id,
    countryId: manufacturer.countryId,
    name: manufacturer.name,
    slug: manufacturer.slug,
    foundedYear: manufacturer.foundedYear,
    websiteUrl: manufacturer.websiteUrl,
    description: manufacturer.description,
    status: manufacturer.status,
    visibility: manufacturer.visibility,
    logoUrl: manufacturer.logoUrl,
    archivedAt: manufacturer.archivedAt?.toISOString() ?? null,
    archivedBy: manufacturer.archivedBy,
  };
}

function revalidateManufacturerAdmin(id: string, slug?: string) {
  revalidatePath("/admin/manufacturers");
  revalidatePath(`/admin/manufacturers/${id}`);
  revalidatePath("/admin/audit");
  if (slug) revalidatePath(`/manufacturers/${slug}`);
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
