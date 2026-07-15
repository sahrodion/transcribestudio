"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  hasTranscript?: boolean;
  onChooseFile: () => void;
  onViewTranscript?: () => void;
}

export function HeroSection({
  hasTranscript,
  onChooseFile,
  onViewTranscript,
}: HeroSectionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden pb-10 pt-12 sm:pb-14 sm:pt-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-64 w-[min(100%,40rem)] rounded-full bg-[var(--glow)] blur-3xl"
      />
      <motion.div
        className="relative mx-auto max-w-2xl text-center"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="mb-4 text-sm font-medium tracking-wide text-[var(--primary)]">
          Transcribe Studio
        </p>
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl md:text-[2.75rem] md:leading-[1.15]">
          Turn recordings into clear, usable text.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-[var(--muted-foreground)] sm:text-lg">
          Upload an audio or video file and receive an accurate transcript you
          can review, copy and export.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {hasTranscript ? (
            <Button
              type="button"
              variant="accent"
              size="lg"
              className="w-full sm:w-auto"
              onClick={onViewTranscript}
            >
              View transcript
            </Button>
          ) : (
            <Button
              type="button"
              variant="accent"
              size="lg"
              className="w-full sm:w-auto"
              onClick={onChooseFile}
            >
              Choose a file
            </Button>
          )}
        </div>
        <p className="mt-4 text-sm text-[var(--muted-foreground)]">
          Supports MP3, M4A, WAV, MP4, MPEG, MPGA and WebM.
        </p>
      </motion.div>
    </section>
  );
}
