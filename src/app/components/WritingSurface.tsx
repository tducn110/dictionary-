/**
 * WritingSurface: the core typing experience.
 *
 * Writing = clean artifact. No ghost traces. Deletions just delete.
 * All keystrokes (including deletions) are recorded in session data
 * so replay can show the full emotional archaeology.
 *
 * Characters are grouped into "typing bursts" — runs of keystrokes
 * at consistent rhythm — and each burst is styled uniformly.
 * This produces readable emotional variation without the "ransom note"
 * effect of per-character styling.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { BurstRenderer } from './BurstRenderer';
import { useFoiTheme } from '../hooks/useFoiTheme';
import { useMobileMode } from '../hooks/useMobileMode';
import {
  useWritingSession,
  type WritingSurfaceResumeState,
} from '../hooks/useWritingSession';
import { writingSurfaceContent } from '../content/writingSurfaceContent';
import { appMetaContent } from '../content/appMetaContent';

export type { WritingSurfaceResumeState } from '../hooks/useWritingSession';

export function WritingSurface() {
  const navigate = useNavigate();
  const location = useLocation();

  const resumeState = location.state?.resume as WritingSurfaceResumeState | undefined;

  const [isMac, setIsMac] = useState(true);
  const isMobile = useMobileMode();
  const { theme, isDark, toggleTheme } = useFoiTheme();
  const {
    bursts,
    firstCharAnim,
    clearFirstCharAnim,
    startSession,
    insertChar,
    deleteChar,
    deleteWordBackward,
    createPreviewState,
    createFallbackPreviewState,
  } = useWritingSession(resumeState);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    if (!resumeState) {
      startSession();
    }
    document.title = appMetaContent.title;
    const platform = navigator.platform || navigator.userAgent || '';
    setIsMac(/Mac|iPhone|iPad|iPod/i.test(platform));
  }, [resumeState, startSession]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Backspace') {
        e.preventDefault();
        deleteChar();
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        doFinish();
      } else if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        insertChar('\n');
      } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        insertChar(e.key);
      }
    },
    [insertChar, deleteChar]
  );

  /** Handle beforeinput for mobile — catches soft-keyboard events */
  const handleBeforeInput = useCallback(
    (e: React.FormEvent<HTMLTextAreaElement>) => {
      const ie = e.nativeEvent as InputEvent;
      if (ie.inputType === 'deleteContentBackward') {
        e.preventDefault();
        deleteChar();
      } else if (ie.inputType === 'deleteWordBackward') {
        e.preventDefault();
        deleteWordBackward();
      } else if (ie.inputType === 'insertText' && ie.data) {
        e.preventDefault();
        for (const ch of ie.data) {
          insertChar(ch);
        }
      } else if (ie.inputType === 'insertLineBreak') {
        e.preventDefault();
        insertChar('\n');
      }
    },
    [insertChar, deleteChar, deleteWordBackward]
  );

  const doFinish = useCallback(() => {
    try {
      const previewState = createPreviewState();
      navigate('/preview', { state: { ...previewState, theme } });
    } catch (err) {
      console.error('doFinish error, navigating with minimal state:', err);
      const previewState = createFallbackPreviewState();
      navigate('/preview', {
        state: {
          ...previewState,
          theme,
        },
      });
    }
  }, [createFallbackPreviewState, createPreviewState, navigate, theme]);

  const hasContent = bursts.length > 0;

  // Theme-dependent colors
  const bg = isDark ? '#1C1915' : '#F5EDE4';
  const backColor = isDark ? '#A89B8E' : '#8B7E74';
  const backHover = isDark ? '#F0E8DE' : '#5C524A';
  const hintColor = isDark ? '#A89B8E' : '#A09486';
  const placeholderColor = isDark ? '#7A6E62' : '#A09486';
  const cursorColor = isDark ? '#C4896A' : '#B87A5E';
  const toggleColor = isDark ? '#A89B8E' : '#8B7E74';
  const finishColor = isDark ? '#F0E8DE' : '#2C2824';
  const finishUnderline = isDark ? '#5C5347' : '#C4B5A6';
  const finishUnderlineHover = isDark ? '#F0E8DE' : '#2C2824';
  const dotColor = isDark ? '#5C5347' : '#C4B5A6';
  const doneBorderColor = isDark ? '#8B7E74' : '#8B7E74';

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: bg, transition: 'background-color 0.3s ease' }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Top bar — back left, toggle + finish right */}
      <div className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5 md:px-10 md:py-6">
        {/* Back — top-left */}
        <button
          onClick={(e) => { e.stopPropagation(); navigate('/'); }}
          className="cursor-pointer"
          style={{
            background: 'none',
            border: 'none',
            padding: isMobile ? '0.5rem' : 0,
            fontFamily: "'Inter', sans-serif",
            fontVariationSettings: "'wght' 400",
            fontSize: isMobile ? '0.85rem' : '0.75rem',
            letterSpacing: '0.04em',
            color: backColor,
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = backHover;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = backColor;
          }}
        >
          {writingSurfaceContent.backLabel}
        </button>

        {/* Right side — toggle · finish (desktop) */}
        {!isMobile && (
          <div className="flex items-center">
            <button
              onClick={(e) => { e.stopPropagation(); toggleTheme(); }}
              className="cursor-pointer"
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: toggleColor,
                fontFamily: "'Inter', sans-serif",
                fontVariationSettings: "'wght' 400",
                fontSize: '0.7rem',
                letterSpacing: '0.1em',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.color = finishColor; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.color = toggleColor; }}
            >
              {isDark ? writingSurfaceContent.theme.light : writingSurfaceContent.theme.dark}
            </button>

            {hasContent && (
              <>
                <span className="mx-3" style={{ fontSize: '0.65rem', color: dotColor }}>{'\u00b7'}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); doFinish(); }}
                  className="cursor-pointer"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: finishColor,
                    fontFamily: "'Playfair Display', serif",
                    fontStyle: 'italic',
                    fontWeight: 400,
                    fontSize: '0.85rem',
                  }}
                >
                  <span
                    style={{
                      paddingBottom: '2px',
                      borderBottom: `1px solid ${finishUnderline}`,
                      transition: 'border-color 0.3s ease',
                    }}
                    onMouseEnter={(e) => { (e.target as HTMLElement).style.borderBottomColor = finishUnderlineHover; }}
                    onMouseLeave={(e) => { (e.target as HTMLElement).style.borderBottomColor = finishUnderline; }}
                  >
                    {writingSurfaceContent.finishLabel} {'\u2192'}
                  </span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Mobile: theme toggle only */}
        {isMobile && (
          <button
            onClick={(e) => { e.stopPropagation(); toggleTheme(); }}
            className="cursor-pointer"
            style={{
              background: 'none',
              border: 'none',
              padding: '0.5rem',
              color: toggleColor,
              fontFamily: "'Inter', sans-serif",
              fontVariationSettings: "'wght' 400",
              fontSize: '0.7rem',
              letterSpacing: '0.1em',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {isDark ? writingSurfaceContent.theme.light : writingSurfaceContent.theme.dark}
          </button>
        )}
      </div>

      {/* Mobile: Finish Letter bar — full-width, always visible when content exists */}
      {isMobile && hasContent && (
        <div
          className="relative z-10"
          style={{
            padding: '0 1rem',
            marginBottom: '0.5rem',
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); doFinish(); }}
            className="cursor-pointer w-full"
            style={{
              background: 'none',
              border: 'none',
              padding: '0.75rem 1rem',
              textAlign: 'right',
              color: finishColor,
              fontFamily: "'Playfair Display', serif",
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: '1rem',
              minHeight: '44px',
              display: 'block',
              transition: 'color 0.2s',
            }}
          >
            <span
              style={{
                paddingBottom: '2px',
                borderBottom: `1px solid ${finishUnderline}`,
              }}
            >
              {writingSurfaceContent.finishLabel} {'\u2192'}
            </span>
          </button>
        </div>
      )}

      {/* Writing area — vertically centered, entrance animation */}
      <div
        className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 md:px-12"
        style={{
          animation: 'foiEntrance 800ms cubic-bezier(0.25, 0.1, 0.25, 1) both',
        }}
      >
        <div className="w-full" style={{ maxWidth: '42rem' }}>
          <div
            className="whitespace-pre-wrap break-words"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: isMobile ? '1.15rem' : 'clamp(1rem, 2vw, 1.25rem)',
              lineHeight: 1.8,
            }}
          >
            {bursts.length === 0 && (
              <span
                className="select-none"
                style={{
                  color: placeholderColor,
                  fontFamily: "'Inter', sans-serif",
                  fontVariationSettings: "'wght' 350",
                  fontSize: '1.05rem',
                  transition: 'color 0.3s ease',
                }}
              >
                {writingSurfaceContent.placeholder[0]}{'\n'}{writingSurfaceContent.placeholder[1]}
              </span>
            )}
            {bursts.length === 0 && <br />}
              <span
                style={{
                  display: 'inline',
                  animation: firstCharAnim ? 'foiFirstChar 250ms ease-out both' : 'none',
                }}
                onAnimationEnd={clearFirstCharAnim}
              >
              <BurstRenderer
                bursts={bursts}
                inline
                darkMode={isDark}
                suffix={
                  <span
                    className="inline-block w-[2px] ml-[1px]"
                    style={{
                      height: '1.2em',
                      verticalAlign: 'text-bottom',
                      background: cursorColor,
                      animation: 'foiCursorBlink 1.2s ease-in-out infinite',
                    }}
                  />
                }
              />
            </span>
          </div>
        </div>

        {/* Hidden textarea for keyboard capture */}
        <textarea
          ref={inputRef}
          className="absolute opacity-0 pointer-events-auto"
          style={{ width: '1px', height: '1px', top: 0, left: 0 }}
          onKeyDown={handleKeyDown}
          onBeforeInput={handleBeforeInput}
          autoFocus
          autoCorrect="off"
          autoCapitalize="off"
          autoComplete="off"
          spellCheck={false}
          aria-label={writingSurfaceContent.inputAriaLabel}
        />
      </div>

      {/* Bottom bar */}
      <div className="relative z-10 flex items-end justify-center px-4 pb-4 sm:px-6 sm:pb-6 md:px-10 md:pb-8">
        {isMobile ? (
          /* Mobile: "Done" button instead of keyboard shortcut hint */
          <button
            onClick={(e) => { e.stopPropagation(); doFinish(); }}
            className="cursor-pointer"
            style={{
              background: 'none',
              border: `1px solid ${doneBorderColor}`,
              padding: '0.75rem 2rem',
              fontFamily: "'Playfair Display', serif",
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: '1rem',
              color: finishColor,
              minHeight: '44px',
              transition: 'border-color 0.3s ease, color 0.3s ease',
            }}
          >
            {writingSurfaceContent.doneLabel}
          </button>
        ) : (
          /* Desktop: keyboard shortcut hint */
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontVariationSettings: "'wght' 400",
              fontSize: '0.85rem',
              letterSpacing: '0.1em',
              color: hintColor,
              transition: 'color 0.3s ease',
            }}
          >
            {isMac ? writingSurfaceContent.shortcut.mac : writingSurfaceContent.shortcut.ctrl}
            {writingSurfaceContent.shortcut.suffix}
          </p>
        )}
      </div>

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
        @keyframes foiCursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes foiFirstChar {
          from { transform: scale(1.06); }
          to { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
