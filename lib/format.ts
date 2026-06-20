export function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

export function formatDateRange(startDate: Date, endDate?: Date | null) {
  if (!endDate) {
    return formatDate(startDate);
  }

  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en").format(value);
}

export function formatOptional(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return String(value);
}
