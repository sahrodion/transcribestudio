"use client";

import { FileText } from "lucide-react";

export function EmptyTranscriptState() {
  return (
    <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)]/60 px-6 py-12 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--muted)] text-[var(--muted-foreground)]">
        <FileText className="h-5 w-5" aria-hidden />
      </span>
      <p className="text-sm font-medium text-[var(--foreground)]">
        Your transcript will appear here
      </p>
      <p className="mt-1 max-w-sm text-sm text-[var(--muted-foreground)]">
        Upload a recording and start transcription to review, edit and export
        your text.
      </p>
    </div>
  );
}
