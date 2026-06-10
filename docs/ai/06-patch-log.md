# AI Patch Log

Chronological track of code modifications, refactors, and milestones.

## [2026-06-10] Phase B Completed: Session Recovery

- **Summary:** Implemented localStorage session recovery for the writing surface to prevent users from losing their drafts on page reloads.
- **Details:**
  - Introduced `STORAGE_KEY = 'foi_session_draft_v1'` to version saved drafts.
  - Implemented synchronous local draft parsing on hook initialization in `useWritingSession.ts`.
  - Added a relative baseline timeline offset calculation using `performance.now() - lastEventT` to ensure timing continuity when resuming, eliminating negative timing gaps or layout breaks.
  - Implemented a 1-second debounced auto-save effect triggered by event changes.
  - Implemented immediate auto-saving on component unmount to catch any final keystrokes.
  - Exposed `clearSavedSession` from the hook, calling it inside `doFinish` on `WritingSurface.tsx` and in `handleWriteAnother` on `PreviewScreen.tsx` to cleanly clear drafts.
  - Created a robust unit test suite (`useWritingSession.test.ts`) covering initialization, debounced auto-saving, draft restoration, and session clearing.
- **Verification:**
  - Typescript check: Passed (`npm run typecheck`)
  - Test suite: Passed (36/36 tests, adding 4 new unit tests for hook behavior)
  - Vite production build: Passed (`npm run build`)
- **Milestone Tag:** `feature-session-recovery-v1`
- **Commit hash:** `9d3f555`

## [2026-06-10] Phase A Completed: Sync Landing Demo

- **Summary:** Refactored the Landing Page autoplay demo to consume `useReplayController` instead of maintaining its own duplicate timer loop and state hooks.
- **Details:**
  - Added support for `autoplayDelay` (defaults to `1000ms`) and `customSpeedMultiplier` inside `useReplayController`.
  - Refactored `LandingPage.tsx` to destructure all demo playback variables (`bursts`, `ghosts`, `isPlaying`, etc.) from the hook, keeping its presentation layout unchanged.
  - Re-introduced document title updates on page mount using React `useEffect`.
  - Removed duplicated event loop methods (`processNextEvent`), local state variables, and timer refs.
- **Verification:**
  - Typescript check: Passed (`npm run typecheck`)
  - Test suite: Passed (32/32 tests)
  - Vite production build: Passed (`npm run build`)
- **Milestone Tag:** `refactor-landing-demo-v1`
- **Commit hash:** `6787529`
