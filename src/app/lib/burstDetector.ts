/**
 * Burst detection: groups consecutive keystrokes into "typing bursts"
 * based on consistent inter-key intervals.
 *
 * A burst boundary occurs when:
 * 1. There's a pause (800ms+) — always starts a new burst
 * 2. The IKI changes significantly (>2× or <0.5× the current burst's avg)
 *    AND the current burst has at least 3 characters
 *
 * Each burst gets a single aggregated confidence/hesitation/pause value
 * so the whole group is styled uniformly. This eliminates the "ransom note"
 * effect of per-character variation.
 */
import type { Burst } from './types';

const PAUSE_THRESHOLD_MS = 800;
const SPEED_CHANGE_RATIO = 2.0; // IKI must change by 2× to break a burst
const MIN_BURST_SIZE_FOR_SPLIT = 3;

let burstIdCounter = 0;

export function resetBurstIdCounter() {
  burstIdCounter = 0;
}

export interface BurstBuilderState {
  /** All completed bursts */
  bursts: Burst[];
  /** The burst currently being typed into */
  currentBurst: Burst | null;
}

export function createBurstBuilderState(): BurstBuilderState {
  return {
    bursts: [],
    currentBurst: null,
  };
}

/**
 * Add a character to the burst builder. Returns the updated state
 * (mutates in place for performance, but returns for convenience).
 */
export function addCharToBursts(
  state: BurstBuilderState,
  char: string,
  iki: number,
  confidence: number,
  hesitation: number,
  pause: number
): BurstBuilderState {
  const isPause = pause > 0 || iki > PAUSE_THRESHOLD_MS;

  // Determine if we need a new burst
  let startNewBurst = false;

  if (!state.currentBurst) {
    startNewBurst = true;
  } else if (isPause) {
    // Pauses always break bursts
    startNewBurst = true;
  } else if (state.currentBurst.chars.length >= MIN_BURST_SIZE_FOR_SPLIT) {
    // Check for significant speed change
    const burstAvgIKI = average(state.currentBurst.ikis);
    if (burstAvgIKI > 0) {
      const ratio = iki / burstAvgIKI;
      if (ratio > SPEED_CHANGE_RATIO || ratio < 1 / SPEED_CHANGE_RATIO) {
        startNewBurst = true;
      }
    }
  }

  if (startNewBurst) {
    // Freeze current burst and start new one
    if (state.currentBurst && state.currentBurst.chars.length > 0) {
      state.bursts.push(state.currentBurst);
    }
    state.currentBurst = {
      id: `b-${burstIdCounter++}`,
      chars: [char],
      confidence,
      hesitation,
      pauseBefore: isPause ? Math.max(pause, iki) : 0,
      ikis: [iki],
    };
  } else {
    // Add to current burst and update running averages
    const burst = state.currentBurst!;
    burst.chars.push(char);
    burst.ikis.push(iki);
    // Running average of confidence and hesitation
    const n = burst.chars.length;
    burst.confidence = burst.confidence * ((n - 1) / n) + confidence / n;
    burst.hesitation = burst.hesitation * ((n - 1) / n) + hesitation / n;
  }

  return state;
}

/**
 * Remove the last character from the burst builder (for backspace).
 * Returns true if a character was removed, false if buffer is empty.
 */
export function removeLastCharFromBursts(state: BurstBuilderState): boolean {
  if (state.currentBurst && state.currentBurst.chars.length > 0) {
    state.currentBurst.chars.pop();
    state.currentBurst.ikis.pop();
    // If current burst is now empty, pop the last completed burst as current
    if (state.currentBurst.chars.length === 0) {
      if (state.bursts.length > 0) {
        state.currentBurst = state.bursts.pop()!;
      } else {
        state.currentBurst = null;
      }
    }
    return true;
  }
  if (state.bursts.length > 0) {
    state.currentBurst = state.bursts.pop()!;
    return removeLastCharFromBursts(state);
  }
  return false;
}

/**
 * Get all bursts including the current in-progress one.
 */
export function getAllBursts(state: BurstBuilderState): Burst[] {
  if (state.currentBurst && state.currentBurst.chars.length > 0) {
    return [...state.bursts, state.currentBurst];
  }
  return [...state.bursts];
}

/**
 * Get total character count across all bursts.
 */
export function getTotalCharCount(state: BurstBuilderState): number {
  let count = state.bursts.reduce((sum, b) => sum + b.chars.length, 0);
  if (state.currentBurst) count += state.currentBurst.chars.length;
  return count;
}

/**
 * Build bursts from a flat list of events (for replay/static rendering).
 * Processes insert events and returns the resulting burst list,
 * applying deletions as they occur.
 */
export function buildBurstsFromEvents(
  events: { type: 'insert' | 'delete'; char?: string; iki: number; confidence: number; hesitation: number; pause: number }[]
): Burst[] {
  const state = createBurstBuilderState();
  for (const event of events) {
    if (event.type === 'insert' && event.char) {
      addCharToBursts(state, event.char, event.iki, event.confidence, event.hesitation, event.pause);
    } else if (event.type === 'delete') {
      removeLastCharFromBursts(state);
    }
  }
  return getAllBursts(state);
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
