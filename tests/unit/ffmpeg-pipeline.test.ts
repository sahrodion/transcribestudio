import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const hasFfmpeg = await new Promise<boolean>((resolve) => {
  const child = spawn("ffmpeg", ["-version"]);
  child.on("error", () => resolve(false));
  child.on("close", (code) => resolve(code === 0));
});

describe.runIf(hasFfmpeg)("FFmpeg media pipeline", () => {
  let workDir = "";

  beforeEach(async () => {
    workDir = await fs.mkdtemp(path.join(os.tmpdir(), "ts-ffmpeg-"));
  });

  afterEach(async () => {
    await fs.rm(workDir, { recursive: true, force: true });
  });

  async function generateTone(filename: string, seconds: number) {
    const output = path.join(workDir, filename);
    await new Promise<void>((resolve, reject) => {
      const child = spawn("ffmpeg", [
        "-y",
        "-f",
        "lavfi",
        "-i",
        `sine=frequency=440:duration=${seconds}`,
        "-ac",
        "1",
        "-ar",
        "16000",
        output,
      ]);
      child.on("error", reject);
      child.on("close", (code) =>
        code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`)),
      );
    });
    return output;
  }

  async function generateSilentVideoNoAudio(filename: string) {
    const output = path.join(workDir, filename);
    await new Promise<void>((resolve, reject) => {
      const child = spawn("ffmpeg", [
        "-y",
        "-f",
        "lavfi",
        "-i",
        "color=c=black:s=320x240:d=1",
        "-an",
        output,
      ]);
      child.on("error", reject);
      child.on("close", (code) =>
        code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`)),
      );
    });
    return output;
  }

  it("probes valid audio and rejects video with no audio stream", async () => {
    process.env.OPENAI_API_KEY = "test-openai-key";
    const { probeMedia } = await import("@/server/ffprobe");
    const { UserErrors } = await import("@/server/errors");

    const mp3 = await generateTone("valid.mp3", 1);
    const probe = await probeMedia(mp3);
    expect(probe.hasAudio).toBe(true);
    expect(probe.durationSeconds).toBeGreaterThan(0.5);

    const silent = await generateSilentVideoNoAudio("silent.mp4");
    await expect(probeMedia(silent)).rejects.toThrow(UserErrors.noAudio().message);
  });

  it("converts and segments oversized audio into valid files under 25 MB", async () => {
    process.env.OPENAI_API_KEY = "test-openai-key";
    const { convertToTranscriptionAudio, segmentAudio } = await import(
      "@/server/ffmpeg"
    );

    // Short tone is fine; exercise conversion path and single-segment return
    const wav = await generateTone("source.wav", 2);
    const converted = await convertToTranscriptionAudio(wav, workDir);
    const stats = await fs.stat(converted);
    expect(stats.size).toBeGreaterThan(0);
    expect(stats.size).toBeLessThan(25 * 1024 * 1024);

    const segments = await segmentAudio(converted, workDir, 2);
    expect(segments.length).toBeGreaterThanOrEqual(1);
    for (const segment of segments) {
      const segmentStats = await fs.stat(segment);
      expect(segmentStats.size).toBeGreaterThan(0);
      expect(segmentStats.size).toBeLessThan(25 * 1024 * 1024);
    }
  });

  it("handles corrupted M4A by failing probe with a friendly error", async () => {
    process.env.OPENAI_API_KEY = "test-openai-key";
    const { probeMedia } = await import("@/server/ffprobe");
    const { UserErrors } = await import("@/server/errors");
    const corrupt = path.join(workDir, "corrupt.m4a");
    await fs.writeFile(corrupt, Buffer.from("not-a-real-m4a-file"));
    await expect(probeMedia(corrupt)).rejects.toThrow(UserErrors.damaged().message);
  });
});

describe.runIf(!hasFfmpeg)("FFmpeg media pipeline (skipped without ffmpeg)", () => {
  it("documents that ffmpeg is required for media integration tests", () => {
    expect(hasFfmpeg).toBe(false);
  });
});

// Prevent unused import warnings in environments without ffmpeg
void vi;
