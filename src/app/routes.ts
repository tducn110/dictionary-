import { ComponentType, LazyExoticComponent, Suspense, createElement, lazy } from 'react';
import { createBrowserRouter } from 'react-router';

const LandingPage = lazy(() =>
  import('./components/LandingPage').then(({ LandingPage }) => ({ default: LandingPage }))
);
const WritingSurface = lazy(() =>
  import('./components/WritingSurface').then(({ WritingSurface }) => ({ default: WritingSurface }))
);
const PreviewScreen = lazy(() =>
  import('./components/PreviewScreen').then(({ PreviewScreen }) => ({ default: PreviewScreen }))
);
const ReplayView = lazy(() =>
  import('./components/ReplayView').then(({ ReplayView }) => ({ default: ReplayView }))
);

function lazyRoute(Component: LazyExoticComponent<ComponentType>) {
  return function LazyRoute() {
    return createElement(Suspense, { fallback: null }, createElement(Component));
  };
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: lazyRoute(LandingPage),
  },
  {
    path: '/write',
    Component: lazyRoute(WritingSurface),
  },
  {
    path: '/preview',
    Component: lazyRoute(PreviewScreen),
  },
  {
    path: '/replay',
    Component: lazyRoute(ReplayView),
  },
]);
