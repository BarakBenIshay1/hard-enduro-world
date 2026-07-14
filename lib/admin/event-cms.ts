import type { EventStatus, EventVisibility } from "@prisma/client";
import type { AuthRole } from "@/lib/auth";

export const manageableEventRoles: AuthRole[] = ["owner", "admin"];
export const cmsEventStatuses: EventStatus[] = [
  "SCHEDULED",
  "LIVE",
  "SUSPENDED",
  "COMPLETED",
  "CANCELLED",
];
export const cmsEventVisibilities: EventVisibility[] = ["PUBLIC", "DRAFT", "PRIVATE"];

export type CmsEventValidationInput = {
  name: string;
  slug: string;
  seasonId: string;
  startDate: Date | null;
  endDate: Date | null;
  status: EventStatus;
  visibility: EventVisibility;
  officialUrl: string | null;
  heroImage?: string | null;
  galleryImages?: string[];
};

export function canManageEvents(role: AuthRole) {
  return manageableEventRoles.includes(role);
}

export function canPermanentlyDeleteEvents(role: AuthRole) {
  return role === "owner";
}

export function normalizeEventSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function validateCmsEventInput(input: CmsEventValidationInput) {
  if (!input.name) return "name-required";
  if (!input.slug) return "slug-required";
  if (!input.seasonId) return "season-required";
  if (!input.startDate) return "start-date-required";
  if (input.endDate && input.endDate < input.startDate) return "invalid-date-range";
  if (!cmsEventStatuses.includes(input.status)) return "invalid-status";
  if (!cmsEventVisibilities.includes(input.visibility)) return "invalid-visibility";
  if (input.officialUrl && !isSafeUrl(input.officialUrl)) {
    return "invalid-official-url";
  }
  if (input.heroImage && !isSafeUrl(input.heroImage)) {
    return "invalid-hero-image";
  }
  if ((input.galleryImages ?? []).some((url) => !isSafeUrl(url))) {
    return "invalid-gallery-image";
  }

  return null;
}

export function findChangedCmsFields<T extends Record<string, unknown>>(
  previous: T,
  next: T,
) {
  return Object.keys(next).filter(
    (key) => stableNormalize(previous[key]) !== stableNormalize(next[key]),
  );
}

export function buildChangedFieldDiffs<T extends Record<string, unknown>>(
  previous: T,
  next: T,
) {
  return findChangedCmsFields(previous, next).map((field) => ({
    field,
    oldValue: normalizeDisplayValue(previous[field]),
    newValue: normalizeDisplayValue(next[field]),
  }));
}

function isSafeUrl(value: string) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function stableNormalize(value: unknown): string {
  return JSON.stringify(normalizeValue(value));
}

function normalizeValue(value: unknown): unknown {
  if (value === undefined || value === null) return null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const timestamp = Date.parse(trimmed);
    if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed) && !Number.isNaN(timestamp)) {
      return new Date(timestamp).toISOString();
    }
    return trimmed;
  }

  if (value instanceof Date) return value.toISOString();

  if (Array.isArray(value)) {
    return value.map(normalizeValue).filter(Boolean).sort();
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [key, normalizeValue(record[key])]),
    );
  }

  return value;
}

function normalizeDisplayValue(value: unknown) {
  const normalized = normalizeValue(value);
  if (normalized === null || normalized === undefined) return null;
  return normalized;
}
