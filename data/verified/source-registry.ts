import type {
  OfficialSourceRegistryEntry,
  OfficialSourceTrustLevel,
  OfficialSourceType,
  VerifiedAllowedDataType,
} from "./types";

export const officialSourceRegistry: OfficialSourceRegistryEntry[] = [
  {
    id: "fim-official",
    name: "FIM Official",
    type: "official",
    baseUrl: "https://www.fim-moto.com",
    channelUrl: null,
    allowedDataTypes: ["events", "results", "standings", "documents"],
    trustLevel: "primary",
    requiresReview: true,
    notes:
      "Primary source for official championship calendars, classifications, standings, and documents.",
  },
  {
    id: "red-bull-motorsports",
    name: "Red Bull Motorsports",
    type: "official",
    baseUrl: "https://www.redbull.com/int-en/tags/motorsports",
    channelUrl: "https://www.youtube.com/@RedBullMotorsports",
    allowedDataTypes: ["events", "media", "documents"],
    trustLevel: "secondary",
    requiresReview: true,
    notes:
      "Trusted official Red Bull motorsports source. Use for event/media context, not standalone official timing unless backed by official classification documents.",
  },
  {
    id: "red-bull-erzbergrodeo-official",
    name: "Red Bull Erzbergrodeo Official",
    type: "official",
    baseUrl: "https://www.redbullerzbergrodeo.com",
    channelUrl: null,
    allowedDataTypes: ["events", "results", "documents", "timing", "media"],
    trustLevel: "primary",
    requiresReview: true,
    notes:
      "Primary event source for Red Bull Erzbergrodeo event metadata, official documents, results, and timing exports when available.",
  },
  {
    id: "red-bull-romaniacs-official",
    name: "Red Bull Romaniacs Official",
    type: "official",
    baseUrl: "https://www.redbullromaniacs.com",
    channelUrl: "https://www.youtube.com/@RBRomaniacs",
    allowedDataTypes: ["events", "results", "documents", "timing", "media"],
    trustLevel: "primary",
    requiresReview: true,
    notes:
      "Primary event source for Red Bull Romaniacs event metadata, results, official documents, timing, and media.",
  },
  {
    id: "sea-to-sky-official",
    name: "Sea to Sky Official",
    type: "official",
    baseUrl: "https://seatosky.com.tr",
    channelUrl: "https://www.youtube.com/@Seatosky_Official",
    allowedDataTypes: ["events", "results", "documents", "timing", "media"],
    trustLevel: "primary",
    requiresReview: true,
    notes:
      "Primary event source for Sea to Sky event metadata, documents, results, timing, and official media.",
  },
  {
    id: "us-hard-enduro-official",
    name: "US Hard Enduro Official",
    type: "official",
    baseUrl: "https://www.ushardenduro.com",
    channelUrl: "http://youtube.com/@ushardenduro",
    allowedDataTypes: ["events", "results", "standings", "documents", "timing", "media"],
    trustLevel: "primary",
    requiresReview: true,
    notes:
      "Primary US Hard Enduro source for official US event metadata, results, standings, timing, documents, and media.",
  },
  {
    id: "official-event-pdfs",
    name: "Official Event PDFs",
    type: "official-document",
    baseUrl: null,
    channelUrl: null,
    allowedDataTypes: ["events", "results", "standings", "documents", "timing"],
    trustLevel: "primary",
    requiresReview: true,
    notes:
      "Official PDF documents from FIM, organizers, timing providers, or event websites. Store URL and document metadata before parsing.",
  },
  {
    id: "official-timing-csv-exports",
    name: "Official Timing CSV Exports",
    type: "official-timing",
    baseUrl: null,
    channelUrl: null,
    allowedDataTypes: ["results", "standings", "timing"],
    trustLevel: "primary",
    requiresReview: true,
    notes:
      "Official timing or classification exports only. Never use unsourced spreadsheet copies as verified data.",
  },
  {
    id: "youtube-red-bull-motorsports",
    name: "YouTube Red Bull Motorsports",
    type: "trusted-media",
    baseUrl: null,
    channelUrl: "https://www.youtube.com/@RedBullMotorsports",
    allowedDataTypes: ["media"],
    trustLevel: "media-only",
    requiresReview: true,
    notes:
      "Trusted media/video source only. Cannot create official results, standings, timing, or records.",
  },
  {
    id: "youtube-us-hard-enduro",
    name: "YouTube US Hard Enduro",
    type: "trusted-media",
    baseUrl: null,
    channelUrl: "http://youtube.com/@ushardenduro",
    allowedDataTypes: ["media"],
    trustLevel: "media-only",
    requiresReview: true,
    notes:
      "Trusted media/video source only. Cannot create official results, standings, timing, or records.",
  },
  {
    id: "youtube-red-bull-romaniacs",
    name: "YouTube Red Bull Romaniacs",
    type: "trusted-media",
    baseUrl: null,
    channelUrl: "https://www.youtube.com/@RBRomaniacs",
    allowedDataTypes: ["media"],
    trustLevel: "media-only",
    requiresReview: true,
    notes:
      "Trusted media/video source only. Cannot create official results, standings, timing, or records.",
  },
  {
    id: "youtube-sea-to-sky-official",
    name: "YouTube Sea to Sky Official",
    type: "trusted-media",
    baseUrl: null,
    channelUrl: "https://www.youtube.com/@Seatosky_Official",
    allowedDataTypes: ["media"],
    trustLevel: "media-only",
    requiresReview: true,
    notes:
      "Trusted media/video source only. Cannot create official results, standings, timing, or records.",
  },
  {
    id: "youtube-2pro1slow",
    name: "YouTube 2PRO1SLOW",
    type: "trusted-media",
    baseUrl: null,
    channelUrl: "https://www.youtube.com/@2PRO1SLOW",
    allowedDataTypes: ["media"],
    trustLevel: "media-only",
    requiresReview: true,
    notes:
      "Trusted media/video source only. Use for media references, not verified official classifications.",
  },
  {
    id: "youtube-endurolifecom",
    name: "YouTube EnduroLife",
    type: "trusted-media",
    baseUrl: null,
    channelUrl: "https://www.youtube.com/@endurolifecom",
    allowedDataTypes: ["media"],
    trustLevel: "media-only",
    requiresReview: true,
    notes:
      "Trusted media/video source only. Use for media references, not verified official classifications.",
  },
];

export function getOfficialSource(sourceId: string) {
  return officialSourceRegistry.find((source) => source.id === sourceId) ?? null;
}

export function isSourceAllowedForDataType(
  sourceId: string,
  dataType: VerifiedAllowedDataType,
) {
  const source = getOfficialSource(sourceId);
  return source?.allowedDataTypes.includes(dataType) ?? false;
}

export function getOfficialSourcesByTrustLevel(trustLevel: OfficialSourceTrustLevel) {
  return officialSourceRegistry.filter((source) => source.trustLevel === trustLevel);
}

export function getOfficialSourcesByType(type: OfficialSourceType) {
  return officialSourceRegistry.filter((source) => source.type === type);
}
