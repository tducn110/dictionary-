import type { Burst, TypingEvent } from './types';
import {
  addCharToBursts,
  getAllBursts,
  removeLastCharFromBursts,
  type BurstBuilderState,
} from './burstDetector';

export interface EventTransitionResult {
  bursts: Burst[];
  ghostToSpawn: string | null;
}

/**
 * Applies a single typing event to the burst builder state.
 * Returns the updated bursts and whether a ghost character should be spawned (for deletions).
 * Mutates `builderState` in place.
 */
export function applyReplayEvent(
  builderState: BurstBuilderState,
  event: TypingEvent
): EventTransitionResult {
  let ghostToSpawn: string | null = null;

  if (event.type === 'insert' && event.char) {
    addCharToBursts(
      builderState,
      event.char,
      event.iki,
      event.confidence,
      event.hesitation,
      event.pause
    );
  } else if (event.type === 'delete') {
    const allBursts = getAllBursts(builderState);
    let deletedChar = '';
    for (let i = allBursts.length - 1; i >= 0; i--) {
      if (allBursts[i].chars.length > 0) {
        deletedChar = allBursts[i].chars[allBursts[i].chars.length - 1];
        break;
      }
    }
    if (deletedChar) {
      ghostToSpawn = deletedChar;
    }
    removeLastCharFromBursts(builderState);
  }

  return {
    bursts: getAllBursts(builderState),
    ghostToSpawn,
  };
}
