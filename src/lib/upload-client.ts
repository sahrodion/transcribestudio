export interface UploadResult {
  jobId: string;
  sessionToken: string;
}

export interface UploadProgressEvent {
  /** 0–100 of the HTTP upload only */
  percent: number;
}

/**
 * Upload via XHR so large Safari/mobile requests get progress events
 * and clearer network failure handling than fetch’s “Load failed”.
 */
export function uploadTranscription(options: {
  file: File;
  language: string;
  sessionToken: string | null;
  signal?: AbortSignal;
  onProgress?: (event: UploadProgressEvent) => void;
}): Promise<UploadResult> {
  const { file, language, sessionToken, signal, onProgress } = options;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/transcriptions");
    xhr.responseType = "json";
    xhr.timeout = 0;

    const abort = () => {
      xhr.abort();
    };
    signal?.addEventListener("abort", abort, { once: true });

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return;
      const percent = Math.max(
        0,
        Math.min(100, Math.round((event.loaded / event.total) * 100)),
      );
      onProgress({ percent });
    };

    xhr.onload = () => {
      signal?.removeEventListener("abort", abort);
      const data = (xhr.response ?? {}) as {
        jobId?: string;
        sessionToken?: string;
        error?: string;
      };

      if (xhr.status >= 200 && xhr.status < 300) {
        if (!data.jobId || !data.sessionToken) {
          reject(new Error("We could not complete this transcription."));
          return;
        }
        resolve({ jobId: data.jobId, sessionToken: data.sessionToken });
        return;
      }

      reject(
        new Error(
          data.error ?? "We could not complete this transcription.",
        ),
      );
    };

    xhr.onerror = () => {
      signal?.removeEventListener("abort", abort);
      reject(
        new Error(
          "Your connection was interrupted while uploading. Please try again on a stable connection.",
        ),
      );
    };

    xhr.ontimeout = () => {
      signal?.removeEventListener("abort", abort);
      reject(
        new Error(
          "This recording took too long to upload. Please try again.",
        ),
      );
    };

    xhr.onabort = () => {
      signal?.removeEventListener("abort", abort);
      const error = new Error("Upload cancelled");
      error.name = "AbortError";
      reject(error);
    };

    const form = new FormData();
    form.append("file", file);
    form.append("language", language);
    if (sessionToken) form.append("sessionToken", sessionToken);
    xhr.send(form);
  });
}

export function toFriendlyUploadError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "We could not complete this transcription.";
  }
  if (error.name === "AbortError") {
    return error.message;
  }

  const message = error.message || "";
  const lower = message.toLowerCase();

  if (
    lower.includes("load failed") ||
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("network request failed")
  ) {
    return "Your connection was interrupted while uploading. Please try again on a stable connection.";
  }

  return message || "We could not complete this transcription.";
}
