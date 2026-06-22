export const authRoles = ["owner", "admin", "editor", "reviewer", "viewer"] as const;

export type AuthRole = (typeof authRoles)[number];

export const roleDescriptions: Record<AuthRole, string> = {
  owner:
    "Full platform ownership, security settings, and future billing/deployment control.",
  admin: "Operational administration across sources, imports, automation, and content.",
  editor: "Content and data editing without high-risk approval authority.",
  reviewer: "Import review, source inspection, and audit-oriented workflows.",
  viewer: "Read-only admin visibility for dashboards and operational status.",
};

export function isAuthRole(value: string): value is AuthRole {
  return authRoles.includes(value as AuthRole);
}
