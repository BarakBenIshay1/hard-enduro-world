"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { decideConnectorReviewItem } from "@/lib/admin/connector-review-decisions";
import { getAuthSession, hasPermission } from "@/lib/auth";

export async function approveConnectorReviewItem(formData: FormData) {
  return decideFromForm(formData, "APPROVED");
}

export async function rejectConnectorReviewItem(formData: FormData) {
  return decideFromForm(formData, "REJECTED");
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
