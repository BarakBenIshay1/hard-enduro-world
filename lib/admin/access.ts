import { getAuthSession, hasPermission } from "@/lib/auth";
import type { AuthPermission, AuthRole, AuthSession } from "@/lib/auth";

export type AdminAccessContext = {
  isAuthenticated: boolean;
  role: AuthRole;
  permissions: AuthPermission[];
  session: AuthSession;
  authStatus: AuthSession["authStatus"];
  shouldRedirectUnauthenticated: boolean;
};

export async function getAdminAccessContext(): Promise<AdminAccessContext> {
  const session = await getAuthSession();

  return {
    isAuthenticated: session.isAuthenticated,
    role: session.role,
    permissions: session.permissions,
    session,
    authStatus: session.authStatus,
    shouldRedirectUnauthenticated:
      session.authStatus === "configured" && !session.isAuthenticated,
  };
}

export function canAccessAdmin(context: AdminAccessContext, permission: AuthPermission) {
  return hasPermission(context.session, permission);
}
