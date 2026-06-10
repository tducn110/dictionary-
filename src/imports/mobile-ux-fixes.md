Mobile experience is broken. This is critical — judges will test on phones. Fix all of these. DO NOT change desktop design or typing mechanics.

Writing surface (mobile):

Disable autocorrect/autocapitalize on the hidden textarea. Add these attributes: autocorrect="off" autocapitalize="off" autocomplete="off" spellcheck="false". The keyboard should not try to correct or capitalize — that interferes with the raw typing capture.

Text too small on mobile. The writing surface font size needs a mobile override. At viewport widths below 640px, set the BurstRenderer font-size to 1.1rem minimum. The current clamp is resolving too small on phone screens.

"Finish Letter →" not visible. On mobile, the top-right link is either too small or getting clipped. At <640px: make "Finish Letter" a full-width bar at the top of the screen, padding: 0.75rem 1rem, font-size: 0.85rem, text-align: right. Always visible once user has typed at least one character. Minimum tap target: 44px height.

⌘+Enter hint is wrong on mobile. There's no ⌘ key on a phone. On mobile (detect via 'ontouchstart' in window or viewport width), replace the hint with a visible "Done" button at the bottom center of the screen. Style: Playfair italic, font-size: 0.9rem, padding: 0.75rem 2rem, color: #2C2824, border 1px solid #C4B5A6. Min tap target 44px. This button triggers the same finish action as ⌘+Enter.

Multi-character selection and delete. The hidden textarea approach may not support text selection on mobile. This is a known limitation of the append-only architecture. For now, ensure single-character backspace works reliably on mobile. If beforeinput events with inputType: 'deleteContentBackward' fire, handle them. Also handle deleteWordBackward (iOS swipe-delete) by removing characters until the previous space.
Preview screen (mobile):

"Your Letter" title wraps awkwardly. At narrow widths, it breaks mid-word or creates an orphan. Add white-space: nowrap to the title, or reduce font-size to 1.3rem on mobile so it fits on one line.

Action links too small to tap. "Keep Writing · Watch Replay · Share · Write Another" at 0.75rem with middle dots is untappable on mobile. On <640px: stack them vertically, one per line, font-size: 0.9rem, padding: 0.5rem 0 per link (gives 44px+ tap targets). Remove the middle dot separators on mobile — use vertical spacing instead.

"Share" needs context. Change "Share" to "Copy Link" — makes it clear what tapping it does. On tap, show "Link Copied!" for 2 seconds.

Landing page (mobile):

Footer "the letter only a human could write" not visible on mobile. Ensure it's rendered and not pushed off-screen. Check that min-height: 100vh isn't hiding it below the fold — on mobile, the page should scroll naturally to show all content.

White overflow on scroll. The body/html background color must be set to #F5EDE4 (not just the main container). Add: html, body { background: #F5EDE4; } in the global styles. This prevents white flash on overscroll/bounce.

Global mobile fixes:

All tap targets must be minimum 44x44px. Any clickable text link that's smaller than this on mobile needs extra padding. Use padding: 0.5rem on links at minimum.
Viewport meta tag. Ensure <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"> is set. The user-scalable=no prevents double-tap zoom which interferes with the typing experience.

Add "Made with Figma Make" credit. Put it in the landing page footer, below "the letter only a human could write". Style: Inter, font-size: 0.6rem, color: #C4B5A6, letter-spacing: 0.1em. Small and quiet but present.
