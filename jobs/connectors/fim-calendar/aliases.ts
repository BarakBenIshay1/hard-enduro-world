import { createSlug } from "@/lib/slug";
import { normalizeName } from "@/lib/source-intelligence";

export type FimCalendarEventAlias = {
  canonicalSlug: string;
  aliases: string[];
};

export const fimCalendarEventAliases: FimCalendarEventAlias[] = [
  {
    canonicalSlug: "erzbergrodeo-2026",
    aliases: [
      "Red Bull Erzbergrodeo",
      "Red Bull Erzbergrodeo 2026",
      "Erzbergrodeo",
      "Erzbergrodeo 2026",
      "erzbergrodeo-2026",
      "red-bull-erzbergrodeo-2026",
    ],
  },
];

const sponsorWords = new Set(["red", "bull", "fim", "official"]);

export function resolveExplicitEventAlias(value: string) {
  const normalized = normalizeAlias(value);

  return (
    fimCalendarEventAliases.find((entry) =>
      entry.aliases.some((alias) => normalizeAlias(alias) === normalized),
    )?.canonicalSlug ?? null
  );
}

export function normalizeSlug(value: string) {
  return createSlug(value);
}

export function sponsorlessEventKey(value: string, seasonYear: number) {
  return normalizeName(value)
    .split(" ")
    .filter((part) => part !== String(seasonYear))
    .filter((part) => !sponsorWords.has(part))
    .join(" ");
}

function normalizeAlias(value: string) {
  return createSlug(value.replace(/\s+/g, "-"));
}
