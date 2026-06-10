/**
 * Signal processing pipeline for typing behavior analysis.
 * Converts raw keystroke timing into normalized confidence/hesitation scores.
 *
 * Key design: confidence is RELATIVE to the typist's own rhythm.
 * Average typing speed → wght 400 (regular). Faster → bolder. Slower → thinner.
 * This adapts to every typist rather than assuming an absolute speed baseline.
 */

const EMA_ALPHA = 0.3;
const PAUSE_THRESHOLD_MS = 800;
const LONG_PAUSE_THRESHOLD_MS = 2000;

/** Ratio thresholds for relative speed mapping */
const FAST_RATIO = 0.6; // IKI < 60% of avg = confident burst
const SLOW_RATIO = 1.6; // IKI > 160% of avg = hesitant

export interface SignalState {
  lastKeyTime: number;
  burstVelocity: number;
  /** Rolling window of recent non-pause IKIs for baseline calculation */
  recentIKIs: number[];
  recentDeleteCount: number;
  recentInsertCount: number;
  /** EMA-smoothed average IKI (the typist's personal baseline) */
  avgIKI: number;
  /** Whether we've collected enough data for reliable baseline */
  baselineReady: boolean;
}

export function createSignalState(): SignalState {
  return {
    lastKeyTime: 0,
    burstVelocity: 0,
    recentIKIs: [],
    recentDeleteCount: 0,
    recentInsertCount: 0,
    avgIKI: 150, // sensible default until we have data
    baselineReady: false,
  };
}

export interface ProcessedSignal {
  iki: number;
  burst: number;
  pause: number;
  confidence: number;
  hesitation: number;
}

/**
 * Process a keystroke event and return computed signals.
 */
export function processKeystroke(
  state: SignalState,
  now: number,
  isDelete: boolean
): ProcessedSignal {
  const iki = state.lastKeyTime > 0 ? now - state.lastKeyTime : 150;
  const pause = iki > PAUSE_THRESHOLD_MS ? iki : 0;

  // Only include non-pause IKIs in the rolling baseline window
  // Pauses represent thinking, not typing rhythm
  if (iki > 30 && iki < PAUSE_THRESHOLD_MS) {
    state.recentIKIs.push(iki);
    if (state.recentIKIs.length > 20) state.recentIKIs.shift();

    // Update EMA average
    if (!state.baselineReady && state.recentIKIs.length >= 6) {
      // Bootstrap: use simple mean of first few keystrokes
      state.avgIKI =
        state.recentIKIs.reduce((a, b) => a + b, 0) / state.recentIKIs.length;
      state.baselineReady = true;
    } else if (state.baselineReady) {
      state.avgIKI = EMA_ALPHA * iki + (1 - EMA_ALPHA) * state.avgIKI;
    }
  }

  // Burst velocity via EMA (chars per second)
  const instantVelocity = iki > 0 ? 1000 / iki : 10;
  state.burstVelocity =
    state.lastKeyTime === 0
      ? instantVelocity
      : EMA_ALPHA * instantVelocity + (1 - EMA_ALPHA) * state.burstVelocity;

  // Track correction intensity (rolling window)
  if (isDelete) {
    state.recentDeleteCount++;
  } else {
    state.recentInsertCount++;
  }

  // Decay correction counts over time
  if (state.recentInsertCount + state.recentDeleteCount > 20) {
    state.recentDeleteCount = Math.floor(state.recentDeleteCount * 0.7);
    state.recentInsertCount = Math.floor(state.recentInsertCount * 0.7);
  }

  // --- Relative confidence: compare this IKI to the typist's own average ---
  // ratio < 1 = faster than average, ratio > 1 = slower
  const effectiveIKI = pause > 0 ? state.avgIKI : iki; // don't let pauses crush confidence
  const ratio = state.baselineReady ? effectiveIKI / state.avgIKI : 1;

  // Map ratio to 0..1 confidence:
  //   ratio <= FAST_RATIO (0.6) → confidence 1.0
  //   ratio == 1.0              → confidence 0.5
  //   ratio >= SLOW_RATIO (1.6) → confidence 0.0
  let speedConfidence: number;
  if (ratio <= FAST_RATIO) {
    speedConfidence = 1;
  } else if (ratio >= SLOW_RATIO) {
    speedConfidence = 0;
  } else if (ratio <= 1) {
    // Fast side: FAST_RATIO..1.0 → 1.0..0.5
    speedConfidence = 0.5 + 0.5 * ((1 - ratio) / (1 - FAST_RATIO));
  } else {
    // Slow side: 1.0..SLOW_RATIO → 0.5..0.0
    speedConfidence = 0.5 * (1 - (ratio - 1) / (SLOW_RATIO - 1));
  }

  // Correction penalty
  const totalRecent = state.recentInsertCount + state.recentDeleteCount;
  const correctionRate =
    totalRecent > 0 ? state.recentDeleteCount / totalRecent : 0;
  const correctionPenalty = correctionRate * 0.4;

  const confidence = Math.max(0, Math.min(1, speedConfidence - correctionPenalty));

  // --- Hesitation: pauses + erratic timing + corrections ---
  let pauseScore = 0;
  if (iki > LONG_PAUSE_THRESHOLD_MS) {
    pauseScore = 1;
  } else if (iki > PAUSE_THRESHOLD_MS) {
    pauseScore =
      (iki - PAUSE_THRESHOLD_MS) / (LONG_PAUSE_THRESHOLD_MS - PAUSE_THRESHOLD_MS);
  }

  const ikiVariance = computeVariance(state.recentIKIs);
  const erraticScore = Math.min(1, ikiVariance / 50000);
  const hesitation = Math.max(
    0,
    Math.min(1, pauseScore * 0.5 + erraticScore * 0.25 + correctionRate * 0.25)
  );

  state.lastKeyTime = now;

  return {
    iki,
    burst: state.burstVelocity,
    pause,
    confidence,
    hesitation,
  };
}

function computeVariance(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
}