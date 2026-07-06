export const sourceIntelligenceLifecycle = [
  "official-source",
  "source-snapshot",
  "normalization",
  "entity-resolution",
  "relationship-resolution",
  "change-detection",
  "verification",
  "review-queue",
  "approval",
  "database-update",
  "audit-log",
  "website-refresh",
] as const;

export type SourceIntelligenceLifecycleStep =
  (typeof sourceIntelligenceLifecycle)[number];

export function getNextLifecycleStep(step: SourceIntelligenceLifecycleStep) {
  const index = sourceIntelligenceLifecycle.indexOf(step);
  return sourceIntelligenceLifecycle[index + 1] ?? null;
}
