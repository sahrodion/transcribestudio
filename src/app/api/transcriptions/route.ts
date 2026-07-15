import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { LANGUAGE_OPTIONS } from "@/lib/languages";
import { ApplicationError, UserErrors, toUserError, logServerError } from "@/server/errors";
import { getEnv } from "@/server/env";
import { validateUploadFile } from "@/server/file-validation";
import { createJob, updateJob } from "@/server/job-store";
import { startJobProcessing } from "@/server/process-job";
import { checkRateLimit, getClientIp } from "@/server/rate-limit";
import {
  createJobTempDir,
  writeUploadToTemp,
  removePath,
} from "@/server/temporary-files";

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

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      throw new ApplicationError(
        "INVALID_CONTENT_TYPE",
        "Please upload a recording using the form provided.",
        415,
      );
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch (error) {
      logServerError("transcriptions-formdata", error);
      throw new ApplicationError(
        "UPLOAD_PARSE_FAILED",
        "We could not read this upload. The file may be too large for the current server settings, or the connection was interrupted.",
        400,
        { cause: error },
      );
    }
    const fileEntry = form.get("file");
    if (!(fileEntry instanceof File)) {
      throw UserErrors.unsupportedFile();
    }

    const languageRaw = String(form.get("language") ?? "auto");
    const sessionRaw = form.get("sessionToken");
    const parsed = bodySchema.safeParse({
      language: languageRaw,
      sessionToken:
        typeof sessionRaw === "string" && sessionRaw.length > 0
          ? sessionRaw
          : undefined,
    });

    if (!parsed.success) {
      throw UserErrors.unsupportedFile();
    }

    const metadata = validateUploadFile(fileEntry);
    const sessionToken = parsed.data.sessionToken ?? randomUUID();

    const job = createJob({
      sessionToken,
      language: parsed.data.language,
      metadata,
      tempDir: "",
    });

    tempDir = await createJobTempDir(job.id);
    updateJob(job.id, { tempDir });

    const buffer = Buffer.from(await fileEntry.arrayBuffer());
    const uploadPath = await writeUploadToTemp(
      tempDir,
      metadata.sanitisedName,
      buffer,
    );

    updateJob(job.id, {
      status: "queued",
      progress: 18,
      message: "Uploading your recording",
    });

    startJobProcessing(job.id, uploadPath);

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
