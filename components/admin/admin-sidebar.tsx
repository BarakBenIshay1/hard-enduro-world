"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { adminNavItems } from "@/components/admin/admin-nav";
import { cn } from "@/lib/cn";

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen border-r border-border bg-black text-white lg:block">
      <div className="sticky top-0 grid h-screen w-80 grid-rows-[auto_1fr_auto]">
        <div className="border-b border-white/10 p-6">
          <Logo />
          <p className="mt-4 text-sm leading-6 text-white/52">
            Admin foundation for data management, import review, source tracking, and
            future audit trails.
          </p>
        </div>
        <nav className="overflow-y-auto p-4" aria-label="Admin navigation">
          <div className="grid gap-1">
            {adminNavItems.slice(0, 15).map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "grid grid-cols-[36px_1fr] gap-3 rounded-md p-3 text-white/64 transition hover:bg-white/[0.08] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent",
                    isActive && "bg-white/[0.1] text-white",
                  )}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/[0.06]">
                    <Icon className="h-4 w-4 text-accent" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block font-semibold">{item.label}</span>
                    <span className="mt-1 block text-xs text-white/42">
                      {item.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
        <div className="border-t border-white/10 p-5 text-xs text-white/42">
          Auth placeholder: owner / admin / editor / reviewer.
        </div>
      </div>
    </aside>
  );
}
