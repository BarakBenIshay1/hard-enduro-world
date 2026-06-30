import { getOfficialSource } from "../source-registry";
import { OfficialHtmlAdapter } from "../adapters/html/adapter";
import type { ParsedOfficialHtmlDocument } from "../adapters/html/parser";
import type { VerifiedIntakePackage } from "./intake";
import { summarizeVerifiedIntake, type VerifiedPipelineSummary } from "./summary";

export type OfflinePipelineRunnerResult = {
  parsedObjects: {
    sources: number;
    eventFacts: number;
    riderReferences: number;
    overallResults: number;
    stageResults: number;
  };
  adapterWarnings: string[];
  validationWarnings: VerifiedPipelineSummary["validation"]["warnings"];
  reviewSummary: {
    wouldAdd: number;
    wouldUpdate: number;
    missing: number;
    needsManualVerification: number;
  };
  coverageSummary: VerifiedPipelineSummary["coverage"];
  summary: VerifiedPipelineSummary;
};

const offlineSampleHtmlDocument: ParsedOfficialHtmlDocument = {
  sourceId: "red-bull-erzbergrodeo-official",
  canonicalUrl: "https://example.com/offline/red-bull-erzbergrodeo-2026",
  receivedAt: "2026-06-08T08:00:00.000Z",
  sourceReferences: [
    {
      sourceId: "red-bull-erzbergrodeo-official",
      sourceName: "Red Bull Erzbergrodeo Official",
      sourceUrl: "https://example.com/offline/red-bull-erzbergrodeo-2026",
      publishedDate: null,
      notes: "Offline local sample source. No external website was fetched.",
    },
  ],
  eventMetadata: [
    {
      eventSlug: "erzbergrodeo-2026",
      displayName: "Red Bull Erzbergrodeo 2026",
      previousWinner: null,
      verifiedWinner: "Manuel Lettenbichler",
      verifiedFinisherCount: null,
      factsNote: "Offline sample event fact for pipeline validation only.",
      sourceIds: ["red-bull-erzbergrodeo-official"],
    },
  ],
  riderMetadata: [
    {
      riderSlug: "manuel-lettenbichler",
      sourceIds: ["red-bull-erzbergrodeo-official"],
      notes: "Offline sample rider reference for pipeline validation only.",
    },
  ],
  overallResults: [
    {
      eventSlug: "erzbergrodeo-2026",
      riderSlug: "manuel-lettenbichler",
      className: "Pro",
      overallPosition: 1,
      classPosition: 1,
      points: null,
      totalTimeText: null,
      gapToLeaderText: null,
      gapToPreviousText: null,
      penaltiesText: null,
      status: "FINISHED",
      sourceIds: ["red-bull-erzbergrodeo-official"],
      notes: "Offline sample overall result. Unknown values remain null.",
    },
  ],
  stageResults: [],
  standings: [],
  documents: [],
  mediaReferences: [],
  notes: "Minimal local in-memory sample for the offline verified pipeline runner.",
};

export async function runOfflineVerifiedPipeline(): Promise<OfflinePipelineRunnerResult> {
  const source = getOfficialSource(offlineSampleHtmlDocument.sourceId);

  if (!source) {
    throw new Error("Offline sample source is not registered.");
  }

  const adapter = new OfficialHtmlAdapter(
    "offline-html-sample-adapter",
    source,
    offlineSampleHtmlDocument,
  );
  const adapterValidation = adapter.validateSource();
  const intake: VerifiedIntakePackage = {
    packageId: "offline-html-sample",
    sourceType: "official-html",
    receivedAt: offlineSampleHtmlDocument.receivedAt,
    season: 2026,
    sources: (await adapter.parseSourceReferences()).map((parsedSource) => ({
      id: parsedSource.id,
      name: parsedSource.name,
      url: parsedSource.url,
      sourceType: "official-html",
      publishedDate: parsedSource.publishedDate,
      confidence: parsedSource.confidence,
      notes: parsedSource.notes,
    })),
    eventFacts: await adapter.parseEventMetadata(),
    riderReferences: await adapter.parseRiderMetadata(),
    overallResults: await adapter.parseOverallResults(),
    stageResults: [],
    notes: offlineSampleHtmlDocument.notes,
  };
  const summary = summarizeVerifiedIntake(intake);

  return {
    parsedObjects: {
      sources: intake.sources.length,
      eventFacts: intake.eventFacts.length,
      riderReferences: intake.riderReferences.length,
      overallResults: intake.overallResults.length,
      stageResults: intake.stageResults.length,
    },
    adapterWarnings: adapterValidation.warnings.map((warning) => warning.message),
    validationWarnings: summary.validation.warnings,
    reviewSummary: {
      wouldAdd: summary.review.wouldAdd.length,
      wouldUpdate: summary.review.wouldUpdate.length,
      missing: summary.review.missing.length,
      needsManualVerification: summary.review.needsManualVerification.length,
    },
    coverageSummary: summary.coverage,
    summary,
  };
}
