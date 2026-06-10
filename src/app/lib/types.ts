export interface TypingEvent {
  /** Timestamp relative to session start (ms) */
  t: number;
  type: 'insert' | 'delete';
  /** The character inserted (for 'insert' events) */
  char?: string;
  /** Position in the text buffer */
  pos: number;
  /** Inter-key interval in ms */
  iki: number;
  /** Burst velocity: rolling chars/sec (EMA smoothed) */
  burst: number;
  /** Pause duration before this keystroke (ms), 0 if no significant pause */
  pause: number;
  /** Computed confidence 0..1 */
  confidence: number;
  /** Computed hesitation 0..1 */
  hesitation: number;
}

export interface Session {
  startedAt: number;
  events: TypingEvent[];
  finalText: string;
}

/**
 * A typing burst: a group of characters typed at a consistent rhythm.
 * The unit of visual expression — styled uniformly.
 */
export interface Burst {
  id: string;
  /** Characters in this burst */
  chars: string[];
  /** Aggregate confidence (average of constituent keystrokes) */
  confidence: number;
  /** Aggregate hesitation */
  hesitation: number;
  /** Pause duration before this burst started (ms, 0 if none) */
  pauseBefore: number;
  /** IKIs within this burst (for debugging/tuning) */
  ikis: number[];
}

/**
 * A rendered token in the display buffer.
 * Includes both live characters and ghost traces of deleted chars.
 */
export interface DisplayToken {
  id: string;
  char: string;
  confidence: number;
  hesitation: number;
  pause: number;
  isGhost: boolean;
  /** Timestamp when this token was created */
  createdAt: number;
}
