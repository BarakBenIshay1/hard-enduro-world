import Link from "next/link";
import { Flag } from "lucide-react";
import { primaryNavigation } from "@/config/navigation";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface/96">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-foreground text-surface">
            <Flag className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">
              Hard Enduro World
            </p>
            <p className="text-base font-semibold">Championship Data Platform</p>
          </div>
        </Link>

        <nav aria-label="Primary navigation" className="flex flex-wrap gap-2">
          {primaryNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md border border-border px-3 py-2 text-sm text-foreground/72 transition hover:border-accent hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
