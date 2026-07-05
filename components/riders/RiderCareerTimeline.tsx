import { Bike, Trophy, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";

export type RiderCareerTimelineItem = {
  id: string;
  year: number;
  season: string;
  team: string;
  manufacturer: string;
  motorcycle: string;
  championshipPosition: string;
  achievement: string;
};

export function RiderCareerTimeline({ items }: { items: RiderCareerTimelineItem[] }) {
  return (
    <section>
      <SectionTitle
        eyebrow="Career Timeline"
        title="Season-by-season history"
        description="Teams, manufacturers, motorcycles, and milestones by season."
      />
      <div className="mt-6 grid gap-3">
        {items.length > 0 ? (
          items.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="grid gap-4 lg:grid-cols-[110px_1fr_180px] lg:items-center">
                <div>
                  <p className="text-2xl font-black">{item.year}</p>
                  <p className="text-sm text-foreground/[0.56]">{item.season}</p>
                </div>
                <div className="grid gap-2 text-sm text-foreground/[0.66]">
                  <span className="inline-flex items-center gap-2">
                    <Users className="h-4 w-4 text-accent" aria-hidden="true" />
                    {item.team}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-accent" aria-hidden="true" />
                    {item.manufacturer}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Bike className="h-4 w-4 text-accent" aria-hidden="true" />
                    {item.motorcycle}
                  </span>
                </div>
                <div className="rounded-md border border-border bg-surface-muted px-3 py-2 text-sm">
                  <p className="font-semibold">{item.championshipPosition}</p>
                  <p className="mt-1 text-foreground/[0.58]">{item.achievement}</p>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <CompactPlaceholder text="Verified data coming soon." />
        )}
      </div>
    </section>
  );
}

function CompactPlaceholder({ text }: { text: string }) {
  return <Card className="p-4 text-sm font-semibold text-foreground/[0.62]">{text}</Card>;
}
