# CallFrame App

Discord-inspired voice-call video generator. Built with React + TypeScript and ffmpeg.wasm (client-side MP4 encoding — no server, no cloud).

## Run

```bash
npm install        # installs deps and bundles the ffmpeg.wasm core into public/ffmpeg-core
npm run dev        # start dev server (http://localhost:5173)
npm run build      # production build to dist/
npm run preview    # preview production build
```

## Workflow

1. Create a project (name, export resolution/FPS).
2. Configure Person A (Divyansh) and Person B (Abhay): display names, profile pictures (PNG/JPG/WebP), audio tracks (MP3/WAV/M4A).
3. Add call sound effects: outgoing ring, call-connected, call-ended, and their positions.
4. Preview the full scene with synced audio and green speaking indicators.
5. Click **Start Rendering** to encode a local MP4 (H.264 + AAC) and download it.

## Notes

- All audio inputs and sound effects are placeholders until you upload your own files — no dummy audio is bundled.
- Rendering runs in the browser via ffmpeg.wasm. Default export is 720p30 for reliability; 1080p60 is available but slower and memory-intensive.
- Projects save/load as JSON files with embedded assets.
