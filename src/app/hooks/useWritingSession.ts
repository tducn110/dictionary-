import { useCallback, useEffect, useRef, useState } from 'react';
import type { Burst, Session, TypingEvent } from '../lib/types';
import {
  createSignalState,
  processKeystroke,
  type SignalState,
} from '../lib/signalProcessor';
import {
  addCharToBursts,
  createBurstBuilderState,
  getAllBursts,
  removeLastCharFromBursts,
  type BurstBuilderState,
} from '../lib/burstDetector';

/** State passed back from PreviewScreen when user chooses "Keep Writing" */
export interface WritingSurfaceResumeState {
  bursts: Burst[];
  burstBuilderState: BurstBuilderState;
  events: TypingEvent[];
  textBuffer: string[];
  signalState: SignalState;
  sessionStart: number;
}

export function useWritingSession(resumeState: WritingSurfaceResumeState | undefined) {
  const [bursts, setBursts] = useState<Burst[]>(resumeState?.bursts ?? []);
  const [events, setEvents] = useState<TypingEvent[]>(resumeState?.events ?? []);
  const [firstCharAnim, setFirstCharAnim] = useState(false);

  const signalStateRef = useRef<SignalState>(resumeState?.signalState ?? createSignalState());
  const sessionStartRef = useRef<number>(resumeState?.sessionStart ?? 0);
  const textBufferRef = useRef<string[]>(resumeState?.textBuffer ?? []);
  const eventsRef = useRef<TypingEvent[]>(resumeState?.events ?? []);
  const burstBuilderRef = useRef<BurstBuilderState>(
    resumeState?.burstBuilderState ?? createBurstBuilderState()
  );

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  const startSession = useCallback(() => {
    sessionStartRef.current = performance.now();
  }, []);

  const syncBursts = useCallback(() => {
    setBursts(getAllBursts(burstBuilderRef.current));
  }, []);

  /** Insert a character into the session */
  const insertChar = useCallback((char: string) => {
    const now = performance.now();
    const t = now - sessionStartRef.current;
    const signal = processKeystroke(signalStateRef.current, now, false);
    const pos = textBufferRef.current.length;
    const event: TypingEvent = {
      t, type: 'insert', char, pos,
      iki: signal.iki, burst: signal.burst, pause: signal.pause,
      confidence: signal.confidence, hesitation: signal.hesitation,
    };
    setEvents((prev) => [...prev, event]);
    textBufferRef.current.push(char);
    addCharToBursts(
      burstBuilderRef.current, char,
      signal.iki, signal.confidence, signal.hesitation, signal.pause
    );
    syncBursts();
    if (textBufferRef.current.length === 1) {
      setFirstCharAnim(true);
    }
  }, [syncBursts]);

  /** Delete one character */
  const deleteChar = useCallback(() => {
    if (textBufferRef.current.length === 0) return;
    const now = performance.now();
    const t = now - sessionStartRef.current;
    const signal = processKeystroke(signalStateRef.current, now, true);
    const pos = textBufferRef.current.length - 1;
    const event: TypingEvent = {
      t, type: 'delete', pos,
      iki: signal.iki, burst: signal.burst, pause: signal.pause,
      confidence: signal.confidence, hesitation: signal.hesitation,
    };
    setEvents((prev) => [...prev, event]);
    textBufferRef.current.pop();
    removeLastCharFromBursts(burstBuilderRef.current);
    syncBursts();
  }, [syncBursts]);

  /** Delete word backward (iOS swipe-delete) */
  const deleteWordBackward = useCallback(() => {
    if (textBufferRef.current.length === 0) return;
    // Delete trailing spaces first
    while (textBufferRef.current.length > 0 && textBufferRef.current[textBufferRef.current.length - 1] === ' ') {
      deleteChar();
    }
    // Delete until next space or start
    while (textBufferRef.current.length > 0 && textBufferRef.current[textBufferRef.current.length - 1] !== ' ') {
      deleteChar();
    }
  }, [deleteChar]);

  const createPreviewState = useCallback(() => {
    const session: Session = {
      startedAt: sessionStartRef.current,
      events: eventsRef.current,
      finalText: textBufferRef.current.join(''),
    };

    const currentBursts = getAllBursts(burstBuilderRef.current);
    const copiedBursts = currentBursts.map((b) => ({
      ...b,
      chars: [...b.chars],
      ikis: [...b.ikis],
    }));

    const bbs = burstBuilderRef.current;
    const copiedBuilderState: BurstBuilderState = {
      bursts: bbs.bursts.map((b) => ({
        ...b,
        chars: [...b.chars],
        ikis: [...b.ikis],
      })),
      currentBurst: bbs.currentBurst
        ? {
            ...bbs.currentBurst,
            chars: [...bbs.currentBurst.chars],
            ikis: [...bbs.currentBurst.ikis],
          }
        : null,
    };

    const resume: WritingSurfaceResumeState = {
      bursts: copiedBursts,
      burstBuilderState: copiedBuilderState,
      events: [...eventsRef.current],
      textBuffer: [...textBufferRef.current],
      signalState: {
        ...signalStateRef.current,
        recentIKIs: [...signalStateRef.current.recentIKIs],
      },
      sessionStart: sessionStartRef.current,
    };

    return { session, resumeState: resume };
  }, []);

  const createFallbackPreviewState = useCallback(() => {
    const session: Session = {
      startedAt: sessionStartRef.current,
      events: eventsRef.current,
      finalText: textBufferRef.current.join(''),
    };
    const fallbackBursts = getAllBursts(burstBuilderRef.current).map((b) => ({
      ...b,
      chars: [...b.chars],
      ikis: [...b.ikis],
    }));

    return {
      session,
      resumeState: {
        bursts: fallbackBursts,
        burstBuilderState: createBurstBuilderState(),
        events: eventsRef.current,
        textBuffer: [...textBufferRef.current],
        signalState: createSignalState(),
        sessionStart: sessionStartRef.current,
      },
    };
  }, []);

  const clearFirstCharAnim = useCallback(() => {
    setFirstCharAnim(false);
  }, []);

  return {
    bursts,
    firstCharAnim,
    clearFirstCharAnim,
    startSession,
    insertChar,
    deleteChar,
    deleteWordBackward,
    createPreviewState,
    createFallbackPreviewState,
  };
}
