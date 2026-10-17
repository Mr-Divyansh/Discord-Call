# Architecture — CallFrame

**Created by Divyansh — DVF Studio**

## Architectural goal

Separate project editing, audio analysis, scene composition, and media encoding so each part can be tested independently. Prefer local processing and avoid a required cloud backend.

## Proposed components

### 1. UI
React + TypeScript is a candidate for the project dashboard and editor. UI state includes participant settings, asset references, timeline positions, preview state, and render-job status.

### 2. Project model
Store project settings in a versioned JSON document. Keep large media files as local assets referenced by project-relative paths rather than embedding them in JSON.

Example conceptual entities:
- `Project`: name, version, export settings, timeline.
- `Participant`: id, display name, avatar asset, audio asset, volume.
- `AudioAsset`: path, duration, format, offset, gain.
- `TimelineEvent`: event type, start time, duration, asset reference.
- `RenderSettings`: width, height, FPS, video codec, audio codec, quality.

### 3. Audio analysis
Analyze each participant's track independently in short windows. Calculate RMS/energy or use a suitable voice-activity detector. Apply thresholds, attack/release smoothing, and optional manual overrides to produce time ranges for speaking indicators.

The analysis must use a consistent timeline clock and must not shift source audio.

### 4. Scene composition
Create a deterministic frame for each timestamp:
- Determine call state at that time.
- Draw participant avatars and labels.
- Check each participant's speaking interval.
- Apply the green ring to the correct avatar.
- Render transitions and other visual elements.

### 5. Media pipeline
Use FFmpeg for audio decoding/mixing and final encoding. A composition engine such as Remotion or a custom renderer may generate frames. Validate the exact library versions, local-rendering requirements, and licensing before committing to a stack.

### 6. Render worker
Run rendering outside the UI thread/process where practical. Communicate progress, cancellation, and errors through a job interface. Write to a temporary output first, then move/rename it to the final path only after successful completion.

## Data flow

1. User selects media and settings.
2. Project validator checks files and configuration.
3. Audio analyzer creates speaking intervals for each participant.
4. Timeline planner resolves event times without changing source-track timing.
5. Renderer composes frames and audio.
6. Encoder produces the MP4.
7. Validator checks output existence, duration, dimensions, frame rate, and audio stream.
8. User exports the completed file.

## Reliability requirements

- Use a stable project schema version and migrations if it changes.
- Never silently drop missing assets or unsupported formats.
- Preserve the project after a failed render.
- Cancel jobs cleanly and remove incomplete output files.
- Avoid loading full media files into memory unnecessarily.
- Test output timing and speaking indicators with known sample assets.

## Security and privacy

- Treat uploaded files as untrusted input.
- Avoid shell-string interpolation when invoking FFmpeg; pass validated arguments safely.
- Restrict asset paths to the project/workspace where possible.
- Do not execute uploaded files.
- Do not upload media to remote services by default.
