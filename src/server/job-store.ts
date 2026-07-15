import { randomUUID } from "node:crypto";
import type { JobStatus, TranscriptionJob, UploadMetadata } from "@/lib/types";
import { getEnv } from "@/server/env";

const globalStore = globalThis as typeof globalThis & {
  __transcribeJobs?: Map<string, TranscriptionJob>;
  __transcribeCleanup?: NodeJS.Timeout;
};

function jobs(): Map<string, TranscriptionJob> {
  if (!globalStore.__transcribeJobs) {
    globalStore.__transcribeJobs = new Map();
  }
  return globalStore.__transcribeJobs;
}

function ensureCleanup(): void {
  if (globalStore.__transcribeCleanup) return;
  globalStore.__transcribeCleanup = setInterval(
    () => {
      void pruneExpiredJobs();
    },
    60_000,
  );
  // Allow process to exit in tests
  globalStore.__transcribeCleanup.unref?.();
}

export function createJob(input: {
  sessionToken: string;
  language: string | null;
  metadata: UploadMetadata;
  tempDir: string;
}): TranscriptionJob {
  ensureCleanup();
  const now = Date.now();
  const job: TranscriptionJob = {
    id: randomUUID(),
    status: "queued",
    progress: 5,
    message: "Uploading your recording",
    transcript: null,
    originalTranscript: null,
    error: null,
    metadata: input.metadata,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    sessionToken: input.sessionToken,
    language: input.language,
    tempDir: input.tempDir,
  };
  jobs().set(job.id, job);
  return job;
}

export function getJob(jobId: string): TranscriptionJob | undefined {
  return jobs().get(jobId);
}

export function updateJob(
  jobId: string,
  patch: Partial<
    Pick<
      TranscriptionJob,
      | "status"
      | "progress"
      | "message"
      | "transcript"
      | "originalTranscript"
      | "error"
      | "completedAt"
      | "tempDir"
      | "metadata"
    >
  >,
): TranscriptionJob | undefined {
  const job = jobs().get(jobId);
  if (!job) return undefined;

  const nextProgress =
    typeof patch.progress === "number"
      ? Math.max(job.progress, Math.min(100, patch.progress))
      : job.progress;

  const updated: TranscriptionJob = {
    ...job,
    ...patch,
    progress: nextProgress,
    updatedAt: Date.now(),
  };

  jobs().set(jobId, updated);
  return updated;
}

export function setJobStatus(
  jobId: string,
  status: JobStatus,
  progress: number,
  message: string,
): void {
  updateJob(jobId, { status, progress, message });
}

export function assertJobAccess(
  job: TranscriptionJob,
  sessionToken: string | null,
): boolean {
  return Boolean(sessionToken && job.sessionToken === sessionToken);
}

export async function pruneExpiredJobs(): Promise<void> {
  const ttlMs = getEnv().JOB_TTL_MINUTES * 60_000;
  const now = Date.now();
  const { removePath } = await import("@/server/temporary-files");

  for (const [id, job] of jobs().entries()) {
    if (now - job.updatedAt > ttlMs) {
      await removePath(job.tempDir);
      jobs().delete(id);
    }
  }
}

export function clearAllJobsForTests(): void {
  jobs().clear();
}
