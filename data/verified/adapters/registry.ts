import { officialSourceRegistry } from "../source-registry";
import type {
  OfficialSourceRegistryEntry,
  OfficialSourceTrustLevel,
  OfficialSourceType,
  VerifiedAllowedDataType,
} from "../types";

export type AdapterKind =
  | "OfficialHTMLAdapter"
  | "FIMAdapter"
  | "RedBullAdapter"
  | "ErzbergrodeoAdapter"
  | "RomaniacsAdapter"
  | "SeaToSkyAdapter"
  | "USHardEnduroAdapter"
  | "OfficialPDFAdapter"
  | "OfficialCSVAdapter"
  | "MediaAdapter";

export type AdapterRegistryEntry = {
  adapterId: string;
  adapterKind: AdapterKind;
  sourceId: string;
  sourceType: OfficialSourceType;
  trustLevel: OfficialSourceTrustLevel;
  supportedDataTypes: VerifiedAllowedDataType[];
  enabled: boolean;
  notes: string;
};

export const adapterRegistry: AdapterRegistryEntry[] = officialSourceRegistry.map(
  (source) => ({
    adapterId: `${source.id}-adapter`,
    adapterKind: getAdapterKind(source),
    sourceId: source.id,
    sourceType: source.type,
    trustLevel: source.trustLevel,
    supportedDataTypes: source.allowedDataTypes,
    enabled: true,
    notes: `Placeholder ${getAdapterKind(source)} for ${source.name}. No parsing, fetching, scraping, or API calls implemented.`,
  }),
);

export function getAdapterRegistryEntry(sourceId: string) {
  return adapterRegistry.find((entry) => entry.sourceId === sourceId) ?? null;
}

export function listAdapterRegistryEntries() {
  return adapterRegistry;
}

function getAdapterKind(source: OfficialSourceRegistryEntry): AdapterKind {
  if (source.id === "fim-official") {
    return "OfficialHTMLAdapter";
  }

  if (source.id === "red-bull-erzbergrodeo-official") {
    return "OfficialHTMLAdapter";
  }

  if (source.id === "red-bull-romaniacs-official") {
    return "OfficialHTMLAdapter";
  }

  if (source.id === "sea-to-sky-official") {
    return "OfficialHTMLAdapter";
  }

  if (source.id === "us-hard-enduro-official") {
    return "OfficialHTMLAdapter";
  }

  if (source.type === "official-document") {
    return "OfficialPDFAdapter";
  }

  if (source.type === "official-timing") {
    return "OfficialCSVAdapter";
  }

  if (source.type === "trusted-media" || source.trustLevel === "media-only") {
    return "MediaAdapter";
  }

  return "OfficialHTMLAdapter";
}
