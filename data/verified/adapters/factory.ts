import { getOfficialSource } from "../source-registry";
import type {
  OfficialSourceTrustLevel,
  OfficialSourceType,
  VerifiedAllowedDataType,
} from "../types";
import {
  PlaceholderOfficialSourceAdapter,
  type AdapterValidationIssue,
  type OfficialSourceAdapter,
} from "./base";
import { getAdapterRegistryEntry } from "./registry";

export type AdapterFactoryRequest = {
  sourceId: string;
  sourceType?: OfficialSourceType;
  trustLevel?: OfficialSourceTrustLevel;
  requestedDataType?: VerifiedAllowedDataType;
};

export type AdapterFactoryResult = {
  adapter: OfficialSourceAdapter | null;
  warnings: AdapterValidationIssue[];
  errors: AdapterValidationIssue[];
};

export function createOfficialSourceAdapter(
  request: AdapterFactoryRequest,
): AdapterFactoryResult {
  const warnings: AdapterValidationIssue[] = [];
  const errors: AdapterValidationIssue[] = [];
  const source = getOfficialSource(request.sourceId);
  const registryEntry = getAdapterRegistryEntry(request.sourceId);

  if (!source) {
    return {
      adapter: null,
      warnings,
      errors: [
        {
          severity: "error",
          code: "source-not-registered",
          message: `Source '${request.sourceId}' is not in the official source registry.`,
        },
      ],
    };
  }

  if (!registryEntry || !registryEntry.enabled) {
    return {
      adapter: null,
      warnings,
      errors: [
        {
          severity: "error",
          code: "adapter-not-registered",
          message: `No enabled adapter is registered for source '${request.sourceId}'.`,
        },
      ],
    };
  }

  if (request.sourceType && request.sourceType !== source.type) {
    warnings.push({
      severity: "warning",
      code: "source-type-mismatch",
      message: `Requested source type '${request.sourceType}' does not match registry type '${source.type}'.`,
    });
  }

  if (request.trustLevel && request.trustLevel !== source.trustLevel) {
    warnings.push({
      severity: "warning",
      code: "trust-level-mismatch",
      message: `Requested trust level '${request.trustLevel}' does not match registry trust level '${source.trustLevel}'.`,
    });
  }

  if (
    request.requestedDataType &&
    !source.allowedDataTypes.includes(request.requestedDataType)
  ) {
    errors.push({
      severity: "error",
      code: "data-type-not-supported",
      message: `Source '${request.sourceId}' does not support '${request.requestedDataType}'.`,
    });
  }

  if (
    source.trustLevel === "media-only" &&
    request.requestedDataType &&
    request.requestedDataType !== "media"
  ) {
    errors.push({
      severity: "error",
      code: "media-adapter-cannot-create-official-data",
      message:
        "Media adapters cannot create official results, standings, timing, or documents.",
    });
  }

  if (source.type === "official-document" && request.requestedDataType === "standings") {
    errors.push({
      severity: "error",
      code: "document-adapter-cannot-create-standings",
      message:
        "Document adapters cannot create standings directly; standings must come from approved calculations.",
    });
  }

  if (source.type === "official-timing" && request.requestedDataType === "media") {
    errors.push({
      severity: "error",
      code: "timing-adapter-cannot-create-media",
      message: "Timing adapters cannot create media references.",
    });
  }

  if (errors.length > 0) {
    return {
      adapter: null,
      warnings,
      errors,
    };
  }

  const adapter = new PlaceholderOfficialSourceAdapter(registryEntry.adapterId, source);
  const validation = adapter.validateSource();

  return {
    adapter,
    warnings: [...warnings, ...validation.warnings],
    errors: validation.errors,
  };
}
