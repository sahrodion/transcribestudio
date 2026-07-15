import type { JobStatus } from "@/lib/types";

export type StudioPhase =
  | "idle"
  | "ready"
  | "uploading"
  | "processing"
  | "done"
  | "error";

export interface PersistedStudioState {
  phase: StudioPhase;
  language: string;
  progress: number;
  statusMessage: string;
  error: string | null;
  transcript: string;
  originalTranscript: string;
  completedAt: number | null;
  fileName: string | null;
  fileSize: number | null;
  fileExtension: string | null;
  durationSeconds?: number;
  jobId: string | null;
  jobStatus?: JobStatus;
}

export const WORKSPACE_STORAGE_KEY = "ts-workspace-v1";

export function loadPersistedStudioState(): PersistedStudioState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedStudioState;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function savePersistedStudioState(state: PersistedStudioState): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota / private mode failures
  }
}

export function clearPersistedStudioState(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(WORKSPACE_STORAGE_KEY);
  } catch {
    // ignore
  }
}
