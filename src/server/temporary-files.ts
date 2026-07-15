import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";

const ROOT_DIR = path.join(os.tmpdir(), "transcribe-studio");

export async function ensureRootTempDir(): Promise<string> {
  await fs.mkdir(ROOT_DIR, { recursive: true });
  return ROOT_DIR;
}

export async function createJobTempDir(jobId: string): Promise<string> {
  await ensureRootTempDir();
  const dir = path.join(ROOT_DIR, jobId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function writeUploadToTemp(
  tempDir: string,
  filename: string,
  data: ArrayBuffer | Buffer,
): Promise<string> {
  const safeName = path.basename(filename);
  const target = path.join(tempDir, `upload-${safeName}`);
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  await fs.writeFile(target, buffer);
  return target;
}

export async function removePath(target: string | null | undefined): Promise<void> {
  if (!target) return;
  try {
    await fs.rm(target, { recursive: true, force: true });
  } catch {
    // Best-effort cleanup
  }
}

export async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

export function uniqueTempName(prefix: string, extension: string): string {
  return `${prefix}-${randomUUID()}.${extension.replace(/^\./, "")}`;
}
