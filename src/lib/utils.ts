import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function estimatedReadingMinutes(text: string): number {
  const words = countWords(text);
  return Math.max(1, Math.ceil(words / 200));
}

export function sanitiseFilename(name: string): string {
  const base = name
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\.\.+/g, ".")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
  return base || "recording";
}

export function exportBasename(originalName: string): string {
  const withoutExt = originalName.replace(/\.[^.]+$/, "");
  return `${sanitiseFilename(withoutExt)}-transcript`;
}

export function friendlyFileType(extension: string): string {
  const map: Record<string, string> = {
    mp3: "MP3 audio",
    mp4: "MP4 video",
    mpeg: "MPEG media",
    mpga: "MPEG audio",
    m4a: "M4A audio",
    wav: "WAV audio",
    webm: "WebM media",
    ogg: "Ogg audio",
    oga: "Ogg audio",
    flac: "FLAC audio",
  };
  return map[extension.toLowerCase()] ?? "Media file";
}
