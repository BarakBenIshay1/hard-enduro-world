import type { ResultStatus } from "@prisma/client";
import type { AuthRole } from "@/lib/auth";
import { canManageEntity } from "@/lib/admin/platform";

export const resultStatuses: ResultStatus[] = [
  "FINISHED",
  "DNF",
  "DNS",
  "DSQ",
  "UNKNOWN",
];

export type ResultCmsInput = {
  className: string | null;
  overallPosition: number | null;
  classPosition: number | null;
  motorcycleId: string | null;
  manufacturerId: string | null;
  totalTimeText: string | null;
  gapToLeaderText: string | null;
  gapToPreviousText: string | null;
  status: ResultStatus;
  notes: string | null;
};

export function canManageResults(role: AuthRole) {
  return canManageEntity(role);
}

export function validateResultCmsInput(input: ResultCmsInput) {
  if (!resultStatuses.includes(input.status)) return "invalid-status";
  if (input.overallPosition !== null && input.overallPosition < 1) {
    return "invalid-overall-position";
  }
  if (input.classPosition !== null && input.classPosition < 1) {
    return "invalid-class-position";
  }
  if (
    input.status === "DNS" &&
    (input.overallPosition !== null ||
      input.classPosition !== null ||
      input.totalTimeText !== null)
  ) {
    return "dns-position-time";
  }
  if (!isValidTimingText(input.totalTimeText)) return "invalid-total-time";
  if (!isValidTimingText(input.gapToLeaderText)) return "invalid-gap";
  if (!isValidTimingText(input.gapToPreviousText)) return "invalid-gap";
  return null;
}

export function isValidTimingText(value: string | null) {
  if (!value) return true;
  const normalized = value.trim();
  if (!normalized) return true;
  if (["TBC", "DNF", "DNS", "DSQ", "UNKNOWN"].includes(normalized.toUpperCase())) {
    return true;
  }
  return /^(\+)?\d{1,3}(:\d{2}){1,3}(\.\d{1,3})?$/.test(normalized);
}
