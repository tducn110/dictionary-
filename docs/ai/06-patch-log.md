# AI Patch Log

Chronological track of code modifications, refactors, and milestones.

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
