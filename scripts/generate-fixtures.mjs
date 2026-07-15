#!/usr/bin/env node
/**
 * Generates small media fixtures with FFmpeg (not committed).
 */
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../tests/fixtures/media",
);

async function run(args) {
  await new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", ["-y", ...args], { stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg failed: ${code}`)),
    );
  });
}

await fs.mkdir(root, { recursive: true });

await run([
  "-f",
  "lavfi",
  "-i",
  "sine=frequency=440:duration=2",
  "-ac",
  "1",
  path.join(root, "sample.mp3"),
]);

await run([
  "-f",
  "lavfi",
  "-i",
  "sine=frequency=440:duration=2",
  "-ac",
  "1",
  path.join(root, "sample.wav"),
]);

await run([
  "-f",
  "lavfi",
  "-i",
  "sine=frequency=440:duration=2",
  "-c:a",
  "aac",
  path.join(root, "sample.m4a"),
]);

await run([
  "-f",
  "lavfi",
  "-i",
  "sine=frequency=440:duration=2",
  "-f",
  "lavfi",
  "-i",
  "color=c=blue:s=320x240:d=2",
  "-shortest",
  "-c:v",
  "libx264",
  "-c:a",
  "aac",
  path.join(root, "sample.mp4"),
]);

await fs.writeFile(path.join(root, "corrupt.m4a"), Buffer.from("not-m4a"));
await fs.writeFile(path.join(root, "empty.mp3"), Buffer.alloc(0));
await fs.writeFile(path.join(root, "notes.pdf"), Buffer.from("%PDF-1.4"));

console.log("Fixtures written to", root);
