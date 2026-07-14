"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { permanentlyDeleteAdminEvent } from "@/app/admin/events/actions";
import { EventSubmitButton } from "./event-submit-button";

export function PermanentDeleteForm({
  eventId,
  eventName,
  eventSlug,
  eligible,
}: {
  eventId: string;
  eventName: string;
  eventSlug: string;
  eligible: boolean;
}) {
  const [confirmation, setConfirmation] = useState("");
  const [reason, setReason] = useState("");
  const [checked, setChecked] = useState(false);
  const confirmationMatches = confirmation === eventSlug || confirmation === eventName;
  const canSubmit = useMemo(
    () => eligible && confirmationMatches && reason.trim().length > 0 && checked,
    [checked, confirmationMatches, eligible, reason],
  );

  return (
    <form action={permanentlyDeleteAdminEvent} className="mt-5 grid gap-4">
      <input type="hidden" name="eventId" value={eventId} />
      <label className="grid gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/[0.58]">
          Type event slug or exact name
        </span>
        <input
          name="deleteConfirmation"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          placeholder={eventSlug}
          className="h-10 rounded-md border border-border bg-surface-muted px-3 text-sm"
        />
      </label>
      <label className="grid gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/[0.58]">
          Deletion reason
        </span>
        <textarea
          name="deleteReason"
          rows={3}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
        />
      </label>
      <label className="flex items-start gap-2 text-sm text-foreground/[0.66]">
        <input
          type="checkbox"
          name="confirmPermanentDelete"
          checked={checked}
          onChange={(event) => setChecked(event.target.checked)}
          className="mt-1 accent-red-500"
        />
        I understand this permanently deletes only this eligible manual/test event and
        cannot be undone.
      </label>
      <EventSubmitButton
        label="Permanently Delete Event"
        pendingLabel="Deleting..."
        icon={Trash2}
        disabled={!canSubmit}
        tone="danger"
      />
    </form>
  );
}
