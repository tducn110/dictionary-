import { beforeEach, describe, expect, it } from 'vitest';
import {
  addCharToBursts,
  buildBurstsFromEvents,
  createBurstBuilderState,
  getAllBursts,
  getTotalCharCount,
  removeLastCharFromBursts,
  resetBurstIdCounter,
} from './burstDetector';

describe('burstDetector', () => {
  beforeEach(() => {
    resetBurstIdCounter();
  });

  it('groups consistent keystrokes into one burst and averages signals', () => {
    const state = createBurstBuilderState();

    addCharToBursts(state, 'a', 100, 0.2, 0.1, 0);
    addCharToBursts(state, 'b', 120, 0.6, 0.3, 0);
    addCharToBursts(state, 'c', 110, 0.4, 0.2, 0);

    const bursts = getAllBursts(state);
    expect(bursts).toHaveLength(1);
    expect(bursts[0]).toMatchObject({
      id: 'b-0',
      chars: ['a', 'b', 'c'],
      pauseBefore: 0,
      ikis: [100, 120, 110],
    });
    expect(bursts[0].confidence).toBeCloseTo(0.4);
    expect(bursts[0].hesitation).toBeCloseTo(0.2);
    expect(getTotalCharCount(state)).toBe(3);
  });

  it('starts a new burst after a pause', () => {
    const state = createBurstBuilderState();

    addCharToBursts(state, 'a', 100, 0.5, 0, 0);
    addCharToBursts(state, 'b', 900, 0.3, 0.8, 900);

    const bursts = getAllBursts(state);
    expect(bursts).toHaveLength(2);
    expect(bursts[0].chars).toEqual(['a']);
    expect(bursts[1]).toMatchObject({
      id: 'b-1',
      chars: ['b'],
      pauseBefore: 900,
      ikis: [900],
    });
  });

  it('removes characters across burst boundaries', () => {
    const state = createBurstBuilderState();

    addCharToBursts(state, 'a', 100, 0.5, 0, 0);
    addCharToBursts(state, 'b', 100, 0.5, 0, 0);
    addCharToBursts(state, 'c', 900, 0.2, 0.8, 900);

    expect(removeLastCharFromBursts(state)).toBe(true);
    expect(getAllBursts(state).map((burst) => burst.chars.join(''))).toEqual(['ab']);
    expect(removeLastCharFromBursts(state)).toBe(true);
    expect(getAllBursts(state).map((burst) => burst.chars.join(''))).toEqual(['a']);
  });

  it('builds final bursts from insert and delete events', () => {
    const bursts = buildBurstsFromEvents([
      { type: 'insert', char: 'h', iki: 100, confidence: 0.5, hesitation: 0, pause: 0 },
      { type: 'insert', char: 'i', iki: 100, confidence: 0.5, hesitation: 0, pause: 0 },
      { type: 'delete', iki: 120, confidence: 0.2, hesitation: 0.4, pause: 0 },
      { type: 'insert', char: 'o', iki: 100, confidence: 0.6, hesitation: 0.1, pause: 0 },
    ]);

    expect(bursts.map((burst) => burst.chars.join('')).join('')).toBe('ho');
  });
});
