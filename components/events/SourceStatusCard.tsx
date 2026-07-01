import { Card } from "@/components/ui/card";
import { getOfficialSource } from "@/data/verified/source-registry";
import type { VerifiedEventFact } from "@/data/verified/types";
import { DetailRow } from "./dashboard-ui";
import { UNKNOWN_VERIFIED_VALUE } from "./helpers";

export function SourceStatusCard({ eventFact }: { eventFact: VerifiedEventFact }) {
  const review = eventFact.review;
  const primarySource =
    getOfficialSource(review?.sourceIds[0] ?? eventFact.sourceIds[0])?.name ??
    UNKNOWN_VERIFIED_VALUE;

  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
        Source status
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <DetailRow label="Primary source" value={primarySource} compact />
        <DetailRow
          label="Last reviewed"
          value={review?.lastReviewed ?? UNKNOWN_VERIFIED_VALUE}
          compact
        />
        <DetailRow
          label="Confidence"
          value={review?.confidence ?? UNKNOWN_VERIFIED_VALUE}
          compact
        />
        <DetailRow label="Status" value="Review-first" compact />
      </div>
    </Card>
  );
}
