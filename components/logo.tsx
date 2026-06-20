import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="group flex items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      aria-label="Hard Enduro World home"
    >
      <div className="relative h-10 w-10 overflow-hidden rounded-md border border-white/[0.18] bg-black shadow-[0_14px_36px_hsl(var(--accent)/0.2)]">
        <div className="absolute inset-x-2 top-2 h-1.5 skew-x-[-22deg] bg-accent" />
        <div className="absolute inset-x-2 top-4 h-1.5 skew-x-[-22deg] bg-gold" />
        <div className="absolute inset-x-2 top-6 h-1.5 skew-x-[-22deg] bg-redline" />
      </div>
      <div className="leading-none">
        <p className="text-sm font-black uppercase tracking-[0.18em]">Hard Enduro</p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.28em] text-accent">
          World
        </p>
      </div>
    </Link>
  );
}
