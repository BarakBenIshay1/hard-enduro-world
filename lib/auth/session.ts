import { prisma } from "@/lib/prisma";
import { rolePermissions } from "@/lib/auth/permissions";
import {
  mapSupabaseUserToAuthUser,
  resolveRoleFromSupabaseUser,
} from "@/lib/auth/role-mapping";
import type { AuthSession, AuthUser } from "@/lib/auth/types";
import { getSupabaseUserFromRequest } from "@/lib/supabase/auth";

const developmentFallbackUser: AuthUser = {
  id: "development-owner",
  email: process.env.ADMIN_OWNER_EMAIL || "owner@example.com",
  name: "Development Owner",
  role: "owner",
  provider: "development-fallback",
  lastActiveAt: null,
};

export function getUnauthenticatedSession(
  authStatus: AuthSession["authStatus"] = "configured",
): AuthSession {
  return {
    isAuthenticated: false,
    user: null,
    role: "viewer",
    permissions: [],
    provider: "supabase",
    authStatus,
    roleSource: "unauthenticated",
    expiresAt: null,
  };
}

export function getDevelopmentFallbackSession(): AuthSession {
  return {
    isAuthenticated: true,
    user: developmentFallbackUser,
    role: developmentFallbackUser.role,
    permissions: rolePermissions[developmentFallbackUser.role],
    provider: "development-fallback",
    authStatus: "not-configured",
    roleSource: "development-fallback",
    expiresAt: null,
  };
}

export async function getAuthSession(): Promise<AuthSession> {
  const supabaseAuth = await getSupabaseUserFromRequest();

  if (supabaseAuth.status === "not-configured") {
    return getDevelopmentFallbackSession();
  }

  if (!supabaseAuth.user) {
    return getUnauthenticatedSession(supabaseAuth.status);
  }

  const profile = await prisma.userProfile.findFirst({
    where: {
      OR: [
        { id: supabaseAuth.user.id },
        ...(supabaseAuth.user.email ? [{ email: supabaseAuth.user.email }] : []),
      ],
    },
    select: {
      displayName: true,
      email: true,
      role: true,
    },
  });

  const resolvedRole = resolveRoleFromSupabaseUser(supabaseAuth.user, profile);
  const user = mapSupabaseUserToAuthUser(supabaseAuth.user, profile, resolvedRole.role);

  return {
    isAuthenticated: true,
    user,
    role: resolvedRole.role,
    permissions: rolePermissions[resolvedRole.role],
    provider: "supabase",
    authStatus: "configured",
    roleSource: resolvedRole.roleSource,
    expiresAt: null,
  };
}
