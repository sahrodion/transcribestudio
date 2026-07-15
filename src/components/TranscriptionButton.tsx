"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TranscriptionButtonProps {
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}

export function TranscriptionButton({
  disabled,
  loading,
  onClick,
}: TranscriptionButtonProps) {
  return (
    <Button
      type="button"
      variant="accent"
      size="lg"
      className="w-full"
      disabled={disabled || loading}
      onClick={onClick}
      aria-busy={loading}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Starting…
        </>
      ) : (
        "Transcribe recording"
      )}
    </Button>
  );
}
