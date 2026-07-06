import type {
  ChangeItem,
  SourceConfidence,
  VerificationDecision,
  VerificationStatus,
} from "./types";

export function createVerificationDecision({
  id,
  status,
  reason,
  sourceIds,
  confidence,
  reviewerId = null,
  decidedAt = null,
}: {
  id: string;
  status: VerificationStatus;
  reason: string;
  sourceIds: string[];
  confidence: SourceConfidence;
  reviewerId?: string | null;
  decidedAt?: string | null;
}): VerificationDecision {
  return {
    id,
    status,
    reviewerId,
    decidedAt,
    reason,
    sourceIds,
    confidence,
  };
}

export function recommendVerificationStatus(change: ChangeItem): VerificationStatus {
  if (change.confidence.score >= 0.9 && change.sourceIds.length > 0) {
    return "needs-review";
  }

  if (change.confidence.score <= 0.25 || change.sourceIds.length === 0) {
    return "unknown";
  }

  return "pending";
}
