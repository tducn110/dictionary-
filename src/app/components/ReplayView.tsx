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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import type { Session } from '../lib/types';
import { decodeSession } from '../lib/shareUtils';
import { createSampleSession } from '../lib/sampleSession';
import { getBurstStyle, getGhostStyle } from '../lib/fontMapper';
import { replayViewContent } from '../content/replayViewContent';
import { useReplayController } from '../hooks/useReplayController';

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

  const replay = useReplayController({ session, isSharedLink });
  const [isSample] = useState(!location.state?.session && !searchParams.get('d'));

  const isMobile = typeof window !== 'undefined' && (('ontouchstart' in window) || window.innerWidth < 640);

  // Auto-play page title side effect
  useEffect(() => {
    document.title = replayViewContent.title;
  }, []);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      replay.scrubTo(fraction);
    },
    [replay]
  );

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
          {!replay.hasStarted ? (
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
                onClick={replay.startReplay}
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
                {replay.bursts.map((burst) => (
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
                {replay.ghosts.map((ghost) => (
                  <GhostChar key={ghost.id} char={ghost.char} />
                ))}

                {/* Cursor */}
                {replay.isPlaying && !replay.isComplete && (
                  <span
                    className="inline-block w-[2px] ml-[1px]"
                    style={{
                      height: '1.2em',
                      verticalAlign: 'text-bottom',
                      background: '#B87A5E',
                      animation: replay.isPausing
                        ? 'replayBreathe 2s ease-in-out infinite'
                        : 'replayBlink 1.2s ease-in-out infinite',
                    }}
                  />
                )}
              </div>

              {/* Replay complete — message + Write Your Own */}
              {replay.isComplete && (
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
      {replay.hasStarted && (
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
                  width: `${replay.progress * 100}%`,
                  transition: replay.isPlaying ? 'width 0.3s ease-out' : 'none',
                }}
              />
            </div>
          </div>

          {/* Text controls — separated by middle dots */}
          <div className="flex items-center gap-0">
            <button
              onClick={replay.togglePlayPause}
              className="hover:text-[#B8A99A] transition-colors cursor-pointer"
              style={controlStyle}
            >
              {replay.isPlaying
                ? replayViewContent.controls.pause
                : replay.isComplete
                  ? replayViewContent.controls.replay
                  : replayViewContent.controls.play}
            </button>

            <span className="text-[#3D3630] mx-3" style={{ fontSize: '0.65rem' }}>{'\u00b7'}</span>

            <button
              onClick={replay.cycleSpeed}
              className="hover:text-[#B8A99A] transition-colors cursor-pointer"
              style={controlStyle}
            >
              {replay.speed === '1x'
                ? replayViewContent.controls.speed1x
                : replay.speed === '2x'
                  ? replayViewContent.controls.speed2x
                  : replay.speed === '4x'
                    ? replayViewContent.controls.speed4x
                    : ''}
            </button>

            <span className="text-[#3D3630] mx-3" style={{ fontSize: '0.65rem' }}>{'\u00b7'}</span>

            <button
              onClick={replay.restart}
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
