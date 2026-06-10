import { useState, useCallback } from 'react';
import type { Session } from '../lib/types';

export type ReplaySpeed = '1x' | '2x' | '4x';

export interface UseReplayControllerOptions {
  session: Session;
}

export function useReplayController({ session }: UseReplayControllerOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [speed, setSpeed] = useState<ReplaySpeed>('2x');
  const [progress, setProgress] = useState(0);
  const [isPausing, setIsPausing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const play = useCallback(() => {
    setIsPlaying(true);
    setIsComplete(false);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const restart = useCallback(() => {
    setIsPlaying(false);
    setHasStarted(false);
    setProgress(0);
    setIsPausing(false);
    setIsComplete(false);
  }, []);

  const cycleSpeed = useCallback(() => {
    setSpeed((prev) => {
      if (prev === '1x') return '2x';
      if (prev === '2x') return '4x';
      return '1x';
    });
  }, []);

  return {
    isPlaying,
    setIsPlaying,
    hasStarted,
    setHasStarted,
    speed,
    setSpeed,
    progress,
    setProgress,
    isPausing,
    setIsPausing,
    isComplete,
    setIsComplete,
    play,
    pause,
    restart,
    cycleSpeed,
  };
}
export type ReplayController = ReturnType<typeof useReplayController>;
