/**
 * Pure math helpers for replay scrubbing/seeking.
 *
 * These compute the document state at any point in a session's timeline
 * without touching React state, timers, or animations.
 */
import type { Burst, Session, TypingEvent } from './types';
import {
  addCharToBursts,
  createBurstBuilderState,
  getAllBursts,
  removeLastCharFromBursts,
} from './burstDetector';

/**
 * The reconstructed document state at a given point in time.
 * Does not include UI-only concerns (ghosts, cursor, animation).
 */
export interface ReplaySnapshot {
  /** The burst-grouped text at this point */
  bursts: Burst[];
  /** Index of the next event to process (i.e. how many events are consumed) */
  eventIndex: number;
  /** Progress as a 0–1 fraction of total duration */
  progress: number;
  /** Whether all events have been consumed */
  isComplete: boolean;
}

/**
 * Total time span of a session in ms (last event timestamp).
 * Returns 0 for empty sessions.
 */
export function getSessionDuration(session: Session): number {
  if (session.events.length === 0) return 0;
  return session.events[session.events.length - 1].t;
}

/**
 * Find the event index such that all events with t <= targetTimeMs
 * are included. Returns the count of events consumed (0-based exclusive).
 */
export function findEventIndexAtTime(
  events: TypingEvent[],
  targetTimeMs: number
): number {
  let idx = 0;
  for (let i = 0; i < events.length; i++) {
    if (events[i].t <= targetTimeMs) idx = i + 1;
    else break;
  }
  return idx;
}

/**
 * Reconstruct the full document state (bursts) by replaying events
 * from the start up to targetTimeMs.
 *
 * This is the pure extraction of the for-loop previously inside
 * ReplayView's `scrubTo` callback.
 */
export function getReplayStateAtTime(
  session: Session,
  targetTimeMs: number
): ReplaySnapshot {
  const totalDuration = getSessionDuration(session);
  const eventIndex = findEventIndexAtTime(session.events, targetTimeMs);

  const builder = createBurstBuilderState();
  for (let i = 0; i < eventIndex; i++) {
    const ev = session.events[i];
    if (ev.type === 'insert' && ev.char) {
      addCharToBursts(
        builder,
        ev.char,
        ev.iki,
        ev.confidence,
        ev.hesitation,
        ev.pause
      );
    } else if (ev.type === 'delete') {
      removeLastCharFromBursts(builder);
    }
  }

  return {
    bursts: getAllBursts(builder),
    eventIndex,
    progress: totalDuration > 0 ? targetTimeMs / totalDuration : 0,
    isComplete: eventIndex >= session.events.length,
  };
}
