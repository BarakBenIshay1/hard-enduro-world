"use client";

import { useFormStatus } from "react-dom";
import { Check, X } from "lucide-react";
import {
  approveConnectorReviewItem,
  rejectConnectorReviewItem,
} from "@/app/admin/review/actions";
import { cn } from "@/lib/cn";

type ReviewDecisionFormProps = {
  reviewItemId: string;
  expectedStatus: string;
  expectedVersion: number;
  suggestedAction: string;
  changedFields: string[];
  canDecide: boolean;
};

export function ReviewDecisionForm({
  reviewItemId,
  expectedStatus,
  expectedVersion,
  suggestedAction,
  changedFields,
  canDecide,
}: ReviewDecisionFormProps) {
  if (!canDecide) {
    return (
      <div className="rounded-md border border-border bg-surface-muted p-5 text-sm text-foreground/[0.62]">
        This proposal is read-only. Only current PENDING review items can be approved or
        rejected.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <DecisionForm
        action={approveConnectorReviewItem}
        tone="approve"
        reviewItemId={reviewItemId}
        expectedStatus={expectedStatus}
        expectedVersion={expectedVersion}
        suggestedAction={suggestedAction}
        changedFields={changedFields}
      />
      <DecisionForm
        action={rejectConnectorReviewItem}
        tone="reject"
        reviewItemId={reviewItemId}
        expectedStatus={expectedStatus}
        expectedVersion={expectedVersion}
        suggestedAction={suggestedAction}
        changedFields={changedFields}
      />
    </div>
  );
}

function DecisionForm({
  action,
  tone,
  reviewItemId,
  expectedStatus,
  expectedVersion,
  suggestedAction,
  changedFields,
}: {
  action: (formData: FormData) => void | Promise<void>;
  tone: "approve" | "reject";
  reviewItemId: string;
  expectedStatus: string;
  expectedVersion: number;
  suggestedAction: string;
  changedFields: string[];
}) {
  const isReject = tone === "reject";

  return (
    <form
      action={action}
      className={cn(
        "rounded-md border bg-card p-5",
        isReject ? "border-red-500/25" : "border-emerald-500/25",
      )}
    >
      <input type="hidden" name="reviewItemId" value={reviewItemId} />
      <input type="hidden" name="expectedStatus" value={expectedStatus} />
      <input type="hidden" name="expectedVersion" value={expectedVersion} />

      <div className="flex items-center gap-3">
        <span
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-full border",
            isReject
              ? "border-red-500/30 bg-red-500/10 text-red-400"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
          )}
        >
          {isReject ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
        </span>
        <div>
          <h3 className="font-black">
            {isReject ? "Reject proposal" : "Approve proposal"}
          </h3>
          <p className="text-xs text-foreground/[0.58]">
            Status changes only. Public Event records remain untouched.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-border bg-surface-muted p-3 text-xs leading-5 text-foreground/[0.66]">
        <p>Action: {suggestedAction}</p>
        <p>Changed fields: {changedFields.length ? changedFields.join(", ") : "None"}</p>
      </div>

      <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.16em] text-foreground/[0.58]">
        {isReject ? "Rejection reason" : "Admin note"}
      </label>
      <textarea
        name="decisionNote"
        required={isReject}
        rows={3}
        className="mt-2 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        placeholder={
          isReject ? "Explain why this proposal is rejected." : "Optional note"
        }
      />

      <label className="mt-4 flex items-start gap-2 text-xs leading-5 text-foreground/[0.66]">
        <input
          type="checkbox"
          name="confirmDecision"
          required
          className="mt-1 accent-orange-500"
        />
        I understand this decision does not update or publish public event data.
      </label>

      <DecisionSubmitButton tone={tone} />
    </form>
  );
}

function DecisionSubmitButton({ tone }: { tone: "approve" | "reject" }) {
  const { pending } = useFormStatus();
  const isReject = tone === "reject";

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "mt-4 inline-flex h-10 w-full items-center justify-center rounded-md border px-4 text-sm font-black transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60",
        isReject
          ? "border-red-500/40 bg-red-500/10 text-red-300"
          : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
      )}
    >
      {pending ? "Saving..." : isReject ? "Reject" : "Approve"}
    </button>
  );
}
