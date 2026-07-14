"use client";

import { useFormStatus } from "react-dom";
import type { LucideIcon } from "lucide-react";

export function EventSubmitButton({
  label,
  pendingLabel,
  icon: Icon,
  disabled = false,
  tone = "primary",
}: {
  label: string;
  pendingLabel: string;
  icon?: LucideIcon;
  disabled?: boolean;
  tone?: "primary" | "danger" | "neutral";
}) {
  const { pending } = useFormStatus();
  const className =
    tone === "danger"
      ? "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-4 text-sm font-semibold text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
      : tone === "neutral"
        ? "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-surface-muted px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        : "inline-flex h-11 w-fit items-center gap-2 rounded-md bg-accent px-5 text-sm font-black uppercase tracking-[0.12em] text-black transition hover:bg-gold disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <button type="submit" disabled={disabled || pending} className={className}>
      {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
      {pending ? pendingLabel : label}
    </button>
  );
}
