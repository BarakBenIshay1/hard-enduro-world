import assert from "node:assert/strict";
import type { User } from "@supabase/supabase-js";
import { config as middlewareConfig } from "@/middleware";
import { getPublicAdminShortcut } from "@/lib/admin/public-menu";
import { resolvePublicAdminShortcut } from "@/lib/admin/public-shortcut";
import { prisma } from "@/lib/prisma";
import { prisma as prismaAgain } from "@/lib/prisma";
import { rolePermissions } from "@/lib/auth/permissions";
import type { AuthRole, AuthSession } from "@/lib/auth";
import { resolveRoleFromSupabaseUser } from "@/lib/auth/role-mapping";
import { resolveAuthSessionFromSupabaseAuth } from "@/lib/auth/session";
import { buildLoginRedirect, sanitizeAdminRedirect } from "@/lib/auth/redirects";
import {
  hasSupabaseAuthCookie,
  supabaseAccessTokenCookie,
  supabaseCodeVerifierCookie,
  supabaseRefreshTokenCookie,
  supabaseStorageKey,
} from "@/lib/supabase/cookies";
import { createCookieStorage } from "@/lib/supabase/server";

const previousOwnerEmail = process.env.ADMIN_OWNER_EMAIL;
process.env.ADMIN_OWNER_EMAIL = "barakbenishay1@gmail.com";

void main();

async function main() {
  try {
    testRedirectSafety();
    testCookieDetection();
    await testLoginLogoutLoginCookieLifecycle();
    await testAnonymousFastPathSkipsProfileLookup();
    await testAuthenticatedUserResolvesProfileOnce();
    await testPublicShortcutFailureFallsBackToHidden();
    testRolePrecedence();
    testPermissions();
    testPrismaSingleton();
    testPublicAdminShortcut();
    testMiddlewareScope();
    console.log("Auth flow tests passed.");
  } finally {
    if (previousOwnerEmail === undefined) {
      delete process.env.ADMIN_OWNER_EMAIL;
    } else {
      process.env.ADMIN_OWNER_EMAIL = previousOwnerEmail;
    }
  }
}

function testRedirectSafety() {
  assert.equal(sanitizeAdminRedirect("/admin/review/123"), "/admin/review/123");
  assert.equal(
    sanitizeAdminRedirect(encodeURIComponent("/admin/review/123?status=PENDING")),
    "/admin/review/123?status=PENDING",
  );
  assert.equal(sanitizeAdminRedirect("https://evil.example/admin"), "/admin");
  assert.equal(sanitizeAdminRedirect("//evil.example/admin"), "/admin");
  assert.equal(sanitizeAdminRedirect("/events"), "/admin");
  assert.equal(buildLoginRedirect("/admin/review"), "/login?next=%2Fadmin%2Freview");
}

function testCookieDetection() {
  assert.equal(hasSupabaseAuthCookie([{ name: "sb-access-token" }]), true);
  assert.equal(hasSupabaseAuthCookie([{ name: "sb-project-auth-token" }]), true);
  assert.equal(hasSupabaseAuthCookie([{ name: supabaseStorageKey }]), false);
  assert.equal(hasSupabaseAuthCookie([{ name: supabaseCodeVerifierCookie }]), false);
  assert.equal(supabaseCodeVerifierCookie, `${supabaseStorageKey}-code-verifier`);
  assert.equal(hasSupabaseAuthCookie([{ name: "session" }]), false);
}

async function testLoginLogoutLoginCookieLifecycle() {
  const jar = createMemoryCookieStore();
  const storage = createCookieStorage(jar);

  await storage.setItem(supabaseCodeVerifierCookie, "first-verifier");
  assert.equal(await storage.getItem(supabaseCodeVerifierCookie), "first-verifier");
  assert.equal(hasSupabaseAuthCookie(jar.getAll()), false);

  jar.set(supabaseAccessTokenCookie, "access-token");
  jar.set(supabaseRefreshTokenCookie, "refresh-token");
  assert.equal(hasSupabaseAuthCookie(jar.getAll()), true);

  jar.delete(supabaseAccessTokenCookie);
  jar.delete(supabaseRefreshTokenCookie);
  await storage.removeItem(supabaseCodeVerifierCookie);
  await storage.removeItem(supabaseStorageKey);
  assert.equal(hasSupabaseAuthCookie(jar.getAll()), false);
  assert.equal(await storage.getItem(supabaseCodeVerifierCookie), null);

  await storage.setItem(supabaseCodeVerifierCookie, "second-verifier");
  assert.equal(await storage.getItem(supabaseCodeVerifierCookie), "second-verifier");
  assert.equal(hasSupabaseAuthCookie(jar.getAll()), false);
}

async function testAnonymousFastPathSkipsProfileLookup() {
  let profileLookups = 0;
  const session = await resolveAuthSessionFromSupabaseAuth(
    {
      status: "configured",
      user: null,
      error: null,
    },
    async () => {
      profileLookups += 1;
      return null;
    },
  );

  assert.equal(session.isAuthenticated, false);
  assert.equal(profileLookups, 0);
}

async function testAuthenticatedUserResolvesProfileOnce() {
  let profileLookups = 0;
  const session = await resolveAuthSessionFromSupabaseAuth(
    {
      status: "configured",
      user: {
        id: "admin-user",
        email: "admin@example.com",
        user_metadata: {},
      } as User,
      error: null,
    },
    async () => {
      profileLookups += 1;
      return {
        displayName: "Admin User",
        email: "admin@example.com",
        role: "ADMIN",
      };
    },
  );

  assert.equal(session.isAuthenticated, true);
  assert.equal(session.role, "admin");
  assert.equal(profileLookups, 1);
}

async function testPublicShortcutFailureFallsBackToHidden() {
  const shortcut = await resolvePublicAdminShortcut(async () => {
    throw new Error("simulated profile lookup failure");
  });

  assert.equal(shortcut, null);
}

function testRolePrecedence() {
  const ownerUser = {
    id: "supabase-owner",
    email: "barakbenishay1@gmail.com",
    user_metadata: {},
  } as User;

  const ownerRole = resolveRoleFromSupabaseUser(ownerUser, null);
  assert.deepEqual(ownerRole, {
    role: "owner",
    roleSource: "admin-owner-email",
  });

  const restrictedProfileRole = resolveRoleFromSupabaseUser(ownerUser, {
    displayName: "Restricted Owner Email",
    email: "barakbenishay1@gmail.com",
    role: "USER",
  });
  assert.deepEqual(restrictedProfileRole, {
    role: "viewer",
    roleSource: "supabase-user-profile",
  });

  const arbitraryUser = {
    id: "supabase-random",
    email: "someone@example.com",
    user_metadata: {},
  } as User;
  assert.equal(resolveRoleFromSupabaseUser(arbitraryUser, null).role, "viewer");
}

function testPermissions() {
  assert.equal(rolePermissions.owner.includes("review:approve"), true);
  assert.equal(rolePermissions.admin.includes("review:approve"), true);
  assert.equal(rolePermissions.reviewer.includes("review:approve"), true);
  assert.equal(rolePermissions.viewer.includes("admin:view"), false);
  assert.equal(rolePermissions.viewer.includes("review:view"), false);
}

function testMiddlewareScope() {
  assert.deepEqual(middlewareConfig.matcher, ["/admin/:path*"]);
}

function testPrismaSingleton() {
  assert.equal(prisma, prismaAgain);
}

function testPublicAdminShortcut() {
  assert.equal(
    getPublicAdminShortcut(session({ role: "viewer", authenticated: false })),
    null,
  );
  assert.equal(getPublicAdminShortcut(session({ role: "viewer" })), null);
  assert.equal(
    getPublicAdminShortcut(session({ role: "owner", authStatus: "not-configured" })),
    null,
  );

  const ownerShortcut = getPublicAdminShortcut(session({ role: "owner" }));
  assert.equal(
    ownerShortcut?.items.some((item) => item.href === "/admin"),
    true,
  );
  assert.equal(
    ownerShortcut?.items.some((item) => item.href === "/admin/review"),
    true,
  );
  assert.equal(
    ownerShortcut?.items.some((item) => item.href === "/admin/jobs"),
    true,
  );
  assert.equal(
    ownerShortcut?.items.some((item) => item.href === "/admin/audit"),
    true,
  );

  const adminShortcut = getPublicAdminShortcut(session({ role: "admin" }));
  assert.equal(
    adminShortcut?.items.some((item) => item.href === "/admin/review"),
    true,
  );

  const reviewerShortcut = getPublicAdminShortcut(session({ role: "reviewer" }));
  assert.deepEqual(
    reviewerShortcut?.items.map((item) => item.href),
    ["/admin", "/admin/review", "/admin/jobs", "/admin/audit"],
  );
}

function session({
  role,
  authenticated = true,
  authStatus = "configured",
}: {
  role: AuthRole;
  authenticated?: boolean;
  authStatus?: AuthSession["authStatus"];
}): AuthSession {
  return {
    isAuthenticated: authenticated,
    user: authenticated
      ? {
          id: `${role}-user`,
          email: `${role}@example.com`,
          name: `${role} User`,
          role,
          provider: "supabase",
          lastActiveAt: null,
        }
      : null,
    role,
    permissions: authenticated ? rolePermissions[role] : [],
    provider: authenticated ? "supabase" : "supabase",
    authStatus,
    roleSource: authenticated ? "supabase-user-profile" : "unauthenticated",
    expiresAt: null,
  };
}

function createMemoryCookieStore() {
  const store = new Map<string, string>();

  return {
    get(name: string) {
      const value = store.get(name);
      return value ? { name, value } : undefined;
    },
    getAll() {
      return Array.from(store.entries()).map(([name, value]) => ({ name, value }));
    },
    set(name: string, value: string) {
      store.set(name, value);
    },
    delete(name: string) {
      store.delete(name);
    },
  };
}
