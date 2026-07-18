import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { adminNavItems } from "@/components/admin/admin-nav";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { canAccessAdmin, getAdminAccessContext } from "@/lib/admin/access";
import { buildLoginRedirect, sanitizeAdminRedirect } from "@/lib/auth/redirects";

const horizontalScrollStyle = { overflowX: "auto" } as const;

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | Admin | Hard Enduro World",
  },
  description: "Admin foundation for Hard Enduro World data management.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const access = await getAdminAccessContext();
  const headerStore = await headers();
  const requestedPath = sanitizeAdminRedirect(
    headerStore.get("x-admin-request-url") ?? "/admin",
  );

  if (access.shouldRedirectUnauthenticated) {
    redirect(buildLoginRedirect(requestedPath));
  }

  if (!canAccessAdmin(access, "admin:view")) {
    redirect(`/access-denied?next=${encodeURIComponent(requestedPath)}`);
  }

  return (
    <div className="min-h-screen bg-surface text-foreground lg:grid lg:grid-cols-[320px_1fr]">
      <AdminSidebar />
      <div className="min-w-0">
        <AdminHeader access={access} />
        <nav
          aria-label="Admin mobile navigation"
          className="flex gap-2 overflow-x-auto border-b border-border bg-surface-muted px-5 py-3 lg:hidden"
          style={horizontalScrollStyle}
        >
          {adminNavItems.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className="shrink-0 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="px-5 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
