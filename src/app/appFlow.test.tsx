// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { LandingPage } from './components/LandingPage';
import { PreviewScreen } from './components/PreviewScreen';
import { ReplayView } from './components/ReplayView';
import { WritingSurface } from './components/WritingSurface';

function renderApp(initialPath = '/write') {
  const router = createMemoryRouter(
    [
      { path: '/', Component: LandingPage },
      { path: '/write', Component: WritingSurface },
      { path: '/preview', Component: PreviewScreen },
      { path: '/replay', Component: ReplayView },
    ],
    { initialEntries: [initialPath] }
  );

  render(<RouterProvider router={router} />);
  return router;
}

function typeLetter(text: string) {
  const input = screen.getByLabelText('Type your letter here');
  for (const char of text) {
    fireEvent.keyDown(input, { key: char });
  }
  return input;
}

function finishLetter() {
  fireEvent.keyDown(screen.getByLabelText('Type your letter here'), {
    key: 'Enter',
    metaKey: true,
  });
}

describe('app flow smoke tests', () => {
  it('goes from writing to preview and replay', async () => {
    renderApp('/write');

    typeLetter('hello');
    finishLetter();

    expect(await screen.findByText('Your Letter')).toBeTruthy();
    expect(screen.getByText('Keep Writing')).toBeTruthy();

    fireEvent.click(screen.getByText('Watch Replay'));

    expect(await screen.findByText('Begin Replay', { exact: false })).toBeTruthy();
  });

  it('keeps writing from preview with the resume state', async () => {
    renderApp('/write');

    typeLetter('hello');
    finishLetter();

    fireEvent.click(await screen.findByText('Keep Writing'));

    expect(await screen.findByLabelText('Type your letter here')).toBeTruthy();
    expect(await screen.findByText('Finish Letter', { exact: false })).toBeTruthy();
  });
});
