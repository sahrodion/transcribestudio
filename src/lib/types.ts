export type JobStatus =
  | "queued"
  | "preparing"
  | "transcribing"
  | "finalising"
  | "completed"
  | "failed";

export interface UploadMetadata {
  originalName: string;
  sanitisedName: string;
  sizeBytes: number;
  extension: string;
  mimeType: string;
  durationSeconds?: number;
}

export interface TranscriptionJob {
  id: string;
  status: JobStatus;
  progress: number;
  message: string;
  transcript: string | null;
  originalTranscript: string | null;
  error: string | null;
  metadata: UploadMetadata | null;
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
  sessionToken: string;
  language: string | null;
  tempDir: string | null;
}

export interface PublicJobStatus {
  status: JobStatus;
  progress: number;
  message: string;
  transcript: string | null;
  error: string | null;
  metadata?: {
    originalName: string;
    sizeBytes: number;
    extension: string;
    durationSeconds?: number;
  } | null;
  completedAt?: number | null;
}

export interface TranscriptResult {
  text: string;
  durationSeconds?: number;
  segmentCount: number;
}

export interface MediaProbeResult {
  durationSeconds: number;
  hasAudio: boolean;
  container: string;
  audioCodec: string | null;
  videoCodec: string | null;
  sampleRate: number | null;
  channels: number | null;
}

export interface ApplicationErrorPayload {
  code: string;
  message: string;
  status: number;
}
