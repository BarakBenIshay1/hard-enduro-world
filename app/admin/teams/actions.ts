"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, type EventVisibility, type TeamStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthSession, type AuthUser } from "@/lib/auth";
import { buildChangedFieldDiffs } from "@/lib/admin/event-cms";
import {
  canManageTeams,
  canPermanentlyDeleteTeams,
  normalizeTeamSlug,
  validateTeamInput,
} from "@/lib/admin/team-cms";
import { isNextRedirect, sanitizeAdminError } from "@/lib/admin/platform";
import { getTeamDeleteEligibility } from "@/db/admin-teams";

type TeamFormInput = {
  name: string;
  slug: string;
  countryId: string | null;
  manufacturerId: string | null;
  officialUrl: string | null;
  managerName: string | null;
  description: string | null;
  status: TeamStatus;
  visibility: EventVisibility;
  logoUrl: string | null;
  galleryImages: string[];
};

export async function createAdminTeam(formData: FormData) {
  const session = await requireTeamManager();
  const parsed = parseTeamForm(formData);
  if (!parsed.ok) redirect(`/admin/teams/new?error=${parsed.error}`);

  const duplicate = await prisma.team.findUnique({
    where: { slug: parsed.input.slug },
    select: { id: true },
  });
  if (duplicate) redirect("/admin/teams/new?error=slug-exists");

  try {
    const team = await prisma.$transaction(async (tx) => {
      const created = await tx.team.create({ data: parsed.input });
      await tx.dataVersion.create({
        data: {
          entityType: "Team",
          entityId: created.id,
          action: "CREATE",
          previous: Prisma.JsonNull,
          next: serializeTeamAudit(created),
          createdBy: session.user.id,
        },
      });
      return created;
    });

    revalidateTeamAdmin(team.id, team.slug);
    redirect(`/admin/teams/${team.id}?saved=created`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Team CMS create failed", sanitizeAdminError(error));
    redirect(`/admin/teams/new?error=${createErrorCode(error)}`);
  }
}

export async function updateAdminTeam(formData: FormData) {
  const session = await requireTeamManager();
  const teamId = stringField(formData, "teamId");
  const parsed = parseTeamForm(formData);
  if (!teamId) redirect("/admin/teams?error=missing-team");
  if (!parsed.ok) redirect(`/admin/teams/${teamId}?error=${parsed.error}`);

  const existing = await prisma.team.findUnique({ where: { id: teamId } });
  if (!existing) redirect("/admin/teams?error=not-found");

  const duplicate = await prisma.team.findFirst({
    where: { slug: parsed.input.slug, NOT: { id: teamId } },
    select: { id: true },
  });
  if (duplicate) redirect(`/admin/teams/${teamId}?error=slug-exists`);

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const team = await tx.team.update({
        where: { id: teamId },
        data: parsed.input,
      });
      const diffs = buildChangedFieldDiffs(
        serializeTeamAudit(existing),
        serializeTeamAudit(team),
      );

      await tx.dataVersion.create({
        data: {
          entityType: "Team",
          entityId: team.id,
          action: "UPDATE",
          previous: serializeTeamAudit(existing),
          next: {
            ...serializeTeamAudit(team),
            changedFields: diffs.map((diff) => diff.field),
            fieldDiffs: diffs,
          },
          createdBy: session.user.id,
        },
      });
      return team;
    });

    revalidateTeamAdmin(updated.id, updated.slug);
    redirect(`/admin/teams/${updated.id}?saved=updated`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Team CMS update failed", sanitizeAdminError(error));
    redirect(`/admin/teams/${teamId}?error=database-unavailable`);
  }
}

export async function archiveAdminTeam(formData: FormData) {
  const session = await requireTeamManager();
  const teamId = stringField(formData, "teamId");
  const confirm = stringField(formData, "confirmArchive") === "on";
  if (!teamId || !confirm) redirect(`/admin/teams/${teamId}?error=archive-confirmation`);

  const existing = await prisma.team.findUnique({ where: { id: teamId } });
  if (!existing) redirect("/admin/teams?error=not-found");

  try {
    const archived = await prisma.$transaction(async (tx) => {
      const team = await tx.team.update({
        where: { id: teamId },
        data: {
          archivedAt: new Date(),
          archivedBy: session.user.id,
          visibility: "PRIVATE",
        },
      });
      const diffs = buildChangedFieldDiffs(
        serializeTeamAudit(existing),
        serializeTeamAudit(team),
      );
      await tx.dataVersion.create({
        data: {
          entityType: "Team",
          entityId: team.id,
          action: "MANUAL_EDIT",
          previous: serializeTeamAudit(existing),
          next: {
            ...serializeTeamAudit(team),
            archived: true,
            changedFields: diffs.map((diff) => diff.field),
            fieldDiffs: diffs,
          },
          createdBy: session.user.id,
        },
      });
      return team;
    });

    revalidateTeamAdmin(archived.id, archived.slug);
    redirect(`/admin/teams/${archived.id}?saved=archived`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Team CMS archive failed", sanitizeAdminError(error));
    redirect(`/admin/teams/${teamId}?error=database-unavailable`);
  }
}

export async function restoreAdminTeam(formData: FormData) {
  const session = await requireTeamManager();
  const teamId = stringField(formData, "teamId");
  const confirm = stringField(formData, "confirmRestore") === "on";
  if (!teamId || !confirm) redirect(`/admin/teams/${teamId}?error=restore-confirmation`);

  const existing = await prisma.team.findUnique({ where: { id: teamId } });
  if (!existing) redirect("/admin/teams?error=not-found");

  try {
    const restored = await prisma.$transaction(async (tx) => {
      const team = await tx.team.update({
        where: { id: teamId },
        data: { archivedAt: null, archivedBy: null, visibility: "DRAFT" },
      });
      const diffs = buildChangedFieldDiffs(
        serializeTeamAudit(existing),
        serializeTeamAudit(team),
      );
      await tx.dataVersion.create({
        data: {
          entityType: "Team",
          entityId: team.id,
          action: "MANUAL_EDIT",
          previous: serializeTeamAudit(existing),
          next: {
            ...serializeTeamAudit(team),
            restored: true,
            changedFields: diffs.map((diff) => diff.field),
            fieldDiffs: diffs,
          },
          createdBy: session.user.id,
        },
      });
      return team;
    });

    revalidateTeamAdmin(restored.id, restored.slug);
    redirect(`/admin/teams/${restored.id}?saved=restored`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Team CMS restore failed", sanitizeAdminError(error));
    redirect(`/admin/teams/${teamId}?error=database-unavailable`);
  }
}

export async function permanentlyDeleteAdminTeam(formData: FormData) {
  const session = await requireTeamOwner();
  const teamId = stringField(formData, "teamId");
  const confirmation = stringField(formData, "deleteConfirmation");
  const reason = stringField(formData, "deleteReason");
  const confirm = stringField(formData, "confirmPermanentDelete") === "on";
  if (!teamId) redirect("/admin/teams?error=missing-team");
  if (!confirm) redirect(`/admin/teams/${teamId}?error=delete-confirmation`);
  if (!reason) redirect(`/admin/teams/${teamId}?error=delete-reason-required`);

  try {
    const deleted = await prisma.$transaction(async (tx) => {
      const eligibility = await getTeamDeleteEligibility(teamId, tx);
      if (!eligibility.team) throw new Error("Team was not found.");
      const team = eligibility.team;
      if (confirmation !== team.slug && confirmation !== team.name) {
        throw new Error("Deletion confirmation does not match the team name or slug.");
      }
      if (!eligibility.eligible) {
        throw new Error(
          `Team is not eligible for deletion: ${eligibility.blockers.join(" ")}`,
        );
      }

      await tx.dataVersion.create({
        data: {
          entityType: "TeamDeletionTombstone",
          entityId: team.id,
          action: "DELETE",
          previous: serializeTeamAudit(team),
          next: {
            deletedTeamId: team.id,
            name: team.name,
            slug: team.slug,
            country: team.country?.name ?? null,
            manufacturer: team.manufacturer?.name ?? null,
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

      await tx.team.delete({ where: { id: team.id } });
      return team;
    });

    revalidateTeamAdmin(deleted.id, deleted.slug);
    redirect("/admin/teams?saved=deleted");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Team CMS permanent delete failed", sanitizeAdminError(error));
    redirect(`/admin/teams/${teamId}?error=${deleteErrorCode(error)}`);
  }
}

function parseTeamForm(
  formData: FormData,
): { ok: true; input: TeamFormInput } | { ok: false; error: string } {
  const name = stringField(formData, "name");
  const slug = normalizeTeamSlug(stringField(formData, "slug") || name);
  const officialUrl = nullableString(formData, "officialUrl");
  const logoUrl = nullableString(formData, "logoUrl");
  const galleryImages = stringField(formData, "galleryImages")
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);
  const visibility = stringField(formData, "visibility") as EventVisibility;
  const status = stringField(formData, "status") as TeamStatus;

  const validationError = validateTeamInput({
    name,
    slug,
    officialUrl,
    logoUrl,
    galleryImages,
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
      manufacturerId: nullableString(formData, "manufacturerId"),
      officialUrl,
      managerName: nullableString(formData, "managerName"),
      description: nullableString(formData, "description"),
      status,
      visibility,
      logoUrl,
      galleryImages,
    },
  };
}

async function requireTeamManager(): Promise<{ user: AuthUser }> {
  const session = await getAuthSession();
  if (!session.user || !canManageTeams(session.role)) {
    redirect("/admin/teams?error=unauthorized");
  }
  return { user: session.user };
}

async function requireTeamOwner(): Promise<{ user: AuthUser }> {
  const session = await getAuthSession();
  if (!session.user || !canPermanentlyDeleteTeams(session.role)) {
    redirect("/admin/teams?error=unauthorized");
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

function serializeTeamAudit(team: {
  id: string;
  countryId: string | null;
  manufacturerId: string | null;
  name: string;
  slug: string;
  officialUrl: string | null;
  managerName: string | null;
  description: string | null;
  status: TeamStatus;
  visibility: EventVisibility;
  logoUrl: string | null;
  galleryImages: string[];
  archivedAt: Date | null;
  archivedBy: string | null;
}) {
  return {
    id: team.id,
    countryId: team.countryId,
    manufacturerId: team.manufacturerId,
    name: team.name,
    slug: team.slug,
    officialUrl: team.officialUrl,
    managerName: team.managerName,
    description: team.description,
    status: team.status,
    visibility: team.visibility,
    logoUrl: team.logoUrl,
    galleryImages: team.galleryImages,
    archivedAt: team.archivedAt?.toISOString() ?? null,
    archivedBy: team.archivedBy,
  };
}

function revalidateTeamAdmin(id: string, slug?: string) {
  revalidatePath("/admin/teams");
  revalidatePath(`/admin/teams/${id}`);
  revalidatePath("/admin/audit");
  if (slug) revalidatePath(`/teams/${slug}`);
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
