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

export const STORAGE_KEY = 'foi_session_draft_v1';

export function useWritingSession(resumeState: WritingSurfaceResumeState | undefined) {
  // Load initial state from resumeState or localStorage
  const savedStateRef = useRef<WritingSurfaceResumeState | null>(null);
  if (!resumeState && !savedStateRef.current) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        savedStateRef.current = JSON.parse(saved) as WritingSurfaceResumeState;
      }
    } catch (e) {
      console.error('Failed to parse saved session:', e);
    }
  }

  const effectiveState = resumeState || savedStateRef.current || undefined;

  const [bursts, setBursts] = useState<Burst[]>(effectiveState?.bursts ?? []);
  const [events, setEvents] = useState<TypingEvent[]>(effectiveState?.events ?? []);
  const [firstCharAnim, setFirstCharAnim] = useState(false);

  const signalStateRef = useRef<SignalState>(effectiveState?.signalState ?? createSignalState());
  
  // Calculate session start timestamp relative to current performance.now() to ensure timeline continuity.
  // This prevents negative 't' values or timeline gaps when resuming or page refreshing.
  const lastEventT = effectiveState?.events && effectiveState.events.length > 0
    ? effectiveState.events[effectiveState.events.length - 1].t
    : 0;
  const sessionStartRef = useRef<number>(performance.now() - lastEventT);

  const textBufferRef = useRef<string[]>(effectiveState?.textBuffer ?? []);
  const eventsRef = useRef<TypingEvent[]>(effectiveState?.events ?? []);
  const burstBuilderRef = useRef<BurstBuilderState>(
    effectiveState?.burstBuilderState ?? createBurstBuilderState()
  );

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  // Maintain latest state for unmount auto-saving
  const lastStateRef = useRef<WritingSurfaceResumeState | null>(null);
  useEffect(() => {
    if (events.length > 0) {
      lastStateRef.current = {
        bursts,
        burstBuilderState: burstBuilderRef.current,
        events,
        textBuffer: textBufferRef.current,
        signalState: signalStateRef.current,
        sessionStart: sessionStartRef.current,
      };
    }
  }, [events, bursts]);

  // Debounced auto-save (triggered 1 second after typing stops)
  useEffect(() => {
    if (events.length === 0) return;

    const handler = setTimeout(() => {
      if (lastStateRef.current) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(lastStateRef.current));
        } catch (e) {
          console.error('Failed to save session to localStorage:', e);
        }
      }
    }, 1000);

    return () => clearTimeout(handler);
  }, [events]);

  // Save immediately on unmount
  useEffect(() => {
    return () => {
      if (lastStateRef.current) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(lastStateRef.current));
        } catch (e) {
          console.error('Failed to save session on unmount:', e);
        }
      }
    };
  }, []);

  const clearSavedSession = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      lastStateRef.current = null;
    } catch (e) {
      console.error('Failed to clear saved session:', e);
    }
  }, []);

  const startSession = useCallback(() => {
    // Only reset session start if starting a brand new session with no events
    if (eventsRef.current.length === 0) {
      sessionStartRef.current = performance.now();
    }
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
    clearSavedSession,
  };
}
