# Project Memory — CallFrame

**Created by Divyansh — DVF Studio**

This file records stable product decisions so contributors and coding agents can continue work consistently.

## Product identity
- Name: CallFrame (working name).
- Creator credit: **Created by Divyansh — DVF Studio**.
- Product: Free, open-source Discord-inspired voice-call video generator.
- Primary use: Gaming and storytelling videos made from prerecorded conversations.

## Core concept
- Two participants by default: Person A and Person B.
- Each participant has a separate audio track, display name, and profile picture.
- Optional sound effects cover outgoing ringing, call connection/answer, and hang-up.
- Green ring/glow appears around the avatar whose assigned audio is active.
- Original audio gaps and pauses must be preserved.
- Render the scene from assets; do not require live Discord recording.

## Export target
- MP4 container.
- H.264 video and AAC audio are proposed.
- Target: 1920×1080 at 60 FPS.
- “180 PM” was mentioned but is ambiguous and must be clarified before implementation.

## UX priorities
- Beginner-friendly workflow.
- Dark, clean interface.
- Easy-to-find Start Rendering button.
- Full preview before final export.
- Useful progress and errors.
- Local rendering preferred, especially to avoid paid cloud services.

## Technical direction
React + TypeScript, FFmpeg, and Remotion or a custom renderer are candidates, not final decisions. Validate current compatibility and licensing before choosing.

## Explicit non-goals for MVP
- No live-call recording requirement.
- No video-call tiles by default.
- No required paid cloud service.
- No AI voice cloning.
- No automatic speaker separation from a single mixed recording when separate tracks are available.

## Update policy
When a decision changes, update this file and the relevant PRD/design/architecture document. Do not treat proposed features as implemented without tests.
