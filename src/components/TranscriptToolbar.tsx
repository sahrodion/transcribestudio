"use client";

import {
  Copy,
  Download,
  Eraser,
  RotateCcw,
  Search,
  TextSelect,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExportMenu } from "@/components/ExportMenu";

interface TranscriptToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onCopy: () => void;
  onSelectAll: () => void;
  onReset: () => void;
  onClearRequest: () => void;
  onExportTxt: () => void;
  onExportDocx: () => void;
  onExportPdf: () => void;
  canReset: boolean;
}

export function TranscriptToolbar({
  searchQuery,
  onSearchChange,
  onCopy,
  onSelectAll,
  onReset,
  onClearRequest,
  onExportTxt,
  onExportDocx,
  onExportPdf,
  canReset,
}: TranscriptToolbarProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search within transcript"
          aria-label="Search within transcript"
          className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] pl-10 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCopy}>
          <Copy className="h-4 w-4" />
          Copy
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onSelectAll}>
          <TextSelect className="h-4 w-4" />
          Select all
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReset}
          disabled={!canReset}
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onClearRequest}>
          <Eraser className="h-4 w-4" />
          Clear
        </Button>
        <ExportMenu
          onExportTxt={onExportTxt}
          onExportDocx={onExportDocx}
          onExportPdf={onExportPdf}
        />
        <span className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] sm:ml-auto">
          <Download className="h-3.5 w-3.5" />
          Export available
        </span>
      </div>
    </div>
  );
}
