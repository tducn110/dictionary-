# Refactor Cleanup Audit

Date: 2026-06-10

This report is intentionally report-only. Do not delete scaffold files or remove
dependencies from this patch.

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

Do not delete these in a refactor patch. If cleanup is desired, use a separate
branch after a fresh `typecheck`, `test`, and `build` pass.

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

`npm audit` currently reports two high severity items:

- `react-router@7.13.0`; audit suggests `react-router@7.17.0`.
- `vite@6.3.5`; audit suggests `vite@6.4.3`.

Do this as a separate security patch. Do not use `npm audit fix --force`
without reading the resulting diff.

## Recommended Cleanup Order

1. Security patch: manually bump `react-router` and `vite`, then run
   `npm run typecheck`, `npm test`, `npm run build`, and `npm audit`.
2. Scaffold quarantine patch: move or delete scaffold only after explicit
   approval, with `components/ui` handled as one cleanup unit.
3. Dependency cleanup patch: remove dependencies only after scaffold cleanup and
   a fresh import scan prove they are unused.

Rollback should be one commit at a time. Avoid combining security, scaffold
deletion, and dependency removal in one commit.
