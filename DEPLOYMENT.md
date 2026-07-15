# Deployment guide

Transcribe Studio needs a **persistent Node.js host** with:

- Multipart uploads
- Temporary filesystem access
- FFmpeg / FFprobe
- Request durations long enough for media processing (or a single long-lived process)
- Environment variable support

Do **not** assume standard Vercel serverless functions can reliably process large media or long FFmpeg jobs. Prefer Docker on Railway, Render, Fly.io, or any VPS.

## Railway

1. Push this repository to GitHub.
2. Create a new Railway project from the repo.
3. Railway will detect `railway.json` and build with the Dockerfile.
4. Set environment variables from `.env.example` (especially `OPENAI_API_KEY`).
5. Expose port `3000`.
6. Confirm `GET /api/health` returns `{ "status": "ok" }`.

Job state is stored in memory on the running instance. Use a **single replica** unless you add Redis/Postgres for a shared job store.

## Render

1. Create a new **Web Service**.
2. Choose **Docker** and point at this repository’s `Dockerfile`.
3. Set the same environment variables.
4. Health check path: `/api/health`.
5. Choose an instance size with enough disk and CPU for FFmpeg.

## Fly.io

```bash
fly launch --dockerfile Dockerfile
fly secrets set OPENAI_API_KEY=sk-...
fly deploy
```

Ensure the machine has enough memory for conversion (512 MB–1 GB recommended for longer files).

## Docker Compose (VPS)

```bash
cp .env.example .env
# edit .env
docker compose up -d --build
```

## Production checklist

- [ ] `OPENAI_API_KEY` set (server only)
- [ ] FFmpeg available in the container/image
- [ ] Single instance or shared job store
- [ ] Upload size and duration limits reviewed
- [ ] HTTPS terminated at the proxy/load balancer
- [ ] `/api/health` monitored

## Scaling later

Version one keeps jobs in memory. For multiple instances:

- PostgreSQL for job metadata
- Redis queue for workers
- Temporary object storage only if needed

Do not permanently store recordings unless you deliberately add that product feature.
