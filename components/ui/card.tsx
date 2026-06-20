import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-card text-foreground shadow-[0_20px_80px_hsl(0_0%_0%/0.12)] transition duration-200 hover:border-accent/70 hover:shadow-[0_28px_90px_hsl(var(--accent)/0.14)]",
        className,
      )}
      {...props}
    />
  );
}
