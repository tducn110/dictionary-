/**
 * BurstRenderer: renders typing bursts with uniform emotion-encoded styling.
 *
 * Each burst is a <span> wrapping its characters, styled with:
 * - font weight (confidence)
 * - color/opacity (hesitation)
 * - margin-left spacing (pauses between bursts)
 *
 * This replaces per-character rendering, fixing the "ransom note" problem
 * and dramatically reducing DOM element count.
 */
import type { ReactNode } from 'react';
import type { Burst } from '../lib/types';
import { getBurstStyle } from '../lib/fontMapper';

interface BurstRendererProps {
  bursts: Burst[];
  fontSize?: string;
  /** Optional line height override */
  lineHeight?: number;
  /** Optional element (e.g. cursor) rendered inline after the last burst */
  suffix?: ReactNode;
  /**
   * When true, renders burst spans and suffix as a bare fragment (no wrapper div).
   * Use this when the parent already provides the text-flow container.
   */
  inline?: boolean;
  /** When true, renders with dark-mode color mapping */
  darkMode?: boolean;
}

export function BurstRenderer({ bursts, fontSize, lineHeight, suffix, inline, darkMode = false }: BurstRendererProps) {
  const content = (
    <>
      {bursts.map((burst) => (
        <BurstSpan key={burst.id} burst={burst} darkMode={darkMode} />
      ))}
      {suffix}
    </>
  );

  if (inline) {
    return content;
  }

  return (
    <div
      className="whitespace-pre-wrap break-words"
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: fontSize || 'clamp(1rem, 2vw, 1.25rem)',
        lineHeight: lineHeight ?? 1.8,
      }}
    >
      {content}
    </div>
  );
}

function BurstSpan({ burst, darkMode }: { burst: Burst; darkMode: boolean }) {
  const style = getBurstStyle(burst.confidence, burst.hesitation, burst.pauseBefore, darkMode);

  // Render chars, converting \n to <br>
  const fragments: (string | JSX.Element)[] = [];
  let textRun = '';

  for (let i = 0; i < burst.chars.length; i++) {
    const ch = burst.chars[i];
    if (ch === '\n') {
      if (textRun) {
        fragments.push(textRun);
        textRun = '';
      }
      fragments.push(<br key={`br-${i}`} />);
    } else {
      textRun += ch;
    }
  }
  if (textRun) {
    fragments.push(textRun);
  }

  return (
    <span style={style}>
      {fragments}
    </span>
  );
}