import type { AuthPermission } from "@/lib/auth/permissions";
import type { AuthRole } from "@/lib/auth/roles";

export type AuthProvider = "development-fallback" | "email" | "google-oauth" | "supabase";

export type AuthStatus = "configured" | "error" | "not-configured";

export type AuthRoleSource =
  | "admin-owner-email"
  | "development-fallback"
  | "supabase-user-profile"
  | "unauthenticated";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: AuthRole;
  provider: AuthProvider;
  lastActiveAt: Date | null;
};

export type AuthSession = {
  isAuthenticated: boolean;
  user: AuthUser | null;
  role: AuthRole;
  permissions: AuthPermission[];
  provider: AuthProvider;
  authStatus: AuthStatus;
  roleSource: AuthRoleSource;
  expiresAt: Date | null;
};

export type ProtectedArea = {
  id: string;
  label: string;
  href: string;
  requiredPermissions: AuthPermission[];
  description: string;
};
