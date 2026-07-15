import path from "node:path";
import { ApplicationError, UserErrors } from "@/server/errors";
import { maxUploadBytes } from "@/server/env";
import { sanitiseFilename } from "@/lib/utils";
import type { UploadMetadata } from "@/lib/types";

export const ALLOWED_EXTENSIONS = [
  "mp3",
  "mp4",
  "mpeg",
  "mpga",
  "m4a",
  "wav",
  "webm",
  "ogg",
  "oga",
  "flac",
] as const;

export type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number];

const ALLOWED_MIME_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/webm",
  "audio/ogg",
  "audio/flac",
  "audio/x-flac",
  "video/mp4",
  "video/mpeg",
  "video/webm",
  "video/ogg",
  "application/ogg",
  "application/octet-stream",
]);

export function getExtension(filename: string): string {
  const base = path.basename(filename);
  const idx = base.lastIndexOf(".");
  if (idx <= 0) return "";
  return base.slice(idx + 1).toLowerCase();
}

export function isAllowedExtension(ext: string): ext is AllowedExtension {
  return (ALLOWED_EXTENSIONS as readonly string[]).includes(ext.toLowerCase());
}

export function assertSafeFilename(filename: string): void {
  if (!filename || filename.includes("\0")) {
    throw UserErrors.unsupportedFile();
  }
  const normalised = path.normalize(filename);
  if (
    normalised.includes("..") ||
    path.isAbsolute(normalised) ||
    normalised.startsWith("/") ||
    normalised.includes("\\")
  ) {
    throw new ApplicationError(
      "INVALID_FILENAME",
      "We could not use this file. Please rename it and try again.",
      400,
    );
  }
}

export function validateUploadFile(file: File): UploadMetadata {
  if (!file || typeof file.size !== "number") {
    throw UserErrors.unsupportedFile();
  }

  if (file.size <= 0) {
    throw UserErrors.emptyFile();
  }

  const maxBytes = maxUploadBytes();
  if (file.size > maxBytes) {
    throw UserErrors.oversized();
  }

  assertSafeFilename(file.name);
  const extension = getExtension(file.name);

  if (!isAllowedExtension(extension)) {
    throw UserErrors.unsupportedFile();
  }

  const mimeType = (file.type || "application/octet-stream").toLowerCase();
  if (mimeType && !ALLOWED_MIME_TYPES.has(mimeType)) {
    // Some browsers send unusual MIME types; extension remains authoritative
    // after FFprobe validation. Only hard-reject clearly wrong types.
    if (
      mimeType.startsWith("image/") ||
      mimeType.startsWith("text/") ||
      mimeType === "application/pdf" ||
      mimeType === "application/javascript"
    ) {
      throw UserErrors.unsupportedFile();
    }
  }

  const sanitisedName = sanitiseFilename(file.name);

  return {
    originalName: file.name,
    sanitisedName,
    sizeBytes: file.size,
    extension,
    mimeType,
  };
}
