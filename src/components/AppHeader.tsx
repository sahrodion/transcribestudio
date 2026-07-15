"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AppHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const scrollToTranscribe = () => {
    document.getElementById("transcribe")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)]/80 bg-[var(--background)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <BrandLogo />
        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Primary"
        >
          {isHome ? (
            <button
              type="button"
              onClick={scrollToTranscribe}
              className="rounded-lg px-3 py-2 text-sm text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              Transcribe
            </button>
          ) : (
            <Link
              href="/#transcribe"
              className="rounded-lg px-3 py-2 text-sm text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              Transcribe
            </Link>
          )}
          <Link
            href="/how-it-works"
            className="rounded-lg px-3 py-2 text-sm text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            How it works
          </Link>
          <Link
            href="/privacy"
            className="rounded-lg px-3 py-2 text-sm text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            Privacy
          </Link>
        </nav>
        <div className="flex items-center gap-1">
          <nav className="flex items-center gap-1 md:hidden" aria-label="Mobile">
            <Link
              href="/how-it-works"
              className="rounded-lg px-2 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Guide
            </Link>
            <Link
              href="/privacy"
              className="rounded-lg px-2 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Privacy
            </Link>
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
