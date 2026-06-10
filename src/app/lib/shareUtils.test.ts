import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Session } from './types';
import { buildShareUrl, decodeSession, encodeSession } from './shareUtils';

const session: Session = {
  startedAt: 123,
  finalText: 'hello, cam xuc',
  events: [
    {
      t: 0,
      type: 'insert',
      char: 'h',
      pos: 0,
      iki: 150,
      burst: 6.67,
      pause: 0,
      confidence: 0.5,
      hesitation: 0,
    },
    {
      t: 180,
      type: 'insert',
      char: 'i',
      pos: 1,
      iki: 180,
      burst: 6.3,
      pause: 0,
      confidence: 0.45,
      hesitation: 0.1,
    },
  ],
};

describe('shareUtils', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('round-trips session data through URL-safe base64', () => {
    const encoded = encodeSession(session);

    expect(encoded).not.toMatch(/[+/=]/);
    expect(decodeSession(encoded)).toEqual(session);
  });

  it('returns null for invalid encoded session data', () => {
    expect(decodeSession('not-valid-json')).toBeNull();
  });

  it('builds replay URLs from the current origin', () => {
    vi.stubGlobal('window', {
      location: {
        origin: 'https://letters.example',
      },
    });

    expect(buildShareUrl(session)).toBe(
      `https://letters.example/replay?d=${encodeSession(session)}`
    );
  });
});
