"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createRegulationComponentPointsReviewRun } from "@/lib/admin/regulation-component-points";
import { createComponentPointsRollupReviewRun } from "@/lib/admin/component-points-rollup";
import {
  activateRegulation,
  archiveRegulation,
  createDraftRegulation,
  createRegulationVersion,
  deactivateRegulation,
  parseRegulationCmsInput,
  restoreRegulation,
  updateDraftRegulation,
} from "@/lib/admin/regulation-cms";
import { getAuthSession, hasPermission } from "@/lib/auth";

export async function createAdminRegulation(formData: FormData) {
  const session = await requireRegulationManager("/admin/regulations/new");
  const parsed = parseRegulationCmsInput(formData);
  if (!parsed.ok) redirect(`/admin/regulations/new?error=${parsed.error}`);
  try {
    const regulation = await createDraftRegulation({
      input: parsed.input,
      actorId: session.user.id,
    });
    revalidateRegulations(regulation.id);
    redirect(`/admin/regulations/${regulation.id}?saved=created`);
  } catch (error) {
    console.error("Regulation create failed", error);
    redirect("/admin/regulations/new?error=save-failed");
  }
}

export async function updateAdminRegulation(formData: FormData) {
  const regulationId = stringField(formData, "regulationId");
  const session = await requireRegulationManager(`/admin/regulations/${regulationId}`);
  const parsed = parseRegulationCmsInput(formData);
  if (!regulationId || !parsed.ok) {
    redirect(
      `/admin/regulations/${regulationId}?error=${parsed.ok ? "missing-id" : parsed.error}`,
    );
  }
  try {
    const regulation = await updateDraftRegulation({
      id: regulationId,
      input: parsed.input,
      actorId: session.user.id,
    });
    revalidateRegulations(regulation.id);
    redirect(`/admin/regulations/${regulation.id}?saved=updated`);
  } catch (error) {
    console.error("Regulation update failed", error);
    redirect(`/admin/regulations/${regulationId}?error=save-failed`);
  }
}

export async function activateAdminRegulation(formData: FormData) {
  await transitionRegulation(formData, "activate", activateRegulation);
}

export async function deactivateAdminRegulation(formData: FormData) {
  await transitionRegulation(formData, "deactivate", deactivateRegulation);
}

export async function archiveAdminRegulation(formData: FormData) {
  await transitionRegulation(formData, "archive", archiveRegulation);
}

export async function restoreAdminRegulation(formData: FormData) {
  await transitionRegulation(formData, "restore", restoreRegulation);
}

export async function createNewAdminRegulationVersion(formData: FormData) {
  const regulationId = stringField(formData, "regulationId");
  const session = await requireRegulationManager(`/admin/regulations/${regulationId}`);
  if (!regulationId || stringField(formData, "confirmTransition") !== "on") {
    redirect(`/admin/regulations/${regulationId}?error=confirmation-required`);
  }
  try {
    const regulation = await createRegulationVersion({
      id: regulationId,
      actorId: session.user.id,
    });
    revalidateRegulations(regulation.id);
    redirect(`/admin/regulations/${regulation.id}?saved=new-version`);
  } catch (error) {
    console.error("Regulation version creation failed", error);
    redirect(`/admin/regulations/${regulationId}?error=transition-failed`);
  }
}

export async function createRegulationPointsReview(formData: FormData) {
  const session = await getAuthSession();
  if (!session.user || !hasPermission(session, "calculations:review")) {
    redirect("/admin/regulations?error=unauthorized");
  }

  const regulationId = stringField(formData, "regulationId");
  const confirmed = stringField(formData, "confirmReview") === "on";
  if (!regulationId || !confirmed) {
    redirect("/admin/regulations?error=confirmation-required");
  }

  try {
    const result = await createRegulationComponentPointsReviewRun({ regulationId });
    revalidatePath("/admin/regulations");
    revalidatePath("/admin/review");
    redirect(
      `/admin/regulations?saved=points-review-created&snapshot=${encodeURIComponent(
        result.snapshotId,
      )}`,
    );
  } catch (error) {
    console.error("Regulation points review creation failed", error);
    redirect("/admin/regulations?error=review-failed");
  }
}

export async function createComponentRollupReview(formData: FormData) {
  const session = await getAuthSession();
  if (!session.user || !hasPermission(session, "calculations:review")) {
    redirect("/admin/regulations?error=unauthorized");
  }

  const regulationId = stringField(formData, "regulationId");
  const confirmed = stringField(formData, "confirmReview") === "on";
  if (!regulationId || !confirmed) {
    redirect("/admin/regulations?error=confirmation-required");
  }

  try {
    const result = await createComponentPointsRollupReviewRun({ regulationId });
    revalidatePath("/admin/regulations");
    revalidatePath("/admin/review");
    redirect(
      `/admin/regulations?saved=rollup-review-created&snapshot=${encodeURIComponent(
        result.snapshotId,
      )}`,
    );
  } catch (error) {
    console.error("Component rollup review creation failed", error);
    redirect("/admin/regulations?error=review-failed");
  }
}

function stringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function transitionRegulation(
  formData: FormData,
  action: string,
  transition: (input: { id: string; actorId: string }) => Promise<{ id: string }>,
) {
  const regulationId = stringField(formData, "regulationId");
  const session = await requireRegulationManager(`/admin/regulations/${regulationId}`);
  if (!regulationId || stringField(formData, "confirmTransition") !== "on") {
    redirect(`/admin/regulations/${regulationId}?error=confirmation-required`);
  }
  try {
    const regulation = await transition({
      id: regulationId,
      actorId: session.user.id,
    });
    revalidateRegulations(regulation.id);
    redirect(`/admin/regulations/${regulation.id}?saved=${action}`);
  } catch (error) {
    console.error(`Regulation ${action} failed`, error);
    redirect(`/admin/regulations/${regulationId}?error=transition-failed`);
  }
}

async function requireRegulationManager(returnTo: string) {
  const session = await getAuthSession();
  if (!session.user || !hasPermission(session, "calculations:review")) {
    redirect(`${returnTo}?error=unauthorized`);
  }
  return { user: session.user };
}

function revalidateRegulations(id: string) {
  revalidatePath("/admin/regulations");
  revalidatePath(`/admin/regulations/${id}`);
  revalidatePath("/admin/standings");
  revalidatePath("/admin/review");
}
