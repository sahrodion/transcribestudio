import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { getEnv } from "@/server/env";
import { ApplicationError, UserErrors, logServerError } from "@/server/errors";
import { uniqueTempName } from "@/server/temporary-files";

const OPENAI_SAFE_MB = 20;
const TARGET_SAMPLE_RATE = 16_000;
const SEGMENT_SECONDS = 600; // 10-minute segments keep size safely under 25 MB

function runFfmpeg(args: string[], timeoutMs: number): Promise<void> {
  const { FFMPEG_PATH } = getEnv();

  return new Promise((resolve, reject) => {
    const child = spawn(FFMPEG_PATH, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGKILL");
      reject(UserErrors.timeout());
    }, timeoutMs);

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      logServerError("ffmpeg-spawn", error);
      reject(
        new ApplicationError(
          "MEDIA_TOOLS_UNAVAILABLE",
          "We could not process this recording right now. Please try again.",
          503,
          { cause: error },
        ),
      );
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code !== 0) {
        logServerError("ffmpeg", { code, stderr: stderr.slice(-2000) });
        reject(UserErrors.damaged());
        return;
      }
      resolve();
    });
  });
}

/** Convert any supported media into mono 16 kHz MP3 suitable for transcription. */
export async function convertToTranscriptionAudio(
  inputPath: string,
  outputDir: string,
): Promise<string> {
  const outputPath = path.join(outputDir, uniqueTempName("audio", "mp3"));

  await runFfmpeg(
    [
      "-y",
      "-i",
      inputPath,
      "-vn",
      "-ac",
      "1",
      "-ar",
      String(TARGET_SAMPLE_RATE),
      "-c:a",
      "libmp3lame",
      "-b:a",
      "64k",
      outputPath,
    ],
    10 * 60_000,
  );

  const stats = await fs.stat(outputPath);
  if (stats.size <= 0) {
    throw UserErrors.damaged();
  }

  return outputPath;
}

/**
 * Split long audio into valid MP3 segments below the OpenAI upload limit.
 * Uses duration-based segmentation via FFmpeg — never raw byte slicing.
 */
export async function segmentAudio(
  inputPath: string,
  outputDir: string,
  durationSeconds: number,
): Promise<string[]> {
  const stats = await fs.stat(inputPath);
  const maxBytes = OPENAI_SAFE_MB * 1024 * 1024;

  if (stats.size <= maxBytes && durationSeconds <= SEGMENT_SECONDS) {
    return [inputPath];
  }

  // Derive segment length from average bitrate when needed
  const bytesPerSecond = stats.size / Math.max(durationSeconds, 1);
  const maxSecondsBySize = Math.floor(maxBytes / Math.max(bytesPerSecond, 1));
  const segmentDuration = Math.max(
    30,
    Math.min(SEGMENT_SECONDS, maxSecondsBySize - 5),
  );

  const pattern = path.join(outputDir, "segment-%03d.mp3");

  await runFfmpeg(
    [
      "-y",
      "-i",
      inputPath,
      "-f",
      "segment",
      "-segment_time",
      String(segmentDuration),
      "-reset_timestamps",
      "1",
      "-c",
      "copy",
      pattern,
    ],
    15 * 60_000,
  );

  const entries = await fs.readdir(outputDir);
  const segments = entries
    .filter((name) => /^segment-\d+\.mp3$/.test(name))
    .sort()
    .map((name) => path.join(outputDir, name));

  if (segments.length === 0) {
    throw UserErrors.damaged();
  }

  for (const segment of segments) {
    const segmentStats = await fs.stat(segment);
    if (segmentStats.size <= 0) {
      throw UserErrors.damaged();
    }
    if (segmentStats.size > 25 * 1024 * 1024) {
      // Re-encode oversized segment at lower bitrate
      const recompressed = path.join(
        outputDir,
        uniqueTempName("segment-safe", "mp3"),
      );
      await runFfmpeg(
        [
          "-y",
          "-i",
          segment,
          "-ac",
          "1",
          "-ar",
          String(TARGET_SAMPLE_RATE),
          "-c:a",
          "libmp3lame",
          "-b:a",
          "48k",
          recompressed,
        ],
        5 * 60_000,
      );
      await fs.unlink(segment).catch(() => undefined);
      const idx = segments.indexOf(segment);
      segments[idx] = recompressed;
    }
  }

  return segments;
}
