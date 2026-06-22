import type { AuthPermission } from "@/lib/auth/permissions";
import type { AuthRole } from "@/lib/auth/roles";

export type AuthProvider = "mock" | "supabase" | "google-oauth" | "email";

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
  expiresAt: Date | null;
};

export type ProtectedArea = {
  id: string;
  label: string;
  href: string;
  requiredPermissions: AuthPermission[];
  description: string;
};
