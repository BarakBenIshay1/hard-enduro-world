export const defaultAdminRedirect = "/admin";

export function sanitizeAdminRedirect(value?: string | null) {
  if (!value) return defaultAdminRedirect;

  let decoded = value.trim();

  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    return defaultAdminRedirect;
  }

  if (!decoded.startsWith("/") || decoded.startsWith("//")) {
    return defaultAdminRedirect;
  }

  if (decoded.includes("\\") || decoded.includes("\n") || decoded.includes("\r")) {
    return defaultAdminRedirect;
  }

  if (!decoded.startsWith("/admin")) {
    return defaultAdminRedirect;
  }

  return decoded;
}

export function buildLoginRedirect(next?: string | null) {
  const destination = sanitizeAdminRedirect(next);
  return `/login?next=${encodeURIComponent(destination)}`;
}
