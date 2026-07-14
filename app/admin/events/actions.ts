"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, type EventStatus, type EventVisibility } from "@prisma/client";
import { getAuthSession } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";
import {
  canManageEvents,
  findChangedCmsFields,
  normalizeEventSlug,
  validateCmsEventInput,
} from "@/lib/admin/event-cms";
import { prisma } from "@/lib/prisma";

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

  const updated = await prisma.$transaction(async (tx) => {
    const event = await tx.event.update({
      where: { id: eventId },
      data: parsed.input,
      include: {
        season: true,
        country: true,
      },
    });

    await tx.dataVersion.create({
      data: {
        entityType: "Event",
        entityId: event.id,
        action: "UPDATE",
        previous: serializeEventAudit(existing),
        next: {
          ...serializeEventAudit(event),
          changedFields: findChangedFields(existing, event),
        },
        createdBy: session.user.id,
      },
    });

    return event;
  });

  revalidateEventAdmin(updated.id);
  redirect(`/admin/events/${updated.id}?saved=updated`);
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
        },
        createdBy: session.user.id,
      },
    });

    return event;
  });

  revalidateEventAdmin(archived.id);
  redirect(`/admin/events/${archived.id}?saved=archived`);
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

function findChangedFields(
  previous: Parameters<typeof serializeEventAudit>[0],
  next: Parameters<typeof serializeEventAudit>[0],
) {
  const previousAudit = serializeEventAudit(previous);
  const nextAudit = serializeEventAudit(next);

  return findChangedCmsFields(previousAudit, nextAudit);
}

function revalidateEventAdmin(id: string) {
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${id}`);
  revalidatePath("/admin/audit");
}
