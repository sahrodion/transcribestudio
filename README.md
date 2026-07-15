# Transcribe Studio

Premium audio and video transcription. Upload a recording, wait while it is processed securely on the server, then review, edit and export a single clear transcript.

**Turn every recording into clear, usable text.**

## Features

- Drag-and-drop or tap-to-select uploads (MP3, M4A, WAV, MP4, MPEG, MPGA, WebM, OGG, FLAC)
- Server-side FFmpeg validation, conversion and segmentation
- OpenAI `gpt-4o-transcribe` (API key never reaches the browser)
- Job progress with polling — no technical internals exposed
- Editable transcript with copy, reset, search and TXT / DOCX / PDF export
- Light and dark themes with system preference support
- Mobile-first responsive layout

## Requirements

- Node.js 20+
- FFmpeg and FFprobe on the server `PATH` (included in the Docker image)
- An OpenAI API key

## Quick start

```bash
cp .env.example .env
# Add OPENAI_API_KEY to .env

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `OPENAI_API_KEY` | — | Required. Server-only OpenAI key |
| `MAX_UPLOAD_MB` | `250` | Maximum upload size in megabytes |
| `MAX_AUDIO_DURATION_MINUTES` | `240` | Maximum media duration |
| `TRANSCRIPTION_CONCURRENCY` | `2` | Parallel OpenAI segment requests |
| `JOB_TTL_MINUTES` | `60` | In-memory job expiry |
| `NEXT_PUBLIC_MAX_UPLOAD_MB` | `250` | Displayed upload limit in the UI |
| `FFMPEG_PATH` / `FFPROBE_PATH` | `ffmpeg` / `ffprobe` | Binary locations |

Never set the OpenAI key with a `NEXT_PUBLIC_` prefix.

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Run production server
npm run lint         # ESLint
npm run typecheck    # TypeScript
npm run test         # Vitest unit/component tests
npm run test:e2e     # Playwright (requires a built app / webServer)
npm run fixtures:media  # Generate small FFmpeg fixtures locally
```

## Docker

```bash
docker compose up --build
```

Or:

```bash
docker build -t transcribe-studio .
docker run --rm -p 3000:3000 -e OPENAI_API_KEY=sk-... transcribe-studio
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Railway, Render and Fly.io notes.

## Architecture (summary)

1. `POST /api/transcriptions` accepts multipart upload, validates the file, stores it in a unique temp job folder, returns a job ID.
2. Background processing probes media with FFprobe, converts with FFmpeg, splits into valid audio files under OpenAI’s 25 MB limit, transcribes with `gpt-4o-transcribe`, merges text, deletes temps.
3. `GET /api/transcriptions/[jobId]/status` returns progress and the final transcript when ready.

The UI only shows calm status messages such as “Preparing your recording” and “Transcribing”.

## Privacy

Files are processed for transcription only. Temporary media is deleted after each job. See `/privacy`.

## Licence

Private application. All rights reserved.
