import { describe, expect, it } from 'vitest';
import { applyReplayEvent } from './replayEngine';
import { createBurstBuilderState } from './burstDetector';
import type { TypingEvent } from './types';

function makeEvent(overrides: Partial<TypingEvent>): TypingEvent {
  return {
    t: 100,
    type: 'insert',
    char: 'a',
    pos: 0,
    iki: 100,
    burst: 1,
    pause: 0,
    confidence: 1,
    hesitation: 0,
    ...overrides,
  };
}

describe('replayEngine - applyReplayEvent', () => {
  it('applies insert events correctly', () => {
    const state = createBurstBuilderState();
    const event = makeEvent({ type: 'insert', char: 'H' });
    const result = applyReplayEvent(state, event);

    expect(result.ghostToSpawn).toBeNull();
    const chars = result.bursts.flatMap((b) => b.chars);
    expect(chars).toEqual(['H']);
  });

  it('applies delete events correctly and identifies the deleted character for ghost spawn', () => {
    const state = createBurstBuilderState();
    // Insert 'H' then 'e'
    applyReplayEvent(state, makeEvent({ type: 'insert', char: 'H' }));
    applyReplayEvent(state, makeEvent({ type: 'insert', char: 'e' }));

    // Now delete 'e'
    const event = makeEvent({ type: 'delete' });
    const result = applyReplayEvent(state, event);

    expect(result.ghostToSpawn).toBe('e');
    const chars = result.bursts.flatMap((b) => b.chars);
    expect(chars).toEqual(['H']);
  });

  it('returns null ghostToSpawn when deleting from an empty state', () => {
    const state = createBurstBuilderState();
    const event = makeEvent({ type: 'delete' });
    const result = applyReplayEvent(state, event);

    expect(result.ghostToSpawn).toBeNull();
    expect(result.bursts).toEqual([]);
  });
});
