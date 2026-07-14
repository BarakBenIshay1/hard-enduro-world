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
  return method.toUpperCase() === "POST" && pathname === "/admin/riders/media";
}

export function getAdminImageUploadErrorMessage(code: string) {
  switch (code) {
    case "missing-file":
      return "Choose an image before uploading.";
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
