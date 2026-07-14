import type { EventVisibility, TeamStatus } from "@prisma/client";
import type { AuthRole } from "@/lib/auth";
import {
  canDeleteEntityPermanently,
  canManageEntity,
  isSafeAdminUrl,
} from "@/lib/admin/platform";
import { normalizeEventSlug } from "@/lib/admin/event-cms";

export const teamVisibilities: EventVisibility[] = ["PUBLIC", "DRAFT", "PRIVATE"];
export const teamStatuses: TeamStatus[] = ["ACTIVE", "HISTORIC", "INACTIVE"];

export type TeamValidationInput = {
  name: string;
  slug: string;
  officialUrl: string | null;
  logoUrl: string | null;
  galleryImages: string[];
  visibility: EventVisibility;
  status: TeamStatus;
};

export function canManageTeams(role: AuthRole) {
  return canManageEntity(role);
}

export function canPermanentlyDeleteTeams(role: AuthRole) {
  return canDeleteEntityPermanently(role);
}

export function normalizeTeamSlug(value: string) {
  return normalizeEventSlug(value);
}

export function validateTeamInput(input: TeamValidationInput) {
  if (!input.name) return "name-required";
  if (!input.slug) return "slug-required";
  if (!teamVisibilities.includes(input.visibility)) return "invalid-visibility";
  if (!teamStatuses.includes(input.status)) return "invalid-status";
  if (input.officialUrl && !isSafeAdminUrl(input.officialUrl)) {
    return "invalid-official-url";
  }
  if (input.logoUrl && !isSafeAdminUrl(input.logoUrl)) return "invalid-logo-url";
  if (input.galleryImages.some((url) => !isSafeAdminUrl(url))) {
    return "invalid-gallery-image";
  }
  return null;
}
