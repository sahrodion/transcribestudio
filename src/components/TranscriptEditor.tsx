"use client";

import { useEffect, useRef } from "react";

interface TranscriptEditorProps {
  value: string;
  onChange: (value: string) => void;
  searchQuery?: string;
}

export function TranscriptEditor({
  value,
  onChange,
  searchQuery = "",
}: TranscriptEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 320)}px`;
  }, [value]);

  useEffect(() => {
    if (!searchQuery || !ref.current) return;
    const index = value.toLowerCase().indexOf(searchQuery.toLowerCase());
    if (index >= 0) {
      ref.current.focus();
      ref.current.setSelectionRange(index, index + searchQuery.length);
    }
  }, [searchQuery, value]);

  return (
    <label className="block">
      <span className="sr-only">Transcript</span>
      <textarea
        ref={ref}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck
        className="min-h-[320px] w-full resize-y rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-4 text-base leading-7 text-[var(--foreground)] shadow-inner outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        placeholder="Transcript text will appear here…"
      />
    </label>
  );
}
