import type { AutomationJobDefinition } from "@/jobs/automation/types";

export const automationJobRegistry = [
  {
    id: "official-events",
    name: "Official calendar import",
    description:
      "Prepare future official championship calendar and event metadata imports.",
    sourceType: "official-website",
    frequency: "daily",
    riskLevel: "medium",
    reviewRequired: true,
    enabled: true,
  },
  {
    id: "official-results",
    name: "Official results import",
    description: "Prepare future final classification imports from official sources.",
    sourceType: "timing-system",
    frequency: "after-event",
    riskLevel: "high",
    reviewRequired: true,
    enabled: true,
  },
  {
    id: "official-stage-results",
    name: "Stage timing import",
    description:
      "Prepare future stage timing table imports with complete row preservation.",
    sourceType: "timing-system",
    frequency: "after-event",
    riskLevel: "high",
    reviewRequired: true,
    enabled: true,
  },
  {
    id: "official-standings",
    name: "Standings import",
    description:
      "Prepare future championship standings imports and recalculation checks.",
    sourceType: "official-website",
    frequency: "after-event",
    riskLevel: "high",
    reviewRequired: true,
    enabled: true,
  },
  {
    id: "youtube-videos",
    name: "YouTube video import",
    description: "Prepare future official video metadata imports.",
    sourceType: "youtube",
    frequency: "daily",
    riskLevel: "low",
    reviewRequired: true,
    enabled: false,
    connectorPath: "jobs/connectors/youtube",
  },
  {
    id: "weather-snapshots",
    name: "Weather snapshot import",
    description: "Prepare future weather snapshots for event history and analytics.",
    sourceType: "weather",
    frequency: "daily",
    riskLevel: "low",
    reviewRequired: false,
    enabled: false,
  },
  {
    id: "recalculate-statistics",
    name: "Statistics recalculation",
    description: "Prepare future derived statistics recalculation after imports.",
    sourceType: "internal",
    frequency: "after-event",
    riskLevel: "medium",
    reviewRequired: false,
    enabled: true,
  },
  {
    id: "recalculate-records",
    name: "Records recalculation",
    description:
      "Prepare future championship records recalculation after approved changes.",
    sourceType: "internal",
    frequency: "after-event",
    riskLevel: "medium",
    reviewRequired: false,
    enabled: true,
  },
] satisfies AutomationJobDefinition[];

export function getAutomationJob(id: string) {
  return automationJobRegistry.find((job) => job.id === id);
}
