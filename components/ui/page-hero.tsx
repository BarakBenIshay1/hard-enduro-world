import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/cn";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  compact?: boolean;
};

export function PageHero({
  eyebrow,
  title,
  description,
  children,
  compact,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden border-b border-border bg-hero text-white",
        compact ? "pt-32 pb-14" : "pt-36 pb-20 lg:pt-44 lg:pb-24",
      )}
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,hsl(var(--accent)/0.32),transparent_32%),linear-gradient(135deg,hsl(0_0%_4%),hsl(220_10%_12%)_48%,hsl(18_80%_20%))]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
      <Container>
        <div className="max-w-4xl">
          {eyebrow ? <Badge>{eyebrow}</Badge> : null}
          <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
              {description}
            </p>
          ) : null}
          {children ? <div className="mt-8">{children}</div> : null}
        </div>
      </Container>
    </section>
  );
}
