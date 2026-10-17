# AI Development Loop — CallFrame

**Created by Divyansh — DVF Studio**

Use this workflow when developing CallFrame with an AI coding agent.

## 1. Inspect before changing
- Read `README.md`, `PRD.md`, `design.md`, `architecture.md`, `rules.md`, and `memory.md`.
- Inspect the current repository structure, scripts, dependencies, and tests.
- Identify what is implemented versus merely planned.
- Do not assume the existing code matches the documentation.

## 2. Select one small task
Examples:
- Add participant avatar upload.
- Implement project JSON save/load.
- Analyze one audio track for speaking intervals.
- Render the call-state indicator at a timestamp.
- Validate an exported MP4.

Avoid asking the agent to build the entire application in one unreviewed change.

## 3. Plan the change
Ask the agent to state:
- Files it will inspect or modify.
- Expected behavior.
- Edge cases.
- Tests to add or run.
- Any dependency or licensing implications.

## 4. Implement
- Follow `rules.md`.
- Reuse existing architecture and patterns.
- Keep unrelated files unchanged.
- Do not introduce paid APIs or remote uploads without explicit approval.
- Keep sample assets original or properly licensed.

## 5. Verify
Run the repository's actual install, lint, type-check, test, and build commands when available. Do not invent commands that are absent from `package.json` or project docs.

For media work, verify:
- Output file exists and is playable.
- Duration matches the planned timeline.
- Video dimensions and frame rate match selected settings.
- Audio streams are present and synchronized.
- Speaking rings follow the correct participant track.
- Cancellation and failures do not leave a corrupt final file.

## 6. Report honestly
Summarize:
- What changed.
- Files changed.
- Commands and tests run.
- Results and any failures.
- Remaining limitations.

Never claim tests passed if they were not run. Never claim a planned feature is implemented based only on a mockup.

## 7. Keep documentation synchronized
After a change to product behavior, update the relevant docs and `memory.md`. Keep `phases.md` aligned with completed work, but mark a phase complete only when its exit criteria are verified.
