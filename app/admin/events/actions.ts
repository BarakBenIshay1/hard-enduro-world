"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, type EventStatus, type EventVisibility } from "@prisma/client";
import { getAuthSession } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";
import {
  buildChangedFieldDiffs,
  canManageEvents,
  canPermanentlyDeleteEvents,
  normalizeEventSlug,
  validateCmsEventInput,
} from "@/lib/admin/event-cms";
import { prisma } from "@/lib/prisma";
import { getEventDeleteEligibility } from "@/db/admin-events";

type EventFormInput = {
  name: string;
  slug: string;
  seasonId: string;
  countryId: string | null;
  city: string | null;
  venue: string | null;
  startDate: Date;
  endDate: Date | null;
  officialUrl: string | null;
  organizer: string | null;
  heroImage: string | null;
  galleryImages: string[];
  description: string | null;
  status: EventStatus;
  visibility: EventVisibility;
};

export async function createAdminEvent(formData: FormData) {
  const session = await requireEventManager();
  const parsed = parseEventForm(formData);

  if (!parsed.ok) {
    redirect(`/admin/events/new?error=${encodeURIComponent(parsed.error)}`);
  }

  const duplicate = await prisma.event.findUnique({
    where: { slug: parsed.input.slug },
    select: { id: true },
  });

  if (duplicate) {
    redirect("/admin/events/new?error=slug-exists");
  }

  try {
    const event = await prisma.$transaction(async (tx) => {
      const created = await tx.event.create({
        data: parsed.input,
        include: {
          season: true,
          country: true,
        },
      });

      await tx.dataVersion.create({
        data: {
          entityType: "Event",
          entityId: created.id,
          action: "CREATE",
          previous: Prisma.JsonNull,
          next: serializeEventAudit(created),
          createdBy: session.user.id,
        },
      });

      return created;
    });

    revalidateEventAdmin(event.id);
    redirect(`/admin/events/${event.id}?saved=created`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Event CMS create failed", sanitizeServerError(error));
    redirect(`/admin/events/new?error=${createErrorCode(error)}`);
  }
}

export async function updateAdminEvent(formData: FormData) {
  const session = await requireEventManager();
  const eventId = stringField(formData, "eventId");
  const parsed = parseEventForm(formData);

  if (!eventId) {
    redirect("/admin/events?error=missing-event");
  }

  if (!parsed.ok) {
    redirect(`/admin/events/${eventId}?error=${encodeURIComponent(parsed.error)}`);
  }

  const existing = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      season: true,
      country: true,
    },
  });

  if (!existing) {
    redirect("/admin/events?error=not-found");
  }

  const duplicate = await prisma.event.findFirst({
    where: {
      slug: parsed.input.slug,
      NOT: { id: eventId },
    },
    select: { id: true },
  });

  if (duplicate) {
    redirect(`/admin/events/${eventId}?error=slug-exists`);
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const event = await tx.event.update({
        where: { id: eventId },
        data: parsed.input,
        include: {
          season: true,
          country: true,
        },
      });

      const diffs = findChangedFieldDiffs(existing, event);

      await tx.dataVersion.create({
        data: {
          entityType: "Event",
          entityId: event.id,
          action: "UPDATE",
          previous: serializeEventAudit(existing),
          next: {
            ...serializeEventAudit(event),
            changedFields: diffs.map((diff) => diff.field),
            fieldDiffs: diffs,
          },
          createdBy: session.user.id,
        },
      });

      return event;
    });

    revalidateEventAdmin(updated.id);
    redirect(`/admin/events/${updated.id}?saved=updated`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Event CMS update failed", sanitizeServerError(error));
    redirect(`/admin/events/${eventId}?error=database-unavailable`);
  }
}

export async function archiveAdminEvent(formData: FormData) {
  const session = await requireEventManager();
  const eventId = stringField(formData, "eventId");
  const confirm = stringField(formData, "confirmArchive") === "on";

  if (!eventId || !confirm) {
    redirect(`/admin/events/${eventId || ""}?error=archive-confirmation`);
  }

  const existing = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      season: true,
      country: true,
    },
  });

  if (!existing) {
    redirect("/admin/events?error=not-found");
  }

  try {
    const archived = await prisma.$transaction(async (tx) => {
      const event = await tx.event.update({
        where: { id: eventId },
        data: {
          archivedAt: new Date(),
          archivedBy: session.user.id,
          visibility: "PRIVATE",
        },
        include: {
          season: true,
          country: true,
        },
      });

      await tx.dataVersion.create({
        data: {
          entityType: "Event",
          entityId: event.id,
          action: "MANUAL_EDIT",
          previous: serializeEventAudit(existing),
          next: {
            ...serializeEventAudit(event),
            archived: true,
            changedFields: ["archivedAt", "archivedBy", "visibility"],
            fieldDiffs: findChangedFieldDiffs(existing, event),
          },
          createdBy: session.user.id,
        },
      });

      return event;
    });

    revalidateEventAdmin(archived.id);
    redirect(`/admin/events/${archived.id}?saved=archived`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Event CMS archive failed", sanitizeServerError(error));
    redirect(`/admin/events/${eventId}?error=database-unavailable`);
  }
}

export async function restoreAdminEvent(formData: FormData) {
  const session = await requireEventManager();
  const eventId = stringField(formData, "eventId");
  const confirm = stringField(formData, "confirmRestore") === "on";

  if (!eventId || !confirm) {
    redirect(`/admin/events/${eventId || ""}?error=restore-confirmation`);
  }

  const existing = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      season: true,
      country: true,
    },
  });

  if (!existing) {
    redirect("/admin/events?error=not-found");
  }

  try {
    const restored = await prisma.$transaction(async (tx) => {
      const event = await tx.event.update({
        where: { id: eventId },
        data: {
          archivedAt: null,
          archivedBy: null,
          visibility: "DRAFT",
        },
        include: {
          season: true,
          country: true,
        },
      });

      await tx.dataVersion.create({
        data: {
          entityType: "Event",
          entityId: event.id,
          action: "MANUAL_EDIT",
          previous: serializeEventAudit(existing),
          next: {
            ...serializeEventAudit(event),
            restored: true,
            changedFields: ["archivedAt", "archivedBy", "visibility"],
            fieldDiffs: findChangedFieldDiffs(existing, event),
          },
          createdBy: session.user.id,
        },
      });

      return event;
    });

    revalidateEventAdmin(restored.id);
    redirect(`/admin/events/${restored.id}?saved=restored`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Event CMS restore failed", sanitizeServerError(error));
    redirect(`/admin/events/${eventId}?error=database-unavailable`);
  }
}

export async function permanentlyDeleteAdminEvent(formData: FormData) {
  const session = await requireEventOwner();
  const eventId = stringField(formData, "eventId");
  const confirmation = stringField(formData, "deleteConfirmation");
  const reason = stringField(formData, "deleteReason");
  const confirm = stringField(formData, "confirmPermanentDelete") === "on";

  if (!eventId) redirect("/admin/events?error=missing-event");
  if (!confirm) redirect(`/admin/events/${eventId}?error=delete-confirmation`);
  if (!reason) redirect(`/admin/events/${eventId}?error=delete-reason-required`);

  try {
    const deleted = await prisma.$transaction(async (tx) => {
      const eligibility = await getEventDeleteEligibility(eventId, tx);
      if (!eligibility.event) throw new Error("Event was not found.");
      const event = eligibility.event;

      if (confirmation !== event.slug && confirmation !== event.name) {
        throw new Error("Deletion confirmation does not match the event name or slug.");
      }
      if (!eligibility.eligible) {
        throw new Error(
          `Event is not eligible for deletion: ${eligibility.blockers.join(" ")}`,
        );
      }

      const finalEvent = serializeEventAudit({
        ...event,
        organizer: event.organizer,
        heroImage: event.heroImage,
        galleryImages: event.galleryImages,
      });

      await tx.dataVersion.create({
        data: {
          entityType: "EventDeletionTombstone",
          entityId: event.id,
          action: "DELETE",
          previous: finalEvent,
          next: {
            deletedEventId: event.id,
            name: event.name,
            slug: event.slug,
            season: event.season.year,
            championship: event.season.name,
            country: event.country?.name ?? null,
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

      await tx.event.delete({ where: { id: event.id } });

      return event;
    });

    revalidateEventAdmin(deleted.id);
    revalidatePath(`/events/${deleted.slug}`);
    redirect("/admin/events?saved=deleted");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Event CMS permanent delete failed", sanitizeServerError(error));
    redirect(`/admin/events/${eventId}?error=${deleteErrorCode(error)}`);
  }
}

function findChangedFieldDiffs(
  previous: Parameters<typeof serializeEventAudit>[0],
  next: Parameters<typeof serializeEventAudit>[0],
) {
  const previousAudit = serializeEventAudit(previous);
  const nextAudit = serializeEventAudit(next);

  return buildChangedFieldDiffs(previousAudit, nextAudit);
}

function parseEventForm(
  formData: FormData,
): { ok: true; input: EventFormInput } | { ok: false; error: string } {
  const name = stringField(formData, "name");
  const slug = normalizeSlug(stringField(formData, "slug") || name);
  const seasonId = stringField(formData, "seasonId");
  const countryId = stringField(formData, "countryId") || null;
  const startDate = parseDate(stringField(formData, "startDate"));
  const endDate = parseOptionalDate(stringField(formData, "endDate"));
  const status = stringField(formData, "status") as EventStatus;
  const visibility = stringField(formData, "visibility") as EventVisibility;
  const officialUrl = nullableString(formData, "officialUrl");
  const heroImage = nullableString(formData, "heroImage");
  const galleryImages = urlListField(formData, "galleryImages");

  const validationError = validateCmsEventInput({
    name,
    slug,
    seasonId,
    startDate,
    endDate,
    status,
    visibility,
    officialUrl,
    heroImage,
    galleryImages,
  });

  if (validationError) return { ok: false, error: validationError };
  if (!startDate) return { ok: false, error: "start-date-required" };

  return {
    ok: true,
    input: {
      name,
      slug,
      seasonId,
      countryId,
      city: nullableString(formData, "city"),
      venue: nullableString(formData, "venue"),
      startDate,
      endDate,
      officialUrl,
      organizer: nullableString(formData, "organizer"),
      heroImage,
      galleryImages,
      description: nullableString(formData, "description"),
      status,
      visibility,
    },
  };
}

async function requireEventManager(): Promise<{ user: AuthUser }> {
  const session = await getAuthSession();

  if (!session.user || !canManageEvents(session.role)) {
    redirect("/admin/events?error=unauthorized");
  }

  return { user: session.user };
}

async function requireEventOwner(): Promise<{ user: AuthUser }> {
  const session = await getAuthSession();

  if (!session.user || !canPermanentlyDeleteEvents(session.role)) {
    redirect("/admin/events?error=unauthorized");
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

function urlListField(formData: FormData, key: string) {
  return stringField(formData, key)
    .split(/\r?\n|,/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseOptionalDate(value: string): Date | null {
  return value ? parseDate(value) : null;
}

const normalizeSlug = normalizeEventSlug;

function serializeEventAudit(event: {
  id: string;
  name: string;
  slug: string;
  seasonId: string;
  countryId: string | null;
  city: string | null;
  venue: string | null;
  startDate: Date;
  endDate: Date | null;
  officialUrl: string | null;
  organizer: string | null;
  heroImage: string | null;
  galleryImages: string[];
  description: string | null;
  status: EventStatus;
  visibility: EventVisibility;
  archivedAt: Date | null;
  archivedBy: string | null;
}) {
  return {
    id: event.id,
    name: event.name,
    slug: event.slug,
    seasonId: event.seasonId,
    countryId: event.countryId,
    city: event.city,
    venue: event.venue,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate?.toISOString() ?? null,
    officialUrl: event.officialUrl,
    organizer: event.organizer,
    heroImage: event.heroImage,
    galleryImages: event.galleryImages,
    description: event.description,
    status: event.status,
    visibility: event.visibility,
    archivedAt: event.archivedAt?.toISOString() ?? null,
    archivedBy: event.archivedBy,
  };
}

function sanitizeServerError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown server error.";
  return {
    message: message
      .replace(/postgresql:\/\/\S+/gi, "[redacted-database-url]")
      .replace(/password=\S+/gi, "password=[redacted]"),
  };
}

function deleteErrorCode(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("confirmation")) return "delete-confirmation-mismatch";
  if (message.includes("not eligible")) return "delete-blocked";
  if (message.includes("not found")) return "not-found";
  return "database-unavailable";
}

function createErrorCode(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("Unique constraint")) return "slug-exists";
  return "database-unavailable";
}

function isNextRedirect(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

function revalidateEventAdmin(id: string) {
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${id}`);
  revalidatePath("/admin/audit");
}
