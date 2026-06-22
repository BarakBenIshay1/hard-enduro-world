export type LeaderboardRow = {
  id: string;
  label: string;
  value: number;
  detail?: string;
  href?: string;
};

export function createLeaderboard<T>({
  rows,
  getId,
  getLabel,
  getValue,
  getDetail,
  getHref,
  limit = 10,
}: {
  rows: T[];
  getId: (row: T) => string | null;
  getLabel: (row: T) => string;
  getValue: (row: T) => number;
  getDetail?: (row: T) => string | undefined;
  getHref?: (row: T) => string | undefined;
  limit?: number;
}): LeaderboardRow[] {
  const map = new Map<string, LeaderboardRow>();

  for (const row of rows) {
    const id = getId(row);

    if (!id) {
      continue;
    }

    const current = map.get(id) ?? {
      id,
      label: getLabel(row),
      value: 0,
      detail: getDetail?.(row),
      href: getHref?.(row),
    };

    current.value += getValue(row);
    map.set(id, current);
  }

  return Array.from(map.values())
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, limit);
}

export function topValue(rows: LeaderboardRow[]) {
  return rows[0] ?? null;
}
