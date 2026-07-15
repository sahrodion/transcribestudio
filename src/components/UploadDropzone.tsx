"use client";

import { useCallback, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { acceptAttribute } from "@/lib/client-upload";

interface UploadDropzoneProps {
  disabled?: boolean;
  maxUploadLabel: string;
  onFileSelected: (file: File) => void;
}

export function UploadDropzone({
  disabled,
  maxUploadLabel,
  onFileSelected,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) onFileSelected(file);
    },
    [onFileSelected],
  );

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label="Upload a recording. Drop a file here or press Enter to choose a file."
      className={cn(
        "group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--card)] px-6 py-12 text-center transition-all duration-200",
        "hover:border-[var(--primary)]/50 hover:bg-[var(--card-hover)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
        dragging && "border-[var(--primary)] bg-[var(--card-hover)] scale-[1.01]",
        disabled && "pointer-events-none opacity-60",
      )}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragEnter={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
    >
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--muted)] text-[var(--primary)] transition group-hover:scale-[1.03]">
        <Upload className="h-6 w-6" aria-hidden />
      </span>
      <p className="text-base font-medium text-[var(--foreground)]">
        Drop your recording here
      </p>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        or choose a file
      </p>
      <p className="mt-4 max-w-sm text-xs leading-relaxed text-[var(--muted-foreground)]">
        MP3, M4A, WAV, MP4, MPEG, MPGA, WebM, OGG and FLAC. Maximum upload size{" "}
        {maxUploadLabel}.
      </p>
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={acceptAttribute()}
        disabled={disabled}
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}
