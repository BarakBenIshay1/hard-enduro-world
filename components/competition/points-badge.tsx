type PointsBadgeProps = {
  points: number | null;
};

export function PointsBadge({ points }: PointsBadgeProps) {
  return (
    <span className="inline-flex min-w-14 items-center justify-center rounded-sm border border-accent/30 bg-accent/10 px-2.5 py-1 font-mono text-sm font-black text-accent">
      {points ?? 0}
    </span>
  );
}
