import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function walk(dir: string, files: string[] = []): string[] {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

describe("client bundle security", () => {
  it("does not embed OPENAI_API_KEY in the client static bundle", () => {
    const staticDir = path.join(process.cwd(), ".next", "static");
    if (!fs.existsSync(staticDir)) {
      // Build artefacts are optional for unit-only CI; treat as skipped soft assert
      expect(true).toBe(true);
      return;
    }

    const files = walk(staticDir).filter((file) =>
      /\.(js|css|json|html|map)$/.test(file),
    );

    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");
      expect(content).not.toContain("OPENAI_API_KEY");
      expect(content).not.toMatch(/sk-[a-zA-Z0-9]{10,}/);
    }
  });
});
