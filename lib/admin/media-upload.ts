export const adminImageUploadConfig = {
  maxBytes: 5 * 1024 * 1024,
  maxRequestBytes: 6 * 1024 * 1024,
  allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  defaultBucket: "hard-enduro-media",
} as const;

export type AdminImageUploadValidationInput = {
  size: number;
  type: string;
};

export type AdminMediaEntityType =
  | "events"
  | "manufacturers"
  | "motorcycles"
  | "riders"
  | "teams";

export type AdminMediaSlot = "gallery" | "hero" | "logo" | "profile";

export function getAdminMediaBucket() {
  return (
    process.env.SUPABASE_STORAGE_BUCKET?.trim() || adminImageUploadConfig.defaultBucket
  );
}

export function validateAdminImageUpload(input: AdminImageUploadValidationInput) {
  if (!input.size) return "missing-file";
  if (input.size > adminImageUploadConfig.maxBytes) return "file-too-large";
  if (!(adminImageUploadConfig.allowedTypes as readonly string[]).includes(input.type)) {
    return "unsupported-file-type";
  }
  return null;
}

export function isAdminMediaUploadRequest(method: string, pathname: string) {
  return (
    method.toUpperCase() === "POST" &&
    [
      "/admin/events/media",
      "/admin/riders/media",
      "/admin/teams/media",
      "/admin/manufacturers/media",
      "/admin/motorcycles/media",
    ].includes(pathname)
  );
}

export function isSafeAdminMediaEntityId(value: string) {
  return /^[a-z0-9][a-z0-9_-]{4,80}$/i.test(value);
}

export function sanitizeStorageFileName(value: string) {
  const baseName = value.split(/[\\/]/).pop() ?? "image";
  const withoutExtension = baseName.replace(/\.[^.]+$/, "");
  const sanitized = withoutExtension
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return sanitized || "image";
}

export function buildAdminMediaObjectPath({
  entityType,
  entityId,
  slot,
  fileName,
  extension,
  uniqueId,
}: {
  entityType: AdminMediaEntityType;
  entityId: string;
  slot: AdminMediaSlot;
  fileName: string;
  extension: string;
  uniqueId: string;
}) {
  if (!isSafeAdminMediaEntityId(entityId)) {
    throw new Error("invalid-entity-id");
  }

  const safeFileName = sanitizeStorageFileName(fileName);
  const safeUniqueId = uniqueId.replace(/[^a-z0-9-]/gi, "");
  const safeExtension = extension.replace(/[^a-z0-9]/gi, "") || "bin";

  return `${entityType}/${entityId}/${slot}/${safeFileName}-${safeUniqueId}.${safeExtension}`;
}

export function getAdminImageUploadErrorMessage(code: string) {
  switch (code) {
    case "missing-file":
      return "Choose an image before uploading.";
    case "missing-entity-id":
      return "Save the record before uploading an image.";
    case "invalid-entity-id":
      return "The upload target is invalid.";
    case "file-too-large":
      return "Image must be smaller than 5 MB.";
    case "unsupported-file-type":
      return "Use a JPG, PNG, WebP, or AVIF image.";
    case "storage-not-configured":
      return "Storage bucket is unavailable.";
    case "unauthorized":
      return "You do not have permission to upload images.";
    case "session-expired":
      return "Session expired. Please sign in again.";
    case "upload-failed":
      return "Upload temporarily failed. Please try again.";
    default:
      return "Upload temporarily failed. Please try again.";
  }
}

export function extensionForImageType(type: string) {
  switch (type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/avif":
      return "avif";
    default:
      return "bin";
  }
}
