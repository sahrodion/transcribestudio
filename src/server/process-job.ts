import { getEnv } from "@/server/env";
import { ApplicationError, UserErrors, logServerError, toUserError } from "@/server/errors";
import { convertToTranscriptionAudio, segmentAudio } from "@/server/ffmpeg";
import { probeMedia } from "@/server/ffprobe";
import { setJobStatus, updateJob } from "@/server/job-store";
import { removePath } from "@/server/temporary-files";
import { transcribeSegments } from "@/server/transcription";
import { resolveLanguageHint } from "@/lib/languages";

export async function processTranscriptionJob(
  jobId: string,
  uploadPath: string,
): Promise<void> {
  let tempDir: string | null = null;

  try {
    const { getJob } = await import("@/server/job-store");
    const job = getJob(jobId);
    if (!job) return;

    tempDir = job.tempDir;

    setJobStatus(jobId, "preparing", 22, "Preparing your recording");

    const probe = await probeMedia(uploadPath);
    const maxDuration = getEnv().MAX_AUDIO_DURATION_MINUTES * 60;
    if (probe.durationSeconds > maxDuration) {
      throw UserErrors.tooLong();
    }

    updateJob(jobId, {
      metadata: job.metadata
        ? { ...job.metadata, durationSeconds: probe.durationSeconds }
        : job.metadata,
      progress: 28,
      message: "Preparing your recording",
    });

    const audioPath = await convertToTranscriptionAudio(uploadPath, tempDir!);
    setJobStatus(jobId, "preparing", 34, "Preparing your recording");

    const segments = await segmentAudio(
      audioPath,
      tempDir!,
      probe.durationSeconds,
    );

    setJobStatus(jobId, "transcribing", 38, "Transcribing");

    const language = resolveLanguageHint(job.language ?? undefined);

    const transcript = await transcribeSegments(segments, {
      language,
      onProgress: (completed, total) => {
        const ratio = completed / Math.max(total, 1);
        const progress = Math.round(38 + ratio * 50);
        setJobStatus(jobId, "transcribing", progress, "Transcribing");
      },
    });

    setJobStatus(jobId, "finalising", 92, "Finalising your transcript");

    updateJob(jobId, {
      status: "completed",
      progress: 100,
      message: "Your transcript is ready.",
      transcript,
      originalTranscript: transcript,
      error: null,
      completedAt: Date.now(),
    });
  } catch (error) {
    logServerError(`job:${jobId}`, error);
    const userError = toUserError(error);
    updateJob(jobId, {
      status: "failed",
      message: "We could not complete this transcription.",
      error: userError.message,
      completedAt: Date.now(),
    });
  } finally {
    await removePath(tempDir);
    updateJob(jobId, { tempDir: null });
  }
}

export function startJobProcessing(jobId: string, uploadPath: string): void {
  // Fire-and-forget on a persistent Node process (Docker / Railway / Render).
  void processTranscriptionJob(jobId, uploadPath).catch((error) => {
    logServerError(`job-unhandled:${jobId}`, error);
    if (!(error instanceof ApplicationError)) {
      updateJob(jobId, {
        status: "failed",
        error: UserErrors.generic().message,
        message: "We could not complete this transcription.",
        completedAt: Date.now(),
      });
    }
  });
}
