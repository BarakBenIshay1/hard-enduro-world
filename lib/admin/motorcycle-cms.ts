import type { EventVisibility, MotorcycleStatus, StrokeType } from "@prisma/client";
import type { AuthRole } from "@/lib/auth";
import {
  canDeleteEntityPermanently,
  canManageEntity,
  isSafeAdminUrl,
} from "@/lib/admin/platform";
import { normalizeEventSlug } from "@/lib/admin/event-cms";

export const motorcycleVisibilities: EventVisibility[] = ["PUBLIC", "DRAFT", "PRIVATE"];
export const motorcycleStatuses: MotorcycleStatus[] = ["ACTIVE", "HISTORIC", "INACTIVE"];
export const motorcycleStrokeTypes: StrokeType[] = ["TWO_STROKE", "FOUR_STROKE"];

export type MotorcycleValidationInput = {
  manufacturerId: string;
  model: string;
  slug: string;
  year: number | null;
  engineCc: number | null;
  strokeType: StrokeType | null;
  weightKg: number | null;
  horsepower: number | null;
  torqueNm: number | null;
  fuelCapacityL: number | null;
  heroImage: string | null;
  visibility: EventVisibility;
  status: MotorcycleStatus;
};

export function canManageMotorcycles(role: AuthRole) {
  return canManageEntity(role);
}

export function canPermanentlyDeleteMotorcycles(role: AuthRole) {
  return canDeleteEntityPermanently(role);
}

export function normalizeMotorcycleSlug(value: string) {
  return normalizeEventSlug(value);
}

export function buildMotorcycleSlug({
  manufacturerName,
  model,
  year,
}: {
  manufacturerName: string;
  model: string;
  year: number | null;
}) {
  return normalizeMotorcycleSlug(
    [manufacturerName, model, year ? String(year) : ""].filter(Boolean).join(" "),
  );
}

export function validateMotorcycleInput(input: MotorcycleValidationInput) {
  if (!input.manufacturerId) return "manufacturer-required";
  if (!input.model) return "model-required";
  if (!input.slug) return "slug-required";
  if (!motorcycleVisibilities.includes(input.visibility)) return "invalid-visibility";
  if (!motorcycleStatuses.includes(input.status)) return "invalid-status";
  if (input.strokeType && !motorcycleStrokeTypes.includes(input.strokeType)) {
    return "invalid-stroke-type";
  }
  if (input.heroImage && !isSafeAdminUrl(input.heroImage)) return "invalid-hero-image";
  if (
    input.year !== null &&
    (input.year < 1960 || input.year > new Date().getFullYear() + 2)
  ) {
    return "invalid-model-year";
  }
  if (input.engineCc !== null && input.engineCc < 0) return "invalid-engine";
  if (input.weightKg !== null && input.weightKg < 0) return "invalid-weight";
  if (input.horsepower !== null && input.horsepower < 0) return "invalid-power";
  if (input.torqueNm !== null && input.torqueNm < 0) return "invalid-torque";
  if (input.fuelCapacityL !== null && input.fuelCapacityL < 0) {
    return "invalid-fuel-capacity";
  }
  return null;
}
