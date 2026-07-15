import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-sm font-medium text-[var(--foreground)]">
            Transcribe Studio
          </p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Built for clear, accurate transcription.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--muted-foreground)]">
          <Link
            href="/privacy"
            className="transition hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded"
          >
            Privacy
          </Link>
          <Link
            href="/how-it-works"
            className="transition hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded"
          >
            How it works
          </Link>
          <span>© {year}</span>
        </div>
      </div>
    </footer>
  );
}
