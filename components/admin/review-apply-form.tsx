"use client";

import { useFormStatus } from "react-dom";
import { UploadCloud } from "lucide-react";
import {
  applyApprovedConnectorReviewItem,
  applyApprovedStandingCalculationSet,
} from "@/app/admin/review/actions";
import { cn } from "@/lib/cn";

type ReviewApplyFormProps = {
  reviewItemId: string;
  reviewStatus: string;
  applicationStatus: string;
  applicationVersion: number;
  suggestedAction: string;
  changedFields: string[];
  canApply: boolean;
  isStandingCalculationSet?: boolean;
};

export function ReviewApplyForm({
  reviewItemId,
  reviewStatus,
  applicationStatus,
  applicationVersion,
  suggestedAction,
  changedFields,
  canApply,
  isStandingCalculationSet = false,
}: ReviewApplyFormProps) {
  if (!canApply) {
    return (
      <div className="rounded-md border border-border bg-surface-muted p-5 text-sm text-foreground/[0.62]">
        Apply is available only for APPROVED items that are not yet applied.
      </div>
    );
  }

  const unsupported =
    suggestedAction === "MANUAL_REVIEW" ||
    suggestedAction === "SOURCE_REMOVED" ||
    suggestedAction === "RESULT_CONFLICT" ||
    suggestedAction === "RESULT_UNRESOLVED" ||
    suggestedAction === "RESULT_INVALID" ||
    suggestedAction === "RESULT_MISSING_SOURCE" ||
    suggestedAction === "STAGE_RESULT_CONFLICT" ||
    suggestedAction === "STAGE_RESULT_UNRESOLVED" ||
    suggestedAction === "STAGE_RESULT_INVALID" ||
    suggestedAction === "STAGE_RESULT_MISSING_SOURCE" ||
    suggestedAction === "UNCHANGED_STANDING" ||
    suggestedAction === "STANDING_INVALID";
  const target = suggestedAction.includes("STAGE_RESULT")
    ? "StageResult"
    : suggestedAction.includes("STANDING")
      ? "Standing"
      : suggestedAction.includes("RESULT")
        ? "Result"
        : "Event";
  const applyAction = isStandingCalculationSet
    ? applyApprovedStandingCalculationSet
    : applyApprovedConnectorReviewItem;

  return (
    <form action={applyAction} className="rounded-md border border-accent/25 bg-card p-5">
      <input type="hidden" name="reviewItemId" value={reviewItemId} />
      <input type="hidden" name="expectedApplicationStatus" value={applicationStatus} />
      <input type="hidden" name="expectedApplicationVersion" value={applicationVersion} />

      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent">
          <UploadCloud className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-black">Apply approved change</h3>
          <p className="mt-1 text-xs leading-5 text-foreground/[0.62]">
            This is separate from approval.{" "}
            {isStandingCalculationSet
              ? "It will apply the complete approved Standing calculation set in one transaction if validation passes."
              : `It will modify exactly one ${target} record if validation passes.`}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-border bg-surface-muted p-3 text-xs leading-5 text-foreground/[0.66]">
        <p>Review status: {reviewStatus}</p>
        <p>Application status: {applicationStatus}</p>
        <p>Action: {suggestedAction}</p>
        <p>Fields: {changedFields.length ? changedFields.join(", ") : "None"}</p>
        {unsupported ? (
          <p className="mt-2 text-red-300">
            This action type intentionally fails closed in this sprint.
          </p>
        ) : null}
      </div>

      <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.16em] text-foreground/[0.58]">
        Application note
      </label>
      <textarea
        name="applicationNote"
        rows={3}
        className="mt-2 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        placeholder="Optional note for the audit trail"
      />

      <label className="mt-4 flex items-start gap-2 text-xs leading-5 text-foreground/[0.66]">
        <input
          type="checkbox"
          name="confirmApplication"
          required
          className="mt-1 accent-orange-500"
        />
        I understand this will write{" "}
        {isStandingCalculationSet
          ? "the complete approved Standing calculation set"
          : `one approved ${target} change`}{" "}
        but will not run cron, publish automatically, calculate standings, or refresh the
        website automatically.
      </label>

      <ApplySubmitButton disabled={unsupported} />
    </form>
  );
}

function ApplySubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={cn(
        "mt-4 inline-flex h-10 w-full items-center justify-center rounded-md border border-accent/40 bg-accent/10 px-4 text-sm font-black text-accent transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60",
      )}
    >
      {pending ? "Applying..." : "Apply approved change"}
    </button>
  );
}
