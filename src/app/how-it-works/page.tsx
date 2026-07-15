import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Upload a recording, let Transcribe Studio process it securely, then review and export your transcript.",
};

const steps = [
  {
    title: "Upload a recording",
    body: "Choose an audio or video file from your phone or computer. Drag and drop on desktop, or tap to select on mobile.",
  },
  {
    title: "Let Transcribe Studio process it securely",
    body: "Your file is prepared on the server and transcribed automatically. Stay on the page while progress updates.",
  },
  {
    title: "Review and export the transcript",
    body: "Edit the text if you need to, copy it, or download TXT, DOCX or PDF. Start another transcription whenever you like.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-sm font-medium text-[var(--primary)]">How it works</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Three calm steps to a clear transcript
      </h1>
      <p className="mt-4 text-base leading-relaxed text-[var(--muted-foreground)]">
        No technical setup. No model picking. Upload, wait, and review.
      </p>
      <ol className="mt-10 space-y-6">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-[var(--accent)]">
              Step {index + 1}
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">
              {step.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
      <p className="mt-10">
        <Link
          href="/#transcribe"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--accent)] px-5 text-sm font-medium text-[var(--accent-foreground)] transition hover:brightness-105"
        >
          Start transcribing
        </Link>
      </p>
    </div>
  );
}
