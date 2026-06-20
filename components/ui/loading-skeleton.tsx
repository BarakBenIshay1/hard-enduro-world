import { cn } from "@/lib/cn";

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gradient-to-r from-surface-muted via-border to-surface-muted bg-[length:200%_100%]",
        className,
      )}
    />
  );
}
