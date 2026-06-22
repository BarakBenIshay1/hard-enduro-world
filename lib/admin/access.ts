export type AdminRole = "owner" | "admin" | "editor" | "reviewer";

export type AdminPermission =
  | "dashboard:view"
  | "content:create"
  | "content:edit"
  | "imports:review"
  | "sources:inspect"
  | "settings:manage";

const rolePermissions: Record<AdminRole, AdminPermission[]> = {
  owner: [
    "dashboard:view",
    "content:create",
    "content:edit",
    "imports:review",
    "sources:inspect",
    "settings:manage",
  ],
  admin: [
    "dashboard:view",
    "content:create",
    "content:edit",
    "imports:review",
    "sources:inspect",
  ],
  editor: ["dashboard:view", "content:create", "content:edit", "sources:inspect"],
  reviewer: ["dashboard:view", "imports:review", "sources:inspect"],
};

export type AdminAccessContext = {
  isAuthenticated: boolean;
  role: AdminRole;
  permissions: AdminPermission[];
};

export async function getAdminAccessContext(): Promise<AdminAccessContext> {
  const role: AdminRole = "owner";

  return {
    isAuthenticated: true,
    role,
    permissions: rolePermissions[role],
  };
}

export function canAccessAdmin(context: AdminAccessContext, permission: AdminPermission) {
  return context.isAuthenticated && context.permissions.includes(permission);
}
