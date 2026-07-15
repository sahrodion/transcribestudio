import { describe, expect, it, beforeEach } from "vitest";
import {
  resetEnvCache,
  getEnv,
  maxUploadBytes,
} from "@/server/env";
import {
  validateUploadFile,
  isAllowedExtension,
  assertSafeFilename,
} from "@/server/file-validation";
import { UserErrors } from "@/server/errors";
import { clearRateLimitsForTests, checkRateLimit } from "@/server/rate-limit";
import {
  clearAllJobsForTests,
  createJob,
  getJob,
  assertJobAccess,
  updateJob,
} from "@/server/job-store";
import { buildTxtContent } from "@/lib/export/txt";
import { sanitiseFilename, exportBasename } from "@/lib/utils";

function makeFile(
  name: string,
  size: number,
  type = "audio/mpeg",
): File {
  const buffer = new Uint8Array(Math.max(size, 1));
  if (size === 0) {
    return new File([], name, { type });
  }
  return new File([buffer], name, { type });
}

describe("environment", () => {
  beforeEach(() => {
    resetEnvCache();
    process.env.OPENAI_API_KEY = "test-openai-key";
  });

  it("loads validated env values", () => {
    const env = getEnv();
    expect(env.OPENAI_API_KEY).toBe("test-openai-key");
    expect(env.MAX_UPLOAD_MB).toBeGreaterThan(0);
    expect(maxUploadBytes()).toBe(env.MAX_UPLOAD_MB * 1024 * 1024);
  });

  it("never exposes the key via NEXT_PUBLIC variables in this module", () => {
    const env = getEnv();
    expect(Object.keys(env).some((key) => key.startsWith("NEXT_PUBLIC"))).toBe(
      false,
    );
  });
});

describe("file validation", () => {
  beforeEach(() => {
    resetEnvCache();
    process.env.OPENAI_API_KEY = "test-openai-key";
    process.env.MAX_UPLOAD_MB = "250";
  });

  it("accepts a valid MP3", () => {
    const meta = validateUploadFile(makeFile("talk.mp3", 2048, "audio/mpeg"));
    expect(meta.extension).toBe("mp3");
  });

  it("accepts M4A with audio/x-m4a MIME type", () => {
    const meta = validateUploadFile(
      makeFile("voice.m4a", 4096, "audio/x-m4a"),
    );
    expect(meta.extension).toBe("m4a");
  });

  it("accepts a valid WAV", () => {
    const meta = validateUploadFile(makeFile("clip.wav", 4096, "audio/wav"));
    expect(meta.extension).toBe("wav");
  });

  it("accepts MP4 container", () => {
    const meta = validateUploadFile(makeFile("clip.mp4", 8192, "video/mp4"));
    expect(meta.extension).toBe("mp4");
  });

  it("rejects an unsupported file", () => {
    expect(() => validateUploadFile(makeFile("notes.pdf", 2048, "application/pdf"))).toThrow(
      UserErrors.unsupportedFile().message,
    );
  });

  it("rejects a zero-byte file", () => {
    expect(() => validateUploadFile(makeFile("empty.mp3", 0))).toThrow(
      UserErrors.emptyFile().message,
    );
  });

  it("rejects path traversal filenames", () => {
    expect(() => assertSafeFilename("../etc/passwd.mp3")).toThrow();
  });

  it("recognises allowed extensions", () => {
    expect(isAllowedExtension("mp3")).toBe(true);
    expect(isAllowedExtension("exe")).toBe(false);
  });
});

describe("rate limiting", () => {
  beforeEach(() => clearRateLimitsForTests());

  it("allows requests under the limit and blocks afterwards", () => {
    expect(checkRateLimit("ip:1", 2, 60_000).allowed).toBe(true);
    expect(checkRateLimit("ip:1", 2, 60_000).allowed).toBe(true);
    expect(checkRateLimit("ip:1", 2, 60_000).allowed).toBe(false);
  });
});

describe("job store access control", () => {
  beforeEach(() => clearAllJobsForTests());

  it("prevents unauthorised retrieval of another job", () => {
    const job = createJob({
      sessionToken: "11111111-1111-4111-8111-111111111111",
      language: "auto",
      metadata: {
        originalName: "a.mp3",
        sanitisedName: "a.mp3",
        sizeBytes: 10,
        extension: "mp3",
        mimeType: "audio/mpeg",
      },
      tempDir: "/tmp/test",
    });

    expect(assertJobAccess(job, "11111111-1111-4111-8111-111111111111")).toBe(
      true,
    );
    expect(assertJobAccess(job, "22222222-2222-4222-8222-222222222222")).toBe(
      false,
    );
    expect(getJob(job.id)?.id).toBe(job.id);
  });

  it("never decreases progress", () => {
    const job = createJob({
      sessionToken: "11111111-1111-4111-8111-111111111111",
      language: "en",
      metadata: {
        originalName: "a.mp3",
        sanitisedName: "a.mp3",
        sizeBytes: 10,
        extension: "mp3",
        mimeType: "audio/mpeg",
      },
      tempDir: "/tmp/test",
    });
    updateJob(job.id, { progress: 40 });
    updateJob(job.id, { progress: 20 });
    expect(getJob(job.id)?.progress).toBe(40);
  });
});

describe("exports helpers", () => {
  it("builds TXT content", () => {
    expect(buildTxtContent("Hello", "Title")).toContain("Hello");
    expect(buildTxtContent("Hello")).toBe("Hello");
  });

  it("sanitises export filenames", () => {
    expect(exportBasename("My Interview?.m4a")).toBe(
      "My-Interview-transcript",
    );
    expect(sanitiseFilename("../../secret.mp3")).not.toContain("..");
  });
});

describe("user-facing errors", () => {
  it("does not expose raw backend wording", () => {
    const messages = [
      UserErrors.damaged().message,
      UserErrors.transcriptionFailed().message,
      UserErrors.timeout().message,
      UserErrors.noAudio().message,
    ];
    for (const message of messages) {
      expect(message.toLowerCase()).not.toContain("ffmpeg");
      expect(message.toLowerCase()).not.toContain("sharedarraybuffer");
      expect(message.toLowerCase()).not.toContain("stack");
      expect(message).not.toMatch(/\/tmp\//);
    }
  });
});
