import { describe, expect, it } from 'vitest';
import type { Session, TypingEvent } from './types';
import {
  findEventIndexAtTime,
  getReplayStateAtTime,
  getSessionDuration,
} from './replayMath';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

/** Minimal insert event factory */
function ins(t: number, char: string, overrides?: Partial<TypingEvent>): TypingEvent {
  return {
    t,
    type: 'insert',
    char,
    pos: 0,
    iki: 100,
    burst: 5,
    pause: 0,
    confidence: 0.8,
    hesitation: 0.2,
    ...overrides,
  };
}

/** Minimal delete event factory */
function del(t: number, overrides?: Partial<TypingEvent>): TypingEvent {
  return {
    t,
    type: 'delete',
    pos: 0,
    iki: 80,
    burst: 3,
    pause: 0,
    confidence: 0.5,
    hesitation: 0.5,
    ...overrides,
  };
}

function makeSession(events: TypingEvent[]): Session {
  return { startedAt: 0, events, finalText: '' };
}

/* ------------------------------------------------------------------ */
/*  getSessionDuration                                                */
/* ------------------------------------------------------------------ */

describe('getSessionDuration', () => {
  it('returns 0 for an empty session', () => {
    expect(getSessionDuration(makeSession([]))).toBe(0);
  });

  it('returns the timestamp of the last event', () => {
    const session = makeSession([ins(0, 'a'), ins(500, 'b'), ins(1200, 'c')]);
    expect(getSessionDuration(session)).toBe(1200);
  });
});

/* ------------------------------------------------------------------ */
/*  findEventIndexAtTime                                              */
/* ------------------------------------------------------------------ */

describe('findEventIndexAtTime', () => {
  const events = [ins(0, 'a'), ins(100, 'b'), ins(300, 'c'), ins(500, 'd')];

  it('returns 0 when targetTime is before all events', () => {
    expect(findEventIndexAtTime(events, -1)).toBe(0);
  });

  it('returns count of events at or before targetTime', () => {
    expect(findEventIndexAtTime(events, 100)).toBe(2); // events at 0,100
    expect(findEventIndexAtTime(events, 299)).toBe(2);
    expect(findEventIndexAtTime(events, 300)).toBe(3);
  });

  it('returns all events when targetTime is at or past the last event', () => {
    expect(findEventIndexAtTime(events, 500)).toBe(4);
    expect(findEventIndexAtTime(events, 9999)).toBe(4);
  });
});

/* ------------------------------------------------------------------ */
/*  getReplayStateAtTime                                              */
/* ------------------------------------------------------------------ */

describe('getReplayStateAtTime', () => {
  it('returns empty bursts for an empty session', () => {
    const snap = getReplayStateAtTime(makeSession([]), 0);
    expect(snap.bursts).toEqual([]);
    expect(snap.eventIndex).toBe(0);
    expect(snap.progress).toBe(0);
    expect(snap.isComplete).toBe(true);
  });

  it('builds correct bursts at the halfway point', () => {
    const session = makeSession([
      ins(0, 'H'),
      ins(100, 'e'),
      ins(200, 'l'),
      ins(300, 'l'),
      ins(400, 'o'),
    ]);
    // At t=200 we should have consumed 3 events: H, e, l
    const snap = getReplayStateAtTime(session, 200);
    expect(snap.eventIndex).toBe(3);
    const allChars = snap.bursts.flatMap((b) => b.chars);
    expect(allChars).toEqual(['H', 'e', 'l']);
    expect(snap.isComplete).toBe(false);
    expect(snap.progress).toBeCloseTo(200 / 400, 5);
  });

  it('handles delete events correctly', () => {
    const session = makeSession([
      ins(0, 'a'),
      ins(100, 'b'),
      del(200),        // deletes 'b'
      ins(300, 'c'),
    ]);
    // At t=300 all events consumed
    const snap = getReplayStateAtTime(session, 300);
    const allChars = snap.bursts.flatMap((b) => b.chars);
    expect(allChars).toEqual(['a', 'c']);
    expect(snap.isComplete).toBe(true);
  });

  it('marks isComplete when all events are consumed', () => {
    const session = makeSession([ins(0, 'x'), ins(50, 'y')]);
    const snap = getReplayStateAtTime(session, 9999);
    expect(snap.isComplete).toBe(true);
    expect(snap.eventIndex).toBe(2);
    expect(snap.progress).toBeCloseTo(9999 / 50, 5);
  });

  it('returns progress 0 at the start', () => {
    const session = makeSession([ins(100, 'a')]);
    const snap = getReplayStateAtTime(session, 0);
    expect(snap.progress).toBe(0);
    expect(snap.eventIndex).toBe(0);
  });
});
