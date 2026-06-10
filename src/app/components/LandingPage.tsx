/**
 * LandingPage: hero with auto-demo replay and single CTA.
 * Headline: "your words reveal what your fingers felt"
 * Auto-playing demo uses burst-grouped rendering.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import type { Burst } from '../lib/types';
import { createSampleSession } from '../lib/sampleSession';
import {
  addCharToBursts,
  createBurstBuilderState,
  getAllBursts,
  removeLastCharFromBursts,
  type BurstBuilderState,
} from '../lib/burstDetector';
import { getBurstStyle, getGhostStyle } from '../lib/fontMapper';

interface GhostAnim {
  id: string;
  char: string;
}

export function LandingPage() {
  const navigate = useNavigate();
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [ghosts, setGhosts] = useState<GhostAnim[]>([]);
  const [demoPlaying, setDemoPlaying] = useState(false);
  const [demoComplete, setDemoComplete] = useState(false);
  const [demoPausing, setDemoPausing] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventIndexRef = useRef(0);
  const burstBuilderRef = useRef<BurstBuilderState>(createBurstBuilderState());
  const ghostIdRef = useRef(0);
  const hasMountedRef = useRef(false);

  const session = useRef(createSampleSession()).current;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const processNextEvent = useCallback(() => {
    const idx = eventIndexRef.current;
    if (idx >= session.events.length) {
      setDemoPlaying(false);
      setDemoComplete(true);
      setDemoPausing(false);
      return;
    }

    const event = session.events[idx];

    // Detect pauses for cursor breathing
    if (idx > 0) {
      const prevEvent = session.events[idx - 1];
      const gap = event.t - prevEvent.t;
      if (gap > 800) {
        setDemoPausing(true);
        setTimeout(() => setDemoPausing(false), Math.min(gap / 3, 1500));
      } else {
        setDemoPausing(false);
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
      const allB = getAllBursts(burstBuilderRef.current);
      let delChar = '';
      for (let i = allB.length - 1; i >= 0; i--) {
        if (allB[i].chars.length > 0) {
          delChar = allB[i].chars[allB[i].chars.length - 1];
          break;
        }
      }
      if (delChar) {
        const gid = `dg-${ghostIdRef.current++}`;
        setGhosts((prev) => [...prev, { id: gid, char: delChar }]);
        setTimeout(() => {
          setGhosts((prev) => prev.filter((g) => g.id !== gid));
        }, 350);
      }
      removeLastCharFromBursts(burstBuilderRef.current);
      setBursts(getAllBursts(burstBuilderRef.current));
    }

    eventIndexRef.current = idx + 1;

    if (idx + 1 < session.events.length) {
      const nextEvent = session.events[idx + 1];
      const delay = (nextEvent.t - event.t) / 3;
      timerRef.current = setTimeout(processNextEvent, Math.max(delay, 8));
    } else {
      setDemoPlaying(false);
      setDemoComplete(true);
      setDemoPausing(false);
    }
  }, [session.events]);

  useEffect(() => {
    if (hasMountedRef.current) return;
    hasMountedRef.current = true;
    document.title = 'Font of Intent';

    const startTimer = setTimeout(() => {
      setDemoPlaying(true);
      processNextEvent();
    }, 1500);

    return () => {
      clearTimeout(startTimer);
      clearTimer();
    };
  }, [processNextEvent, clearTimer]);

  const leftPad = 'max(2rem, 8vw)';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5EDE4' }}>
      {/* Header — wordmark, intentional weight */}
      <header
        className="relative z-10"
        style={{ paddingLeft: leftPad, paddingRight: leftPad, paddingTop: '3rem', paddingBottom: '3rem' }}
      >
        <p
          className="uppercase"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontVariationSettings: "'wght' 600",
            fontSize: '0.75rem',
            letterSpacing: '0.35em',
            color: '#2C2824',
          }}
        >
          font of intent
        </p>
      </header>

      {/* Hero — everything shares the left edge, entrance animation */}
      <main
        className="relative z-10 flex-1 flex flex-col justify-center"
        style={{
          paddingLeft: leftPad,
          paddingRight: leftPad,
          animation: 'foiEntrance 800ms cubic-bezier(0.25, 0.1, 0.25, 1) both',
        }}
      >
        {/* Headline — THE moment */}
        <h1
          className="text-[#2C2824]"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontStyle: 'italic',
            fontWeight: 500,
            fontSize: 'clamp(3rem, 8vw, 6rem)',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginBottom: '0.5rem',
          }}
        >
          your words reveal
          <br />
          what your fingers felt
        </h1>

        {/* Subtitle — explicit line break */}
        <p
          className="text-[#8B7E74]"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontVariationSettings: "'wght' 350",
            fontSize: '0.9rem',
            lineHeight: 1.8,
            marginBottom: 0,
          }}
        >
          a letter that proves you were here.
          <br />
          not generated. not autocompleted. yours.
        </p>

        {/* Visual punctuation — structural break */}
        <div
          style={{
            width: '2rem',
            height: '1.5px',
            background: '#2C2824',
            margin: '2.5rem 0',
          }}
        />

        {/* Demo card — pull-quote left border, hover lift */}
        <div style={{ maxWidth: '36rem', marginBottom: '2rem' }}>
          <div
            className="foi-demo-card"
            style={{
              background: '#FFFDF8',
              borderLeft: '3px solid #2C2824',
              padding: '2.5rem 3rem',
              minHeight: '100px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              transition: 'box-shadow 300ms ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 16px rgba(44, 40, 36, 0.06)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)';
            }}
          >
            {(bursts.length > 0 || ghosts.length > 0) && (
              <div
                className="whitespace-pre-wrap break-words"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                  lineHeight: 1.8,
                }}
              >
                {bursts.map((burst) => (
                  <span key={burst.id} style={getBurstStyle(burst.confidence, burst.hesitation, burst.pauseBefore)}>
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
                {ghosts.map((g) => (
                  <span
                    key={g.id}
                    style={{
                      ...getGhostStyle(),
                      animation: 'ghostFade 300ms ease-out forwards',
                    }}
                  >
                    {g.char}
                  </span>
                ))}
                {demoPlaying && (
                  <span
                    className="inline-block w-[2px] ml-[1px]"
                    style={{
                      height: '1.2em',
                      verticalAlign: 'text-bottom',
                      background: '#B87A5E',
                      animation: demoPausing
                        ? 'demoCursorBreathe 2s ease-in-out infinite'
                        : 'demoCursorBlink 1.2s ease-in-out infinite',
                    }}
                  />
                )}
              </div>
            )}
            {!demoPlaying && !demoComplete && bursts.length === 0 && (
              <p
                className="text-[#C4B5A6]"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontVariationSettings: "'wght' 300",
                  fontSize: '0.9rem',
                }}
              >
                watching a letter unfold...
              </p>
            )}
          </div>
        </div>

        {/* CTA — the invitation, Playfair italic with persistent underline */}
        <button
          onClick={() => navigate('/write')}
          className="self-start cursor-pointer"
          style={{
            background: 'none',
            border: 'none',
            padding: '0.5rem 0',
            color: '#2C2824',
            fontFamily: "'Playfair Display', serif",
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: '1.1rem',
            minHeight: '44px',
          }}
        >
          <span
            style={{
              paddingBottom: '2px',
              borderBottom: '1.5px solid #C4B5A6',
              transition: 'border-color 0.3s ease',
            }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.borderBottomColor = '#2C2824'; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.borderBottomColor = '#C4B5A6'; }}
          >
            Write Your Letter{' '}
            <span
              className="inline-block"
              style={{
                animation: demoComplete ? 'foiArrowNudge 600ms ease-in-out 500ms 1 both' : 'none',
              }}
            >
              {'\u2192'}
            </span>
          </span>
        </button>
      </main>

      {/* Footer — colophon, serif italic echo */}
      <footer
        className="relative z-10 shrink-0"
        style={{
          paddingLeft: leftPad,
          paddingRight: leftPad,
          paddingTop: '2rem',
          paddingBottom: '2rem',
        }}
      >
        <p
          style={{
            fontFamily: "'Playfair Display', serif",
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: '0.85rem',
            color: '#8B7E74',
            marginBottom: '0.5rem',
          }}
        >
          the letter only a human could write
        </p>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontVariationSettings: "'wght' 400",
            fontSize: '0.6rem',
            letterSpacing: '0.1em',
            color: '#C4B5A6',
          }}
        >
          Made with Figma Make
        </p>
      </footer>

      <style>{`
        @keyframes foiEntrance {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes demoCursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes demoCursorBreathe {
          0%, 100% {
            opacity: 0.4;
            box-shadow: 0 0 2px rgba(184, 122, 94, 0);
          }
          50% {
            opacity: 1;
            box-shadow: 0 0 6px rgba(184, 122, 94, 0.35);
          }
        }
        @keyframes foiArrowNudge {
          0% { transform: translateX(0); }
          50% { transform: translateX(4px); }
          100% { transform: translateX(0); }
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