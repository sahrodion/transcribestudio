import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import Busboy from "busboy";
import { ApplicationError, UserErrors, logServerError } from "@/server/errors";
import { maxUploadBytes } from "@/server/env";
import {
  getExtension,
  isAllowedExtension,
  assertSafeFilename,
} from "@/server/file-validation";
import { sanitiseFilename } from "@/lib/utils";
import type { UploadMetadata } from "@/lib/types";

export interface ParsedMultipartUpload {
  metadata: UploadMetadata;
  uploadPath: string;
  language: string;
  sessionToken: string | null;
}

/**
 * Stream a multipart upload straight to disk.
 * Avoids buffering the whole file in memory (important on Railway for large recordings).
 */
export async function parseMultipartUpload(
  request: Request,
  tempDir: string,
): Promise<ParsedMultipartUpload> {
  await mkdir(tempDir, { recursive: true });

  const contentType = request.headers.get("content-type");
  if (!contentType?.includes("multipart/form-data")) {
    throw new ApplicationError(
      "INVALID_CONTENT_TYPE",
      "Please upload a recording using the form provided.",
      415,
    );
  }

  if (!request.body) {
    throw UserErrors.emptyFile();
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const length = Number.parseInt(contentLength, 10);
    if (Number.isFinite(length) && length > maxUploadBytes() + 1024 * 1024) {
      throw UserErrors.oversized();
    }
  }

  const fields: Record<string, string> = {};
  let metadata: UploadMetadata | null = null;
  let uploadPath: string | null = null;
  let fileReceived = false;
  const fileTasks: Promise<void>[] = [];

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    const succeed = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    const busboy = Busboy({
      headers: { "content-type": contentType },
      limits: {
        files: 1,
        fileSize: maxUploadBytes(),
        fields: 10,
        fieldSize: 16 * 1024,
      },
    });

    busboy.on("file", (fieldname, fileStream, info) => {
      if (fieldname !== "file") {
        fileStream.resume();
        return;
      }

      fileReceived = true;
      const filename = info.filename || "recording";

      try {
        assertSafeFilename(filename);
      } catch (error) {
        fileStream.resume();
        fail(error);
        return;
      }

      const extension = getExtension(filename);
      if (!isAllowedExtension(extension)) {
        fileStream.resume();
        fail(UserErrors.unsupportedFile());
        return;
      }

      const sanitisedName = sanitiseFilename(filename);
      const targetPath = path.join(tempDir, `upload-${sanitisedName}`);
      uploadPath = targetPath;

      let sizeBytes = 0;
      let truncated = false;
      const writeStream = createWriteStream(targetPath);

      fileStream.on("data", (chunk: Buffer) => {
        sizeBytes += chunk.length;
      });

      fileStream.on("limit", () => {
        truncated = true;
      });

      const task = pipeline(fileStream, writeStream)
        .then(() => {
          if (truncated) {
            throw UserErrors.oversized();
          }
          if (sizeBytes <= 0) {
            throw UserErrors.emptyFile();
          }

          metadata = {
            originalName: filename,
            sanitisedName,
            sizeBytes,
            extension,
            mimeType: info.mimeType || "application/octet-stream",
          };
        })
        .catch((error) => {
          if (error instanceof ApplicationError) throw error;
          logServerError("multipart-write", error);
          throw UserErrors.damaged();
        });

      fileTasks.push(task);
    });

    busboy.on("field", (name, value) => {
      fields[name] = value;
    });

    busboy.on("error", (error) => {
      logServerError("multipart-busboy", error);
      fail(
        new ApplicationError(
          "UPLOAD_PARSE_FAILED",
          "We could not read this upload. The connection may have been interrupted.",
          400,
          { cause: error },
        ),
      );
    });

    busboy.on("finish", () => {
      void Promise.all(fileTasks)
        .then(() => {
          if (!fileReceived || !metadata || !uploadPath) {
            fail(UserErrors.unsupportedFile());
            return;
          }
          succeed();
        })
        .catch(fail);
    });

    const nodeBody = Readable.fromWeb(
      request.body as import("node:stream/web").ReadableStream,
    );

    pipeline(nodeBody, busboy).catch((error) => {
      if (error instanceof ApplicationError) {
        fail(error);
        return;
      }
      logServerError("multipart-pipeline", error);
      fail(
        new ApplicationError(
          "UPLOAD_PARSE_FAILED",
          "We could not read this upload. The connection may have been interrupted.",
          400,
          { cause: error },
        ),
      );
    });
  });

  if (!metadata || !uploadPath) {
    throw UserErrors.unsupportedFile();
  }

  return {
    metadata,
    uploadPath,
    language: fields.language || "auto",
    sessionToken: fields.sessionToken || null,
  };
}
