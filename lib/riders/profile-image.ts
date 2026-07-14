export function getSafeRiderProfileImageUrl(value: string | null | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function shouldRenderRiderProfileImage(value: string | null | undefined) {
  return Boolean(getSafeRiderProfileImageUrl(value));
}
