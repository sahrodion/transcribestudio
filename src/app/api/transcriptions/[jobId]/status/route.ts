import { NextResponse } from "next/server";
import { assertJobAccess, getJob } from "@/server/job-store";
import { UserErrors, toUserError } from "@/server/errors";
import type { PublicJobStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ jobId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { jobId } = await context.params;
    const url = new URL(request.url);
    const sessionToken = url.searchParams.get("sessionToken");

    const job = getJob(jobId);
    if (!job) {
      throw UserErrors.notFound();
    }

    if (!assertJobAccess(job, sessionToken)) {
      throw UserErrors.unauthorised();
    }

    const payload: PublicJobStatus = {
      status: job.status,
      progress: job.progress,
      message: job.message,
      transcript: job.status === "completed" ? job.transcript : null,
      error: job.status === "failed" ? job.error : null,
      metadata: job.metadata
        ? {
            originalName: job.metadata.originalName,
            sizeBytes: job.metadata.sizeBytes,
            extension: job.metadata.extension,
            durationSeconds: job.metadata.durationSeconds,
          }
        : null,
      completedAt: job.completedAt,
    };

    return NextResponse.json(payload);
  } catch (error) {
    const userError = toUserError(error);
    return NextResponse.json(
      {
        error: userError.message,
        code: userError.code,
      },
      { status: userError.status },
    );
  }
}
