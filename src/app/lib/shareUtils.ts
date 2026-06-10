/**
 * Utilities for encoding/decoding session data for URL sharing.
 */
import type { Session } from './types';

/**
 * Compress a session into a URL-safe base64 string.
 */
export function encodeSession(session: Session): string {
  const json = JSON.stringify(session);
  // Use TextEncoder for proper UTF-8 handling
  const bytes = new TextEncoder().encode(json);
  const binary = Array.from(bytes)
    .map((b) => String.fromCharCode(b))
    .join('');
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Decode a session from a URL-safe base64 string.
 */
export function decodeSession(encoded: string): Session | null {
  try {
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding
    while (base64.length % 4) base64 += '=';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as Session;
  } catch {
    return null;
  }
}

/**
 * Build a shareable replay URL.
 */
export function buildShareUrl(session: Session): string {
  const encoded = encodeSession(session);
  const base = window.location.origin;
  return `${base}/replay?d=${encoded}`;
}
