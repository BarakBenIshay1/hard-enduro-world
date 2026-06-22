import {
  conflictRules,
  sourceMapItems,
  sourceTruthRules,
} from "@/lib/sources/source-map";

export async function getSourceMapAdminData() {
  const highRiskCount = sourceMapItems.filter((item) => item.riskLevel === "high").length;
  const reviewRequiredCount = sourceMapItems.filter((item) => item.reviewRequired).length;
  const automatedCount = sourceMapItems.filter(
    (item) => item.automationStatus === "connector-ready",
  ).length;
  const derivedCount = sourceMapItems.filter(
    (item) => item.automationStatus === "calculation-preview",
  ).length;

  return {
    items: sourceMapItems,
    sourceTruthRules,
    conflictRules,
    summary: {
      totalDataTypes: sourceMapItems.length,
      highRiskCount,
      reviewRequiredCount,
      automatedCount,
      derivedCount,
    },
  };
}
