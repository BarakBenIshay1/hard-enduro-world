import { roleHasPermission, type AuthPermission } from "@/lib/auth/permissions";
import type { AuthSession, ProtectedArea } from "@/lib/auth/types";

export const protectedAreas: ProtectedArea[] = [
  {
    id: "admin",
    label: "Admin routes",
    href: "/admin/*",
    requiredPermissions: ["admin:view"],
    description: "Base access for all admin pages.",
  },
  {
    id: "review-actions",
    label: "Review actions",
    href: "/admin/review",
    requiredPermissions: ["review:view", "review:approve"],
    description: "Future approve/reject controls for imported changes.",
  },
  {
    id: "import-actions",
    label: "Import actions",
    href: "/admin/imports",
    requiredPermissions: ["imports:view", "imports:manage"],
    description: "Future retry, inspect, or manage import actions.",
  },
  {
    id: "automation-actions",
    label: "Automation actions",
    href: "/admin/automation",
    requiredPermissions: ["automation:view", "automation:manage"],
    description: "Future run, pause, and resume automation controls.",
  },
  {
    id: "calculation-review",
    label: "Calculation review",
    href: "/admin/calculations",
    requiredPermissions: ["calculations:view", "calculations:review"],
    description: "Future approval flow for standings, statistics, and records.",
  },
  {
    id: "settings",
    label: "Settings",
    href: "/admin/settings",
    requiredPermissions: ["settings:view", "settings:manage"],
    description: "Future platform configuration and role management.",
  },
];

export function hasPermission(session: AuthSession, permission: AuthPermission) {
  return (
    session.isAuthenticated &&
    session.user !== null &&
    roleHasPermission(session.role, permission)
  );
}

export function hasAllPermissions(session: AuthSession, permissions: AuthPermission[]) {
  return permissions.every((permission) => hasPermission(session, permission));
}

export function canAccessProtectedArea(session: AuthSession, area: ProtectedArea) {
  return hasAllPermissions(session, area.requiredPermissions);
}
