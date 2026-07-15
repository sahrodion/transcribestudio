import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How Transcribe Studio handles your recordings and temporary processing data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-sm font-medium text-[var(--primary)]">Privacy</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        How we handle your recordings
      </h1>
      <div className="mt-8 space-y-6 text-base leading-relaxed text-[var(--muted-foreground)]">
        <p>
          Transcribe Studio processes files only to create a transcript. We do
          not use your recordings for advertising, training our own models, or
          unrelated analytics.
        </p>
        <p>
          When you upload a recording, it is stored in a temporary server
          location while transcription is in progress. After processing
          finishes—successfully or not—those temporary media files and working
          folders are deleted.
        </p>
        <p>
          To produce the transcript, the application converts your media on the
          server and sends valid processed audio to OpenAI’s transcription
          service. OpenAI processes that audio according to its own policies.
        </p>
        <p>
          This version of Transcribe Studio does not create user accounts and
          does not permanently store recordings by default. Job status and
          transcripts may be kept temporarily in memory so you can retrieve your
          result, then expire automatically.
        </p>
        <p>
          Job identifiers are unguessable. Access to a transcript requires the
          session token associated with your upload. You should treat that
          session as confidential on shared devices.
        </p>
        <p>
          We do not claim that no data ever leaves your device: transcription
          requires server-side processing and a request to OpenAI. We do claim
          that the application is designed to delete temporary media after each
          job and that the OpenAI API key never appears in browser code.
        </p>
      </div>
      <p className="mt-10">
        <Link
          href="/"
          className="text-sm font-medium text-[var(--primary)] underline-offset-4 hover:underline"
        >
          Back to Transcribe Studio
        </Link>
      </p>
    </div>
  );
}
