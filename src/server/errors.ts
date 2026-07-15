import type { ApplicationErrorPayload } from "@/lib/types";

export class ApplicationError extends Error {
  readonly code: string;
  readonly status: number;
  readonly expose: boolean;

  constructor(
    code: string,
    message: string,
    status = 400,
    options?: { expose?: boolean; cause?: unknown },
  ) {
    super(message, { cause: options?.cause });
    this.name = "ApplicationError";
    this.code = code;
    this.status = status;
    this.expose = options?.expose ?? true;
  }

  toJSON(): ApplicationErrorPayload {
    return {
      code: this.code,
      message: this.message,
      status: this.status,
    };
  }
}

export const UserErrors = {
  unsupportedFile: () =>
    new ApplicationError(
      "UNSUPPORTED_FILE",
      "We could not use this file format. Upload an MP3, M4A, WAV, MP4, MPEG, MPGA or WebM file.",
      400,
    ),
  noAudio: () =>
    new ApplicationError(
      "NO_AUDIO",
      "We could not find usable audio in this file.",
      400,
    ),
  oversized: () =>
    new ApplicationError(
      "OVERSIZED",
      "This recording is larger than the current upload limit.",
      413,
    ),
  emptyFile: () =>
    new ApplicationError(
      "EMPTY_FILE",
      "This file appears to be empty. Please choose another recording.",
      400,
    ),
  damaged: () =>
    new ApplicationError(
      "DAMAGED_FILE",
      "We could not read this recording. The file may be damaged or encoded in an unsupported way.",
      400,
    ),
  tooLong: () =>
    new ApplicationError(
      "TOO_LONG",
      "This recording is longer than the current duration limit.",
      400,
    ),
  transcriptionFailed: () =>
    new ApplicationError(
      "TRANSCRIPTION_FAILED",
      "Transcription could not be completed. Please try again.",
      502,
    ),
  timeout: () =>
    new ApplicationError(
      "TIMEOUT",
      "This recording took too long to process. Please try again.",
      504,
    ),
  rateLimited: () =>
    new ApplicationError(
      "RATE_LIMITED",
      "Too many requests. Please wait a moment and try again.",
      429,
    ),
  notFound: () =>
    new ApplicationError(
      "NOT_FOUND",
      "We could not find this transcription job.",
      404,
    ),
  unauthorised: () =>
    new ApplicationError(
      "UNAUTHORISED",
      "You are not allowed to access this transcription.",
      403,
    ),
  connection: () =>
    new ApplicationError(
      "CONNECTION",
      "Your connection was interrupted. Your recording was not completed.",
      503,
    ),
  generic: () =>
    new ApplicationError(
      "GENERIC",
      "We could not complete this transcription.",
      500,
    ),
} as const;

export function toUserError(error: unknown): ApplicationError {
  if (error instanceof ApplicationError) return error;

  if (process.env.NODE_ENV === "development") {
    console.error("[transcribe-studio]", error);
  } else {
    console.error("[transcribe-studio] Unexpected error");
  }

  return UserErrors.generic();
}

export function logServerError(context: string, error: unknown): void {
  const detail =
    error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { detail: String(error) };
  console.error(`[transcribe-studio:${context}]`, detail);
}
