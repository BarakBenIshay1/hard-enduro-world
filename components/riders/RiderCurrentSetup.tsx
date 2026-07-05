import Link from "next/link";
import { Bike, CalendarDays, Hash, Shield, Trophy, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";

export type RiderSetupItem = {
  label: string;
  value: string;
  href?: string;
};

export function RiderCurrentSetup({ items }: { items: RiderSetupItem[] }) {
  return (
    <section>
      <SectionTitle
        eyebrow="Current Setup"
        title="Team, machine, and season"
        description="Current paddock context for the rider."
      />
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <Card key={item.label} className="p-5">
            <SetupIcon label={item.label} />
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/[0.48]">
              {item.label}
            </p>
            {item.href ? (
              <Link
                href={item.href}
                className="mt-1 block font-semibold transition hover:text-accent"
              >
                {item.value}
              </Link>
            ) : (
              <p className="mt-1 font-semibold">{item.value}</p>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}

function SetupIcon({ label }: { label: string }) {
  const Icon =
    label === "Team"
      ? Users
      : label === "Manufacturer"
        ? Trophy
        : label === "Motorcycle"
          ? Bike
          : label === "Rider Number"
            ? Hash
            : label === "Status"
              ? Shield
              : CalendarDays;

  return <Icon className="h-5 w-5 text-accent" aria-hidden="true" />;
}
