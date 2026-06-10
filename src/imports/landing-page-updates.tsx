
Final delight pass + bug fix + favicon. Keep everything that's working. DO NOT change layout, typography choices, or typing mechanics.

Bug fix:

Share URL "too long" error fires on short letters. Remove the 2000-character URL length check entirely. The session data for even a short letter exceeds 2000 chars because each keystroke event stores multiple properties. Modern browsers support URLs up to 64KB+. Just encode the session and copy the URL. Remove the length check and the "Letter too long to share via link" toast.

Favicon:

Add a favicon. Create a simple SVG favicon — a single italic lowercase letter "f" in Playfair Display style (or approximate with an SVG path). The "f" should be warm dark brown #2C2824 on a transparent background. Set it as both <link rel="icon" type="image/svg+xml"> and include a fallback <link rel="icon" type="image/png">. Also set <meta name="theme-color" content="#F5EDE4"> so the browser tab/address bar picks up the warm cream. Update the <title> to "Font of Intent" on all routes if not already done.

Micro-animations for delight:

Page entrance animation. On the landing page, wrap the main content (everything below the header) in a container that fades in on mount: opacity 0 → 1 over 800ms, with transform: translateY(12px) → translateY(0). Use CSS @keyframes and apply via a class. Ease: cubic-bezier(0.25, 0.1, 0.25, 1). Apply the same entrance to the writing surface content and the preview page content — every view should feel like it arrives gently, not like it slams in.

Demo cursor pulse during pauses. In the landing page demo, when the replay hits a long pause (800ms+), the cursor should shift from its normal blink to a slower, warmer pulse: box-shadow: 0 0 6px rgba(184, 122, 94, 0.35) pulsing in and out over 2s with ease-in-out. When typing resumes, switch back to normal blink. This makes the demo feel alive — like someone breathing between thoughts.
CTA arrow nudge after demo completes. When the landing page demo finishes playing the full sample letter, animate the → in "Write Your Letter →": shift it 4px to the right over 600ms, then back to original position. Play once. CSS @keyframes with animation-iteration-count: 1 and a 500ms delay after demo completion. A gentle "your turn" gesture.

First character entrance on writing surface. When the user types their first character and the placeholder disappears, that first character should appear with a subtle scale animation: start at scale(1.06), ease down to scale(1) over 250ms. Only the first character, only once. Marks the transition from blank page to "you're writing now."

Demo card hover lift. On the landing page, when hovering the demo card, transition to box-shadow: 0 2px 16px rgba(44, 40, 36, 0.06) over 300ms. Subtle lift that signals the content is alive. transition: box-shadow 300ms ease.

Open Graph / social meta:

Add OG tags for link sharing. When someone shares the URL on social media, it should look good:
<meta property="og:title" content="Font of Intent">
<meta property="og:description" content="A letter that proves you were here. Not generated. Not autocompleted. Yours.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://server-hash-83347939.figma.site">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="Font of Intent">
