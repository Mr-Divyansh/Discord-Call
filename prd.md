# PRD — Discord Voice Call Scene Generator

**Product Type:** Free, Open-Source Audio-to-Video Generator  
**Working Name:** CallFrame  
**Version:** 1.0  
**Platform:** Web-based application with local rendering support  
**License:** MIT (proposed)

## 1. Product Overview

CallFrame is a tool that converts prerecorded audio tracks into a realistic Discord-style voice-call video.

Users upload audio for Person A and Person B, upload their profile pictures, add call sound effects, preview the scene, and render the final video without recording a live Discord call.

The application must reproduce the visual experience of a Discord voice call, including incoming/outgoing ringing, call connection, profile pictures, green speaking indicators, conversation pauses, and call termination.

## 2. Product Goals

- Generate realistic Discord-style voice-call videos from prerecorded audio.
- Allow users to assign different audio tracks to different participants.
- Automatically animate the green speaking ring based on the assigned speaker's audio.
- Support high-quality video rendering without requiring a live call.
- Provide an easy interface suitable for beginner users.
- Keep the core application free and open source.
- Work on Windows computers, including lower-specification laptops.

## 3. Target Users

- Gaming and Minecraft content creators.
- YouTubers and video editors.
- Storytelling and cinematic video creators.
- Users who need realistic simulated voice-call scenes.

## 4. Functional Requirements

### 4.1 Project Setup

Users must be able to create a new project and configure:

- Project name.
- Video resolution.
- Frame rate.
- Export format.
- Audio quality.

**Target export specification:** 1920 × 1080 resolution at 60 FPS, with high-quality audio.

The application should support configurable resolution and frame rate where the rendering engine permits.

**Additional specification to confirm:** The original request mentions “180 PM.” This value must be clarified before treating it as a required resolution, frame rate, or other export setting.

### 4.2 Participant Configuration

The application must support two participants by default.

**Person A**
- Display name: Divyansh.
- Uploadable profile picture.
- Uploadable prerecorded audio.
- Configurable speaking indicator.

**Person B**
- Display name: Abhay.
- Uploadable profile picture.
- Uploadable prerecorded audio.
- Configurable speaking indicator.

Users must be able to change both names and profile pictures.

Supported profile image formats should include PNG, JPG, and WebP.

### 4.3 Audio Upload and Management

Users must be able to upload:

- Person A's audio.
- Person B's audio.
- Outgoing call ringtone.
- Incoming call ringtone, if required.
- Call-connected sound.
- Call-ended sound.

Support common audio formats such as MP3, WAV, and M4A where decoding is available.

Each audio asset must have a preview-playback control.

The application must preserve the original audio timing, including silence and pauses. Users must not need to split the conversation manually into individual sentences.

### 4.4 Audio Timeline and Synchronization

The application must combine all uploaded assets into one synchronized timeline.

Requirements:

- Preserve each participant's original audio timing.
- Support silence and gaps without shifting later audio.
- Allow call effects to be positioned before, during, or after the conversation.
- Support separate volume controls for each participant and each sound effect.
- Allow audio offset adjustments when tracks need synchronization.
- Avoid clipping and unexpected audio overlap.
- Keep the rendered audio synchronized with the video throughout the project.

The final mix must preserve the original conversation sequence.

### 4.5 Discord-Style Call Interface

The video scene should include:

- A Discord-inspired dark interface.
- Participant profile pictures.
- Participant display names.
- A voice-call layout.
- Call initiation and connection states.
- Call termination state.
- Green speaking indicators.
- Optional subtle animations and transitions.

The design should resemble the intended voice-call experience without requiring the actual Discord application to run.

The interface must not include a video-call layout by default.

### 4.6 Automatic Speaking Indicator

The application must detect speaking activity separately for Person A and Person B.

When Person A's audio contains active speech, a green circular outline or glow must appear around Person A's profile picture.

When Person A stops speaking, the indicator must disappear after a configurable release delay.

The same behavior must apply independently to Person B.

**Implementation requirements:**

- Analyze each participant's audio independently.
- Use audio amplitude or short-time RMS analysis with configurable thresholds.
- Use attack and release smoothing to avoid flickering.
- Allow sensitivity adjustment.
- Allow a minimum speaking duration to prevent brief clicks from triggering the indicator.
- Optionally allow manual speaking segments as a fallback.

The system must use the assigned audio track to determine which participant is speaking. It must not attempt to infer the speaker from a mixed audio track when separate tracks are available.

### 4.7 Call Sequence

The initial version must support this sequence:

1. Start the scene.
2. Play the configured outgoing-call sound.
3. Display the calling or ringing state.
4. Play the configured call-connected or answer sound.
5. Transition to the connected voice-call interface.
6. Play both participant tracks according to their original timing.
7. Animate the green speaking indicator for the active participant.
8. Preserve all pauses in the conversation.
9. Play the call-ended sound.
10. Transition to the disconnected state.
11. Finish the video.

Users must be able to configure the duration of the ringing state and the placement of call effects.

The application must not automatically modify the conversation's original timing unless the user explicitly requests it.

### 4.8 Preview

Before rendering, users must be able to preview the entire scene.

The preview should include:

- Participant profile pictures.
- Speaking indicators.
- Call-state transitions.
- Audio playback.
- Timeline progress.
- Play, pause, and seek controls.

Preview performance may be lower than final rendering quality, especially on low-specification computers.

### 4.9 Start Rendering

The interface must provide a clearly visible **Start Rendering** button.

When clicked, the application must:

1. Validate the project configuration.
2. Check uploaded assets and supported formats.
3. Prepare the synchronized audio timeline.
4. Generate the video frames.
5. Animate participant speaking indicators.
6. Mix the audio tracks and sound effects.
7. Encode the final video.
8. Make the finished file available for export.

Rendering must happen from the configured timeline and uploaded assets. It must not depend on screen recording or a live Discord call.

The interface must show rendering progress, errors, and completion status.

Users must be able to cancel a render that is in progress.

### 4.10 Export

Required output:

- MP4 container.
- H.264 video encoding.
- AAC audio encoding.
- 1920 × 1080 resolution.
- 60 FPS.
- High-quality audio mix.
- Correct audio/video synchronization.

The application should provide configurable bitrate or quality settings.

A lossless intermediate or higher-quality master export may be offered as an optional advanced feature.

The final output must be downloadable or savable locally.

The application must clearly communicate that rendering time depends on the machine's CPU, RAM, available storage, and video complexity.

## 5. User Interface Requirements

### Main Dashboard

Provide a simple dashboard with:

- Create Project.
- Open Project.
- Recent Projects.
- Export Settings.

### Project Editor

Organize the editor into these sections:

1. **Participants** — names and profile pictures.
2. **Audio Assets** — upload and preview audio.
3. **Timeline** — synchronize audio and call effects.
4. **Call Appearance** — visual layout and speaking indicators.
5. **Preview** — playback of the complete scene.
6. **Rendering** — output settings and progress.

The main action must be easy to find.

**Primary action:** Start Rendering.

The interface should use a clean dark theme, readable typography, clear controls, and minimal unnecessary animation.

## 6. Technical Architecture

The initial implementation should evaluate the following technologies:

- **Frontend:** React with TypeScript.
- **Styling:** CSS or Tailwind CSS.
- **Video composition:** Remotion or a custom frame-rendering implementation.
- **Media processing:** FFmpeg.
- **Audio analysis:** Web Audio API for preview analysis, with deterministic offline analysis during final rendering.
- **Project storage:** Local project files and JSON-based configuration.
- **Rendering:** Local rendering process for predictable output and no mandatory cloud-rendering fees.

The final technology choices must be validated against current library requirements and licensing.

A browser-only implementation may be possible, but it can be memory-intensive. The architecture should favor a local rendering worker or desktop wrapper if that is necessary for reliable high-quality exports on Windows.

No paid rendering API should be required for the core workflow.

## 7. Suggested Project Structure

```text
callframe/
├── src/
│   ├── components/
│   │   ├── ParticipantEditor
│   │   ├── AudioUploader
│   │   ├── TimelineEditor
│   │   ├── CallPreview
│   │   └── RenderPanel
│   ├── audio/
│   │   ├── audioAnalysis
│   │   ├── audioMixing
│   │   └── synchronization
│   ├── video/
│   │   ├── callScene
│   │   ├── speakingIndicator
│   │   └── callTransitions
│   ├── rendering/
│   │   ├── renderJob
│   │   └── exportSettings
│   └── project/
│       ├── projectSchema
│       └── projectValidation
├── assets/
├── tests/
├── docs/
├── README.md
├── LICENSE
└── package.json
```

This is a proposed logical structure; the implementation may adjust filenames and folders as needed.

## 8. Non-Functional Requirements

### Performance

- Rendering must not require real-time playback.
- The application must process uploaded assets without needing a live Discord session.
- The interface should remain responsive during rendering.
- The renderer should support cancellation and useful error reporting.
- The application should avoid unnecessarily loading full-resolution media into memory.

### Reliability

- Missing or invalid files must produce understandable errors.
- Audio tracks must remain synchronized.
- Repeated renders with unchanged inputs should produce the same visual timing.
- The project must not silently discard pauses or shift audio tracks.
- Interrupted rendering must not leave a misleadingly complete output file.

### Privacy

- Audio and profile pictures should remain local by default.
- No audio should be uploaded to a third-party server without explicit user consent.
- Temporary rendering files should be cleaned up safely.
- No analytics or telemetry should be required for the core workflow.

### Accessibility and Usability

- Clear labels and tooltips.
- Simple upload workflow.
- Keyboard-accessible primary controls.
- Useful progress and error messages.
- Beginner-friendly documentation.

## 9. MVP Scope

The first release must include:

- Two configurable participants.
- Two independent audio tracks.
- Profile-picture uploads.
- Call-effect audio uploads.
- Automatic speaking indicators.
- A Discord-inspired voice-call scene.
- Audio synchronization.
- Full-scene preview.
- Start Rendering button.
- MP4 export at 1080p and 60 FPS.
- Local processing.
- Basic project save/load.
- Open-source documentation.

## 10. Features Deferred Until Later

The following are not required for the MVP:

- Three or more participants.
- Cloud rendering.
- AI voice cloning.
- Automatic transcription and subtitles.
- Automatic speaker separation from a mixed recording.
- Advanced timeline editing with unlimited tracks.
- Built-in sound-effect library.
- Multi-user collaboration.
- Direct publishing to social platforms.

## 11. Acceptance Criteria

The MVP is considered complete when:

1. A user can upload two participant audio tracks.
2. A user can upload two profile pictures.
3. A user can upload and position call sound effects.
4. Original pauses and audio timing are preserved.
5. The correct participant receives the green speaking indicator.
6. The indicator follows speaking activity without excessive flickering.
7. The call begins and ends according to the configured sequence.
8. The user can preview the completed scene.
9. The user can render without recording a live call.
10. A valid MP4 file is generated at the selected output settings.
11. The exported audio and video remain synchronized.
12. The core application works without a paid service or mandatory cloud account.

## 12. Open-Source Release Requirements

The repository should include:

- README with installation and usage instructions.
- MIT license, subject to dependency-license review.
- Development setup instructions.
- Environment and dependency requirements.
- Sample project using original or properly licensed assets.
- Troubleshooting guide.
- Contribution guidelines.
- Issue templates.
- Build and test instructions.

The application must use original branding and avoid distributing Discord's proprietary assets without appropriate permission. Users may supply their own profile pictures and sound effects.

## 13. Definition of Done

CallFrame v1.0 is complete when a user can open the application, upload both participant audio tracks, configure profile pictures and call effects, preview the scene, click **Start Rendering**, and export a synchronized Discord-inspired voice-call video without recording a live call.

**Primary product principle:** Upload the assets, configure the participants, preview the call, and render the finished video locally.

**Primary deliverable:** A functional, free, open-source application—not just a visual mockup or static interface.