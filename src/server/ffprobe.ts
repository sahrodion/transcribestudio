import { spawn } from "node:child_process";
import { getEnv } from "@/server/env";
import { ApplicationError, UserErrors, logServerError } from "@/server/errors";
import type { MediaProbeResult } from "@/lib/types";

interface RunResult {
  stdout: string;
  stderr: string;
}

function runCommand(
  command: string,
  args: string[],
  timeoutMs: number,
): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGKILL");
      reject(UserErrors.timeout());
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      logServerError("ffprobe-spawn", error);
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
        reject(
          Object.assign(new Error(`Command failed with code ${code}`), {
            stderr,
            stdout,
          }),
        );
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

export async function probeMedia(filePath: string): Promise<MediaProbeResult> {
  const { FFPROBE_PATH } = getEnv();
  const args = [
    "-v",
    "quiet",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    filePath,
  ];

  let result: RunResult;
  try {
    result = await runCommand(FFPROBE_PATH, args, 60_000);
  } catch (error) {
    if (error instanceof ApplicationError) throw error;
    logServerError("ffprobe", error);
    throw UserErrors.damaged();
  }

  let parsed: {
    format?: { duration?: string; format_name?: string };
    streams?: Array<{
      codec_type?: string;
      codec_name?: string;
      sample_rate?: string;
      channels?: number;
    }>;
  };

  try {
    parsed = JSON.parse(result.stdout);
  } catch (error) {
    logServerError("ffprobe-parse", error);
    throw UserErrors.damaged();
  }

  const streams = parsed.streams ?? [];
  const audioStream = streams.find((stream) => stream.codec_type === "audio");
  const videoStream = streams.find((stream) => stream.codec_type === "video");
  const durationSeconds = Number.parseFloat(parsed.format?.duration ?? "0");

  if (!audioStream) {
    throw UserErrors.noAudio();
  }

  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw UserErrors.damaged();
  }

  return {
    durationSeconds,
    hasAudio: true,
    container: parsed.format?.format_name ?? "unknown",
    audioCodec: audioStream.codec_name ?? null,
    videoCodec: videoStream?.codec_name ?? null,
    sampleRate: audioStream.sample_rate
      ? Number.parseInt(audioStream.sample_rate, 10)
      : null,
    channels: audioStream.channels ?? null,
  };
}
