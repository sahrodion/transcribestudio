"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Quote } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  compact?: boolean;
}

export function BrandLogo({ className, compact = false }: BrandLogoProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const classNameMerged = cn(
    "group inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
    className,
  );

  const mark = (
    <>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-mark)] text-[var(--brand-mark-foreground)] shadow-sm transition group-hover:scale-[1.02]">
        <Quote className="h-4 w-4" aria-hidden />
      </span>
      {!compact && (
        <span className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
          Transcribe Studio
        </span>
      )}
    </>
  );

  if (isHome) {
    return (
      <button
        type="button"
        className={classNameMerged}
        aria-label="Transcribe Studio home"
        onClick={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        {mark}
      </button>
    );
  }

  return (
    <Link href="/" className={classNameMerged} aria-label="Transcribe Studio home">
      {mark}
    </Link>
  );
}
