import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { LANGUAGE_OPTIONS } from "@/lib/languages";
import { UserErrors, toUserError, logServerError } from "@/server/errors";
import { getEnv } from "@/server/env";
import { createJob, updateJob } from "@/server/job-store";
import { startJobProcessing } from "@/server/process-job";
import { checkRateLimit, getClientIp } from "@/server/rate-limit";
import { parseMultipartUpload } from "@/server/multipart";
import { createJobTempDir, removePath } from "@/server/temporary-files";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const languageValues = LANGUAGE_OPTIONS.map((option) => option.value) as [
  string,
  ...string[],
];

const bodySchema = z.object({
  language: z.enum(languageValues).optional().default("auto"),
  sessionToken: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  let tempDir: string | null = null;

  try {
    const env = getEnv();
    const ip = getClientIp(request);
    const limit = checkRateLimit(
      `upload:${ip}`,
      env.RATE_LIMIT_MAX_REQUESTS,
      env.RATE_LIMIT_WINDOW_MS,
    );

    if (!limit.allowed) {
      throw UserErrors.rateLimited();
    }

    const provisionalId = randomUUID();
    tempDir = await createJobTempDir(provisionalId);

    const uploaded = await parseMultipartUpload(request, tempDir);

    const parsed = bodySchema.safeParse({
      language: uploaded.language,
      sessionToken: uploaded.sessionToken || undefined,
    });

    if (!parsed.success) {
      throw UserErrors.unsupportedFile();
    }

    const sessionToken = parsed.data.sessionToken ?? randomUUID();

    const job = createJob({
      sessionToken,
      language: parsed.data.language,
      metadata: uploaded.metadata,
      tempDir,
    });

    // Keep files under the provisional folder; point the job at it.
    updateJob(job.id, {
      tempDir,
      status: "queued",
      progress: 18,
      message: "Uploading your recording",
    });

    startJobProcessing(job.id, uploaded.uploadPath);

    return NextResponse.json(
      {
        jobId: job.id,
        sessionToken,
      },
      {
        status: 202,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    await removePath(tempDir);
    logServerError("transcriptions-post", error);
    const userError = toUserError(error);
    return NextResponse.json(
      {
        error: userError.message,
        code: userError.code,
      },
      {
        status: userError.status,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
