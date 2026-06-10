# Font of Intent (FOI)

A reflective, minimal writing space that encodes the user's emotions into the visual weight of the typography, capturing pauses, bursts of confidence, and hesitations.

Original Figma design available at [Figma Community Design](https://www.figma.com/design/1mqgjCY9c2UlNfmF55RibG/font-of-intent--Community-).

---

## 🛠️ The Refactoring Case Study

This repository was originally exported as a chaotic, monolithic draft directly from a design tool (Figma Make). It has been refactored into a clean, testable, and highly maintainable React application.

### Original Problems (Figma-Make Export)
* **Scaffold Bloat:** Heavy mock components, static markup placeholders, and unused dependencies.
* **Monolithic View:** The replay mechanic (`ReplayView`) was a single ~600 line file containing layout, timer loops, scrub mathematics, base64 URL decoding, and ghost trace state management.
* **Lack of Safety:** No tests and zero validation, making it extremely fragile to modify.

### Refactored Architecture
The codebase has been decoupled into distinct, single-responsibility layers:
1. **Presentation Layer (`ReplayView.tsx`):** Purely declarative layout that consumes the controller hook and renders standard HTML markup.
2. **Controller Hook (`useReplayController.ts`):** Coordinates play/pause playback loop timers, states, base64 URL auto-play triggers, and cleanup effects.
3. **Engine Layer (`replayEngine.ts`):** Deterministic helper that applies insert/delete events to state buffers and identifies deleted characters for visual ghost animations.
4. **Scrub Math (`replayMath.ts`):** Pure functions to compute document text states and progress bar offsets at any arbitrary timestamp.
5. **Content Layer (`replayViewContent.ts` / `writingSurfaceContent.ts`):** Static copywriting separated out into translation constants.

---

## 🧪 Safety & Testing
We implemented a strict multi-layer testing harness to prevent timing and logical regression:
- **Unit Tests:** Direct math validations for timeline snapshotting in `replayMath.test.ts` and event mutations in `replayEngine.test.ts`.
- **Smoke Tests:** Playback flow smoke tests inside `ReplayView.test.tsx` using **Vitest Fake Timers** (`vi.useFakeTimers()`) to verify play/pause, scrub progression, autoplay, and URL decoding fallbacks.

All tests, typechecks (`tsc --noEmit`), production builds, and dependency vulnerability audits pass cleanly.

---

## 🚀 Running the Code

### Installation
```bash
npm i
```

### Development Server
```bash
npm run dev
```

### Typecheck & Test Suite
```bash
npm run typecheck
npm test
```

### Production Build
```bash
npm run build
```

---

## 🌐 Deploy to Vercel

The clean refactored master branch is ready for deployment:
1. Push your changes to your GitHub fork/repository (`tducn110/dictionary-`).
2. Log into [Vercel](https://vercel.com).
3. Import this project from your GitHub dashboard.
4. Vercel will auto-detect Vite and deploy it instantly.