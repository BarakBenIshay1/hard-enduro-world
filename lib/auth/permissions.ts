import type { AuthRole } from "@/lib/auth/roles";

export const authPermissions = [
  "admin:view",
  "sources:view",
  "sources:manage",
  "review:view",
  "review:approve",
  "imports:view",
  "imports:manage",
  "automation:view",
  "automation:manage",
  "calculations:view",
  "calculations:review",
  "settings:view",
  "settings:manage",
  "users:view",
  "users:manage",
] as const;

export type AuthPermission = (typeof authPermissions)[number];

export const permissionDescriptions: Record<AuthPermission, string> = {
  "admin:view": "View admin dashboards and protected admin pages.",
  "sources:view": "Inspect official sources, snapshots, and source links.",
  "sources:manage": "Create or update source definitions in a future CRUD step.",
  "review:view": "View import review queues and proposed changes.",
  "review:approve": "Approve or reject high-risk imported changes in a future step.",
  "imports:view": "View import run history and import status.",
  "imports:manage": "Run, retry, or manage import jobs in a future step.",
  "automation:view": "View automation health, job registry, and dry-run status.",
  "automation:manage": "Pause, resume, or run automation jobs in a future step.",
  "calculations:view": "View calculation and recalculation previews.",
  "calculations:review":
    "Review calculated standings, statistics, and records in a future step.",
  "settings:view": "View system settings and deployment readiness.",
  "settings:manage": "Manage platform settings in a future step.",
  "users:view": "View admin users, roles, and access matrix.",
  "users:manage": "Manage admin users and roles in a future authentication step.",
};

export const rolePermissions: Record<AuthRole, AuthPermission[]> = {
  owner: [...authPermissions],
  admin: [
    "admin:view",
    "sources:view",
    "sources:manage",
    "review:view",
    "review:approve",
    "imports:view",
    "imports:manage",
    "automation:view",
    "automation:manage",
    "calculations:view",
    "calculations:review",
    "settings:view",
    "users:view",
  ],
  editor: [
    "admin:view",
    "sources:view",
    "review:view",
    "imports:view",
    "calculations:view",
    "settings:view",
  ],
  reviewer: [
    "admin:view",
    "sources:view",
    "review:view",
    "review:approve",
    "imports:view",
    "automation:view",
    "calculations:view",
    "calculations:review",
    "settings:view",
  ],
  viewer: [
    "admin:view",
    "sources:view",
    "review:view",
    "imports:view",
    "automation:view",
    "calculations:view",
    "settings:view",
    "users:view",
  ],
};

export function roleHasPermission(role: AuthRole, permission: AuthPermission) {
  return rolePermissions[role].includes(permission);
}
