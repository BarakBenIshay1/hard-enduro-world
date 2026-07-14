import { getAdminAccessContext } from "@/lib/admin/access";
import {
  getPublicAdminShortcut,
  type PublicAdminShortcut,
} from "@/lib/admin/public-menu";

export async function getPublicAdminShortcutForRequest(): Promise<PublicAdminShortcut | null> {
  return resolvePublicAdminShortcut(getAdminAccessContext);
}

export async function resolvePublicAdminShortcut(
  getAccess: typeof getAdminAccessContext,
): Promise<PublicAdminShortcut | null> {
  try {
    const access = await getAccess();
    const shortcut = getPublicAdminShortcut(access.session);

    logPublicAuthDiagnostic({
      authenticated: access.isAuthenticated,
      role: access.role,
      shortcutVisible: Boolean(shortcut),
    });

    return shortcut;
  } catch {
    logPublicAuthDiagnostic({
      authenticated: false,
      role: "viewer",
      shortcutVisible: false,
      warning: "public-admin-shortcut-unavailable",
    });

    return null;
  }
}

function logPublicAuthDiagnostic(input: {
  authenticated: boolean;
  role: string;
  shortcutVisible: boolean;
  warning?: string;
}) {
  if (process.env.AUTH_DIAGNOSTICS !== "true") {
    return;
  }

  console.warn("[auth]", {
    scope: "public-header",
    authenticated: input.authenticated,
    role: input.authenticated ? input.role : "anonymous",
    shortcutVisible: input.shortcutVisible,
    warning: input.warning ?? null,
  });
}
