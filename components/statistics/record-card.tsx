import Link from "next/link";
import { Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";

type RecordCardProps = {
  title: string;
  value: string;
  holder: string;
  description: string;
  href?: string;
};

export function RecordCard({ title, value, holder, description, href }: RecordCardProps) {
  return (
    <Card className="p-6">
      <Trophy className="h-6 w-6 text-accent" aria-hidden="true" />
      <p className="mt-6 text-xs uppercase tracking-[0.18em] text-foreground/[0.48]">
        {title}
      </p>
      <p className="mt-2 text-4xl font-black text-accent">{value}</p>
      {href ? (
        <Link href={href} className="mt-3 inline-block font-semibold hover:text-accent">
          {holder}
        </Link>
      ) : (
        <p className="mt-3 font-semibold">{holder}</p>
      )}
      <p className="mt-3 text-sm leading-6 text-foreground/[0.62]">{description}</p>
    </Card>
  );
}
