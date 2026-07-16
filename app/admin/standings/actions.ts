"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PointsSystemId } from "@/jobs/calculations/points-system";
import { createStandingCalculationReviewRun } from "@/lib/admin/standings-calculation";
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

function stringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
