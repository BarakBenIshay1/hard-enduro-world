import type { Metadata } from "next";
import { LockKeyhole, Route, ShieldCheck, TableProperties } from "lucide-react";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Card } from "@/components/ui/card";
import {
  authPermissions,
  authRoles,
  permissionDescriptions,
  protectedAreas,
  roleHasPermission,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Security",
  description: "Admin authentication and authorization foundation.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AdminSecurityPage() {
  return (
    <div className="grid gap-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Security
          </p>
          <h1 className="mt-2 text-3xl font-black lg:text-5xl">
            Authentication and access matrix
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
            Route protection and permission architecture prepared for future Supabase
            Auth, Google OAuth, and email login. Current access uses mock session logic.
          </p>
        </div>
        <AdminStatusBadge status="review" />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Roles"
          value={authRoles.length}
          detail="Owner, admin, editor, reviewer, viewer"
          icon={ShieldCheck}
        />
        <AdminStatCard
          label="Permissions"
          value={authPermissions.length}
          detail="Typed controls"
          icon={LockKeyhole}
        />
        <AdminStatCard
          label="Protected Areas"
          value={protectedAreas.length}
          detail="Routes and future actions"
          icon={Route}
        />
        <AdminStatCard
          label="Access Matrix"
          value="Ready"
          detail="Preview only"
          icon={TableProperties}
        />
      </section>

      <Card className="overflow-hidden">
        <div className="border-b border-border p-5">
          <h2 className="text-xl font-black">Protected areas</h2>
          <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
            Route guards are prepared for admin routes, review actions, import actions,
            automation actions, calculations, and settings.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-black text-xs uppercase tracking-[0.18em] text-white/[0.64]">
              <tr>
                {["Area", "Route", "Required Permissions", "Purpose"].map((heading) => (
                  <th key={heading} className="px-5 py-4 font-semibold">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {protectedAreas.map((area) => (
                <tr key={area.id} className="border-t border-border">
                  <td className="px-5 py-4 font-semibold">{area.label}</td>
                  <td className="px-5 py-4">{area.href}</td>
                  <td className="px-5 py-4">{area.requiredPermissions.join(", ")}</td>
                  <td className="px-5 py-4 text-foreground/[0.62]">{area.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-border p-5">
          <h2 className="text-xl font-black">Access matrix</h2>
          <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
            Permission definitions are centralized and can be enforced by future server
            actions and route handlers.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-black text-xs uppercase tracking-[0.18em] text-white/[0.64]">
              <tr>
                <th className="px-5 py-4 font-semibold">Permission</th>
                {authRoles.map((role) => (
                  <th key={role} className="px-5 py-4 font-semibold">
                    {role}
                  </th>
                ))}
                <th className="px-5 py-4 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody>
              {authPermissions.map((permission) => (
                <tr key={permission} className="border-t border-border">
                  <td className="px-5 py-4 font-semibold">{permission}</td>
                  {authRoles.map((role) => (
                    <td key={`${role}-${permission}`} className="px-5 py-4">
                      {roleHasPermission(role, permission) ? "Yes" : "-"}
                    </td>
                  ))}
                  <td className="px-5 py-4 text-foreground/[0.62]">
                    {permissionDescriptions[permission]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
