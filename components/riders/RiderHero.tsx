import { Bike, Flag, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";

export type RiderHeroProps = {
  name: string;
  initials: string;
  country: string;
  countryCode: string;
  team: string;
  manufacturer: string;
  motorcycle: string;
  status: string;
  bio: string;
  profileImageUrl: string | null;
};

export function RiderHero({
  name,
  initials,
  country,
  countryCode,
  team,
  manufacturer,
  motorcycle,
  status,
  bio,
  profileImageUrl,
}: RiderHeroProps) {
  return (
    <section className="relative overflow-hidden bg-black pt-28 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(0_0%_4%),hsl(220_10%_10%)_48%,hsl(24_92%_18%))]" />
      <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_18%_18%,hsl(24_94%_52%/0.22),transparent_28%),linear-gradient(145deg,transparent_0_44%,hsl(0_0%_100%/0.08)_44%_45%,transparent_45%)]" />

      <Container className="relative grid gap-10 pb-12 lg:grid-cols-[1fr_380px] lg:items-end">
        <div className="max-w-4xl">
          <Breadcrumb items={[{ label: "Riders", href: "/riders" }, { label: name }]} />
          <div className="mt-8 flex flex-wrap gap-2">
            <Badge className="border-white/[0.16] bg-white/10 text-white">{status}</Badge>
            <Badge className="border-accent/40 bg-accent/15 text-accent">
              Rider Profile
            </Badge>
          </div>
          <h1 className="mt-5 max-w-3xl text-5xl font-black tracking-tight md:text-7xl">
            {name}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/[0.68]">{bio}</p>

          <div className="mt-7 grid gap-3 text-sm text-white/[0.72] sm:grid-cols-2 xl:grid-cols-4">
            <HeroMeta icon={Flag} label={`${country} (${countryCode})`} />
            <HeroMeta icon={Users} label={team} />
            <HeroMeta icon={Trophy} label={manufacturer} />
            <HeroMeta icon={Bike} label={motorcycle} />
          </div>
        </div>

        <Card className="relative mx-auto aspect-square w-full max-w-[340px] overflow-hidden border-white/[0.14] bg-white/[0.06] p-5 text-white backdrop-blur">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,hsl(24_94%_52%/0.22),transparent_34%)]" />
          <div className="flex h-full items-center justify-center rounded-full border border-white/[0.16] bg-black/40">
            {profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profileImageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-full border border-accent/40 bg-accent/15 text-5xl font-black text-accent">
                {initials}
              </div>
            )}
          </div>
        </Card>
      </Container>
    </section>
  );
}

function HeroMeta({ icon: Icon, label }: { icon: typeof Flag; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-white/[0.12] bg-white/[0.07] px-3 py-2">
      <Icon className="h-4 w-4 text-accent" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </span>
  );
}
