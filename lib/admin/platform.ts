import type { AuthRole } from "@/lib/auth";

export type AdminPagination = {
  page?: number;
  pageSize?: number;
};

export const defaultAdminPageSize = 12;

export function parseAdminPage(value: string | undefined, fallback = 1) {
  const page = Number(value ?? fallback);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : fallback;
}

export function getAdminPagination(input: AdminPagination = {}) {
  const page = Math.max(input.page ?? 1, 1);
  const pageSize = Math.max(input.pageSize ?? defaultAdminPageSize, 1);
  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
  };
}

export function getAdminTotalPages(total: number, pageSize = defaultAdminPageSize) {
  return Math.max(Math.ceil(total / pageSize), 1);
}

export function canManageEntity(role: AuthRole) {
  return role === "owner" || role === "admin";
}

export function canDeleteEntityPermanently(role: AuthRole) {
  return role === "owner";
}

export function isSafeAdminUrl(value: string | null | undefined) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

export function sanitizeAdminError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown server error.";
  return {
    message: message
      .replace(/postgresql:\/\/\S+/gi, "[redacted-database-url]")
      .replace(/password=\S+/gi, "password=[redacted]"),
  };
}

export function isNextRedirect(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}
