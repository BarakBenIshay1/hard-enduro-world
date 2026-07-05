import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";

export type RiderRelatedLink = {
  label: string;
  href: string;
  type: string;
};

export function RiderRelatedLinks({ links }: { links: RiderRelatedLink[] }) {
  if (links.length === 0) {
    return (
      <section>
        <SectionTitle
          eyebrow="Related Links"
          title="Connected records"
          description="Related team, manufacturer, motorcycle, and event links will appear as verified relationships are added."
        />
        <Card className="mt-6 p-4 text-sm font-semibold text-foreground/[0.62]">
          Verified related links coming soon.
        </Card>
      </section>
    );
  }

  return (
    <section>
      <SectionTitle
        eyebrow="Related Links"
        title="Connected records"
        description="Jump into verified team, manufacturer, motorcycle, and event records connected to this rider."
      />
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {links.map((link) => (
          <Link
            key={`${link.type}-${link.href}`}
            href={link.href}
            className="group rounded-md border border-border bg-surface-muted p-4 transition hover:border-accent hover:bg-accent/10"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/[0.48]">
              {link.type}
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="font-semibold">{link.label}</span>
              <ArrowRight
                className="h-4 w-4 text-accent transition group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
