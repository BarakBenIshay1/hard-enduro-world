import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageTeams } from "@/lib/admin/team-cms";
import {
  adminImageUploadConfig,
  buildAdminMediaObjectPath,
  extensionForImageType,
  getAdminMediaBucket,
  getAdminImageUploadErrorMessage,
  isSafeAdminMediaEntityId,
  validateAdminImageUpload,
} from "@/lib/admin/media-upload";
import { sanitizeAdminError } from "@/lib/admin/platform";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session.user || !canManageTeams(session.role)) {
    return uploadError("unauthorized", 403);
  }

  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) return uploadError("storage-not-configured", 503);

  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > 0 && contentLength > adminImageUploadConfig.maxRequestBytes) {
      return uploadError("file-too-large", 413);
    }

    const formData = await request.formData();
    const teamId = stringField(formData, "teamId");
    if (!teamId) return uploadError("missing-entity-id", 400);
    if (!isSafeAdminMediaEntityId(teamId)) return uploadError("invalid-entity-id", 400);

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true },
    });
    if (!team) return uploadError("invalid-entity-id", 404);

    const file = formData.get("file");
    if (!(file instanceof File)) return uploadError("missing-file", 400);

    const validationError = validateAdminImageUpload({
      size: file.size,
      type: file.type,
    });
    if (validationError) {
      return uploadError(validationError, uploadValidationStatus(validationError));
    }

    const bucket = getAdminMediaBucket();
    const extension = extensionForImageType(file.type);
    const path = buildAdminMediaObjectPath({
      entityType: "teams",
      entityId: team.id,
      slot: "logo",
      fileName: file.name,
      extension,
      uniqueId: randomUUID(),
    });

    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      console.error("Team logo upload failed", sanitizeAdminError(error));
      if (isStorageBucketError(error)) return uploadError("storage-not-configured", 503);
      return uploadError("upload-failed", 500);
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl, path, bucket });
  } catch (error) {
    console.error("Team logo upload route failed", sanitizeAdminError(error));
    return uploadError("upload-failed", 500);
  }
}

function uploadError(code: string, status: number) {
  return NextResponse.json(
    { error: code, message: getAdminImageUploadErrorMessage(code) },
    { status },
  );
}

function uploadValidationStatus(code: string) {
  if (code === "file-too-large") return 413;
  if (code === "unsupported-file-type") return 415;
  return 400;
}

function isStorageBucketError(error: { message?: string }) {
  return /bucket|storage/i.test(error.message ?? "");
}

function stringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
