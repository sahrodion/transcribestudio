import { z } from "zod";

const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
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

export type AppEnv = z.infer<typeof envSchema>;

let cached: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cached) return cached;

  const parsed = envSchema.safeParse({
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
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
    throw new Error(`Invalid environment configuration: ${message}`);
  }

  cached = parsed.data;
  return cached;
}

/** Soft validation for health checks — does not throw if API key missing in tests. */
export function getEnvSafe(): AppEnv | null {
  try {
    return getEnv();
  } catch {
    return null;
  }
}

export function maxUploadBytes(): number {
  return getEnv().MAX_UPLOAD_MB * 1024 * 1024;
}

export function resetEnvCache(): void {
  cached = null;
}
