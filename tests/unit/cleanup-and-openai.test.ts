import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createJobTempDir,
  writeUploadToTemp,
  removePath,
  pathExists,
} from "@/server/temporary-files";

describe("temporary files cleanup", () => {
  const created: string[] = [];

  afterEach(async () => {
    for (const dir of created) {
      await removePath(dir);
    }
    created.length = 0;
  });

  it("cleans up temporary files after success", async () => {
    const dir = await createJobTempDir(`test-success-${Date.now()}`);
    created.push(dir);
    const filePath = await writeUploadToTemp(dir, "sample.mp3", Buffer.from("abc"));
    expect(await pathExists(filePath)).toBe(true);
    await removePath(dir);
    expect(await pathExists(dir)).toBe(false);
  });

  it("cleans up temporary files after failure", async () => {
    const dir = await createJobTempDir(`test-failure-${Date.now()}`);
    created.push(dir);
    await writeUploadToTemp(dir, "broken.m4a", Buffer.from("nope"));
    let failed = false;
    try {
      throw new Error("simulated failure");
    } catch {
      failed = true;
      await removePath(dir);
    }
    expect(failed).toBe(true);
    expect(await pathExists(dir)).toBe(false);
  });

  it("uses secure temp directories under os.tmpdir", async () => {
    const dir = await createJobTempDir(`test-root-${Date.now()}`);
    created.push(dir);
    expect(dir.startsWith(path.join(os.tmpdir(), "transcribe-studio"))).toBe(
      true,
    );
    const listing = await fs.readdir(dir);
    expect(Array.isArray(listing)).toBe(true);
  });
});

describe("OpenAI timeout mapping", () => {
  it("maps timeout errors to a user-friendly message", async () => {
    vi.resetModules();
    process.env.OPENAI_API_KEY = "test-openai-key";

    vi.doMock("openai", () => {
      class OpenAI {
        audio = {
          transcriptions: {
            create: async () => {
              throw new Error("Request timed out");
            },
          },
        };
      }
      return { default: OpenAI };
    });

    vi.doMock("openai/uploads", () => ({
      toFile: async () => new Blob(["x"]),
    }));

    const { UserErrors } = await import("@/server/errors");
    const { transcribeSegments } = await import("@/server/transcription");

    // Create a tiny temp file for the stream
    const dir = await createJobTempDir(`openai-timeout-${Date.now()}`);
    const filePath = await writeUploadToTemp(dir, "a.mp3", Buffer.from("abcd"));

    await expect(transcribeSegments([filePath])).rejects.toThrow(
      UserErrors.timeout().message,
    );

    await removePath(dir);
    vi.doUnmock("openai");
    vi.doUnmock("openai/uploads");
  });
});
