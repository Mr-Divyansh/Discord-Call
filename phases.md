# Development Phases — CallFrame

**Created by Divyansh — DVF Studio**

Build incrementally. Each phase should produce a working, testable result before moving forward.

## Phase 0 — Repository foundation
- Create repository and license file.
- Add README, PRD, design, architecture, rules, and this plan.
- Select and pin the initial technology stack.
- Define project JSON schema and sample assets.
- Add formatting, linting, and basic tests.

**Exit criteria:** The project installs and starts; documentation matches the actual setup.

## Phase 1 — Project editor shell
- Build dashboard and editor layout.
- Add participant name and avatar configuration.
- Add project create/save/open.
- Implement project validation and empty/error states.

**Exit criteria:** A project can be configured and reopened without losing settings.

## Phase 2 — Audio assets and timeline
- Upload and preview participant tracks.
- Upload call effects.
- Show track durations and timeline offsets.
- Preserve silence and track timing.
- Add volume controls and basic synchronization tests.

**Exit criteria:** A sample timeline plays with the expected order and timing.

## Phase 3 — Call scene and speaking indicator
- Render two avatars and names.
- Implement ringing, connected, and ended states.
- Analyze each participant track independently.
- Add smoothed green speaking rings.
- Add preview seek/play/pause controls.

**Exit criteria:** A known test clip triggers the correct avatar indicator at expected timestamps.

## Phase 4 — Render pipeline
- Implement deterministic frame composition.
- Mix audio and effects.
- Encode MP4 using FFmpeg.
- Show progress and allow cancellation.
- Validate output duration, dimensions, FPS, and streams.

**Exit criteria:** A test project produces a valid, synchronized MP4 without live recording.

## Phase 5 — Quality and low-spec optimization
- Test long audio and silence-heavy tracks.
- Reduce peak memory usage.
- Improve error messages and temporary-file cleanup.
- Test different output settings on Windows.
- Document expected performance and limitations.

**Exit criteria:** Failed jobs do not corrupt projects or leave misleading final files.

## Phase 6 — Open-source release
- Review third-party licenses and add final LICENSE.
- Add installation, usage, and troubleshooting docs.
- Add sample project with permitted assets.
- Add issue and contribution templates.
- Verify a clean install from the documented steps.

**Exit criteria:** A new contributor can install and run the app using the README.
