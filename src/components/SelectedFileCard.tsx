"use client";

import { FileAudio, Replace, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration, formatFileSize, friendlyFileType } from "@/lib/utils";

interface SelectedFileCardProps {
  name: string;
  sizeBytes: number;
  extension: string;
  durationSeconds?: number;
  disabled?: boolean;
  onReplace: () => void;
  onRemove: () => void;
}

export function SelectedFileCard({
  name,
  sizeBytes,
  extension,
  durationSeconds,
  disabled,
  onReplace,
  onRemove,
}: SelectedFileCardProps) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--muted)] text-[var(--primary)]">
          <FileAudio className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--foreground)] sm:whitespace-normal sm:break-words">
            {name}
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-[var(--muted-foreground)] sm:grid-cols-3">
            <div>
              <dt className="sr-only">Size</dt>
              <dd>{formatFileSize(sizeBytes)}</dd>
            </div>
            <div>
              <dt className="sr-only">Type</dt>
              <dd>{friendlyFileType(extension)}</dd>
            </div>
            {typeof durationSeconds === "number" && (
              <div>
                <dt className="sr-only">Duration</dt>
                <dd>{formatDuration(durationSeconds)}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          disabled={disabled}
          onClick={onReplace}
        >
          <Replace className="h-4 w-4" />
          Replace file
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full sm:w-auto"
          disabled={disabled}
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
          Remove file
        </Button>
      </div>
    </div>
  );
}
