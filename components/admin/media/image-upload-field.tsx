"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImageIcon, Trash2, Upload, X } from "lucide-react";
import {
  adminImageUploadConfig,
  getAdminImageUploadErrorMessage,
  validateAdminImageUpload,
} from "@/lib/admin/media-upload";

type ImageUploadFieldProps = {
  name: string;
  label: string;
  defaultValue?: string | null;
  disabled?: boolean;
  entityId?: string | null;
  entityIdFieldName?: string;
  entityLabel?: string;
  assetDescription?: string;
  uploadEndpoint: string;
  help?: string;
};

type UploadState = "idle" | "uploading" | "success" | "error";

export function ImageUploadField({
  name,
  label,
  defaultValue,
  disabled = false,
  entityId,
  entityIdFieldName = "riderId",
  entityLabel = "rider",
  assetDescription = "profile image",
  uploadEndpoint,
  help,
}: ImageUploadFieldProps) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [previewUrl, setPreviewUrl] = useState(defaultValue ?? "");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<UploadState>("idle");
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(defaultValue ?? "");
    setPreviewUrl(defaultValue ?? "");
  }, [defaultValue]);

  const acceptedTypes = useMemo(() => adminImageUploadConfig.allowedTypes.join(","), []);

  function updateValue(nextValue: string) {
    setValue(nextValue);
    setPreviewUrl(nextValue);
    window.setTimeout(() => {
      hiddenRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
    }, 0);
  }

  function handleFileChange(file: File | null) {
    if (!file) return;
    if (!entityId) {
      setStatus("error");
      setMessage(getAdminImageUploadErrorMessage("missing-entity-id"));
      return;
    }

    const validationError = validateAdminImageUpload({
      size: file.size,
      type: file.type,
    });
    if (validationError) {
      setStatus("error");
      setMessage(getAdminImageUploadErrorMessage(validationError));
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setProgress(0);
    setStatus("uploading");
    setMessage("Uploading image...");

    const body = new FormData();
    body.set("file", file);
    body.set(entityIdFieldName, entityId);

    const request = new XMLHttpRequest();
    request.open("POST", uploadEndpoint);
    request.withCredentials = true;
    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      setProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      URL.revokeObjectURL(localPreview);
      const payload = parseResponse(request.responseText);
      if (request.status >= 200 && request.status < 300 && payload?.url) {
        updateValue(payload.url);
        setProgress(100);
        setStatus("success");
        setMessage(
          `Image uploaded. Save the ${entityLabel} to keep this ${assetDescription}.`,
        );
        return;
      }

      setPreviewUrl(value);
      setStatus("error");
      setMessage(
        payload?.message ??
          getUploadStatusMessage(request.status, payload?.error ?? "upload-failed"),
      );
    };
    request.onerror = () => {
      URL.revokeObjectURL(localPreview);
      setPreviewUrl(value);
      setStatus("error");
      setMessage(getAdminImageUploadErrorMessage("upload-failed"));
    };
    request.send(body);
  }

  function removeImage() {
    updateValue("");
    setStatus("success");
    setProgress(0);
    setMessage(`Image removed. Save the ${entityLabel} to keep this change.`);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="grid min-w-0 gap-3 rounded-md border border-border bg-surface-muted/50 p-4">
      <input ref={hiddenRef} type="hidden" name={name} value={value} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/[0.48]">
            {label}
          </span>
          {help ? <p className="mt-2 text-sm text-foreground/[0.58]">{help}</p> : null}
        </div>
        {value ? (
          <button
            type="button"
            disabled={disabled}
            onClick={removeImage}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-semibold transition hover:border-red-500/50 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Remove
          </button>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
        <div className="flex aspect-square min-h-[160px] items-center justify-center overflow-hidden rounded-md border border-border bg-black">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- CMS previews can point at newly uploaded storage URLs before image domains are finalized.
            <img
              src={previewUrl}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setPreviewUrl("")}
            />
          ) : (
            <div className="grid place-items-center gap-2 text-center text-foreground/[0.52]">
              <ImageIcon className="h-8 w-8 text-accent" aria-hidden="true" />
              <span className="px-4 text-xs font-semibold uppercase tracking-[0.14em]">
                {assetDescription}
              </span>
            </div>
          )}
        </div>

        <div className="grid content-start gap-3">
          <input
            ref={inputRef}
            type="file"
            accept={acceptedTypes}
            disabled={disabled || !entityId || status === "uploading"}
            className="sr-only"
            onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            disabled={disabled || !entityId || status === "uploading"}
            onClick={() => inputRef.current?.click()}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-black uppercase tracking-[0.12em] text-black transition hover:bg-gold disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit"
          >
            {status === "uploading" ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Upload className="h-4 w-4" aria-hidden="true" />
            )}
            {value ? "Replace Image" : "Upload Image"}
          </button>

          {status === "uploading" ? (
            <div className="grid gap-2" role="status" aria-live="polite">
              <div className="h-2 overflow-hidden rounded-full bg-black">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs font-semibold text-foreground/[0.62]">
                Uploading {progress}%
              </p>
            </div>
          ) : null}

          {message ? (
            <p
              role={status === "error" ? "alert" : "status"}
              className={
                status === "error" ? "text-sm text-red-200" : "text-sm text-emerald-200"
              }
            >
              {message}
            </p>
          ) : null}

          <details className="rounded-md border border-border bg-card p-3">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.14em] text-foreground/[0.54]">
              Advanced URL
            </summary>
            <input
              type="url"
              value={value}
              disabled={disabled}
              placeholder="https://..."
              onChange={(event) => updateValue(event.target.value)}
              className="mt-3 h-10 min-w-0 w-full rounded-md border border-border bg-surface-muted px-3 text-sm disabled:opacity-60"
            />
          </details>
        </div>
      </div>
    </div>
  );
}

function getUploadStatusMessage(status: number, error: string) {
  if (status === 401) return getAdminImageUploadErrorMessage("session-expired");
  if (status === 413) return getAdminImageUploadErrorMessage("file-too-large");
  if (status === 415) return getAdminImageUploadErrorMessage("unsupported-file-type");
  if (status === 503) return getAdminImageUploadErrorMessage("storage-not-configured");
  return getAdminImageUploadErrorMessage(error);
}

function parseResponse(value: string): {
  url?: string;
  error?: string;
  message?: string;
} {
  try {
    return JSON.parse(value) as { url?: string; error?: string; message?: string };
  } catch {
    return {};
  }
}
