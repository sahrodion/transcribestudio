import { describe, expect, it } from "vitest";
import { mergeTranscripts } from "@/server/transcript-merger";

describe("mergeTranscripts", () => {
  it("returns empty string for no segments", () => {
    expect(mergeTranscripts([])).toBe("");
  });

  it("returns a single segment unchanged", () => {
    expect(mergeTranscripts(["Hello world."])).toBe("Hello world.");
  });

  it("preserves chronological order", () => {
    const result = mergeTranscripts([
      "First section about the product.",
      "Second section about pricing.",
      "Third section about support.",
    ]);
    expect(result.indexOf("First")).toBeLessThan(result.indexOf("Second"));
    expect(result.indexOf("Second")).toBeLessThan(result.indexOf("Third"));
  });

  it("removes exact duplicated boundary sentences", () => {
    const result = mergeTranscripts([
      "Welcome to the meeting. We will discuss the roadmap.",
      "We will discuss the roadmap. Next we cover finances.",
    ]);
    const matches = result.match(/We will discuss the roadmap/gi) ?? [];
    expect(matches).toHaveLength(1);
    expect(result).toContain("Welcome to the meeting");
    expect(result).toContain("Next we cover finances");
  });

  it("does not remove legitimate repeated phrases mid-transcript", () => {
    const result = mergeTranscripts([
      "Yes yes, that is correct.",
      "And the answer remains yes yes when confirmed.",
    ]);
    expect(result.toLowerCase()).toContain("yes yes");
  });

  it("normalises whitespace without summarising", () => {
    const result = mergeTranscripts([
      "Line one.   \n\n\nLine two.",
      "Line three.",
    ]);
    expect(result).not.toMatch(/\n{3,}/);
    expect(result).toContain("Line one");
    expect(result).toContain("Line three");
  });
});
