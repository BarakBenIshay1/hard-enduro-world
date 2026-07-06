import { namesMatch, normalizeName } from "./normalization";
import type { EntityAlias, EntityReference, SourceConfidence } from "./types";

export type EntityMatchCandidate = {
  entity: EntityReference;
  aliases?: EntityAlias[];
};

export type EntityResolutionResult = {
  status: "matched" | "ambiguous" | "not-found";
  query: string;
  normalizedQuery: string;
  matches: EntityReference[];
  confidence: SourceConfidence;
};

export function resolveEntityByName({
  query,
  candidates,
}: {
  query: string;
  candidates: EntityMatchCandidate[];
}): EntityResolutionResult {
  const normalizedQuery = normalizeName(query);
  const matches = candidates
    .filter((candidate) => {
      if (namesMatch(query, candidate.entity.displayName)) return true;

      return candidate.aliases?.some((alias) => namesMatch(query, alias.alias)) ?? false;
    })
    .map((candidate) => candidate.entity);

  return {
    status:
      matches.length === 1 ? "matched" : matches.length > 1 ? "ambiguous" : "not-found",
    query,
    normalizedQuery,
    matches,
    confidence: {
      level: matches.length === 1 ? "manual-review" : "unknown",
      score: matches.length === 1 ? 0.82 : 0,
      reason:
        matches.length === 1
          ? "Exact normalized name or alias match."
          : "No unique exact normalized match found.",
    },
  };
}
