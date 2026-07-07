import {
  answerSourceCapability,
  getSourceById,
  productionSourceRegistry,
  shouldSourceRequireManualApproval,
} from "@/lib/source-intelligence/registry";
import type { FimCalendarConfig } from "./types";

const defaultSourceId = "fim-hard-enduro-world-championship";
const defaultSeasonYear = 2026;

export function getFimCalendarConfig({
  sourceId = defaultSourceId,
  seasonYear = defaultSeasonYear,
}: {
  sourceId?: string;
  seasonYear?: number;
} = {}): { config: FimCalendarConfig | null; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const source = getSourceById(productionSourceRegistry, sourceId);

  if (!source) {
    return {
      config: null,
      errors: [`Source '${sourceId}' is not registered in the production registry.`],
      warnings,
    };
  }

  const eventCapability = answerSourceCapability(productionSourceRegistry, {
    sourceId,
    entityType: "event",
    updateType: "calendar",
    contentType: "calendar",
  });
  const seasonCapability = answerSourceCapability(productionSourceRegistry, {
    sourceId,
    entityType: "season",
    updateType: "calendar",
    contentType: "calendar",
  });

  if (!eventCapability.allowed) errors.push(eventCapability.reason);
  if (!seasonCapability.allowed) errors.push(seasonCapability.reason);

  if (!shouldSourceRequireManualApproval(source)) {
    errors.push("FIM calendar source must require manual review.");
  }

  if (!source.websiteUrl) {
    warnings.push("Source URL is not configured. Dry-run can still parse local input.");
  }

  if (errors.length > 0) {
    return { config: null, errors, warnings };
  }

  return {
    config: {
      connectorId: "fim-calendar",
      sourceId,
      source,
      seasonYear,
      dryRun: true,
      sourceUrl: source.websiteUrl,
      supportedUpdateType: "calendar",
    },
    errors,
    warnings,
  };
}
