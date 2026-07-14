import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { User } from "@supabase/supabase-js";
import { rolePermissions } from "@/lib/auth/permissions";
import {
  isConfiguredOwnerEmail,
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
    if (isProductionLikeEnvironment()) {
      return getUnauthenticatedSession("error");
    }

    return getDevelopmentFallbackSession();
  }

  if (!supabaseAuth.user) {
    return getUnauthenticatedSession(supabaseAuth.status);
  }

  return getAuthSessionForSupabaseUser(supabaseAuth.user);
}

export async function getAuthSessionForSupabaseUser(
  userFromSupabase: User,
): Promise<AuthSession> {
  const profile = await resolveUserProfileForAuthenticatedUser(userFromSupabase);

  const resolvedRole = resolveRoleFromSupabaseUser(userFromSupabase, profile);
  const user = mapSupabaseUserToAuthUser(userFromSupabase, profile, resolvedRole.role);

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

function isProductionLikeEnvironment() {
  return process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
}

async function resolveUserProfileForAuthenticatedUser(user: User) {
  const existingProfile = await prisma.userProfile.findFirst({
    where: {
      OR: [{ id: user.id }, ...(user.email ? [{ email: user.email }] : [])],
    },
    select: {
      displayName: true,
      email: true,
      role: true,
    },
  });

  if (existingProfile || !isConfiguredOwnerEmail(user.email)) {
    return existingProfile;
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const existingOwner = await tx.userProfile.findFirst({
        where: {
          role: "OWNER",
        },
        select: {
          id: true,
        },
      });

      if (existingOwner) {
        return null;
      }

      const createdProfile = await tx.userProfile.create({
        data: {
          id: user.id,
          email: user.email?.trim().toLowerCase(),
          displayName:
            user.user_metadata?.full_name ??
            user.user_metadata?.name ??
            user.email ??
            "Production Owner",
          role: "OWNER",
        },
        select: {
          displayName: true,
          email: true,
          role: true,
        },
      });

      await tx.dataVersion.create({
        data: {
          entityType: "UserProfile",
          entityId: user.id,
          action: "CREATE",
          previous: Prisma.JsonNull,
          next: {
            email: createdProfile.email,
            role: createdProfile.role,
            reason: "first-owner-bootstrap",
          },
          createdBy: user.id,
        },
      });

      return createdProfile;
    });
  } catch {
    return prisma.userProfile.findFirst({
      where: {
        OR: [{ id: user.id }, ...(user.email ? [{ email: user.email }] : [])],
      },
      select: {
        displayName: true,
        email: true,
        role: true,
      },
    });
  }
}
