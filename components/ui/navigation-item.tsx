"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

type NavigationItemProps = {
  href: string;
  label: string;
  onClick?: () => void;
  showLiveIndicator?: boolean;
};

export function NavigationItem({
  href,
  label,
  onClick,
  showLiveIndicator,
}: NavigationItemProps) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "rounded-md px-3 py-2 text-sm font-semibold text-current/70 transition hover:bg-current/[0.08] hover:text-current focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        isActive && "bg-current/10 text-accent",
      )}
    >
      <span className="inline-flex items-center gap-2">
        {label}
        {showLiveIndicator ? (
          <span
            className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_14px_hsl(0_84%_60%/0.85)] motion-safe:animate-pulse"
            aria-label="Live now"
          />
        ) : null}
      </span>
    </Link>
  );
}
