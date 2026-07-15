import type { Metadata } from "next";
import { KeyRound, ShieldCheck, UserCog, Users } from "lucide-react";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import {
  adminCompactTableClass,
  adminTableCardClass,
  adminTableCellClass,
  adminTableHeadClass,
  adminTableHeaderCellClass,
  adminTableMutedCellClass,
  adminTablePrimaryCellClass,
  adminTableScrollClass,
} from "@/components/admin/admin-table-styles";
import { Card } from "@/components/ui/card";
import {
  authRoles,
  databaseRoleToAuthRole,
  getAuthSession,
  mockAdminUsers,
  roleDescriptions,
  rolePermissions,
} from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { getSupabaseAuthReadiness } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Users",
  description: "Admin user and role foundation.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminUsersPage() {
  const session = await getAuthSession();
  const readiness = getSupabaseAuthReadiness();

  return (
    <div className="grid min-w-0 gap-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Users
          </p>
          <h1 className="mt-2 text-3xl font-black lg:text-5xl">
            Admin users and roles foundation
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
            Supabase Auth is now the primary session architecture. User management remains
            read-only until real provider credentials and profile administration are
            enabled.
          </p>
        </div>
        <AdminStatusBadge status={readiness.browserClientReady ? "ready" : "locked"} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Mock Users"
          value={mockAdminUsers.length}
          detail="Local placeholders"
          icon={Users}
        />
        <AdminStatCard
          label="Roles"
          value={authRoles.length}
          detail="Owner to viewer"
          icon={ShieldCheck}
        />
        <AdminStatCard
          label="Permissions"
          value={new Set(Object.values(rolePermissions).flat()).size}
          detail="Typed definitions"
          icon={UserCog}
        />
        <AdminStatCard
          label="Auth Provider"
          value={readiness.status === "configured" ? "Supabase" : "Pending"}
          detail="Google OAuth + email prepared"
          icon={KeyRound}
        />
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Current session
          </p>
          <h2 className="mt-3 text-2xl font-black capitalize">{session.role}</h2>
          <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
            Provider: {session.provider}. Role source:{" "}
            {session.roleSource.replaceAll("-", " ")}.
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Login readiness
          </p>
          <h2 className="mt-3 text-2xl font-black">
            {readiness.status === "configured" ? "Configured" : "Needs env values"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
            Google OAuth and email login are prepared in code and ready for Supabase
            project configuration.
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Activity
          </p>
          <h2 className="mt-3 text-2xl font-black">Audit-ready</h2>
          <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
            User activity can be connected to DataVersion and audit records in a future
            CRUD/action step.
          </p>
        </Card>
      </section>

      <Card className={adminTableCardClass}>
        <div className="border-b border-border p-5">
          <h2 className="text-xl font-black">Supabase role mapping</h2>
          <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
            Supabase authenticates the user. The platform maps that user to
            UserProfile.role for authorization.
          </p>
        </div>
        <div className={adminTableScrollClass}>
          <table className={adminCompactTableClass}>
            <thead className={adminTableHeadClass}>
              <tr>
                {["Database Role", "Platform Role", "Purpose"].map((heading) => (
                  <th key={heading} className={adminTableHeaderCellClass}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(databaseRoleToAuthRole).map(([databaseRole, authRole]) => (
                <tr key={databaseRole} className="border-t border-border">
                  <td className={adminTablePrimaryCellClass}>
                    <span className="font-semibold">{databaseRole}</span>
                  </td>
                  <td className={adminTableCellClass}>{authRole}</td>
                  <td className={adminTableMutedCellClass}>
                    {roleDescriptions[authRole]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className={adminTableCardClass}>
        <div className="border-b border-border p-5">
          <h2 className="text-xl font-black">User list placeholder</h2>
          <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
            Future user management will read from Supabase Auth and platform profiles.
          </p>
        </div>
        <div className={adminTableScrollClass}>
          <table className={adminCompactTableClass}>
            <thead className={adminTableHeadClass}>
              <tr>
                {["Name", "Email", "Role", "Provider", "Last Active", "Activity"].map(
                  (heading) => (
                    <th key={heading} className={adminTableHeaderCellClass}>
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {mockAdminUsers.map((user) => (
                <tr key={user.id} className="border-t border-border">
                  <td className={adminTablePrimaryCellClass}>
                    <span className="font-semibold">{user.name}</span>
                  </td>
                  <td className={adminTableMutedCellClass}>{user.email}</td>
                  <td className={adminTableCellClass}>{user.role}</td>
                  <td className={adminTableCellClass}>{user.provider}</td>
                  <td className={adminTableCellClass}>
                    {user.lastActiveAt ? formatDate(user.lastActiveAt) : "Pending"}
                  </td>
                  <td className={adminTableMutedCellClass}>Activity log placeholder</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <section className="grid gap-4 lg:grid-cols-5">
        {authRoles.map((role) => (
          <Card key={role} className="p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-accent">{role}</p>
            <p className="mt-3 text-sm leading-6 text-foreground/[0.62]">
              {roleDescriptions[role]}
            </p>
            <p className="mt-4 text-2xl font-black">{rolePermissions[role].length}</p>
            <p className="text-xs uppercase tracking-[0.16em] text-foreground/[0.48]">
              Permissions
            </p>
          </Card>
        ))}
      </section>
    </div>
  );
}
