import type { EventVisibility } from "@prisma/client";
import type { AuthRole } from "@/lib/auth";
import {
  canDeleteEntityPermanently,
  canManageEntity,
  isSafeAdminUrl,
} from "@/lib/admin/platform";
import { normalizeEventSlug } from "@/lib/admin/event-cms";

export const riderVisibilities: EventVisibility[] = ["PUBLIC", "DRAFT", "PRIVATE"];

export type RiderValidationInput = {
  firstName: string;
  lastName: string;
  slug: string;
  birthDate: Date | null;
  officialUrl: string | null;
  profileImageUrl: string | null;
  visibility: EventVisibility;
};

export function canManageRiders(role: AuthRole) {
  return canManageEntity(role);
}

export function canPermanentlyDeleteRiders(role: AuthRole) {
  return canDeleteEntityPermanently(role);
}

export function normalizeRiderSlug(value: string) {
  return normalizeEventSlug(value);
}

export function validateRiderInput(input: RiderValidationInput) {
  if (!input.firstName) return "first-name-required";
  if (!input.lastName) return "last-name-required";
  if (!input.slug) return "slug-required";
  if (!riderVisibilities.includes(input.visibility)) return "invalid-visibility";
  if (input.officialUrl && !isSafeAdminUrl(input.officialUrl)) {
    return "invalid-official-url";
  }
  if (input.profileImageUrl && !isSafeAdminUrl(input.profileImageUrl)) {
    return "invalid-profile-image-url";
  }
  if (input.birthDate && input.birthDate > new Date()) return "invalid-birth-date";
  return null;
}
