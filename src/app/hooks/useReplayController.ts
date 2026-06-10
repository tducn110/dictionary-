import { useState, useCallback, useRef, useEffect } from 'react';
import type { Session, Burst } from '../lib/types';
import { getReplayStateAtTime, getSessionDuration } from '../lib/replayMath';
import {
  createBurstBuilderState,
  addCharToBursts,
  removeLastCharFromBursts,
  buildBurstsFromEvents,
  type BurstBuilderState,
} from '../lib/burstDetector';
import { applyReplayEvent } from '../lib/replayEngine';

export type ReplaySpeed = '1x' | '2x' | '4x';

export interface UseReplayControllerOptions {
  session: Session;
  isSharedLink?: boolean;
  autoplayDelay?: number;
  customSpeedMultiplier?: number;
}

interface GhostAnimation {
  id: string;
  char: string;
  startedAt: number;
}

export function useReplayController({
  session,
  isSharedLink,
  autoplayDelay,
  customSpeedMultiplier,
}: UseReplayControllerOptions) {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [ghosts, setGhosts] = useState<GhostAnimation[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [speed, setSpeed] = useState<ReplaySpeed>('2x');
  const [progress, setProgress] = useState(0);
  const [isPausing, setIsPausing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const eventIndexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const burstBuilderRef = useRef<BurstBuilderState>(createBurstBuilderState());
  const ghostIdRef = useRef(0);
  const autoStartedRef = useRef(false);

  const speedMultiplier = customSpeedMultiplier !== undefined
    ? customSpeedMultiplier
    : (speed === '4x' ? 4 : speed === '2x' ? 2 : 1);
  const totalDuration = getSessionDuration(session);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    setBursts([]);
    setGhosts([]);
    setIsPlaying(false);
    setHasStarted(false);
    setProgress(0);
    setIsPausing(false);
    setIsComplete(false);
    eventIndexRef.current = 0;
    ghostIdRef.current = 0;
    burstBuilderRef.current = createBurstBuilderState();
  }, [clearTimer]);

  const processNextEvent = useCallback(() => {
    const idx = eventIndexRef.current;
    if (idx >= session.events.length) {
      setIsPlaying(false);
      setProgress(1);
      setIsComplete(true);
      return;
    }

    const event = session.events[idx];
    setProgress(event.t / totalDuration);

    if (idx > 0) {
      const prevEvent = session.events[idx - 1];
      const gap = event.t - prevEvent.t;
      if (gap > 800) {
        setIsPausing(true);
        setTimeout(() => setIsPausing(false), Math.min(gap / speedMultiplier, 1500));
      }
    }

    const { bursts: nextBursts, ghostToSpawn } = applyReplayEvent(
      burstBuilderRef.current,
      event
    );
    setBursts(nextBursts);

    if (ghostToSpawn) {
      const ghostId = `ghost-${ghostIdRef.current++}`;
      setGhosts((prev) => [...prev, {
        id: ghostId,
        char: ghostToSpawn,
        startedAt: performance.now(),
      }]);

      setTimeout(() => {
        setGhosts((prev) => prev.filter((g) => g.id !== ghostId));
      }, 350);
    }

    eventIndexRef.current = idx + 1;

    if (idx + 1 < session.events.length) {
      const nextEvent = session.events[idx + 1];
      const delay = (nextEvent.t - event.t) / speedMultiplier;
      timerRef.current = setTimeout(processNextEvent, Math.max(delay, 8));
    } else {
      setIsPlaying(false);
      setProgress(1);
      setIsComplete(true);
    }
  }, [session.events, speedMultiplier, totalDuration]);

  const startReplay = useCallback(() => {
    if (!hasStarted) {
      reset();
      setHasStarted(true);
    }
    setIsPlaying(true);
    setIsComplete(false);
    processNextEvent();
  }, [hasStarted, processNextEvent, reset]);

  const pauseReplay = useCallback(() => {
    clearTimer();
    setIsPlaying(false);
  }, [clearTimer]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pauseReplay();
    } else if (isComplete) {
      reset();
      setTimeout(() => {
        setHasStarted(true);
        setIsPlaying(true);
        setIsComplete(false);
        processNextEvent();
      }, 50);
    } else {
      startReplay();
    }
  }, [isPlaying, isComplete, pauseReplay, startReplay, reset, processNextEvent]);

  const scrubTo = useCallback(
    (fraction: number) => {
      clearTimer();
      const targetTime = fraction * totalDuration;
      const snapshot = getReplayStateAtTime(session, targetTime);

      // Reset mutable refs to match the snapshot
      burstBuilderRef.current = createBurstBuilderState();
      // Re-feed events into the builder so it stays in sync for
      // any subsequent processNextEvent calls after scrubbing.
      for (let i = 0; i < snapshot.eventIndex; i++) {
        const ev = session.events[i];
        if (ev.type === 'insert' && ev.char) {
          addCharToBursts(
            burstBuilderRef.current,
            ev.char, ev.iki, ev.confidence, ev.hesitation, ev.pause
          );
        } else if (ev.type === 'delete') {
          removeLastCharFromBursts(burstBuilderRef.current);
        }
      }
      ghostIdRef.current = 0;
      setGhosts([]);

      setBursts(snapshot.bursts);
      eventIndexRef.current = snapshot.eventIndex;
      setProgress(fraction);
      setHasStarted(true);
      setIsComplete(snapshot.isComplete);
      setIsPlaying(false);
    },
    [clearTimer, session, totalDuration]
  );

  const cycleSpeed = useCallback(() => {
    setSpeed((prev) => {
      if (prev === '1x') return '2x';
      if (prev === '2x') return '4x';
      return '1x';
    });
  }, []);

  const restart = useCallback(() => {
    reset();
    setTimeout(() => {
      setHasStarted(true);
      setIsPlaying(true);
      setIsComplete(false);
      processNextEvent();
    }, 50);
  }, [reset, processNextEvent]);

  // Auto-play trigger
  useEffect(() => {
    const shouldAutoplay = isSharedLink || autoplayDelay !== undefined;
    const delay = autoplayDelay !== undefined ? autoplayDelay : 1000;

    if (shouldAutoplay && !autoStartedRef.current) {
      autoStartedRef.current = true;
      const autoTimer = setTimeout(() => {
        setHasStarted(true);
        setIsPlaying(true);
        setIsComplete(false);
        processNextEvent();
      }, delay);
      return () => {
        clearTimeout(autoTimer);
        clearTimer();
      };
    }

    return () => clearTimer();
  }, [clearTimer, isSharedLink, autoplayDelay, processNextEvent]);

  // Replay complete final bursts processing
  useEffect(() => {
    if (isComplete && hasStarted) {
      const timer = setTimeout(() => {
        const finalBursts = buildBurstsFromEvents(session.events);
        setBursts(finalBursts);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isComplete, hasStarted, session.events]);

  return {
    bursts,
    ghosts,
    isPlaying,
    hasStarted,
    speed,
    progress,
    isPausing,
    isComplete,
    startReplay,
    pauseReplay,
    togglePlayPause,
    restart,
    reset,
    scrubTo,
    cycleSpeed,
  };
}

export type ReplayController = ReturnType<typeof useReplayController>;
