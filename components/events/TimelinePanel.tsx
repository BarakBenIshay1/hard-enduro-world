import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";
import type { VerifiedEventFact } from "@/data/verified/types";
import { CompactTimelineItem } from "./dashboard-ui";
import type { EventStageCard } from "./types";

export function TimelinePanel({
  verifiedFact,
  stageCards,
}: {
  verifiedFact: VerifiedEventFact;
  stageCards: EventStageCard[];
}) {
  return (
    <section id="race-timeline" className="scroll-mt-32">
      <SectionTitle
        eyebrow="Timeline"
        title="Race timeline"
        description="Schedule, milestones, and stage controls are merged into one operational view."
      />
      <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-5">
          <h3 className="text-xl font-black">Official milestones</h3>
          <div className="mt-4 grid gap-2">
            {verifiedFact.eventTimeline?.map((item) => (
              <CompactTimelineItem key={item.label} item={item} />
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="text-xl font-black">Stage control</h3>
          <div className="mt-4 grid gap-2">
            {stageCards.map((stage) => (
              <div
                key={stage.id}
                className="grid gap-3 rounded-md border border-border bg-surface-muted p-3 sm:grid-cols-[1fr_repeat(3,110px)] sm:items-center"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                    Stage {stage.order} / {stage.type}
                  </p>
                  <h4 className="mt-1 font-black">{stage.name}</h4>
                </div>
                <p className="text-sm font-semibold">{stage.distance}</p>
                <p className="text-sm text-foreground/[0.62]">{stage.winner}</p>
                <p className="text-sm text-foreground/[0.62]">{stage.bestTime}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}
