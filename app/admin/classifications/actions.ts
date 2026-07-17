"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ClassifiableEntityType, DataOriginStatus } from "@prisma/client";

import { createRecordClassificationReviewProposal } from "@/lib/data-quality/record-classification-workflow";
import { getAuthSession, hasPermission } from "@/lib/auth";

export async function proposeRecordClassificationChange(formData: FormData) {
  const session = await getAuthSession();
  if (!session.user || !hasPermission(session, "sources:manage")) {
    redirect("/admin/review?classification=unauthorized");
  }

  const returnPath = safeReturnPath(stringField(formData, "returnPath"));
  const entityType = parseEntityType(stringField(formData, "entityType"));
  const entityId = stringField(formData, "entityId");
  const originStatus = parseOriginStatus(stringField(formData, "originStatus"));
  const reason = stringField(formData, "reason");
  const evidence = parseEvidence(stringField(formData, "evidence"));

  if (!entityType || !entityId || !originStatus) {
    redirect(`${returnPath}?classification=invalid`);
  }

  const result = await createRecordClassificationReviewProposal({
    entityType,
    entityId,
    originStatus,
    reason,
    evidence,
    sourceLinkId: nullableField(formData, "sourceLinkId"),
    sourceSnapshotId: nullableField(formData, "sourceSnapshotId"),
    connectorReviewItemId: nullableField(formData, "connectorReviewItemId"),
    actor: session.user,
  });

  revalidatePath(returnPath);
  revalidatePath("/admin/review");

  if (!result.ok) {
    redirect(`${returnPath}?classification=${result.code}`);
  }

  redirect(`/admin/review/${result.reviewItemId}?classification=${result.status}`);
}

function parseEntityType(value: string) {
  return value in ClassifiableEntityType ? (value as ClassifiableEntityType) : null;
}

function parseOriginStatus(value: string) {
  return value in DataOriginStatus ? (value as DataOriginStatus) : null;
}

function parseEvidence(value: string) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return { note: value };
  }
}

function nullableField(formData: FormData, key: string) {
  const value = stringField(formData, key);
  return value.length ? value : null;
}

function stringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function safeReturnPath(value: string) {
  if (!value.startsWith("/admin/") || value.startsWith("//")) return "/admin/review";
  return value;
}
