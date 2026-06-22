import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import type { AdminAccessContext } from "@/lib/admin/access";

type AdminHeaderProps = {
  access: AdminAccessContext;
};

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
          <span className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-accent" aria-hidden="true" />
            Role: {access.role}
          </span>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-card px-4 text-sm font-semibold transition hover:border-accent hover:text-accent"
          >
            Public Site
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
