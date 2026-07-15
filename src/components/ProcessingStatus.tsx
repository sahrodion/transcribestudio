"use client";

import { ProgressBar } from "@/components/ProgressBar";
import { formatElapsed } from "@/lib/utils";

interface ProcessingStatusProps {
  message: string;
  progress: number;
  elapsedMs: number;
}

export function ProcessingStatus({
  message,
  progress,
  elapsedMs,
}: ProcessingStatusProps) {
  return (
    <div
      className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm sm:p-6"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--foreground)]">
            {message}
          </p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Please keep this page open while we finish.
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm tabular-nums text-[var(--foreground)]">
            {Math.round(progress)}%
          </p>
          <p className="mt-1 font-mono text-xs tabular-nums text-[var(--muted-foreground)]">
            {formatElapsed(elapsedMs)}
          </p>
        </div>
      </div>
      <div className="mt-5">
        <ProgressBar value={progress} label={message} />
      </div>
    </div>
  );
}
