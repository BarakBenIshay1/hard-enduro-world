import Link from "next/link";
import { LogOut, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import type { AdminAccessContext } from "@/lib/admin/access";
import { logout } from "@/app/logout/actions";

type AdminHeaderProps = {
  access: AdminAccessContext;
};

const quickLinks = [
  { label: "Admin Dashboard", href: "/admin" },
  { label: "Review", href: "/admin/review" },
  { label: "Imports", href: "/admin/imports" },
  { label: "Jobs", href: "/admin/jobs" },
  { label: "Audit", href: "/admin/audit" },
];

const horizontalScrollStyle = { overflowX: "auto" } as const;

export function AdminHeader({ access }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/[0.92] backdrop-blur-xl">
      <div className="flex min-h-16 flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Admin Panel
          </p>
          <h1 className="mt-1 text-xl font-black">Hard Enduro World Operations</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {access.session.user ? (
            <div className="rounded-md border border-border bg-card px-3 py-2 text-sm">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-4 w-4 text-accent" aria-hidden="true" />
                <span>{access.session.user.name}</span>
              </div>
              <p className="mt-1 text-xs text-foreground/[0.56]">
                {access.session.user.email} • {access.role}
              </p>
            </div>
          ) : null}
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-card px-4 text-sm font-semibold transition hover:border-accent hover:text-accent"
          >
            Public Site
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold transition hover:border-accent hover:text-accent"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Logout
            </button>
          </form>
          <ThemeToggle />
        </div>
      </div>
      <nav
        className="flex gap-2 overflow-x-auto border-t border-border px-5 py-2 lg:px-8"
        style={horizontalScrollStyle}
      >
        {quickLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-foreground/[0.58] transition hover:bg-card hover:text-accent"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
