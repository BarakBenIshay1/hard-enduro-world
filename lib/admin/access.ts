import { cache } from "react";
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

export const getAdminAccessContext = cache(
  async function getAdminAccessContext(): Promise<AdminAccessContext> {
    const session = await getAuthSession();

    return {
      isAuthenticated: session.isAuthenticated,
      role: session.role,
      permissions: session.permissions,
      session,
      authStatus: session.authStatus,
      shouldRedirectUnauthenticated:
        session.authStatus !== "not-configured" && !session.isAuthenticated,
    };
  },
);

export function canAccessAdmin(context: AdminAccessContext, permission: AuthPermission) {
  return hasPermission(context.session, permission);
}
