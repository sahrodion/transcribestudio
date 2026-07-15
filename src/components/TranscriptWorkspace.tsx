"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { TranscriptEditor } from "@/components/TranscriptEditor";
import { TranscriptToolbar } from "@/components/TranscriptToolbar";
import {
  countWords,
  estimatedReadingMinutes,
  exportBasename,
} from "@/lib/utils";
import { buildTxtContent, downloadTextFile } from "@/lib/export/txt";
import { toast } from "sonner";

interface TranscriptWorkspaceProps {
  transcript: string;
  originalTranscript: string;
  filename: string;
  completedAt: number | null;
  onTranscriptChange: (value: string) => void;
  onReset: () => void;
  onStartNew: () => void;
}

export function TranscriptWorkspace({
  transcript,
  originalTranscript,
  filename,
  completedAt,
  onTranscriptChange,
  onReset,
  onStartNew,
}: TranscriptWorkspaceProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [clearOpen, setClearOpen] = useState(false);

  const words = countWords(transcript);
  const characters = transcript.length;
  const readingMinutes = estimatedReadingMinutes(transcript);
  const completedLabel = completedAt
    ? new Date(completedAt).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  const dateLabel = new Date(completedAt ?? 0).toLocaleString("en-GB", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transcript);
      toast.success("Transcript copied");
    } catch {
      toast.error("Could not copy transcript");
    }
  };

  const handleSelectAll = () => {
    const textarea = document.querySelector<HTMLTextAreaElement>(
      'textarea[placeholder="Transcript text will appear here…"]',
    );
    textarea?.focus();
    textarea?.select();
  };

  const handleExportTxt = () => {
    const name = `${exportBasename(filename)}.txt`;
    downloadTextFile(name, buildTxtContent(transcript));
    toast.success("TXT download started");
  };

  const handleExportDocx = async () => {
    const { downloadDocx } = await import("@/lib/export/docx");
    await downloadDocx({
      filename: `${exportBasename(filename)}.docx`,
      title: "Transcript",
      sourceFilename: filename,
      dateLabel,
      transcript,
    });
    toast.success("DOCX download started");
  };

  const handleExportPdf = async () => {
    const { downloadPdf } = await import("@/lib/export/pdf");
    await downloadPdf({
      filename: `${exportBasename(filename)}.pdf`,
      sourceFilename: filename,
      dateLabel,
      transcript,
    });
    toast.success("PDF download started");
  };

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[var(--success)]">
            <CheckCircle2 className="h-5 w-5" aria-hidden />
            <p className="text-sm font-medium">Your transcript is ready.</p>
          </div>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">Transcript</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {filename}
            {completedLabel ? ` · ${completedLabel}` : null}
          </p>
        </div>
        <Button type="button" variant="outline" onClick={onStartNew}>
          Start another transcription
        </Button>
      </div>

      <TranscriptToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCopy={handleCopy}
        onSelectAll={handleSelectAll}
        onReset={onReset}
        onClearRequest={() => setClearOpen(true)}
        onExportTxt={handleExportTxt}
        onExportDocx={() => void handleExportDocx()}
        onExportPdf={() => void handleExportPdf()}
        canReset={transcript !== originalTranscript}
      />

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted-foreground)]">
        <span>{words.toLocaleString("en-GB")} words</span>
        <span>{characters.toLocaleString("en-GB")} characters</span>
        <span>
          ~{readingMinutes} min read
        </span>
      </div>

      <div className="mt-4">
        <TranscriptEditor
          value={transcript}
          onChange={onTranscriptChange}
          searchQuery={searchQuery}
        />
      </div>

      <ConfirmationDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="Clear transcript?"
        description="This will remove the transcript text from the editor. You can start another transcription afterwards."
        confirmLabel="Clear transcript"
        destructive
        onConfirm={() => onTranscriptChange("")}
      />
    </section>
  );
}
