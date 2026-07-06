export function normalizeName(value: string) {
  return normalizeWhitespace(removeAccents(value)).toLowerCase();
}

export function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function removeAccents(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function namesMatch(left: string, right: string) {
  return normalizeName(left) === normalizeName(right);
}
