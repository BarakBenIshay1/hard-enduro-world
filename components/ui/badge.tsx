import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export function Badge({ className, ...props }: ComponentPropsWithoutRef<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border border-accent/32 bg-accent/12 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent",
        className,
      )}
      {...props}
    />
  );
}
