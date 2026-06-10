/**
 * Sets favicon, theme-color, and OG meta tags once on first mount.
 * Called from App.tsx so it runs for all routes.
 */
import { useEffect, useRef } from 'react';

const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <text x="6" y="26" font-family="Georgia, 'Times New Roman', serif" font-size="30" font-style="italic" font-weight="400" fill="#2C2824">f</text>
</svg>`;

export function useDocumentHead() {
  const applied = useRef(false);
  useEffect(() => {
    if (applied.current) return;
    applied.current = true;

    document.title = 'Font of Intent';

    // SVG favicon
    let svgLink = document.querySelector<HTMLLinkElement>('link[rel="icon"][type="image/svg+xml"]');
    if (!svgLink) {
      svgLink = document.createElement('link');
      svgLink.rel = 'icon';
      svgLink.type = 'image/svg+xml';
      document.head.appendChild(svgLink);
    }
    svgLink.href = `data:image/svg+xml,${encodeURIComponent(FAVICON_SVG)}`;

    // Theme color
    let themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!themeColor) {
      themeColor = document.createElement('meta');
      themeColor.name = 'theme-color';
      document.head.appendChild(themeColor);
    }
    themeColor.content = '#F5EDE4';

    // Viewport meta — prevent double-tap zoom on mobile
    let viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    viewport.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';

    // OG / social meta
    const metas: Record<string, string> = {
      'og:title': 'Font of Intent',
      'og:description': 'A letter that proves you were here. Not generated. Not autocompleted. Yours.',
      'og:type': 'website',
      'twitter:card': 'summary',
      'twitter:title': 'Font of Intent',
    };

    for (const [key, value] of Object.entries(metas)) {
      const attr = key.startsWith('og:') ? 'property' : 'name';
      let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.content = value;
    }
  }, []);
}