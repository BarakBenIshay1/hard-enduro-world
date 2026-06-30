import type { VerifiedSourceReference } from "./types";

export const verifiedSources: VerifiedSourceReference[] = [
  {
    id: "erzbergrodeo-2026-manual-first-pass",
    name: "Red Bull Erzbergrodeo 2026 verified first-pass result note",
    url: "https://example.com/source-placeholder/red-bull-erzbergrodeo-2026-results",
    sourceType: "manual_verified",
    publishedDate: null,
    confidence: "high",
    notes:
      "Manual verified/source-tracked placeholder for the first published seed pass. Stores only confirmed podium and finisher-count facts; exact timing, gaps, penalties, and points remain unknown.",
  },
];

export function getVerifiedSource(sourceId: string) {
  return verifiedSources.find((source) => source.id === sourceId) ?? null;
}
