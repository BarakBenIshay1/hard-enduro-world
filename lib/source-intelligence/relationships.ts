import type {
  EntityReference,
  RelationshipReference,
  RelationshipType,
  SourceConfidence,
} from "./types";

export const supportedRelationshipTypes: RelationshipType[] = [
  "video-to-rider",
  "video-to-team",
  "video-to-manufacturer",
  "video-to-event",
  "video-to-stage",
  "result-to-rider",
  "result-to-event",
  "result-to-stage",
  "event-to-team",
  "event-to-manufacturer",
  "manufacturer-to-motorcycle",
  "team-to-rider",
  "rider-to-motorcycle",
  "season-to-event",
  "season-to-standing",
  "media-to-event",
  "media-to-rider",
  "media-to-team",
];

export function createRelationshipReference({
  type,
  from,
  to,
  confidence,
  sourceIds,
  notes = null,
}: {
  type: RelationshipType;
  from: EntityReference;
  to: EntityReference;
  confidence: SourceConfidence;
  sourceIds: string[];
  notes?: string | null;
}): RelationshipReference {
  return {
    type,
    from,
    to,
    confidence,
    sourceIds,
    notes,
  };
}

export function isSupportedRelationship(type: string): type is RelationshipType {
  return supportedRelationshipTypes.includes(type as RelationshipType);
}
