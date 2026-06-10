# AI Handoff Documentation

This document describes the architectural changes and current state of the codebase for subsequent development.

## 🏗️ Decoupled Architecture

The application has been restructured into four distinct layers:

1. **Presentation Layer (`src/app/components/`):**
   - **`ReplayView.tsx`**: Renders the playback page. Consumes `useReplayController` for state and interactions.
   - **`LandingPage.tsx`**: Renders the hero page. Uses `useReplayController` in read-only autoplay mode.
   - **`WritingSurface.tsx`**: Renders the typing editor where session keystrokes are recorded.

2. **Controller Hook Layer (`src/app/hooks/`):**
   - **`useReplayController.ts`**: Owns all replay states (`isPlaying`, `progress`, `speed`), handles active timer-based progressions, and manages scrubbing. Accepts `autoplayDelay` and `customSpeedMultiplier` for flexible use.
   - **`useWritingSession.ts`**: Coordinates all writing session states, handles signal capture, and manages localStorage session recovery (`foi_session_draft_v1`).

3. **Transition Engine Layer (`src/app/lib/`):**
   - **`replayEngine.ts`**: Implements pure, deterministic logic for applying a single replay event (insert/delete) to a `BurstBuilderState`.

4. **Math Layer (`src/app/lib/`):**
   - **`replayMath.ts`**: Pure functions for duration calculation (`getSessionDuration`) and timeline lookup snapshots (`getReplayStateAtTime`).

## 💾 Session Recovery Mechanics (Phase B)

- **Initialization:** On mount, `useWritingSession` checks React Router's location state first. If none is found, it queries `localStorage` for `foi_session_draft_v1`.
- **Timeline Alignment:** When a saved session is recovered, we compute the elapsed offset time relative to the last recorded keystroke (`performance.now() - lastEvent.t`) to avoid timing jumps or negative durations.
- **Auto-Saving:** Saved states are debounced by 1 second during typing, and saved instantly when the component unmounts.
- **Clearing:** Drafts are cleared when clicking "Finish Letter" or when starting a fresh session via "Write Another".

## 🧪 Testing and Verification

- Testing runs via fake timers to prevent real-time clock dependencies.
- Run the full suite with:
  ```bash
  npm test
  ```
- Run the typechecker with:
  ```bash
  npm run typecheck
  ```
- Build the production bundle with:
  ```bash
  npm run build
  ```

## 🚀 Future Roadmap

- **Phase C (Deferred):** Build interactive keyboard shortcuts (scrubbing, play/pause toggles) and average typing speed analysis charts.
