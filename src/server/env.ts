import { z } from "zod";
import { ApplicationError } from "@/server/errors";

const baseEnvSchema = z.object({
  MAX_UPLOAD_MB: z.coerce.number().positive().default(250),
  MAX_AUDIO_DURATION_MINUTES: z.coerce.number().positive().default(240),
  TRANSCRIPTION_CONCURRENCY: z.coerce.number().int().min(1).max(4).default(2),
  JOB_TTL_MINUTES: z.coerce.number().positive().default(60),
  FFMPEG_PATH: z.string().default("ffmpeg"),
  FFPROBE_PATH: z.string().default("ffprobe"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().positive().default(60_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().positive().default(10),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const envSchema = baseEnvSchema.extend({
  OPENAI_API_KEY: z
    .string()
    .trim()
    .min(1, "OPENAI_API_KEY is missing. Set it in your host environment variables."),
});

export type AppEnv = z.infer<typeof envSchema>;
export type BaseEnv = z.infer<typeof baseEnvSchema>;

let cached: AppEnv | null = null;
let cachedBase: BaseEnv | null = null;

function readBaseEnv(): BaseEnv {
  if (cachedBase) return cachedBase;

  const parsed = baseEnvSchema.safeParse({
    MAX_UPLOAD_MB: process.env.MAX_UPLOAD_MB,
    MAX_AUDIO_DURATION_MINUTES: process.env.MAX_AUDIO_DURATION_MINUTES,
    TRANSCRIPTION_CONCURRENCY: process.env.TRANSCRIPTION_CONCURRENCY,
    JOB_TTL_MINUTES: process.env.JOB_TTL_MINUTES,
    FFMPEG_PATH: process.env.FFMPEG_PATH,
    FFPROBE_PATH: process.env.FFPROBE_PATH,
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,
    NODE_ENV: process.env.NODE_ENV,
  });

  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new ApplicationError(
      "INVALID_ENV",
      "The server is misconfigured. Please contact the site owner.",
      500,
      { cause: new Error(message) },
    );
  }

  cachedBase = parsed.data;
  return cachedBase;
}

export function getEnv(): AppEnv {
  if (cached) return cached;

  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new ApplicationError(
      "MISSING_API_KEY",
      "Transcription is unavailable because OPENAI_API_KEY is not set on the server.",
      503,
    );
  }

  const parsed = envSchema.safeParse({
    ...readBaseEnv(),
    OPENAI_API_KEY: key,
  });

  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    console.error("[transcribe-studio:env]", message);
    throw new ApplicationError(
      "INVALID_ENV",
      "Transcription is unavailable because the server environment is misconfigured.",
      503,
    );
  }

  cached = parsed.data;
  return cached;
}

/** Soft validation for health checks — does not throw if API key missing. */
export function getEnvSafe(): AppEnv | null {
  try {
    return getEnv();
  } catch {
    return null;
  }
}

export function maxUploadBytes(): number {
  const mb = Number(process.env.MAX_UPLOAD_MB);
  const value = Number.isFinite(mb) && mb > 0 ? mb : readBaseEnv().MAX_UPLOAD_MB;
  return value * 1024 * 1024;
}

export function resetEnvCache(): void {
  cached = null;
  cachedBase = null;
}
