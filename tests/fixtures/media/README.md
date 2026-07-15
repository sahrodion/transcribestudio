# Media fixtures

Large binary media files are not committed. Generate them locally with FFmpeg:

```bash
npm run fixtures:media
```

This creates short tone files under `tests/fixtures/media/` for manual and Playwright tests.
