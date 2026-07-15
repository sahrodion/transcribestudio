"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { LANGUAGE_OPTIONS } from "@/lib/languages";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface LanguageSelectorProps {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

export function LanguageSelector({
  value,
  disabled,
  onChange,
}: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = LANGUAGE_OPTIONS.find((option) => option.value === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LANGUAGE_OPTIONS;
    return LANGUAGE_OPTIONS.filter((option) =>
      option.label.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="relative">
      <label
        htmlFor="spoken-language"
        className="mb-2 block text-sm font-medium text-[var(--foreground)]"
      >
        Spoken language
      </label>
      <Button
        id="spoken-language"
        type="button"
        variant="outline"
        disabled={disabled}
        className="w-full justify-between font-normal"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{selected?.label ?? "Detect automatically"}</span>
        <ChevronsUpDown className="h-4 w-4 opacity-60" />
      </Button>
      {open && (
        <div
          className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-lg"
          role="listbox"
          aria-label="Spoken language options"
        >
          <div className="border-b border-[var(--border)] p-2">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search languages"
              className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              autoFocus
            />
          </div>
          <ul className="max-h-56 overflow-y-auto p-1">
            {filtered.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-[var(--muted)]",
                    option.value === value && "bg-[var(--muted)]",
                  )}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  {option.label}
                  {option.value === value && (
                    <Check className="h-4 w-4 text-[var(--primary)]" />
                  )}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-[var(--muted-foreground)]">
                No languages found
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
