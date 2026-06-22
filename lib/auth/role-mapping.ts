import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "@prisma/client";
import type { AuthRole } from "@/lib/auth/roles";
import type { AuthRoleSource, AuthUser } from "@/lib/auth/types";

export const databaseRoleToAuthRole: Record<string, AuthRole> = {
  OWNER: "owner",
  ADMIN: "admin",
  EDITOR: "editor",
  ANALYST: "reviewer",
  USER: "viewer",
};

export function mapDatabaseRoleToAuthRole(role?: string | null): AuthRole {
  if (!role) {
    return "viewer";
  }

  return databaseRoleToAuthRole[role] ?? "viewer";
}

export function resolveRoleFromSupabaseUser(
  user: User,
  profile: Pick<UserProfile, "displayName" | "email" | "role"> | null,
): { role: AuthRole; roleSource: AuthRoleSource } {
  const ownerEmail = process.env.ADMIN_OWNER_EMAIL?.trim().toLowerCase();
  const userEmail = user.email?.toLowerCase();

  if (ownerEmail && userEmail === ownerEmail) {
    return {
      role: "owner",
      roleSource: "admin-owner-email",
    };
  }

  return {
    role: mapDatabaseRoleToAuthRole(profile?.role),
    roleSource: "supabase-user-profile",
  };
}

export function mapSupabaseUserToAuthUser(
  user: User,
  profile: Pick<UserProfile, "displayName" | "email" | "role"> | null,
  role: AuthRole,
): AuthUser {
  return {
    id: user.id,
    email: profile?.email ?? user.email ?? "unknown@example.com",
    name:
      profile?.displayName ??
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.email ??
      "Supabase User",
    role,
    provider: "supabase",
    lastActiveAt: user.last_sign_in_at ? new Date(user.last_sign_in_at) : null,
  };
}
