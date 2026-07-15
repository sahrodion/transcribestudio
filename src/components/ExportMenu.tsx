"use client";

import { useState } from "react";
import { ChevronDown, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportMenuProps {
  onExportTxt: () => void;
  onExportDocx: () => void;
  onExportPdf: () => void;
}

export function ExportMenu({
  onExportTxt,
  onExportDocx,
  onExportPdf,
}: ExportMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <FileDown className="h-4 w-4" />
        Download
        <ChevronDown className="h-3.5 w-3.5 opacity-70" />
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 z-20 mt-2 min-w-[10rem] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-1 shadow-lg"
        >
          {[
            { label: "TXT", action: onExportTxt },
            { label: "DOCX", action: onExportDocx },
            { label: "PDF", action: onExportPdf },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className="flex w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--muted)]"
              onClick={() => {
                item.action();
                setOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
