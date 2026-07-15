/**
 * Merge ordered segment transcripts into one coherent transcript.
 * Removes exact duplicated boundary sentences without rewriting content.
 */
export function mergeTranscripts(segments: string[]): string {
  const cleaned = segments
    .map((segment) => normaliseWhitespace(segment))
    .filter(Boolean);

  if (cleaned.length === 0) return "";
  if (cleaned.length === 1) return cleaned[0];

  let result = cleaned[0];

  for (let i = 1; i < cleaned.length; i += 1) {
    const next = cleaned[i];
    const overlap = findBoundaryOverlap(result, next);
    const addition = overlap > 0 ? next.slice(overlap).trimStart() : next;
    if (!addition) continue;

    const needsSpace =
      !/[.!?…]$/.test(result.trim()) && !/^[,.;:!?]/.test(addition);
    const separator = needsSpace ? " " : result.endsWith("\n") ? "" : " ";

    // Prefer paragraph break when previous ends with sentence and addition starts capitalised
    if (/[.!?]$/.test(result.trim()) && /^[A-ZÀ-ÖØ-Þ]/.test(addition)) {
      result = `${result.trimEnd()}\n\n${addition}`;
    } else {
      result = `${result.trimEnd()}${separator}${addition}`;
    }
  }

  return normaliseWhitespace(result);
}

function normaliseWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/** Longest common suffix/prefix overlap in characters, sentence-aware. */
function findBoundaryOverlap(left: string, right: string): number {
  const leftTail = left.slice(-400);
  const rightHead = right.slice(0, 400);

  const leftSentences = splitSentences(leftTail);
  const rightSentences = splitSentences(rightHead);

  if (leftSentences.length && rightSentences.length) {
    const last = leftSentences[leftSentences.length - 1]?.trim().toLowerCase();
    const first = rightSentences[0]?.trim().toLowerCase();
    if (last && first && last === first && last.length >= 12) {
      const match = right.match(new RegExp(`^\\s*${escapeRegExp(rightSentences[0])}`));
      if (match) return match[0].length;
    }
  }

  // Character-level overlap fallback for short repeats
  const max = Math.min(leftTail.length, rightHead.length, 120);
  for (let size = max; size >= 20; size -= 1) {
    const suffix = leftTail.slice(-size);
    if (rightHead.startsWith(suffix)) {
      return size;
    }
  }

  return 0;
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
