"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, type EventVisibility } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthSession, type AuthUser } from "@/lib/auth";
import { buildChangedFieldDiffs } from "@/lib/admin/event-cms";
import {
  canManageRiders,
  canPermanentlyDeleteRiders,
  normalizeRiderSlug,
  validateRiderInput,
} from "@/lib/admin/rider-cms";
import { isNextRedirect, sanitizeAdminError } from "@/lib/admin/platform";
import { getRiderDeleteEligibility } from "@/db/admin-riders";

type RiderFormInput = {
  firstName: string;
  lastName: string;
  slug: string;
  countryId: string | null;
  currentMotorcycleId: string | null;
  birthDate: Date | null;
  profileImageUrl: string | null;
  officialUrl: string | null;
  visibility: EventVisibility;
};

export async function createAdminRider(formData: FormData) {
  const session = await requireRiderManager();
  const parsed = parseRiderForm(formData);
  if (!parsed.ok) redirect(`/admin/riders/new?error=${parsed.error}`);

  const duplicate = await prisma.rider.findUnique({
    where: { slug: parsed.input.slug },
    select: { id: true },
  });
  if (duplicate) redirect("/admin/riders/new?error=slug-exists");

  try {
    const rider = await prisma.$transaction(async (tx) => {
      const created = await tx.rider.create({ data: parsed.input });
      await tx.dataVersion.create({
        data: {
          entityType: "Rider",
          entityId: created.id,
          action: "CREATE",
          previous: Prisma.JsonNull,
          next: serializeRiderAudit(created),
          createdBy: session.user.id,
        },
      });
      return created;
    });

    revalidateRiderAdmin(rider.id);
    redirect(`/admin/riders/${rider.id}?saved=created`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Rider CMS create failed", sanitizeAdminError(error));
    redirect(`/admin/riders/new?error=${createErrorCode(error)}`);
  }
}

export async function updateAdminRider(formData: FormData) {
  const session = await requireRiderManager();
  const riderId = stringField(formData, "riderId");
  const parsed = parseRiderForm(formData);
  if (!riderId) redirect("/admin/riders?error=missing-rider");
  if (!parsed.ok) redirect(`/admin/riders/${riderId}?error=${parsed.error}`);

  const existing = await prisma.rider.findUnique({ where: { id: riderId } });
  if (!existing) redirect("/admin/riders?error=not-found");

  const duplicate = await prisma.rider.findFirst({
    where: { slug: parsed.input.slug, NOT: { id: riderId } },
    select: { id: true },
  });
  if (duplicate) redirect(`/admin/riders/${riderId}?error=slug-exists`);

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const rider = await tx.rider.update({
        where: { id: riderId },
        data: parsed.input,
      });
      const diffs = buildChangedFieldDiffs(
        serializeRiderAudit(existing),
        serializeRiderAudit(rider),
      );

      await tx.dataVersion.create({
        data: {
          entityType: "Rider",
          entityId: rider.id,
          action: "UPDATE",
          previous: serializeRiderAudit(existing),
          next: {
            ...serializeRiderAudit(rider),
            changedFields: diffs.map((diff) => diff.field),
            fieldDiffs: diffs,
          },
          createdBy: session.user.id,
        },
      });
      return rider;
    });

    revalidateRiderAdmin(updated.id);
    redirect(`/admin/riders/${updated.id}?saved=updated`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Rider CMS update failed", sanitizeAdminError(error));
    redirect(`/admin/riders/${riderId}?error=database-unavailable`);
  }
}

export async function archiveAdminRider(formData: FormData) {
  const session = await requireRiderManager();
  const riderId = stringField(formData, "riderId");
  const confirm = stringField(formData, "confirmArchive") === "on";
  if (!riderId || !confirm)
    redirect(`/admin/riders/${riderId}?error=archive-confirmation`);

  const existing = await prisma.rider.findUnique({ where: { id: riderId } });
  if (!existing) redirect("/admin/riders?error=not-found");

  try {
    const archived = await prisma.$transaction(async (tx) => {
      const rider = await tx.rider.update({
        where: { id: riderId },
        data: {
          archivedAt: new Date(),
          archivedBy: session.user.id,
          visibility: "PRIVATE",
        },
      });
      const diffs = buildChangedFieldDiffs(
        serializeRiderAudit(existing),
        serializeRiderAudit(rider),
      );
      await tx.dataVersion.create({
        data: {
          entityType: "Rider",
          entityId: rider.id,
          action: "MANUAL_EDIT",
          previous: serializeRiderAudit(existing),
          next: {
            ...serializeRiderAudit(rider),
            archived: true,
            changedFields: diffs.map((diff) => diff.field),
            fieldDiffs: diffs,
          },
          createdBy: session.user.id,
        },
      });
      return rider;
    });

    revalidateRiderAdmin(archived.id);
    redirect(`/admin/riders/${archived.id}?saved=archived`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Rider CMS archive failed", sanitizeAdminError(error));
    redirect(`/admin/riders/${riderId}?error=database-unavailable`);
  }
}

export async function restoreAdminRider(formData: FormData) {
  const session = await requireRiderManager();
  const riderId = stringField(formData, "riderId");
  const confirm = stringField(formData, "confirmRestore") === "on";
  if (!riderId || !confirm)
    redirect(`/admin/riders/${riderId}?error=restore-confirmation`);

  const existing = await prisma.rider.findUnique({ where: { id: riderId } });
  if (!existing) redirect("/admin/riders?error=not-found");

  try {
    const restored = await prisma.$transaction(async (tx) => {
      const rider = await tx.rider.update({
        where: { id: riderId },
        data: { archivedAt: null, archivedBy: null, visibility: "DRAFT" },
      });
      const diffs = buildChangedFieldDiffs(
        serializeRiderAudit(existing),
        serializeRiderAudit(rider),
      );
      await tx.dataVersion.create({
        data: {
          entityType: "Rider",
          entityId: rider.id,
          action: "MANUAL_EDIT",
          previous: serializeRiderAudit(existing),
          next: {
            ...serializeRiderAudit(rider),
            restored: true,
            changedFields: diffs.map((diff) => diff.field),
            fieldDiffs: diffs,
          },
          createdBy: session.user.id,
        },
      });
      return rider;
    });

    revalidateRiderAdmin(restored.id);
    redirect(`/admin/riders/${restored.id}?saved=restored`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Rider CMS restore failed", sanitizeAdminError(error));
    redirect(`/admin/riders/${riderId}?error=database-unavailable`);
  }
}

export async function permanentlyDeleteAdminRider(formData: FormData) {
  const session = await requireRiderOwner();
  const riderId = stringField(formData, "riderId");
  const confirmation = stringField(formData, "deleteConfirmation");
  const reason = stringField(formData, "deleteReason");
  const confirm = stringField(formData, "confirmPermanentDelete") === "on";
  if (!riderId) redirect("/admin/riders?error=missing-rider");
  if (!confirm) redirect(`/admin/riders/${riderId}?error=delete-confirmation`);
  if (!reason) redirect(`/admin/riders/${riderId}?error=delete-reason-required`);

  try {
    const deleted = await prisma.$transaction(async (tx) => {
      const eligibility = await getRiderDeleteEligibility(riderId, tx);
      if (!eligibility.rider) throw new Error("Rider was not found.");
      const rider = eligibility.rider;
      const fullName = `${rider.firstName} ${rider.lastName}`;
      if (confirmation !== rider.slug && confirmation !== fullName) {
        throw new Error("Deletion confirmation does not match the rider name or slug.");
      }
      if (!eligibility.eligible) {
        throw new Error(
          `Rider is not eligible for deletion: ${eligibility.blockers.join(" ")}`,
        );
      }

      await tx.dataVersion.create({
        data: {
          entityType: "RiderDeletionTombstone",
          entityId: rider.id,
          action: "DELETE",
          previous: serializeRiderAudit(rider),
          next: {
            deletedRiderId: rider.id,
            name: fullName,
            slug: rider.slug,
            country: rider.country?.name ?? null,
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

      await tx.rider.delete({ where: { id: rider.id } });
      return rider;
    });

    revalidateRiderAdmin(deleted.id);
    revalidatePath(`/riders/${deleted.slug}`);
    redirect("/admin/riders?saved=deleted");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Rider CMS permanent delete failed", sanitizeAdminError(error));
    redirect(`/admin/riders/${riderId}?error=${deleteErrorCode(error)}`);
  }
}

function parseRiderForm(
  formData: FormData,
): { ok: true; input: RiderFormInput } | { ok: false; error: string } {
  const firstName = stringField(formData, "firstName");
  const lastName = stringField(formData, "lastName");
  const slug = normalizeRiderSlug(
    stringField(formData, "slug") || `${firstName} ${lastName}`,
  );
  const visibility = stringField(formData, "visibility") as EventVisibility;
  const birthDate = parseOptionalDate(stringField(formData, "birthDate"));
  const officialUrl = nullableString(formData, "officialUrl");
  const profileImageUrl = nullableString(formData, "profileImageUrl");

  const validationError = validateRiderInput({
    firstName,
    lastName,
    slug,
    birthDate,
    officialUrl,
    profileImageUrl,
    visibility,
  });
  if (validationError) return { ok: false, error: validationError };

  return {
    ok: true,
    input: {
      firstName,
      lastName,
      slug,
      countryId: nullableString(formData, "countryId"),
      currentMotorcycleId: nullableString(formData, "currentMotorcycleId"),
      birthDate,
      profileImageUrl,
      officialUrl,
      visibility,
    },
  };
}

async function requireRiderManager(): Promise<{ user: AuthUser }> {
  const session = await getAuthSession();
  if (!session.user || !canManageRiders(session.role)) {
    redirect("/admin/riders?error=unauthorized");
  }
  return { user: session.user };
}

async function requireRiderOwner(): Promise<{ user: AuthUser }> {
  const session = await getAuthSession();
  if (!session.user || !canPermanentlyDeleteRiders(session.role)) {
    redirect("/admin/riders?error=unauthorized");
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

function parseOptionalDate(value: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function serializeRiderAudit(rider: {
  id: string;
  countryId: string | null;
  currentMotorcycleId: string | null;
  firstName: string;
  lastName: string;
  slug: string;
  birthDate: Date | null;
  profileImageUrl: string | null;
  officialUrl: string | null;
  visibility: EventVisibility;
  archivedAt: Date | null;
  archivedBy: string | null;
}) {
  return {
    id: rider.id,
    countryId: rider.countryId,
    currentMotorcycleId: rider.currentMotorcycleId,
    firstName: rider.firstName,
    lastName: rider.lastName,
    slug: rider.slug,
    birthDate: rider.birthDate?.toISOString() ?? null,
    profileImageUrl: rider.profileImageUrl,
    officialUrl: rider.officialUrl,
    visibility: rider.visibility,
    archivedAt: rider.archivedAt?.toISOString() ?? null,
    archivedBy: rider.archivedBy,
  };
}

function revalidateRiderAdmin(id: string) {
  revalidatePath("/admin/riders");
  revalidatePath(`/admin/riders/${id}`);
  revalidatePath("/admin/audit");
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
