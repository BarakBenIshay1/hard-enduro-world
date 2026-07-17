"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ConnectorReviewApplicationStatus } from "@prisma/client";
import { applyConnectorReviewItem } from "@/lib/admin/connector-review-application";
import { applyStandingCalculationSet } from "@/lib/admin/standing-calculation-set-application";
import { decideConnectorReviewItem } from "@/lib/admin/connector-review-decisions";
import { getAuthSession, hasPermission } from "@/lib/auth";

export async function approveConnectorReviewItem(formData: FormData) {
  return decideFromForm(formData, "APPROVED");
}

export async function rejectConnectorReviewItem(formData: FormData) {
  return decideFromForm(formData, "REJECTED");
}

export async function applyApprovedConnectorReviewItem(formData: FormData) {
  return applyApprovedReviewItemFromForm(formData, "single");
}

export async function applyApprovedStandingCalculationSet(formData: FormData) {
  return applyApprovedReviewItemFromForm(formData, "standing-set");
}

async function applyApprovedReviewItemFromForm(
  formData: FormData,
  mode: "single" | "standing-set",
) {
  const session = await getAuthSession();

  if (!hasPermission(session, "review:approve") || !session.user) {
    redirect("/admin/review?application=unauthorized");
  }

  const reviewItemId = stringField(formData, "reviewItemId");
  const expectedApplicationStatus = stringField(formData, "expectedApplicationStatus");
  const expectedApplicationVersion = Number(
    stringField(formData, "expectedApplicationVersion"),
  );
  const note = stringField(formData, "applicationNote");
  const confirmed = stringField(formData, "confirmApplication") === "on";

  if (
    !reviewItemId ||
    !["NOT_APPLIED", "APPLY_FAILED"].includes(expectedApplicationStatus) ||
    !Number.isInteger(expectedApplicationVersion) ||
    !confirmed
  ) {
    redirect(`/admin/review/${reviewItemId || ""}?application=invalid`);
  }

  const result =
    mode === "standing-set"
      ? await applyStandingCalculationSet({
          reviewItemId,
          expectedApplicationStatus:
            expectedApplicationStatus as ConnectorReviewApplicationStatus,
          expectedApplicationVersion,
          actor: session.user,
          note,
        })
      : await applyConnectorReviewItem({
          reviewItemId,
          expectedApplicationStatus:
            expectedApplicationStatus as ConnectorReviewApplicationStatus,
          expectedApplicationVersion,
          actor: session.user,
          note,
        });

  revalidatePath("/admin/review");
  revalidatePath(`/admin/review/${reviewItemId}`);
  revalidatePath("/admin/audit");

  if (!result.ok) {
    redirect(`/admin/review/${reviewItemId}?application=${result.code}`);
  }

  redirect(`/admin/review/${reviewItemId}?application=applied`);
}

async function decideFromForm(formData: FormData, decision: "APPROVED" | "REJECTED") {
  const session = await getAuthSession();

  if (!hasPermission(session, "review:approve") || !session.user) {
    redirect("/admin/review?decision=unauthorized");
  }

  const reviewItemId = stringField(formData, "reviewItemId");
  const expectedStatus = stringField(formData, "expectedStatus");
  const expectedVersion = Number(stringField(formData, "expectedVersion"));
  const note = stringField(formData, "decisionNote");
  const confirmed = stringField(formData, "confirmDecision") === "on";

  if (
    !reviewItemId ||
    expectedStatus !== "PENDING" ||
    !Number.isInteger(expectedVersion) ||
    !confirmed
  ) {
    redirect(`/admin/review/${reviewItemId || ""}?decision=invalid`);
  }

  const result = await decideConnectorReviewItem({
    reviewItemId,
    expectedStatus,
    expectedVersion,
    decision,
    actor: session.user,
    note,
  });

  revalidatePath("/admin/review");
  revalidatePath(`/admin/review/${reviewItemId}`);
  revalidatePath("/admin/audit");

  if (!result.ok) {
    redirect(`/admin/review/${reviewItemId}?decision=${result.code}`);
  }

  redirect(`/admin/review/${reviewItemId}?decision=${decision.toLowerCase()}`);
}

function stringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
