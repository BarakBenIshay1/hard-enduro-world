import assert from "node:assert/strict";
import type { User } from "@supabase/supabase-js";
import { config as middlewareConfig } from "@/middleware";
import { rolePermissions } from "@/lib/auth/permissions";
import { resolveRoleFromSupabaseUser } from "@/lib/auth/role-mapping";
import { buildLoginRedirect, sanitizeAdminRedirect } from "@/lib/auth/redirects";
import {
  hasSupabaseAuthCookie,
  supabaseCodeVerifierCookie,
  supabaseStorageKey,
} from "@/lib/supabase/cookies";

const previousOwnerEmail = process.env.ADMIN_OWNER_EMAIL;
process.env.ADMIN_OWNER_EMAIL = "barakbenishay1@gmail.com";

try {
  testRedirectSafety();
  testCookieDetection();
  testRolePrecedence();
  testPermissions();
  testMiddlewareScope();
  console.log("Auth flow tests passed.");
} finally {
  if (previousOwnerEmail === undefined) {
    delete process.env.ADMIN_OWNER_EMAIL;
  } else {
    process.env.ADMIN_OWNER_EMAIL = previousOwnerEmail;
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
  assert.equal(hasSupabaseAuthCookie([{ name: supabaseStorageKey }]), true);
  assert.equal(supabaseCodeVerifierCookie, `${supabaseStorageKey}-code-verifier`);
  assert.equal(hasSupabaseAuthCookie([{ name: "session" }]), false);
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
