import type { EventVisibility, ManufacturerStatus } from "@prisma/client";
import type { AuthRole } from "@/lib/auth";
import {
  canDeleteEntityPermanently,
  canManageEntity,
  isSafeAdminUrl,
} from "@/lib/admin/platform";
import { normalizeEventSlug } from "@/lib/admin/event-cms";

export const manufacturerVisibilities: EventVisibility[] = ["PUBLIC", "DRAFT", "PRIVATE"];
export const manufacturerStatuses: ManufacturerStatus[] = [
  "ACTIVE",
  "HISTORIC",
  "INACTIVE",
];

export type ManufacturerValidationInput = {
  name: string;
  slug: string;
  foundedYear: number | null;
  websiteUrl: string | null;
  logoUrl: string | null;
  visibility: EventVisibility;
  status: ManufacturerStatus;
};

export function canManageManufacturers(role: AuthRole) {
  return canManageEntity(role);
}

export function canPermanentlyDeleteManufacturers(role: AuthRole) {
  return canDeleteEntityPermanently(role);
}

export function normalizeManufacturerSlug(value: string) {
  return normalizeEventSlug(value);
}

export function validateManufacturerInput(input: ManufacturerValidationInput) {
  if (!input.name) return "name-required";
  if (!input.slug) return "slug-required";
  if (!manufacturerVisibilities.includes(input.visibility)) {
    return "invalid-visibility";
  }
  if (!manufacturerStatuses.includes(input.status)) return "invalid-status";
  if (input.websiteUrl && !isSafeAdminUrl(input.websiteUrl)) {
    return "invalid-website-url";
  }
  if (input.logoUrl && !isSafeAdminUrl(input.logoUrl)) return "invalid-logo-url";
  if (
    input.foundedYear !== null &&
    (input.foundedYear < 1880 || input.foundedYear > new Date().getFullYear() + 1)
  ) {
    return "invalid-founded-year";
  }
  return null;
}
