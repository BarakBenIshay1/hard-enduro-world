"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ClassifiableEntityType, DataOriginStatus } from "@prisma/client";

import { generateClassificationCandidate } from "@/lib/data-quality/classification-intelligence";
import { createRecordClassificationReviewProposal } from "@/lib/data-quality/record-classification-workflow";
import { getAuthSession, hasPermission } from "@/lib/auth";

export async function generateClassificationCandidateProposal(formData: FormData) {
  const session = await getAuthSession();
  if (!session.user || !hasPermission(session, "sources:manage")) {
    redirect("/admin/review?classification=unauthorized");
  }

  const returnPath = safeReturnPath(stringField(formData, "returnPath"));
  const entityType = parseEntityType(stringField(formData, "entityType"));
  const entityId = stringField(formData, "entityId");
  const submittedChecksum = stringField(formData, "candidateChecksum");

  if (!entityType || !entityId || !submittedChecksum) {
    redirect(`${returnPath}?classification=invalid`);
  }
  if (entityType !== ClassifiableEntityType.EVENT) {
    redirect(`${returnPath}?classification=unsupported`);
  }

  const candidate = await generateClassificationCandidate({
    entityType,
    entityId,
    mode: "DETAIL",
  });
  if (candidate.candidateChecksum !== submittedChecksum) {
    redirect(`${returnPath}?classification=stale`);
  }
  if (!candidate.eligible || !candidate.suggestedStatus) {
    redirect(`${returnPath}?classification=blocked`);
  }

  const result = await createRecordClassificationReviewProposal({
    entityType,
    entityId,
    originStatus: candidate.suggestedStatus,
    reason: candidate.reason,
    evidence: {
      generatedBy: "classification-intelligence-v1",
      candidateState: candidate.candidateState,
      transitionType: candidate.transitionType,
      candidateChecksum: candidate.candidateChecksum,
      ruleMatch: candidate.rules,
      missingEvidence: candidate.missingEvidence,
      blockingIssues: candidate.blockingIssues,
      warnings: candidate.warnings,
    },
    sourceLinkId: candidate.evidence.sourceLinkId,
    sourceSnapshotId: candidate.evidence.sourceSnapshotId,
    connectorReviewItemId: candidate.evidence.connectorReviewItemId,
    actor: session.user,
  });

  revalidatePath(returnPath);
  revalidatePath("/admin/review");
  revalidatePath("/admin/classifications");

  if (!result.ok) {
    redirect(`${returnPath}?classification=${result.code}`);
  }

  redirect(`/admin/review/${result.reviewItemId}?classification=${result.status}`);
}

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
