import { hasPermission } from "@/lib/auth";
import type { AuthPermission, AuthSession } from "@/lib/auth";

export type PublicAdminMenuItem = {
  label: string;
  href: string;
  permission: AuthPermission;
};

export type PublicAdminShortcut = {
  role: AuthSession["role"];
  initials: string;
  items: PublicAdminMenuItem[];
};

const candidateItems: PublicAdminMenuItem[] = [
  {
    label: "Admin Dashboard",
    href: "/admin",
    permission: "admin:view",
  },
  {
    label: "Review",
    href: "/admin/review",
    permission: "review:view",
  },
  {
    label: "Jobs",
    href: "/admin/jobs",
    permission: "automation:view",
  },
  {
    label: "Audit",
    href: "/admin/audit",
    permission: "sources:view",
  },
];

export function getPublicAdminShortcut(session: AuthSession): PublicAdminShortcut | null {
  if (
    !session.isAuthenticated ||
    !session.user ||
    session.authStatus !== "configured" ||
    !hasPermission(session, "admin:view")
  ) {
    return null;
  }

  const items = candidateItems.filter((item) => hasPermission(session, item.permission));

  if (items.length === 0) {
    return null;
  }

  return {
    role: session.role,
    initials: getInitials(session.user.name || session.user.email),
    items,
  };
}

function getInitials(value: string) {
  const parts = value
    .split(/[\s@._-]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  return (parts[0]?.[0] ?? "A").concat(parts[1]?.[0] ?? "").toUpperCase();
}
