import { rolePermissions } from "@/lib/auth/permissions";
import type { AuthSession, AuthUser } from "@/lib/auth/types";

const mockUser: AuthUser = {
  id: "mock-owner",
  email: "owner@example.com",
  name: "Demo Owner",
  role: "owner",
  provider: "mock",
  lastActiveAt: new Date("2026-06-22T08:00:00.000Z"),
};

export async function getMockAuthSession(): Promise<AuthSession> {
  return {
    isAuthenticated: true,
    user: mockUser,
    role: mockUser.role,
    permissions: rolePermissions[mockUser.role],
    provider: "mock",
    expiresAt: null,
  };
}

export async function getAuthSession() {
  return getMockAuthSession();
}
