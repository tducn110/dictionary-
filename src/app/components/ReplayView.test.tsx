// @vitest-environment jsdom
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReplayView } from './ReplayView';
import type { Session } from '../lib/types';
import { encodeSession } from '../lib/shareUtils';

const testSession: Session = {
  startedAt: 1718000000000,
  events: [
    { t: 100, type: 'insert', char: 'H', pos: 0, iki: 100, burst: 1, pause: 0, confidence: 0.9, hesitation: 0.1 },
    { t: 300, type: 'insert', char: 'i', pos: 1, iki: 200, burst: 1, pause: 0, confidence: 0.8, hesitation: 0.2 },
    { t: 600, type: 'delete', pos: 1, iki: 300, burst: 1, pause: 0, confidence: 0.7, hesitation: 0.3 }, // deletes 'i'
    { t: 1000, type: 'insert', char: 'y', pos: 1, iki: 400, burst: 1, pause: 0, confidence: 0.6, hesitation: 0.4 },
  ],
  finalText: 'Hy',
};

function renderReplay(initialPath = '/replay', state?: { session: Session }) {
  const [pathname, search] = initialPath.split('?');
  const router = createMemoryRouter(
    [
      {
        path: '/replay',
        Component: ReplayView,
      },
      {
        path: '/',
        Component: () => <div>Landing Page</div>,
      },
      {
        path: '/write',
        Component: () => <div>Writing Page</div>,
      },
    ],
    {
      initialEntries: [
        {
          pathname,
          search: search ? `?${search}` : '',
          state,
        },
      ],
    }
  );

  render(<RouterProvider router={router} />);
  return router;
}

describe('ReplayView Playback Smoke Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('renders intro state and does not start play immediately for normal sessions', () => {
    renderReplay('/replay', { session: testSession });

    // Should show the intro text and the Begin Replay button
    expect(screen.getByText(/watch the letter unfold/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Begin Replay/i })).toBeTruthy();

    // Verify timers haven't run and text is not rendered yet
    expect(screen.queryByText(/H/)).toBeNull();
  });

  it('starts replay when clicking Begin Replay, advancing timers renders characters', async () => {
    renderReplay('/replay', { session: testSession });

    const beginBtn = screen.getByRole('button', { name: /Begin Replay/i });
    fireEvent.click(beginBtn);

    // Flush React state updates
    await vi.advanceTimersByTimeAsync(0);

    // Event 0 (H) is processed synchronously in startReplay
    expect(screen.queryByText(/H/)).toBeTruthy();
    expect(screen.queryByText(/i/)).toBeNull();

    // Second event is at t: 300. Gap is 300 - 100 = 200ms.
    // 200ms / 2 (speedMultiplier) = 100ms fake time.
    await vi.advanceTimersByTimeAsync(100);
    expect(screen.queryByText(/H/)).toBeTruthy();
    expect(screen.queryByText(/i/)).toBeTruthy();
  });

  it('stops progression when paused and resumes when clicked play again', async () => {
    renderReplay('/replay', { session: testSession });

    const beginBtn = screen.getByRole('button', { name: /Begin Replay/i });
    fireEvent.click(beginBtn);
    await vi.advanceTimersByTimeAsync(0);

    // H should be rendered immediately
    expect(screen.queryByText(/H/)).toBeTruthy();
    expect(screen.queryByText(/i/)).toBeNull();

    // Pause the replay
    const pauseBtn = screen.getByRole('button', { name: /pause/i });
    fireEvent.click(pauseBtn);
    await vi.advanceTimersByTimeAsync(0);

    // Try to advance timers significantly, no new characters should appear because timer is cleared
    await vi.advanceTimersByTimeAsync(500);
    expect(screen.queryByText(/H/)).toBeTruthy();
    expect(screen.queryByText(/i/)).toBeNull();

    // Click play to resume
    const playBtn = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playBtn);
    await vi.advanceTimersByTimeAsync(0);

    // Now advance remaining time to let 'i' render (next gap is 200ms -> 100ms fake time)
    await vi.advanceTimersByTimeAsync(100);
    expect(screen.queryByText(/i/)).toBeTruthy();
  });

  it('completes the replay and shows completion messages', async () => {
    renderReplay('/replay', { session: testSession });

    const beginBtn = screen.getByRole('button', { name: /Begin Replay/i });
    fireEvent.click(beginBtn);
    await vi.advanceTimersByTimeAsync(0);

    // Run timers through all events (total duration 1000ms, at 2x speed it takes 500ms)
    await vi.advanceTimersByTimeAsync(500);

    // After completion, the screen should show the completion message.
    expect(screen.getByText(/a letter, as it was felt/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Write Your Own/i })).toBeTruthy();
  });

  it('auto-plays on shared link (?d=) after 1 second', async () => {
    const encoded = encodeSession(testSession);
    renderReplay(`/replay?d=${encoded}`);

    // Initially shows intro text, but has a 1-second auto-start timer scheduled
    expect(screen.getByText(/watch the letter unfold/i)).toBeTruthy();
    expect(screen.queryByText(/H/)).toBeNull();

    // Advance 1000ms to trigger autoplay start
    await vi.advanceTimersByTimeAsync(1000);

    // At this point autoplay starts (hasStarted = true, isPlaying = true).
    // The first event at t=100 is processed synchronously in autoStart callback.
    expect(screen.queryByText(/H/)).toBeTruthy();
  });

  it('falls back to sample session when URL contains invalid base64/JSON data', () => {
    // Render with bad data string
    renderReplay('/replay?d=this-is-not-valid-base64-or-json');

    // Should load anyway (falling back to sample session) without crashing
    expect(screen.getByText(/watch the letter unfold/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Begin Replay/i })).toBeTruthy();
  });
});
