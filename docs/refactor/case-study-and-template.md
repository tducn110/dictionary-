# Refactoring Case Study & Reusable Template
*From Figma-generated messy code to a clean, production-ready React app.*

---

## 1. Case Study: Font of Intent (FOI)

### Context & Problem
The initial codebase was exported directly from a UI prototype tool (Figma Make). While it had functional components, it suffered from:
- **Scaffold Baggage:** Unused UI components, non-runtime assets, and excessive mock markup.
- **Monolithic Components:** `ReplayView` was a 600-line "God Component" combining layout rendering, state, refs, timers, play/pause controller logic, scrub mathematics, and URL decoding.
- **Untestable Code:** Zero tests, hardcoded copy, and tight coupling of concerns.
- **Dependencies bloat:** Unused dependencies and potential audit vulnerabilities.

### Our Approach
Instead of rewriting from scratch (which is highly error-prone), we applied a structured refactoring pipeline:
1. **Triage:** Map out the runtime graph (routes, main entry points, active files).
2. **Prune Scaffold:** Remove unused mock UI components and clean up npm dependencies.
3. **Extract Content:** Pull out hardcoded user-facing texts and labels into a clean translation/content layer.
4. **Isolate Math Helpers:** Move pure mathematical calculations (`replayMath.ts` - duration and time snapshots) out of React components.
5. **Establish Safety Nets:** Write comprehensive unit tests for calculations, followed by fake-timer React Testing Library smoke tests for timing-dependent events (play, pause, complete, autoplay, fallback).
6. **Extract Engine Logic:** Move event state transitions (`replayEngine.ts` - insertions, deletions, ghost traces) into a deterministic helper module.
7. **Extract Stateful Controller:** Wrap timer refs, state variables, and callbacks into a single cohesive hook (`useReplayController.ts`).
8. **Final Presentation Layer:** Clean up the main view (`ReplayView.tsx`) to focus entirely on layout, JSX rendering, and styles.

### Final Results
- **Strict Separation of Concerns:**
  - **Component (`ReplayView.tsx`):** Pure presentation. Reduced by 42% (from 603 to 347 lines).
  - **Controller Hook (`useReplayController.ts`):** State, timer loops, and play/pause controls.
  - **Engine Helper (`replayEngine.ts`):** Deterministic event transition processor.
  - **Math Helper (`replayMath.ts`):** Pure session duration & snapshot math.
- **Safety & Verification:** Added 32 passing unit and smoke tests. Typecheck, production builds, and audits pass cleanly.

---

## 2. Reusable Figma-Make Refactor Template

Use this checklist whenever you import or take over a prototype export project to systematically clean it up.

### Phase 1: Audit & Clean
- [ ] **Run Triage:** Map the entry routes and list which files are actually imported.
- [ ] **Isolate Content:** Move UI copywriting, strings, and configuration objects into a dedicated `content/` folder.
- [ ] **Prune Scaffold:** Safely delete any unused files (mock buttons, placeholders, unused Radix/Radix-ui icons/packages).
- [ ] **Prune Dependencies:** Run `npm prune` and clean up `package.json`. Fix audit alerts via `npm audit fix`.

### Phase 2: Core Isolation & Testing
- [ ] **Extract Pure Math:** Locate complex computations (timing calculation, coordinates, pagination calculations) and put them in a pure `lib/math.ts` helper.
- [ ] **Write Unit Tests:** Verify all boundary cases for your extracted math functions.
- [ ] **Write Component Smoke Tests:** Use `@testing-library/react` and `vi.useFakeTimers()` to write timing/interaction smoke tests BEFORE you touch stateful logic.

### Phase 3: Stateful Controller Decoupling
- [ ] **Extract Stateful Transition Helper:** Isolate how events or user triggers mutate state (e.g. `engine.ts` applying transitions).
- [ ] **Create Controller Hook:** Define a custom hook (`useXController.ts`) that manages states, refs, timers, and side effects.
- [ ] **Declarative UI Component:** Replace local states inside the component with calls to your controller hook.
- [ ] **Run Safety Nets:** Assert that all your previously written unit and smoke tests still pass.

### Phase 4: Finalization
- [ ] **Verify Builds:** Run typescript checks (`tsc --noEmit`), test runner, production builds (`vite build`), and dependency audits.
- [ ] **Create Checkpoint:** Merge into master via `--no-ff` and tag the release milestone (`git tag refactor-v1`).
