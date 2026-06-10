import { createBrowserRouter } from 'react-router';
import { LandingPage } from './components/LandingPage';
import { WritingSurface } from './components/WritingSurface';
import { PreviewScreen } from './components/PreviewScreen';
import { ReplayView } from './components/ReplayView';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: LandingPage,
  },
  {
    path: '/write',
    Component: WritingSurface,
  },
  {
    path: '/preview',
    Component: PreviewScreen,
  },
  {
    path: '/replay',
    Component: ReplayView,
  },
]);
