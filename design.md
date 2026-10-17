# Design Specification — CallFrame

**Created by Divyansh — DVF Studio**

## Design direction

Build a focused, premium-feeling desktop-first editor that feels like a practical creator tool, not a generic AI dashboard. Use a dark neutral interface, clear typography, restrained borders, and green only for speaking activity and success states.

## Information architecture

1. **Dashboard** — create project, open project, recent projects.
2. **Project editor** — participants, audio assets, timeline, call appearance, preview.
3. **Render panel** — output settings, progress, cancel, export.
4. **Settings** — default export values and temporary-file preferences.

## Main editor layout

- **Top bar:** project name, save status, preview, render button.
- **Left panel:** Person A and Person B profile/name/audio configuration.
- **Center canvas:** Discord-inspired call preview.
- **Bottom timeline:** audio tracks and sound-effect placements.
- **Right panel:** selected asset settings, volume, offset, speaking-indicator sensitivity, and appearance controls.

Adapt panels for smaller screens. On narrow windows, use collapsible panels instead of forcing a tiny preview.

## Visual behavior

- Dark call background inspired by voice-chat interfaces.
- Two participant avatars and display names.
- Green circular outline/glow around the currently speaking participant.
- Smooth indicator attack/release animation to reduce flicker.
- Distinct ringing, connected, and ended states.
- Keep call layout visually stable while the active speaker changes.
- Do not show video tiles in the MVP.

## Controls

- Upload audio / upload avatar
- Preview asset
- Play / pause / seek
- Add call effect
- Save project
- Preview full scene
- Start Rendering
- Cancel render
- Export MP4

## Accessibility and feedback

- Every icon-only button needs an accessible label.
- Show progress and useful error messages.
- Use text or icons as well as color to indicate status.
- Warn before overwriting an existing export.
- Clearly distinguish preview quality from final export quality.

## Empty and error states

- No project: explain how to create one.
- Missing audio: identify the missing participant/asset.
- Unsupported format: state accepted formats.
- Render failed: preserve the project and show actionable details.
- Low disk space: stop before writing a corrupt final file.

## Branding and asset policy

Display “Created by Divyansh — DVF Studio” in documentation and an optional About panel. Use original or properly licensed interface assets. Do not present CallFrame as an official Discord product.
