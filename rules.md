# Project Rules — CallFrame

**Created by Divyansh — DVF Studio**

These rules guide contributors and coding agents working on CallFrame.

## Product rules
1. The core workflow must not require recording a live Discord call.
2. The primary inputs are separate participant audio tracks, profile pictures, and optional call effects.
3. Preserve source audio timing and silence unless the user explicitly edits the timeline.
4. Determine speaking activity from the assigned participant track whenever possible.
5. The default scene is a voice call, not a video call.
6. Do not claim a feature is implemented unless it exists and has been tested.

## Code rules
1. Use TypeScript for new frontend code if React + TypeScript is selected.
2. Keep UI, project model, audio analysis, composition, and encoding responsibilities separated.
3. Prefer small modules with clear interfaces.
4. Validate project data and media inputs.
5. Use safe process invocation for FFmpeg; do not build shell commands from untrusted strings.
6. Report errors with enough context to help the user recover.
7. Avoid blocking the UI during rendering.
8. Add tests for timing, speaker intervals, and render validation.

## UX rules
1. Keep **Start Rendering** easy to find.
2. Always show render progress and failure state.
3. Do not hide unsupported formats or missing files behind silent fallbacks.
4. Use green primarily for speaking indicators and success states.
5. Make the preview/final-render quality difference clear.

## Privacy and licensing
1. Local processing is the default goal.
2. Do not send user media to remote services without explicit consent.
3. Do not commit personal audio or private profile pictures as sample assets.
4. Use original or properly licensed assets.
5. Do not imply official affiliation with Discord.
6. Confirm third-party license compatibility before release.

## Change management
- Update documentation when behavior or settings change.
- Keep the project schema versioned.
- Avoid unrelated refactors during focused feature work.
- Run relevant tests before marking a task complete.
