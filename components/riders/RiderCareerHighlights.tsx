import { Medal, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";

export type RiderCareerHighlight = {
  label: string;
  value: string;
};

export function RiderCareerHighlights({
  highlights,
}: {
  highlights: RiderCareerHighlight[];
}) {
  return (
    <section>
      <SectionTitle
        eyebrow="Career Highlights"
        title="Verified milestones"
        description="Confirmed achievements and notable results will appear here as rider records are reviewed."
      />
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {highlights.length > 0 ? (
          highlights.map((highlight, index) => (
            <Card key={highlight.label} className="p-5">
              {index === 0 ? (
                <Trophy className="h-5 w-5 text-accent" aria-hidden="true" />
              ) : (
                <Medal className="h-5 w-5 text-accent" aria-hidden="true" />
              )}
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/[0.48]">
                {highlight.label}
              </p>
              <p className="mt-2 font-semibold">{highlight.value}</p>
            </Card>
          ))
        ) : (
          <Card className="p-4 text-sm font-semibold text-foreground/[0.62] md:col-span-3">
            Verified data coming soon.
          </Card>
        )}
      </div>
    </section>
  );
}
