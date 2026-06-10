// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWritingSession, STORAGE_KEY } from './useWritingSession';

describe('useWritingSession - LocalStorage Session Recovery', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  it('initializes with empty state when no saved session exists', () => {
    const { result } = renderHook(() => useWritingSession(undefined));
    expect(result.current.bursts).toEqual([]);
  });

  it('saves typing events to localStorage after typing stops (debounce)', () => {
    const { result } = renderHook(() => useWritingSession(undefined));

    act(() => {
      result.current.startSession();
      result.current.insertChar('H');
      result.current.insertChar('e');
    });

    // Right after typing, it shouldn't be in localStorage yet due to debounce
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

    // Advance timers by 1 second to trigger debounced auto-save
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const saved = localStorage.getItem(STORAGE_KEY);
    expect(saved).not.toBeNull();

    const parsed = JSON.parse(saved!);
    expect(parsed.textBuffer).toEqual(['H', 'e']);
    expect(parsed.events.length).toBe(2);
  });

  it('restores draft from localStorage on reload', () => {
    const mockState = {
      bursts: [],
      burstBuilderState: { bursts: [], currentBurst: null },
      events: [
        { t: 100, type: 'insert', char: 'A', pos: 0, iki: 100, burst: 1, pause: 0, confidence: 1, hesitation: 0 }
      ],
      textBuffer: ['A'],
      signalState: { recentIKIs: [100], lastKeystrokeTime: 0 },
      sessionStart: 5000,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockState));

    const { result } = renderHook(() => useWritingSession(undefined));

    // Check if the restored events match
    act(() => {
      const { session } = result.current.createPreviewState();
      expect(session.finalText).toBe('A');
      expect(session.events.length).toBe(1);
    });
  });

  it('clears the saved session when clearSavedSession is called', () => {
    const { result } = renderHook(() => useWritingSession(undefined));

    act(() => {
      result.current.startSession();
      result.current.insertChar('X');
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();

    act(() => {
      result.current.clearSavedSession();
    });

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
