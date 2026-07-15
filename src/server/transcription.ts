import fs from "node:fs";
import OpenAI from "openai";
import { toFile } from "openai/uploads";
import { getEnv } from "@/server/env";
import { UserErrors, logServerError } from "@/server/errors";
import { mergeTranscripts } from "@/server/transcript-merger";

const MODEL = "gpt-4o-transcribe" as const;
const REQUEST_TIMEOUT_MS = 5 * 60_000;

function createClient(): OpenAI {
  const { OPENAI_API_KEY } = getEnv();
  return new OpenAI({
    apiKey: OPENAI_API_KEY,
    timeout: REQUEST_TIMEOUT_MS,
    maxRetries: 1,
  });
}

async function transcribeFile(
  client: OpenAI,
  filePath: string,
  language?: string,
): Promise<string> {
  const stream = fs.createReadStream(filePath);
  const file = await toFile(stream, "audio.mp3");

  try {
    const result = await client.audio.transcriptions.create({
      file,
      model: MODEL,
      response_format: "text",
      ...(language ? { language } : {}),
    });

    if (typeof result === "string") {
      return result.trim();
    }

    if (result && typeof result === "object" && "text" in result) {
      return String((result as { text: string }).text ?? "").trim();
    }

    return String(result ?? "").trim();
  } catch (error) {
    logServerError("openai-transcribe", error);
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("timeout") || message.includes("timed out")) {
      throw UserErrors.timeout();
    }
    throw UserErrors.transcriptionFailed();
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      results[current] = await mapper(items[current], current);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

export async function transcribeSegments(
  segmentPaths: string[],
  options: {
    language?: string;
    onProgress?: (completed: number, total: number) => void;
  } = {},
): Promise<string> {
  if (segmentPaths.length === 0) {
    throw UserErrors.transcriptionFailed();
  }

  const client = createClient();
  const concurrency = getEnv().TRANSCRIPTION_CONCURRENCY;
  let completed = 0;

  const texts = await mapWithConcurrency(
    segmentPaths,
    concurrency,
    async (segmentPath) => {
      const text = await transcribeFile(client, segmentPath, options.language);
      completed += 1;
      options.onProgress?.(completed, segmentPaths.length);
      return text;
    },
  );

  return mergeTranscripts(texts);
}
