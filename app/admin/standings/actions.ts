"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PointsSystemId } from "@/jobs/calculations/points-system";
import { createStandingCalculationReviewRun } from "@/lib/admin/standings-calculation";
import {
  publishStandingCalculationSet,
  rollbackStandingPublication,
} from "@/lib/admin/standing-publications";
import { getAuthSession, hasPermission } from "@/lib/auth";

export async function createStandingCalculationReview(formData: FormData) {
  const session = await getAuthSession();
  if (!session.user || !hasPermission(session, "calculations:review")) {
    redirect("/admin/standings?error=unauthorized");
  }

  const seasonId = stringField(formData, "seasonId");
  const pointsSystemId = stringField(formData, "pointsSystemId") as PointsSystemId;
  const confirmed = stringField(formData, "confirmCalculation") === "on";
  if (!seasonId || !confirmed) {
    redirect("/admin/standings?error=calculation-confirmation");
  }

  try {
    const result = await createStandingCalculationReviewRun({
      seasonId,
      pointsSystemId: pointsSystemId || "source-result-points",
    });
    revalidatePath("/admin/standings");
    revalidatePath("/admin/review");
    redirect(
      `/admin/standings?saved=calculation-created&snapshot=${encodeURIComponent(
        result.snapshotId,
      )}`,
    );
  } catch (error) {
    console.error("Standing calculation review creation failed", error);
    redirect("/admin/standings?error=calculation-failed");
  }
}

export async function publishStandingSet(formData: FormData) {
  const session = await getAuthSession();
  if (!session.user || !hasPermission(session, "standings:publish")) {
    redirect("/admin/standings?publication=unauthorized");
  }

  const reviewItemId = stringField(formData, "reviewItemId");
  const confirmed = stringField(formData, "confirmPublication") === "on";
  const note = stringField(formData, "publicationNote");
  if (!reviewItemId || !confirmed) {
    redirect(`/admin/review/${reviewItemId || ""}?publication=invalid`);
  }

  const result = await publishStandingCalculationSet({
    reviewItemId,
    actor: session.user,
    note,
  });

  revalidatePath("/admin/standings");
  revalidatePath(`/admin/review/${reviewItemId}`);

  if (!result.ok) {
    redirect(`/admin/review/${reviewItemId}?publication=${result.code}`);
  }

  redirect(`/admin/review/${reviewItemId}?publication=published`);
}

export async function rollbackStandingPublicationAction(formData: FormData) {
  const session = await getAuthSession();
  if (!session.user || !hasPermission(session, "standings:publish")) {
    redirect("/admin/standings?publication=unauthorized");
  }

  const publicationId = stringField(formData, "publicationId");
  const confirmed = stringField(formData, "confirmRollback") === "on";
  const note = stringField(formData, "publicationNote");
  if (!publicationId || !confirmed) {
    redirect("/admin/standings?publication=invalid");
  }

  const result = await rollbackStandingPublication({
    publicationId,
    actor: session.user,
    note,
  });

  revalidatePath("/admin/standings");

  if (!result.ok) {
    redirect(`/admin/standings?publication=${result.code}`);
  }

  redirect("/admin/standings?publication=rolled-back");
}

function stringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
