import type {
  ProductionSourceRegistryEntry,
  ProductionUpdateType,
  SourceCapabilityQuestion,
} from "./types";
import type { SourceContentType, SourceEntityType } from "../types";

export function getSourceById(
  registry: ProductionSourceRegistryEntry[],
  sourceId: string,
) {
  return registry.find((source) => source.id === sourceId) ?? null;
}

export function getEnabledProductionSources(registry: ProductionSourceRegistryEntry[]) {
  return registry.filter((source) => source.enabled && source.status === "active");
}

export function canSourceUpdateEntity(
  source: ProductionSourceRegistryEntry,
  entityType: SourceEntityType,
) {
  return source.enabled && source.supportedEntityTypes.includes(entityType);
}

export function canSourceProvideContent(
  source: ProductionSourceRegistryEntry,
  contentType: SourceContentType,
) {
  return source.enabled && source.supportedContentTypes.includes(contentType);
}

export function canSourcePerformUpdate(
  source: ProductionSourceRegistryEntry,
  updateType: ProductionUpdateType,
) {
  return source.enabled && source.supportedUpdateTypes.includes(updateType);
}

export function shouldSourceRequireManualApproval(source: ProductionSourceRegistryEntry) {
  return source.reviewPolicy !== "manual-only";
}

export function getSourceRefreshFrequency(source: ProductionSourceRegistryEntry) {
  return source.refreshFrequency;
}

export function answerSourceCapability(
  registry: ProductionSourceRegistryEntry[],
  question: SourceCapabilityQuestion,
) {
  const source = getSourceById(registry, question.sourceId);

  if (!source || !source.enabled) {
    return {
      allowed: false,
      source,
      reason: source ? "Source is disabled." : "Source is not registered.",
    };
  }

  if (question.entityType && !source.supportedEntityTypes.includes(question.entityType)) {
    return {
      allowed: false,
      source,
      reason: `Source cannot update entity type '${question.entityType}'.`,
    };
  }

  if (
    question.contentType &&
    !source.supportedContentTypes.includes(question.contentType)
  ) {
    return {
      allowed: false,
      source,
      reason: `Source cannot provide content type '${question.contentType}'.`,
    };
  }

  if (question.updateType && !source.supportedUpdateTypes.includes(question.updateType)) {
    return {
      allowed: false,
      source,
      reason: `Source cannot perform update type '${question.updateType}'.`,
    };
  }

  return {
    allowed: true,
    source,
    reason: "Source capability is allowed by the production registry.",
  };
}
