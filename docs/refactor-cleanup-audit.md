# Refactor Cleanup Audit

Date: 2026-06-10

This report started as a report-only cleanup audit. Follow-up cleanup patches
then removed scaffold files, pruned scaffold dependencies, and resolved audited
dependency vulnerabilities after validation passed.

## Runtime Entry

Runtime flow:

```txt
index.html
-> src/main.tsx
-> src/app/App.tsx
-> src/app/routes.ts
-> /, /write, /preview, /replay
```

Current runtime files are under `src/app`:

- `src/app/App.tsx`
- `src/app/routes.ts`
- `src/app/components/BurstRenderer.tsx`
- `src/app/components/LandingPage.tsx`
- `src/app/components/PreviewScreen.tsx`
- `src/app/components/ReplayView.tsx`
- `src/app/components/WritingSurface.tsx`
- `src/app/content/*`
- `src/app/hooks/*`
- `src/app/lib/*`

## Scaffold Candidates

Triage classifies these as non-runtime/scaffold candidates:

- `src/app/components/ui/*`
- `src/app/components/figma/ImageWithFallback.tsx`
- `src/imports/*`

These were removed in the scaffold cleanup patch after a fresh import scan and
validation pass.

## Dependency Usage

Runtime imports currently require:

- `react-router`
- `sonner`
- React/Vite/Tailwind build dependencies
- Testing dependencies for Vitest/jsdom smoke tests

Scaffold-only dependencies are mainly attached to `src/app/components/ui/*`:

- `@radix-ui/*`
- `class-variance-authority`
- `clsx`
- `cmdk`
- `embla-carousel-react`
- `input-otp`
- `lucide-react`
- `next-themes`
- `react-day-picker`
- `react-hook-form`
- `react-resizable-panels`
- `recharts`
- `tailwind-merge`
- `vaul`

Dependencies with no import hits from triage:

- `@emotion/react`
- `@emotion/styled`
- `@mui/icons-material`
- `@mui/material`
- `@popperjs/core`
- `date-fns`
- `motion`
- `react-dnd`
- `react-dnd-html5-backend`
- `react-popper`
- `react-responsive-masonry`
- `react-slick`
- `tw-animate-css`

## Security Audit

`npm audit` previously reported two high severity items:

- `react-router@7.13.0`; resolved by bumping to `react-router@7.17.0`.
- `vite@6.3.5`; resolved by bumping to `vite@6.4.3`.

The security patch was done separately without `npm audit fix --force`.

## Recommended Cleanup Order

1. Keep pure logic and smoke tests passing before future refactors.
2. Keep dependency cleanup separate from feature work.
3. If a deleted scaffold component is needed later, restore the relevant file
   from the scaffold cleanup commit instead of re-adding the whole scaffold.

Rollback should be one commit at a time. Avoid combining security, scaffold
deletion, and dependency removal in one commit.
