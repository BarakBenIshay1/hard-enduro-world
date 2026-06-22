import { cn } from "@/lib/cn";

export type EventSelectorOption = {
  value: string;
  label: string;
};

type EventSelectorProps = {
  value: string;
  onChange: (value: string) => void;
  options: EventSelectorOption[];
  label?: string;
};

export function EventSelector({
  value,
  onChange,
  options,
  label = "Event",
}: EventSelectorProps) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-semibold text-foreground/[0.64]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-11 rounded-md border border-border bg-surface px-3 text-sm font-semibold",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        )}
      >
        <option value="all">All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
