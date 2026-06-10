import { describe, expect, it } from 'vitest';
import { createSignalState, processKeystroke } from './signalProcessor';

describe('signalProcessor', () => {
  it('creates neutral initial signal state', () => {
    expect(createSignalState()).toEqual({
      lastKeyTime: 0,
      burstVelocity: 0,
      recentIKIs: [],
      recentDeleteCount: 0,
      recentInsertCount: 0,
      avgIKI: 150,
      baselineReady: false,
    });
  });

  it('returns a neutral first insert signal and updates state', () => {
    const state = createSignalState();
    const signal = processKeystroke(state, 1000, false);

    expect(signal).toMatchObject({
      iki: 150,
      pause: 0,
      confidence: 0.5,
      hesitation: 0,
    });
    expect(signal.burst).toBeCloseTo(1000 / 150);
    expect(state.lastKeyTime).toBe(1000);
    expect(state.recentInsertCount).toBe(1);
    expect(state.recentDeleteCount).toBe(0);
  });

  it('marks long pauses without adding them to the typing baseline', () => {
    const state = createSignalState();

    for (const now of [1000, 1100, 1200, 1300, 1400, 1500]) {
      processKeystroke(state, now, false);
    }

    const baselineLength = state.recentIKIs.length;
    const avgBeforePause = state.avgIKI;
    const signal = processKeystroke(state, 3600, false);

    expect(state.baselineReady).toBe(true);
    expect(signal.pause).toBe(2100);
    expect(signal.iki).toBe(2100);
    expect(signal.confidence).toBeCloseTo(0.5);
    expect(signal.hesitation).toBeGreaterThanOrEqual(0.5);
    expect(state.recentIKIs).toHaveLength(baselineLength);
    expect(state.avgIKI).toBeCloseTo(avgBeforePause);
  });

  it('penalizes confidence for correction-heavy input', () => {
    const state = createSignalState();

    processKeystroke(state, 1000, false);
    const signal = processKeystroke(state, 1150, true);

    expect(signal.confidence).toBeCloseTo(0.3);
    expect(signal.hesitation).toBeCloseTo(0.125);
    expect(state.recentInsertCount).toBe(1);
    expect(state.recentDeleteCount).toBe(1);
  });
});
