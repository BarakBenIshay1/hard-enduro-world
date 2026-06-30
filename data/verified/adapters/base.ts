import type {
  OfficialSourceRegistryEntry,
  VerifiedAllowedDataType,
  VerifiedEventFact,
  VerifiedOverallResult,
  VerifiedRiderEntry,
  VerifiedSourceReference,
  VerifiedStageResult,
} from "../types";

export type AdapterValidationIssue = {
  severity: "warning" | "error";
  code: string;
  message: string;
};

export type AdapterValidationResult = {
  valid: boolean;
  warnings: AdapterValidationIssue[];
  errors: AdapterValidationIssue[];
};

export type ParsedStandingsRow = {
  season: number;
  riderSlug: string;
  position: number | null;
  points: number | null;
  wins: number | null;
  podiums: number | null;
  sourceIds: string[];
  notes: string;
};

export type ParsedMediaReference = {
  sourceIds: string[];
  title: string;
  url: string;
  publishedAt: string | null;
  relatedEventSlug: string | null;
  relatedRiderSlug: string | null;
  notes: string;
};

export type ParsedDocumentReference = {
  sourceIds: string[];
  title: string;
  url: string;
  documentType: "regulations" | "entry-list" | "results" | "timing" | "other";
  publishedAt: string | null;
  relatedEventSlug: string | null;
  notes: string;
};

export type OfficialSourceAdapter = {
  readonly adapterId: string;
  readonly source: OfficialSourceRegistryEntry;

  identifySource(): OfficialSourceRegistryEntry;
  supportedDataTypes(): VerifiedAllowedDataType[];
  validateSource(): AdapterValidationResult;

  parseSourceReferences(): Promise<VerifiedSourceReference[]>;
  parseEventMetadata(): Promise<VerifiedEventFact[]>;
  parseRiderMetadata(): Promise<VerifiedRiderEntry[]>;
  parseOverallResults(): Promise<VerifiedOverallResult[]>;
  parseStageResults(): Promise<VerifiedStageResult[]>;
  parseStandings(): Promise<ParsedStandingsRow[]>;
  parseMedia(): Promise<ParsedMediaReference[]>;
  parseDocuments(): Promise<ParsedDocumentReference[]>;
};

export class PlaceholderOfficialSourceAdapter implements OfficialSourceAdapter {
  readonly adapterId: string;
  readonly source: OfficialSourceRegistryEntry;

  constructor(adapterId: string, source: OfficialSourceRegistryEntry) {
    this.adapterId = adapterId;
    this.source = source;
  }

  identifySource() {
    return this.source;
  }

  supportedDataTypes() {
    return this.source.allowedDataTypes;
  }

  validateSource(): AdapterValidationResult {
    const warnings: AdapterValidationIssue[] = [];
    const errors: AdapterValidationIssue[] = [];

    if (!this.source.requiresReview) {
      errors.push({
        severity: "error",
        code: "adapter-source-must-require-review",
        message: "Official source adapters require review-first source entries.",
      });
    }

    if (this.source.trustLevel === "media-only") {
      warnings.push({
        severity: "warning",
        code: "adapter-media-only",
        message: "Media-only adapters cannot parse official results or standings.",
      });
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors,
    };
  }

  async parseSourceReferences() {
    return [];
  }

  async parseEventMetadata() {
    return [];
  }

  async parseRiderMetadata() {
    return [];
  }

  async parseOverallResults() {
    return [];
  }

  async parseStageResults() {
    return [];
  }

  async parseStandings() {
    return [];
  }

  async parseMedia() {
    return [];
  }

  async parseDocuments() {
    return [];
  }
}
