import type {
  ParsedDocumentReference,
  ParsedMediaReference,
  ParsedStandingsRow,
} from "../base";
import { PlaceholderOfficialSourceAdapter } from "../base";
import type { OfficialSourceRegistryEntry } from "../../types";
import type {
  VerifiedEventFact,
  VerifiedOverallResult,
  VerifiedRiderEntry,
  VerifiedSourceReference,
  VerifiedStageResult,
} from "../../types";
import {
  mapHtmlDocument,
  mapHtmlEventMetadata,
  mapHtmlMediaReference,
  mapHtmlOverallResult,
  mapHtmlRiderMetadata,
  mapHtmlSourceReference,
  mapHtmlStageResult,
  mapHtmlStanding,
} from "./mapping";
import {
  createEmptyParsedOfficialHtmlDocument,
  type ParsedOfficialHtmlDocument,
} from "./parser";
import { validateParsedOfficialHtmlDocument } from "./validation";

export class OfficialHtmlAdapter extends PlaceholderOfficialSourceAdapter {
  private readonly document: ParsedOfficialHtmlDocument;

  constructor(
    adapterId: string,
    source: OfficialSourceRegistryEntry,
    document: ParsedOfficialHtmlDocument = createEmptyParsedOfficialHtmlDocument(
      source.id,
      source.baseUrl ?? source.channelUrl ?? "about:blank",
    ),
  ) {
    super(adapterId, source);
    this.document = document;
  }

  override validateSource() {
    const baseValidation = super.validateSource();
    const documentValidation = validateParsedOfficialHtmlDocument(this.document);

    return {
      valid: baseValidation.valid && documentValidation.valid,
      warnings: [...baseValidation.warnings, ...documentValidation.warnings],
      errors: [...baseValidation.errors, ...documentValidation.errors],
    };
  }

  override async parseSourceReferences(): Promise<VerifiedSourceReference[]> {
    return this.document.sourceReferences.map(mapHtmlSourceReference);
  }

  override async parseEventMetadata(): Promise<VerifiedEventFact[]> {
    return this.document.eventMetadata
      .map(mapHtmlEventMetadata)
      .filter((event) => event !== null);
  }

  override async parseRiderMetadata(): Promise<VerifiedRiderEntry[]> {
    return this.document.riderMetadata
      .map(mapHtmlRiderMetadata)
      .filter((rider) => rider !== null);
  }

  override async parseOverallResults(): Promise<VerifiedOverallResult[]> {
    return this.document.overallResults
      .map(mapHtmlOverallResult)
      .filter((result) => result !== null);
  }

  override async parseStageResults(): Promise<VerifiedStageResult[]> {
    return this.document.stageResults
      .map(mapHtmlStageResult)
      .filter((result) => result !== null);
  }

  override async parseStandings(): Promise<ParsedStandingsRow[]> {
    return this.document.standings
      .map(mapHtmlStanding)
      .filter((standing) => standing !== null);
  }

  override async parseMedia(): Promise<ParsedMediaReference[]> {
    return this.document.mediaReferences
      .map(mapHtmlMediaReference)
      .filter((media) => media !== null);
  }

  override async parseDocuments(): Promise<ParsedDocumentReference[]> {
    return this.document.documents
      .map(mapHtmlDocument)
      .filter((document) => document !== null);
  }
}
