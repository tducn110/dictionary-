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

3. **Transition Engine Layer (`src/app/lib/`):**
   - **`replayEngine.ts`**: Implements pure, deterministic logic for applying a single replay event (insert/delete) to a `BurstBuilderState`.

4. **Math Layer (`src/app/lib/`):**
   - **`replayMath.ts`**: Pure functions for duration calculation (`getSessionDuration`) and timeline lookup snapshots (`getReplayStateAtTime`).

## 🧪 Testing and Verification

- The test suite is fully decoupled from timing issues via fake timers (`vi.useFakeTimers`).
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

- **Phase B (Active):** Implement LocalStorage session recovery inside the writing workspace so user progress is saved across page reloads.
- **Phase C (Deferred):** Build interactive keyboard shortcuts (scrubbing, play/pause toggles) and average typing speed analysis charts.
