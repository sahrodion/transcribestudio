import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || "test-openai-key";
process.env.MAX_UPLOAD_MB = process.env.MAX_UPLOAD_MB || "250";

afterEach(() => {
  cleanup();
});
