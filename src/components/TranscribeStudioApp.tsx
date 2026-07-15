"use client";

import { useCallback, useEffect, useRef, useState, startTransition } from "react";
import { toast } from "sonner";
import { HeroSection } from "@/components/HeroSection";
import { UploadDropzone } from "@/components/UploadDropzone";
import { SelectedFileCard } from "@/components/SelectedFileCard";
import { LanguageSelector } from "@/components/LanguageSelector";
import { TranscriptionButton } from "@/components/TranscriptionButton";
import { ProcessingStatus } from "@/components/ProcessingStatus";
import { TranscriptWorkspace } from "@/components/TranscriptWorkspace";
import { EmptyTranscriptState } from "@/components/EmptyTranscriptState";
import { ErrorPanel } from "@/components/ErrorPanel";
import {
  getClientExtension,
  isClientAllowedExtension,
} from "@/lib/client-upload";
import { maxUploadLabelFromConfig } from "@/lib/config";
import {
  clearPersistedStudioState,
  loadPersistedStudioState,
  savePersistedStudioState,
  type StudioPhase,
} from "@/lib/studio-persistence";
import type { PublicJobStatus } from "@/lib/types";

const SESSION_KEY = "ts-session-token";
const POLL_MS = 2000;

interface FileMeta {
  name: string;
  sizeBytes: number;
  extension: string;
}

export function TranscribeStudioApp() {
  const fileInputBridge = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileMeta, setFileMeta] = useState<FileMeta | null>(null);
  const [language, setLanguage] = useState("auto");
  const [phase, setPhase] = useState<StudioPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Uploading your recording");
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [originalTranscript, setOriginalTranscript] = useState("");
  const [completedAt, setCompletedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState<number | undefined>();
  const [hydrated, setHydrated] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const jobIdRef = useRef<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      const existing = window.localStorage.getItem(SESSION_KEY);
      if (existing) setSessionToken(existing);

      const saved = loadPersistedStudioState();
      if (saved) {
        // Resume completed/error UI; drop in-flight phases that need a live File.
        if (
          saved.phase === "done" ||
          (saved.transcript && saved.transcript.length > 0)
        ) {
          setPhase("done");
          setTranscript(saved.transcript);
          setOriginalTranscript(saved.originalTranscript || saved.transcript);
          setCompletedAt(saved.completedAt);
          setProgress(100);
          setStatusMessage(saved.statusMessage || "Your transcript is ready.");
          setLanguage(saved.language || "auto");
          setDurationSeconds(saved.durationSeconds);
          setError(null);
          if (saved.fileName) {
            setFileMeta({
              name: saved.fileName,
              sizeBytes: saved.fileSize ?? 0,
              extension:
                saved.fileExtension ?? getClientExtension(saved.fileName),
            });
          }
          jobIdRef.current = saved.jobId;
        } else if (saved.phase === "error" && saved.error) {
          setPhase("error");
          setError(saved.error);
          setLanguage(saved.language || "auto");
          if (saved.fileName) {
            setFileMeta({
              name: saved.fileName,
              sizeBytes: saved.fileSize ?? 0,
              extension:
                saved.fileExtension ?? getClientExtension(saved.fileName),
            });
          }
        }
      }

      setHydrated(true);
    });
  }, []);

  useEffect(() => () => {
    clearTimers();
    abortRef.current?.abort();
  }, [clearTimers]);

  useEffect(() => {
    if (!hydrated) return;

    const activeMeta = file
      ? {
          name: file.name,
          sizeBytes: file.size,
          extension: getClientExtension(file.name),
        }
      : fileMeta;

    if (phase === "idle" && !transcript) {
      clearPersistedStudioState();
      return;
    }

    savePersistedStudioState({
      phase,
      language,
      progress,
      statusMessage,
      error,
      transcript,
      originalTranscript,
      completedAt,
      fileName: activeMeta?.name ?? null,
      fileSize: activeMeta?.sizeBytes ?? null,
      fileExtension: activeMeta?.extension ?? null,
      durationSeconds,
      jobId: jobIdRef.current,
    });
  }, [
    hydrated,
    phase,
    language,
    progress,
    statusMessage,
    error,
    transcript,
    originalTranscript,
    completedAt,
    file,
    fileMeta,
    durationSeconds,
  ]);

  const resetWorkspace = useCallback(() => {
    clearTimers();
    abortRef.current?.abort();
    setFile(null);
    setFileMeta(null);
    setPhase("idle");
    setProgress(0);
    setError(null);
    setTranscript("");
    setOriginalTranscript("");
    setCompletedAt(null);
    setElapsedMs(0);
    setSubmitting(false);
    jobIdRef.current = null;
    setDurationSeconds(undefined);
    setStatusMessage("Uploading your recording");
    startedAtRef.current = null;
    clearPersistedStudioState();
  }, [clearTimers]);

  const handleFileSelected = useCallback((next: File) => {
    if (!isClientAllowedExtension(next.name)) {
      toast.error(
        "We could not use this file format. Upload an MP3, M4A, WAV, MP4, MPEG, MPGA or WebM file.",
      );
      return;
    }
    if (next.size <= 0) {
      toast.error("This file appears to be empty. Please choose another recording.");
      return;
    }

    setFile(next);
    setFileMeta({
      name: next.name,
      sizeBytes: next.size,
      extension: getClientExtension(next.name),
    });
    setPhase("ready");
    setError(null);
    // Only clear an existing transcript when the user deliberately picks a new file
    setTranscript("");
    setOriginalTranscript("");
    setCompletedAt(null);
    setDurationSeconds(undefined);
    setProgress(0);
  }, []);

  const openFilePicker = useCallback(() => {
    fileInputBridge.current?.click();
  }, []);

  const scrollToTranscript = useCallback(() => {
    document.getElementById("transcribe")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const startPolling = useCallback(
    (id: string, token: string) => {
      clearTimers();
      startedAtRef.current = Date.now();
      setElapsedMs(0);
      elapsedTimerRef.current = setInterval(() => {
        if (startedAtRef.current) {
          setElapsedMs(Date.now() - startedAtRef.current);
        }
      }, 500);

      const poll = async () => {
        try {
          const response = await fetch(
            `/api/transcriptions/${id}/status?sessionToken=${encodeURIComponent(token)}`,
            { signal: abortRef.current?.signal },
          );
          const data = (await response.json()) as PublicJobStatus & {
            error?: string;
          };

          if (!response.ok) {
            throw new Error(
              data.error ?? "Your connection was interrupted. Your recording was not completed.",
            );
          }

          setProgress((prev) => Math.max(prev, data.progress ?? 0));
          setStatusMessage(data.message);
          if (data.metadata?.durationSeconds) {
            setDurationSeconds(data.metadata.durationSeconds);
          }

          if (data.status === "completed") {
            clearTimers();
            setTranscript(data.transcript ?? "");
            setOriginalTranscript(data.transcript ?? "");
            setCompletedAt(data.completedAt ?? Date.now());
            setPhase("done");
            setProgress(100);
            toast.success("Your transcript is ready.");
            return;
          }

          if (data.status === "failed") {
            clearTimers();
            setPhase("error");
            setError(data.error ?? "We could not complete this transcription.");
            toast.error(data.error ?? "We could not complete this transcription.");
          }
        } catch (err) {
          if ((err as Error).name === "AbortError") return;
          clearTimers();
          setPhase("error");
          const message =
            err instanceof Error
              ? err.message
              : "Your connection was interrupted. Your recording was not completed.";
          setError(message);
          toast.error(message);
        }
      };

      void poll();
      pollTimerRef.current = setInterval(() => {
        void poll();
      }, POLL_MS);
    },
    [clearTimers],
  );

  const startTranscription = useCallback(async () => {
    if (!file || submitting) return;

    setSubmitting(true);
    setPhase("uploading");
    setProgress(8);
    setStatusMessage("Uploading your recording");
    setError(null);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const form = new FormData();
    form.append("file", file);
    form.append("language", language);
    if (sessionToken) form.append("sessionToken", sessionToken);

    try {
      const response = await fetch("/api/transcriptions", {
        method: "POST",
        body: form,
        signal: abortRef.current.signal,
      });

      const data = (await response.json()) as {
        jobId?: string;
        sessionToken?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "We could not complete this transcription.");
      }

      if (!data.jobId || !data.sessionToken) {
        throw new Error("We could not complete this transcription.");
      }

      window.localStorage.setItem(SESSION_KEY, data.sessionToken);
      setSessionToken(data.sessionToken);
      jobIdRef.current = data.jobId;
      setPhase("processing");
      setProgress(20);
      setStatusMessage("Preparing your recording");
      startPolling(data.jobId, data.sessionToken);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setPhase("error");
      const message =
        err instanceof Error
          ? err.message
          : "We could not complete this transcription.";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }, [file, language, sessionToken, startPolling, submitting]);

  const retry = useCallback(() => {
    jobIdRef.current = null;
    setError(null);
    if (!file) {
      toast.error("Please choose the recording again to retry.");
      setPhase("idle");
      return;
    }
    void startTranscription();
  }, [file, startTranscription]);

  const busy = phase === "uploading" || phase === "processing" || submitting;
  const maxLabel = maxUploadLabelFromConfig();
  const displayMeta = file
    ? {
        name: file.name,
        sizeBytes: file.size,
        extension: getClientExtension(file.name),
      }
    : fileMeta;
  const hasTranscript = phase === "done" || transcript.length > 0;
  const showFileCard = Boolean(displayMeta);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <HeroSection
        hasTranscript={hasTranscript}
        onChooseFile={openFilePicker}
        onViewTranscript={scrollToTranscript}
      />

      <input
        ref={fileInputBridge}
        type="file"
        className="sr-only"
        accept=".mp3,.mp4,.mpeg,.mpga,.m4a,.wav,.webm,.ogg,.oga,.flac"
        onChange={(event) => {
          const next = event.target.files?.[0];
          if (next) handleFileSelected(next);
          event.target.value = "";
        }}
      />

      <section id="transcribe" className="scroll-mt-24 pb-16">
        <div
          className={
            hasTranscript
              ? "grid gap-6 lg:grid-cols-2 lg:items-start"
              : "mx-auto max-w-xl"
          }
        >
          <div className="space-y-4">
            {!showFileCard ? (
              <UploadDropzone
                disabled={busy}
                maxUploadLabel={maxLabel}
                onFileSelected={handleFileSelected}
              />
            ) : (
              <SelectedFileCard
                name={displayMeta!.name}
                sizeBytes={displayMeta!.sizeBytes}
                extension={displayMeta!.extension}
                durationSeconds={durationSeconds}
                disabled={busy}
                onReplace={openFilePicker}
                onRemove={resetWorkspace}
              />
            )}

            {showFileCard && (
              <>
                <LanguageSelector
                  value={language}
                  disabled={busy || (hasTranscript && !file)}
                  onChange={setLanguage}
                />
                {file ? (
                  <TranscriptionButton
                    disabled={!file || busy}
                    loading={submitting}
                    onClick={() => void startTranscription()}
                  />
                ) : hasTranscript ? null : (
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Choose the file again to start transcription.
                  </p>
                )}
              </>
            )}

            {(phase === "uploading" || phase === "processing") && (
              <ProcessingStatus
                message={statusMessage}
                progress={progress}
                elapsedMs={elapsedMs}
              />
            )}

            {phase === "error" && error && (
              <ErrorPanel
                message={error}
                onRetry={retry}
                onChooseAnother={resetWorkspace}
                onClear={() => setError(null)}
              />
            )}
          </div>

          <div>
            {hasTranscript ? (
              <TranscriptWorkspace
                transcript={transcript}
                originalTranscript={originalTranscript}
                filename={displayMeta?.name ?? "recording"}
                completedAt={completedAt}
                onTranscriptChange={setTranscript}
                onReset={() => setTranscript(originalTranscript)}
                onStartNew={resetWorkspace}
              />
            ) : phase === "idle" || phase === "ready" ? (
              <div className="hidden lg:block">
                <EmptyTranscriptState />
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
