"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorPanelProps {
  message: string;
  onRetry?: () => void;
  onChooseAnother?: () => void;
  onClear?: () => void;
}

export function ErrorPanel({
  message,
  onRetry,
  onChooseAnother,
  onClear,
}: ErrorPanelProps) {
  return (
    <div
      className="rounded-2xl border border-[var(--destructive)]/30 bg-[var(--destructive-soft)] p-5"
      role="alert"
    >
      <div className="flex gap-3">
        <AlertCircle
          className="mt-0.5 h-5 w-5 shrink-0 text-[var(--destructive)]"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-[var(--foreground)]">
            We could not complete this transcription.
          </p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{message}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {onRetry && (
              <Button type="button" variant="default" onClick={onRetry}>
                Try again
              </Button>
            )}
            {onChooseAnother && (
              <Button type="button" variant="outline" onClick={onChooseAnother}>
                Choose another file
              </Button>
            )}
            {onClear && (
              <Button type="button" variant="ghost" onClick={onClear}>
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
