import type { ComponentPropsWithoutRef } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";

type AdminActionButtonProps = ComponentPropsWithoutRef<"button"> & {
  icon?: "create" | "none";
};

export function AdminActionButton({
  className,
  icon = "create",
  children,
  ...props
}: AdminActionButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-accent-foreground transition hover:bg-accent-hot focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98] disabled:opacity-60",
        className,
      )}
      {...props}
    >
      {icon === "create" ? <Plus className="h-4 w-4" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
