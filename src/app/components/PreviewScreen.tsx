/**
 * PreviewScreen (Letter view): shown after the writer finishes.
 * Displays the completed letter with frozen emotion-encoded typography.
 * No ghost traces. This is the clean emotional artifact.
 *
 * The letter sits directly on the background — no card, no shadow.
 * The typography IS the design.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import type { Session } from '../lib/types';
import type { WritingSurfaceResumeState } from './WritingSurface';
import { BurstRenderer } from './BurstRenderer';
import { buildShareUrl } from '../lib/shareUtils';
import { toast, Toaster } from 'sonner';

type FoiTheme = 'light' | 'dark';

function getIsMobile(): boolean {
  return ('ontouchstart' in window) || window.innerWidth < 640;
}

export function PreviewScreen() {
  const navigate = useNavigate();
  const location = useLocation();

  const session = location.state?.session as Session | undefined;
  const resumeState = location.state?.resumeState as WritingSurfaceResumeState | undefined;
  const theme = (location.state?.theme as FoiTheme) || 'light';
  const isDark = theme === 'dark';

  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(getIsMobile());
    const handleResize = () => setIsMobile(getIsMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const previewBursts = resumeState?.bursts ?? [];
  const shareUrl = useMemo(
    () => (session ? buildShareUrl(session) : ''),
    [session]
  );

  const copyShareLink = useCallback(() => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    });
  }, [shareUrl]);

  const handleKeepWriting = useCallback(() => {
    navigate('/write', { state: { resume: resumeState } });
  }, [navigate, resumeState]);

  const handleWriteAnother = useCallback(() => {
    navigate('/write');
  }, [navigate]);

  const handleReplay = useCallback(() => {
    navigate('/replay', { state: { session } });
  }, [navigate, session]);

  const leftPad = 'max(2rem, 8vw)';

  // Theme colors
  const bg = isDark ? '#1C1915' : '#F5EDE4';
  const labelColor = isDark ? '#F0E8DE' : '#2C2824';
  const actionColor = isDark ? '#A89B8E' : '#8B7E74';
  const actionHover = isDark ? '#F0E8DE' : '#5C524A';
  const dotColor = '#C4B5A6';
  const sentimentColor = isDark ? '#A89B8E' : '#8B7E74';
  const ruleColor = isDark ? '#5C5347' : '#2C2824';

  const actionStyle = {
    background: 'none',
    border: 'none',
    padding: isMobile ? '0.75rem 0' : '0',
    fontFamily: "'Inter', sans-serif",
    fontVariationSettings: "'wght' 400",
    fontSize: isMobile ? '1rem' : '0.75rem',
    letterSpacing: '0.08em',
    color: actionColor,
    minHeight: isMobile ? '44px' : 'auto',
    display: 'flex',
    alignItems: 'center',
  } as const;

  // --- All hooks above this line. Conditional return is safe here. ---

  if (!session || !resumeState) {
    return (
      <div
        className="min-h-screen flex flex-col justify-center"
        style={{ background: '#F5EDE4', paddingLeft: leftPad, paddingRight: leftPad }}
      >
        <p
          style={{
            fontFamily: "'Playfair Display', serif",
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: '1.5rem',
            color: '#8B7E74',
            marginBottom: '2rem',
          }}
        >
          No letter to preview.
        </p>
        <button
          onClick={() => navigate('/write')}
          className="cursor-pointer self-start"
          style={{
            background: 'none',
            border: 'none',
            padding: isMobile ? '0.5rem 0' : 0,
            color: '#2C2824',
            fontFamily: "'Playfair Display', serif",
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: '1rem',
            minHeight: isMobile ? '44px' : 'auto',
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
            Write a Letter {'\u2192'}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: bg, transition: 'background-color 0.3s ease' }}
    >
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: isDark ? '#E5DCD2' : '#2C2824',
            color: isDark ? '#1C1915' : '#F5EDE4',
            border: 'none',
            fontFamily: "'Inter', sans-serif",
          },
        }}
      />

      {/* Letter */}
      <div
        className="relative z-10 flex-1 flex flex-col justify-center"
        style={{
          paddingLeft: leftPad,
          paddingRight: leftPad,
          animation: 'foiEntrance 800ms cubic-bezier(0.25, 0.1, 0.25, 1) both',
        }}
      >
        {/* "Your Letter" — Playfair Display italic, typographic anchor */}
        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: isMobile ? '1.3rem' : '1.8rem',
            color: labelColor,
            letterSpacing: '-0.02em',
            marginBottom: '2rem',
            transition: 'color 0.3s ease',
            whiteSpace: 'nowrap',
          }}
        >
          Your Letter
        </h2>

        {/* The frozen artifact — no card, no wrapper, just typography */}
        <div style={{ maxWidth: '36rem', paddingTop: isMobile ? '1.5rem' : '3rem', paddingBottom: isMobile ? '1.5rem' : '3rem' }}>
          <BurstRenderer
            bursts={previewBursts}
            fontSize={isMobile ? '1.1rem' : 'clamp(1rem, 2vw, 1.25rem)'}
            lineHeight={1.9}
            darkMode={isDark}
          />
        </div>

        {/* Horizontal rule — structural punctuation */}
        <div
          style={{
            width: '2rem',
            height: '1.5px',
            background: ruleColor,
            marginTop: '1rem',
            marginBottom: '2rem',
          }}
        />

        {/* Actions */}
        {isMobile ? (
          /* Mobile: stacked vertically, larger tap targets */
          <div className="flex flex-col items-start">
            <MobileActionLink label="Keep Writing" onClick={handleKeepWriting} style={actionStyle} />
            <MobileActionLink label="Watch Replay" onClick={handleReplay} style={actionStyle} />
            <MobileActionLink label={copied ? 'Link Copied!' : 'Copy Link'} onClick={copyShareLink} style={actionStyle} />
            <MobileActionLink label="Write Another" onClick={handleWriteAnother} style={actionStyle} />
          </div>
        ) : (
          /* Desktop: inline with middle dots */
          <div className="flex flex-wrap items-center">
            <ActionLink label="Keep Writing" onClick={handleKeepWriting} style={actionStyle} hoverColor={actionHover} />
            <Dot color={dotColor} />
            <ActionLink label="Watch Replay" onClick={handleReplay} style={actionStyle} hoverColor={actionHover} />
            <Dot color={dotColor} />
            <ActionLink label={copied ? 'Copied!' : 'Copy Link'} onClick={copyShareLink} style={actionStyle} hoverColor={actionHover} />
            <Dot color={dotColor} />
            <ActionLink label="Write Another" onClick={handleWriteAnother} style={actionStyle} hoverColor={actionHover} />
          </div>
        )}

        {/* Typographic bookend — echoes landing page footer */}
        <p
          style={{
            fontFamily: "'Playfair Display', serif",
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: '0.85rem',
            color: sentimentColor,
            marginTop: '3rem',
            transition: 'color 0.3s ease',
          }}
        >
          a letter only you could have written
        </p>
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
      `}</style>
    </div>
  );
}

/* ---- Helpers ---- */

function ActionLink({
  label,
  onClick,
  style,
  hoverColor,
}: {
  label: string;
  onClick: () => void;
  style: Record<string, string | number>;
  hoverColor: string;
}) {
  return (
    <button
      onClick={onClick}
      className="cursor-pointer"
      style={style}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.color = hoverColor;
        (e.currentTarget as HTMLElement).style.textDecoration = 'underline';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.color = style.color as string;
        (e.currentTarget as HTMLElement).style.textDecoration = 'none';
      }}
    >
      {label}
    </button>
  );
}

function MobileActionLink({
  label,
  onClick,
  style,
}: {
  label: string;
  onClick: () => void;
  style: Record<string, string | number>;
}) {
  return (
    <button
      onClick={onClick}
      className="cursor-pointer"
      style={style}
    >
      {label}
    </button>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span className="mx-3" style={{ fontSize: '0.65rem', color }}>{'\u00b7'}</span>
  );
}