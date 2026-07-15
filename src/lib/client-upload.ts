export const CLIENT_ALLOWED_EXTENSIONS = [
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

export function acceptAttribute(): string {
  return CLIENT_ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(",");
}

export function getClientExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  if (idx <= 0) return "";
  return filename.slice(idx + 1).toLowerCase();
}

export function isClientAllowedExtension(filename: string): boolean {
  const ext = getClientExtension(filename);
  return (CLIENT_ALLOWED_EXTENSIONS as readonly string[]).includes(ext);
}
