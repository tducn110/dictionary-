/**
 * ReplayView: the hero feature.
 *
 * Plays back a writing session character by character at original timing.
 * Characters appear with their recorded weight/opacity (burst-grouped).
 * Ghost traces: on deletion, the character gets strikethrough → fade to 0.15
 * → removed from DOM after 300ms.
 *
 * During long pauses (800ms+), cursor pulses more slowly to show the
 * writer thinking. Progress bar is clickable to scrub.
 *
 * If the URL contains ?d= (shared link), auto-play after 1 second.
 *
 * Visual: very dark warm brown (#1C1915) — intimate, like reading by lamplight.
 * Controls are minimal text links separated by middle dots.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import type { Burst, Session } from '../lib/types';
import { decodeSession } from '../lib/shareUtils';
import { createSampleSession } from '../lib/sampleSession';
import { getReplayStateAtTime, getSessionDuration } from '../lib/replayMath';
import {
  addCharToBursts,
  createBurstBuilderState,
  getAllBursts,
  removeLastCharFromBursts,
  buildBurstsFromEvents,
  type BurstBuilderState,
} from '../lib/burstDetector';
import { getBurstStyle, getGhostStyle } from '../lib/fontMapper';
import { replayViewContent } from '../content/replayViewContent';
import { useReplayController } from '../hooks/useReplayController';

type ReplaySpeed = '1x' | '2x' | '4x';

interface GhostAnimation {
  id: string;
  char: string;
  startedAt: number;
}

export function ReplayView() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const isSharedLink = !!searchParams.get('d');

  const session = useMemo<Session>(() => {
    if (location.state?.session) return location.state.session as Session;
    const encoded = searchParams.get('d');
    if (encoded) {
      const decoded = decodeSession(encoded);
      if (decoded) return decoded;
    }
    return createSampleSession();
  }, [location.state, searchParams]);

  const [bursts, setBursts] = useState<Burst[]>([]);
  const [ghosts, setGhosts] = useState<GhostAnimation[]>([]);
  const {
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
  } = useReplayController({ session });
  const [isSample] = useState(!location.state?.session && !searchParams.get('d'));

  const isMobile = typeof window !== 'undefined' && (('ontouchstart' in window) || window.innerWidth < 640);

  const eventIndexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const burstBuilderRef = useRef<BurstBuilderState>(createBurstBuilderState());
  const ghostIdRef = useRef(0);
  const autoStartedRef = useRef(false);

  const speedMultiplier = speed === '4x' ? 4 : speed === '2x' ? 2 : 1;
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
    restart();
    eventIndexRef.current = 0;
    ghostIdRef.current = 0;
    burstBuilderRef.current = createBurstBuilderState();
  }, [clearTimer, restart]);

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

    if (event.type === 'insert' && event.char) {
      addCharToBursts(
        burstBuilderRef.current,
        event.char,
        event.iki,
        event.confidence,
        event.hesitation,
        event.pause
      );
      setBursts(getAllBursts(burstBuilderRef.current));
    } else if (event.type === 'delete') {
      const allBursts = getAllBursts(burstBuilderRef.current);
      let deletedChar = '';
      for (let i = allBursts.length - 1; i >= 0; i--) {
        if (allBursts[i].chars.length > 0) {
          deletedChar = allBursts[i].chars[allBursts[i].chars.length - 1];
          break;
        }
      }

      if (deletedChar) {
        const ghostId = `ghost-${ghostIdRef.current++}`;
        setGhosts((prev) => [...prev, {
          id: ghostId,
          char: deletedChar,
          startedAt: performance.now(),
        }]);

        setTimeout(() => {
          setGhosts((prev) => prev.filter((g) => g.id !== ghostId));
        }, 350);
      }

      removeLastCharFromBursts(burstBuilderRef.current);
      setBursts(getAllBursts(burstBuilderRef.current));
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
  }, [session.events, speedMultiplier, totalDuration, setIsPlaying, setProgress, setIsComplete, setIsPausing]);

  const startReplay = useCallback(() => {
    if (!hasStarted) {
      reset();
      setHasStarted(true);
    }
    play();
    processNextEvent();
  }, [hasStarted, processNextEvent, reset, play, setHasStarted]);

  const pauseReplay = useCallback(() => {
    clearTimer();
    pause();
  }, [clearTimer, pause]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pauseReplay();
    } else if (isComplete) {
      reset();
      setTimeout(() => {
        setHasStarted(true);
        play();
        processNextEvent();
      }, 50);
    } else {
      startReplay();
    }
  }, [isPlaying, isComplete, pauseReplay, startReplay, reset, processNextEvent, setHasStarted, play]);

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

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      scrubTo(fraction);
    },
    [scrubTo]
  );



  // Auto-play on shared links (?d=)
  useEffect(() => {
    document.title = replayViewContent.title;

    if (isSharedLink && !autoStartedRef.current) {
      autoStartedRef.current = true;
      const autoTimer = setTimeout(() => {
        setHasStarted(true);
        setIsPlaying(true);
        setIsComplete(false);
        processNextEvent();
      }, 1000);
      return () => {
        clearTimeout(autoTimer);
        clearTimer();
      };
    }

    return () => clearTimer();
  }, [clearTimer, isSharedLink, processNextEvent]);

  useEffect(() => {
    if (isComplete && hasStarted) {
      const timer = setTimeout(() => {
        const finalBursts = buildBurstsFromEvents(session.events);
        setBursts(finalBursts);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isComplete, hasStarted, session.events]);

  const leftPad = 'max(2rem, 8vw)';

  const controlStyle = {
    background: 'none',
    border: 'none',
    padding: isMobile ? '0.75rem 0' : '0.5rem 0',
    fontFamily: "'Inter', sans-serif",
    fontVariationSettings: "'wght' 400",
    fontSize: isMobile ? '0.85rem' : '0.75rem',
    letterSpacing: '0.1em',
    color: '#A89B8E',
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
  } as const;

  /** Navigate back — if shared link or no history, go to landing page */
  const handleBack = useCallback(() => {
    if (isSharedLink || window.history.length <= 1) {
      navigate('/');
    } else {
      navigate(-1);
    }
  }, [navigate, isSharedLink]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#1C1915' }}>
      {/* Top bar */}
      <div
        className="relative z-10 flex items-center justify-between py-5 md:py-6"
        style={{ paddingLeft: leftPad, paddingRight: leftPad }}
      >
        <button
          onClick={handleBack}
          className="hover:text-[#F0E8DE] transition-colors cursor-pointer"
          style={{ ...controlStyle }}
        >
          {location.state?.session ? replayViewContent.backToLetterLabel : replayViewContent.backLabel}
        </button>

        {isSample && (
          <span
            className="uppercase"
            style={{
              ...controlStyle,
              fontSize: '0.6rem',
              letterSpacing: '0.25em',
              color: '#3D3630',
            }}
          >
            {replayViewContent.sampleBadge}
          </span>
        )}
      </div>

      {/* Replay content */}
      <div
        className="relative z-10 flex-1 flex flex-col justify-start pt-8 md:pt-16"
        style={{ paddingLeft: leftPad, paddingRight: leftPad }}
      >
        <div className="w-full min-h-[200px]" style={{ maxWidth: '42rem' }}>
          {!hasStarted ? (
            <div className="flex flex-col items-start gap-10 pt-8 md:pt-12">
              <p
                className="text-[#F0E8DE]"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontVariationSettings: "'wght' 350",
                  fontSize: isMobile ? '1rem' : '0.9rem',
                  lineHeight: 1.8,
                  maxWidth: '32ch',
                }}
              >
                {replayViewContent.intro}
              </p>
              <button
                onClick={startReplay}
                className="cursor-pointer"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0.5rem 0',
                  color: '#E5DCD2',
                  fontFamily: "'Playfair Display', serif",
                  fontStyle: 'italic',
                  fontWeight: 400,
                  fontSize: isMobile ? '1.1rem' : '1rem',
                  minHeight: '44px',
                }}
              >
                <span
                  style={{
                    paddingBottom: '2px',
                    borderBottom: '1.5px solid #5C5347',
                    transition: 'border-color 0.3s ease',
                  }}
                  onMouseEnter={(e) => { (e.target as HTMLElement).style.borderBottomColor = '#E5DCD2'; }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.borderBottomColor = '#5C5347'; }}
                >
                  {replayViewContent.beginReplayLabel} {'\u2192'}
                </span>
              </button>
            </div>
          ) : (
            <div className="relative">
              {/* Burst-rendered text */}
              <div
                className="whitespace-pre-wrap break-words"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: isMobile ? '1.1rem' : 'clamp(1rem, 2vw, 1.25rem)',
                  lineHeight: 1.8,
                }}
              >
                {bursts.map((burst) => (
                  <span key={burst.id} style={getBurstStyle(burst.confidence, burst.hesitation, burst.pauseBefore, true)}>
                    {burst.chars.map((ch, i) =>
                      ch === '\n' ? <br key={`${burst.id}-br-${i}`} /> : ch
                    ).reduce<(string | JSX.Element)[]>((acc, item) => {
                      if (typeof item === 'string' && acc.length > 0 && typeof acc[acc.length - 1] === 'string') {
                        acc[acc.length - 1] = (acc[acc.length - 1] as string) + item;
                      } else {
                        acc.push(item);
                      }
                      return acc;
                    }, [])}
                  </span>
                ))}

                {/* Ghost animations */}
                {ghosts.map((ghost) => (
                  <GhostChar key={ghost.id} char={ghost.char} />
                ))}

                {/* Cursor */}
                {isPlaying && !isComplete && (
                  <span
                    className="inline-block w-[2px] ml-[1px]"
                    style={{
                      height: '1.2em',
                      verticalAlign: 'text-bottom',
                      background: '#B87A5E',
                      animation: isPausing
                        ? 'replayBreathe 2s ease-in-out infinite'
                        : 'replayBlink 1.2s ease-in-out infinite',
                    }}
                  />
                )}
              </div>

              {/* Replay complete — message + Write Your Own */}
              {isComplete && (
                <div style={{ animation: 'replayFadeIn 0.8s ease-out' }}>
                  <p
                    className="mt-14"
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontStyle: 'italic',
                      fontWeight: 400,
                      fontSize: '0.85rem',
                      lineHeight: 1.7,
                      color: '#8B7E74',
                      maxWidth: '28ch',
                    }}
                  >
                    {replayViewContent.completeMessage}
                  </p>

                  <button
                    onClick={() => navigate('/write')}
                    className="cursor-pointer mt-6"
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: '#D4C9BC',
                      fontFamily: "'Playfair Display', serif",
                      fontStyle: 'italic',
                      fontWeight: 400,
                      fontSize: isMobile ? '1rem' : '0.85rem',
                      display: 'block',
                      minHeight: isMobile ? '44px' : 'auto',
                    }}
                  >
                    <span
                      style={{
                        paddingBottom: '2px',
                        borderBottom: '1.5px solid #5C5347',
                        transition: 'border-color 0.3s ease',
                      }}
                      onMouseEnter={(e) => { (e.target as HTMLElement).style.borderBottomColor = '#D4C9BC'; }}
                      onMouseLeave={(e) => { (e.target as HTMLElement).style.borderBottomColor = '#5C5347'; }}
                    >
                      {replayViewContent.writeYourOwnLabel} {'\u2192'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Controls — minimal text links separated by · */}
      {hasStarted && (
        <div
          className="relative z-10 pb-8 pt-4"
          style={{ paddingLeft: leftPad, paddingRight: leftPad }}
        >
          {/* Progress bar — full-width, 1px, barely there */}
          <div
            className="w-full mb-5 cursor-pointer"
            style={{ maxWidth: '42rem' }}
            onClick={handleProgressClick}
          >
            <div
              className="overflow-hidden"
              style={{
                height: '1px',
                background: 'rgba(255,255,255,0.08)',
              }}
            >
              <div
                className="h-full"
                style={{
                  background: '#B87A5E',
                  width: `${progress * 100}%`,
                  transition: isPlaying ? 'width 0.3s ease-out' : 'none',
                }}
              />
            </div>
          </div>

          {/* Text controls — separated by middle dots */}
          <div className="flex items-center gap-0">
            <button
              onClick={togglePlayPause}
              className="hover:text-[#B8A99A] transition-colors cursor-pointer"
              style={controlStyle}
            >
              {isPlaying
                ? replayViewContent.controls.pause
                : isComplete
                  ? replayViewContent.controls.replay
                  : replayViewContent.controls.play}
            </button>

            <span className="text-[#3D3630] mx-3" style={{ fontSize: '0.65rem' }}>{'\u00b7'}</span>

            <button
              onClick={cycleSpeed}
              className="hover:text-[#B8A99A] transition-colors cursor-pointer"
              style={controlStyle}
            >
              {speed === '1x'
                ? replayViewContent.controls.speed1x
                : speed === '2x'
                  ? replayViewContent.controls.speed2x
                  : replayViewContent.controls.speed4x}
            </button>

            <span className="text-[#3D3630] mx-3" style={{ fontSize: '0.65rem' }}>{'\u00b7'}</span>

            <button
              onClick={() => {
                reset();
                setTimeout(() => {
                  setHasStarted(true);
                  setIsPlaying(true);
                  processNextEvent();
                }, 50);
              }}
              className="hover:text-[#B8A99A] transition-colors cursor-pointer"
              style={controlStyle}
            >
              {replayViewContent.controls.restart}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes replayBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes replayBreathe {
          0%, 100% { opacity: 0.3; transform: scaleY(1); }
          50% { opacity: 1; transform: scaleY(1.3); }
        }
        @keyframes replayFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ghostFade {
          0% { opacity: 0.7; text-decoration: none; }
          30% { opacity: 0.5; text-decoration: line-through; }
          100% { opacity: 0.15; text-decoration: line-through; }
        }
      `}</style>
    </div>
  );
}

function GhostChar({ char }: { char: string }) {
  return (
    <span
      style={{
        ...getGhostStyle(),
        display: 'inline',
        animation: 'ghostFade 300ms ease-out forwards',
      }}
    >
      {char}
    </span>
  );
}
