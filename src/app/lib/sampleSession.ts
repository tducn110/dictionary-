/**
 * Handcrafted sample session for the landing page demo and default replay.
 *
 * IKI values are deliberately EXTREME to produce visible weight contrast
 * even after the burst detector's running-average smoothing:
 *   - Confident bursts: IKI 55-65ms (very fast, produces high confidence)
 *   - Moderate bursts: IKI 140-160ms (average speed)
 *   - Hesitant bursts: IKI 300-350ms (slow, produces low confidence)
 *
 * Pauses between phrases are 2500ms+ so burst boundaries are unambiguous
 * (the PAUSE_THRESHOLD is 800ms).
 *
 * Jitter is deterministic (seeded) so the demo looks identical every load.
 */
import type { Session, TypingEvent } from './types';

// Simple seeded PRNG for deterministic jitter
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildSampleEvents(): TypingEvent[] {
  const events: TypingEvent[] = [];
  let t = 0;
  let pos = 0;
  const rand = mulberry32(42);

  const type = (
    char: string,
    iki: number,
    opts: { confidence?: number; hesitation?: number; pause?: number } = {}
  ) => {
    t += iki;
    const confidence = opts.confidence ?? 0.5;
    const hesitation = opts.hesitation ?? 0.3;
    const pause = opts.pause ?? (iki > 800 ? iki : 0);
    events.push({
      t,
      type: 'insert',
      char,
      pos,
      iki,
      burst: 1000 / iki,
      pause,
      confidence,
      hesitation,
    });
    pos++;
  };

  const del = (iki: number) => {
    t += iki;
    pos--;
    events.push({
      t,
      type: 'delete',
      pos,
      iki,
      burst: 1000 / iki,
      pause: 0,
      confidence: 0.3,
      hesitation: 0.5,
    });
  };

  /**
   * Type a phrase with deterministic jitter.
   * The first character gets the pause IKI if provided.
   */
  const typePhrase = (
    text: string,
    iki: number,
    opts: {
      confidence?: number;
      hesitation?: number;
      pause?: number;
      jitter?: number;
    } = {}
  ) => {
    const jitterAmount = opts.jitter ?? 8;
    for (let i = 0; i < text.length; i++) {
      const j = (rand() - 0.5) * 2 * jitterAmount;
      const charIKI = Math.max(35, Math.round(iki + j));
      const isFirst = i === 0;
      type(text[i], isFirst && opts.pause ? opts.pause : charIKI, {
        confidence: opts.confidence,
        hesitation: opts.hesitation,
        pause: isFirst ? opts.pause : undefined,
      });
    }
  };

  // =========================================================================
  // "Dear you," — FAST and confident. IKI ~58ms. Bold weight.
  // =========================================================================
  typePhrase('Dear you,', 58, {
    confidence: 0.95,
    hesitation: 0.02,
    jitter: 6,
  });

  // =========================================================================
  // Long 2.5s pause — the writer stops to think.
  // " I started this letter three times." — moderate pace, IKI ~150ms
  // =========================================================================
  typePhrase(' I started this letter three times.', 150, {
    confidence: 0.5,
    hesitation: 0.2,
    pause: 2500,
  });

  // =========================================================================
  // 2.5s pause
  // " Each time the words felt " — SLOW, hesitant. IKI ~320ms. Thin weight.
  // =========================================================================
  typePhrase(' Each time the words felt ', 320, {
    confidence: 0.15,
    hesitation: 0.75,
    pause: 2500,
    jitter: 20,
  });

  // =========================================================================
  // "different." — FAST snap decision. IKI ~55ms. Bold weight.
  // No pause before — speed change triggers burst boundary (320 → 55 = 5.8×)
  // =========================================================================
  typePhrase('different.', 55, {
    confidence: 0.92,
    hesitation: 0.03,
    jitter: 5,
  });

  // =========================================================================
  // 3s pause — longest pause so far, real thinking
  // " I wanted to say something honest " — moderate, IKI ~155ms
  // =========================================================================
  typePhrase(' I wanted to say something honest ', 155, {
    confidence: 0.5,
    hesitation: 0.25,
    pause: 3000,
  });

  // =========================================================================
  // "but I kept " — VERY SLOW, struggling. IKI ~340ms. Thin weight.
  // Speed change from 155 → 340 = 2.2× triggers burst boundary.
  // =========================================================================
  typePhrase('but I kept ', 340, {
    confidence: 0.1,
    hesitation: 0.8,
    jitter: 25,
  });

  // =========================================================================
  // First correction: type "rewrit" then delete 6 (ghost traces in replay)
  // =========================================================================
  typePhrase('rewrit', 150, { confidence: 0.35, hesitation: 0.4 });
  for (let i = 0; i < 6; i++) del(60);

  // =========================================================================
  // Second correction: type "changing" then delete 8 (more ghost traces)
  // =========================================================================
  t += 400;
  typePhrase('changing', 140, { confidence: 0.3, hesitation: 0.45 });
  for (let i = 0; i < 8; i++) del(55);

  // =========================================================================
  // Finally: "rewriting it." — moderate resolution
  // =========================================================================
  t += 500;
  typePhrase('rewriting it.', 145, { confidence: 0.45, hesitation: 0.3 });

  // =========================================================================
  // 2.8s pause
  // " Here is what I actually mean: " — building confidence
  // IKI ramps from 180ms down to 70ms across the phrase
  // =========================================================================
  const meanPhrase = ' Here is what I actually mean: ';
  for (let i = 0; i < meanPhrase.length; i++) {
    const progress = i / (meanPhrase.length - 1);
    // Ramp IKI from 180 → 70 (getting faster)
    const iki = Math.round(180 - progress * 110);
    // Ramp confidence from 0.3 → 0.85
    const conf = 0.3 + progress * 0.55;
    const hes = 0.5 - progress * 0.45;
    const isFirst = i === 0;
    type(meanPhrase[i], isFirst ? 2800 : iki, {
      confidence: conf,
      hesitation: hes,
      pause: isFirst ? 2800 : undefined,
    });
  }

  // =========================================================================
  // "you matter to me." — FASTEST burst. IKI ~50ms. Maximum bold.
  // =========================================================================
  typePhrase('you matter to me.', 50, {
    confidence: 0.98,
    hesitation: 0.01,
    jitter: 4,
  });

  // =========================================================================
  // 2.5s pause
  // " I just didn't know how to say it " — SLOW, trailing off. IKI ~300ms.
  // =========================================================================
  typePhrase(" I just didn't know how to say it ", 300, {
    confidence: 0.18,
    hesitation: 0.65,
    pause: 2500,
    jitter: 20,
  });

  // =========================================================================
  // "without it sounding like everything else." — moderate, resigned. IKI ~170ms.
  // Speed change from 300 → 170 = 1.76× (under 2× threshold, stays in same burst
  // unless this phrase gets long enough). That's OK — same emotional register.
  // =========================================================================
  typePhrase('without it sounding like everything else.', 170, {
    confidence: 0.4,
    hesitation: 0.35,
  });

  return events;
}

export function createSampleSession(): Session {
  const events = buildSampleEvents();

  // Compute final text by replaying inserts/deletes
  const buffer: string[] = [];
  for (const event of events) {
    if (event.type === 'insert' && event.char) {
      buffer.push(event.char);
    } else if (event.type === 'delete') {
      buffer.pop();
    }
  }

  return {
    startedAt: Date.now(),
    events,
    finalText: buffer.join(''),
  };
}
