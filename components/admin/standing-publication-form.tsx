"use client";

import { useFormStatus } from "react-dom";
import {
  publishStandingSet,
  rollbackStandingPublicationAction,
} from "@/app/admin/standings/actions";
import { cn } from "@/lib/cn";

export function StandingPublicationForm({
  reviewItemId,
  canPublish,
}: {
  reviewItemId: string;
  canPublish: boolean;
}) {
  if (!canPublish) {
    return (
      <div className="rounded-md border border-border bg-surface-muted p-4 text-sm text-foreground/[0.62]">
        Publication is available only after the complete Standing set is approved and
        applied.
      </div>
    );
  }

  return (
    <form
      action={publishStandingSet}
      className="rounded-md border border-accent/25 bg-card p-5"
    >
      <input type="hidden" name="reviewItemId" value={reviewItemId} />
      <h3 className="font-black">Publish official standings</h3>
      <p className="mt-2 text-xs leading-5 text-foreground/[0.62]">
        This publishes the complete applied Standing calculation set as the public
        championship table. Previous public versions remain in history.
      </p>
      <textarea
        name="publicationNote"
        rows={3}
        className="mt-4 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        placeholder="Optional publication note"
      />
      <label className="mt-4 flex items-start gap-2 text-xs leading-5 text-foreground/[0.66]">
        <input
          type="checkbox"
          name="confirmPublication"
          required
          className="mt-1 accent-orange-500"
        />
        I understand this will update the public standings only after all publication
        checks pass.
      </label>
      <SubmitButton label="Publish standings" pendingLabel="Publishing..." />
    </form>
  );
}

export function StandingRollbackForm({
  publicationId,
  canRollback,
}: {
  publicationId: string;
  canRollback: boolean;
}) {
  if (!canRollback) return null;
  return (
    <form action={rollbackStandingPublicationAction} className="grid gap-2">
      <input type="hidden" name="publicationId" value={publicationId} />
      <input type="hidden" name="confirmRollback" value="on" />
      <input type="hidden" name="publicationNote" value="Admin rollback from history" />
      <SubmitButton label="Rollback" pendingLabel="Rolling back..." compact />
    </form>
  );
}

function SubmitButton({
  label,
  pendingLabel,
  compact = false,
}: {
  label: string;
  pendingLabel: string;
  compact?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex items-center justify-center rounded-md border border-accent/40 bg-accent/10 text-sm font-black text-accent transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60",
        compact ? "h-8 px-3 text-xs" : "mt-4 h-10 w-full px-4",
      )}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
